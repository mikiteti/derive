import Welcome from "./welcome.js";
import Rezgesek from "./welcome2.js";
import newEditor from "../editor/main.js";
import Environment from "./environment.js";
import { exportFile } from "../editor/assets.js";

class State {
    constructor() {
        window.state = this;
        this.editors = [];
        this.commandPalette = document.querySelector("#commandPalette");
        this.filePicker = document.querySelector("#filePicker");
        this.modalBg = document.querySelector("#modalBg");
        this.initFilePicker();

        Object.defineProperty(window, "editor", { get() { return this.state.editor; }, });
        Object.defineProperty(window, "doc", { get() { return this.state.editor?.doc; }, });
        Object.defineProperty(window, "render", { get() { return this.state.editor?.render; }, });
        Object.defineProperty(window, "selection", { get() { return this.state.editor?.render.selection; }, });
        Object.defineProperty(window, "input", { get() { return this.state.editor?.input; }, });
        Object.defineProperty(window, "caret", { get() { return this.state.editor?.input?.caret; }, });
        Object.defineProperty(window, "snippets", { get() { return this.state.editor?.input?.snippets; }, });

        this.newEditor(Welcome);

        document.addEventListener("click", _ => {
            if (!this.editor.interactive) return;
            if (this.focus?.isEditor) document.getElementById("focus").focus();
        });

        window.addEventListener("resize", _ => {
            this.editor.caret?.placeAllAt();
        });
    }

    async initFilePicker() {
        this.files = await this.getFiles();
        this.filePicker.querySelector(".list").innerHTML = this.files.map(e => `<div file-id="${e.id}">${e.name}</div>`).join("");
        this.filePicker.entries = this.files;

        window.addEventListener("keydown", (e) => {
            if ([this.filePicker, this.commandPalette].includes(this.focus) && e.key === "Escape") {
                this.closeModal();
            }
        })

        this.filePicker.querySelector("input").addEventListener("input", (_) => {
            this.handleFuzzySearch(this.filePicker);
        });

        this.filePicker.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            await this.openFile({ id: parseInt(e.target.getAttribute("file-id")) });
            this.closeModal();
        });

        this.filePicker.querySelector("input").addEventListener("keydown", async (e) => {
            if (e.key === "Escape") {
                this.closeModal();
                document.getElementById("focus").focus();
                return;
            }

            if (e.key === "Enter") {
                if (!e.metaKey) this.filePicker.querySelector(".list div.active").click();
                else {
                    await this.openFile(await this.createFile({ name: this.filePicker.querySelector("input").value }));
                    this.closeModal();
                }

                return;
            }

            if (!e.metaKey) return;
            if (e.key === "j") {
                e.preventDefault();
                let displayed = this.filePicker.querySelectorAll(".list div:not(.nodisplay)");
                for (let i = 0; i < displayed.length; i++) {
                    if (i < displayed.length - 1 && displayed[i].classList.contains("active")) {
                        displayed[i].classList.remove("active");
                        displayed[i + 1].classList.add("active");
                        return;
                    }
                }
            } if (e.key === "k") {
                e.preventDefault();
                let displayed = this.filePicker.querySelectorAll(".list div:not(.nodisplay)");
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

    async sendRequest(url, body) {
        const URL = Environment.url;
        let res = await fetch(URL + url, { ...body, credentials: 'include' });

        if (res.status === 401 || res.status === 403) {
            console.log("must log in first...");
            let email = localStorage.getItem("email"), password = localStorage.getItem("password");
            if (email == undefined || password == undefined) {
                console.log("Login failed, no credentials in localStorage");
                alert("no credentials");
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
            const editor = newEditor({ file: file, layout: "vim", interactive: !matchMedia('(pointer: coarse)').matches });
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

    async createFile(file) {
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
        file = this.files.find(e => e.id === file.id);
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
        return json;
    }

    fuzzyFind(string, array) {
        return array.filter(e => {
            let text = e.name, index = 0;
            for (let char of string) {
                let found = text.indexOf(char.toLowerCase(), index), Found = text.indexOf(char.toUpperCase(), index);
                if (found === -1 && Found === -1) return false;
                index += Math.min(found, Found);
            }
            return true;
        });
    }

    handleFuzzySearch(modal = this.filePicker, array = modal.entries) {
        let matches = this.fuzzyFind(modal.querySelector("input").value, array).map(e => e.id);
        let entries = modal.querySelector(".list").children;
        let activeDone = false;
        for (let el of entries) {
            matches.includes(parseInt(el.getAttribute("file-id"))) ? el.classList.remove("nodisplay") : el.classList.add("nodisplay");
            if (!activeDone && matches.includes(parseInt(el.getAttribute("file-id")))) {
                el.classList.add("active");
                activeDone = true;
            } else el.classList.remove("active");
        }
    }
}

new State();
