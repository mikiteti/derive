const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':\",./<>?`~".split("");

const createCommandSet = (editor) => {
    let currentEvent;
    const doc = editor.doc, render = editor.render, caret = editor.render.caret;

    const findStartOfPreviousWord = () => {
        let line = doc.lineAt(caret.position), currentPos = caret.position;
        if (caret.position == line.from) {
            line = doc.line(line.number - 1);
            if (line == undefined) return caret.position;
            currentPos = line.to;
        }
        let text = line.text.substring(0, currentPos - 1 - line.from);
        let column = text.lastIndexOf(" ") + 1;

        return line.from + column;
    }

    const findEndOfNextWord = () => {
        let line = doc.lineAt(caret.position), currentPos = caret.position;
        if (caret.position == line.to) {
            line = doc.line(line.number + 1);
            currentPos = line.from;
        }
        let text = line.text.substring(currentPos + 1 - line.from);
        let column = text.indexOf(" ") + 1;
        if (column == 0) column = line.to - currentPos;

        return currentPos + column;
    }

    const commands = {
        ArrowLeft: () => caret.placeAt(caret.position - 1),
        ArrowRight: () => caret.placeAt(caret.position + 1),
        Backspace: () => {
            let changedLines = doc.change.delete();
            for (let line of changedLines) render.renderLine(line);
            caret.placeAt(caret.position - 1);
        },
        "M+ArrowLeft": () => { caret.placeAt(doc.lineAt(caret.position).from); },
        "M+ArrowRight": () => { caret.placeAt(doc.lineAt(caret.position).to); },
        "M+Backspace": () => {
            let line = doc.lineAt(caret.position);
            let changedLines = doc.change.delete(line.from, caret.position);
            for (let line of changedLines) render.renderLine(line);
            caret.placeAt(line.from);
        },
        "A+ArrowLeft": () => {
            caret.placeAt(findStartOfPreviousWord());
        },
        "A+ArrowRight": () => {
            caret.placeAt(findEndOfNextWord());
        },
        "A+Backspace": () => {
            let pos = findStartOfPreviousWord();
            let lines = doc.change.delete(pos, caret.position);
            for (let line of lines) render.renderLine(line);
            caret.placeAt(pos);
        },
        "Enter": () => {
            let changedLines = doc.change.insert("\n", caret.position);
            // console.log({ changedLines });
            for (let line of changedLines || []) render.renderLine(line);
            caret.placeAt(caret.position + 1);
            // window.checkTreeStructure();
        },
        // "S+Enter": () => {
        //     let changedLines = doc.change.insert("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", caret.position);
        //     console.log({ changedLines });
        //     for (let line of changedLines || []) render.renderLine(line);
        //     caret.placeAt(caret.position + 1);
        //     window.checkTreeStructure();
        // },
        // "M+v": () => {
        //     let changedLines = doc.change.insert("hello world\nhello world again\nhello world for a third time", caret.position);
        //     console.log({ changedLines });
        //     for (let line of changedLines || []) render.renderLine(line);
        //     caret.placeAt(caret.position + 1);
        // },
        "M+c": () => {
            navigator.clipboard.writeText(doc.lineAt(caret.position).text + "\n").then(() => {
                console.log('Copied!', doc.lineAt(caret.position).text);
            }).catch(console.error);
        },
        "M+v": () => {
            navigator.clipboard.readText().then(text => {
                for (let line of doc.change.insert(text, caret.position)) render.renderLine(line);
                caret.placeAt(caret.position + text.length);
            })
        }
    };

    for (let letter of abc) commands[letter] = () => {
        let changedLines = doc.change.insert(letter);
        for (let line of changedLines) render.renderLine(line);
        caret.placeAt(caret.position + 1);
    }

    const command = (e) => {
        currentEvent = e;
        let keyName = (e.metaKey ? "M+" : "") + (e.altKey ? "A+" : "") + (e.ctrlKey ? "C+" : "") + (e.shiftKey && abc.indexOf(e.key) == -1 ? "S+" : "") + e.key;
        return commands[keyName];
    }

    return command;
}

export { createCommandSet };
