import { Position, Range } from "../doc/classes.js";

// const getCharIndexAt = (element, x, y) => {
//     const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
//     let index = 0;
//
//     while (walker.nextNode()) {
//         const node = walker.currentNode;
//         const text = node.nodeValue;
//
//         let prevX;
//         for (let i = 0; i <= text.length; i++) {
//             const range = document.createRange();
//             range.setStart(node, i);
//             range.setEnd(node, i);
//
//             const rect = range.getBoundingClientRect();
//             if (!rect) continue;
//             if (i == 0) {
//                 prevX = rect.right;
//                 continue;
//             }
//
//             // Check if point is within this rect
//             if (y >= rect.top && y <= rect.bottom && x <= rect.right) {
//                 return index + i - (x - prevX < rect.right - x ? 1 : 0);
//             }
//             prevX = rect.right;
//         }
//         index += text.length;
//     }
//
//     return -1;
//     return index - 1; // not between any two characters, returning last possible position
// }

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
        if (keepFixedEnd !== -1) keepFixedEnd ? this.addFixedEnd() : this.removeFixedEnd(); // -1: don't change, false: remove, true: add
        // if (hideMath && this.position.Line.decos.has("math")) this.editor.render.hideLine(this.position.Line);
        let renderLines = [];
        if (index !== this.position.index) {
            this.position.Line.unrenderedChanges.add("caret");
            renderLines.push(this.position.Line);
        }
        // this.editor.render.renderLine(this.position.Line);
        // if (index !== this.position.index && this.editor.input.caret.carets.map(c => c.position.index).includes(index)) {
        //     this.editor.input.caret.removeCaret(this.editor.input.caret.carets.indexOf(this));
        // }

        if (index < 0 || index >= this.doc.chars) return;

        this.position.reassign(index);
        if (hideMath && this.position.Line.decos.has("math")) this.editor.render.revealLine(this.position.Line);
        this.position.Line.unrenderedChanges.add("caret");
        if (renderLines[0] !== this.position.Line) renderLines.push(this.position.Line);
        let promises = renderLines.map(line => this.editor.render.renderLine(line));
        await Promise.all(promises);
        let line = this.position.Line;

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
                            // this.element.innerHTML = this.editor.doc.charAt(this.position.index);
                            // let styles = getComputedStyle(line.element);
                            // this.element.style.lineHeight = styles.getPropertyValue("line-height");
                            // this.element.style.fontSize = styles.getPropertyValue("font-size");
                            // this.element.style.fontWeight = styles.getPropertyValue("font-weight");
                            // this.element.style.textTransform = styles.getPropertyValue("text-transform");
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
            if (scrollY - this.screenPosition.y > -200) this.editor.elements.editor.scrollTo({ behavior: "smooth", top: this.screenPosition.y - 200 });
            else if (scrollY + window.innerHeight - this.screenPosition.y - this.screenPosition.height < 200) this.editor.elements.editor.scrollTo({ behavior: "smooth", top: this.screenPosition.y + this.screenPosition.height - window.innerHeight + 200 });
        }

        // this.element.scrollIntoView({ behavior: "smooth", block: "nearest" });
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
        this.position = this.fixedEnd;
        this.fixedEnd = pos;
        this.placeAt(this.position.index, { keepFixedEnd: true });
    }

    // placeAtCoordinates(lineElement, x, y, updateScreenX = true, alternativeLineElement) {
    //     let charIndex = getCharIndexAt(lineElement, x, y);
    //     if (charIndex === -1) {
    //         if (alternativeLineElement) {
    //             this.placeAtCoordinates(alternativeLineElement, x, y, updateScreenX);
    //             return;
    //         }
    //
    //         charIndex = lineElement.innerText.length - 1;
    //     }
    //
    //     this.placeAt(lineElement.Line.from + charIndex, updateScreenX, true);
    // }

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
        linesToReveal.includes(line) || !line.decos.has("math") ? editor.render.revealLine(line) : editor.render.hideLine(line);
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
            if (prevLine.decos.has("math")) this.editor.render.hideLine(prevLine);
            if (newLine.decos.has("math")) this.editor.render.revealLine(newLine);
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

    // addTabStops(pos, index = 1, append = false) {
    //     let positions = pos.map(e => new Position(e, this.doc));
    //     if (append) {
    //         this.tabstops[index].push(...positions);
    //         return;
    //     }
    //     if (index === 0) this.tabstops.unshift(positions);
    //     else if (index === -1) this.tabstops.push(positions);
    //     else this.tabstops = [...this.tabstops.slice(0, index), positions, ...this.tabstops.slice(index)];
    //     console.log("tabstops added", this.tabstops.map(e => e.map(b => b.index)));
    // }
    //
    // removeTabStops() {
    //     console.log("removing tabstops");
    //     for (let tabstops of this.tabstops) {
    //         for (let tabstop of tabstops) {
    //             if (tabstop !== this.tabstops[0][0]) tabstop.delete();
    //         }
    //     }
    //     this.tabstops = [[this.tabstops[0][0]]];
    // }

    // getCaretPositionAt(x, y) {
    //     let node, offset;
    //     if (document.caretPositionFromPoint) {
    //         let pos = document.caretPositionFromPoint(x, y);
    //         console.log({ pos });
    //         node = pos.offsetNode;
    //         offset = pos.offset;
    //     } else if (document.caretRangeFromPoint) {
    //         let range = document.caretRangeFromPoint(x, y);
    //         console.log({ range });
    //         node = range.startContainer;
    //         offset = range.startOffset;
    //     }
    //
    //     let lineElement = node;
    //     while (lineElement.parentNode && lineElement.parentNode !== this.editor.input.textarea) lineElement = lineElement.parentNode;
    //
    //     let column = 0;
    //     const walker = document.createTreeWalker(lineElement, NodeFilter.SHOW_TEXT);
    //     while (walker.nextNode()) {
    //         let current = walker.currentNode;
    //         if (current === node) {
    //             column += offset;
    //             break;
    //         } else column += current.textContent.length;
    //     }
    //
    //     return { node, offset, line: lineElement.Line, column };
    // }
}

export default Caret;
