import { nodeAt } from "../assets.js";

class Selection {
    constructor(editor) {
        this.editor = editor;
        this.textarea = editor.elements.textarea;
        this.doc = editor.doc;

        this.ranges = new Set();
        this.highlight = window.state.highlight;
    }

    parseRange(range) {
        let r = document.createRange();
        r.setStart(...nodeAt(range.start));
        r.setEnd(...nodeAt(range.end));
        range.Range = r;

        return r;
    }

    setRanges(ranges = []) {
        this.removeRange(this.ranges);
        this.addRange(ranges);
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
