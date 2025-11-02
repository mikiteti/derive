const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZáéíóöőúüűzabcdefghijklmnopqrstuvwxyzÁÉÍÓÖŐÚÜŰ 1234567890!@#$%^&*()-=_+[]\\{}|;':\",./<>?`~".split("");

const createCommandSet = (editor) => {
    const doc = editor.doc, render = editor.render, caret = editor.input.caret;

    const commands = {
        "M+c": () => {
            let text;
            if (!caret.carets[0].fixedEnd) {
                text = caret.carets[0].position.Line.text + "\n";
            } else {
                let from = caret.carets[0].position, to = caret.carets[0].fixedEnd;
                if (from.index > to.index) [from, to] = [to, from];
                text = "";
                if (from.Line === to.Line) text = from.Line.text.slice(from.index - from.Line.from, to.index - from.Line.from);
                else {
                    text = from.Line.text.slice(from.index - from.Line.from);
                    for (let i = from.Line.number + 1; i < to.Line.number; i++) {
                        text += "\n" + doc.line(i).text;
                    };
                    text += "\n" + to.Line.text.slice(0, to.index - to.Line.from);
                }
            }
            navigator.clipboard.writeText(text).then(() => {
                console.log('Copied!', text);
            }).catch(console.error);
        },
        "M+v": () => {
            navigator.clipboard.readText().then(text => {
                caret.changeForAll(sc => {
                    return { insert: text, at: sc.position.index };
                });
            });
        },
        "Tab": () => {
            if (editor.input.snippets.tabstops.length > 0) { // TODO
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
        "M+d": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("display-math");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+u": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("underline");
                render.renderLine(pos.Line);
            });
        },
        "M+s": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("small");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+l": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("large");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+a": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("accent");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+k": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("capital");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+w": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("spin_border");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+m": () => {
            caret.forAll(pos => {
                pos.Line.toggleDeco("middle");
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+b": () => {
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
        },
        "M+0": () => {
            caret.forAll(pos => {
                pos.Line.removeDeco(render.decos);
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+1": () => {
            caret.forAll(pos => {
                pos.Line.addDeco(["middle", "Bold", "accent", "capital", "underline"]);
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+2": () => {
            caret.forAll(pos => {
                pos.Line.addDeco(["middle", "bold", "accent", "small"]);
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
        "M+3": () => {
            caret.forAll(pos => {
                pos.Line.addDeco(["underline", "bold", "accent"]);
                render.renderLine(pos.Line);
            });
            caret.placeAllAt();
        },
    };

    const command = (e) => {
        let keyName = (e.metaKey ? "M+" : "")
            + (e.altKey ? "A+" : "")
            + (e.ctrlKey ? "C+" : "")
            + (e.shiftKey && (abc.indexOf(e.key) == -1 || e.metaKey || e.altKey || e.ctrlKey) ? "S+" : "")
            + e.key;
        return commands[keyName];
    }

    return command;
}

export { createCommandSet };
