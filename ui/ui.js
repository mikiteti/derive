import { getUrl, key, parseHotkey, saveState } from "../editor/assets.js";
import newCommands from "../state/commands.js";
import AttachmentEditor from "../state/editAttachments.js";

class UI {
    constructor(state = window.state) {
        this.state = state;
        window.UI = this;

        this.commandPalette = document.querySelector("#commandPalette");
        this.filePicker = document.querySelector("#filePicker");
        this.attachments = document.querySelector("#attachments");
        this.attachmentEditor = document.querySelector("#attachmentEditor");
        this.modalBg = document.querySelector("#modalBg");
        this.alerts = document.querySelector("#alerts");
        this.prompts = document.querySelector("#prompts");
        this.modalBg.addEventListener("click", () => {
            console.log("closing modal");
            if (this.focus === this.attachmentEditor) this.state.editedAttachment.finishEditing();
            else this.closeModal();
        });

        document.querySelector("#closeButton").addEventListener("click", () => {
            this.state.editedAttachment?.finishEditing();
        });

        this.initFuzzyFinders().then(() => {
            console.log(this.state.note_url);
            if (this.state.note_url != undefined && this.state.files.find(e => e.url == this.state.note_url).content) {
                console.log({ note_url: this.state.note_url });
                console.log(this.state.files.find(e => e.url == this.state.note_url));
                this.state.newEditor(this.state.files.find(e => e.url == this.state.note_url));
            } else this.state.newEditor(this.state.systemFiles.find(e => e.id === "welcome"));
        });

        this.initListeners();

        if (this.state.settings.lineNumbers && !this.state.settings.relNumbers) document.documentElement.classList.add("lineNumbers");
        else document.documentElement.classList.remove("lineNumbers");
        if (this.state.settings.lineNumbers && this.state.settings.relNumbers) document.documentElement.classList.add("relNumbers");
        else document.documentElement.classList.remove("relNumbers");
    }

