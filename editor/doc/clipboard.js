class Clipboard {
    constructor(name) {
        this.name = name;
    }

    get editor() {
        return window.state.editor;
    }

    parse(from, to) {
        if (from > to) [from, to] = [to, from];
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

    copy(from, to, text) {
        this.content = (from != undefined && to != undefined) ? this.parse(from, to) : { text };
        return this.content;
    }

    paste(at, content = this.content, { from, to } = {}) {
        this.editor.doc.history.newChangeGroup();
        console.log(`pasted at ${at}`, content);
        if (at == undefined && (from == undefined || to == undefined) || content == undefined || content.text == undefined) return;
        if (at == undefined) {
            at = from;
            this.editor.doc.change.replace(content.text, from, to);
        } else this.editor.doc.change.insert(content.text, at);
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

    compare(text, content = window.state.clipboard.content) {
        return content?.text === text;
    }

    convertToClipboardHTML(content) {
        let lines = content.text.split("\n");
        let html = "", charsBeforeLine = 0;
        for (let i = 0; i < lines.length; i++) {
            let atoms = [], index = 0, marks = content.marks[i];
            for (let mark of marks) {
                atoms.push(lines[i].slice(index, mark.from - charsBeforeLine));
                atoms.push(lines[i].slice(mark.from - charsBeforeLine, mark.to - charsBeforeLine));
                index = mark.to - charsBeforeLine;
            }
            atoms.push(lines[i].slice(index));

            let lineElement = "p";
            for (let h of ["h1", "h2", "h3", "h4", "h5", "h6"]) if (content.decos[i].includes(h)) {
                lineElement = h;
                break;
            }
            if (content.decos[i].includes("math")) lineElement = 'p class="math" style="font-style: italic;"';

            let markElements = {
                "bold": "b",
                "italic": "i",
                "math": 'span class="math" style="font-style: italic;"',
            }

            let text = `<${lineElement}>` + atoms[0];
            for (let j = 0; j < marks.length; j++) {
                if (markElements[marks[j].role]) {
                    text += `<${markElements[marks[j].role]}>${atoms[2 * j + 1]}</${markElements[marks[j].role].split(" ")[0]}>${atoms[2 * j + 2]}`;
                } else text += atoms[2 * j + 1] + atoms[2 * j + 2];
            }
            text += `</${lineElement.split(" ")[0]}>`;

            html += text + "\n";

            charsBeforeLine += lines[i].length + 1;
        }

        return html;
    }

    parseClipboardHTML(html) {

    }
}

const newClipboard = (editor) => {
    const clipboard = new Clipboard(editor);

    return clipboard;
}

export default newClipboard;
