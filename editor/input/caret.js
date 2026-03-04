import { Position, Range } from "../doc/classes.js";
import { getViewportMargins } from "../assets.js";

class SingleCaret {
    constructor(editor, position = 0, { element = this.createElement(editor), autoRender = true } = {}) {
        this.editor = editor;
        this.doc = editor.doc;
        this.position = new Position(position, editor.doc, { caret: this });
        this.screenPosition = {};
        this.element = element;

        if (autoRender) queueMicrotask(() => this.placeAt(undefined, { keepFixedEnd: -1 }));
    }

    createElement(editor = this.editor) {
        const caretElement = document.createElement("div");
        caretElement.classList.add("caret");
        editor.elements.editor.appendChild(caretElement);
        this.element = caretElement;

        return caretElement;
    }

    async placeAt(index = this.position.index, { updateScreenX = true, hideMath = true, keepFixedEnd = false } = {}) {
        for (let i = 0; i < 10; i++) if (window.renderPromises) {
            await Promise.all(window.renderPromises);
        }

        if (keepFixedEnd !== -1) keepFixedEnd ? this.addFixedEnd() : this.removeFixedEnd(); // -1: don't change, false: remove, true: add
        let renderLines = [];
        if (index !== this.position.index) {
            this.position.Line.unrenderedChanges.add("caret");
            renderLines.push(this.position.Line);
        }
        // if (index !== this.position.index && this.editor.input.caret.carets.map(c => c.position.index).includes(index)) {
        //     this.editor.input.caret.removeCaret(this.editor.input.caret.carets.indexOf(this));
        // }

        if (index < 0 || index >= this.doc.chars) return;

        this.position.reassign(index);
        if (hideMath && (this.position.Line.decos.has("math") || this.position.Line.decos.has("link"))) this.editor.render.revealLine(this.position.Line);
        this.position.Line.unrenderedChanges.add("caret");
        if (renderLines[0] !== this.position.Line) renderLines.push(this.position.Line);
        let promises = renderLines.map(line => this.editor.render.renderLine(line));
        await Promise.all(promises);
        let line = this.position.Line;
        let scrollBehavior = "smooth";
        if (!line.element?.isConnected) { // if line is not rendered, scroll there, render everything close to it and only then continue
            scrollBehavior = "auto";
            window.scrollByCaret = true;
            console.log("scrollbycaret set to true, scrolling to", line.verticalOffset - window.innerHeight / 2);
            this.editor.render.renderAll(line.verticalOffset - window.innerHeight / 2);
            console.log(window.renderPromises);
            await Promise.all(window.renderPromises);
            console.log("renderpromises awaited");
            await new Promise(res => requestAnimationFrame(res));
            this.editor.elements.editor.scrollTo({ behavior: "auto", top: Math.max(0, line.verticalOffset - window.innerHeight / 2) });
            requestAnimationFrame(() => {
                console.log("scrollbycaret set to false");
                window.scrollByCaret = false;
            })
            // await new Promise(res => setTimeout(res, 100)); // TODO: get to the bottom of why this is needed
            // await new Promise(res => requestAnimationFrame(res));
        }

        const walker = document.createTreeWalker(line.element, NodeFilter.SHOW_TEXT);
        let column = 0;

        let scrollX = this.editor.elements.editor.scrollLeft;
        let scrollY = this.editor.elements.editor.scrollTop;

        while (walker.nextNode()) {
            let textNode = walker.currentNode;
            if (textNode.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
            let text = textNode.nodeValue;

            let innerColumn = index - line.from - column;
            if (innerColumn >= 0 && innerColumn < text.length) {
                const range = document.createRange();
                range.setStart(textNode, innerColumn);
                range.setEnd(textNode, innerColumn + 1);

                const rects = range.getClientRects();
                if (rects.length > 0) {
                    let rect = rects[0];
                    if (rects.length > 1 && rect.width == 0) rect = rects[1];
                    // Position the cursor

                    // TODO: updateScreenX -- if inline math expands (unknown prior to jumping), X positions shift
                    if (updateScreenX || true) this.screenPosition.x = rect.left + scrollX;

                    this.screenPosition.y = rect.top + scrollY;
                    this.screenPosition.height = rect.height;
                    this.fixedEnd ? this.element.classList.remove("smooth") : this.element.classList.add("smooth");
                    switch (this.editor.input.caret.style) {
                        case "bar":
                            // this.element.innerHTML = "";
                            this.element.style.borderWidth = "0px";
                            this.element.style.backgroundColor = "currentColor";
                            this.element.style.top = rect.top + scrollY + "px";
                            this.element.style.left = rect.left + scrollX + "px";
                            this.element.style.height = rect.height + "px";
                            this.element.style.width = "1px";
                            break;
                        case "wide":
                            this.element.style.borderWidth = "0px";
                            this.element.style.backgroundColor = "currentColor";
                            this.element.style.top = rect.top + scrollY + "px";
                            this.element.style.left = rect.left + scrollX + "px";
                            this.element.style.height = rect.height + "px";
                            this.element.style.width = rect.width + "px";
                            break;
                        case "underline":
                            this.element.style.borderWidth = "0px";
                            this.element.style.backgroundColor = "currentColor";
                            this.element.style.top = rect.top + rect.height * 0.9 - .5 + scrollY + "px";
                            this.element.style.left = rect.left + scrollX + "px";
                            this.element.style.height = "1px";
                            this.element.style.width = rect.width + "px";
                            break;
                        case "overline":
                            this.element.style.borderWidth = "0px";
                            this.element.style.backgroundColor = "currentColor";
                            this.element.style.top = rect.top + rect.height * 0.1 - .5 + scrollY + "px";
                            this.element.style.left = rect.left + scrollX + "px";
                            this.element.style.height = "1px";
                            this.element.style.width = rect.width + "px";
                            break;
                        case "hollow":
                            this.element.style.borderWidth = "1px";
                            this.element.style.backgroundColor = "transparent";
                            this.element.style.top = rect.top - 1 + scrollY + "px";
                            this.element.style.left = rect.left - 1 + scrollX + "px";
                            this.element.style.height = rect.height - 1 + "px";
                            this.element.style.width = rect.width - 1 + "px";
                            break;
                    }
                }
                break;
            }

            column += text.length;
        }

        if (this === this.editor.input.caret.carets[0]) {
            Promise.all(window.renderPromises || []).then(async () => {
                if (window.scrollAdjustmentPromise) await window.scrollAdjustmentPromise;
                scrollY = this.editor.elements.editor.scrollTop;
                if (scrollY - this.screenPosition.y > -200) this.editor.elements.editor.scrollTo({ behavior: scrollBehavior, top: this.screenPosition.y - 200 });
                else if (scrollY + window.innerHeight - this.screenPosition.y - this.screenPosition.height < 200) this.editor.elements.editor.scrollTo({ behavior: scrollBehavior, top: this.screenPosition.y + this.screenPosition.height - window.innerHeight + 200 });
            });
        }
    }

    addFixedEnd(index = this.position.index) {
        if (this.fixedEnd !== undefined) return;

        this.fixedEnd = new Position(index, this.editor.doc);
        this.fixedEnd.caret = this;
        this.range = new Range(this.editor, this.position, this.fixedEnd);
        this.editor.render.selection.addRange(this.range);
    }

    removeFixedEnd() {
        if (this.fixedEnd === undefined) return;

        this.editor.render.selection.removeRange(this.range);
        this.fixedEnd.delete();
        this.fixedEnd = undefined;
        this.range = undefined;
    }

    switchEnds() {
        if (!this.fixedEnd) return;

        let pos = this.position;
        this.position = this.fixedEnd; // TODO: render ranges on lines suddenly visible
        this.fixedEnd = pos;
        this.placeAt(this.position.index, { keepFixedEnd: true });
    }

    delete() {
        let line = this.position.Line;
        line.unrenderedChanges.add("caret");
        this.position.delete();
        this.element.remove();
        queueMicrotask(() => {
            this.editor.render.renderLine(line);
        });
    }

    get from() {
        if (!this.fixedEnd) return this.position.index;
        let pos = this.position.index, fix = this.fixedEnd.index;
        return Math.min(pos, fix);
    }

    get to() {
        if (!this.fixedEnd) return this.position.index + (this.editor.input.caret.style === "bar" ? 0 : 1);
        let pos = this.position.index, fix = this.fixedEnd.index;
        return Math.max(pos, fix) + (this.editor.input.caret.style === "bar" ? 0 : 1);
    }
}

const checkOverlappingCarets = (editor) => {
    let carets = editor.input.caret.carets;
    for (let i = 0; i < carets.length - 1; i++) {
        let index = carets[i].position.index;
        for (let j = i + 1; j < carets.length; j++) {
            if (carets[j].position.index === index) {
                editor.input.caret.removeCaret(i);
                break;
            }
        }
    }
}

const hideMath = (editor, changedLines) => {
    let linesToReveal = editor.input.caret.carets.map(e => e.position.Line);
    for (let line of changedLines) {
        linesToReveal.includes(line) || !(line.decos.has("math") || line.decos.has("link")) ? editor.render.revealLine(line) : editor.render.hideLine(line);
    }
}

class Caret {
    constructor(editor, { autoRender = true, style = "bar" } = {}) {
        this.editor = editor;
        this.carets = [new SingleCaret(editor, 0, { autoRender })];
        this.style = style;

        editor.doc.change.addCallback(checkOverlappingCarets);
        editor.doc.change.addCallback(hideMath);
    }

