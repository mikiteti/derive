import Selection from "./selection.js";

const renderChangedLines = (editor, changedLines) => {
    for (let line of changedLines) editor.render.renderLine(line);
}

const renderCarets = (editor) => {
    requestAnimationFrame(() => {
        editor.input.caret.placeAllAt();
    });
}

class Render {
    constructor(editor) {
        this.editor = editor;
        this.textarea = this.editor.elements.textarea;

        editor.doc.change.addCallback(renderChangedLines);
        queueMicrotask(() => {
            editor.doc.change.addCallback(renderCarets);
        });

        this.decos = ["underline", "bold", "Bold", "italic", "highlight", "math", "center", "small", "large", "capital", "spin_border", "h1", "h2", "h3", "h4", "h5", "h6", "subtitle"];
        this.selection = new Selection(editor);
    }

    renderInfo() {
        if (!this.editor.interactive) return;
        const doc = this.editor.doc;
        let curCommand = this.editor.input?.keyboard?.curCommand || "";
        if (curCommand) curCommand = " " + curCommand;
        this.editor.elements.rightInfo.innerHTML = `L${doc.lines} W${doc.words} C${doc.chars}` + curCommand;

        let mode = { "n": "Normal", "i": "Insert", "v": "Visual", "vLine": "V-Line", "vBlock": "V-Block", "c": "Command" };
        this.editor.elements.leftInfo.innerHTML = mode[this.editor.input?.keyboard?.curMode] || "";
    }

    createLineElement(line) {
        let lineElement = document.createElement("p");
        if (line.decos.has("math")) lineElement.classList.add("hidden");

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

        requestAnimationFrame(() => this.renderInfo());
    }

    async handleDM(line) {
        await window.MathJax.startup.promise;
        if (!line.decos.has("math") || line.deleted) {
            if (!line.element.DM) return;
            line.element.DM.remove();
            queueMicrotask(_ => {
                line.element.DM = undefined;
            });

            return;
        }

        if (!line.element.DM) { // create DM element
            let DM = document.createElement("div");
            line.element.DM = DM;
            DM.Line = line;
            DM.element = line.element;
            DM.classList.add("DM");
            DM.source = line.text;
            line.element.after(DM);
            // try {
            //     DM.replaceChildren(window.MathJax.tex2svg(line.text, { display: true })); // render sync on load
            // } catch (error) {
            // DM.innerHTML = line.text; // placeholder until async is done

            // await window.MathJax.startup.document.outputJax.font.loadDynamicFiles(); // best i got
            // DM.replaceChildren(window.MathJax.tex2svg(line.text, { display: true })); // async still didn't load fonts in time

            // window.MathJax.tex2svgPromise(line.text, { display: true }).then(node => { // render async if something needs to be loaded
            //     // console.log("retried", line, "got");
            //     // console.log(node);
            //     DM.replaceChildren(node);
            // });
            // }

            window.MathJax._.mathjax.mathjax.handleRetriesFor(async () => { // fantastic! the right solution.
                DM.replaceChildren(window.MathJax.tex2svg(line.text, { display: true }));
                await window.MathJax.startup.document.outputJax.font.loadDynamicFiles(); // without this, weird glyphs are rendered in another font 
            });
        } else {
            if (line.text === line.element.DM.source) return;
            line.element.DM.source = line.text;

            // let metrics = window.MathJax.getMetricsFor(line.element.DM, true);
            // console.log({ metrics });
            window.MathJax.tex2svgPromise(line.text, { display: true }).then(node => { // render async on change
                if (!window.renderErrors && !node.querySelector('[data-mjx-error], mjx-merror, [fill="red"], [stroke="red"]')) line.element.DM.replaceChildren(node);
            });
        }
        // window.MathJax.startup.document.clear();
        // window.MathJax._.mathjax.mathjax.handleRetriesFor(() => window.MathJax.startup.document.updateDocument());
    }

