import newDoc from "./doc/main.js";
import newRender from "./render/main.js";
import newInput from "./input/main.js";

class Editor {
    constructor({ wrapper, interactive, file } = {}) {
        this.isEditor = true;
        this.wrapper = wrapper;
        this.interactive = interactive;

        this.elements = { editor: document.createElement("div") };
        this.elements.editor.innerHTML = `<div class="textarea"></div> <div class="placeholder" onclick="window.caret.updateCarets([window.editor.doc.chars-1])"></div> <div class="leftInfo info noisy"></div> <div class="rightInfo info noisy"></div>`;
        this.wrapper.appendChild(this.elements.editor);
        this.elements.textarea = this.elements.editor.querySelector(".textarea");
        this.elements.placeholder = this.elements.editor.querySelector(".placeholder");
        this.elements.leftInfo = this.elements.editor.querySelector(".leftInfo");
        this.elements.rightInfo = this.elements.editor.querySelector(".rightInfo");
        this.elements.wrapper = this.wrapper;

        this.fileId = file?.id;
    }
}

const newEditor = ({ file, wrapper = document.querySelector("main"), layout = "regular", interactive = true } = {}) => {
    let editor = new Editor({ wrapper, interactive, file });

    editor.doc = newDoc({ editor, file });
    editor.doc.parseMarks();
    editor.render = newRender({ editor }); // editor.doc is already defined
    editor.render.renderAll(editor.doc);
    if (interactive) editor.input = newInput({ editor, layout }); // editor.doc & editor.render are already defined

    return editor;
}

export default newEditor;
