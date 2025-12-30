import Welcome from "./welcome.js";
import newEditor from "../editor/main.js";
import Environment from "../environment.js";
import { exportFile } from "../editor/assets.js";
import newCommands from "./commands.js";

class State {
    constructor() {
        window.state = this;
        this.editors = [];
        this.commandPalette = document.querySelector("#commandPalette");
        this.filePicker = document.querySelector("#filePicker");
        this.modalBg = document.querySelector("#modalBg");
        this.modalBg.addEventListener("click", () => {
            this.closeModal();
        })
        this.initFuzzyFinders();

        Object.defineProperty(window, "editor", { get() { return this.state.editor; }, });
        Object.defineProperty(window, "doc", { get() { return this.state.editor?.doc; }, });
        Object.defineProperty(window, "render", { get() { return this.state.editor?.render; }, });
        Object.defineProperty(window, "selection", { get() { return this.state.editor?.render.selection; }, });
        Object.defineProperty(window, "input", { get() { return this.state.editor?.input; }, });
        Object.defineProperty(window, "caret", { get() { return this.state.editor?.input?.caret; }, });
        Object.defineProperty(window, "snippets", { get() { return this.state.editor?.input?.snippets; }, });

        this.Welcome = Welcome;
        this.newEditor(this.Welcome);

        document.addEventListener("click", _ => {
            if (!this.editor.interactive) return;
            if (this.focus?.isEditor) document.getElementById("focus").focus();
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
    }

    async initFuzzyFinders() {
        this.files = await this.getFiles();
        this.filePicker.entries = this.files.filter(e => !e.misc?.deleted);
        this.filePicker.querySelector(".list").innerHTML = this.filePicker.entries.map(e => `<div item-id="${e.id}">${e.name}</div>`).join("");
        this.commands = newCommands(this).map((e, f) => ({ ...e, id: f }));
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
            this.handleFuzzySearch(this.filePicker);
        });

        this.commandPalette.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            console.log(this.commands, e.target);
            this.runCommand(this.commands.find(f => f.id == parseInt(e.target.getAttribute("item-id"))));
            this.closeModal();
        });

        this.filePicker.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            await this.openFile({ id: parseInt(e.target.getAttribute("item-id")) });
            this.closeModal();
        });

        this.filePicker.querySelector("input").addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && e.metaKey) {
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
                    if (!e.metaKey) element.querySelector(".list div.active").click();

                    return;
                }

                if (!e.metaKey) return;
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
                alert(text);
                return -1;
            }

            res = await fetch(URL + url, { ...body, credentials: 'include' });
        } else if (res.status === 400) {
            let text = await res.text();
            console.log(text);
            return -1;
        }

        return res;
    }

    async newEditor(file, { main = true } = {}) {
        console.log("creating new editor", file);

        return window.MathJax.startup.promise.then(_ => {
            // const editor = newEditor({ file: file, layout: "vim", interactive: !matchMedia('(pointer: coarse)').matches });
            const editor = newEditor({ file: file, layout: "vim", interactive: true });
            this.editors.push(editor);
            if (main) {
                this.editor = editor;
                this.focus = editor;
            }
            setTimeout(() => { // TODO: find out why caret behaves badly on startup
                editor.input.caret?.placeAllAt();
            }, 200);
            queueMicrotask(() => {
                editor.render.textarea.animate([
                    { opacity: "0" },
                    { opacity: "1" },
                ], {
                    duration: 100,
                });
            });

            return editor;
        });
    }

    runCommand(command) {
        if (command == undefined) return;
        console.log(`running command ${command.name}`);
        command.run();
    }

    async createFile(file) {
        // let exitingFile = this.files.find(e => e.name === file.name); // deleted file
        // if (exitingFile != undefined) {
        //     this.commands.find(e => e.name == "Restore file").run(exitingFile);
        //     return exitingFile;
        // }

        console.log("creating file");
        let res = await this.sendRequest("new_note", {
            method: 'POST',
            body: JSON.stringify({ name: file.name }),
            headers: { "Content-Type": "application/json" }
        });
        let id = (await res.json()).id;

        let newFile = await this.getFile({ id });

        this.files.push(newFile);
        return this.files.at(-1);
    }

    async getFile(file) {
        if (file.id === 0) return { ...file, ...Welcome };

        let res = await this.sendRequest("note", {
            method: 'POST',
            body: JSON.stringify({ id: file.id }),
            headers: { "Content-Type": "application/json" }
        });

        let note = await res.json();
        console.log(note);
        note.content = JSON.parse(note.content);
        if (note.content == undefined || note.content.length === 0) note.content = [{ text: "" }];

        return note;
    }

    async openFile(file) {
        console.log("opening file", file);
        if (file.id == undefined) file = this.createFile(file);
        if (file.id !== "Welcome") file = this.files.find(e => e.id === file.id);
        let editor = this.editors.filter(e => e.fileId != undefined).find(e => e.fileId === file.id);
        if (editor == undefined) {
            file = await this.getFile(file);
            console.log(file);
            editor = await this.newEditor(file, { main: false });
            console.log(editor);
        }
        for (let e of this.editors) e.elements.editor.style.display = (e === editor) ? "unset" : "none";
        this.editor = editor;
        document.title = file.name;
    }

    async saveFile(editor) {
        let content = JSON.stringify(exportFile(editor));

        let res = await this.sendRequest("update_note", {
            method: 'POST',
            body: JSON.stringify({ id: editor.fileId, content }),
            headers: { "Content-Type": "application/json" }
        });
        let text = await res.text();
        console.log(text);
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
        requestAnimationFrame(() => { this.focus = this.editor; });
    }

    async getFiles() {
        let res = await this.sendRequest("notes");
        let json = await res.json();
        for (let file of json) file.misc = JSON.parse(file.misc);
        return json;
    }

    fuzzyFind(string = "", array) {
        string = string.toLowerCase();

        return array
            .map(e => {
                const name = e.name.toLowerCase();
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
            if (!activeDone && matches.includes(parseInt(el.getAttribute("item-id")))) {
                el.classList.add("active");
                activeDone = true;
            }
        }
    }
}

new State();
