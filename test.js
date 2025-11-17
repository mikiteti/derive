import Environment from "./environment.js";

const output = document.getElementById('output');
const URL = Environment.url;

const sendRequest = async (url, body) => {
    let res = await fetch(URL + url, { ...body, credentials: 'include' });

    if (res.status === 401 || res.status === 403) {
        console.log("must log in first...");
        res = await fetch(URL + "login", {
            method: 'POST',
            body: JSON.stringify({ email: document.querySelector('#loginForm .email').value, password: document.querySelector('#loginForm .password').value }),
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        if (res.status === 401 || res.status === 403) {
            output.textContent = await res.text();
            console.log("Login failed");
            return -1;
        }

        res = await fetch(URL + url, { ...body, credentials: 'include' });
    } else if (res.status === 400) {
        let text = await res.text();
        console.log(text);
        output.textContent = text;
        return -1;
    }

    return res;
}

// Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#loginForm .email').value;
    const password = document.querySelector('#loginForm .password').value;

    const res = await sendRequest("login", {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' },
    });

    const text = await res.text();
    output.textContent = text;
});

// Get user info (only logged in)
document.getElementById('user').addEventListener('click', async () => {
    const res = await sendRequest('user', {});
    const text = await res.text();
    output.textContent = text;
});

// Add user
document.getElementById('newUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.querySelector('#newUserForm .email').value;
    const name = document.querySelector('#newUserForm .name').value;
    const password = document.querySelector('#newUserForm .password').value;

    const res = await sendRequest('new_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
    });

    const text = await res.text();
    output.textContent = text;
});


// Get notes
document.getElementById("getNotes").addEventListener("click", async (e) => {
    e.preventDefault();

    const res = await sendRequest('notes', {});

    const text = await res.text();
    output.textContent = text;
})

// Add note
document.getElementById("newNoteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.querySelector("#newNoteForm .name").value;

    const res = await sendRequest('new_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });

    const text = await res.text();
    output.textContent = text;
});

// Get note
document.getElementById("getNoteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.querySelector("#getNoteForm .id").value;

    const res = await sendRequest('note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
    });

    const text = await res.text();
    output.textContent = text;
});

// Update a note
document.getElementById("updateNoteForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.querySelector("#updateNoteForm .id").value;
    const content = document.querySelector("#updateNoteForm .content").value;
    const name = document.querySelector("#updateNoteForm .name").value;
    const misc = document.querySelector("#updateNoteForm .misc").value;

    let changes = {};
    if (content) changes.content = content;
    if (name) changes.name = name;
    if (misc) changes.misc = misc;

    const res = await sendRequest('update_note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...changes }),
    });

    const text = await res.text();
    output.textContent = text;
});