    changeStyle(style, { keepFixedEnd = -1 } = {}) {
        this.style = style;
        this.placeAllAt(pos => pos.index, { keepFixedEnd, updateScreenX: false });
    }

    forAll(callback) {
        for (let caret of this.carets) callback(caret.position);
    }

    placeAllAt(newPos = pos => pos.index, { updateScreenX = true, keepFixedEnd = false } = {}) {
        let newPositions = [];
        for (let caret of this.carets) {
            let newPlace = newPos(caret.position);
            if (newPlace == undefined) newPlace = caret.position.index;
            newPositions.push(newPlace);
            let prevLine = caret.position.Line, newLine = this.editor.doc.lineAt(newPlace);
            if (prevLine.decos.has("math") || prevLine.decos.has("link")) this.editor.render.hideLine(prevLine);
            if (newLine.decos.has("math") || newLine.decos.has("link")) this.editor.render.revealLine(newLine);
        }
        for (let i in this.carets) this.carets[i].placeAt(newPositions[i], { updateScreenX, hideMath: false, keepFixedEnd });
    }

    changeForAll(getChange, getPos, { keepFixedEnd = false } = {}) {
        for (let caret of this.carets) this.editor.doc.change.noCallback(getChange(caret));
        this.editor.doc.change.runCallbacks();

        if (getPos) this.placeAllAt(getPos, { keepFixedEnd });
    }

