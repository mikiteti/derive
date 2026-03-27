import Environment from "../environment.js";

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

const checkSpeed = () => {
    let abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':.".split("").concat(Array(10).fill("\n"));
    const N = 100000;
    console.time();
    for (let i = 0; i < N; i++) {
        window.doc.change.insert(abc[Math.floor(Math.random() * abc.length)], Math.floor(Math.random() * window.doc.chars));
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
    if (!element.isConnected) return 0;
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
            if (y >= rect.top - 4 && y <= rect.bottom + 2 && x <= rect.right) { // characters' boxes don't reach the top of the element
                return index + i - ((x - prevX < rect.right - x || style !== "bar") ? 1 : 0);
            }
            // if (y >= rect.top && y <= rect.bottom && x <= rect.right) {
            //     return index + i - ((x - prevX < rect.right - x || style !== "bar") ? 1 : 0);
            // }
            prevX = rect.right;
        }
        index += text.length;
    }

    return Math.max(0, index - 1 - (style !== "bar")); // not between any two characters, returning last possible position
}

const getLineBreaks = (line, nodes) => {
    if (nodes == undefined) {
        if (!line.element?.isConnected) return [];
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

    let prevRect;
    for (let i = 1; i < line.text.length; i++) {
        let nodeAt1 = _nodeAt(nodes, i - 1);
        let nodeAt2 = _nodeAt(nodes, i);
        range.setStart(...nodeAt1);
        range.setEnd(...nodeAt2);
        let Rects = range.getClientRects();
        if (Rects.length > 1 && nodeAt1[0] === nodeAt2[0]) { // TODO: what if new node starts right at the beggining of a new line
            lineBreaks.push(i - 1);
        } else if (Rects.length > 1 && Rects[0].left > Rects[1].left && Rects[0].bottom < Rects[1].top) lineBreaks.push(i);
        // else if (prevRect && prevRect.left > Rects[0].left && prevRect.bottom < Rects[0].top) lineBreaks.push(i - 1);

        prevRect = Rects[Rects.length - 1];
    }

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

const nodeAt = (pos) => { // takes in only a pos, so always stays before endChar
    let nodes = [], column = pos.column;
    if (!pos.Line.element?.isConnected) return;
    const walker = document.createTreeWalker(pos.Line.element, NodeFilter.SHOW_TEXT);
    nodes = [];
    while (walker.nextNode()) {
        let textNode = walker.currentNode;
        if (textNode.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
        nodes.push(textNode);
    }

    let i = 0;
    for (let node of nodes) {
        if (node.textContent.length + i > column) return [node, column - i];
        i += node.textContent.length;
    }

    return [nodes.at(-1), nodes.at(-1).textContent.length];
}

const nodeInLineAtColumn = (line, column) => { // takes in a line and a column, so it can return with endChar included
    let nodes = [];
    if (!line.element?.isConnected) return;
    const walker = document.createTreeWalker(line.element, NodeFilter.SHOW_TEXT);
    nodes = [];
    while (walker.nextNode()) {
        let textNode = walker.currentNode;
        if (textNode.parentNode.matches("mjx-container *, .IM, .IM *")) continue;
        nodes.push(textNode);
    }

    let i = 0;
    for (let node of nodes) {
        if (node.textContent.length + i > column) return [node, column - i];
        i += node.textContent.length;
    }

    return [nodes.at(-1), nodes.at(-1).textContent.length];
}

const findXInVisualLine = (x, nodes, from, to) => { // TODO: check for edge cases
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
        if (rects.length && rects[0].left <= x
            && rects.at(-1).right >= x) max = current;
        else min = current;
    }

    return (rects.at(-1)?.right - x > x - rects[0]?.left)
        ? min
        : Math.min(max, to - 1);
}

const findXIndicesInLine = (x, line) => { // works even when height: 0; transform: scaleY(0)
    if (line.chars === 1) return [line.from];

    const indices = [];

    if (!line.element?.isConnected) return [line.from];
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
        indices.push(findXInVisualLine(x, nodes, from, to) + line.from);
    }

    return indices;
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

const getDataUri = async (link) => {
    // Use the proxy
    const proxiedUrl = Environment.url + `proxy-image?url=${encodeURIComponent(link)}`;

    // Load image in the DOM
    const img = new Image();
    img.crossOrigin = "anonymous"; // not strictly necessary for same-origin
    img.src = proxiedUrl;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    // Draw to canvas
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    // Get data URI
    return canvas.toDataURL("image/png");
}

const exportToMD = async (editor = window.editor) => {
    let content = ["---"];
    let title = window.state.files.find(e => e.id == editor.fileId)?.name || editor.fileId;
    if (title) content.push(`title: ${title}`);
    let author = window.state.user?.name;
    if (author) content.push(`author: ${author}`);
    let date = new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit"
    }).format(new Date());
    content.push(`date: ${date}
---`);

    for (let i = 0; i < editor.doc.lines; i++) {
        let line = editor.doc.line(i), text = line.text;
        if (text.trim() == "") {
            content.push("");
            continue;
        }
        let insertEmptyLineInFront = false;

        if (["•", "–", "∘"].includes(text.charAt(0))) {
            text = "- " + text.slice(2);
            if (i > 0 && !["•", "–", "∘"].includes(editor.doc.line(i - 1).text.charAt(0)))
                insertEmptyLineInFront = true;
        }

        let decos = line.decos;
        let markSigns = {
            math: ["$", "$"],
            italic: ["*", "*"],
            bold: ["**", "**"],
        }
        let marks = line.marks.sort((a, b) => a.from.index - b.from.index).map(e => [e.start.column, e.end.column, e.role]);
        let offset = 0;
        for (let mark of marks) {
            if (markSigns[mark[2]] == undefined) continue;
            if (mark[0] == mark[1]) continue;
            text = text.slice(0, mark[0] + offset)
                + markSigns[mark[2]][0]
                + text.slice(mark[0] + offset, mark[1] + offset)
                + markSigns[mark[2]][1]
                + text.slice(mark[1] + offset);
            offset += markSigns[mark[2]][0].length + markSigns[mark[2]][1].length;
        }

        if (decos.has("math") && text.trim() !== "") text = "$$" + text + "$$";
        let lastLine = content.at(-1);
        if (lastLine != "" && (decos.has("h1") || decos.has("h2") || decos.has("h3") || decos.has("h4") || decos.has("h5") || decos.has("h6")))
            insertEmptyLineInFront = true;
        if (decos.has("h1")) text = "# " + text;
        // else if (decos.has("small")) text = "<small>" + text + "</small>";
        else if (decos.has("h2")) text = "## " + text;
        else if (decos.has("h3")) text = "### " + text;
        else if (decos.has("h4")) text = "#### " + text;
        else if (decos.has("h5")) text = "##### " + text;
        else if (decos.has("h6")) text = "###### " + text;
        else if (decos.has("subtitle")) text = "\\begin{subtitle}" + text + "\\end{subtitle}";
        else if (decos.has("link")) {
            let url = encodeURIComponent(getUrl(line.text.trim()).href);
            text = "![](" + (Environment.url + `proxy-image?url=${url}`) + ")";
            insertEmptyLineInFront = true;
            text += "\n";
        }

        if (["$"].includes(lastLine.charAt(lastLine.length - 1)) && !["$"].includes(lastLine.charAt(lastLine.length - 2))) insertEmptyLineInFront = true;
        text = text.split("$").map((e, j) => j % 2 ? e.trim() : e).join("$");

        // for (let j = 0; j < editor.doc.line(i).tabs.full || 0; j++) text = "\t" + text;

        if (text[0] == "#") insertEmptyLineInFront = true;
        for (let j = 0; j < line.tabs.full || 0; j++) text = "\t" + text;
        if (insertEmptyLineInFront && lastLine.trim() != "") text = "\n" + text;

        content.push(text);
    }

    content = content.join("\n");
    content = content.replaceAll("⇒", " $\\implies$ ");
    content = content.replaceAll("→", " $\\rightarrow$ ");
    content = content.replaceAll("⇐", " $\\Leftarrow$ ");
    content = content.replaceAll("←", " $\\leftarrow$ ");
    content = content.replaceAll("⇔", " $\\Longleftrightarrow$ ");
    content = content.replaceAll("↔", " $\\longleftrightarrow$ ");
    content = content.replaceAll("↦", " $\\mapsto$ ");
    content = content.replaceAll("↤", " $\\mapsfrom$ ");

    return content;
}

