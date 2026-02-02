import newChange from "./changes.js";
import { nodeSizes } from "../assets.js";
import { nodeAt } from "../assets.js";
import newHistory from "./history.js";

const previousSibling = (obj) => {
    if (obj.deleted) return null;
    let depth = 0, node = obj;
    while (node.parent && node.parent.children[0] === node) {
        node = node.parent;
        depth++;
    }
    if (!node.parent) {
        return; // reached doc => last node in its layer
    }
    node = node.parent.children[node.parent.children.indexOf(node) - 1];
    while (depth) {
        node = node.children.at(-1);
        depth--;
    }

    if (node == undefined) return null;
    return node;
}

const nextSibling = (obj) => {
    if (obj.deleted) return null;
    let depth = 0, node = obj;
    while (node.parent && node.parent.children.at(-1) === node) {
        node = node.parent;
        depth++;
    }
    if (!node.parent) return; // reached doc => last node in its layer
    node = node.parent.children[node.parent.children.indexOf(node) + 1];
    while (depth) {
        node = node.children[0];
        depth--;
    }

    if (node == undefined) return null;
    return node;
}

const defineSmartProperties = (Class, properties) => {
    for (let name in properties) {
        Object.defineProperty(Class.prototype, name, {
            get: function() {
                if (this["_update" + name] !== this._updates) {
                    this["_last" + name] = properties[name](this);
                    this["_update" + name] = this._updates;
                }

                return this["_last" + name];
            }
        });
    }
}

class Node {
    constructor({ editor, parent, children = [] } = {}) { // changed, chars, text, lines, parent, children
        this.isNode = true;
        this._updates = 1;

        this.editor = editor;
        if (parent) this.parent = parent;
        this.children = children;
        for (let child of this.children) child.assignParent(this);

        this.size = nodeSizes.node;
    }

    update() {
        this._updates++;
        this.parent?.update();
    }

    delete() {
        this.deleted = true;
        this.children = [];
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.update();
    }

    assignParent(parent) {
        this.parent = parent;
    }

    addChild(child, index = -1) {
        if (index === -1) this.children.push(child);
        else this.children = [...this.children.slice(0, index), child, ...this.children.slice(index)];
        child.assignParent(this);
    }

    prependChild(child) {
        this.children.unsift(child);
        child.assignParent(this);
    }

    get Lines() {
        let nodes = [this];
        while (!nodes[0].isLine) nodes = nodes.map(node => node.children).flat();

        return nodes;
    }

    get isTooSmall() {
        return this.children.length < this.size.min;
    }

    get isTooLarge() {
        return this.children.length > this.size.max;
    }

    get previousSibling() {
        return previousSibling(this);
    }

    get nextSibling() {
        return nextSibling(this);
    }
}

const nodeProperties = {
    chars: function(obj) {
        let chars = 0
        for (let child of obj.children) chars += child.chars;
        return chars;
    },

    lines: function(obj) {
        if (obj.children[0]?.isLine) return obj.children.length;

        let lines = 0;
        for (let child of obj.children) lines += child.lines;
        return lines;
    },

    words: function(obj) {
        let words = 0;
        for (let child of obj.children) words += child.words;
        return words;
    },

    text: function(obj) {
        return obj.children.map(e => e.text).join("\n");
    },
}
defineSmartProperties(Node, nodeProperties);

export { Node }

class Leaf extends Node {
    constructor(...args) {
        super(...args);
        this.isLeaf = true;

        this.size = nodeSizes.leaf;
    }
}
export { Leaf }

class Doc extends Node {
    constructor(...args) {
        super(...args)
        this.isDoc = true;
        this.history = newHistory(this.editor);

        this.change = newChange({ editor: this.editor });
        this.size = { min: 0, max: Infinity };
    }

    parseMarks() {
        for (let i = 0; i < this.lines; i++) this.line(i).parseMarks();
    }

    line(lineNum) {
        lineNum = Math.max(0, lineNum);
        lineNum = Math.min(this.lines - 1, lineNum);

        let sum = 0, currentNode = this;
        while (!currentNode.children[0].isLine) {
            for (let child of currentNode.children) {
                if (sum + child.lines <= lineNum) {
                    sum += child.lines;
                } else {
                    currentNode = child;
                    break;
                }
            }
        }

        return currentNode.children[lineNum - sum];
    }

