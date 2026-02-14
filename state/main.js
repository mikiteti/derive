import systemFiles from "./systemFiles.js";
import newEditor from "../editor/main.js";
import Environment from "../environment.js";
import { exportFile } from "../editor/assets.js";
import newCommands from "./commands.js";
import { key } from "../editor/assets.js";
import newClipboard from "../editor/doc/clipboard.js";

class State {
    constructor() {
        window.state = this;

        this.highlight = new Highlight();
        CSS.highlights.set("selection", this.highlight);
        this.clipboard = newClipboard("window");
        this.registers = {};
        for (let regName of ["", ..."_0123456789abcdefghijklmnopqrstuvwxyz|"]) this.registers[regName] = newClipboard(regName);
        this.registers["+"] = this.clipboard;

        this.editors = [];
        this.sendRequest("user").then(res => {
            if (res === -1) {
                console.log("no credentials");
                return;
            }

            res.json().then(user => {
                console.log("Logged in as:", user);
                this.user = user;
            });
        });
        this.commandPalette = document.querySelector("#commandPalette");
        this.filePicker = document.querySelector("#filePicker");
        this.modalBg = document.querySelector("#modalBg");
        this.alerts = document.querySelector("#alerts");
        this.prompts = document.querySelector("#prompts");
        this.modalBg.addEventListener("click", () => {
            console.log("closing modal");
            this.closeModal();
        });

        this.systemFiles = systemFiles;
        this.URL = new URL(window.location);
        this.note_url = this.URL.searchParams.get("note");

        this.initFuzzyFinders().then(() => {
            if (this.note_url != undefined && this.files.find(e => e.url == this.note_url).content) {
                console.log({ note_url: this.note_url });
                console.log(this.files.find(e => e.url == this.note_url));
                this.newEditor(this.files.find(e => e.url == this.note_url));
            } else this.newEditor(this.systemFiles.find(e => e.id === "welcome"));
        });

        Object.defineProperty(window, "editor", { get() { return this.state.editor; }, });
        Object.defineProperty(window, "doc", { get() { return this.state.editor?.doc; }, });
        Object.defineProperty(window, "render", { get() { return this.state.editor?.render; }, });
        Object.defineProperty(window, "selection", { get() { return this.state.editor?.render.selection; }, });
        Object.defineProperty(window, "input", { get() { return this.state.editor?.input; }, });
        Object.defineProperty(window, "caret", { get() { return this.state.editor?.input?.caret; }, });
        Object.defineProperty(window, "snippets", { get() { return this.state.editor?.input?.snippets; }, });

        document.addEventListener("click", _ => {
            if (!this.editor.interactive) return;
            if (this.focus?.isEditor && !this.focus?.classList?.has("prompt")) document.getElementById("focus").focus();
        });

        window.addEventListener("resize", _ => {
            this.editor.input.caret?.placeAllAt();
        });

        window.addEventListener("blur", () => {
            document.body.classList.add("dim");
        });

        window.addEventListener("focus", () => {
            document.body.classList.remove("dim");
        });

        window.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && this.focus?.classList?.contains("prompt")) {
                let inputs = this.focus.querySelectorAll("input");
                for (let i of inputs) if (i.value == "") return;
                this.focus.querySelector(".submit").click();
            }
        })
    }

    setNoteUrl(url) {
        console.log("setting note url to", url);
        this.note_url = url;
        this.URL.searchParams.set("note", url);
        history.replaceState({}, "", this.URL);
    }

    getCurrentNoteUrl() {
        return this.files.find(e => e.id === this.editor.fileId).url;
    }

    async initFuzzyFinders() {
        this.files = await this.getFiles();
        this.filePicker.entries = this.files.filter(e => !e.misc?.deleted);
        this.filePicker.querySelector(".list").innerHTML = this.filePicker.entries.concat(this.systemFiles).map(e => `<div item-id="${e.id}">${e.name}</div>`).join("");
        this.commands = newCommands(this).map((e, f) => ({ ...e, id: f + 1 }));
        this.commandPalette.entries = this.commands;
        this.commandPalette.querySelector(".list").innerHTML = this.commandPalette.entries.map(e => `<div item-id="${e.id}">${e.name}</div>`).join("");

        window.addEventListener("keydown", (e) => {
            if ([this.filePicker, this.commandPalette].includes(this.focus) && e.key === "Escape") {
                this.closeModal();
            }
        });

        this.commandPalette.querySelector("input").addEventListener("input", (_) => {
            this.handleFuzzySearch(this.commandPalette);
        });

        this.filePicker.querySelector("input").addEventListener("input", (_) => {
            if (this.filePicker.querySelector("input").value.startsWith(".")) {
                this.handleFuzzySearch(this.filePicker, this.systemFiles);
            }
            else this.handleFuzzySearch(this.filePicker);
        });

        this.commandPalette.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            console.log(this.commands, e.target);
            this.closeModal();
            this.runCommand(this.commands.find(f => f.id == parseInt(e.target.getAttribute("item-id"))));
        });

        this.filePicker.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            await this.openFile({ id: parseInt(e.target.getAttribute("item-id")) || e.target.getAttribute("item-id") });
            this.closeModal();
        });

        this.filePicker.querySelector("input").addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && key.metaKey(e)) {
                await this.openFile(await this.createFile({ name: this.filePicker.querySelector("input").value }));
                this.closeModal();
            }
        });

        let addHotkeys = (element) => {
            element.querySelector("input").addEventListener("keydown", async (e) => {
                if (e.key === "Escape") {
                    this.closeModal();
                    document.getElementById("focus").focus();
                    return;
                }

                if (e.key === "Enter") {
                    if (!key.metaKey(e)) element.querySelector(".list div.active").click();

                    return;
                }

                if (!key.metaKey(e)) return;
                if (e.key === "j") {
                    e.preventDefault();
                    let displayed = element.querySelectorAll(".list div:not(.nodisplay)");
                    for (let i = 0; i < displayed.length; i++) {
                        if (i < displayed.length - 1 && displayed[i].classList.contains("active")) {
                            displayed[i].classList.remove("active");
                            displayed[i + 1].classList.add("active");
                            return;
                        }
                    }
                } if (e.key === "k") {
                    e.preventDefault();
                    let displayed = element.querySelectorAll(".list div:not(.nodisplay)");
                    for (let i = 0; i < displayed.length; i++) {
                        if (i > 0 && displayed[i].classList.contains("active")) {
                            displayed[i].classList.remove("active");
                            displayed[i - 1].classList.add("active");
                            return;
                        }
                    }
                }
            });
        }
        addHotkeys(this.commandPalette);
        addHotkeys(this.filePicker);
    }

    async sendRequest(url, body) {
        const URL = Environment.url;
        let res = await fetch(URL + url, { ...body, credentials: 'include' });

        if (res.status === 401 || res.status === 403) {
            console.log("must log in first...");
            let email = localStorage.getItem("email"), password = localStorage.getItem("password");
            if (email == undefined || password == undefined) {
                console.log("Login failed, no credentials in localStorage");
                // alert("no credentials");
                return -1;
            }

            res = await fetch(URL + "login", {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });

            if (res.status === 401 || res.status === 403) {
                console.log("Login failed");
                let text = await res.text();
                this.alert("Error", text);
                return -1;
            }

            res = await fetch(URL + url, { ...body, credentials: 'include' });
        } else if (res.status === 400) {
            let text = await res.text();
            console.log(text);
            this.alert("Error", text);
            return -1;
        }

        return res;
    }

    async newEditor(file, { main = true } = {}) {
        console.log("creating new editor", file);

        await window.MathJax.startup.promise;

        // const editor = newEditor({ file: file, layout: "vim", interactive: !matchMedia('(pointer: coarse)').matches });
        const editor = newEditor({ file: file, layout: "vim", interactive: true });
        this.editors.push(editor);
        if (main) {
            this.editor = editor;
            this.focus = editor;
        }
        // setTimeout(() => { // probably solved by renderLine returning a promise that placeAt awaits
        editor.input.caret?.placeAllAt();
        // }, 200);
        queueMicrotask(() => {
            editor.render.textarea.animate([
                { opacity: "0" },
                { opacity: "1" },
            ], {
                duration: 100,
            });
        });

        return editor;
    }

    runCommand(command) {
        if (command == undefined) return;
        console.log(`running command ${command.name}`);
        command.run();
    }

    async createFile(file) {
        console.log("creating file");
        let res = await this.sendRequest("new_note", {
            method: 'POST',
            body: JSON.stringify({ name: file.name }),
            headers: { "Content-Type": "application/json" }
        });
        if (res === -1) return;
        let id = (await res.json()).id;
        let newFile = await this.getFile({ id });
        this.files.push(newFile);

        this.reload(["files"]);

        console.log(newFile);
        return newFile;
    }

    async getFile(file) {
        console.log("getting file", file);
        let res;
        if (file.id != undefined) {
            res = await this.sendRequest("note", {
                method: 'POST',
                body: JSON.stringify({ id: file.id }),
                headers: { "Content-Type": "application/json" }
            });
        } else if (file.url != undefined) {
            res = await this.sendRequest("note_by_url", {
                method: 'POST',
                body: JSON.stringify({ url: file.url }),
                headers: { "Content-Type": "application/json" }
            });
        }

        if (res == -1) return res;
        let note = await res.json();
        console.log(note);
        note.content = JSON.parse(note.content);
        if (note.content == undefined || note.content.length === 0) note.content = [{ text: "" }];

        return note;
    }

    async openFile(file) {
        if (this.systemFiles.find(e => e.id == file.id)) {
            file = this.systemFiles.find(e => e.id == file.id);
        } else {
            if (file.id === undefined) file = await this.createFile(file);
            file = this.files.find(e => e.id === file.id)
        }
        console.log(file);
        // this.setNoteUrl(file.url);

        let editor = this.editors.filter(e => e.fileId != undefined).find(e => e.fileId === file.id);
        if (editor == undefined) {
            if (!file.systemFile) file = await this.getFile(file);
            editor = await this.newEditor(file, { main: false });
        }
        for (let e of this.editors) e.elements.editor.style.display = (e === editor) ? "unset" : "none";
        this.editor = editor;
        let index = this.editors.find(e => e.id === editor.fileId);
        if (index !== undefined) this.editors = this.editors.slice(0, index).concat(this.editors.slice(index + 1)).concat(editor);
        document.title = file.name;
    }

    async saveFile(editor) {
        let content = JSON.stringify(exportFile(editor));

        let res = await this.sendRequest("update_note", {
            method: 'POST',
            body: JSON.stringify({ id: editor.fileId, content }),
            headers: { "Content-Type": "application/json" }
        });
        if (res === -1) return;
        let text = await res.text();
        console.log(text);
        this.alert("Saved", "Your file is now safe and sound");
        return text;
    }

    openModal(modal) {
        modal.style.display = "unset";
        modal.animate([
            { opacity: 0, transform: "translate(-50%, 3px)" },
            { opacity: 1, transform: "translate(-50%, 0px)" }
        ], { duration: 100 });
        this.modalBg.style.display = "unset";
        this.modalBg.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration: 100 });

        modal.querySelector("input").focus();
        modal.querySelector("input").value = "";
        this.focus = modal;
        this.handleFuzzySearch(modal);
    }

    closeModal() {
        this.focus.style.display = "none";
        this.focus.animate([
            { opacity: 1, transform: "translate(-50%, 0px)", display: "unset" },
            { opacity: 0, transform: "translate(-50%, 3px)", display: "unset" }
        ], { duration: 100 });
        this.modalBg.style.display = "none";
        this.modalBg.animate([
            { opacity: 1, display: "unset" },
            { opacity: 0, display: "unset" }
        ], { duration: 100 });

        document.getElementById("focus").focus();
        this.focus = this.editor;
    }

    focusEditor() {
        this.focus = this.editor;
    }

    async getFiles() {
        let res = await this.sendRequest("notes"), json = [];
        if (res === -1) console.log("files weren't received");
        else {
            json = await res.json();
            for (let file of json) file.misc = JSON.parse(file.misc);
        }

        let currentFile;
        if (this.note_url != undefined) currentFile = await this.getFile({ url: this.note_url });
        if (currentFile != undefined && currentFile != -1) {
            (json.find(e => e.url == this.note_url) == undefined)
                ? json.push(currentFile)
                : json[json.indexOf(json.find(e => e.url == this.note_url))] = currentFile;
        }

        return json;
    }

    fuzzyFind(string = "", array) {
        string = string.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

        return array
            .map(e => {
                const name = e.name.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
                let score = 0;
                if (name === string) score += 10;
                else if (name.startsWith(string)) score += 5;

                let index = 0;
                for (const char of string) {
                    let lastIndex = index;
                    index = name.indexOf(char, index);
                    if (index === -1) {
                        score = 0;
                        break;
                    }
                    index++;
                    score += lastIndex === 0 ? 1 : 1 / (index - lastIndex);
                }

                return { item: e, score };
            })
            .filter(r => r.score > 0) // only matches
            .sort((a, b) => b.score - a.score)
            .map(e => e.item);
    }

    handleFuzzySearch(modal = this.filePicker, array = modal.entries) {
        let matches = this.fuzzyFind(modal.querySelector("input").value, array).map(e => e.id);
        let entries = modal.querySelector(".list").children;
        let activeDone = false;
        for (let el of entries) {
            el.classList.remove("active");
            el.classList.add("nodisplay");
        }
        for (let m of matches) {
            let el = modal.querySelector(`.list [item-id="${m}"]`);
            if (el == undefined) continue;
            el.classList.remove("nodisplay");
            modal.querySelector(".list").appendChild(el);
            if (!activeDone && matches.includes(parseInt(el.getAttribute("item-id")) || el.getAttribute("item-id"))) {
                el.classList.add("active");
                activeDone = true;
            }
        }
    }

    alert(title, text) {
        let element = document.createElement("div");
        element.classList.add("alert");
        let head = document.createElement("div");
        head.innerText = title;
        head.classList.add("title");
        element.innerText = text;
        element.prepend(head);

        this.alerts.prepend(element);
        element.animate([
            { opacity: "0", transform: "translateX(10px)" },
            { opacity: "1", transform: "translateX(0px)" },
        ], 200);

        setTimeout(() => {
            element.animate([
                { opacity: "1", transform: "translateY(0px)" },
                { opacity: "0", transform: "translateY(10px)" },
            ], 200);
            setTimeout(() => {
                element.remove();
            }, 200)
        }, 3000)
    }

    prompt(title, description, fields) {
        let element = document.createElement("div");
        element.classList.add("prompt");
        let innerHTML = `<div class="title">${title}</div><div class="description">${description}</div><div class="grid">`;
        for (let field in fields) innerHTML += `<label for="${field}">${field}</label><input type="text" id="${field}" name="${field}">`;
        innerHTML += "</div>";
        element.innerHTML = innerHTML;
        let submit = document.createElement("div");
        submit.classList.add("submit");
        submit.innerHTML = "OK";
        element.appendChild(submit);
        this.prompts.appendChild(element);
        element.animate([
            { opacity: "0", transform: "translate(-50%, 3px)" },
            { opacity: "1", transform: "translate(-50%, 0px)" },
        ], 200);
        this.modalBg.style.display = "unset";
        this.modalBg.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration: 100 });

        element.querySelector("input").focus();
        this.focus = element;

        let promise = new Promise((res, rej) => {
            submit.addEventListener("click", _ => {
                let inputElements = element.querySelectorAll("input");
                let inputs = [];
                for (let e of inputElements) inputs.push(e.value);
                element.animate([
                    { opacity: "1", transform: "translate(-50%, 0px)" },
                    { opacity: "0", transform: "translate(-50%, 10px)" },
                ], 200);
                setTimeout(() => {
                    element.remove();
                }, 200)
                this.modalBg.style.display = "none";
                this.modalBg.animate([
                    { opacity: 1, display: "unset" },
                    { opacity: 0, display: "unset" }
                ], { duration: 100 });

                document.getElementById("focus").focus();
                requestAnimationFrame(() => { this.focus = this.editor; });
                res(inputs);
            });
        });

        return promise;
    }

    async reload(elements = ["files", "user", "currentFile"]) {
        if (elements.includes("user")) {
            let res = await this.sendRequest("user");
            let user = await res.json();
            console.log("Logged in as:", user);
            this.user = user;
        }

        if (elements.includes("editors")) {
            this.editors = [];
            document.querySelector("main").innerHTML = "";
        }

        if (elements.includes("files")) {
            this.files = await this.getFiles();
            this.filePicker.entries = this.files.filter(e => !e.misc?.deleted);
            this.filePicker.querySelector(".list").innerHTML = this.filePicker.entries.concat(this.systemFiles).map(e => `<div item-id="${e.id}">${e.name}</div>`).join("");
        }

        if (elements.includes("currentFile")) {
            let files = this.files.concat(this.systemFiles).filter(e => !e.misc?.deleted);
            let lastEditor = this.editors.toReversed().find(e => files.find(f => e.fileId === f.id));
            if (lastEditor === undefined) this.openFile(this.systemFiles.find(e => e.id === "welcome"));
            else this.openFile(files.find(e => e.id === lastEditor.fileId));
        }
    }
}

new State();
