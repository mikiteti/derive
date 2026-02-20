import { findXIndicesInLine, getVisualLineAt } from "../../assets.js";
import { Position } from "../../doc/classes.js";
import newClipboard from "../../doc/clipboard.js";

const createCommandSet = (editor) => {
    let parsePosition = (pos) => { return new Position(pos, editor.doc, { track: false }) };
    const doc = editor.doc, render = editor.render, caret = editor.input.caret, snippets = editor.input.snippets, history = editor.doc.history;
    const keyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ1234567890_";
    const blank = " ";
    let lastInlineFind;
    const registers = window.state.registers;
    const caretStyles = {
        "n": "wide",
        "v": "wide",
        "vLine": "wide",
        "i": "bar",
        "R": "underline",
    };
    const array = (func) => {
        return (...args) => ([func(...args)])
    }
    const min = (...funcs) => {
        return (...args) => (Math.min(...funcs.map(func => func(...args))));
    }
    const dispatch = (commands) => {
        for (let c of commands) functions[c[0]](...c.slice(1));
    }

    const findStartOfWORD = (pos, count = 1) => {
        const getType = (char) => {
            return blank.includes(char) ? 0 : 1;
        }

        let textBefore = pos.Line.text.slice(0, pos.index - pos.Line.from);
        let c = 0, prevType = getType(doc.charAt(pos.index)); // 0: blank, 1: key/other
        for (let i = textBefore.length - 1; i >= 0; i--) {
            let char = textBefore[i];
            let curType = getType(char);
            if (curType !== prevType && prevType !== 0) c++;
            prevType = curType;
            if (c >= count) return pos.Line.from + i + 1;
        }

        let curType = 0; // count start of line as blank space
        if (curType !== prevType && prevType !== 0) c++;
        if (c >= count) return pos.Line.from;

        return findStartOfWord(parsePosition(pos.Line.from - 1), count - c);
    }

    const findEndOfWORD = (pos, count = 1) => {
        const getType = (char) => {
            return blank.includes(char) ? 0 : 1;
        }

        let textAfter = pos.Line.text.slice(pos.index - pos.Line.from);
        let c = 0, prevType = getType(doc.charAt(pos.index)); // 0: blank, 1: key, 2: other
        for (let i = 0; i < textAfter.length; i++) {
            let char = textAfter[i];
            let curType = getType(char);
            if (curType !== prevType && prevType !== 0) c++;
            prevType = curType;
            if (c >= count) return pos.index + i - 1;
        }

        let curType = 0; // count end of line as blank space
        if (curType !== prevType && prevType !== 0) c++;
        if (c >= count) return pos.Line.to - 1;

        return findEndOfWord(parsePosition(pos.Line.to + 1), count - c);
    }

    const findStartOfWord = (pos, count = 1) => {
        const getType = (char) => {
            return keyChars.includes(char) ? 1 : (blank.includes(char) ? 0 : 2);
        }

        let textBefore = pos.Line.text.slice(0, pos.index - pos.Line.from);
        let c = 0, prevType = getType(doc.charAt(pos.index)); // 0: blank, 1: key, 2: other
        for (let i = textBefore.length - 1; i >= 0; i--) {
            let char = textBefore[i];
            let curType = getType(char);
            if (curType !== prevType && prevType !== 0) c++;
            prevType = curType;
            if (c >= count) return pos.Line.from + i + 1;
        }

        let curType = 0; // count start of line as blank space
        if (curType !== prevType && prevType !== 0) c++;
        if (c >= count) return pos.Line.from;

        return findStartOfWord(parsePosition(pos.Line.from - 1), count - c);
    }

    const findEndOfWord = (pos, count = 1) => {
        const getType = (char) => {
            return keyChars.includes(char) ? 1 : (blank.includes(char) ? 0 : 2);
        }

        let textAfter = pos.Line.text.slice(pos.index - pos.Line.from);
        let c = 0, prevType = getType(doc.charAt(pos.index)); // 0: blank, 1: key, 2: other
        for (let i = 0; i < textAfter.length; i++) {
            let char = textAfter[i];
            let curType = getType(char);
            if (curType !== prevType && prevType !== 0) c++;
            prevType = curType;
            if (c >= count) return pos.index + i - 1;
        }

        let curType = 0; // count end of line as blank space
        if (curType !== prevType && prevType !== 0) c++;
        if (c >= count) return pos.Line.to - 1;

        return findEndOfWord(parsePosition(pos.Line.to + 1), count - c);
    }

    const find = (pos, command) => {
        let textAfter, index, textBefore;
        switch (command[0]) {
            case "f":
                textAfter = pos.Line.text.slice(pos.index - pos.Line.from + 1);
                index = textAfter.indexOf(command[1]);
                if (index === -1) return pos.index;
                return pos.index + index + 1;
            case "t":
                textAfter = pos.Line.text.slice(pos.index - pos.Line.from + 2);
                index = textAfter.indexOf(command[1]);
                if (index === -1) return pos.index;
                return pos.index + index + 1;
            case "F":
                textBefore = pos.Line.text.slice(0, pos.index - pos.Line.from);
                index = textBefore.lastIndexOf(command[1]);
                if (index === -1) return pos.index;
                return pos.Line.from + index;
            case "T":
                textBefore = pos.Line.text.slice(0, pos.index - pos.Line.from - 1);
                index = textBefore.lastIndexOf(command[1]);
                if (index === -1) return pos.index;
                return pos.Line.from + index + 1;
        }
    }

    const findNextVisualLine = (pos, count = 1) => {
        if (!pos.caret) return pos.index;
        let indices = findXIndicesInLine(pos.caret.screenPosition.x, pos.Line);
        if (caret.style !== "bar" && indices.at(-1) === pos.Line.to && pos.Line.chars > 1) indices[indices.length - 1]--;
        let bestBet = indices[0];
        while (indices.length && indices[0] <= pos.index) {
            indices.shift();
            if (indices.length) bestBet = indices[0];
        }
        if (indices.length >= count) return indices[count - 1];
        // console.log("not in currentline, bestbet", bestBet);
        count -= indices.length;
        // console.log(count);

        let number = pos.Line.number;
        while (count > 0) {
            number++;
            let nextLine = editor.doc.line(number);
            if (!nextLine || number >= editor.doc.lines) return bestBet;
            indices = findXIndicesInLine(pos.caret.screenPosition.x, nextLine);
            if (caret.style !== "bar" && indices.at(-1) === nextLine.to && nextLine.chars > 1) indices[indices.length - 1]--;
            if (indices.length >= count) return indices[count - 1];
            count -= indices.length;
            bestBet = indices.at(-1);
        }
        return bestBet;
    }

    const findPreviousVisualLine = (pos, count = 1) => {
        if (!pos.caret) return pos.index;
        let indices = findXIndicesInLine(pos.caret.screenPosition.x, pos.Line);
        if (caret.style !== "bar" && indices.at(-1) === pos.Line.to && pos.Line.chars > 1) indices[indices.length - 1]--;
        let bestBet = indices[0];
        while (indices.length && indices.at(-1) >= pos.index) {
            indices.pop();
            if (indices.length) bestBet = indices.at(-1);
        }
        if (indices.length >= count) return indices[indices.length - count];
        // console.log("not in currentline, bestbet", bestBet);
        count -= indices.length;
        // console.log(count);

        let number = pos.Line.number;
        while (count > 0) {
            number--;
            let prevLine = editor.doc.line(number);
            if (!prevLine || number < 0) return bestBet;
            indices = findXIndicesInLine(pos.caret.screenPosition.x, prevLine);
            if (caret.style !== "bar" && indices.at(-1) === prevLine.to && prevLine.chars > 1) indices[indices.length - 1]--;
            if (indices.length >= count) return indices[indices.length - count];
            count -= indices.length;
            bestBet = indices[0];
        }
        return bestBet;
    }

    const findBrackets = (pos, bracket, includeBrackets = false) => {
        let pairs = ["{}", "()", "[]", "''", '""', "``", "<>"];
        if (bracket == undefined) return pos.index;
        let pair = pairs.find(e => e.includes(bracket));
        if (pair == undefined) return pos.index;
        let open = pair[0], close = pair[1];
        let text = pos.Line.text, col = pos.column;
        let index = text.slice(0, col + 1).includes(open) ? text.slice(0, col + 1).lastIndexOf(open) : text.indexOf(open);
        if (index == -1) return pos.index;
        let start = index;
        let count = 1;
        while (count > 0 && index < text.length) {
            let nextOpen = text.indexOf(open, index + 1), nextClose = text.indexOf(close, index + 1);
            if (nextOpen == -1 && nextClose == -1) return pos.index;
            let next = nextOpen == -1 ? nextClose : (nextClose == -1 ? nextOpen : Math.min(nextClose, nextOpen));
            count += next == nextClose ? -1 : +1;
            index = next;
        }
        let end = index;

        return [pos.Line.from + start + (includeBrackets ? 0 : 1), pos.Line.from + end + (includeBrackets ? 0 : -1)];
    }

    const moves = {
        "iden": (pos) => pos.index,
        "safety": (pos) => Math.min(pos.index, pos.Line.to - (caret.style === "bar" || pos.Line.chars === 1 ? 0 : 1)),

        // motions
        "h": (count = 1) => (pos => Math.max(pos.index - count, pos.Line.from)),
        "l": (count = 1) => (pos => Math.min(pos.index + count, pos.Line.to - 1)),
        "h!": (count = 1) => (pos => pos.index - count),
        "l!": (count = 1) => (pos => pos.index + count),
        "b": (count = 1) => (pos => { return findStartOfWord(parsePosition(pos.index - 1), count) }),
        "w": (count = 1) => (pos => { return findStartOfWord(parsePosition(findEndOfWord(pos, (blank.includes(doc.charAt(pos.index)) ? 0 : 1) + count)), 1) }),
        "e": (count = 1) => (pos => { return findEndOfWord(parsePosition(pos.index + 1), count) }),
        "B": (count = 1) => (pos => { return findStartOfWORD(parsePosition(pos.index - 1), count) }),
        "W": (count = 1) => (pos => { return findStartOfWORD(parsePosition(findEndOfWORD(pos, (blank.includes(doc.charAt(pos.index)) ? 0 : 1) + count)), 1) }),
        "E": (count = 1) => (pos => { return findEndOfWORD(parsePosition(pos.index + 1), count) }),
        // "j": (count = 1) => (pos => {
        //     let line = doc.line(pos.Line.number + count);
        //     return Math.min(line.from + pos.index - pos.Line.from, line.to - 1);
        // }),
        // "k": (count = 1) => moves["j"](-count),
        "j": (count = 1) => (pos => { return curMode === "vLine" ? doc.line(pos.Line.number + count).to : findNextVisualLine(pos, count) }),
        "k": (count = 1) => (pos => { return curMode === "vLine" ? doc.line(pos.Line.number - count).from : findPreviousVisualLine(pos, count) }),
        "$": (pos) => pos.Line.to - 1,
        "0": (pos) => pos.Line.from,
        "_": (pos) => pos.Line.from,
        "G": (pos) => doc.chars - 2,
        "gg": (pos) => 0,
        // ...

        // text objects
        "iw": (pos) => [findStartOfWord(pos), findEndOfWord(pos)],
        "aw": (pos) => [findStartOfWord(pos), findStartOfWord(parsePosition(findEndOfWord(pos, 2)))],
        "iW": (pos) => [findStartOfWORD(pos), findEndOfWORD(pos)],
        "aw": (pos) => [findStartOfWORD(pos), findStartOfWORD(parsePosition(findEndOfWORD(pos, 2)))],
        // ...

        // helpers
        "fixedEnd": (pos) => pos.caret?.fixedEnd?.index,
        "position": (pos) => pos.index,
        "vLine": (pos) => {
            let pair = pos.caret.fixedEnd;
            if (pair == undefined) return [pos.Line.from, Math.min(pos.Line.to, doc.chars - 2)];
            if (pair.index < pos.index) return [pair.Line.from, Math.min(pos.Line.to, doc.chars - 2)];
            return [Math.min(pair.Line.to, doc.chars - 2), pos.Line.from];
        }
        // ...
    }

    const functions = {
        mode: (m) => {
            // console.log(`setting MODE to ${m}`);
            curMode = m;
            curCommand = [];
            let keep = -1;
            if (m === "n" || m === "i") keep = false;
            caret.changeStyle(caretStyles[m], { keepFixedEnd: keep });
        },
        insert: (text, { noCallback = false, preserveDM = true } = {}) => {
            // console.log(`inserting ${text} at caret position(s)`)
            for (let sc of caret.carets) {
                sc.fixedEnd ?
                    doc.change.replace(text, sc.position.index, sc.fixedEnd.index, { noCallback: true, preserveDM }) :
                    doc.change.insert(text, sc.position.index, { noCallback: true, preserveDM });
            }
            if (!noCallback) doc.change.runCallbacks();
        },
        delete: (getFrom, getTo, regName = "") => {
            // console.log(`deleting from ${getFrom} to ${getTo}`)
            functions["yank"](getFrom, getTo, regName, false);
            if (regName == "") {
                for (let i = 9; i > 1; i--) registers[i].copy(undefined, undefined, { clipboard: registers[i - 1] });
                registers["1"].copy(undefined, undefined, { clipboard: registers[""] });
            }
            caret.changeForAll(sc => {
                let from = getFrom(sc.position), to = getTo(sc.position);
                return { from: Math.min(from, to), to: Math.max(from, to) + 1 }; // inclusive change
            });
        },
        replace: (getFrom, getTo, text) => {
            // console.log(`replacing between ${getFrom} and ${getTo} to ${text}`);
            caret.changeForAll(sc => {
                let from = getFrom(sc.position), to = getTo(sc.position);
                return { from: Math.min(from, to), to: Math.max(from, to) + 1, insert: text }; // inclusive change
            });
        },
        change: (getFrom, getTo, text = "", regName = "") => {
            functions["yank"](getFrom, getTo, regName, false);
            if (regName == "") {
                for (let i = 9; i > 1; i--) registers[i].copy(undefined, undefined, { clipboard: registers[i - 1] });
                registers["1"].copy(undefined, undefined, { clipboard: registers[""] });
            }
            functions["replace"](getFrom, getTo, text);
            functions["mode"]("i");
        },
        yank: (getFrom, getTo, regName = "", writeTo0 = true) => {
            functions["writeReg"](regName, { from: getFrom(caret.carets[0].position), to: getTo(caret.carets[0].position) });
            if (regName == "" && writeTo0) registers["0"].copy(undefined, undefined, { clipboard: registers[""] });
        },
        move: (getNewPos, { updateScreenX = true } = {}) => {
            // console.log(`moving carets with the rule ${getNewPos}, ${updateScreenX}`)
            for (let sc of caret.carets) {
                let newPos = getNewPos(sc.position);
                // if (caret.style !== "bar" && doc.lineAt(newPos).to === newPos) newPos--;

                if (!Array.isArray(newPos)) sc.placeAt(newPos, { keepFixedEnd: (["v", "vLine"].includes(curMode)), updateScreenX }); // curMode check is experimental
                else if (newPos.length === 1) sc.placeAt(newPos[0], { keepFixedEnd: true, updateScreenX });
                else {
                    sc.removeFixedEnd();
                    sc.addFixedEnd(newPos[0]);
                    sc.placeAt(newPos[1], { keepFixedEnd: true, updateScreenX });
                }
            }
        }, // if getNewPos returns one int, don't keep fixed end, if it returns [int], keep it, if it returns [int, int] set first int to fixedEnd, second to position
        removeCarets: () => {
            caret.updateCarets([caret.carets[0].position.index]);
            snippets.deleteTabStops();
        },
        runSnippets: () => {
            let jump;
            // if (doc.change.callbackList.changedLines.size === 1) jump = snippets.multiHandle(caret.carets.map(e => e.position));
            jump = snippets.multiHandle(caret.carets.map(e => e.position));
            doc.change.runCallbacks();
            // if (jump) snippets.jumpToNextTabStops();

            let lines = new Set(caret.carets.map(e => e.position.Line));
            for (let line of lines) snippets.features.autoEnlarge(line);

            if (jump) snippets.jumpToNextTabStops(); // experimental (was above autoEnlarge)
        },
        backspace: () => {
            caret.changeForAll(sc => {
                if (sc.fixedEnd == undefined && // if at opening bracket and corresponding closing bracket is just after, delete that too
                    "([{".includes(doc.charAt(sc.position.index - 1))) {
                    let closing = { "(": ")", "[": "]", "{": "}" }[doc.charAt(sc.position.index - 1)];
                    for (let i = sc.position.index; i < sc.position.Line.to; i++) {
                        let curChar = doc.charAt(i);
                        if (curChar === closing) return { from: sc.position.index - 1, to: i + 1 };
                        if (curChar === " ") continue;
                        break;
                    }
                }

                if (sc.fixedEnd) return { from: sc.position.index, to: sc.fixedEnd.index };
                return { from: sc.position.index - 1, to: sc.position.index };
            });
        },
        undo: () => {
            doc.history.undo();
        },
        redo: () => {
            doc.history.redo();
        },
        writeReg: (regName, { text, from = caret.carets[0].from, to = caret.carets[0].to } = {}) => {
            if (text != undefined) registers[regName.toLowerCase()].copy(
                undefined,
                undefined,
                (regName == regName.toLowerCase() ? "" : registers[regName].content.text) + text
            );

            else if (from != undefined && to != undefined) {
                regName == regName.toLowerCase()
                    ? registers[regName].copy(Math.min(from, to), Math.max(from, to) + 1)
                    : registers[regName.toLowerCase()].append(Math.min(from, to), Math.max(from, to) + 1);
            }

            // console.log("yanked", registers[regName.toLowerCase()].content, `to ${regName || '""'}`, { text, from, to });
        },
        pasteReg: async (getAt, regName = "", { belowIfLine = true } = {}) => {
            history.newChangeGroup();
            for (let sc of caret.carets) {
                let index = getAt(sc.position);
                await registers[regName].update();
                if (registers[regName].content.text.at(-1) == "\n") {
                    let line = doc.lineAt(index);
                    index = belowIfLine ? line.to + 1 : line.from;
                }
                registers[regName].paste(index);
                let caretPos = index + Math.max(registers[regName].content.text.length - 1, 0);
                queueMicrotask(() => { sc.placeAt(caretPos) })
            }
            queueMicrotask(() => { history.newChangeGroup() });
        },
        replaceToReg: (getFrom, getTo, regName = "") => {
            let from = getFrom(caret.carets[0].position), to = getTo(caret.carets[0].position);
            registers["|"].copy(Math.min(from, to), Math.max(from, to) + 1);
            for (let sc of caret.carets) {
                let from = getFrom(sc.position), to = getTo(sc.position);
                registers[regName].paste(undefined, registers[regName].content, { from: Math.min(from, to), to: Math.max(from, to) + 1 });
            }
            if (registers["|"].content?.text?.length > 0) registers[regName].copy(undefined, undefined, { clipboard: registers["|"] });
        }
    };

    const insert = {
        name: "root",
        next: [
            {
                name: "Escape",
                keys: ["Escape", "\\Cc"],
                run: (keys) => {
                    functions.mode("n");
                },
            },
            {
                name: "arrows",
                keys: ["ArrowLeft", "ArrowRight", "\\MArrowLeft", "\\MArrowRight", "\\AArrowLeft", "\\AArrowRight"],
                run: (keys) => {
                    dispatch({
                        "ArrowLeft": [["move", moves["h!"](1)]],
                        "ArrowRight": [["move", moves["l!"](1)]],
                        "\\AArrowLeft": [["move", moves["B"](1)]],
                        "\\AArrowRight": [["move", moves["E"](1)], ["move", moves["l!"](1)]],
                        "\\MArrowLeft": [["move", moves["0"]]],
                        "\\MArrowRight": [["move", moves["$"]], ["move", moves["l!"](1)]],
                    }[keys[0]]);
                },
            },
            {
                name: "backspace",
                keys: ["Backspace", "\\SBackspace", "\\ABackspace", "\\MBackspace"],
                run: (keys) => {
                    dispatch({
                        "Backspace": [["backspace"]],
                        "\\SBackspace": [["delete", moves["iden"], moves["iden"]]],
                        "\\ABackspace": [["delete", moves["B"](1), moves["h"](1)]],
                        "\\MBackspace": [["delete", moves["0"], moves["h"](1)]],
                    }[keys[0]]);
                },
            },
            {
                name: "insert Enter",
                keys: ["Enter"],
                run: (keys) => {
                    // console.log("inserting Enter");
                    functions.insert("\n");
                }
            },
            {
                name: "insert char",
                keys: "any",
                run: (keys) => {
                    dispatch([["insert", keys[0]], ["runSnippets"]]);
                },
            },
        ]
    };

    const motions = [
        { // countable basic movements
            name: "countable basic movements",
            count: true,
            keys: ["h", "j", "k", "l", "w", "e", "b", "W", "E", "B", "{", "}"], // technically G should be here
            run: (keys, { count = 1 } = {}) => {
                dispatch([["move", moves[keys[0]](count)]]);
            },
        },
        { // uncountable basic movements
            name: "uncountable basic movements",
            keys: ["0", "$", "_", "^", "%"], // not here
            run: (keys) => {
                dispatch([["move", moves[keys[0]]]]);
            },
        },
        {
            count: true,
            name: "G",
            keys: ["G"],
            run: (keys, { count } = {}) => {
                if (count == undefined) dispatch([["move", moves["G"]]]);
                else dispatch([["move", pos => {
                    let line = doc.line(count - 1);
                    return line.from + Math.min(pos.column, Math.max(line.chars - 2, 0));
                }]]);
            }
        },
        { // g moves
            name: "g moves",
            count: true,
            keys: ["g"],
            next: [
                {
                    count: true,
                    name: "certain g move",
                    keys: ["g", "j", "k", "e", "E", "_"],
                    run: (keys, { count = 1 } = {}) => {
                        switch (keys[0]) {
                            case "g":
                                dispatch([["move", pos => {
                                    let line = doc.line(count - 1);
                                    return line.from + Math.min(pos.column, Math.max(line.chars - 2, 0));
                                }]]);
                                break;
                            case "j":
                                dispatch([["move", pos => {
                                    let line = doc.line(pos.Line.number + count);
                                    return line.from + Math.min(pos.column, Math.max(line.chars - 2, 0));
                                }]]);
                                break;
                            case "k":
                                dispatch([["move", pos => {
                                    let line = doc.line(pos.Line.number - count);
                                    return line.from + Math.min(pos.column, Math.max(line.chars - 2, 0));
                                }]]);
                                break;
                        }
                    },
                },
                {
                    count: true,
                    name: "gJ",
                    keys: ["J"],
                    run: (keys, { count = 1 } = {}) => {
                        console.log("running J");
                        dispatch([["replace", pos => pos.Line.to, pos => pos.Line.to, ""]]);
                    },
                },
            ],
            run: (keys, { nexts, count = 1 } = {}) => {
                runNext(keys, nexts, { count });
            },
        },
        { // find
            name: "find",
            count: true,
            keys: ["f", "t", "F", "T"],
            next: [
                {
                    name: "find this",
                    keys: "any",
                    run: (keys, { method } = {}) => {
                        console.log(`running ${method}${keys[0]}`);
                        lastInlineFind = method + keys[0];
                        dispatch([["move", (pos) => { return find(pos, lastInlineFind) }]]);
                    },
                },
            ],
            run: (keys, { nexts } = {}) => {
                console.log("running", keys[0]);
                runNext(keys, nexts, { method: keys[0] });
            }
        },
        { // repeat find
            name: "repeat find",
            count: true,
            keys: [";", ","],
            run: (keys) => {
                if (lastInlineFind == undefined) return;
                if (keys[0] === ";") {
                    dispatch([["move", (pos) => { return find(pos, lastInlineFind) }]]);
                    return;
                }

                let reverse = { "f": "F", "F": "f", "t": "T", "T": "t" };
                let reverseFind = reverse[lastInlineFind[0]] + lastInlineFind[1];
                dispatch([["move", (pos) => { return find(pos, reverseFind) }]]);
            },
        },
    ];

    const textObjects = [
        { // text objects
            name: "first half of text objects (i/a)",
            keys: ["i", "a"],
            next: [
                {
                    name: "second half of text objects",
                    keys: ["w", "W", "s", "p", "b", "B", "t", "'", '"', "`", "{", "}", "(", ")", "[", "]", "<", ">"],
                    run: (keys, { method } = {}) => {
                        let modeChanges = keys.at(-1) == "p" ? [["mode", "vLine"]] : [];
                        let move = {
                            "iw": (pos) => [findStartOfWord(pos), findEndOfWord(pos)],
                            "aw": (pos) => [findStartOfWord(pos), findStartOfWord(parsePosition(findEndOfWord(pos, 2))) - 1],
                            "iW": (pos) => [findStartOfWORD(pos), findEndOfWORD(pos)],
                            "aW": (pos) => [findStartOfWORD(pos), findStartOfWORD(parsePosition(findEndOfWORD(pos, 2))) - 1],
                            "ip": (pos) => [
                                (() => {
                                    if (pos.Line.text.trim() === "") return pos.index;
                                    for (let n = pos.Line.number; n >= 0; n--) if (doc.line(n).text.trim() === "") return doc.line(n + 1).from;
                                    return 0;
                                })(),
                                (() => {
                                    if (pos.Line.text.trim() === "") return pos.index;
                                    for (let n = pos.Line.number; n < doc.lines; n++) if (doc.line(n).text.trim() === "") return doc.line(n - 1).to - 1;
                                    return doc.chars - 1;
                                })()
                            ],
                        }[method + keys[0]];
                        if (move == undefined) {
                            let bracket = keys[0];
                            if ("bBt".includes(bracket)) bracket = ({ "b": "[", "B": "{", "t": "<" })[bracket];
                            move = (pos) => findBrackets(pos, bracket, method == "a");
                        }

                        dispatch([["move", move], ...modeChanges]);
                    },
                },
            ],
            run: (keys, { nexts } = {}) => {
                return runNext(keys, nexts, { method: keys[0] })
            }
        },
    ]

    const motionsAfterHeadcommands = [
        { // countable basic movements
            name: "countable basic movements",
            count: true,
            keys: ["h", "j", "k", "l", "w", "e", "b", "W", "E", "B", "{", "}"], // technically G should be here
            run: (keys, { count = 1 } = {}) => {
                dispatch([["move", array(moves[keys[0]](count))]]);
            },
        },
        { // uncountable basic movements
            name: "uncountable basic movements",
            keys: ["0", "$", "_", "^", "%", "G"], // not here
            run: (keys) => {
                dispatch([["move", array(moves[keys[0]])]]);
            },
        },
        { // g moves
            name: "g moves",
            count: true,
            keys: ["g"],
            next: [
                {
                    name: "certain g move",
                    keys: ["g", "j", "k", "e", "E", "_"],
                    run: (keys) => 0,
                },
                {
                    count: true,
                    name: "gJ",
                    keys: ["J"],
                    run: (keys, { count = 1 } = {}) => {
                        console.log("running J");
                        dispatch([["replace", pos => pos.Line.to, pos => pos.Line.to + 1, ""]]);
                    },
                },
            ]
        },
        { // find
            name: "find",
            count: true,
            keys: ["f", "t", "F", "T"],
            next: [
                {
                    name: "find this",
                    keys: "any",
                    run: (keys, { method } = {}) => {
                        console.log(`running ${method}${keys[0]}`);
                        lastInlineFind = method + keys[0];
                        dispatch([["move", (pos) => { return [find(pos, lastInlineFind)] }]]);
                    },
                },
            ],
            run: (keys, { nexts } = {}) => {
                console.log("running", keys[0]);
                runNext(keys, nexts, { method: keys[0] });
            }
        },
        { // repeat find
            name: "repeat find",
            count: true,
            keys: [";", ","],
            run: (keys) => {
                if (lastInlineFind == undefined) return;
                if (keys[0] === ";") {
                    dispatch([["move", (pos) => { return [find(pos, lastInlineFind)] }]]);
                    return;
                }

                let reverse = { "f": "F", "F": "f", "t": "T", "T": "t" };
                let reverseFind = reverse[lastInlineFind[0]] + lastInlineFind[1];
                dispatch([["move", (pos) => { return [find(pos, reverseFind)] }]]);
            },
        },
    ];

    const runNext = (keys, nexts, context = {}) => {
        let slice = (!Number.isNaN(parseInt(keys[0])) && parseInt(keys[0]) > 0) ? 2 : 1;
        if (nexts[0].next) context = { nexts: nexts.slice(1), ...context }
        if (nexts[0].count && !Number.isNaN(parseInt(keys[slice]))) {
            context = { count: parseInt(keys[slice]), ...context };
            slice++;
        }
        if (nexts[0].run) return nexts[0].run(keys.slice(slice), context, keys);
        if (nexts.length == 0) return;
        return runNext(keys, nexts.slice(1), context);
    }

    const headCommands = [
        { // dd
            name: "d",
            count: true,
            keys: ["d"],
            next: [
                {
                    name: "dd",
                    keys: ["d"],
                    run: (keys, { register = "" } = {}) => { dispatch([["delete", pos => pos.Line.from, pos => pos.Line.to, register]]); },
                }
            ],
        },
        { // cc
            name: "c",
            count: true,
            keys: ["c"],
            next: [
                {
                    name: "cc",
                    keys: ["c"],
                    run: (keys, { register = "" } = {}) => { dispatch([["change", pos => pos.Line.from, pos => Math.max(pos.Line.to - 1, pos.Line.from), "", register]]); },
                }
            ]
        },
        { // yy
            name: "y",
            count: true,
            keys: ["y"],
            next: [
                {
                    name: "yy",
                    keys: ["y"],
                    run: (keys, { register = "" } = {}) => { dispatch([["yank", pos => pos.Line.from, pos => pos.Line.to, register]]) },
                }
            ]
        },
        { // headcommands
            name: "headcommands",
            keys: ["d", "c", "y"],
            next: [
                ...textObjects,
                ...motionsAfterHeadcommands,
                ...motions, // fallback
            ],
            run: (keys, { nexts, register = "" } = {}) => {
                // console.log(`running headcommand ${keys[0]}`);
                runNext(keys, nexts);
                dispatch({
                    "d": [["delete", moves["iden"], moves["fixedEnd"], register]],
                    "c": [["change", moves["iden"], moves["fixedEnd"], "", register]],
                    "y": [["yank", moves["iden"], moves["fixedEnd"], register]],
                }[keys[0]]);
            }
        },
        { // capital headcommands
            name: "capital headcommands",
            count: true,
            keys: ["D", "C", "Y"],
            run: (keys, { register = "" } = {}) => {
                dispatch({
                    "D": [["delete", moves["iden"], moves["$"], register]],
                    "C": [["change", moves["iden"], moves["$"], "", register]],
                    "Y": [["yank", moves["iden"], moves["$"], register]],
                }[keys[0]]);
            },
        },
        { // x, X
            name: "x, X",
            count: true,
            keys: ["x", "X"],
            run: (keys, { count = 1, register = "" } = {}) => {
                dispatch({
                    "x": [["delete", min(moves["iden"], moves["$"]), min(moves["l"](count - 1), moves["$"]), register]],
                    "X": [["delete", moves["h"](count), moves["h"](1), register]],
                }[keys[0]]);
            },
        },
    ];

    const normal = {
        name: "root",
        next: [
            { // mode changes
                name: "mode changes",
                keys: ["i", "a", "I", "A", "v", "V", "o", "O"],
                run: (keys) => {
                    (({
                        "i": () => { dispatch([["mode", "i"]]) },
                        "a": () => { dispatch([["mode", "i"], ["move", (pos) => (pos.Line.chars - pos.column === 1 ? pos.index : pos.index + 1)]]) },
                        "I": () => { dispatch([["mode", "i"], ["move", moves["_"]]]) },
                        "A": () => { dispatch([["mode", "i"], ["move", moves["$"]], ["move", moves["l!"](1)]]) },
                        "v": () => { dispatch([["mode", "v"]]) },
                        "V": () => { dispatch([["mode", "vLine"]]) },
                        "o": () => { dispatch([["move", moves["$"]], ["move", moves["l!"](1)], ["insert", "\n", { preserveDM: false }], ["mode", "i"]]) },
                        "O": () => { dispatch([["move", moves["_"]], ["insert", "\n"], ["move", moves["h!"](1)], ["mode", "i"]]) },
                    })[keys[0]] || (() => 0))();
                },
            },
            {
                name: "remove carets",
                keys: ["Escape"],
                run: (keys) => {
                    functions.removeCarets();
                }
            },
            {
                count: true,
                name: "undo",
                keys: ["u"],
                run: (keys, { count = 1 } = {}) => {
                    for (let i = 0; i < count; i++) functions.undo();
                }
            },
            {
                count: true,
                name: "redo",
                keys: ["\\Cr"],
                run: (keys, { count = 1 } = {}) => {
                    for (let i = 0; i < count; i++) functions.redo();
                }
            },
            {
                count: true,
                name: "add carets",
                keys: ["ArrowDown", "ArrowUp"],
                run: (keys, { count = 1 } = {}) => {
                    let indices;
                    switch (keys[0]) {
                        case "ArrowDown":
                            for (let i = 0; i < count; i++) {
                                indices = caret.carets.map(e => e.position.index + e.position.Line.chars).filter(e => e <= doc.chars);
                                caret.addCaret(Math.max(...indices));
                            }
                            break;
                        case "ArrowUp":
                            for (let i = 0; i < count; i++) {
                                indices = caret.carets
                                    .filter(e => e.position.Line.number > 0)
                                    .map(e => doc.line(e.position.Line.number - 1).from + e.position.column)
                                caret.addCaret(Math.min(...indices));
                            }
                            break;
                    }
                }
            },
            ...motions,
            { // repeat last command
                name: "repeat last command",
                count: true,
                keys: ["."],
                run: (keys) => 0,
            },
            { // paste
                name: "paste",
                count: true,
                keys: ["p"],
                run: (keys) => { dispatch([["pasteReg", pos => Math.min(pos.index + 1, pos.Line.to)], ["mode", "n"]]) },
            },
            { // Paste
                name: "Paste",
                count: true,
                keys: ["P"],
                run: (keys) => { dispatch([["pasteReg", pos => Math.min(pos.index, pos.Line.to), "", { belowIfLine: false }], ["mode", "n"]]) },
            },
            { // position cursor
                name: "position cursor on screen",
                keys: ["z"],
                next: [
                    {
                        name: "position cursor here on screen",
                        keys: ["z", "t", "b"],
                        run: (keys) => 0,
                    },
                ]
            },
            { // move screen
                name: "move screen",
                keys: ["\\Ce", "\\Cy", "\\Cb", "\\Cf", "\\Cd", "\\Cu"],
                run: (keys) => 0,
            },
            {
                name: "indent",
                count: true,
                keys: ["<", ">"],
                run: (keys, { count = 1 } = {}) => {
                    for (let sc of caret.carets) {
                        let line = sc.position.Line
                        line.setTabs("full", line.tabs.full + count * (keys[0] === ">" ? 1 : -1));
                        render.renderLine(line);
                    }
                }
            },
            ...headCommands,
            {
                name: "to clipboard",
                keys: [" "],
                next: [
                    ...headCommands,
                    { // paste
                        name: "paste",
                        count: true,
                        keys: ["p"],
                        run: (keys, { register = "" } = {}) => { dispatch([["pasteReg", pos => Math.min(pos.index + 1, pos.Line.to), register], ["mode", "n"]]) },
                    },
                    { // Paste
                        name: "Paste",
                        count: true,
                        keys: ["P"],
                        run: (keys, { register = "" } = {}) => { dispatch([["pasteReg", pos => Math.min(pos.index, pos.Line.to), register, { belowIfLine: false }], ["mode", "n"]]) },
                    },
                ],
                run: (keys, { nexts, count = 1 } = {}) => {
                    runNext(keys, nexts, { count, register: "+" });
                }
            },
            {
                name: "register",
                keys: ['"'],
                next: [
                    {
                        name: "register name",
                        keys: ["any"],
                        next: [
                            ...headCommands,
                            { // paste
                                name: "paste",
                                count: true,
                                keys: ["p"],
                                run: (keys, { register = "" } = {}) => { dispatch([["pasteReg", pos => Math.min(pos.index + 1, pos.Line.to), register], ["mode", "n"]]) },
                            },
                            { // Paste
                                name: "Paste",
                                count: true,
                                keys: ["P"],
                                run: (keys, { register = "" } = {}) => { dispatch([["pasteReg", pos => Math.min(pos.index, pos.Line.to), register, { belowIfLine: false }], ["mode", "n"]]) },
                            },
                        ],
                        run: (keys, { nexts } = {}) => {
                            console.log(keys);
                            runNext(keys, nexts, { register: keys[0] });
                        },
                    }
                ]
            },
            { // g actions
                name: "g actions",
                count: true,
                keys: ["g"],
                next: [
                    {
                        name: "certain g action",
                        count: true,
                        keys: ["~", "u", "U"],
                        next: [
                            ...motionsAfterHeadcommands,
                        ]
                    },
                ]
            },
            { // join
                name: "join lines",
                count: true,
                keys: ["J"],
                run: (keys, { count = 1 } = {}) => {
                    dispatch(new Array(count).fill(["replace", pos => pos.Line.to, pos => pos.Line.to, " "]));
                },
            },
            {
                name: "replace",
                count: true,
                keys: ["r"],
                next: [
                    {
                        name: "replace this",
                        keys: "any",
                        run: (keys) => {
                            dispatch([["replace", moves["iden"], moves["l"](0), keys[0]]]);
                        },
                    },
                ]
            },
        ]
    };

    const visualHeadcommands = [
        {
            name: "visual headcommands",
            keys: ["d", "x", "c", "y", "~", "u", "U"],
            run: (keys, { register = "" } = {}) => {
                // console.log(`running ${keys[0]} in visual mode`);
                dispatch({
                    "d": [["delete", moves["iden"], moves["fixedEnd"], register], ["mode", "n"]],
                    "x": [["delete", moves["iden"], moves["fixedEnd"], register], ["mode", "n"]],
                    "c": curMode === "vLine"
                        ? [["change", pos => Math.min(pos.index, pos.caret.fixedEnd.index), pos => {
                            let eol = [pos.Line.number, pos.caret.fixedEnd.Line.number].includes(doc.lines - 1) ? 0 : -1;
                            return Math.max(pos.index, pos.caret.fixedEnd.index) + eol;
                        }, "", register], ["mode", "i"]] // in vLine mode, c should leave a blank line
                        : [["change", moves["iden"], moves["fixedEnd"], "", register], ["mode", "i"]],
                    "y": [["yank", moves["iden"], moves["fixedEnd"], register], ["mode", "n"]],
                }[keys[0]]);
            }
        },
    ];

    const visual = {
        name: "root",
        next: [
            {
                name: "Mode changes",
                keys: ["Escape", "\\Cc", "v", "V"],
                run: (keys) => {
                    switch (keys[0]) {
                        case "Escape":
                        case "\\Cc":
                            dispatch([["mode", "n"]]);
                            break;
                        case "V":
                            dispatch([["mode", "vLine"]]);
                            break;
                        case "v":
                            dispatch([["mode", "v"]]);
                            break;
                    }
                }
            },
            {
                count: true,
                name: "undo",
                keys: ["u"],
                run: (keys, { count = 1 } = {}) => {
                    for (let i = 0; i < count; i++) functions.undo();
                }
            },
            {
                count: true,
                name: "redo",
                keys: ["\\Cr", "U"],
                run: (keys, { count = 1 } = {}) => {
                    for (let i = 0; i < count; i++) functions.redo();
                }
            },
            { // paste
                name: "paste",
                count: true,
                keys: ["p"],
                run: (keys) => { dispatch([["replaceToReg", moves["iden"], moves["fixedEnd"]], ["mode", "n"]]) },
            },
            ...motions,
            ...textObjects,
            ...visualHeadcommands,
            {
                name: "to clipboard",
                keys: [" "],
                next: [
                    ...visualHeadcommands,
                ],
                run: (keys, { nexts, count = 1 } = {}) => {
                    keys[0] = "+";
                    runNext(keys, nexts, { count });
                }
            },
            {
                name: "register",
                keys: ['"'],
                next: [
                    {
                        name: "register name",
                        keys: ["any"],
                        next: [
                            ...visualHeadcommands,
                        ],
                        run: (keys, { nexts, count = 1 } = {}) => {
                            runNext(keys, nexts, { count, register: keys[0] });
                        },
                    }
                ]
            },
            {
                name: "indent",
                count: true,
                keys: ["<", ">"],
                run: (keys, { count = 1 } = {}) => {
                    for (let sc of caret.carets) {
                        let line1 = sc.position.Line, line2 = sc.fixedEnd.Line;
                        if (line1.number > line2.number) [line1, line2] = [line2, line1];
                        let lines;
                        if (line1 === line2) lines = [line1];
                        else lines = [line1, ...doc.linesBetween(line1.number, line2.number), line2];
                        for (let line of lines) {
                            line.setTabs("full", line.tabs.full + count * (keys[0] === ">" ? 1 : -1));
                            render.renderLine(line);
                        }
                    }
                }
            },
            {
                name: "switch selection ends",
                keys: ["o"],
                run: (keys) => {
                    for (let sc of caret.carets) sc.switchEnds();
                },
            }
        ]
    }


    let curCommand = [], curMode = "n";
    const parse = (command = curCommand, mode = curMode) => {
        let currentBranches = [{ node: { "n": normal, "i": insert, "v": visual, "vLine": visual }[mode], trace: [] }], nextBranches, keyCount = 0;
        if (currentBranches[0].node == undefined) {
            console.error("unknown mode");
            return 1;
        }

        for (let key of command) {
            keyCount++;

            nextBranches = [];
            for (let branch of currentBranches) {
                let nexts = branch.node.next;
                if (branch.onlyCountable) nexts = nexts.filter(e => e.count);
                let correctNexts = nexts.filter(e => (e.keys.includes(key) || key.length === 1 && e.keys == "any"));
                for (let next of correctNexts) {
                    nextBranches.push({ node: next, trace: [...branch.trace, next] });
                }

                if (!Number.isNaN(parseInt(key)) && nexts.find(e => e.count) !== undefined) nextBranches.push({ ...branch, onlyCountable: true });
            }

            if (nextBranches.length === 0) {
                // no match: abort
                return 0;
            }

            for (let branch of nextBranches) {
                // console.log("checking if branch", (branch.node.name || "no name"), "has a command to run");
                if (branch.node.next == undefined && branch.node.run !== undefined && (branch.node.keys.includes(key) || key.length === 1 && branch.node.keys == "any")) {
                    // console.log(branch);
                    let outerMostRun = branch.trace.find(e => e.run);
                    if (outerMostRun == undefined) {
                        console.error("compromised command tree: no outermost run found for", command);
                        return 1;
                    }
                    let index = branch.trace.indexOf(outerMostRun);
                    // console.log("will run", outerMostRun, "with", command.slice(0, keyCount).slice(index), branch.trace.slice(index + 1).map(e => e.run));
                    let count;
                    if (outerMostRun.count && !Number.isNaN(parseInt(command[index]))) {
                        count = parseInt(command[index]);
                        index++;
                    }

                    return () => {
                        if (curMode === "n") history.newChangeGroup();
                        if (count) outerMostRun.run(command.slice(0, keyCount).slice(index), { nexts: branch.trace.slice(index), count });
                        else outerMostRun.run(command.slice(0, keyCount).slice(index), { nexts: branch.trace.slice(index + 1) });
                        if (curMode === "n") dispatch([["move", moves["safety"]]]);
                        else if (curMode === "vLine") dispatch([["move", moves["vLine"]]]);
                    };
                }
            }

            currentBranches = nextBranches;
        }
    }

    queueMicrotask(() => {
        functions.mode("n");
    });
    Object.defineProperty(editor.input.keyboard, "curMode", {
        get() { return curMode; }
    });
    Object.defineProperty(editor.input.keyboard, "curCommand", {
        get() { return curCommand.join(""); }
    });


    return (e) => {
        if (e.key.length !== 1 && !["Tab", "Escape", "Backspace", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            return;
        }

        let key = (e.metaKey ? "\\M" : "")
            + (e.altKey ? "\\A" : "")
            + (e.ctrlKey ? "\\C" : "")
            + (e.shiftKey && (e.key.length !== 1 || e.metaKey || e.altKey || e.ctrlKey) ? "\\S" : "")
            + e.key;
        if (!Number.isNaN(parseInt(curCommand.at(-1))) && parseInt(curCommand.at(-1)) !== 0 && !Number.isNaN(parseInt(key))) curCommand[curCommand.length - 1] = curCommand.at(-1) + key;
        else curCommand.push(key);

        if (curMode === "n" && caret.carets[0].fixedEnd) curMode = "v";
        let parsed = parse();
        switch (parsed) {
            case undefined:
                // console.log("no command found for", curCommand);
                break;
            case 0:
                // console.log("%caborting command for", "color: red; font-weight: bold", curCommand);
                curCommand = [];
                break;
            default:
                // console.log("%ccommand found for", "color: green; font-weight: bold", curCommand);
                curCommand = [];
                render.renderInfo();
                return parsed;
        }
        render.renderInfo();
    };
}

export { createCommandSet };
