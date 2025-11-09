import { nodeAt } from "../assets.js";

class Selection {
    constructor(editor, textarea = editor.render.textarea) {
        this.editor = editor;
        this.textarea = textarea;
        this.doc = editor.doc;

        this.ranges = new Set();
        this.highlight = new Highlight();
        CSS.highlights.set("selection", this.highlight);
    }

    parseRange(range) {
        let r = document.createRange();
        r.setStart(...nodeAt(range.start));
        r.setEnd(...nodeAt(range.end));
        range.Range = r;

        return r;
    }

    setRanges(ranges = []) {
        this.highlight.clear();
        this.ranges = new Set();
        for (let range of ranges) {
            this.highlight.add(this.parseRange(range));
        }
    }

    addRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.ranges.add(range);
            this.highlight.add(this.parseRange(range));
        }
    }

    removeRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.ranges.delete(range);
            this.highlight.delete(range.Range);
        }
    }

    hideRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.highlight.delete(range.Range);
        }
    }

    revealRange(ranges) {
        if (!Array.isArray(ranges)) ranges = [ranges];
        for (let range of ranges) {
            this.highlight.add(range.Range);
        }
    }
}

export default Selection;