    initListeners() {
        document.addEventListener("click", e => {
            if (e.target.matches(".textarea p .link")) {
                window.open(getUrl(e.target.textContent.trim()).href, "_blank");
                return;
            }

            if (e.target.matches(".imgWrapper .editButton")) {
                let wrapper = e.target.parentElement;

                if (wrapper.classList.contains("editing")) { // finishing edit
                    wrapper.attachmentEditor?.finishEditing();
                } else { // starting edit
                    if (wrapper.attachmentEditor == undefined) new AttachmentEditor({
                        url: wrapper.getAttribute("url"),
                        wrapper
                    });
                    wrapper.attachmentEditor.startEditing();
                }
            }

            if (e.target.matches("#attachments img")) {
                navigator.clipboard.writeText("view" + e.target.src.split("view")[1]);
                this.alert("Copied", "The link to the attachment is on your clipboard");

                return;
            }

            if (this.state.editor == undefined) return;
            if (!this.state.editor.interactive) return;
            if (this.focus?.isEditor && !this.focus?.classList?.has("prompt")) document.getElementById("focus").focus();
        });

        window.addEventListener("resize", _ => {
            this.state.editor.input.caret?.placeAllAt();
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

            if (key.metaKey(e) && ["o", "p"].includes(e.key)) {
                if (e.key === "o") {
                    e.preventDefault();
                    this.openModal(this.filePicker);
                    return;
                }
                if (e.key === "p") {
                    e.preventDefault();
                    this.openModal(this.commandPalette);
                    return;
                }
            }
        });

        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "hidden") {
                saveState();
            }
        });

        this.touchStart = undefined;
        document.addEventListener("touchstart", (e) => {
            if (this.touchStart == undefined && e.touches.length === 1) {
                this.touchStart = [e.touches[0].clientX, e.touches[0].clientY];
            } else {
                this.touchStart = undefined;
            }
        });

        document.addEventListener("touchmove", (e) => {
            if (this.touchStart != undefined && e.touches.length === 1) {
                let [x0, y0] = this.touchStart;
                let [x1, y1] = [e.touches[0].clientX, e.touches[0].clientY];
                if (x1 - x0 > 80 && Math.abs(y1 - y0) < 40) {
                    this.touchStart = undefined;
                    this.openModal(this.filePicker);
                }
                else if (x1 - x0 < -80 && Math.abs(y1 - y0) < 40) {
                    this.touchStart = undefined;
                    this.openModal(this.commandPalette);
                }
            }
        })

        document.addEventListener("touchend", () => {
            this.touchStart = undefined;
        });
    }

    async initFuzzyFinders() {
        this.state.files = await this.state.getFiles();
        this.filePicker.entries = this.state.files.filter(e => !e.misc?.deleted);
        this.filePicker.querySelector(".list").innerHTML = this.filePicker.entries.concat(this.state.systemFiles).map(e => `<div item-id="${e.id}">${e.name}</div>`).join("");
        this.state.commands = newCommands(this.state).map((e, f) => ({ ...e, id: f + 1 }));
        this.commandPalette.entries = this.state.commands;
        this.commandPalette.querySelector(".list").innerHTML = this.commandPalette.entries.map(e =>
            `<div class="item" item-id="${e.id}">
                <span>${e.name.includes(":")
                ? `<span class="">${e.name.slice(0, e.name.indexOf(":") + 1)}</span><span>${e.name.slice(e.name.indexOf(":") + 1)}</span>`
                : e.name}</span>
                ${e.hotkey ? `<span class="hotkey">${parseHotkey(e.hotkey)}</span>` : ``}
            </div>`
        ).join("");

        window.addEventListener("keydown", (e) => {
            if ([this.filePicker, this.commandPalette].includes(this.focus) && e.key === "Escape") {
                this.closeModal();
            }
        });

        this.commandPalette.querySelector("input").addEventListener("input", (_) => {
            this.state.handleFuzzySearch(this.commandPalette);
        });

        this.filePicker.querySelector("input").addEventListener("input", (_) => {
            if (this.filePicker.querySelector("input").value.startsWith(".")) {
                this.state.handleFuzzySearch(this.filePicker, this.state.systemFiles);
            }
            else this.state.handleFuzzySearch(this.filePicker);
        });

        this.commandPalette.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            console.log(this.state.commands, e.target);
            this.closeModal();
            this.state.runCommand(this.state.commands.find(f => f.id == parseInt(e.target.getAttribute("item-id"))));
        });

        this.filePicker.addEventListener("click", async e => {
            if (!e.target.matches(".list div")) return;
            await this.state.openFile({ id: parseInt(e.target.getAttribute("item-id")) || e.target.getAttribute("item-id") });
            this.closeModal();
        });

        this.filePicker.querySelector("input").addEventListener("keydown", async (e) => {
            if (e.key === "Enter" && key.metaKey(e)) {
                await this.state.openFile(await this.createFile({ name: this.filePicker.querySelector("input").value }));
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

    async openModal(modal) {
        if (this.focus?.isConnected && this.focus?.matches(".modal")) await this.closeModal();

        modal.style.display = "flex";
        modal.animate([
            { opacity: 0, transform: "translate(-50%, 3px)" },
            { opacity: 1, transform: "translate(-50%, 0px)" }
        ], { duration: 100 });
        this.modalBg.style.display = "unset";
        this.modalBg.animate([
            { opacity: 0 },
            { opacity: 1 }
        ], { duration: 100 });

        this.focus = modal;
        let input = modal.querySelector("input");
        if (input) {
            input.focus();
            input.value = "";
            this.state.handleFuzzySearch(modal);
        }
    }

    async closeModal() {
        this.focus.style.display = "none";
        this.focus.animate([
            { opacity: 1, transform: "translate(-50%, 0px)", display: "flex" },
            { opacity: 0, transform: "translate(-50%, 3px)", display: "flex" }
        ], { duration: 100 });
        this.modalBg.style.display = "none";
        this.modalBg.animate([
            { opacity: 1, display: "unset" },
            { opacity: 0, display: "unset" }
        ], { duration: 100 });

        document.getElementById("focus").focus();
        this.focus = this.state.editor;

        return new Promise(res => {
            setTimeout(() => {
                requestAnimationFrame(res);
            }, 100)
        });
    }

    focusEditor() {
        this.focus = this.state.editor;
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

        let promise = new Promise((res) => {
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
}

export default UI;
