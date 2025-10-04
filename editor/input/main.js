import newKeyboard from "./keyboard/main.js";

class Input {
    constructor(editor, textarea, keyboard = "regular") {
        this.editor = editor;
        this.textarea = textarea;
        this.keyboard = newKeyboard({ editor, layout: keyboard });

        textarea.addEventListener("mousedown", (e) => {
            if (!e.target.Line) {
                console.log("not a line, can't handle click");
                return;
            }

            this.caret.placeAtCoordinates(e.target, e.clientX, e.clientY);
        });

        document.addEventListener("keydown", (e) => {
            let command = this.keyboard.command(e);

            if (command) e.preventDefault();
            else return;

            command();
        });

        queueMicrotask(() => { this.caret.placeAt(0); });
    }

    get caret() {
        return this.editor.render.caret;
    }
}

const newInput = ({ editor, textarea } = {}) => {
    return new Input(editor, textarea);
}

export default newInput;