    lineAt(index) {
        let sum = 0, currentNode = this;
        while (!currentNode.isLine) {
            for (let child of currentNode.children) {
                if (sum + child.chars <= index) {
                    sum += child.chars
                } else {
                    currentNode = child;
                    break;
                }
            }
        }

        return currentNode;
    }

    linesBetween(line1, line2) { // ends excluded
        // if (!line1.parent) {
        //     line1 = this.line(line1);
        //     line2 = this.line(line2);
        // }
        //
        // let lines1 = [], lines2 = []; // lines from front and from end
        // let node1 = line1, node2 = line2;
        // while (node1.parent !== node2.parent) {
        //     let Lines1 = node1.Lines, Lines2 = node2.Lines;
        //     lines1.push(...Lines1.slice(Lines1.indexOf(line1) + 1));
        //     lines2.push(...Lines2.slice(0, Lines2.indexOf(line2)));
        //
        //     node1 = node1.parent, node2 = node2.parent;
        // }
        //
        // console.log({ node1 });
        // let Lines = node1.parent.Lines;
        // return lines1.concat(Lines.slice(Lines.indexOf(node1) + 1, Lines.indexOf(node2))).concat(lines2.reverse());

        let lines = [];
        for (let i = line1 + 1; i < line2; i++) lines.push(this.line(i));
        return lines;
    }

    charAt(index) {
        let line = this.lineAt(index);
        return line.text.slice(index - line.from, index - line.from + 1) || " ";
    }

    textBetween(from, to) {
        if (from >= to) return "";

        let line1 = this.lineAt(from), line2 = this.lineAt(to);
        if (line1 === line2) return line1.text.slice(from - line1.from, to - line1.from);

        let text = line1.text.slice(from - line1.from);
        for (let i = line1.number + 1; i < line2.number; i++) text += "\n" + this.line(i).text;
        text += "\n" + line2.text.slice(0, to - line2.from);

        return text;
    }
}

export { Doc }

class Line {
    constructor({ editor, parent, text = "", tabs = { full: 0 }, decos = [], marks = [] } = {}) {
        this.isLine = true;
        this.editor = editor;
        this.text = text;
        this.parent = parent;
        this.tabs = { full: tabs?.full || 0 };
        this.decos = new Set(decos);
        this.marks = marks; // for now, while doc is not ready
        this.lines = 1;

        this.unrenderedChanges = new Set(["text", "tabs", "decos", "marks"]);
        this.positions = [];

        this._updates = 1;
    }

    assignParent(parent) {
        this.parent = parent;
    }

    parseMarks() {
        this.marks = this.marks.map(e => new Mark(this.editor, e));
        // this.marks = this.marks.map(e => new Range(
        //     this.editor,
        //     new Position(e.from, this.editor.doc),
        //     new Position(e.to, this.editor.doc),
        //     { role: e.role }
        // ));
    }

    update(text = "") {
        this.unrenderedChanges.add("text");
        this.text = text;
        this._updates++;
        this.parent.update();
    }

    delete() {
        this.deleted = true;
        for (let mark of this.marks) this.deleteMark(mark);
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.update();
    }

    addPosition(position) {
        if (this.positions.length === 0 || this.positions.at(-1).index <= position.index) {
            this.positions.push(position);
            return;
        }

        for (let i in this.positions) {
            if (this.positions[i].index > position.index) {
                this.positions = [...this.positions.slice(0, i), position, ...this.positions.slice(i)];
                break;
            }
        }
    }

    removePosition(position) {
        let index = this.positions.indexOf(position);
        if (index !== -1) this.positions = [...this.positions.slice(0, index), ...this.positions.slice(index + 1)];
    }

    get number() {
        if (!this.parent) return;

        let line = this.parent.children.indexOf(this);

        let currentNode = this.parent;
        while (currentNode.parent) {
            for (let sibling of currentNode.parent.children) {
                if (sibling == currentNode) break;
                line += sibling.lines;
            }

            currentNode = currentNode.parent;
        }

        return line;
    }

