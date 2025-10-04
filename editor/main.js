import newDoc from "./doc/main.js";
import newRender from "./render/main.js";
import newInput from "./input/main.js";

class Editor {
    constructor() {

    }
}

const newEditor = ({ file, textarea = document.getElementById("editor") } = {}) => {
    let editor = new Editor();

    editor.doc = newDoc({ editor, file });
    editor.render = newRender({ editor, textarea }); // editor.doc is already defined
    editor.input = newInput({ editor, textarea }); // editor.doc & editor.render are already defined

    return editor;
}

export default newEditor;
