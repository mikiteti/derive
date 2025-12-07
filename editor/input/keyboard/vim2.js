import { findXIndecesInLine, getVisualLineAt } from "../../assets.js";
import { Position } from "../../doc/classes.js";

const createCommandSet = (editor) => {
    let parsePosition = (pos) => { return new Position(pos, editor.doc, { track: false }) };
    const doc = editor.doc, render = editor.render, caret = editor.input.caret, snippets = editor.input.snippets;
    const keyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ1234567890_";
    const blank = " ";
    let lastInlineFind;
    const caretStyles = {
        "n": "wide",
        "v": "wide",
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
        if (caret.style !== "bar" && indeces.at(-1) === pos.Line.to && pos.Line.chars > 1) indeces[indeces.length - 1]--;
        let bestBet = indeces[0];
        while (indeces.length && indeces[0] <= pos.index) {
            indeces.shift();
            if (indeces.length) bestBet = indeces[0];
        }
        if (indeces.length >= count) return indeces[count - 1];
        // console.log("not in currentline, bestbet", bestBet);
        count -= indeces.length;
        // console.log(count);

        let number = pos.Line.number;
        while (count > 0) {
            number++;
            let nextLine = editor.doc.line(number);
            if (!nextLine || number >= editor.doc.lines) return bestBet;
            indeces = findXIndecesInLine(pos.caret.screenPosition.x, nextLine);
            if (caret.style !== "bar" && indeces.at(-1) === nextLine.to && nextLine.chars > 1) indeces[indeces.length - 1]--;
            if (indeces.length >= count) return indeces[count - 1];
            count -= indeces.length;
            bestBet = indeces.at(-1);
        }
        return bestBet;
    }

    const findPreviousVisualLine = (pos, count = 1) => {
        if (!pos.caret) return pos.index;
        let indeces = findXIndecesInLine(pos.caret.screenPosition.x, pos.Line);
        if (caret.style !== "bar" && indeces.at(-1) === pos.Line.to && pos.Line.chars > 1) indeces[indeces.length - 1]--;
        let bestBet = indeces[0];
        while (indeces.length && indeces.at(-1) >= pos.index) {
            indeces.pop();
            if (indeces.length) bestBet = indeces.at(-1);
        }
        if (indeces.length >= count) return indeces[indeces.length - count];
        // console.log("not in currentline, bestbet", bestBet);
        count -= indeces.length;
        // console.log(count);

        let number = pos.Line.number;
        while (count > 0) {
            number--;
            let prevLine = editor.doc.line(number);
            if (!prevLine || number < 0) return bestBet;
            indeces = findXIndecesInLine(pos.caret.screenPosition.x, prevLine);
            if (caret.style !== "bar" && indeces.at(-1) === prevLine.to && prevLine.chars > 1) indeces[indeces.length - 1]--;
            if (indeces.length >= count) return indeces[indeces.length - count];
            count -= indeces.length;
            bestBet = indeces[0];
        }
        return bestBet;
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
        "G": (pos) => doc.chars - 2,
        "gg": (pos) => 0,
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
        delete: (getFrom, getTo) => {
            // console.log(`deleting from ${getFrom} to ${getTo}`)
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
        change: (getFrom, getTo, text = "") => {
            functions["replace"](getFrom, getTo, text);
            functions["mode"]("i");
        },
        move: (getNewPos, { updateScreenX = true } = {}) => {
            // console.log(`moving carets with the rule ${getNewPos}, ${updateScreenX}`)
            for (let sc of caret.carets) {
                let newPos = getNewPos(sc.position);
                // if (caret.style !== "bar" && doc.lineAt(newPos).to === newPos) newPos--;

                if (!Array.isArray(newPos)) sc.placeAt(newPos, { keepFixedEnd: (curMode === "v"), updateScreenX }); // curMode check is experimental
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
                        "\\AArrowRight": [["move", moves["E"](1)], ["move", moves["l!"](1)]], // TODO: from eol to first word in next row
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
                    console.log("inserting Enter");
                    functions.insert("\n");
                }
            },
            {
                name: "insert char",
                keys: "any",
                run: (keys) => {
                    console.log("inserting ", keys[0]);
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
            run: (keys, { count = 1 } = {}) => { // TODO: counts
                dispatch([["move", moves[keys[0]](count)]]);
            },
        },
        { // uncountable basic movements
            name: "uncountable basic movements",
            keys: ["0", "$", "_", "^", "%", "G"], // not here
            run: (keys) => {
                dispatch([["move", moves[keys[0]]]]);
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
                    run: (keys, { count = 1 } = {}) => {
                        if (keys[0] === "g") {
                            console.log("gg", count);
                            dispatch([["move", pos => doc.line(count - 1).from + Math.min(doc.line(count - 1).text.length - 1, pos.column)]]);
                        }
                    },
                },
                {
                    name: "gJ",
                    keys: ["J"],
                    run: (keys) => 0,
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
            name: "half text objects (i/a)",
            keys: ["i", "a"],
            next: [
                {
                    name: "full text objects",
                    keys: ["w", "W", "s", "p", "b", "B", "t", "'", "\"", "`", "{", "}", "(", ")", "[", "]", "<", ">"],
                    run: (keys, { method } = {}) => {
                        console.log(`running text object ${method}${keys[0]}`);
                        dispatch([["move", {
                            "iw": (pos) => [findStartOfWord(pos), findEndOfWord(pos)],
                            "iW": (pos) => [findStartOfWORD(pos), findEndOfWORD(pos)],
                        }[method + keys[0]]]]);
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
                    name: "gJ",
                    keys: ["J"],
                    run: (keys) => 0,
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
        return nexts[0].run(keys.slice(slice), context);
    }

    const normal = {
        name: "root",
        next: [
            { // mode changes
                name: "mode changes",
                keys: ["i", "a", "I", "A", "v", "V", "o", "O"],
                run: (keys) => {
                    (({
                        "i": () => { dispatch([["mode", "i"]]) },
                        "a": () => { dispatch([["mode", "i"], ["move", (pos) => (pos.Line.chars === 1 ? pos.index : pos.index + 1)]]) },
                        "I": () => { dispatch([["mode", "i"], ["move", moves["_"]]]) },
                        "A": () => { dispatch([["mode", "i"], ["move", moves["$"]], ["move", moves["l!"](1)]]) },
                        "v": () => { dispatch([["mode", "v"]]) },
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
                name: "add carets",
                keys: ["ArrowDown", "ArrowUp"],
                run: (keys, { count = 1 } = {}) => {
                    let indeces;
                    switch (keys[0]) {
                        case "ArrowDown":
                            for (let i = 0; i < count; i++) {
                                indeces = caret.carets.map(e => e.position.index + e.position.Line.chars).filter(e => e <= doc.chars);
                                caret.addCaret(Math.max(...indeces));
                            }
                            break;
                        case "ArrowUp":
                            for (let i = 0; i < count; i++) {
                                indeces = caret.carets
                                    .filter(e => e.position.Line.number > 0)
                                    .map(e => doc.line(e.position.Line.number - 1).from + e.position.column)
                                caret.addCaret(Math.min(...indeces));
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
                keys: ["<", ">"],
                run: (keys) => {
                    console.log(`indenting lines with ${keys[0]} in normal mode`);
                }
            },
            { // dd
                name: "d",
                count: true,
                keys: ["d"],
                next: [
                    {
                        name: "dd",
                        keys: ["d"],
                        run: (keys) => { dispatch([["delete", pos => pos.Line.from, pos => pos.Line.to]]); },
                    }
                ]
            },
            { // cc
                name: "c",
                count: true,
                keys: ["c"],
                next: [
                    {
                        name: "cc",
                        keys: ["c"],
                        run: (keys) => { dispatch([["change", pos => pos.Line.from, pos => pos.Line.to - 1]]); },
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
                        run: (keys) => 0,
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
                run: (keys, { nexts } = {}) => {
                    console.log(`running headcommand ${keys[0]}`);
                    runNext(keys, nexts);
                    dispatch({
                        "d": [["delete", moves["iden"], moves["fixedEnd"]]],
                        "c": [["change", moves["iden"], moves["fixedEnd"]]],
                    }[keys[0]]);
                }
            },
            { // capital headcommands
                name: "capital headcommands",
                count: true,
                keys: ["D", "C", "Y"],
                run: (keys) => {
                    dispatch({
                        "D": [["delete", moves["iden"], moves["$"]]],
                        "C": [["change", moves["iden"], moves["$"]]],
                    }[keys[0]]);
                },
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
            { // x, X
                name: "x, X",
                count: true,
                keys: ["x", "X"],
                run: (keys, { count = 1 } = {}) => {
                    dispatch({
                        "x": [["delete", min(moves["iden"], moves["$"]), min(moves["l"](count - 1), moves["$"])]],
                        "X": [["delete", moves["h"](count), moves["h"](1)]],
                    }[keys[0]]);
                },
            },
            { // join
                name: "join lines",
                count: true,
                keys: ["J"],
                run: (keys) => 0,
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

    const visual = {
        name: "root",
        next: [
            {
                name: "Escape",
                keys: ["Escape", "\\Cc"],
                run: (keys) => {
                    functions.mode("n");
                }
            },
            ...motions,
            ...textObjects,
            {
                name: "visual headcommands",
                keys: ["d", "x", "c", "y", "~", "u", "U"],
                run: (keys) => {
                    console.log(`running ${keys[0]} in visual mode`);
                    dispatch({
                        "d": [["delete", moves["iden"], moves["fixedEnd"]], ["mode", "n"]],
                        "x": [["delete", moves["iden"], moves["fixedEnd"]], ["mode", "n"]],
                        "c": [["change", moves["iden"], moves["fixedEnd"]], ["mode", "i"]],
                    }[keys[0]]);
                }
            },
            {
                name: "indent",
                keys: ["<", ">"],
                run: (keys) => {
                    console.log(`indenting lines with ${keys[0]} in visual mode`);
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
        let currentBranches = [{ node: { "n": normal, "i": insert, "v": visual }[mode], trace: [] }], nextBranches, keyCount = 0;
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
                    console.log(branch);
                    let outerMostRun = branch.trace.find(e => e.run);
                    if (outerMostRun == undefined) {
                        console.error("compromised command tree: no outermost run found for", command);
                        return 1;
                    }
                    let index = branch.trace.indexOf(outerMostRun);
                    console.log("will run", outerMostRun, "with", command.slice(0, keyCount).slice(index), branch.trace.slice(index + 1).map(e => e.run));
                    let count;
                    if (outerMostRun.count && !Number.isNaN(parseInt(command[index]))) {
                        count = parseInt(command[index]);
                        index++;
                    }

                    return () => {
                        if (count) outerMostRun.run(command.slice(0, keyCount).slice(index), { nexts: branch.trace.slice(index), count });
                        else outerMostRun.run(command.slice(0, keyCount).slice(index), { nexts: branch.trace.slice(index + 1) });
                        if (curMode === "n") dispatch([["move", moves["safety"]]]);
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


    let groupLevel = 0;
    return (e) => {
        if (e.key.length !== 1 && !["Tab", "Escape", "Backspace", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
            return;
        }

        let key = (e.metaKey ? "\\M" : "")
            + (e.altKey ? "\\A" : "")
            + (e.ctrlKey ? "\\C" : "")
            + (e.shiftKey && (e.key.length !== 1 || e.metaKey || e.altKey || e.ctrlKey) ? "\\S" : "")
            + e.key;
        console.group(key);
        groupLevel++;
        if (!Number.isNaN(parseInt(curCommand.at(-1))) && parseInt(curCommand.at(-1)) !== 0 && !Number.isNaN(parseInt(key))) curCommand[curCommand.length - 1] = curCommand.at(-1) + key;
        else curCommand.push(key);

        if (curMode === "n" && caret.carets[0].fixedEnd) curMode = "v";
        let parsed = parse();
        switch (parsed) {
            case undefined:
                console.log("no command found for", curCommand);
                break;
            case 0:
                console.log("%caborting command for", "color: red; font-weight: bold", curCommand);
                curCommand = [];
                while (groupLevel > 0) {
                    console.groupEnd();
                    groupLevel--;
                }
                break;
            default:
                console.log("%ccommand found for", "color: green; font-weight: bold", curCommand);
                curCommand = [];
                render.renderInfo();
                return () => {
                    parsed();
                    while (groupLevel > 0) {
                        console.groupEnd();
                        groupLevel--;
                    }
                };
        }
        render.renderInfo();
    };
}

export { createCommandSet };