    assignElement(element) {
        this.element = element;
    }

    addDeco(deco, { addToHistory = true } = {}) {
        let startState = { line: this.number, decos: Array.from(this.decos) };
        let decos = Array.isArray(deco) ? deco : [deco];
        for (let deco of decos) {
            this.unrenderedChanges.add("deco");
            this.decos.add(deco)
        }
        let endState = { line: this.number, decos: Array.from(this.decos) };
        if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
    }

    removeDeco(deco, { addToHistory = true } = {}) {
        let startState = { line: this.number, decos: Array.from(this.decos) };
        let decos = Array.isArray(deco) ? deco : [deco];
        for (let deco of decos) {
            this.unrenderedChanges.add("deco");
            this.decos.delete(deco);
        }
        let endState = { line: this.number, decos: Array.from(this.decos) };
        if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
    }

    toggleDeco(deco, { addToHistory = true } = {}) {
        let startState = { line: this.number, decos: Array.from(this.decos) };
        let decos = Array.isArray(deco) ? deco : [deco];
        for (let deco of decos) {
            this.unrenderedChanges.add("deco");
            this.decos.has(deco) ? this.decos.delete(deco) : this.decos.add(deco);
        }
        let endState = { line: this.number, decos: Array.from(this.decos) };
        if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
    }

    setDecos(decos, { addToHistory = true } = {}) {
        let startState = { line: this.number, decos: Array.from(this.decos) };
        this.unrenderedChanges.add("deco");
        for (let deco of this.decos) if (!decos.includes(deco)) this.decos.delete(deco);
        for (let deco of decos) this.decos.add(deco);
        let endState = { line: this.number, decos: Array.from(this.decos) };
        if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
    }

    setTabs(type, number) {
        this.unrenderedChanges.add("tabs");
        this.tabs[type] = Math.max(number, 0);
    }

    addMark(Mark) {
        this.marks.push(Mark);
        this.unrenderedChanges.add("marks");
    }

    addNewMark(mark) {
        let marks = Array.isArray(mark) ? mark : [mark];
        for (let mark of marks) this.marks.push(new Mark(this.editor, mark));
        this.unrenderedChanges.add("marks");
    }

    removeMark(Mark) {
        let index = this.marks.indexOf(Mark);
        if (index === -1) return;
        this.marks = [...this.marks.slice(0, index), ...this.marks.slice(index + 1)];
    }

    deleteMark(mark) {
        let marks = Array.isArray(mark) ? mark : [mark];
        for (let mark of marks) {
            if (!this.marks.includes(mark)) continue;

            let index = this.marks.indexOf(mark);
            this.marks = this.marks.slice(0, index).concat(this.marks.slice(index + 1));
            mark.delete();
        }
        this.unrenderedChanges.add("marks");
    }

    get from() {
        if (!this.parent) return;

        let sum = 0;
        let currentNode = this;
        while (currentNode.parent) {
            for (let sibling of currentNode.parent.children) {
                if (sibling == currentNode) {
                    currentNode = currentNode.parent;
                    break;
                }

                sum += sibling.chars;
            }
        }

        return sum;
    }

    get to() {
        return this.from + this.chars - 1;
    }

    get Lines() {
        return [this];
    }

    get previousSibling() {
        return previousSibling(this);
    }

    get nextSibling() {
        return nextSibling(this);
    }
}

const lineProperties = {
    chars: function(obj) {
        return obj.text.length + 1;
    },

    words: function(obj) {
        return obj.text.split(" ").length;
    },
}
defineSmartProperties(Line, lineProperties);

export { Line }


class Position {
    constructor(pos, doc = window.doc, { stickWhenDeleted = true, stickLeftOnInsert = false, caret, track = true } = {}) {
        this.isPosition = true;
        this.doc = doc;
        this.stickWhenDeleted = stickWhenDeleted;
        this.stickLeftOnInsert = stickLeftOnInsert;
        if (caret) this.caret = caret;
        this.track = track;
        this.assign(pos);
    }

