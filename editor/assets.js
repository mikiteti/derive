import { Position } from "./doc/classes.js";

const nodeSizes = {
    leaf: { min: 16, initial: 32, max: 64 },
    node: { min: 16, initial: 32, max: 64 },
};

const checkTreeStructure = (doc) => {
    let errorCounter = 0;
    let checkNode = (node) => {
        if (node.isTooSmall) {
            console.error(node, "is too small!!!");
            errorCounter++;
            return;
        } else if (node.isTooLarge) {
            console.error(node, "is too large!!!");
            errorCounter++;
            return;
        }

        for (let child of node.children || []) checkNode(child);
    }
    checkNode(doc);

    if (errorCounter === 0) console.log("%c Nothing to see here, everything is conducting themselves", "color: green; font-weight: bold");
}

const showTreeStructure = (doc) => { // TODO
    function drawTree(node, prefix = "", isLast = true) {
        let output = "";

        // Choose the proper branch connector
        const connector = prefix === ""
            ? ""                             // root has no connector
            : (isLast ? "└─ " : "├─ ");

        // Print the current node
        output += prefix + connector + node.text + "\n";

        // Prepare new prefix for children
        const newPrefix = prefix + (isLast ? "   " : "│  ");

        // Recurse into children (if any)
        if (!node.isLine) {
            node.children.forEach((child, i) => {
                const last = i === node.children.length - 1;
                output += drawTree(child, newPrefix, last);
            });
        }

        return output;
    }


    console.log(drawTree(doc));
}

const checkSpeed = () => {
    let abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':.".split("").concat(Array(10).fill("\n"));
    const N = 100000;
    console.time();
    for (let i = 0; i < N; i++) {
        window.doc.change.insert(abc[Math.floor(Math.random() * abc.length)], Math.floor(Math.random() * window.doc.chars));
        // window.input.keyboard.command({ key: abc[Math.floor(Math.random() * abc.length)] })();
    }
    console.log(`Time for ${N} Doc edits:`);
    console.timeEnd();
    console.time();
    for (let line of window.doc.Lines) {
        window.render.renderLine(line);
    }
    console.log(`Time for ${window.doc.lines} renders:`);
    console.timeEnd();
}
window.checkSpeed = checkSpeed;

const getColumnAt = (element, x, y, { style = "bar" } = {}) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let index = 0;

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
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
                return index + i - ((x - prevX < rect.right - x || style !== "bar") ? 1 : 0);
            }
            prevX = rect.right;
        }
        index += text.length;
    }

    return index - 1 - (style !== "bar"); // not between any two characters, returning last possible position
}

// const findFirstRectBorder = (node, from = 0, to = node.textContent.length) => {
//     let range = document.createRange();
//     range.setStart(node, from);
//     range.setEnd(node, to);
//     let rects = range.getClientRects();
//     if (rects.length < 2) return undefined;
//
//     let min = from, max = to;
//     while (max - min > 1) {
//         let current = Math.floor((min + max) / 2);
//         range.setEnd(node, current);
//         rects = range.getClientRects();
//         rects.length > 1 ? max = current : min = current;
//     }
//
//     return min;
// }
//
// const findRectBorders = (node) => {
//     let borders = [];
//     let firstBorder = findFirstRectBorder(node, 0, node.textContent.length);
//     while (firstBorder !== undefined) {
//         borders.push(firstBorder);
//         firstBorder = findFirstRectBorder(node, firstBorder + 1, node.textContent.length);
//     }
//
//     return borders;
// }
//
// const findXInRect = (x, node, from, to) => {
//     const range = document.createRange();
//     let min = from, max = to;
//     range.setStart(node, min);
//     range.setEnd(node, max);
//     let rects = range.getClientRects(), rect = rects[rects.length - 1];
//     while (max - min > 1) {
//         let current = Math.floor((min + max) / 2);
//         range.setStart(node, min);
//         range.setEnd(node, current);
//
//         rects = range.getClientRects();
//         rect = rects[rects.length - 1];
//         (rect.left <= x && rect.right >= x) ? max = current : min = current;
//     }
//
//     return rect.right - x > x - rect.left ? min : max;
// }
//
// const getColumnsAtX = (element, x) => {
//     const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
//     let columns = [];
//     let currentColumn = 0;
//     while (walker.nextNode()) {
//         const node = walker.currentNode;
//         let rectBorders = findRectBorders(node);
//         rectBorders.unshift(0);
//         rectBorders.push(node.textContent.length);
//         let range = document.createRange();
//         range.setStart(node, 0);
//         range.setEnd(node, node.textContent.length);
//         let rects = range.getClientRects();
//         console.log({ rects });
//         for (let i = 0; i < rects.length; i++) {
//             let rect = rects[i];
//             if (rect.left <= x && rect.right >= x) {
//                 columns.push(findXInRect(x, node, rectBorders[i], rectBorders[i + 1]) + currentColumn);
//             }
//         }
//
//         currentColumn += node.textContent.length;
//     }
//
//     return columns;
// }

