import systemFiles from "./systemFiles.js";
import newEditor from "../editor/editor.js";
import Environment from "../environment.js";
import { exportFile } from "../editor/assets.js";
import newClipboard from "../editor/doc/clipboard.js";
import Settings from "./settings.js";
import UI from "../ui/ui.js";

class State {
    constructor() {
        window.state = this;

        // Loading saved state from localstorage
        let savedState = localStorage.getItem("state");
        if (savedState != undefined) savedState = JSON.parse(savedState);
        else savedState = {};
        this.settings = savedState.settings ? { ...Settings, ...savedState.settings } : Settings;

        // initialising UI
        this.UI = new UI(this);

        // setting registers
        this.clipboard = newClipboard("window");
        this.registers = {};
        for (let regName of ["", ..."_0123456789abcdefghijklmnopqrstuvwxyz|"]) this.registers[regName] = newClipboard(regName);
        if (savedState.registers != undefined) for (let reg of savedState.registers)
            this.registers[reg.name]?.copy(undefined, undefined, { clipboard: reg });
        this.registers["+"] = this.clipboard;

        // getting user data
        this.editors = [];
        this.sendRequest("user").then(res => {
            if (res === -1) {
                console.log("no credentials");
                return;
            }

            res.json().then(user => {
                console.info("Logged in as:")
                console.table(user);
                this.user = user;
            });
        });

        // getting systemfiles, setting URL
        this.systemFiles = systemFiles;
        this.URL = new URL(window.location);
        this.note_url = this.URL.searchParams.get("note");
        // if (this.settings.welcomeMessage) {
        //     this.URL.searchParams.delete("note");
        //     history.replaceState({}, "", this.URL);
        // }

        // defining global getters for convenience 
        Object.defineProperty(window, "editor", { get() { return this.state.editor; }, });
        Object.defineProperty(window, "doc", { get() { return this.state.editor?.doc; }, });
        Object.defineProperty(window, "render", { get() { return this.state.editor?.render; }, });
        Object.defineProperty(window, "selection", { get() { return this.state.editor?.render.selection; }, });
        Object.defineProperty(window, "input", { get() { return this.state.editor?.input; }, });
        Object.defineProperty(window, "caret", { get() { return this.state.editor?.input?.caret; }, });
        Object.defineProperty(window, "snippets", { get() { return this.state.editor?.input?.snippets; }, });
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
                this.UI.alert("Error", text);
                return -1;
            }

            res = await fetch(URL + url, { ...body, credentials: 'include' });
        } else if (res.status === 403) {
            this.UI.alert("Sorry, can't do that", "This is not yours.")
            return -1;
        } else if (res.status >= 400) {
            let text = await res.text();
            console.log(text);
            this.UI.alert("Error", text);
            return -1;
        }

        return res;
    }

    async newEditor(file, { main = true } = {}) {
        console.log("creating new editor", file);

        await window.MathJax.startup.promise;

        const editor = newEditor({ file: file, interactive: file.interactive == undefined ? this.settings.interactive : file.interactive });
        this.editors.push(editor);
        if (main) {
            this.editor = editor;
            this.UI.focus = editor;
        }
        // setTimeout(() => { // probably solved by renderLine returning a promise that placeAt awaits
        editor.input?.caret?.placeAllAt();
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
        if (!this.settings.welcomeMessage) this.setNoteUrl(file.url);

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

    async saveFile(editor = this.editor) {
        let content = JSON.stringify(exportFile(editor));

        let res = await this.sendRequest("update_note", {
            method: 'POST',
            body: JSON.stringify({ id: editor.fileId, content }),
            headers: { "Content-Type": "application/json" }
        });
        if (res === -1) return;
        let text = await res.text();
        console.log(text);
        this.UI.alert("Saved", "Your file is now safe and sound");
        return text;
    }

    async getFiles() {
        let res = await this.sendRequest("notes"), json = [];
        if (res === -1) console.log("files weren't received");
        else {
            json = await res.json();
            for (let file of json) file.misc = JSON.parse(file.misc);
        }

        let currentFile;
        if (this.note_url != undefined) {
            console.log(this.note_url);
            currentFile = await this.getFile({ url: this.note_url });
        }
        if (currentFile != undefined && currentFile != -1) {
            let mode = this.URL.searchParams.get("mode")
            if (currentFile.user_id != this.user?.id && (mode == undefined || mode == "read")) currentFile.interactive = false;
            let index = json.indexOf(json.find(e => e.url == this.note_url) || {});
            if (index == -1) {
                json.push(currentFile);
            } else json[index] = currentFile;
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
            this.UI.filePicker.entries = this.files.filter(e => !e.misc?.deleted);
            this.UI.filePicker.querySelector(".list").innerHTML = this.UI.filePicker.entries.concat(this.systemFiles).map(e => `<div item-id="${e.id}">${e.name}</div>`).join("");
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