    assign(pos) {
        if (!Array.isArray(pos)) { // pos is absolute index
            let index = pos;

            let sum = 0, currentNode = this.doc, counter = 0;
            while (!currentNode.isLine) {
                if (currentNode.children.length === 0) continue;
                for (let child of currentNode.children) {
                    if (sum + child.chars <= index) {
                        sum += child.chars;
                    } else {
                        currentNode = child;
                        break;
                    }
                }
                counter++;
                if (counter > 10) break;
            }

            this.Line = currentNode;
            this.column = index - sum;
        } else { // pos is [line, column]
            let [line, column] = pos;

            let sum = 0, currentNode = this.doc;
            while (!currentNode.isLine) {
                for (let child of currentNode.children) {
                    if (sum + child.lines <= line) {
                        sum += child.lines;
                    } else {
                        currentNode = child;
                        break;
                    }
                }
            }

            this.Line = currentNode;
            this.column = column;
        }

        if (this.track) this.Line.addPosition(this);
    }

    get index() {
        let index = this.column;
        let node = this.Line;

        while (node.parent) {
            for (let sibling of node.parent.children) {
                if (sibling == node) break;
                index += sibling.chars;
            }

            node = node.parent;
        }

        return index;
    }

    get line() {
        return this.Line.number;
    }

    handleMarkReassignment(pos, changedAt, inserted) { // TODO
        if (!this.range || !this.range.isMark || !this.pair) return;
        if (changedAt == undefined || inserted == undefined) return;
        if (changedAt > Math.max(this.index, this.pair.index)) changedAt = 1;
        else if (changedAt < Math.min(this.index, this.pair.index)) changedAt = -1;
        else changedAt = 0;

        if (inserted) {
            if (changedAt == -1) return; // text inserted before mark
            if (changedAt == 1) return; // text inserted after mark

            // text inserted inside mark
            if (pos > this.Line.to) {
                // this.stickLeftOnInsert = true;
                return this.Line.to;
            }

            return;
        }
    }

    reassign(pos) {
        if (pos === this.index) return this;
        if (this.Line) this.Line.removePosition(this);
        this.assign(pos);

        return this;
    }

    delete() {
        this.Line.removePosition(this);
        this.deleted = true;
        if (this.range && !this.range.deleted) {
            this.range.delete();
            this.range = undefined;
        }
    }

    addToRange(range, pair) {
        this.range = range;
        this.pair = pair;
    }
}

export { Position }

class Range {
    constructor(editor, from, to, { role = "selection" } = {}) {
        this.isRange = true;
        // console.log("range created from", from, "to", to);
        this.editor = editor;
        this.doc = editor.doc;
        if (from > to) [from, to] = [to, from];
        this.from = from;
        this.to = to;
        this.role = role;
        from.addToRange(this, to);
        to.addToRange(this, from);
    }

    reassignCallback() {
        if (this.role !== "selection") return;
        if (!this.Range) return;
        let maybeReveal = this.Range.collapsed;
        this.Range.setStart(...nodeAt(this.start));
        this.Range.setEnd(...nodeAt(this.end));
        if (maybeReveal && !this.Range.collapsed) {
            this.editor.render.selection.revealRange(this);
        } if (!maybeReveal && this.Range.collapsed) {
            this.editor.render.selection.hideRange(this);
        }
    }

    get collapsed() {
        return this.from?.index !== this.to?.index;
    }

    get start() {
        return this.from?.index <= this.to?.index ? this.from : this.to;
    }

    get end() {
        let bigger = this.from?.index <= this.to?.index ? this.to : this.from;
        let addOne = this.role === "selection" && this.editor.input.caret.style !== "bar";
        if (addOne) {
            return new Position(bigger.index + 1, this.editor.doc, { track: false });
        } else return bigger;
    }

    get text() {
        return this.editor.doc.textBetween(this.start, this.end);
    }

    delete() {
        if (this.Range) this.editor.render.selection.removeRange(this);
        this.from = undefined;
        this.to = undefined;
        this.deleted = true;
    }
}

export { Range }

class Mark extends Range {
    constructor(editor, { from, to, role = "math" } = {}) {
        super(
            editor,
            new Position(from, editor.doc, { stickLeftOnInsert: true }),
            new Position(to, editor.doc),
            { role },
        )
        this.isMark = true;
    }

