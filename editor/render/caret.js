const getCharIndexAt = (element, x, y) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let index = 0;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const text = node.nodeValue;

        let prevX;
        for (let i = 0; i <= text.length; i++) {
            const range = document.createRange();
            range.setStart(node, i);
            range.setEnd(node, i);

            const rect = range.getBoundingClientRect();
            if (!rect) continue;
            if (i == 0) {
                prevX = rect.right;
                continue;
            }

            // Check if point is within this rect
            if (y >= rect.top && y <= rect.bottom && x <= rect.right) {
                return index + i - (x - prevX < rect.right - x ? 1 : 0);
            }
            prevX = rect.right;
        }
        index += text.length;
    }

    return element.innerText == " " ? 0 : index; // not between any two characters, returning last possible position
}

class Caret {
    constructor(editor, textarea = editor.render.textarea, doc = editor.doc, style = "bar") {
        this.editor = editor;

        const caretElement = document.createElement("div");
        caretElement.classList.add("caret");
        document.body.appendChild(caretElement);
        this.element = caretElement;
        this.textarea = textarea;
        this.doc = doc;
        this.style = style;
    }

    placeAt(index = this.position) {
        if (index < 0 || index >= this.doc.chars) return;

        this.position = index;
        let line = this.doc.lineAt(this.position);
        let textNode = line.element.firstChild;
        let column = this.position - line.from;

        const range = document.createRange();
        range.setStart(textNode, column);
        range.setEnd(textNode, column);

        const rects = range.getClientRects();
        if (rects.length > 0) {
            const rect = rects[0];
            // Position the cursor
            this.element.style.top = rect.top + window.scrollY + "px";
            this.element.style.left = rect.left + window.scrollX + "px";
            this.element.style.height = rect.height + "px";
        }
    }

    placeAtCoordinates(lineElement, x, y) {
        this.placeAt(lineElement.Line.from + getCharIndexAt(lineElement, x, y));
    }

    moveHorizontally(distance) {
        this.placeAt(this.position + distance);
    }
}

export default Caret;
