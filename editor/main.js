import newDoc from "./doc/main.js";
import newRender from "./render/main.js";
import newInput from "./input/main.js";

class Editor {
    constructor({ interactive }) {
        this.interactive = interactive;
    }
}

const newEditor = ({ file, textarea = document.getElementById("editor"), layout = "regular", interactive = true } = {}) => {
    let editor = new Editor({ interactive });

    editor.doc = newDoc({ editor, file });
    editor.doc.parseMarks();
    editor.render = newRender({ editor, textarea }); // editor.doc is already defined
    editor.render.renderAll(editor.doc);
    if (interactive) editor.input = newInput({ editor, textarea, layout }); // editor.doc & editor.render are already defined

    return editor;
}

export default newEditor;
