import { key } from "../../assets.js";

const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':\",./<>?`~".split("");

const createCommandSet = (editor) => {
    const doc = editor.doc, render = editor.render, caret = editor.input.caret, history = editor.doc.history;

    const commands = {
        "M+c": () => {
            let from, to;
            if (!caret.carets[0].fixedEnd) {
                from = caret.carets[0].position.Line.from;
                to = caret.carets[0].position.Line.to + 1;
                // text = caret.carets[0].position.Line.text + "\n";
            } else {
                from = caret.carets[0].from;
                to = caret.carets[0].to;
            }
            let clipboardContent = doc.clipboard.copy(from, to);
            navigator.clipboard.writeText(clipboardContent.text).then(() => {
                console.log('Copied!', clipboardContent.text);
            }).catch(console.error);
        },
        "M+v": () => {
            navigator.clipboard.readText().then(text => {
                if (doc.clipboard.compare(text)) for (let sc of caret.carets) doc.clipboard.paste(sc.position.index);
                else {
                    caret.changeForAll(sc => {
                        return { insert: text, at: sc.position.index };
                    });
                }
            });
        },
        "M+s": () => {
            window.state.saveFile(editor);
        },
        "M+o": () => {
            window.state.openModal(window.state.filePicker);
        },
        "M+p": () => {
            window.state.openModal(window.state.commandPalette);
        },
        "M+l": () => {
            document.documentElement.classList.toggle("lineNumbers")
            queueMicrotask(() => {
                caret.placeAllAt();
            });
        },
        "Tab": () => {
            if (editor.input.snippets.tabstops.length > 0) {
                editor.input.snippets.jumpToNextTabStops();
                return;
            }

            let indentedLines = [];
            caret.placeAllAt(pos => {
                let line = pos.Line;
                if (indentedLines.includes(line)) return;
                indentedLines.push(line);

                line.setTabs("full", line.tabs.full + 1);
                render.renderLine(line);
            });
        },
        "S+Tab": () => {
            let indentedLines = [];
            caret.placeAllAt(pos => {
                let line = pos.Line;
                if (indentedLines.includes(line)) return;
                indentedLines.push(line);

                line.setTabs("full", line.tabs.full - 1);
                render.renderLine(line);
            })
        },
        "M+m": () => {
            history.newChangeGroup();
            doc.toggleMark("math");
            history.newChangeGroup();
        },
        "M+S+m": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("math");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+d": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("math");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+u": () => {
            history.newChangeGroup();
            doc.toggleMark("underline")
            history.newChangeGroup();
        },
        "M+S+u": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("underline");
                render.renderLine(pos.Line);
            });
            history.newChangeGroup();
        },
        "M+b": () => {
            history.newChangeGroup();
            doc.toggleMark("bold");
            history.newChangeGroup();
        },
        "M+S+b": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                if (!pos.Line.decos.has("bold") && !pos.Line.decos.has("Bold")) pos.Line.addDeco("bold");
                else if (pos.Line.decos.has("bold")) {
                    pos.Line.removeDeco("bold");
                    pos.Line.addDeco("Bold");
                } else if (pos.Line.decos.has("Bold")) {
                    pos.Line.removeDeco("Bold");
                }
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+i": () => {
            history.newChangeGroup();
            doc.toggleMark("italic");
            history.newChangeGroup();
        },
        "M+S+i": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("italic");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+h": () => {
            history.newChangeGroup();
            doc.toggleMark("highlight");
            history.newChangeGroup();
        },
        "M+S+h": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("highlight");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+w": () => {
            history.newChangeGroup();
            doc.toggleMark("spin_border");
            history.newChangeGroup();
        },
        "M+S+w": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("spin_border");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+S+c": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.toggleDeco("center");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+0": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.removeDeco(render.decos);
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+S+a": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.removeDeco(render.decos);
                pos.Line.addDeco("h1");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+S+s": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.removeDeco(render.decos);
                pos.Line.addDeco("subtitle");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+S+d": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.removeDeco(render.decos);
                pos.Line.addDeco("h2");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
        "M+S+f": () => {
            history.newChangeGroup();
            caret.forAll(pos => {
                pos.Line.removeDeco(render.decos);
                pos.Line.addDeco("h3");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
            history.newChangeGroup();
        },
    };

    commands["M+S+s"] = commands["M+s"];
    commands["M+S+c"] = commands["M+c"];
    commands["M+S+v"] = commands["M+v"];
    commands["M+S+o"] = commands["M+o"];
    commands["M+S+p"] = commands["M+p"];
    commands["M+S+l"] = commands["M+l"];
    commands["M+d"] = commands["M+S+m"];

    const command = (e) => {
        let keyName = (key.metaKey(e) ? "M+" : "")
            + (key.altKey(e) ? "A+" : "")
            + (key.ctrlKey(e) ? "C+" : "")
            + (key.shiftKey(e) && (abc.indexOf(e.key) == -1 || key.metaKey(e) || key.altKey(e) || key.ctrlKey(e)) ? "S+" : "")
            + e.key;
        return commands[keyName];
    }

    return command;
}

export { createCommandSet };
