const insert = {
    name: "root",
    next: [
        {
            name: "Escape",
            keys: ["Escape", "\\Cc"],
            run: (keys) => {
                curMode = "n";
            },
        },
        {
            name: "arrows",
            keys: ["ArrowLeft", "ArrowRight", "\\MArrowLeft", "\\MArrowRight", "\\AArrowLeft", "\\AArrowRight"],
            run: (keys) => 0,
        },
        {
            name: "backspace",
            keys: ["Backspace", "\\SBackspace", "\\ABackspace", "\\MBackspace"],
            run: (keys) => 0,
        },
        {
            name: "insert Enter",
            keys: ["Enter"],
            run: (keys) => {
                console.log("inserting Enter");
            }
        },
        {
            name: "insert char",
            keys: "any",
            run: (keys) => {
                console.log("inserting ", keys[0]);
            },
        },
    ]
};

const motions = [
    { // countable basic movements
        name: "countable basic movements",
        count: true,
        keys: ["h", "j", "k", "l", "w", "e", "b", "W", "E", "B", "G", "{", "}"],
        run: (keys) => 0,
    },
    { // uncountable basic movements
        name: "uncountable basic movements",
        keys: ["0", "$", "_", "^", "%", "G"],
        run: (keys) => 0,
    },
    { // g moves
        name: "g moves",
        count: true,
        keys: ["g"],
        next: [
            {
                name: "certain g move",
                keys: ["g", "j", "k", "e", "E", "_"],
                run: (keys) => 0,
            },
            {
                name: "gJ",
                keys: ["J"],
                run: (keys) => 0,
            },
        ]
    },
    { // find
        name: "find",
        count: true,
        keys: ["f", "t", "F", "T"],
        next: [
            {
                name: "find this",
                keys: "any",
                run: (keys, { method } = {}) => {
                    console.log(`running ${method}${keys[0]}`);
                },
            },
        ],
        run: (keys, nexts) => {
            console.log("running", keys[0]);
            runNext(this, keys, nexts, { method: keys[0] });
        }
    },
    { // repeat find
        name: "repeat find",
        count: true,
        keys: [";", ","],
        run: (keys) => 0,
    },
];

const textObjects = [
    { // text objects
        name: "half text objects (i/a)",
        keys: ["i", "a"],
        next: [
            {
                name: "full text objects",
                keys: ["w", "W", "s", "p", "b", "B", "t", "'", "\"", "`", "{", "}", "(", ")", "[", "]", "<", ">"],
                run: (keys, { method } = {}) => {
                    console.log(`running text object ${method}${keys[0]}`);
                },
            },
        ],
        run: (keys, nexts) => {
            return runNext(this, keys, nexts, { method: keys[0] })
        }
    },
]

const motionsAfterHeadcommands = [ // will see which ones are necessary: fallback is motions, so j and k should be overriden, but 0 and $ don't need to  
    { // basic movements
        name: "countable basic movements",
        count: true,
        keys: ["h", "j", "k", "l", "w", "e", "b", "W", "E", "B", "{", "}"],
        run: (keys) => 0,
    },
    { // basic movements
        name: "uncountable basic movements",
        keys: ["0", "$", "_", "^", "G", "%"],
        run: (keys) => 0,
    },
    { // g moves
        name: "g moves",
        count: true,
        keys: ["g"],
        next: [
            {
                name: "certain g move",
                keys: ["g", "j", "k", "e", "E", "_"],
                run: (keys) => 0,
            },
        ]
    },
    { // find
        name: "find",
        count: true,
        keys: ["f", "t", "F", "T"],
        next: [
            {
                name: "find this",
                keys: "any",
                run: (keys) => 0,
            },
        ]
    },
    { // repeat find
        name: "repeat find",
        count: true,
        keys: [";", ","],
        run: (keys) => 0,
    },
];

const runNext = (node, keys, nexts, context) => {
    let slice = (node.count && !Number.isNaN(keys[0])) ? 2 : 1;
    if (nexts[0].next) return nexts[0].run(keys.slice(slice), nexts.slice(1), context);
    return nexts[0].run(keys.slice(slice), context);
}

const normal = {
    name: "root",
    next: [
        { // mode changes
            name: "mode changes",
            keys: ["i", "a", "I", "A", "v", "V", "o", "O"],
            run: (keys) => {
                (({
                    "i": () => { curMode = "i" },
                    "v": () => { curMode = "v" },
                })[keys[0]] || (() => 0))();
            },
        },
        ...motions,
        { // repeat last command
            name: "repeat last command",
            count: true,
            keys: ["."],
            run: (keys) => 0,
        },
        { // position cursor
            name: "position cursor on screen",
            keys: ["z"],
            next: [
                {
                    name: "position cursor here on screen",
                    keys: ["z", "t", "b"],
                    run: (keys) => 0,
                },
            ]
        },
        { // move screen
            name: "move screen",
            keys: ["\\Ce", "\\Cy", "\\Cb", "\\Cf", "\\Cd", "\\Cu"],
            run: (keys) => 0,
        },
        {
            name: "indent",
            keys: ["<", ">"],
            run: (keys) => {
                console.log(`indenting lines with ${keys[0]} in normal mode`);
            }
        },
        { // dd
            name: "d",
            count: true,
            keys: ["d"],
            next: [
                {
                    name: "dd",
                    keys: ["d"],
                    run: (keys) => 0,
                }
            ]
        },
        { // cc
            name: "c",
            count: true,
            keys: ["c"],
            next: [
                {
                    name: "cc",
                    keys: ["c"],
                    run: (keys) => 0,
                }
            ]
        },
        { // yy
            name: "y",
            count: true,
            keys: ["y"],
            next: [
                {
                    name: "yy",
                    keys: ["y"],
                    run: (keys) => 0,
                }
            ]
        },
        { // headcommands
            name: "headcommands",
            keys: ["d", "c", "y"],
            next: [
                ...textObjects,
                ...motionsAfterHeadcommands,
                ...motions, // fallback
            ],
            run: (keys, nexts) => {
                console.log(`running headcommand ${keys[0]}`);
                runNext(this, keys, nexts);
            }
        },
        { // capital headcommands
            name: "capital headcommands",
            count: true,
            keys: ["D", "C", "Y"],
            run: (keys) => 0,
        },
        { // g actions
            name: "g actions",
            count: true,
            keys: ["g"],
            next: [
                {
                    name: "certain g action",
                    count: true,
                    keys: ["~", "u", "U"],
                    next: [
                        ...motionsAfterHeadcommands,
                    ]
                },
            ]
        },
        { // x, X
            name: "x, X",
            count: true,
            keys: ["x", "X"],
            run: (keys) => 0,
        },
        { // join
            name: "join lines",
            count: true,
            keys: ["J"],
            run: (keys) => 0,
        },
        {
            name: "replace",
            count: true,
            keys: ["r"],
            next: [
                {
                    name: "replace this",
                    keys: "any",
                    run: (keys) => 0,
                },
            ]
        },
    ]
};

