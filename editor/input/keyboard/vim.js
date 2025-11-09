import { findXIndecesInLine, getVisualLineAt } from "../../assets.js";
import { Position } from "../../doc/classes.js";

const createCommandSet = (editor) => {
    let parsePosition = (pos) => { return new Position(pos, editor.doc, { track: false }) };
    let currentEvent;
    const doc = editor.doc, render = editor.render, caret = editor.input.caret, snippets = editor.input.snippets;
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':\",./<>?`~";
    const digits = "0123456789";
    const keyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ1234567890_";
    const blank = " ";
    let lastInlineFind;
    const caretStyles = {
        "n": "wide",
        "v": "wide",
        "i": "bar",
        "R": "underline",
    };
    const headCommands = { "c": "change", "d": "delete" };
    const array = (func) => {
        return (...args) => ([func(...args)])
    }

    const findStartOfWORD = (pos, count = 1) => { // TODO: implement count
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

    const findEndOfWORD = (pos, count = 1) => { // TODO: implement count
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
        let indeces = findXIndecesInLine(pos.caret.screenPosition.x, pos.Line);
        let bestBet = indeces[0];
        while (indeces.length && indeces[0] <= pos.index) {
            indeces.shift();
            if (indeces.length) bestBet = indeces[0];
        }
        if (indeces.length >= count) return indeces[count - 1];
        console.log("not in currentline, bestbet", bestBet);
        count -= indeces.length;
        console.log(count);

        let number = pos.Line.number;
        while (count > 0) {
            number++;
            let nextLine = editor.doc.line(number);
            if (!nextLine || number >= editor.doc.lines) return bestBet;
            indeces = findXIndecesInLine(pos.caret.screenPosition.x, nextLine);
            if (indeces.length >= count) return indeces[count - 1];
            count -= indeces.length;
            bestBet = indeces.at(-1);
        }
        return bestBet;
    }

    const findPreviousVisualLine = (pos, count = 1) => {
        if (!pos.caret) return pos.index;
        let indeces = findXIndecesInLine(pos.caret.screenPosition.x, pos.Line);
        let bestBet = indeces[0];
        while (indeces.length && indeces.at(-1) >= pos.index) {
            indeces.pop();
            if (indeces.length) bestBet = indeces.at(-1);
        }
        if (indeces.length >= count) return indeces[indeces.length - count];
        console.log("not in currentline, bestbet", bestBet);
        count -= indeces.length;
        console.log(count);

        let number = pos.Line.number;
        while (count > 0) {
            number--;
            let prevLine = editor.doc.line(number);
            if (!prevLine || number < 0) return bestBet;
            indeces = findXIndecesInLine(pos.caret.screenPosition.x, prevLine);
            if (indeces.length >= count) return indeces[indeces.length - count];
            count -= indeces.length;
            bestBet = indeces[0];
        }
        return bestBet;
    }

    let MODE = "n"; // MODE = "n"|"v"|"i"
    let currentCommand = "", lastPressed = "";
    const moves = {
        "iden": (pos) => pos.index,

        // motions
        "h": (count = 1) => (pos => Math.max(pos.index - count, pos.Line.from)),
        "l": (count = 1) => (pos => Math.min(pos.index + count, pos.Line.to - 1)),
        "h!": (count = 1) => (pos => pos.index - count),
        "l!": (count = 1) => (pos => pos.index + count),
        "b": (count = 1) => (pos => { return findStartOfWord(parsePosition(pos.index - 1), count) }),
        "w": (count = 1) => (pos => { return findStartOfWord(parsePosition(findEndOfWord(pos, (blank.includes(doc.charAt(pos.index)) ? 0 : 1) + count)), 1) }), // TODO: obviously
        "e": (count = 1) => (pos => { return findEndOfWord(parsePosition(pos.index + 1), count) }),
        "B": (count = 1) => (pos => { return findStartOfWORD(parsePosition(pos.index - 1), count) }),
        "W": (count = 1) => (pos => { return findStartOfWORD(parsePosition(findEndOfWORD(pos, (blank.includes(doc.charAt(pos.index)) ? 0 : 1) + count)), 1) }), // TODO: obviously
        "E": (count = 1) => (pos => { return findEndOfWORD(parsePosition(pos.index + 1), count) }),
        // "j": (count = 1) => (pos => {
        //     let line = doc.line(pos.Line.number + count);
        //     return Math.min(line.from + pos.index - pos.Line.from, line.to - 1);
        // }),
        // "k": (count = 1) => moves["j"](-count),
        "j": (count = 1) => (pos => { return findNextVisualLine(pos, count) }),
        "k": (count = 1) => (pos => { return findPreviousVisualLine(pos, count) }),
        "$": (pos) => pos.Line.to - 1,
        "0": (pos) => pos.Line.from,
        "_": (pos) => pos.Line.from,
        // ...

        // text objects
        "iw": (pos) => [findStartOfWord(pos), findEndOfWord(pos)],
        "iW": (pos) => [findStartOfWORD(pos), findEndOfWORD(pos)],
        // ...

        // helpers
        "fixedEnd": (pos) => pos.caret?.fixedEnd?.index,
        "position": (pos) => pos.index,
        // ...
    }

    const functions = {
        mode: (m) => {
            console.log(`setting MODE to ${m}`);
            MODE = m;
            currentCommand = "";
            let keep = -1;
            if (m === "n" || m === "i") keep = false;
            caret.changeStyle(caretStyles[m], { keepFixedEnd: keep });
        },
        insert: (text, { noCallback = false } = {}) => {
            console.log(`inserting ${text} at caret position(s)`)
            for (let sc of caret.carets) {
                sc.fixedEnd ?
                    doc.change.replace(text, sc.position.index, sc.fixedEnd.index, { noCallback: true }) :
                    doc.change.insert(text, sc.position.index, { noCallback: true });
            }
            if (!noCallback) doc.change.runCallbacks();
        },
        delete: (getFrom, getTo) => {
            console.log(`deleting from ${getFrom} to ${getTo}`)
            caret.changeForAll(sc => {
                let from = getFrom(sc.position), to = getTo(sc.position);
                return { from: Math.min(from, to), to: Math.max(from, to) + 1 }; // inclusive change
            });
        },
        replace: (getFrom, getTo, text) => {
            console.log(`replacing between ${getFrom} and ${getTo} to ${text}`);
            caret.changeForAll(sc => {
                let from = getFrom(sc.position), to = getTo(sc.position);
                return { from: Math.min(from, to), to: Math.max(from, to) + 1, insert: text }; // inclusive change
            });
        },
        change: (getFrom, getTo, text = "") => {
            functions["replace"](getFrom, getTo, text);
            functions["mode"]("i");
        },
        move: (getNewPos, { updateScreenX = true } = {}) => {
            console.log(`moving carets with the rule ${getNewPos}, ${updateScreenX}`)
            for (let sc of caret.carets) {
                let newPos = getNewPos(sc.position);
                if (!Array.isArray(newPos)) sc.placeAt(newPos, { updateScreenX });
                else if (newPos.length === 1) sc.placeAt(newPos[0], { keepFixedEnd: true, updateScreenX });
                else {
                    sc.removeFixedEnd();
                    sc.addFixedEnd(newPos[0]);
                    sc.placeAt(newPos[1], { keepFixedEnd: true, updateScreenX });
                }
            }
        }, // if getNewPos returns one int, don't keep fixed end, if it returns [int], keep it, if it returns [int, int] set first int to fixedEnd, second to position
        removeCarets: () => { console.log("removing unnecessary carets"); },
        runSnippets: () => {
            console.log("running snippets");
            let jump;
            if (doc.change.callbackList.changedLines.size === 1) jump = snippets.multiHandle(caret.carets.map(e => e.position));
            doc.change.runCallbacks();
            if (jump) snippets.jumpToNextTabStops();

            let lines = new Set(caret.carets.map(e => e.position.Line));
            for (let line of lines) snippets.features.autoEnlarge(line);
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
        }
    };

    const parseCommand = (command) => { // command ~ "viW"
        console.log(`Parsing current command`);
        let headCommand;
        if (MODE === "n" && headCommands[command[0]] && command[0] !== command[1]) { // so that "d2e" and "diw" work
            headCommand = headCommands[command[0]];
            console.log("We have a headcommand!");
            command = command.slice(1);
        }

        let count = 0;
        while (["n", "v"].includes(MODE) && !Number.isNaN(parseInt(command[0])) && (count > 0 || parseInt(command[0]) > 0)) {
            count = count * 10 + parseInt(command[0]);
            command = command.slice(1);
        }
        if (count === 0) count = 1;
        console.log({ count });

        const iActions = {
            "ArrowLeft": [["move", moves["h"](1)]],
            "ArrowRight": [["move", moves["l!"](1)]],
            "\\AArrowLeft": [["move", moves["B"](1)]],
            "\\AArrowRight": [["move", moves["E"](1)], ["move", moves["l"](1)]],
            "\\MArrowLeft": [["move", moves["0"]]],
            "\\MArrowRight": [["move", moves["$"]], ["move", moves["l"](1)]],
            // ...

            "Backspace": [["backspace"]],
            "\\SBackspace": [["delete", moves["iden"], moves["iden"]]],
            "\\ABackspace": [["delete", moves["b"](1), moves["h"](1)]],
            "\\MBackspace": [["delete", moves["0"], moves["h"](1)]],

            "Enter": [["insert", "\n"]],
        }

        if (MODE === "i") {
            if (caret.carets[0].fixedEnd && lastPressed === "Backspace") [["backspace"]];
            // in insert mode, we can 
            // switch modes, 
            // insert some char from the abc or Enter,
            // or move the caret like a regular keyboard
            if (lastPressed === "Escape" || lastPressed === "\\Cc") return [["mode", "n"], ["move", moves["h"](1)]];
            if (abc.includes(command)) return [["insert", command, { noCallback: true }], ["runSnippets"]];
            if (iActions[command]) return iActions[command];
            return [];
        }

        const nMoves = { // one-character movements
            // motions
            "h": moves["h"](count),
            "l": moves["l"](count),
            "h!": moves["h!"](count),
            "l!": moves["l!"](count),
            "e": moves["e"](count),
            "b": moves["b"](count),
            "w": moves["w"](count),
            "B": moves["B"](count),
            "E": moves["E"](count),
            "W": moves["W"](count),
            "j": moves["j"](count),
            "k": moves["k"](count),
            "$": moves["$"],
            "0": moves["0"],
            "_": moves["_"],
            // ...
        }

        const textObjects = { // text objects that can be used with a headcommand, like delete or change
            // text objects
            "iw": moves["iw"],
            "aw": moves["aw"],
            "iW": moves["iW"],
            "aW": moves["aW"],
            "ip": moves["ip"],
            "ap": moves["ap"],
            "i(": moves["i("],
            "i)": moves["i("],
            // ...
        }

        const nActions = { // complex actions, like mode changes and line openings
            "i": [["mode", "i"]],
            "a": [["mode", "i"], ["move", moves["l!"](1)]],
            "I": [["mode", "i"], ["move", moves["_"]]],
            "A": [["mode", "i"], ["move", moves["$"]], ["move", moves["l!"](1)]],
            "v": [["mode", "v"]],
            "V": [["mode", "v"], ["move", (pos) => ([moves["0"](pos), moves["$"](pos)])]],
            "Escape": [["removeCarets"]],
            "o": [["move", moves["$"]], ["move", moves["l!"](1)], ["insert", "\n"], ["mode", "i"]],
            "O": [["move", nMoves["_"]], ["insert", "\n"], ["move", nMoves["h!"]], ["mode", "i"]],
            ";": [["move", (pos) => {
                if (lastInlineFind == undefined) return pos.index;
                return find(pos, lastInlineFind);
            }]],
            ",": [["move", (pos) => {
                if (lastInlineFind == undefined) return pos.index;
                let reverse = { "f": "F", "F": "f", "t": "T", "T": "t" };
                let reverseFind = reverse[lastInlineFind[0]] + lastInlineFind[1];
                return find(pos, reverseFind);
            }]],
            "X": [["delete", moves["h"](1), moves["h"](1)]],
            "x": [["delete", moves["iden"], moves["iden"]]],
            // "x": [["delete", pos => Math.min(pos.index, pos.Line.to - 1), pos => Math.min(pos.index, pos.Line.to - 1)]], 
            "C": [["change", moves["iden"], moves["$"]]],
            "D": [["delete", moves["iden"], moves["$"]]],
            "cc": [["change", moves["0"], moves["$"]]],
            "dd": [["delete", pos => moves["0"](pos) - 1, moves["$"]], ["move", pos => pos.index + 1]],
        }

        if (MODE === "n") {
            if (lastPressed === "Escape") {
                currentCommand = "";
                return [];
            }

            // Actions
            if (headCommand == undefined && nActions[command]) return nActions[command];

            // Replace
            if (command[0] === "r" && abc.includes(command[1])) {
                let replacement = command[1];
                while (replacement.length < count) replacement += command[1];
                return [["replace", moves["iden"], moves["l"](count - 1), replacement]];
            }
            if ("fFtT".includes(command[0]) && abc.includes(command[1])) {
                lastInlineFind = command;
                return [["move", (pos) => {
                    return find(pos, command);
                }]];
            }

            // Caret movements
            if (!headCommand) {
                if (nMoves[command]) return [["move", nMoves[command], { updateScreenX: !["j", "k"].includes(command) }]];
                if (textObjects[command]) return [["move", textObjects[command]]];
            } else {
                if (nMoves[command]) return [[headCommand, moves["iden"], nMoves[command]]];
                if (textObjects[command]) return [["move", textObjects[command]], [headCommand, moves["iden"], moves["fixedEnd"]]];
            }

            return [];
        }

        if (MODE === "v") {
            if (lastPressed === "Escape" || lastPressed === "\\Cc") return [["mode", "n"]];
            if (nMoves[command]) return [["move", array(nMoves[command])]];
            if (textObjects[command]) return [["move", array(textObjects[command])]];

            if (headCommands[command]) return [[headCommands[command], moves["iden"], moves["fixedEnd"]]];
            return [];
        }


        return [];
    }

    const getMergedCommand = () => {
        console.log(`Running currentCommand in MODE ${MODE}`);
        let commandsToRun = parseCommand(currentCommand);
        console.log(`Commands to run: ${commandsToRun}`);
        if (commandsToRun.length > 0) {
            currentCommand = "";
            caret.changeStyle(caretStyles[MODE]);
        } else {
            const underlineCommandStarts = ["r", "g~", "gu", "gU"];
            for (let start of underlineCommandStarts) if (currentCommand.indexOf(start) === 0) {
                caret.changeStyle("underline");
                break;
            }
            return;
        }
        return () => {
            for (let c of commandsToRun) functions[c[0]](...c.slice(1));
            console.log(`Commands ran`);
        }
    }

    const appendCurrentCommand = (letter) => { // letter ~ \\Co, i, \\M\\AArrowLeft
        console.log(`Appending ${letter} to currentCommand`);
        currentCommand += letter;
        lastPressed = letter;
        console.log(`CurrentCommand: ${currentCommand}`);
        return getMergedCommand();
    }

    const command = (e) => {
        currentEvent = e;
        console.log(e);
        if (["Meta", "Alt", "Control", "Shift"].includes(e.key)) return;

        let letter = e.key;
        if (e.ctrlKey) letter = "\\C" + letter;
        if (e.altKey) letter = "\\A" + letter;
        if (e.metaKey) letter = "\\M" + letter;
        if (e.shiftKey && (abc.indexOf(e.key) == -1 || e.metaKey || e.altKey || e.ctrlKey)) letter = "\\S" + letter;

        return appendCurrentCommand(letter);
    }

    queueMicrotask(() => {
        functions.mode("n");
    });

    return command;
}

export { createCommandSet };
