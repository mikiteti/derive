import { nodeInLineAtColumn } from "../assets.js";

const filterRects = (Rects) => {
    // console.log({ Rects });
    let rects = [];
    for (let rect of Rects) rects.push({ left: rect.left, top: rect.top, height: rect.height, width: rect.width });
    rects = rects.filter(e => e.height > 0 && e.width > 0);
    if (rects.length == 0) return rects;
    let minHeight = rects.reduce((a, b) => b.height < a.height ? b : a).height;
    rects = rects.filter(e => e.height < minHeight * 1.5);

    let newRects = [];
    // console.log({ rects });
    for (let i = 0; i < rects.length; i++) {
        let overlaps = false;
        let a = rects[i];
        for (let j = 0; j < i; j++) {
            let b = rects[j];
            if (!(a.left + a.width - 2 <= b.left || b.left + b.width - 2 <= a.left || a.top + a.height - 2 <= b.top || b.top + b.height - 2 <= a.top)) {
                overlaps = true;
                // console.log(`${i} and ${j} overlap`, a, b);
                break;
            }
        }
        if (!overlaps) {
            newRects.push(a);
            // console.log(`copying ${i} to newrects`);
        }
    }
    rects = newRects;
    // console.log({ newRects });

    let heights = rects.map(e => e.height), commonHeights = {};
    for (let height of heights) commonHeights[height] ? commonHeights[height]++ : commonHeights[height] = 1;
    let commonHeight = heights[0];
    for (let height of heights) if (commonHeights[height] > commonHeights[commonHeight]) commonHeight = height;
    for (let rect of rects) {
        rect.top = (rect.top + rect.height / 2) - commonHeight / 2;
        rect.height = commonHeight;
    }


    return rects;
}

class Selection {
    constructor(editor) {
        this.editor = editor;
        this.textarea = editor.elements.textarea;
        this.doc = editor.doc;

        this.ranges = new Set();
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
        for (let range of this.ranges) {
            if (range.deleted) {
                this.ranges.delete(range);
                continue;
            }
            let from = range.start.index, to = range.end.index;
            if (to > line.from && from <= line.to) { // range is to be rendered
                if (line.element.selection == undefined) {
                    let sel = document.createElement("div");
                    sel.classList.add("selectionWrapper");
                    line.element.selection = sel;
                }
                line.element.appendChild(line.element.selection);

                let visualRange = new Range();
                visualRange.setStart(...nodeInLineAtColumn(line, Math.max(range.start.index - line.from, 0)));
                visualRange.setEnd(...nodeInLineAtColumn(line, Math.min(range.end.index - line.from, line.chars)));
                let rects = filterRects(visualRange.getClientRects());
                let lineRect = line.element.getBoundingClientRect();
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
