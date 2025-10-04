import Lorem from "./loremIpsum.js";
import newEditor from "./editor/main.js";

let myFile = {
    lines: [
        { text: "This is a very long line. It even wraps around, that's how long it is. Actually, i don't even know how many characters it's made up of, it's that long.", tabs: { full: 0 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem: Ipsum", tabs: { full: 0 } },
        { text: "– lorem ipsum ← lorem (ipsum) – lorem ipsum 1.", tabs: { full: 1 } },
        { text: "◦ lorem ipsum", tabs: { full: 2 } },
        { text: "– lorem – ipsum, ipsum", tabs: { full: 3 } },
        { text: "– ipsum: lorem", tabs: { full: 3 } },
        { text: "– lorem", tabs: { full: 3 } },
        { text: "", tabs: { full: 0 } },
        { text: "– lorem – ipsum ipsum", tabs: { full: 1 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem lorem lorem ipsum", tabs: { full: 0 } },
        { text: "Lorem Ipsum", tabs: { full: 0 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem: Ipsum", tabs: { full: 0 } },
        { text: "– lorem ipsum ← lorem (ipsum) – lorem ipsum 1.", tabs: { full: 1 } },
        { text: "◦ lorem ipsum", tabs: { full: 2 } },
        { text: "– lorem – ipsum, ipsum", tabs: { full: 3 } },
        { text: "– ipsum: lorem", tabs: { full: 3 } },
        { text: "– lorem", tabs: { full: 3 } },
        { text: "", tabs: { full: 0 } },
        { text: "– lorem – ipsum ipsum", tabs: { full: 1 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem lorem lorem ipsum", tabs: { full: 0 } },
        { text: "Lorem Ipsum", tabs: { full: 0 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem: Ipsum", tabs: { full: 0 } },
        { text: "– lorem ipsum ← lorem (ipsum) – lorem ipsum 1.", tabs: { full: 1 } },
        { text: "◦ lorem ipsum", tabs: { full: 2 } },
        { text: "– lorem – ipsum, ipsum", tabs: { full: 3 } },
        { text: "– ipsum: lorem", tabs: { full: 3 } },
        { text: "– lorem", tabs: { full: 3 } },
        { text: "", tabs: { full: 0 } },
        { text: "– lorem – ipsum ipsum", tabs: { full: 1 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem lorem lorem ipsum", tabs: { full: 0 } },
        { text: "Lorem Ipsum", tabs: { full: 0 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem: Ipsum", tabs: { full: 0 } },
        { text: "– lorem ipsum ← lorem (ipsum) – lorem ipsum 1.", tabs: { full: 1 } },
        { text: "◦ lorem ipsum", tabs: { full: 2 } },
        { text: "– lorem – ipsum, ipsum", tabs: { full: 3 } },
        { text: "– ipsum: lorem", tabs: { full: 3 } },
        { text: "– lorem", tabs: { full: 3 } },
        { text: "", tabs: { full: 0 } },
        { text: "– lorem – ipsum ipsum", tabs: { full: 1 } },
        { text: "", tabs: { full: 0 } },
        { text: "• Lorem lorem lorem ipsum", tabs: { full: 0 } },
    ],
}


let myNextFile = {
    lines: [
        { text: "0", tabs: { full: 0 } },
        { text: "1", tabs: { full: 0 } },
        { text: "2", tabs: { full: 0 } },
        { text: "3", tabs: { full: 0 } },
        { text: "4", tabs: { full: 0 } },
        { text: "5", tabs: { full: 0 } },
        { text: "6", tabs: { full: 0 } },
        { text: "7", tabs: { full: 0 } },
        { text: "8", tabs: { full: 0 } },
        { text: "9", tabs: { full: 0 } },
        { text: "10", tabs: { full: 0 } },
        { text: "11", tabs: { full: 0 } },
        { text: "12", tabs: { full: 0 } },
        { text: "13", tabs: { full: 0 } },
        { text: "14", tabs: { full: 0 } },
        { text: "15", tabs: { full: 0 } },
        { text: "16", tabs: { full: 0 } },
        { text: "17", tabs: { full: 0 } },
        { text: "18", tabs: { full: 0 } },
        { text: "19", tabs: { full: 0 } },
        { text: "20", tabs: { full: 0 } },
        { text: "21", tabs: { full: 0 } },
        { text: "22", tabs: { full: 0 } },
        { text: "23", tabs: { full: 0 } },
        { text: "24", tabs: { full: 0 } },
        { text: "25", tabs: { full: 0 } },
        { text: "26", tabs: { full: 0 } },
        { text: "27", tabs: { full: 0 } },
        { text: "28", tabs: { full: 0 } },
        { text: "29", tabs: { full: 0 } },
        { text: "30", tabs: { full: 0 } },
        { text: "31", tabs: { full: 0 } },
        { text: "32", tabs: { full: 0 } },
        { text: "33", tabs: { full: 0 } },
        { text: "34", tabs: { full: 0 } },
        { text: "35", tabs: { full: 0 } },
        { text: "36", tabs: { full: 0 } },
        { text: "37", tabs: { full: 0 } },
        { text: "38", tabs: { full: 0 } },
        { text: "39", tabs: { full: 0 } },
        { text: "40", tabs: { full: 0 } },
        { text: "41", tabs: { full: 0 } },
        { text: "42", tabs: { full: 0 } },
        { text: "43", tabs: { full: 0 } },
        { text: "44", tabs: { full: 0 } },
        { text: "45", tabs: { full: 0 } },
        { text: "46", tabs: { full: 0 } },
        { text: "47", tabs: { full: 0 } },
        { text: "48", tabs: { full: 0 } },
        { text: "49", tabs: { full: 0 } },
        { text: "50", tabs: { full: 0 } },
        { text: "51", tabs: { full: 0 } },
        { text: "52", tabs: { full: 0 } },
        { text: "53", tabs: { full: 0 } },
        { text: "54", tabs: { full: 0 } },
        { text: "55", tabs: { full: 0 } },
        { text: "56", tabs: { full: 0 } },
        { text: "57", tabs: { full: 0 } },
        { text: "58", tabs: { full: 0 } },
        { text: "59", tabs: { full: 0 } },
        { text: "60", tabs: { full: 0 } },
        { text: "61", tabs: { full: 0 } },
        { text: "62", tabs: { full: 0 } },
        { text: "63", tabs: { full: 0 } },
    ]
}

let myLorem = { lines: Lorem.split("\n").map(line => ({ text: line, tabs: { full: 0 } })) };
console.log({ myLorem });

const editor = newEditor({ file: myFile });
window.editor = editor;
window.doc = editor.doc;
window.render = editor.render;
window.input = editor.input;
console.log({ editor });
console.log({ doc: window.doc });
window.render.renderAll(window.doc);

document.addEventListener("click", e => {
    if (e.target == document.getElementById("unfocus")) return;
    document.getElementById("focus").focus();
});
