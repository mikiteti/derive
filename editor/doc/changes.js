const merge = (node1, node2, removed) => {
    for (let child of node2.children) node1.addChild(child);
    removed.push(node2);
    node2.delete();
}

const mergeOrBorrow = (node1, node2) => { // node2 = node1.nextSibling & one of them has to be proper (not too small, not too large)
    if (node1 == undefined || node2 == undefined) return [];
    if (node1.nextSibling !== node2 && node2.previousSibling !== node1) console.error("not proper siblings", node1, node2, "proper siblins of them:", node1.nextSibling, node2.previousSibling);

    // console.log("merging or borrowing between", node1, node2);
    if (node1.children.length + node2.children.length <= node1.size.max) {
        // console.log("had to merge ", node1, node2);
        for (let child of node2.children) node1.addChild(child);
        node1.update();
        node2.children = [];
        node2.delete();

        return [node2.parent];
    } else {
        // console.log("had to borrow between ", node1, node2);
        let children1 = Math.floor((node1.children.length + node2.children.length) / 2);

        while (node1.children.length < children1) {
            node1.addChild(node2.children.shift());
        }

        while (node1.children.length > children1) {
            node2.prependChild(node1.children.pop());
        }

        node1.update();
        node2.update();
        return [];
    }
}

const splitNode = (node) => {
    let nodeChildren = []; // how many children each node will have
    let children = node.children.length;
    while (children) {
        let nextChildren = Math.min(children, node.size.max);
        if (children > node.size.max && children - node.size.max < node.size.min) nextChildren = Math.ceil(children / 2);
        nodeChildren.push(nextChildren);
        children -= nextChildren;
    }
    // console.log({ nodeChildren });

    let childrenProcessed = 0;
    for (let i in nodeChildren) {
        let children = node.children.slice(childrenProcessed, childrenProcessed + nodeChildren[i]);
        childrenProcessed += nodeChildren[i];
        nodeChildren[i] = children;
    }

    // console.log(node);
    // console.log([...node.children]);
    // console.log([...nodeChildren]);
    // console.log(nodeChildren.length);
    let newNodes = nodeChildren.slice(1).map(children => new node.constructor({ editor: node.editor, parent: node.parent, children }));
    node.children = node.children.slice(0, nodeChildren[0].length);
    let indexOfNode = node.parent.children.indexOf(node);
    node.parent.children = [...node.parent.children.slice(0, indexOfNode + 1), ...newNodes, ...node.parent.children.slice(indexOfNode + 1)];
}

