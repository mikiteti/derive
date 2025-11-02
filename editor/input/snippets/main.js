import { defaultSnippets, defaultSnippetVariables } from "./default.js";
import { Position } from "../../doc/classes.js";
import getFeatures from "./features.js";

class Snippets {
    constructor(editor = window.editor, snippets = defaultSnippets, snippetVariables = defaultSnippetVariables) {
        this.editor = editor;
        this.tabstops = [];
        this.features = getFeatures(editor);

        const snips = [...snippets];
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
            let to = snip.to;
            let tabstops = [];
            while (true) {
                let m = /\$\{(?<index>\d)+(?::(?<text>[^}]*?))?\}/.exec(to);
                if (!m) break;

                to = to.replace(m[0], m[2] || "");
                if (tabstops[m.groups.index] === undefined) tabstops[m.groups.index] = { placeholder: m[2] || "", positions: [] };
                tabstops[m.groups.index].positions.push(m.index);
                if (tabstops[m.groups.index] === "" && m.groups.text) tabstops[m.groups.index] = m.groups.text;
            }
            if (tabstops.length === 0) tabstops.push({ placeholder: "", positions: [to.length] });

            snip.to = to;
            snip.tabstops = tabstops;
        }

        this.snippets = snips.slice().sort((a, b) => ((b.priority || 0) - (a.priority || 0)));
    }

    checkEnvironment(current, wanted) {
        if (wanted.includes("m") && current.has("display-math")) return true;
        if (wanted.includes("t") && !current.has("display-math")) return true;

        // current: ["display-math"]
        // wanted: "mA"

        // let map = {
        //     "display-math": "m",
        // }
        // for (let deco of current) if (wanted.includes(map[deco])) return true;

        return false;
    }

    handleDocChanges(at) {
        let line = this.editor.doc.lineAt(at);
        let text = line.text.slice(0, at - line.from);
        let environment = line.decos;

        for (let snippet of this.snippets.filter(e => this.checkEnvironment(environment, e.in))) {
            let pos = new Position(at, this.editor.doc, { track: false });
            for (let env of [["text{", "}"], ["mathrf{", "}"]]) if (this.features.isInEnv(pos, env)) return;

            let to = snippet.to, index, match, tabstops = JSON.parse(JSON.stringify(snippet.tabstops));
            if (typeof snippet.from == "object") { // regexp
                match = text.match(snippet.from)
                index = match?.index;
                if (index != undefined) {
                    // console.log(JSON.parse(JSON.stringify(tabstops)));
                    index += line.from;
                    for (let i = 1; i < match.length; i++) {
                        let from = `[[${i - 1}]]`;
                        while (true) {
                            let ind = to.indexOf(from);
                            if (ind === -1) break;
                            // if (typeof to === "function") to = to(match);
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
                }
            }

            if (index !== undefined) {
                this.editor.doc.change.noCallback({ insert: to, from: index, to: at });
                // console.log(JSON.parse(JSON.stringify(tabstops)));
                for (let t of tabstops) for (let i in t.positions) t.positions[i] += index;
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
                positions: t.positions.map(e => new Position(e, this.editor.doc, { stickLeftOnInsert: true }))
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
        console.log("jumping to next tabstops", this.tabstops[0].placeholder);
        this.editor.input.caret.updateCarets(
            // this.tabstops[0].positions.map(e => e.index)
            this.tabstops[0].placeholder === "" ?
                this.tabstops[0].positions.map(e => e.index) :
                this.tabstops[0].positions.map(e => [e.index + this.tabstops[0].placeholder.length, e.index])
        );
        for (let pos of this.tabstops[0].positions) pos.delete();
        this.tabstops.shift();
    }

    deleteTabStops() {
        for (let i of this.tabstops) for (let pos of i) pos.delete();
        this.tabstops = [];
    }
}

const newSnippets = ({ editor = window.editor, snippets = defaultSnippets, snippetVariables = defaultSnippetVariables } = {}) => {
    return new Snippets(editor, snippets, snippetVariables);
}

export default newSnippets;
