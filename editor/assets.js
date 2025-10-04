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
    let abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':".split("").concat(Array(10).fill("\n"));
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
queueMicrotask(() => {
    window.checkSpeed = checkSpeed;
});

export { nodeSizes, checkTreeStructure, showTreeStructure };
