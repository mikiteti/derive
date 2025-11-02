import Selection from "./selection.js";

const renderChangedLines = (editor, changedLines) => {
    for (let line of changedLines) editor.render.renderLine(line);
}

const renderCarets = (editor) => {
    for (let caret of editor.input.caret.carets) caret.placeAt();
}

class Render {
    constructor(editor, textarea) {
        this.editor = editor;
        this.textarea = textarea;

        editor.doc.change.addCallback(renderChangedLines);
        queueMicrotask(() => { editor.doc.change.addCallback(renderCarets); });

        this.decos = ["underline", "bold", "Bold", "accent", "display-math", "middle", "small", "large", "capital", "spin_border"];
        this.selection = new Selection(editor, textarea);
    }

    renderInfo() {
        if (!this.editor.interactive) return;
        const doc = this.editor.doc;
        document.getElementById("rightInfo").innerHTML = `L${doc.lines} W${doc.words} C${doc.chars} P${window.positionCount}`;

        if (this.editor.input?.keyboard?.layout === "vim" && this.editor.input.keyboard.mode) {
            let mode = this.editor.input.keyboard.mode?.mode;
            mode = { "n": "Normal", "i": "Insert", "v": "Visual", "vLine": "V-Line", "vBlock": "V-Block", "c": "Command" }[mode];

            document.getElementById("leftInfo").innerHTML = `${mode}: ${this.editor.input.keyboard.curCommand.command}`;
        }
    }

    createLineElement(line) {
        let lineElement = document.createElement("p");
        if (line.decos.has("display-math")) lineElement.classList.add("hidden");

        lineElement.Line = line;
        line.assignElement(lineElement);

        let previousLine = line.previousSibling;
        while (previousLine) {
            if (previousLine.element) break;
            previousLine = previousLine.previousSibling;
        }
        if (previousLine) {
            if (previousLine.element.DM) {
                previousLine.element.DM.after(lineElement);
                return;
            }
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

        for (let i = 0; i < doc.lines; i++) this.renderLine(doc.line(i));

        this.renderInfo();
    }

    async handleDM(line) {
        await window.MathJax.startup.promise;
        if (!line.decos.has("display-math")) {
            if (!line.element.DM) return;
            line.element.DM.remove();
            queueMicrotask(_ => {
                line.element.DM = undefined;
            });
        }

        if (!line.element.DM) { // create DM element
            let DM = document.createElement("div");
            line.element.DM = DM;
            DM.Line = line;
            DM.element = line.element;
            DM.classList.add("DM");
            DM.source = line.text;
            line.element.after(DM);
            try {
                DM.replaceChildren(window.MathJax.tex2svg(line.text, { display: true })); // render sync on load
            } catch (error) {
                DM.innerHTML = line.text; // placeholder until async is done
                // console.log(error.message);
                window.MathJax.tex2svgPromise(line.text, { display: true }).then(node => { // render async if something needs to be loaded
                    DM.replaceChildren(node);
                });
            }
        } else {
            if (line.text === line.element.DM.source) return;
            line.element.DM.source = line.text;

            // let metrics = window.MathJax.getMetricsFor(line.element.DM, true);
            // console.log({ metrics });
            window.MathJax.tex2svgPromise(line.text, { display: true }).then(node => { // render async on change
                if (!window.renderErrors && !node.querySelector('[data-mjx-error], mjx-merror, [fill="red"], [stroke="red"]')) line.element.DM.replaceChildren(node);
            });
        }
    }

    renderLine(line) {
        if (line.deleted) {
            line.element.remove();
            if (line.element.DM) line.element.DM.remove();
            this.renderInfo();
            return;
        } else if (!line.element) {
            this.createLineElement(line);
            ["text", "tabs", "deco"].forEach(e => line.unrenderedChanges.add(e));
        }

        if (line.unrenderedChanges.delete("text")) {
            line.element.innerHTML = "<span class='content'>" + line.text + "</span><span class='endChar'> </span>";
            if (line.decos.has("display-math")) {
                this.handleDM(line);
            }
        }

        if (line.unrenderedChanges.delete("tabs")) {
            line.element.style.paddingLeft = `calc(${line.tabs.full} * var(--tab-full-width))`;
        }

        if (line.unrenderedChanges.delete("deco")) {
            for (let deco of this.decos) {
                if (line.decos.has(deco)) line.element.classList.add(deco);
                else line.element.classList.remove(deco);
            }
            this.handleDM(line);
        }

        this.renderInfo();
    }

    hideLine(line) {
        line.element.classList.add("hidden");
    }

    revealLine(line) {
        line.element.classList.remove("hidden");
    }
}

const newRender = ({ editor, textarea = document.getElementById("editor") } = {}) => {
    const render = new Render(editor, textarea);

    return render;
}

export default newRender;
