import { Position } from "../../doc/classes.js";

const getFeatures = (editor, {
    autoFractionExcludedEnvs = [["^{", "}"], ["\\text{", "}"]],
    autoFractionBrakingChars = "=,	+-",
    autoEnlargeTriggers = "sum, int, frac, prod, bigcup, bigcap",
    // wordDelimiters = "., +-\n	:;!?\/{}[]()=~$",
    closeBracket = { "(": ")", "{": "}", "[": "]" },
    openBracket = { ")": "(", "}": "{", "]": "[" },
    brackets = { "(": ")", "[": "]", "\\{": "\\}", "\\langle": "\\rangle", "\\lvert": "\\rvert", "\\lVert": "\\rVert", "\\lceil": "\\rceil", "\\lfloor": "\\rfloor" },
} = {}) => {
    const findMatchingBracket = (text, index, open, close) => { // if open is given, search is always forwards
        if (open && text.slice(index, index + open.length) !== open) return;
        if (open && close == undefined || close && open == undefined) return;

        let bracket = open || text[index];
        let pair = close || closeBracket[bracket] || openBracket[bracket], counter = 1;
        if (pair == undefined) return; // char not bracket

        let [from, to, inc] = (open || closeBracket[bracket]) ? [index + 1, text.length - 1, 1] : [index - 1, 0, -1];
        for (let i = from; i * inc <= to; i += inc) {
            if (text.slice(i, i + bracket.length) === bracket) counter++;
            else if (text.slice(i, i + pair.length) === pair) counter--;
            if (counter === 0) return i;
        }
        return;
    }

    const isInEnv = (pos, env = ["^{", "}"]) => {
        let open = env[0].slice(-1), close = env[1];
        if (closeBracket[open] == undefined || closeBracket[open] !== close) return;
        let text = pos.Line.text, textBefore = text.slice(0, pos.index - pos.Line.from), textAfter = text.slice(pos.index - pos.Line.from);
        if (textBefore.lastIndexOf(env[0]) === -1) return;
        let openCol = textBefore.lastIndexOf(env[0]) + env[0].length - 1,
            closeCol = findMatchingBracket(text, openCol);

        return (openCol <= pos.index - pos.Line.from && closeCol >= pos.index - pos.Line.from);
    }

    const autoEnlarge = (Line) => {
        if (!Line.decos.has("display-math")) return [];

        const left = "\\left", right = "\\right";
        let inserts = { left: [], right: [] };
        let text = Line.text;
        for (let i = 0; i < text.length; i++) {
            let open;
            for (let br in brackets) {
                if (text.slice(i, i + br.length) === br) {
                    open = br;
                    break;
                }
            }

            if (open == undefined) continue;
            let close = brackets[open];
            let j = findMatchingBracket(text, i, open, close);
            if (j === undefined) continue;
            if (text.slice(i - left.length, i) === left && text.slice(j - right.length, j) === right) continue;
            let content = text.slice(i + 1, j);
            let shouldEnlarge = autoEnlargeTriggers.split(", ").map(e => content.indexOf("\\" + e) > -1).filter(e => e).length > 0;

            if (!shouldEnlarge) {
                i = j;
                continue;
            }

            inserts.left.push(new Position(Line.from + i, editor.doc));
            inserts.right.push(new Position(Line.from + j, editor.doc));
        }

        let changedLines = new Set(); // bit overwritten... changedlines will always be [Line]... anyway...
        for (let pos of inserts.left) for (let line of editor.doc.change.insert(left, pos, { stickLeft: true })) changedLines.add(line);
        for (let pos of inserts.right) for (let line of editor.doc.change.insert(right, pos, { stickLeft: true })) changedLines.add(line);
        for (let pos of inserts.left.concat(inserts.right)) pos.delete();

        return changedLines;
    }

    const autoFraction = (pos) => {
        if (!pos.Line.decos.has("display-math")) return;
        if (editor.doc.charAt(pos.index - 1) !== "/") return;
        if (editor.doc.charAt(pos.index - 2) === "/") return;
        for (let env of autoFractionExcludedEnvs) if (isInEnv(pos, env)) return;
        let line = pos.Line, text = line.text;

        let closeBrackets = ["}", "]", ")"];
        let start;
        for (let i = pos.index - line.from - 1; i >= 0; i--) {
            console.log({ i });
            let char = text[i];
            for (let closeBracket of closeBrackets) {
                if (char === closeBracket) {
                    let possibleStart = findMatchingBracket(text, i);
                    console.log({ possibleStart });
                    if (possibleStart !== undefined) i = possibleStart;
                    if (possibleStart === 0) start = 0;
                }
            }

            if (" {[(".concat(autoFractionBrakingChars).includes(char)) {
                console.log("breaking char:", char);
                start = i + 1;
                break;
            }

            if (i === 0) {
                start = i;
                break;
            }
        }

        console.log(start, text.slice(start, pos.index - line.from - 1));
        if (start === undefined) return;
        if (start === pos.index - line.from - 1) return;
        editor.doc.change.noCallback({ insert: "\\frac{", at: line.from + start });
        editor.doc.change.noCallback({ insert: "}{", from: pos.index - 1, to: pos.index });
    }

    return { autoEnlarge, autoFraction, isInEnv, findMatchingBracket };
}

export default getFeatures;
