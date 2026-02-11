class Clipboard {
    constructor(editor) {
        this.editor = editor;
    }

    parse(from, to) {
        let text = this.editor.doc.textBetween(from, to);
        console.log(`parsed from ${from} to ${to}`);
        let line1 = this.editor.doc.lineAt(from), line2 = this.editor.doc.lineAt(to);
        let lines = line1 === line2 ? [line1] : [line1, ...this.editor.doc.linesBetween(line1.number, line2.number), line2];
        let decos = lines.map(e => [...e.decos]);
        let marks = lines.map(e => e.marks
            .filter(f => f.from.index >= from && f.to.index <= to)
            .map(f => ({ from: f.from.index - from, to: f.to.index - from, role: f.role }))
        );

        return { text, decos, marks };
    }

    copy(from, to) {
        console.log(`copied from ${from} to ${to}`);
        window.state.clipboardContent = this.parse(from, to);
        return window.state.clipboardContent;
    }

    paste(at, content = window.state.clipboardContent) {
        this.editor.doc.history.newChangeGroup();
        console.log(`pasted at ${at}`);
        if (at == undefined || content == undefined || content.text == undefined) return;
        this.editor.doc.change.insert(content.text, at);
        let lineNum = content.text.split("\n").length;
        let line1 = this.editor.doc.lineAt(at);

        if (line1.decos.size == 0 && content.decos[0].length > 0) line1.setDecos(content.decos[0]);
        for (let i = 1; i < lineNum; i++) this.editor.doc.line(line1.number + i).setDecos(content.decos[i]);

        if (line1.marks.find(e => e.from.index <= at && e.to.index >= at) && content.marks[0])
            line1.deleteMark(line1.marks.find(e => e.from.index <= at && e.to.index >= at));

        for (let i = 0; i < lineNum; i++)
            this.editor.doc.line(line1.number + i).addNewMark(content.marks[i].map(e => ({ from: e.from + at, to: e.to + at, role: e.role })));

        for (let i = 0; i < lineNum; i++) {
            this.editor.doc.line(line1.number + i).unrenderedChanges.add("caret");
            this.editor.render.renderLine(this.editor.doc.line(line1.number + i));
        }
        this.editor.doc.history.newChangeGroup();
    }

    compare(text, content = window.state.clipboardContent) {
        return content?.text === text;
    }
}

const newClipboard = (editor) => {
    const clipboard = new Clipboard(editor);

    return clipboard;
}

export default newClipboard;