class Change {
    constructor(editor) {
        this.editor = editor;

        this.callbacks = [];
        this.emptyCallbackList();
        this.stickLeft = [];
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    runCallbacks(callbackList = this.callbackList) {
        let changedLines = callbackList.changedLines;
        for (let callback of this.callbacks) callback(this.editor, changedLines);
        this.emptyCallbackList();
    }

    emptyCallbackList() {
        this.callbackList = { changedLines: new Set() };
    }

    completeCallbackList(callbackList) {
        for (let line of callbackList.changedLines) this.callbackList.changedLines.add(line);
    }

    delete(from, to = from + 1, { noCallback = false, markStickLeft = false, addToHistory = true } = {}) {
        if (from === to) return [];
        if (from > to) [from, to] = [to, from];
        from = Math.max(from, 0);
        to = Math.min(to, this.editor.doc.chars - 1);


        const startState = {
            carets: this.editor.input.caret.carets.map(e => e.fixedEnd != undefined ? [e.position.index, e.fixedEnd.index] : e.position.index),
            text: this.editor.doc.textBetween(from, to),
            at: from,
        };

        let line1 = this.editor.doc.lineAt(from), line2 = this.editor.doc.lineAt(to);
        let positionsToShift = line2.positions.filter(e => e.index >= to).map(e => [e, e.index - (to - from)]);
        let positionsToMaybeDelete = [line1, ...this.editor.doc.linesBetween(line1.number, line2.number), line2]
            .map(e => e.positions).flat()
            .filter(e => e.index >= from && e.index < to);

        if (line1 == line2) {
            let text = line1.text.substring(0, from - line1.from) + line1.text.substring(to - line1.from);
            line1.update(text);

            for (let pos of positionsToShift) {
                // let changeOutside = !!pos[0].range?.isMark && positionsToShift.map(e => e[0]).indexOf(pos[0].pair) !== -1;
                pos[0].reassign(pos[1], { changedAt: from, inserted: false });
            }

            if (markStickLeft) this.stickLeft = line1.positions.filter(e => (e.index === from && positionsToShift.map(e => e[0]).indexOf(e) === -1));
            for (let pos of positionsToMaybeDelete) pos.stickWhenDeleted ? pos.reassign(from) : pos.delete();

            let changedLines = [line1];
            if (!noCallback) this.runCallbacks({ changedLines });
            else this.completeCallbackList({ changedLines });
            const endState = {
                carets: this.editor.input.caret.carets.map(e => e.fixedEnd != undefined ? [e.position.index, e.fixedEnd.index] : e.position.index),
                text: "",
                at: from,
            };
            if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
            return changedLines;
        }

        let newText = line1.text.substring(0, from - line1.from) + line2.text.substring(to - line2.from);
        if (from === line1.from) { // if first line is deleted completely, keep last line's decos
            let line1decos = [], line2decos = [];
            for (let deco of line1.decos) line1decos.push(deco);
            for (let deco of line2.decos) line2decos.push(deco);
            line1.removeDeco(line1decos, { addToHistory });
            line1.addDeco(line2decos, { addToHistory });
        }

        line1.update(newText);

        for (let pos of positionsToShift) {
            // let changeOutside = !!pos[0].range?.isMark && positionsToShift.map(e => e[0]).indexOf(pos[0].pair) !== -1;
            pos[0].reassign(pos[1], { changedAt: from, inserted: false });
        }
        for (let pos of positionsToMaybeDelete) pos.stickWhenDeleted ? pos.reassign(from) : pos.delete();

        let linesToRemove = this.editor.doc.linesBetween(line1.number, line2.number).concat([line2]);
        // console.log({ linesToRemove: linesToRemove.map(line => line.text) });
        for (let line of linesToRemove) line.setDecos([], { addToHistory });
        for (let line of linesToRemove) line.delete();

        let removedChildren = linesToRemove;
        while (removedChildren[0]?.parent?.parent) { // deleting empty ancestors
            let parents = [];
            for (let child of removedChildren) if (parents.at(-1) !== child.parent && child.parent.children.length == 0) parents.push(child.parent);

            removedChildren = [];
            for (let parent of parents) {
                if (parent.children.length === 0) {
                    removedChildren.push(parent);
                    parent.delete();
                    continue;
                }
            }
        }

        let changedLayers = [[line1.parent, line2.parent]];
        while (changedLayers[0][0].parent?.parent) changedLayers.unshift(changedLayers[0].map(n => n.parent));

        for (let changedNodes of changedLayers) {
            while (changedNodes.length && changedNodes[0].parent) {
                changedNodes = changedNodes.filter(n => n.isTooSmall);
                if (changedNodes.length == 0) break;
                if (changedNodes[1] && changedNodes[0] == changedNodes[1]) changedNodes.pop();
                let newChanged = [];
                newChanged = newChanged.concat(mergeOrBorrow(changedNodes[0].previousSibling, changedNodes[0]));
                if (changedNodes.length > 1) newChanged = newChanged.concat(mergeOrBorrow(changedNodes[1], changedNodes[1].nextSibling));

                changedNodes = newChanged;
            }
        }

        let changedLines = [line1, ...linesToRemove];
        if (!noCallback) this.runCallbacks({ changedLines });
        else this.completeCallbackList({ changedLines });
        const endState = {
            carets: this.editor.input.caret.carets.map(e => e.fixedEnd != undefined ? [e.position.index, e.fixedEnd.index] : e.position.index),
            text: "",
            at: from,
        };
        if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
        return changedLines;
    }

    insert(string, at, { noCallback = false, stickLeft = false, preserveDM = true, addToHistory = true } = {}) {
        const startState = {
            carets: this.editor.input.caret.carets.map(e => e.fixedEnd != undefined ? [e.position.index, e.fixedEnd.index] : e.position.index),
            text: "",
            at: at,
        };

        if (string === "") return [];
        if (at.index) at = at.index;

        // console.log(`inserting "${string}" at ${at}`);
        let positionsToShift = this.editor.doc.lineAt(at).positions.filter(e => {
            if (e.range && e.range.isMark && e.range.end === e && e.index === e.Line.to && !preserveDM) return false;
            return stickLeft || e.stickLeftOnInsert || this.stickLeft.indexOf(e) !== -1 ?
                e.index > at :
                e.index >= at
        }).map(e => [e, e.index + string.length]);
        this.stickLeft = [];

        let lines = string.split("\n");
        if (lines.length == 1) {
            let line = this.editor.doc.lineAt(at);
            let text = line.text.substring(0, at - line.from) + string + line.text.substring(at - line.from);
            line.update(text);

            for (let pos of positionsToShift) {
                // let changeOutside = !!pos[0].range?.isMark && positionsToShift.map(e => e[0]).indexOf(pos[0].pair) !== -1;
                pos[0].reassign(pos[1], { changetdAt: at, inserted: true });
            }

            let changedLines = [line]
            if (!noCallback) this.runCallbacks({ changedLines });
            else this.completeCallbackList({ changedLines });
            const endState = {
                carets: this.editor.input.caret.carets.map(e => e.fixedEnd != undefined ? [e.position.index, e.fixedEnd.index] : e.position.index),
                text: string,
                at: at,
            };
            if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
            return changedLines;
        }

        let firstLine = this.editor.doc.lineAt(at), text = firstLine.text;
        let firstInsert = lines[0];
        lines.shift();
        let lastInsert = lines.at(-1);
        lines.pop();
        if (lines.at(-1) === "") lines.pop();
        let shiftLineDecosToLastLine = firstLine.from == at;

        let strings = [text.slice(0, at - firstLine.from) + firstInsert, ...lines, lastInsert + text.slice(at - firstLine.from)];
        firstLine.update(strings[0]);
        strings.shift();

        let Lines = strings.map(str => new firstLine.constructor({ editor: this.editor, text: str, parent: firstLine.parent }));
        let index = firstLine.parent.children.indexOf(firstLine) + 1;
        for (let Line of Lines) {
            Line.parent.addChild(Line, index);
            index++;
        }

        let node = firstLine.parent;
        while (node && node.parent) {
            if (node.isTooLarge) {
                // console.log("splitting node", node, node.children.length);
                splitNode(node);
            } else break;
            node = node.parent;
        }

        for (let pos of positionsToShift) {
            let initialLine = pos[0].Line;
            // let changeOutside = !!pos[0].range?.isMark && positionsToShift.map(e => e[0]).indexOf(pos[0].pair) !== -1;
            pos[0].reassign(pos[1], { changedAt: at, inserted: true });
            if (pos[0].caret) {
                initialLine.unrenderedChanges.add("caret");
                this.editor.render.renderLine(initialLine);
            }
        }

        let changedLines = [firstLine, ...Lines]
        if (preserveDM && string === "\n" && firstLine.decos.has("math")) changedLines[1].addDeco("math");
        if (shiftLineDecosToLastLine) for (let deco of firstLine.decos) {
            firstLine.removeDeco(deco);
            Lines.at(-1).addDeco(deco);
        }
        if (!noCallback) this.runCallbacks({ changedLines });
        else this.completeCallbackList({ changedLines });
        const endState = {
            carets: this.editor.input.caret.carets.map(e => e.fixedEnd != undefined ? [e.position.index, e.fixedEnd.index] : e.position.index),
            text: string,
            at: at,
        };
        if (addToHistory) this.editor.doc.history.addChange({ from: startState, to: endState });
        return changedLines;
    }

    replace(text, from, to = from, { noCallback = false, preserveDM = true, addToHistory = true } = {}) {
        if (from > to) [from, to] = [to, from];
        let changedLines = [...this.delete(from, to, { noCallback, markStickLeft: text.length > 0, addToHistory }), ...this.insert(text, from, { noCallback, preserveDM, addToHistory })];
        return changedLines;
    }

    multiInsert(inserts) { // [{at: Position, string: string}]
        let changedLines = new Set();
        for (let insert of inserts) {
            let changed = this.insert(insert.string, insert.at.index);
            for (let c of changed) changedLines.add(c);
        }

        this.runCallbacks({ changedLines });
        return changedLines;
    }

    noCallback(change) {
        if (!change.text && !change.insert) return this.delete(change.from, change.to, { noCallback: true });

        if (change.to) return this.replace(change.text || change.insert, change.from, change.to, { noCallback: true });
        else return this.insert(change.text || change.insert, change.from || change.at, { noCallback: true });
    }
}

const newChange = ({ editor } = {}) => {
    const change = new Change(editor);

    return change;
}

export default newChange;
