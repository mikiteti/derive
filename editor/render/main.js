import Caret from "./caret.js"

class Render {
    constructor(editor, textarea) {
        this.editor = editor;
        this.textarea = textarea;
        this.caret = new Caret(this.editor, textarea, this.editor.doc);
    }

    renderInfo() {
        const doc = this.editor.doc;

        document.getElementById("info").innerHTML = `Lines: ${doc.lines}, words: ${doc.words}, chars: ${doc.chars}`;
    }

    createLineElement(line) {
        let lineElement = document.createElement("p");
        lineElement.innerText = line.text || " ";
        lineElement.style.paddingLeft = `calc(${line.tabs.full} * var(--tab-full-width))`;

        lineElement.Line = line;
        line.assignElement(lineElement);

        let previousLine = line.previousSibling;
        while (previousLine) {
            if (previousLine.element) break;
            previousLine = previousLine.previousSibling;
        }
        if (previousLine) {
            previousLine.element.after(lineElement);
            return;
        }

        let nextLine = line.nextSibling;
        while (nextLine) {
            if (nextLine.element) break;
            nextLine = nextLine.nextSibling;
        }
        if (nextLine) {
            nextLine.element.before(lineElement);
            return;
        }

        this.textarea.appendChild(lineElement);
    }

    renderAll() {
        const doc = this.editor.doc;
        this.textarea.innerHTML = "";

        for (let i = 0; i < doc.lines; i++) this.createLineElement(doc.line(i));

        this.renderInfo();
    }

    renderLine(line) {
        if (line.deleted) {
            line.element.remove();
        } else if (line.element) {
            line.element.innerText = line.text || " ";
            line.element.style.paddingLeft = `calc(${line.tabs.full} * var(--tab-full-width))`;
        } else {
            this.createLineElement(line);
        }

        this.renderInfo();
    }
}

const newRender = ({ editor, textarea = document.getElementById("editor") } = {}) => {
    const render = new Render(editor, textarea);

    return render;
}

export default newRender;
