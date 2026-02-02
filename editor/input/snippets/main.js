import { Position } from "../../doc/classes.js";
import getFeatures from "./features.js";

class Snippets {
    constructor(editor = window.editor, snippets, snippetVariables) {
        this.editor = editor;
        this.tabstops = [];
        this.features = getFeatures(editor);

        const snips = snippets;
        for (let snip of snips) {
            if (typeof snip.from !== "object") continue;

            let source = snip.from.source;
            for (let variable in snippetVariables) {
                source = source.replaceAll(variable, snippetVariables[variable]);
            }
            source += "$";
            snip.from = new RegExp(source);
        }

        for (let snip of snips) {
            let { to, tabstops } = this.parseTabstops(snip.to);
            snip.to = to;
            snip.tabstops = tabstops;
        }

        this.snippets = snips.slice().sort((a, b) => ((b.priority || 0) - (a.priority || 0)));
    }

    parseTabstops(to = "") {
        let tabstops = [];
        while (true) {
            let m = /\$\{(?<index>\d+)+(?::(?<text>[^}]*?))?\}/.exec(to);
            if (!m) break;

            to = to.replace(m[0], m[2] || "");
            if (tabstops[m.groups.index] === undefined) tabstops[m.groups.index] = { placeholder: m[2] || "", positions: [] };
            tabstops[m.groups.index].positions.push(m.index);
            if (tabstops[m.groups.index] === "" && m.groups.text) tabstops[m.groups.index] = m.groups.text;
        }
        if (tabstops.length === 0) tabstops.push({ placeholder: "", positions: [to.length] });

        return { to, tabstops };
    }

    checkEnvironment(pos, wanted) {
        let current = pos.Line.decos.has("math") ? "dm" : "t";
        if (current === "t") {
            for (let mark of pos.Line.marks) {
                if (mark.role === "math" && mark.from.index < pos.index && mark.to.index >= pos.index) {
                    current = "im"
                    break;
                }
            }
        }


        switch (current) {
            case "dm":
                if (wanted.includes("m")) return true;
                return false;
            case "im":
                if (wanted.includes("m")) return true;
                return false;
            case "t":
                if (wanted.includes("t")) return true;
                return false;
        }
    }

    handleDocChanges(at) {
        let line = this.editor.doc.lineAt(at);
        let text = line.text.slice(0, at - line.from);
        let textStartColumn = line.marks.filter(e => e.role === "math").map(e => [e.from.column, e.to.column]).flat().filter(e => e < at - line.from).sort((a, b) => b - a)[0] || 0;
        text = text.slice(textStartColumn);
        let pos = new Position(at, this.editor.doc, { track: false });

        for (let snippet of this.snippets.filter(e => this.checkEnvironment(pos, e.in))) {
            for (let env of [["text{", "}"], ["mathrf{", "}"]]) if (this.features.isInEnv(pos, env)) return;

            let to = snippet.to, index, match, tabstops = JSON.parse(JSON.stringify(snippet.tabstops));
            if (typeof snippet.from == "object") { // regexpdef
                match = text.match(snippet.from)
                index = match?.index;
                if (index != undefined) {
                    // console.log(JSON.parse(JSON.stringify(tabstops)));
                    index += line.from + textStartColumn;
                    for (let i = 1; i < match.length; i++) {
                        let from = `[[${i - 1}]]`;
                        for (let safety = 0; safety < 100; safety++) {
                            if (typeof to === "function") {
                                let parsed = this.parseTabstops(to(match))
                                console.log({ to });
                                to = parsed.to;
                                tabstops = parsed.tabstops;
                            }
                            let ind = to.indexOf(from);
                            if (ind === -1) break;
                            to = to.replace(from, match[i]);
                            for (let ts of tabstops) {
                                for (let j in ts.positions) {
                                    if (ts.positions[j] >= ind) ts.positions[j] += match[i].length - from.length;
                                }
                            }
                        }
                    }
                    // console.log(JSON.parse(JSON.stringify(tabstops)));
                }
            } else if (typeof snippet.from == "string") { // string 
                if (text.endsWith(snippet.from)) {
                    index = at - snippet.from.length;
                    if (typeof to === "function") {
                        let parsed = this.parseTabstops(to(match))
                        console.log({ to });
                        to = parsed.to;
                        tabstops = parsed.tabstops;
                    }
                }
            }

            if (index !== undefined) {
                this.editor.doc.history?.newChangeGroup();
                console.log({ to });
                this.editor.doc.change.noCallback({ insert: to, from: index, to: at });
                // console.log(JSON.parse(JSON.stringify(tabstops)));
                for (let t of tabstops) for (let i in t.positions) t.positions[i] += index;
                this.editor.doc.history?.newChangeGroup();
                return tabstops;
            }
        }
    }

    // handle(at = this.editor.input.caret.position.index) {
    //     console.error("handle running");
    //     let tabstops = this.handleDocChanges(at);
    //     if (tabstops === undefined) return;
    //
    //     for (let t of tabstops.reverse()) this.editor.input.caret.addTabStops(t.positions);
    //     this.editor.input.caret.jumpToNextTabStops();
    // }

    multiHandle(positions) {
        if (positions.length === 0) return;

        for (let pos of positions) this.features.autoFraction(pos);

        let tabstops = this.handleDocChanges(positions[0].index);
        if (tabstops === undefined) return;
        for (let t of tabstops.reverse()) {
            this.tabstops.unshift({
                placeholder: t.placeholder,
                positions: t.positions.map(e => new Position(e, this.editor.doc, { stickLeftOnInsert: true, stickWhenDeleted: false }))
            });
        }

        for (let pos of positions.slice(1)) {
            let tabstops = this.handleDocChanges(pos.index);
            if (tabstops === undefined) continue;
            for (let i = 0; i < tabstops.length; i++) this.tabstops[i].positions.push(...tabstops[i].positions.map(e => new Position(e, this.editor.doc, { stickLeftOnInsert: true })));
        }

        return true; // must jump to next tabstops after callbacks
    }

    jumpToNextTabStops() {
        let caretLines = new Set(this.editor.input.caret.carets.map(e => e.position.Line));
        for (let ts of this.tabstops) if (!caretLines.has(ts.positions[0].Line)) ts.deleted = true;
        for (let ts of this.tabstops.filter(e => e.deleted)) for (let pos of ts.positions) {
            // console.log("deleting tabstop position for", ts);
            pos.delete();
        }
        this.tabstops = this.tabstops.filter(e => !e.deleted);

        while (this.tabstops[0] && this.tabstops[0].positions.filter(e => !e.deleted).length === 0) this.tabstops.shift();
        if (this.tabstops.length === 0) return;
        this.tabstops[0].positions = this.tabstops[0].positions.filter(e => !e.deleted);
        requestAnimationFrame(() => {
            this.editor.doc.history?.newChangeGroup();
            this.editor.input.caret.updateCarets(
                // this.tabstops[0].positions.map(e => e.index)
                this.tabstops[0].placeholder === "" ?
                    this.tabstops[0].positions.map(e => e.index) :
                    this.tabstops[0].positions.map(e => [e.index + this.tabstops[0].placeholder.length, e.index])
            );
            for (let pos of this.tabstops[0].positions) pos.delete();
            this.tabstops.shift();
        });
    }

    deleteTabStops() {
        for (let i of this.tabstops) for (let pos of i.positions) pos.delete();
        this.tabstops = [];
    }
}

const newSnippets = ({ editor = window.editor, snippets, snippetVariables } = {}) => {
    return new Snippets(editor, snippets, snippetVariables);
}

export default newSnippets;