    delete() {
        this.from.Line.removeMark(this);
        this.deleted = true;
        this.from.delete();
        this.to.delete();
        this.from = undefined;
        this.to = undefined;
    }

    reassign(from, to, { changedTo } = {}) {
        console.log("reassigning mark", this, this.from.index, this.to.index, from, to);
        if (from === this.from.index && to === this.to.index || from == undefined && to == undefined) return;
        let initialFrom = this.from.index, initialTo = this.to.index, initialLine = this.from.Line;
        let inserted = to > this.to.index,
            sliding = (from !== undefined && from !== this.from.index),
            shrinking = ((to || this.to.index) - (from || this.from.index)) < (this.to.index - this.from.index);
        // sliding and shrinking can be true at the same time!

        // <Inserted>
        if (inserted && sliding) {
            console.log("sliding right");
            this.from.reassign(from);
            this.to.reassign(to);
            if (this.from.Line !== initialLine) {
                console.log("updating mark's line", initialLine, this.from.Line);
                initialLine.removeMark(this);
                this.from.Line.addMark(this);
            }
            return;
        }

        if (inserted && !sliding) {
            console.log("expanding");
            this.to.reassign(Math.min(this.to.Line.to, to));
            return;
        }
        // </Inserted>

        // <Deleted>
        if (sliding) {
            console.log("sliding left");
            this.from.reassign(from);
            this.to.reassign(to);
            if (this.from.Line !== initialLine) {
                console.log("updating mark's line", initialLine, this.from.Line);
                initialLine.removeMark(this);
                this.from.Line.addMark(this);
            }

            let closestMark = this.from.Line.marks.filter(e => e !== this && e.to.index <= this.from.index).sort((a, b) => b.from.index - a.from.index)[0];
            if (closestMark != undefined && closestMark.to.index == this.from.index) {
                if (closestMark.role === this.role) { // merge
                    console.log("merging marks");
                    let start = closestMark.from.index;
                    closestMark.delete();
                    this.from.reassign(start);
                } else { // make sure writing into both marks at the same time is impossible
                    console.log("keeping distance");
                    this.from.stickLeftOnInsert = false;
                }
            }
        }

        if (shrinking) {
            console.log("shrinking");
            this.to.reassign(to);
            if (this.from.index == this.to.index
                && (!this.from.stickLeftOnInsert || this.to.stickLeftOnInsert || sliding || changedTo > initialTo)) {
                console.log("deleting mark");
                this.delete(this);
            }
        }
        // </Deleted>
    }

    reassignCallback(changedAt, inserted, changedTo) {
        if (changedAt == undefined || inserted == undefined) return; // called by the same mark's previous reassignCallback: mergin marks
        this.from.Line.unrenderedChanges.add("marks");
        if (inserted) return;
        if (this.to.Line !== this.from.Line) return;

        // if overlapping with same type, merge
        let merged = (() => {
            if (changedAt > this.from.index) return; // can't have slid left if change happened after from
            let marksToLeft = this.from.Line.marks.filter(e => e !== this && e.end.index <= this.from.index);
            let closestMarkToLeft = marksToLeft.sort((e, f) => f.end.index - e.end.index)[0];
            if (closestMarkToLeft == undefined || closestMarkToLeft.end.index < this.from.index || closestMarkToLeft.role !== this.role) return;
            console.log("merging same role marks", closestMarkToLeft, this);
            let startIndex = closestMarkToLeft.from.index;
            closestMarkToLeft.delete();
            this.from.reassign(startIndex);
            return true;
        })();

        if (merged) return;

        // if collapsed, delete self
        if (changedAt === this.from.index && this.to.index <= changedTo && this.to.index > this.from.index) {
            console.log("could delete", this.to.index, changedTo, this.from.stickLeftOnInsert, this.to.stickLeftOnInsert);
            if (this.to.index < changedTo || !this.from.stickLeftOnInsert || this.to.stickLeftOnInsert) {
                console.log("deleting mark ", this.editor.doc.textBetween(this.from.index, this.to.index));
                this.from.Line.deleteMark(this);

                return;
            }
        }
    }
}
