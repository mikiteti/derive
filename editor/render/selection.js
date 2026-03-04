import { nodeAt } from "../assets.js";
import { Position } from "../doc/classes.js";

function createTextWalker(root) {
    return document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                // if (!node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
                // if (node.parentElement.matches(".mjx-container *")) return NodeFilter.FILTER_REJECT;

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
}

function getRectsFromIndices(root, startIndex, endIndex) {
    const walker = createTextWalker(root);

    let currentIndex = 0;
    const results = [];
    let node;

    while (node = walker.nextNode()) {
        const length = node.nodeValue.length;
        const nodeStart = currentIndex;
        const nodeEnd = currentIndex + length;

        // skip nodes outside selection
        if (nodeEnd <= startIndex) {
            currentIndex += length;
            continue;
        }
        if (nodeStart >= endIndex) break;

        const range = document.createRange();

        const startOffset =
            startIndex > nodeStart ? startIndex - nodeStart : 0;

        const endOffset =
            endIndex < nodeEnd ? endIndex - nodeStart : length;

        range.setStart(node, startOffset);
        range.setEnd(node, endOffset);

        results.push(...range.getClientRects());

        currentIndex += length;
    }

    return results;
}

class Selection {
    constructor(editor) {
        this.editor = editor;
        this.textarea = editor.elements.textarea;
        this.doc = editor.doc;

        this.ranges = new Set();
    }

    parsePosition(pos) {
        return new Position(pos, this.editor.doc, { track: false })
    }

    setRanges(ranges = []) {
        this.removeRange(this.ranges);
        this.addRange(ranges);
    }

    addRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.ranges.add(range);
            range.elements = new Set();
        }
    }

    removeRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.ranges.delete(range);
            for (let element of range.elements) {
                range.elements.delete(element);
                element.remove();
            }
        }
    }

    renderRanges(line) {
        if (!line.element?.isConnected) return;
        if (line.element.selection) line.element.selection.innerHTML = "";
        for (let range of this.editor.render.selection.ranges) {
            let from = range.start.index, to = range.end.index;
            if (!(to < line.from || from > line.to)) { // range is to be rendered
                if (line.element.selection == undefined) {
                    let sel = document.createElement("div");
                    line.element.selection = sel;
                }
                // this.editor.elements.selectionLayer.appendChild(line.element.selection);
                line.element.appendChild(line.element.selection);

                let visualRange = new Range();
                visualRange.setStart(...nodeAt(range.start.index < line.from ? this.parsePosition(line.from) : range.start));
                visualRange.setEnd(...nodeAt(range.end.index > line.to ? this.parsePosition(line.to) : range.end));
                let rects = visualRange.getClientRects();
                let lineRect = line.element.getBoundingClientRect();
                // let rects = getRectsFromIndices(line.element, Math.max(0, range.start.index - line.from), Math.min(line.chars, range.start.index - line.from));
                for (let rect of rects) {
                    let sel = document.createElement("div");
                    sel.classList.add("selection");
                    range.elements.add(sel);
                    line.element.selection.appendChild(sel);
                    sel.style.top = rect.top - lineRect.top + "px";
                    sel.style.left = rect.left - lineRect.left + "px";
                    sel.style.width = rect.width + "px";
                    sel.style.height = rect.height + "px";
                }
            }
        }
    }
}

export default Selection;