const getLineBreaks = (line, nodes) => {
    if (nodes == undefined) {
        const walker = document.createTreeWalker(line.element, NodeFilter.SHOW_TEXT);
        nodes = [];
        while (walker.nextNode()) {
            let textNode = walker.currentNode;
            if (textNode.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
            nodes.push(textNode);
        }
    }

    const lineBreaks = [];

    const range = document.createRange();

    for (let i = 1; i < line.text.length; i++) {
        let nodeAt1 = _nodeAt(nodes, i - 1);
        let nodeAt2 = _nodeAt(nodes, i);
        range.setStart(...nodeAt1);
        range.setEnd(...nodeAt2);
        let Rects = range.getClientRects();
        if (Rects.length > 1 && nodeAt1[0] === nodeAt2[0]) { // TODO: what if new node starts right at the beggining of a new line
            lineBreaks.push(i - 1);
        } else if (Rects.length > 1 && Rects[0].left > Rects[1].left && Rects[0].bottom < Rects[1].top) lineBreaks.push(i);
    }

    // let counter = 0, prevRects = 1;
    // for (let node of nodes) {
    //     for (let i = 0; i < node.textContent.length; i++) {
    //         range.setEnd(node, i);
    //         let rects = range.getClientRects().length;
    //         if (rects > prevRects) {
    //             lineBreaks.push(counter - 1);
    //             prevRects = rects;
    //         }
    //
    //         counter++;
    //     }
    // }

    return lineBreaks; // relative to line.from
}

const _nodeAt = (nodes, index) => {
    let i = 0;
    for (let node of nodes) {
        if (node.textContent.length + i > index) return [node, index - i];
        i += node.textContent.length;
    }

    return [nodes.at(-1), nodes.at(-1).textContent.length];
}

const nodeAt = (pos) => {
    let nodes = [], index = pos.index - pos.Line.from;
    const walker = document.createTreeWalker(pos.Line.element, NodeFilter.SHOW_TEXT);
    nodes = [];
    while (walker.nextNode()) {
        let textNode = walker.currentNode;
        if (textNode.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
        nodes.push(textNode);
    }

    let i = 0;
    for (let node of nodes) {
        if (node.textContent.length + i > index) return [node, index - i];
        i += node.textContent.length;
    }

    return [nodes.at(-1), nodes.at(-1).textContent.length];
}

const findXInVisualLine = (x, nodes, from, to) => {
    // console.log({ x, nodes, from, to });
    let min = from, max = to;
    let range = document.createRange();
    range.setStart(..._nodeAt(nodes, min));
    range.setEnd(..._nodeAt(nodes, max));

    let Rects = range.getClientRects();
    let rects = [];
    for (let rect of Rects) if (rect.width !== 0) rects.push(rect);
    if (rects.length && rects[0].left > x) return min;
    if (rects.at(-1).right < x) return max - 1;
    let lastUpdate = false;
    while (max - min > 1 && !lastUpdate) {
        if (max - min <= 1) lastUpdate = true;
        let current = Math.floor((min + max) / 2);
        range.setStart(..._nodeAt(nodes, min));
        range.setEnd(..._nodeAt(nodes, current));
        Rects = range.getClientRects();
        rects = [];
        for (let rect of Rects) if (rect.width !== 0) rects.push(rect);
        // console.log(rects);
        if (rects.length && rects[0].left <= x
            && rects.at(-1).right >= x) max = current;
        else min = current;
    }

    // console.log("no, did the whole binary search: ", (rects.at(-1)?.right - x > x - rects[0]?.left) ? min : Math.min(max, to - 1));
    return (rects.at(-1)?.right - x > x - rects[0]?.left)
        ? min
        : Math.min(max, to - 1);
}

const findXIndecesInLine = (x, line) => { // works even when height: 0; transform: scaleY(0)
    if (line.chars === 1) return [line.from];

    const indeces = [];

    const walker = document.createTreeWalker(line.element, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
        let textNode = walker.currentNode;
        if (textNode.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
        nodes.push(textNode);
    }

    let linebreaks = getLineBreaks(line, nodes);
    linebreaks.unshift(0);
    linebreaks.push(line.chars);

    for (let i = 0; i < linebreaks.length - 1; i++) {
        let from = linebreaks[i], to = linebreaks[i + 1];
        indeces.push(findXInVisualLine(x, nodes, from, to) + line.from);
    }

    // console.log({ indeces });
    return indeces;
}

const getVisualLineAt = (position, editor) => {
    let line = position.Line || editor.doc.lineAt(position);
    let index = position.index;
    if (index == undefined) index = position;
    let linebreaks = getLineBreaks(line);
    linebreaks.unshift(0);
    linebreaks.push(line.chars);

    let from, to;
    for (let linebreak of linebreaks) {
        if (line.from + linebreak <= index) from = line.from + linebreak;
        if (to == undefined && line.from + linebreak > index) to = line.from + linebreak - 1;
    }

    return { from, to };
}

const exportFile = (editor = window.editor) => {
    let content = [];
    for (let i = 0; i < editor.doc.lines; i++) {
        let line = editor.doc.line(i);
        let decos = [];
        for (let deco of line.decos) decos.push(deco);
        let marks = line.marks.map(e => ({ role: e.role, from: e.from.index, to: e.to.index }));
        let myLine = {};
        if (line.text.length) myLine.text = line.text;
        if (line.tabs) myLine.tabs = line.tabs;
        if (decos.length) myLine.decos = decos;
        if (marks.length) myLine.marks = marks;

        content.push(myLine);
    }

    console.log(content);
    return content;
}
window.exportFile = exportFile;

export { nodeSizes, checkTreeStructure, showTreeStructure, getColumnAt, findXIndecesInLine, getVisualLineAt, exportFile, nodeAt };
