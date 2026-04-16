import Selection from "./selection.js";
import { getUrl, isLineInViewport, getViewportMargins } from "../assets.js";

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
        this.editorElement = this.editor.elements.editor;

        editor.doc.change.addCallback(renderChangedLines);
        queueMicrotask(() => {
            editor.doc.change.addCallback(renderCarets);
        });

        this.decos = ["underline", "bold", "Bold", "italic", "highlight", "math", "center", "small", "large", "capital", "spin_border", "h1", "h2", "h3", "h4", "h5", "h6", "subtitle", "link"];
        this.selection = new Selection(editor);

        this.renderedLines = new Set();

        // moved here instead of input, because there is no input in reader mode
        requestAnimationFrame(() => {
            console.log("adding scroll event listener to ", this.editor.elements.editor, this.editor.elements.editor.isConnected);
            let yCoord = this.editor.elements.editor.scrollTop;
            this.editor.elements.editor.addEventListener("scroll", () => {
                let delta = Math.abs(this.editor.elements.editor.scrollTop - yCoord);
                if (window.scrollByCaret) return;
                if (delta > window.innerHeight / 2) {
                    this.renderAll();
                    yCoord = this.editor.elements.editor.scrollTop;
                }
            });
        });
    }

    renderInfo() {
        if (!this.editor.interactive) return;
        const doc = this.editor.doc;
        let curCommand = this.editor.input?.keyboard?.curCommand || "";
        if (curCommand) curCommand = " " + curCommand;
        this.editor.elements.rightInfo.innerHTML = `L${doc.lines.toLocaleString()} W${doc.words.toLocaleString()} C${doc.chars.toLocaleString()}` + curCommand;

        let mode = { "n": "Normal", "i": "Insert", "v": "Visual", "vLine": "V-Line", "vBlock": "V-Block", "c": "Command" };
        this.editor.elements.leftInfo.innerHTML = mode[this.editor.input?.keyboard?.curMode] || "";
    }

    placeElement(line) {
        let notInDOMBefore = !line.element?.isConnected;

        const placeWidgets = () => {
            if (lineElement.imgWrapper) lineElement.after(lineElement.imgWrapper);
            if (lineElement.DM) lineElement.after(lineElement.DM);
        }

        let lineElement = line.element || this.createLineElement(line);
        let previousLine = line.previousSibling;
        while (previousLine) {
            if (previousLine.element?.isConnected) break;
            previousLine = previousLine.previousSibling;
        }
        if (previousLine) {
            let DM = previousLine.element.DM, imgWrapper = previousLine.element.imgWrapper;
            if (!document.contains(DM)) DM = undefined;
            if (!document.contains(imgWrapper)) imgWrapper = undefined;

            if (DM && (imgWrapper == undefined || imgWrapper.compareDocumentPosition(DM) == Node.DOCUMENT_POSITION_FOLLOWING)) {
                DM.after(lineElement);
                placeWidgets();
                return notInDOMBefore;
            }
            if (imgWrapper) {
                imgWrapper.after(lineElement);
                placeWidgets();
                return notInDOMBefore;
            }

            previousLine.element.after(lineElement);
            placeWidgets();
            return notInDOMBefore;
        }

        let nextLine = line.nextSibling;
        while (nextLine) {
            if (nextLine.element?.isConnected) break;
            nextLine = nextLine.nextSibling;
        }
        if (nextLine) {
            nextLine.element.before(lineElement);
            placeWidgets();
            return notInDOMBefore;
        }

        this.textarea.appendChild(lineElement);
        placeWidgets();

        return notInDOMBefore;
    }

    createLineElement(line) {
        let lineElement = document.createElement("p");
        lineElement.classList.add("line");
        if (line.decos.has("math") || line.decos.has("link")) this.hideLine(line);

        lineElement.Line = line;
        line.assignElement(lineElement);

        return lineElement;
    }

    renderAll(scrollY = this.editorElement.scrollTop) {
        const doc = this.editor.doc;

        let firstRenderedLine = [...this.renderedLines].reduce((a, b) => a.number < b.number ? a : b, 0);
        let initialOffset = firstRenderedLine.verticalOffset, initialScrollTop = this.editorElement.scrollTop;
        let firstLine = doc.lineAtHeight(scrollY - getViewportMargins());

        for (let line of this.renderedLines) if (!isLineInViewport(line, scrollY)) this.unrenderLine(line);
        this.editor.elements.spacer.style.height = firstLine.verticalOffset + "px";
        this.textarea.style.height = (doc.height - firstLine.verticalOffset) + "px";
        // document.documentElement.style.setProperty("--firstRenderedLine", firstLine.number);

        let i = firstLine.number, promises = [];
        while (i < doc.lines && isLineInViewport(doc.line(i), scrollY)) {
            let line = doc.line(i);
            if (!this.renderedLines.has(line)) {
                let promise = this.renderLine(line, { scrollY });
                if (promise !== undefined) {
                    promises.push(promise);
                }
            }

            i++;
        }
        this.viewport = { from: firstLine.number, to: i - 1 };
        console.log("rendered all", this.viewport);

        requestAnimationFrame(() => this.renderInfo());

        // promises.forEach(p => {
        //     p.then(() => {
        //         let delta = firstRenderedLine.verticalOffset - initialOffset;
        //         requestAnimationFrame(() => {
        //             this.editorElement.scrollTo({ top: delta + initialScrollTop, behavior: "" });
        //         });
        //     })
        // });
        window.scrollAdjustmentPromise = new Promise(async res => {
            await Promise.all(promises);
            window.renderPromises = undefined;
            let delta = firstRenderedLine.verticalOffset - initialOffset;

            queueMicrotask(() => {
                if (delta) this.editorElement.scrollBy(0, delta, { behavior: "auto" });
                console.log("tiny render scrolling", delta);
                requestAnimationFrame(res);
            });
        });
        // Promise.all(promises).then(() => {
        //     console.log("rendering done");
        //     window.renderPromises = undefined;
        //     let delta = firstRenderedLine.verticalOffset - initialOffset;
        //     window.scrollAdjustmentPromise = new Promise(res => {
        //         queueMicrotask(() => {
        //             if (delta) this.editorElement.scrollBy(0, delta, { behavior: "auto" });
        //             console.log("tiny render scrolling");
        //             requestAnimationFrame(res);
        //         });
        //     });
        // });

        window.renderPromises = promises;
        return promises;
    }

    async handleDM(line) {
        await window.MathJax.startup.promise;

        if (!line.decos.has("math") || line.deleted) {
            if (!line.element?.DM) return;
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
            DM.onscroll = () => { window.state.touchStart = undefined; };
            line.element.after(DM);

            return window.MathJax._.mathjax.mathjax.handleRetriesFor(async () => { // fantastic! the right solution.
                DM.replaceChildren(window.MathJax.tex2svg(line.text, { display: true }));
                line.visualUpdate();
                await window.MathJax.startup.document.outputJax.font.loadDynamicFiles(); // without this, weird glyphs are rendered in another font 
            });
        } else {
            if (line.text === line.element.DM.source) return;
            line.element.DM.source = line.text;

            return window.MathJax.tex2svgPromise(line.text, { display: true }).then(node => { // render async on change
                if (window.state.settings.renderErrors || !node.querySelector('[data-mjx-error], mjx-merror, [fill="red"], [stroke="red"]')) {
                    line.element.DM.replaceChildren(node);
                    line.visualUpdate();
                }
            });
        }
    }

    async handleLink(line) {
        if (!line.decos.has("link") || line.deleted) {
            if (!line.element.imgWrapper) return;
            queueMicrotask(_ => {
                line.element.imgWrapper.remove();
                line.element.imgWrapper = undefined;
            });

            return;
        }

        if (!line.element.imgWrapper) { // create img element
            let wrapper = document.createElement("div");
            line.element.imgWrapper = wrapper;
            wrapper.classList.add("imgWrapper");

            let editButton = document.createElement("button");
            editButton.classList.add("editButton");
            editButton.innerHTML = "Edit";
            wrapper.appendChild(editButton);

            let img = document.createElement("img");
            wrapper.appendChild(img);
            line.element.img = img;
            img.Line = line;
            img.element = line.element;
            img.alt = "Link unavailable";
            img.addEventListener("error", _ => {
                img.src = `img/404.png`;
            });
            let url = getUrl(line.text.trim());
            img.src = url.href;
            wrapper.setAttribute("url", url.attachmentUrl);
            line.element.after(wrapper);

            return new Promise(res => {
                img.addEventListener("load", res);
            });
        } else {
            let url = getUrl(line.text.trim());
            if (url.href === line.element.img.src) return;
            line.element.img.src = url.href;
            line.element.imgWrapper.setAttribute("url", url.attachmentUrl);
            line.element.imgWrapper.attachmentEditor?.destroy();

            return new Promise(res => {
                line.element.img.addEventListener("load", res);
            });
        }
    }

    unrenderLine(line) {
        line.isRendered = false;
        line.element?.remove();
        line.element?.DM?.remove();
        line.element?.imgWrapper?.remove();
        line.element?.selection?.remove();
        if (line.element) line.element.selection = undefined;

        line.isRendered = true;
        this.renderedLines.delete(line);
    }

    renderLine(line, { scrollY } = {}) {
        if (!line.deleted && !isLineInViewport(line, scrollY)) return;

        let promises = [];

        if (line.deleted) {
            if (line.element?.DM) line.element.DM.remove();
            if (line.element?.imgWrapper) line.element.imgWrapper.remove();
            line.element?.remove();
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
            if (["• ", "– ", "∘ ", "- "].includes(text.slice(0, 2))) {
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
                    promises.push(new Promise(async res => {
                        let node = await promise;
                        IM.replaceChildren(node);
                        el.after(IM);
                        let currentColor = getComputedStyle(node).getPropertyValue("color");
                        if (!node.matches(".wrapper.editingSource *")) for (let e of node.querySelectorAll("[fill]")) e.setAttribute("fill", currentColor);
                        res();
                    }));
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
                let promise = new Promise(async res => {
                    await this.handleDM(line);
                    res();
                });
                promises.push(promise);
            }
            if (line.decos.has("link")) {
                let promise = new Promise(async res => {
                    await this.handleLink(line);
                    res();
                });
                promises.push(promise);
            }
        }

        if (caretChanged) {
            let caret = this.editor?.input?.caret?.carets[0];
            if (caret !== undefined) {
                // if (caret.position.index >= line.from && caret.position.index <= line.to) {
                //     line.element.classList.add("caretInside");
                //     document.documentElement.style.setProperty("--caretLineNum", line.number + 1);
                //     line.element.setAttribute("lineNum", String(line.number + 1));
                // } else line.element.classList.remove("caretInside");
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

        if ((line.decos.has("math") || line.decos.has("link")) && caretChanged) {
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
            // line.element.style.paddingLeft = `calc(${line.tabs.full} * var(--tab-full-width))`;
            line.element.style.setProperty("--tabs", line.tabs.full);
        }

        if (line.unrenderedChanges.delete("deco")) {
            for (let deco of this.decos) {
                if (line.decos.has(deco)) line.element.classList.add(deco);
                else line.element.classList.remove(deco);
            }
            if (!line.decos.has("math") && !line.decos.has("link")) this.revealLine(line); // TODO: check
            let promise = new Promise(async res => {
                await this.handleDM(line);
                res();
            });
            promises.push(promise);
            promise = new Promise(async res => {
                await this.handleLink(line);
                res();
            });
            promises.push(promise);
        }

        let renderRanges = this.placeElement(line);
        line.visualUpdate();
        Promise.all(promises).then(() => {
            line.isRendered = true;
            line.visualUpdate();
            this.renderedLines.add(line);
            if (renderRanges) this.selection.renderRanges(line);
        });

        requestAnimationFrame(() => this.renderInfo());

        return Promise.all(promises);
    }

    hideLine(line) {
        line.element?.classList.add("hidden");
        line.visualUpdate();
    }

    revealLine(line) {
        line.element?.classList.remove("hidden");
        line.visualUpdate();
    }
}

const newRender = ({ editor } = {}) => {
    const render = new Render(editor);

    return render;
}

export default newRender;
