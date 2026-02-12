// change: {
// from: {carets: [44], text: "", at: 123},
// to: {carets: [45], text: "a", at: 123},
// }
//
// change: {
// from: {decos: ["underline"], line: 13},
// to: {decos: [""], line: 13},
// }
//
// change: {
// from: {marks: [{role: "math", from: 123, to: 127}], line: 14}
// to: {marks: [{role: "bold", from: 126, to: 129}], line: 14}
// }
// changeGroup: change[]

class History {
    constructor(editor) {
        this.editor = editor;

        this.changes = [[]];
        this.position = 0;
    }

    parseChange(changeGroup, { reverse = true } = {}) {
        let steps = [];
        for (let change of reverse ? changeGroup.toReversed() : changeGroup) {
            let from = reverse ? change.to : change.from,
                to = reverse ? change.from : change.to;

            if (from.text != undefined || to.text != undefined) {
                steps.push(() => {
                    this.editor.doc.change.replace(to.text, from.at, from.at + from.text.length, { addToHistory: false, noCallback: true });
                });
            }

            if (to.carets != undefined) {
                steps.push(() => {
                    queueMicrotask(() => {
                        this.editor.input.caret.updateCarets(to.carets);
                    });
                });
            }

            if (from.decos != undefined) {
                steps.push(() => {
                    this.editor.doc.line(from.line).setDecos(to.decos, { addToHistory: false });
                });
            }

            if (from.marks != undefined) {
                steps.push(() => {
                    this.editor.doc.line(from.line).setMarks(to.marks, { addToHistory: false });
                });
            }

            if (to.lines != undefined) {
                for (let line of to.lines) {
                    if (line.marks != undefined) {
                        steps.push(() => {
                            this.editor.doc.line(line.line).setMarks(line.marks, { addToHistory: false });
                        });
                    }
                }
            }
        }

        return () => {
            for (let step of steps) step();
            this.editor.doc.change.runCallbacks();
            // setTimeout(() => { // probably solved by renderLine returning a promise that placeAt awaits
            this.editor.input.caret.placeAllAt(undefined, { keepFixedEnd: -1 });
            // }, 200);
        }
    }

    undo() {
        if (this.position < 1) return;
        while (this.changes[this.position - 1].length === 0 && this.position > 0) this.position--;
        let change = this.parseChange(this.changes[this.position - 1]);
        this.position--;
        change();
    }

    redo() {
        if (this.position >= this.changes.length) return;
        while (this.changes[this.position].length === 0 && this.changes.length - 1 > this.position) this.position++;
        let change = this.parseChange(this.changes[this.position], { reverse: false });
        this.position++;
        change();
    }

    addChange(change) {
        let newGroup = this.position < this.changes.length;
        while (this.position < this.changes.length) this.changes.pop();
        if (newGroup) this.newChangeGroup();
        this.changes.at(-1).push(change);
    }

    newChangeGroup() {
        if (this.changes.at(-1) != undefined && this.changes.at(-1).length === 0) return;
        this.changes.push([]);
        this.position++;
    }
}

const newHistory = (editor) => {
    const history = new History(editor);

    return history;
}

export default newHistory;