    addCaret(index) {
        this.carets.push(new SingleCaret(this.editor, index));
    }

    removeCaret(index) {
        if (index < 0 || index >= this.carets.length) return;
        this.carets[index].delete();
        this.carets = this.carets.slice(0, index).concat(this.carets.slice(index + 1));
    }

    updateCarets(positions) {
        let num = Math.max(positions.length, this.carets.length);
        for (let i = 0; i < num; i++) {
            if (i >= positions.length) this.removeCaret(Math.min(i, this.carets.length - 1));
            else if (i >= this.carets.length) {
                if (Array.isArray(positions[i]) && positions[i].length > 0) {
                    this.addCaret(positions[i][0]);
                    if (positions[i][1] !== undefined) {
                        this.carets[i].removeFixedEnd();
                        this.carets[i].addFixedEnd(positions[i][1]);
                    }
                } else this.addCaret(positions[i]);
            }
            else {
                if (Array.isArray(positions[i]) && positions[i].length > 0) {
                    this.carets[i].placeAt(positions[i][0]);
                    if (positions[i][1] !== undefined) {
                        this.carets[i].removeFixedEnd();
                        this.carets[i].addFixedEnd(positions[i][1]);
                    }
                } else this.carets[i].placeAt(positions[i]); // automatically removes fixedEnd
            }
        }
    }
}

export default Caret;
