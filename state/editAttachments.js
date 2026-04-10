class AttachmentEditor {
    constructor({ type, url, wrapper, isNew = false } = {}) {
        this.type = type;
        this.url = url;
        wrapper.attachmentEditor = this;
        let editorElement = document.createElement("div");
        editorElement.classList.add("attachmentEditor");
        window.state.UI.attachmentEditor.appendChild(editorElement);
        this.element = editorElement;
        this.wrapper = wrapper;
        this.isNew = isNew;

        return this.create();
    }

    async create() {
        if (this.url) {
            let res = await window.state.sendRequest("attachment/content", {
                method: 'POST',
                body: JSON.stringify({ url: this.url }),
                headers: { "Content-Type": "application/json" },
            });
            if (res == -1) return;
            let json = await res.json();
            this.type = json.type;
            this.initialState = JSON.parse(json.content);
        }

        switch (this.type) {
            case "graph":
                await window.DesmosLoaded.promise;
                this.calculator = window.Desmos.GraphingCalculator(this.element, {
                    // invertedColors: true,
                    // colors: { blue: "#6b4e00", orange: "#0c2175", yellow: "#2264ae", olive: "#5d4175", green: "#a36b91", red: "#187d7b" },
                    // expressionsCollapsed: true,
                    border: false,
                    advancedStyling: true
                });
                break;
            case "geometry":
                await window.DesmosLoaded.promise;
                this.calculator = window.Desmos.Geometry(this.element, {
                    border: false,
                    expressionsCollapsed: true,
                    advancedStyling: true
                });
                break;
            case "sketch":
                console.log("sketches coming soon");
                break;
        }

        if (this.isNew) this.startEditing();
        else await this.setState(this.initialState);
    }

    startEditing() {
        this.wrapper.classList.add("editing");
        this.wrapper.querySelector(".editButton").innerHTML = "Done";
        let children = window.state.UI.attachmentEditor.children;
        for (let child of children) if (child.matches(".attachmentEditor")) child.style.display = "none";
        this.element.style.display = "block";
        window.state.UI.focus = window.state.UI.attachmentEditor;
        window.state.editedAttachment = this;
        window.state.UI.openModal(window.state.UI.attachmentEditor);
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();

        this.calculator?.updateSettings({ expressionsCollapsed: false });
    }

    async finishEditing() {
        this.wrapper.classList.remove("editing");
        this.wrapper.querySelector(".editButton").innerHTML = "Edit";
        const preview = await this.getPreview();
        if (window.state.editor.interactive) {
            const state = await this.getState();
            await window.state.sendRequest("update_attachment", {
                method: 'POST',
                body: JSON.stringify({ content: JSON.stringify(state), preview, url: this.url }),
                headers: { "Content-Type": "application/json" },
                credentials: 'include'
            });
        }

        let img = this.wrapper.querySelector("img");
        const blob = new Blob([preview], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        img.src = url;
        img.onload = () => {
            this.wrapper.classList.remove("notReady");
            img.onload = undefined;
        }
        if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();

        window.state.UI.closeModal();
    }

    async setState(state) {
        if (!state) return;


        switch (this.type) {
            case "geometry":
            case "graph":
                await window.DesmosLoaded.promise;
                this.calculator.setState(state);
                break;
            case "sketch":
                console.log("sketches coming soon");
                break;
        }
    }

    async getState() {
        switch (this.type) {
            case "geometry":
            case "graph":
                await window.DesmosLoaded.promise;
                this.calculator.updateSettings({ expressionsCollapsed: true });
                const state = this.calculator.getState();
                console.log(state);
                return state;
            case "sketch":
                console.log("sketches coming soon");
                break;
        }
    }

    async getPreview() {
        switch (this.type) {
            case "geometry":
            case "graph":
                await window.DesmosLoaded.promise;
                let preview;
                await new Promise(async (res, rej) => {
                    await this.calculator.asyncScreenshot({
                        format: 'svg',
                        showLabels: true,
                        width: 600,
                        height: 450
                    }, (svg) => {
                        preview = svg;
                        res();
                    });
                })
                return preview;
            case "sketch":
                console.log("sketches coming soon");
                break;
        }
    }

    destroy() {
        this.wrapper.attachmentEditor = undefined;
        this.element.remove();
        switch (this.type) {
            case "geometry":
            case "graph":
                this.calculator.destroy(); break;
            case "sketch":
                console.log("sketches coming soon");
                break;
        }
    }
}

export default AttachmentEditor;