    renderLine(line) {
        let promises = [];

        if (line.deleted) {
            line.element.remove();
            if (line.element.DM) line.element.DM.remove();
            requestAnimationFrame(() => this.renderInfo());
            return;
        } else if (!line.element) {
            this.createLineElement(line);
            ["text", "tabs", "deco", "marks", "caret"].forEach(e => line.unrenderedChanges.add(e));
        }

        let caretChanged = line.unrenderedChanges.delete("caret");
        let textChanged = line.unrenderedChanges.delete("text");
        let marksChanged = line.unrenderedChanges.delete("marks");
        if (textChanged || marksChanged) {
            let content = document.createElement("span");
            content.classList.add("content");
            let text = line.text;
            let index = 0, afterBullet;
            if (["• ", "– ", "∘ "].includes(text.slice(0, 2))) {
                index = 2;
                let bullet = document.createElement("span");
                bullet.classList.add("bullet");
                bullet.innerHTML = text.slice(0, 2);
                line.element.replaceChildren(bullet);
                let lineWrapper = document.createElement("div");
                lineWrapper.classList.add("lineWrapper");
                line.element.appendChild(lineWrapper);
                afterBullet = lineWrapper;
            }

            for (let mark of line.marks.sort((a, b) => a.start.index - b.start.index)) {
                let wrapper = document.createElement("span");
                wrapper.classList.add("wrapper");
                let prevSource = text.slice(index, mark.start.index - line.from);
                let source = text.slice(mark.start.index - line.from, mark.end.index - line.from);
                content.appendChild(document.createTextNode(prevSource));
                let el = document.createElement("span");
                el.classList.add(mark.role);
                el.innerText = source;
                wrapper.append(el);
                content.appendChild(wrapper);
                mark.wrapper = wrapper;

                if (mark.role === "math") {
                    wrapper.classList.remove("editingSource");
                    for (let sc of this.editor?.input?.caret?.carets || [])
                        if (sc.position.index >= mark.start.index + !mark.start.stickLeftOnInsert && sc.position.index <= mark.end.index - !!mark.end.stickLeftOnInsert) {
                            wrapper.classList.add("editingSource");
                            break;
                        }
                    if (mark.IM == undefined) mark.IM = document.createElement("span");
                    let IM = mark.IM;
                    IM.classList.add("IM");
                    mark.IM = IM;
                    IM.mark = mark;
                    IM.source = source;
                    let promise = window.MathJax.tex2svgPromise(source, { display: false });
                    promises.push(promise);
                    promise.then(node => {
                        IM.replaceChildren(node);
                        // window.MathJax.startup.document.clear();
                        // window.MathJax._.mathjax.mathjax.handleRetriesFor(() => window.MathJax.startup.document.updateDocument());
                        el.after(IM);
                        let currentColor = getComputedStyle(node).getPropertyValue("color");
                        if (!node.matches(".wrapper.editingSource *")) for (let e of node.querySelectorAll("[fill]")) e.setAttribute("fill", currentColor);
                    });
                }

                index = mark.end.index - line.from;
            }

            content.appendChild(document.createTextNode(text.slice(index)));
            (afterBullet || line.element).replaceChildren(content);
            let endChar = document.createElement("span");
            endChar.classList.add("endChar");
            endChar.innerHTML = " ";
            (afterBullet || line.element).appendChild(endChar);
            if (line.decos.has("math")) {
                this.handleDM(line);
            }
        }

        if (caretChanged && !marksChanged && !textChanged) {
            for (let mark of line.marks.filter(e => e.role === "math" && e.wrapper && !e.deleted)) {
                let wrapper = mark.wrapper;
                wrapper.classList.remove("editingSource");
                for (let sc of this.editor?.input?.caret?.carets || [])
                    if (sc.position.index >= mark.start.index + !mark.start.stickLeftOnInsert && sc.position.index <= mark.end.index - !!mark.end.stickLeftOnInsert) {
                        wrapper.classList.add("editingSource");
                        break;
                    }
            }
        }

        if (line.decos.has("math") && caretChanged) {
            let hide = true;
            for (let sc of this.editor.input?.caret?.carets || []) {
                if (sc.position.index >= line.from && sc.position.index <= line.to) {
                    hide = false;
                    break;
                }
            }
            hide ? this.hideLine(line) : this.revealLine(line);
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

        requestAnimationFrame(() => this.renderInfo());

        if (promises.length > 0) {
            return new Promise((res, _) => {
                Promise.all(promises).then(_ => {
                    requestAnimationFrame(() => { res() });
                });
            });
        }

        return new Promise((res, _) => {
            requestAnimationFrame(() => { res() });
        });
    }

    hideLine(line) {
        line.element.classList.add("hidden");
    }

    revealLine(line) {
        line.element.classList.remove("hidden");
    }
}

const newRender = ({ editor } = {}) => {
    const render = new Render(editor);

    return render;
}

export default newRender;
