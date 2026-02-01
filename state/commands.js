import { exportToMD } from "../editor/assets.js";

const newCommands = (state) => {
    return [
        {
            name: "Create user",
            run: async () => {
                // let data = prompt('Input your email, name and password separated by spaces to create an account.').split(' ');
                let [email, name, password] = await state.prompt("Create user", "Input your email, name and password to create an account", { Email: 1, Name: 1, Password: 1 });
                let res = await state.sendRequest("new_user", {
                    method: 'POST',
                    body: JSON.stringify({ email, name, password }),
                    headers: { "Content-Type": "application/json" },
                    credentials: 'include'
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                state.alert(text);

                state.commands.find(e => e.name === "Login").run(email, password);
            }
        },
        {
            name: "Login",
            run: async (email, password) => {
                // if (email == undefined || password == undefined) [email, password] = prompt('Input your email and password separated by a space to login.').split(' ');
                if (email == undefined || password == undefined) [email, password] =
                    await state.prompt("Login", 'Input your email and password to log in', { "Email": 1, "Password": 1 });
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
                let [name] = await state.prompt("Rename file", 'Input the new filename', { "Filename": 1 });
                let editor = state.editor;
                let res = await state.sendRequest("update_note", {
                    method: 'POST',
                    body: JSON.stringify({ id: editor.fileId, name }),
                    headers: { "Content-Type": "application/json" }
                });
                if (res === -1) return;
                let text = await res.text();
                console.log(text);
                state.alert("Renamed", `Your file is now ${name}`);

                state.reload(["files"]);

                return text;
            }
        },
        {
            name: "Export to Markdown",
            run: () => {
                let text = exportToMD(state.editor);
                if (!text) {
                    state.alert("Error", "Something went wrong with the export");
                    return;
                }
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
        },
        {
            name: "Create file",
            run: async () => {
                let [fileName] = await state.prompt("Create file", "Input the filename in the box below", { Filename: 1 });

                await state.openFile(await state.createFile({ name: fileName }));
                state.focusEditor();
            }
        },

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
