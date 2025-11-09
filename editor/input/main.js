import { defaultSnippets, defaultSnippetVariables } from "./snippets/default.js";
import newSnippets from "./snippets/main.js";
import newKeyboard from "./keyboard/main.js";
import Caret from "./caret.js"
import { getColumnAt } from "../assets.js";

class Input {
    constructor(editor, textarea, layout = "regular") {
        this.editor = editor;
        this.textarea = textarea;
        this.snippets = newSnippets({ editor, snippets: defaultSnippets, snippetVariables: defaultSnippetVariables });
        this.keyboard = newKeyboard({ editor, layout });
        this.caret = new Caret(this.editor, { autoRender: false });

        textarea.addEventListener("mousedown", (e) => {
            if (!this.editor.interactive) return;
            e.preventDefault(); // no selections

            if (!e.target.Line && !e.target.mark) {
                console.log("not a line, can't handle click");
                return;
            }

            let index;
            console.log(e.target);
            if (e.target.classList.contains("DM")) index = e.target.Line.to;
            else if (e.target.classList.contains("IM")) index = e.target.mark.to.index - 1;
            else index = e.target.Line.from + getColumnAt(e.target, e.clientX, e.clientY, { style: this.caret.style });
            e.altKey ? this.caret.addCaret(index) : this.caret.updateCarets([index]);
            this.snippets.deleteTabStops();
        });

        document.addEventListener("mousemove", (e) => {
            if (!this.editor.interactive) return;
            if (!e.buttons || e.target.Line == undefined) return;
            e.preventDefault();

            if (this.editor.input.caret.carets.length === 1) {
                let index = e.target.classList.contains("DM") ? e.target.Line.to
                    : e.target.Line.from + getColumnAt(e.target, e.clientX, e.clientY, { style: this.caret.carets[0].style });
                if (index !== this.editor.input.caret.carets[0].position.index)
                    this.editor.input.caret.carets[0].placeAt(index, { keepFixedEnd: true });
                else if (index === this.editor.input.caret.carets[0].fixedEnd?.index)
                    this.editor.input.caret.carets[0].placeAt(index);
            }
        });

        document.addEventListener("keydown", (e) => {
            if (!this.editor.interactive) return;
            let command = this.keyboard.command(e);
            console.log({ command });

            if (command) e.preventDefault();
            else return;

            command();
        });
    }
}

const newInput = ({ editor, textarea, layout } = {}) => {
    return new Input(editor, textarea, layout);
}

export default newInput;
