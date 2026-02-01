class Keyboard {
    constructor(editor, layout) {
        this.editor = editor;
        this.layout = layout;

        this.commandSets = [];
        import("./hotkeys.js").then(hotkey => {
            this.commandSets.push(hotkey.createCommandSet(this.editor));

            if (layout === "regular") {
                import("./regular.js").then(regular => {
                    this.commandSets.push(regular.createCommandSet(this.editor));
                });
            } else if (layout === "vim") {
                import("./vim.js").then(vim => {
                    this.commandSets.push(vim.createCommandSet(this.editor));
                });
            }
        })
    }

    command(e) {
        for (let commandSet of this.commandSets) {
            let maybeCommand = commandSet(e);
            if (maybeCommand) return maybeCommand;
        }
    }
}

const newKeyboard = ({ editor, layout = "regular" } = {}) => {
    return new Keyboard(editor, layout);
}

export default newKeyboard;