const visual = {
    name: "root",
    next: [
        {
            name: "Escape",
            keys: ["Escape", "\\Cc"],
            run: (keys) => {
                curMode = "n";
            }
        },
        ...motions,
        ...textObjects,
        {
            name: "visual headcommands",
            keys: ["d", "c", "y", "~", "u", "U"],
            next: [
                ...motionsAfterHeadcommands,
            ],
            run: (keys) => {
                console.log(`running ${keys[0]} in visual mode`);
            }
        },
        {
            name: "indent",
            keys: ["<", ">"],
            run: (keys) => {
                console.log(`indenting lines with ${keys[0]} in visual mode`);
            }
        },
        {
            name: "switch selection ends",
            keys: ["o"],
            run: (keys) => 0,
        }
    ]
};

// --------------------------------------------------------------------------------------
let curCommand = [], curMode = "n";
const parse = (command = curCommand, mode = curMode) => {
    let currentBranches = [{ node: { "n": normal, "i": insert, "v": visual }[mode], trace: [] }], nextBranches, keyCount = 0;
    if (currentBranches[0].node == undefined) {
        console.error("unknown mode");
        return 1;
    }

    for (let key of command) {
        keyCount++;

        nextBranches = [];
        for (let branch of currentBranches) {
            // console.log("checking branch", (branch.name || "no name"));
            let nexts = branch.node.next;
            let correctNexts = nexts.filter(e => (e.keys.includes(key) || key.length === 1 && e.keys == "any"));
            for (let next of correctNexts) {
                nextBranches.push({ node: next, trace: [...branch.trace, next] });
            }

            if (!Number.isNaN(parseInt(key)) && nexts.find(e => e.count) !== undefined) nextBranches.push(branch);
        }

        if (nextBranches.length === 0) {
            // no match: abort
            return 0;
        }

        for (let branch of nextBranches) {
            // console.log("checking if branch", (branch.node.name || "no name"), "has a command to run");
            if (branch.node.next == undefined && branch.node.run !== undefined && (branch.node.keys.includes(key) || key.length === 1 && branch.node.keys == "any")) {
                console.log(branch);
                let outerMostRun = branch.trace.find(e => e.run);
                if (outerMostRun == undefined) {
                    console.error("compromised command tree: no outermost run found for", command);
                    return 1;
                }
                let index = branch.trace.indexOf(outerMostRun);
                console.log("will run", outerMostRun, "with", command.slice(0, keyCount).slice(index), branch.trace.slice(index + 1).map(e => e.run));

                return () => { outerMostRun.run(command.slice(0, keyCount).slice(index), branch.trace.slice(index + 1)); };
            }
        }

        currentBranches = nextBranches;
    }
}

let groupLevel = 0;
window.addEventListener("keydown", (e) => {
    if (e.key.length !== 1 && !["Tab", "Escape", "Backspace", "Enter", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        return;
    }

    let key = (e.metaKey ? "\\M" : "")
        + (e.altKey ? "\\A" : "")
        + (e.ctrlKey ? "\\C" : "")
        + (e.shiftKey && (e.key.length !== 1 || e.metaKey || e.altKey || e.ctrlKey) ? "\\S" : "")
        + e.key;
    console.group(key);
    groupLevel++;
    if (!Number.isNaN(parseInt(curCommand.at(-1))) && parseInt(curCommand.at(-1)) !== 0 && !Number.isNaN(parseInt(key))) curCommand[curCommand.length - 1] = curCommand.at(-1) + key;
    else curCommand.push(key);

    document.getElementById("curMode").innerHTML = curMode;
    document.getElementById("curCommand").innerHTML = curCommand.join("");

    let parsed = parse();
    switch (parsed) {
        case undefined:
            console.log("no command found for", curCommand);
            break;
        case 0:
            console.log("%caborting command for", "color: red; font-weight: bold", curCommand);
            curCommand = [];
            while (groupLevel > 0) {
                console.groupEnd();
                groupLevel--;
            }
            break;
        default:
            console.log("%ccommand found for", "color: green; font-weight: bold", curCommand);
            curCommand = [];
            parsed();
            while (groupLevel > 0) {
                console.groupEnd();
                groupLevel--;
            }
            break;
    }

    setTimeout(() => {
        document.getElementById("curMode").innerHTML = curMode;
        document.getElementById("curCommand").innerHTML = curCommand.join("");
    }, 250);
});
