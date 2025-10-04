const createCommandSet = (editor) => {
    const doc = editor.doc, render = editor.render, caret = editor.render.caret;

    const commands = {};

    const command = (e) => {
        let keyName = (e.metaKey ? "M+" : "") + (e.altKey ? "A+" : "") + (e.ctrlKey ? "C+" : "") + e.key;
        return commands[keyName];
    }

    return command;
}

export { createCommandSet };
