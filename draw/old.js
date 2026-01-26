const canvas = document.querySelector(".canvas");
const tools = {
    line: {
        click: (e) => {
            let coords = getCoords(e, true);

            if (!activePath) {
                activePath = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
                canvas.appendChild(activePath);
            }
            let currentPoints = activePath.getAttribute("points");
            let newPoints;
            if (currentPoints == undefined) {
                newPoints = `${coords[0]},${coords[1]} ${coords[0]},${coords[1]}`;
            } else {
                let index = currentPoints.lastIndexOf(" ");
                let lastPoints = currentPoints.slice(index);
                newPoints = currentPoints.slice(0, index) + ` ${coords[0]},${coords[1]}` + lastPoints;
            }

            activePath.setAttribute("points", newPoints);
        },
        move: (e) => {
            let coords = getCoords(e);
            let currentPoints = activePath.getAttribute("points");
            let newPoints = currentPoints.slice(0, currentPoints.lastIndexOf(" ")) + ` ${coords[0]},${coords[1]}`;
            activePath.setAttribute("points", newPoints);
        },
        escape: () => {
            let points = activePath.getAttribute("points");
            activePath.setAttribute("points", points.slice(0, points.lastIndexOf(" ")));
        }
    },
    curve: {
        parseCRS: (points) => {
            if (points.length < 2) return '';

            let d = `M${points[0][0]},${points[0][1]}`;

            for (let i = 0; i < points.length - 1; i++) {
                let p0 = i === 0 ? points[0] : points[i - 1],
                    p1 = points[i],
                    p2 = points[i + 1],
                    p3 = i + 2 < points.length ? points[i + 2] : points[points.length - 1];

                let b1x = p1[0] + (p2[0] - p0[0]) / 6,
                    b1y = p1[1] + (p2[1] - p0[1]) / 6;

                let b2x = p2[0] - (p3[0] - p1[0]) / 6,
                    b2y = p2[1] - (p3[1] - p1[1]) / 6;

                d += ` C${b1x},${b1y} ${b2x},${b2y} ${p2[0]},${p2[1]}`;
            }

            return d;
        },
        parseClosedCRS: (points) => {
            if (points.length < 2) return '';

            const n = points.length;
            let d = `M${points[0][0]},${points[0][1]}`;

            for (let i = 0; i < n; i++) {
                const p0 = points[(i - 1 + n) % n];
                const p1 = points[i];
                const p2 = points[(i + 1) % n];
                const p3 = points[(i + 2) % n];

                const b1x = p1[0] + (p2[0] - p0[0]) / 6;
                const b1y = p1[1] + (p2[1] - p0[1]) / 6;

                const b2x = p2[0] - (p3[0] - p1[0]) / 6;
                const b2y = p2[1] - (p3[1] - p1[1]) / 6;

                d += ` C${b1x},${b1y} ${b2x},${b2y} ${p2[0]},${p2[1]}`;
            }

            d += ' Z'; // close path
            return d;
        },
        readPoints: (d) => {
            const commands = d.match(/[MC][^MC]+/g); // split M/C commands
            if (!commands || commands.length === 0) return [];

            // first point from M
            const m = commands[0].slice(1).trim().split(',').map(Number);
            const points = [m];

            // parse each C segment
            for (let i = 1; i < commands.length; i++) {
                const c = commands[i].slice(1).trim().split(/[ ,]+/).map(Number);
                // C takes 6 numbers: b1x,b1y b2x,b2y p2x,p2y
                if (c.length !== 6) continue;
                const p2 = [c[4], c[5]];  // the end point of this cubic = original Catmull-Rom point
                points.push(p2);
            }

            return points;
        },
        click: (e) => {
            let coords = getCoords(e, true);

            if (!activePath) {
                activePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
                canvas.appendChild(activePath);
                activePath.setAttribute("d", `M ${coords[0]},${coords[1]}`);
            }
            let currentPoints = tools.curve.readPoints(activePath.getAttribute("d") || "");
            let lastPoints = currentPoints[currentPoints.length - 1];
            currentPoints.pop();
            currentPoints.push(coords);
            currentPoints.push(lastPoints);
            let newD = tools.curve.parseCRS(currentPoints);

            activePath.setAttribute("d", newD);
        },
        move: (e) => {
            let coords = getCoords(e);
            let currentPoints = tools.curve.readPoints(activePath.getAttribute("d") || "");
            currentPoints[currentPoints.length - 1] = coords;
            activePath.setAttribute("d", tools.curve.parseCRS(currentPoints));
        },
        close: () => {
            let currentPoints = tools.curve.readPoints(activePath.getAttribute("d") || "");
            activePath.setAttribute("d", tools.curve.parseClosedCRS(currentPoints));
        },
        escape: () => {
            let points = tools.curve.readPoints(activePath.getAttribute("d") || "");
            points.pop();
            activePath.setAttribute("d", tools.curve.parseCRS(points));
        }
    },
    ellipse: {

    },
    rect: {

    },
};
const cellSize = 80;

let activeTool;
let activePath;
const selectTool = (tool = "line") => {
    console.log("selecting ", tool);
    activeTool = tools[tool];
    activePath = undefined;
}
selectTool("curve");

const snapToGrid = (coords) => {
    return coords.map(f => (Math.round((f - cellSize / 2) / cellSize) + 1 / 2) * cellSize);
}

const getCoords = (e, snap = false) => {
    let coords = [e.clientX, e.clientY]
    let canvasRect = canvas.getBoundingClientRect();
    coords = [coords[0] - canvasRect.left, coords[1] - canvasRect.top];
    coords = coords.map(f => Math.round(800 / canvasRect.width * f));
    if (snap) coords = snapToGrid(coords);

    return coords;
}

canvas.addEventListener("click", e => {
    activeTool.click(e);
});

let pointerDown = false;
canvas.addEventListener("pointerdown", e => {
    pointerDown = true;
});

canvas.addEventListener("pointerup", e => {
    pointerDown = false;
})

canvas.addEventListener("pointermove", e => {
    if (!activePath) return;

    activeTool.move(e);
});

document.addEventListener("keydown", e => {
    let key = e.key;
    e.preventDefault();

    switch (key) {
        case "Escape":
            if (activePath) {
                activeTool.escape();
                activePath = undefined;
            }
            break;
        case "l":
        case "c":
        case "e":
        case "r":
            selectTool({ l: "line", c: "curve", e: "ellipse", r: "rect" }[key]);
            break;
        case "z":
            activeTool.escape();
            activeTool.close();
            activePath = undefined;
            break;
    }
});
