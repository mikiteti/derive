import { exportToMD } from "../editor/assets.js";
import Environment from "../environment.js";
import AttachmentEditor from "./editAttachments.js";

const newCommands = (state) => {
    const vars = {
        get editor() { return state.editor },
        get caret() { return state.editor.input.caret },
        get carets() { return state.editor.input.caret.carets },
        get render() { return state.editor.render },
        get doc() { return state.editor.doc },
        get UI() { return state.UI },
        get history() { return state.editor.doc.history },
    };

    const createAttachment = async (type) => {
        let res = await state.sendRequest("new_attachment", {
            method: 'POST',
            body: JSON.stringify({ type }),
            headers: { "Content-Type": "application/json" },
            credentials: 'include'
        });
        if (res == -1) return;
        let url = (await res.json()).url;
        let caret = vars.carets[0], lineNum;
        if (caret.position.Line.text.trim() == "") {
            lineNum = caret.position.Line.number;
            vars.doc.change.insert("view/" + url, caret.position.index);
        } else {
            lineNum = caret.position.Line.number + 1;
            vars.doc.change.insert("\nview/" + url, caret.position.Line.to);
        }

        state.attachments.innerHTML = "";

        vars.doc.line(lineNum).addDeco("link");
        requestAnimationFrame(() => {
            let wrapper = vars.doc.line(lineNum).element.imgWrapper;
            wrapper.classList.add("notReady");
            new AttachmentEditor({ type, url, wrapper, isNew: true });
        });
    }

    const toggleMark = (mark) => {
        vars.history.newChangeGroup();
        vars.doc.toggleMark(mark);
        vars.history.newChangeGroup();
    }

    const toggleDeco = (deco) => {
        vars.history.newChangeGroup();
        vars.caret.forAll(pos => {
            pos.Line.toggleDeco(deco);
            vars.render.renderLine(pos.Line);
        });
        vars.caret.placeAllAt();
        vars.history.newChangeGroup();
    }

    const toggleExclusiveDeco = (deco) => {
        vars.history.newChangeGroup();
        vars.caret.forAll(pos => {
            pos.Line.removeDeco(vars.render.decos);
            if (deco != undefined) pos.Line.addDeco(deco);
            vars.render.renderLine(pos.Line);
        });
        vars.caret.placeAllAt();
        vars.history.newChangeGroup();
    }

    return [
        {
            name: "Create user",
            run: async () => {
                let [email, name, password] = await vars.UI.prompt("Create user", "Input your email, name and password to create an account", { Email: 1, Name: 1, Password: 1 });
                let res = await state.sendRequest("new_user", {
                    method: 'POST',
                    body: JSON.stringify({ email, name, password }),
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include'
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                vars.UI.alert(text);

                state.commands.find(e => e.name === "Login").run(email, password);
            }
        },
        {
            name: "Login",
            run: async (email, password) => {
                if (email == undefined || password == undefined) [email, password] =
                    await vars.UI.prompt("Login", 'Input your email and password to log in', { "Email": 1, "Password": 1 });
                console.log(email, password);
                localStorage.setItem('email', email);
                localStorage.setItem('password', password);

                let res = await state.sendRequest("login", {
                    method: 'POST',
                    body: JSON.stringify({ email, password }),
                    headers: { 'Content-Type': 'application/json' },
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                vars.UI.alert("Welcome", `You are now logged in`);
                state.reload(["user", "files", "currentFile", "editors"]);
            }
        },
        {
            name: "Delete file",
            run: async () => {
                let res = await state.sendRequest("update_note", {
                    method: 'POST',
                    body: JSON.stringify({ id: vars.editor.fileId, misc: JSON.stringify({ deleted: true }) }),
                    headers: { "Content-Type": "application/json" }
                });
                let text = await res.text();
                console.log(text);

                state.reload(["files", "currentFile"]);
                return text;
            }
        },
        {
            name: "Rename file",
            run: async () => {
                let [name] = await vars.UI.prompt("Rename file", 'Input the new filename', { "Filename": 1 });
                let res = await state.sendRequest("update_note", {
                    method: 'POST',
                    body: JSON.stringify({ id: vars.editor.fileId, name }),
                    headers: { "Content-Type": "application/json" }
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                vars.UI.alert("Renamed", `Your file is now ${name}`);

                state.reload(["files"]);

                return text;
            }
        },
        {
            name: "Export to Markdown",
            run: async () => {
                let text = await exportToMD(vars.editor);
                if (!text) {
                    vars.UI.alert("Error", "Something went wrong with the export");
                    return;
                }
                navigator.clipboard.writeText(text).then(() => {
                    console.log('Copied!', text);
                }).catch(console.error);
                vars.UI.alert("Exported", "Your file has been copied to your clipboard");
            },
            hotkey: "M+e",
        },
        {
            name: "Reload file",
            run: () => {
                state.reload(["file", "currentFile"]);
            }
        },
        {
            name: "Create file",
            run: async () => {
                let [fileName] = await vars.UI.prompt("Create file", "Input the filename in the box below", { Filename: 1 });

                await state.openFile(await state.createFile({ name: fileName }));
                vars.UI.focusEditor();
            },
            hotkey: "M+t",
        },
        {
            name: "Copy note URL",
            run: async () => {
                let url = new URL(window.location);
                let noteUrl = state.getCurrentNoteUrl();
                if (noteUrl == undefined) {
                    vars.UI.alert("Something went wrong", "The note may not have shareable a URL.");
                    return;
                }
                url.searchParams.set("note", noteUrl);

                navigator.clipboard.writeText(url.href).then(() => {
                    console.log('Copied!', url.href);
                    vars.UI.alert("URL copied", "Now you can share it with anyone. They will be able to see your note, but they won't be able to write to it.");
                }).catch(() => {
                    vars.UI.alert("Something went wrong with copying to your clipboard.", "Here is the URL though: " + url.href);
                });
            }
        },
        {
            name: "Save file",
            run: () => {
                state.saveFile(vars.editor);
            },
            hotkey: "M+s",
        },
        {
            name: "New Desmos Graph",
            run: () => { createAttachment("graph") }
        },
        {
            name: "New Desmos Geometry",
            run: () => { createAttachment("geometry") }
        },
        {
            name: "List attachments",
            run: async () => {
                if (vars.UI.attachments.children.length == 0) {
                    let res = await state.sendRequest("attachments", { credentials: 'include' });
                    if (res == -1) return;
                    let attachments = (await res.json());

                    for (let i of attachments) {
                        let img = document.createElement("img");
                        img.src = Environment.url + "view/" + i.url;
                        vars.UI.attachments.appendChild(img);
                    }
                }

                vars.UI.openModal(vars.UI.attachments);
            }
        },
        {
            name: "Toggle Vim Mode",
            run: () => {
                let currentMode = state.settings.keyboard;
                let goalMode = currentMode == "vim" ? "regular" : "vim";
                state.settings.keyboard = goalMode;
                if (goalMode == "vim")
                    vars.UI.alert("Vim mode switched on", "Reload for the changes to take place.");
                else vars.UI.alert("Vim mode switched off", "Reload for the changes to take place.");
            }
        },
        {
            name: "Toggle Reading Mode",
            run: () => {
                state.settings.interactive = !state.settings.interactive;
                if (state.settings.interactive)
                    vars.UI.alert("Reading mode switched off", "Reload for the changes to take place.");
                else vars.UI.alert("Reading mode switched on", "Reload for the changes to take place.");
            }
        },
        {
            name: "Toggle Welcome Message",
            run: () => {
                state.settings.welcomeMessage = !state.settings.welcomeMessage;
                if (state.settings.welcomeMessage)
                    state.UI.alert("Welcome message turned on", "Reload for the changes to take place.");
                else state.UI.alert("Welcome message turned off", "Reload for the changes to take place.");
            }
        },
        {
            name: "Toggle Line Numbers",
            run: () => {
                state.settings.lineNumbers = !state.settings.lineNumbers;
                if (state.settings.lineNumbers) document.documentElement.classList.add("lineNumbers");
                else document.documentElement.classList.remove("lineNumbers");
                queueMicrotask(() => {
                    vars.caret?.placeAllAt();
                });
            },
            hotkey: ["M+n", "M+S+n"],
        },
        {
            name: "Toggle Relative Line Numbers",
            run: () => {
                state.settings.relNumbers = !state.settings.relNumbers;
                if (state.settings.relNumbers) document.documentElement.classList.add("relNumbers");
                else document.documentElement.classList.remove("relNumbers");

                if (state.settings.lineNumbers) document.documentElement.classList.add("lineNumbers");
                else document.documentElement.classList.remove("lineNumbers");
                queueMicrotask(() => {
                    vars.caret?.placeAllAt();
                });
            }
        },


        {
            name: "Copy",
            run: () => {
                let from, to;
                if (!vars.carets[0].fixedEnd) {
                    from = vars.carets[0].position.Line.from;
                    to = vars.carets[0].position.Line.to + 1;
                } else {
                    from = vars.carets[0].from;
                    to = vars.carets[0].to;
                }
                state.clipboard.copy(from, to);
            },
            hotkey: "M+c",
        },
        {
            name: "Paste",
            run: async () => {
                await state.clipboard.update();
                for (let sc of vars.carets) state.clipboard.paste(sc.position.index);
            },
            hotkey: ["M+v", "M+S+v"],
        },
        {
            name: "Increase indent Level",
            run: () => {
                if (vars.editor.input.snippets.tabstops.length > 0) {
                    vars.editor.input.snippets.jumpToNextTabStops();
                    return;
                }

                let indentedLines = [];
                vars.caret.placeAllAt(pos => {
                    let line = pos.Line;
                    if (indentedLines.includes(line)) return;
                    indentedLines.push(line);

                    line.setTabs("full", line.tabs.full + 1);
                    vars.render.renderLine(line);
                });
            },
            hotkey: "Tab",
        },
        {
            name: "Decrease Indent Level",
            run: () => {
                let indentedLines = [];
                vars.caret.placeAllAt(pos => {
                    let line = pos.Line;
                    if (indentedLines.includes(line)) return;
                    indentedLines.push(line);

                    line.setTabs("full", line.tabs.full - 1);
                    vars.render.renderLine(line);
                })
            },
            hotkey: "S+Tab",
        },
        {
            name: "Format Selection: Toggle Link",
            hotkey: "M+l",
            run: () => { toggleMark("link") }
        },
        {
            name: "Format Line: Toggle Link",
            hotkey: "M+S+l",
            run: () => { toggleDeco("link") }
        },
        {
            name: "Format Selection: Toggle Math",
            hotkey: "M+m",
            run: () => { toggleMark("math") }
        },
        // {
        //     name: "M+S+m",
        //     run: () => { toggleDeco("math") }
        // },
        {
            name: "Format Line: Toggle Math",
            hotkey: ["M+d", "M+S+m"],
            run: () => { toggleDeco("math") }
        },
        {
            name: "Format Selection: Toggle Underline",
            hotkey: "M+u",
            run: () => { toggleMark("underline") }
        },
        {
            name: "Format Line: Toggle Underline",
            hotkey: "M+S+u",
            run: () => { toggleDeco("underline") }
        },
        {
            name: "Format Selection: Toggle Bold",
            hotkey: "M+b",
            run: () => { toggleMark("bold") }
        },
        {
            name: "Format Line: Toggle Bold",
            hotkey: "M+S+b",
            run: () => {
                vars.history.newChangeGroup();
                vars.caret.forAll(pos => {
                    if (!pos.Line.decos.has("bold") && !pos.Line.decos.has("Bold")) pos.Line.addDeco("bold");
                    else if (pos.Line.decos.has("bold")) {
                        pos.Line.removeDeco("bold");
                        pos.Line.addDeco("Bold");
                    } else if (pos.Line.decos.has("Bold")) {
                        pos.Line.removeDeco("Bold");
                    }
                    vars.render.renderLine(pos.Line);
                });
                vars.caret.placeAllAt();
                vars.history.newChangeGroup();
            }
        },
        {
            name: "Format Selection: Toggle Italic",
            hotkey: "M+i",
            run: () => { toggleMark("italic") }
        },
        {
            name: "Format Line: Toggle Italic",
            hotkey: "M+S+i",
            run: () => { toggleDeco("italic") }
        },
        {
            name: "Format Selection: Toggle Highlight",
            hotkey: "M+h",
            run: () => { toggleMark("highlight") }
        },
        {
            name: "Format Line: Toggle Highlight",
            hotkey: "M+S+h",
            run: () => { toggleDeco("highlight") }
        },
        {
            name: "Format Selection: Toggle Border",
            hotkey: "M+w",
            run: () => { toggleMark("spin_border") }
        },
        {
            name: "Format Line: Toggle Border",
            hotkey: "M+S+w",
            run: () => { toggleDeco("spin_border") }
        },
        {
            name: "Format Line: Toggle Center",
            hotkey: "M+S+c",
            run: () => { toggleDeco("center") }
        },
        {
            name: "Format Line: Remove Decorations",
            hotkey: ["M+0", "M+S+0"],
            run: () => { toggleExclusiveDeco() }
        },
        {
            name: "Format Line: Make 1st Level Heading",
            hotkey: "M+S+a",
            run: () => { toggleExclusiveDeco("h1") }
        },
        {
            name: "Format Line: Make 2nd Level Heading",
            hotkey: "M+S+s",
            run: () => { toggleExclusiveDeco("h2") }
        },
        {
            name: "Format Line: Make 3rd Level Heading",
            hotkey: "M+S+d",
            run: () => { toggleExclusiveDeco("h3") }
        },
        {
            name: "Format Line: Make 4th Level Heading",
            hotkey: "M+S+f",
            run: () => { toggleExclusiveDeco("h4") }
        },
        {
            name: "Format Line: Make Subtitle",
            hotkey: "M+S+g",
            run: () => { toggleExclusiveDeco("subtitle") }
        },
    ]
}

export default newCommands;