const isMac = navigator.platform.toUpperCase().includes("MAC");
const key = {
    metaKey: (e) => isMac ? e.metaKey : e.ctrlKey,
    altKey: (e) => e.altKey,
    ctrlKey: (e) => isMac ? e.ctrlKey : e.metaKey,
    shiftKey: (e) => e.shiftKey,
};

const saveState = () => {
    let registers = [];
    for (let reg in window.state.registers) registers.push({ name: window.state.registers[reg].name, content: window.state.registers[reg].content });
    let state = { registers, settings: JSON.parse(JSON.stringify(window.state.settings)) };
    localStorage.setItem('state', JSON.stringify(state));
}

const getUrl = (link) => {
    let url = new URL(link, Environment.url);
    if (Environment.url.includes(url.origin) && url.pathname.includes("view/")) url.attachmentUrl = url.pathname.split("/").at(-1);
    return url;
}

const estimateHeight = (line) => {
    return 35;
}

const measureHeight = (line) => {
    if (!line.isRendered || !line.element?.isConnected) return estimateHeight(line);
    let height = line.element.getBoundingClientRect().height;
    if (line.element.DM?.isConnected) height += line.element.DM.getBoundingClientRect().height;
    if (line.element.imgWrapper?.isConnected) height += line.element.imgWrapper.getBoundingClientRect().height;
    return height;
}

const getViewportMargins = () => window.innerHeight;

const isLineInViewport = (line, scrollY = line.editor.elements.editor.scrollTop) => {
    if (line.verticalOffset + line.height >= scrollY - getViewportMargins()
        && line.verticalOffset < scrollY + window.innerHeight + getViewportMargins()) return true;
    return false;
}

export { nodeSizes, checkTreeStructure, getColumnAt, findXIndicesInLine, getVisualLineAt, exportFile, nodeAt, exportToMD, isMac, key, saveState, getUrl, estimateHeight, measureHeight, isLineInViewport, getViewportMargins, nodeInLineAtColumn };
