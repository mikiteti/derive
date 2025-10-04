import newChange from "./changes.js";
import { nodeSizes } from "../assets.js";

const previousSibling = (obj) => {
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
        if (obj.children[0].isLine) return obj.children.length;

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

        this.size = nodeSizes.leaf;
    }
}
export { Leaf }

class Doc extends Node {
    constructor(...args) {
        super(...args)

        this.change = newChange({ editor: this.editor });
        this.size = { min: 0, max: Infinity };
    }

    line(lineNum) {
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

    linesBetween(line1, line2) { // ends excluded, TODO
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
}

export { Doc }

class Line {
    constructor({ editor, text, parent, tabs, decos }) {
        this.editor = editor;
        this.text = text;
        this.parent = parent;
        this.tabs = { full: tabs?.full || 0 };
        this.decos = decos;
        this.lines = 1;
        this.isLine = true;

        this._updates = 1;
    }

    assignParent(parent) {
        this.parent = parent;
    }

    update(text = "") {
        this.text = text;
        this._updates++;
        this.parent.update();
    }

    delete() {
        this.deleted = true;
        this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.update();
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
    constructor(pos, doc = window.doc) {
        if (!Array.isArray(pos)) { // pos is absolute index
            let index = pos;

            let sum = 0, currentNode = doc;
            while (!currentNode.isLine) {
                for (let child of currentNode.children) {
                    if (sum + child.chars <= index) {
                        sum += child.chars;
                    } else {
                        currentNode = child;
                        break;
                    }
                }
            }

            [this.Line, this.column] = [currentNode, index - sum];
        } else { // pos is [line, column]
            let [line, column] = pos;

            let sum = 0, currentNode = doc;
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

            [this.Line, this.column] = [currentNode, column];
        }
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
}

export { Position }
