import { Line, Leaf, Node, Doc } from "./classes.js";
import { nodeSizes, checkTreeStructure, showTreeStructure } from "../assets.js";

const newDoc = ({ editor, file } = {}) => {
    window.checkTreeStructure = () => { checkTreeStructure(editor.doc) };
    window.showTreeStructure = () => { showTreeStructure(editor.doc) };
    // let lines = text.split("\n").map(val => new Line({ text: val }));
    let lines = file.lines.map(line => new Line({ editor, text: line.text, tabs: line.tabs }));
    let leaves = new Array(Math.ceil(lines.length / nodeSizes.leaf.initial)).fill(0).map(_ => new Leaf({ editor, children: lines.splice(0, nodeSizes.leaf.initial) }));
    let nodes = new Array(Math.ceil(leaves.length / nodeSizes.node.initial)).fill(0).map(_ => new Node({ editor, children: leaves.splice(0, nodeSizes.node.initial) }));
    return new Doc({ editor, children: nodes });
}

export default newDoc;
