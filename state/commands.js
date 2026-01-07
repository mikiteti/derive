import { exportToMD } from "../editor/assets.js";

const newCommands = (state) => {
    return [
        {
            name: "Create user",
            run: async () => {
                let data = prompt('Input your email, name and password separated by spaces to create an account.').split(' ');
                let res = await state.sendRequest("new_user", {
                    method: 'POST',
                    body: JSON.stringify({ email: data[0], name: data[1], password: data[2] }),
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include'
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                state.alert(text);

                state.commands.find(e => e.name === "Login").run(data[0], data[2]);
            }
        },
        {
            name: "Login",
            run: async (email, password) => {
                if (email == undefined || password == undefined) [email, password] = prompt('Input your email and password separated by a space to login.').split(' ');
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
                state.alert("Welcome", `You are now logged in`);
                state.reload(["user", "files", "currentFile", "editors"]);
            }
        },
        {
            name: "Delete file",
            run: async () => {
                let editor = state.editor;
                let res = await state.sendRequest("update_note", {
                    method: 'POST',
                    body: JSON.stringify({ id: editor.fileId, misc: JSON.stringify({ deleted: true }) }),
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
                let name = prompt('Input the new filename');
                let editor = state.editor;
                let res = await state.sendRequest("update_note", {
                    method: 'POST',
                    body: JSON.stringify({ id: editor.fileId, name }),
                    headers: { "Content-Type": "application/json" }
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);

                state.reload(["files"]);

                return text;
            }
        },
        {
            name: "Export to Markdown",
            run: () => {
                let text = exportToMD(state.editor);
                navigator.clipboard.writeText(text).then(() => {
                    console.log('Copied!', text);
                }).catch(console.error);
                state.alert("Exported", "Your file has been copied to your clipboard");
            }
        },
        {
            name: "Reload file",
            run: () => {
                state.reload(["file", "currentFile"]);
            }
        }

        // {
        //     name: "Restore file",
        //     run: async (file = state.editor.file) => {
        //         let res = await state.sendRequest("update_note", {
        //             method: 'POST',
        //             body: JSON.stringify({ id: file.id, misc: JSON.stringify({ deleted: false }) }),
        //             headers: { "Content-Type": "application/json" }
        //         });
        //         let text = await res.text();
        //         console.log(text);
        //     }
        // },
    ]
}

export default newCommands;
