import { findXIndicesInLine, getVisualLineAt } from "../../assets.js";
import { key } from "../../assets.js";

const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':\",./<>?`~".split("");

const createCommandSet = (editor) => {
    let currentEvent;
    const doc = editor.doc, render = editor.render, caret = editor.input.caret, snippets = editor.input.snippets;
    console.log({ snippets });

    const findStartOfPreviousWord = (pos) => {
        let line = pos.Line, currentPos = pos.index;
        if (currentPos == line.from) {
            line = doc.line(line.number - 1);
            if (line == undefined) return currentPos;
            currentPos = line.to;
        }
        let text = line.text.substring(0, currentPos - 1 - line.from);
        let column = text.lastIndexOf(" ") + 1;

        return line.from + column;
    }

    const findEndOfNextWord = (pos) => {
        let line = pos.Line, currentPos = pos.index;
        if (currentPos == line.to) {
            line = doc.line(line.number + 1);
            currentPos = line.from;
        }
        let text = line.text.substring(currentPos + 1 - line.from);
        let column = text.indexOf(" ") + 1;
        if (column == 0) column = line.to - currentPos;

        return currentPos + column;
    }

    const moveDown = ({ keepFixedEnd = false } = {}) => {
        for (let sc of caret.carets) {
            let indices = findXIndicesInLine(sc.screenPosition.x, sc.position.Line);
            while (indices.length && indices[0] <= sc.position.index) indices.shift();
            if (indices.length) {
                sc.placeAt(indices[0], { updateScreenX: false, keepFixedEnd });
                continue;
            }

            let nextLine = editor.doc.line(sc.position.Line.number + 1);
            if (!nextLine) continue;
            indices = findXIndicesInLine(sc.screenPosition.x, nextLine);
            sc.placeAt(indices[0], { updateScreenX: false, keepFixedEnd });
        }
    }

    const moveUp = ({ keepFixedEnd = false } = {}) => {
        for (let sc of caret.carets) {
            let indices = findXIndicesInLine(sc.screenPosition.x, sc.position.Line);
            while (indices.length && indices.at(-1) >= sc.position.index) indices.pop();
            if (indices.length) {
                sc.placeAt(indices.at(-1), { updateScreenX: false, keepFixedEnd });
                continue;
            }

            let prevLine = editor.doc.line(sc.position.Line.number - 1);
            if (!prevLine) continue;
            indices = findXIndicesInLine(sc.screenPosition.x, prevLine);
            sc.placeAt(indices.at(-1), { updateScreenX: false, keepFixedEnd });
        }
    }

    const commands = {
        ArrowLeft: () => caret.placeAllAt(pos => pos.index - 1),
        ArrowRight: () => caret.placeAllAt(pos => pos.index + 1),
        "S+ArrowRight": () => caret.placeAllAt(pos => pos.index + 1, { keepFixedEnd: true }),
        "S+ArrowLeft": () => caret.placeAllAt(pos => pos.index - 1, { keepFixedEnd: true }),
        Backspace: () => {
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
        "S+Backspace": () => {
            caret.changeForAll(sc => {
                if (sc.fixedEnd) return { from: sc.position.index, to: sc.fixedEnd.index };
                return { from: sc.position.index, to: sc.position.index + 1 };
            });
        },
        "M+ArrowLeft": () => { caret.placeAllAt(pos => getVisualLineAt(pos).from); snippets.deleteTabStops(); },
        "M+ArrowRight": () => { caret.placeAllAt(pos => getVisualLineAt(pos).to); snippets.deleteTabStops(); },
        "M+S+ArrowLeft": () => { caret.placeAllAt(pos => getVisualLineAt(pos).from, { keepFixedEnd: true }); },
        "M+S+ArrowRight": () => { caret.placeAllAt(pos => getVisualLineAt(pos).to, { keepFixedEnd: true }); },
        "M+Backspace": () => {
            caret.changeForAll(sc => {
                let line = sc.position.Line;
                return { from: line.from, to: sc.position.index };
            }, pos => pos.index);
        },
        "A+ArrowLeft": () => {
            caret.placeAllAt(pos => findStartOfPreviousWord(pos));
        },
        "A+ArrowRight": () => {
            caret.placeAllAt(pos => findEndOfNextWord(pos));
        },
        "A+S+ArrowLeft": () => {
            caret.placeAllAt(pos => findStartOfPreviousWord(pos), { keepFixedEnd: true });
        },
        "A+S+ArrowRight": () => {
            caret.placeAllAt(pos => findEndOfNextWord(pos), { keepFixedEnd: true });
        },
        "A+Backspace": () => {
            caret.changeForAll(sc => {
                let p = findStartOfPreviousWord(sc.position);
                return { from: p, to: sc.position.index };
            });
        },
        "Enter": () => {
            caret.changeForAll(sc => {
                if (sc.fixedEnd) return { insert: "\n", from: sc.position.index, to: sc.fixedEnd.index };
                return { insert: "\n", at: sc.position.index };
            });
        },
        "ArrowDown": () => { moveDown(); },
        "ArrowUp": () => { moveUp(); },
        "S+ArrowDown": () => { moveDown({ keepFixedEnd: true }); },
        "S+ArrowUp": () => { moveUp({ keepFixedEnd: true }); },
        "Escape": () => { caret.updateCarets([caret.carets[0].position.index]); },
    };

    for (let letter of abc) commands[letter] = () => {
        for (let sc of caret.carets) {
            doc.change.noCallback(
                sc.fixedEnd ?
                    { insert: letter, from: sc.position.index, to: sc.fixedEnd.index } :
                    { insert: letter, at: sc.position.index }
            );
        }

        let jump;
        if (doc.change.callbackList.changedLines.size === 1) jump = snippets.multiHandle(caret.carets.map(e => e.position));
        doc.change.runCallbacks();
        if (jump) snippets.jumpToNextTabStops();

        let lines = new Set(caret.carets.map(e => e.position.Line));
        for (let line of lines) snippets.features.autoEnlarge(line);
    }

    const command = (e) => {
        currentEvent = e;
        let keyName = (key.metaKey(e) ? "M+" : "")
            + (key.altKey(e) ? "A+" : "")
            + (key.ctrlKey(e) ? "C+" : "")
            + (key.shiftKey(e) && (abc.indexOf(e.key) == -1 || key.metaKey(e) || key.altKey(e) || key.ctrlKey(e)) ? "S+" : "")
            + e.key;
        return commands[keyName];
    }

    return command;
}

export { createCommandSet };
