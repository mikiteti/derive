const wrapper = document.querySelector(".wrapper");
const canvas = wrapper.querySelector(".canvas");
const overlay = wrapper.querySelector(".overlay");
const nodeWrapper = overlay.querySelector(".nodes");
const boundingRect = overlay.querySelector(".boundingRect");

const paths = [];
class Path {
    constructor(shape, points, style, group = false) {
        if (!group) {
            this.shape = shape;
            this.points = points;
            this.pointsTransformed = points;
            this.style = style;
            this.element = this.shape.createElement();
            paths.push(this);
            this.nodes = { primary: [], secondary: [] };
        }

        this.rect = { w: 1, h: 1, x: 0, y: 0, r: 0 };
    }

    getNodes() {
        return this.shape?.getNodes(this.pointsTransformed);
    }

    updateElement() {
        this.shape?.updateElement(this.element, this.pointsTransformed, this.style);
        this.bbox = this.element?.getBBox();
    }

    select() {
        activePath?.escape();
        activePath = this;
        activeTool = this.shape;

        let nodes = this.getNodes();
        while (nodes.primary.length > this.nodes.primary.length) {
            let node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            node.setAttribute("r", "10");
            node.path = this;
            node.classList.add("primary");
            this.nodes.primary.push(node);
        }
        while (nodes.primary.length < this.nodes.primary.length) {
            this.nodes.primary.at(-1).remove();
            this.nodes.primary.pop();
        }
        nodes.primary.map((e, f) => {
            this.nodes.primary[f].setAttribute("cx", e[0]);
            this.nodes.primary[f].setAttribute("cy", e[1]);
            this.nodes.primary[f].index = f;
        });

        while (nodes.secondary.length > this.nodes.secondary.length) {
            let node = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            node.setAttribute("r", "8");
            node.path = this;
            node.classList.add("secondary");
            this.nodes.secondary.push(node);
        }
        while (nodes.secondary.length < this.nodes.secondary.length) {
            this.nodes.secondary.at(-1).remove();
            this.nodes.secondary.pop();
        }
        nodes.secondary.map((e, f) => {
            this.nodes.secondary[f].setAttribute("cx", e[0]);
            this.nodes.secondary[f].setAttribute("cy", e[1]);
            this.nodes.secondary[f].index = f;
        });

        for (let node of this.nodes.primary.concat(this.nodes.secondary)) nodeWrapper.appendChild(node);

        let { A, B, C, D } = this.getRectCorners();
        if (!Number.isNaN(A[0])) {
            boundingRect.innerHTML = `<path class="rect" d="M${A[0]},${A[1]} L${B[0]},${B[1]} L${C[0]},${C[1]} L${D[0]},${D[1]} z" />
<circle class="corner A" cx="${A[0]}" cy="${A[1]}" r="6" />
<circle class="corner B" cx="${B[0]}" cy="${B[1]}" r="6" />
<circle class="corner C" cx="${C[0]}" cy="${C[1]}" r="6" />
<circle class="corner D" cx="${D[0]}" cy="${D[1]}" r="6" />
<circle class="corner R" cx="${(A[0] + B[0]) / 2}" cy="${(A[1] + B[1]) / 2}" r="6" />`;
        }
    }

    getRectCorners() {
        let rect = this.getBoundingRect();
        let [A, B, C, D] = this.transformPoints([
            [rect.x, rect.y],
            [rect.x + rect.w, rect.y],
            [rect.x + rect.w, rect.y + rect.h],
            [rect.x, rect.y + rect.h]
        ]);

        let a = [B[0] - A[0], B[1] - A[1]], b = [D[0] - A[0], D[1] - A[1]];
        a = a.map(e => e * 20 / Math.hypot(...a));
        b = b.map(e => e * 20 / Math.hypot(...b));
        if (Number.isNaN(b[0])) b = [-a[1], a[0]];
        else if (Number.isNaN(a[0])) a = [b[1], -b[0]];
        A = [A[0] - a[0] - b[0], A[1] - a[1] - b[1]];
        B = [B[0] + a[0] - b[0], B[1] + a[1] - b[1]];
        C = [C[0] + a[0] + b[0], C[1] + a[1] + b[1]];
        D = [D[0] - a[0] + b[0], D[1] - a[1] + b[1]];

        return { A, B, C, D }
    }

    transformPoint(p) { // order: scale, rotate, translate
        let [x, y] = p;
        x *= this.rect.w;
        y *= this.rect.h;

        let mat = [[Math.cos(this.rect.r), Math.sin(this.rect.r)], [-Math.sin(this.rect.r), Math.cos(this.rect.r)]];
        let X = x, Y = y;
        x = mat[0][0] * X + mat[0][1] * Y;
        y = mat[1][0] * X + mat[1][1] * Y;

        x += this.rect.x;
        y += this.rect.y;

        return [x, y];
    }

    transformPoints(points) {
        let mat = [[Math.cos(this.rect.r), Math.sin(this.rect.r)], [-Math.sin(this.rect.r), Math.cos(this.rect.r)]];
        return points.map(p => {
            let [x, y] = p;
            x *= this.rect.w;
            y *= this.rect.h;

            let X = x, Y = y;
            x = mat[0][0] * X + mat[0][1] * Y;
            y = mat[1][0] * X + mat[1][1] * Y;

            x += this.rect.x;
            y += this.rect.y;

            return [x, y];
        });
    }

    transformPointBack(p) { // order: translate, rotate, scale
        let [x, y] = p;
        x -= this.rect.x;
        y -= this.rect.y;

        let mat = [[Math.cos(this.rect.r), -Math.sin(this.rect.r)], [Math.sin(this.rect.r), Math.cos(this.rect.r)]];
        let X = x, Y = y;
        x = mat[0][0] * X + mat[0][1] * Y;
        y = mat[1][0] * X + mat[1][1] * Y;

        x /= this.rect.w;
        y /= this.rect.h;

        return [x, y];
    }

    getBoundingRect() { // not transformed
        let rect = this.shape.getBoundingRect(this.points);
        if (rect.w === 0) {
            rect.w = 2;
            rect.x--;
        }
        if (rect.h === 0) {
            rect.h = 2;
            rect.y--;
        }
        return rect;
    }

    addPoint(coords, index = this.points.length) {
        let left = this.points.slice(0, index), right = this.points.slice(index);
        this.points = [...left, coords, ...right];
        this.pointsTransformed = this.transformPoints(this.points);
    }

    movePoint(coords, index) {
        this.points[index] = this.transformPointBack(coords);
        this.pointsTransformed[index] = coords;
    }

    deletePoint(index) {
        let left = this.points.slice(0, index), right = this.points.slice(index + 1);
        this.points = [...left, ...right];
        this.pointsTransformed = this.transformPoints(this.points);
        if (this.points.length < 2) this.delete();
    }

    moveCorner(coords, cornerSign, movement, rect = this.getBoundingRect()) {
        let a = [20 * Math.cos(this.rect.r), -20 * Math.sin(this.rect.r)], b = [20 * Math.sin(this.rect.r), 20 * Math.cos(this.rect.r)];
        if (cornerSign == "R") coords = [coords[0] + b[0], coords[1] + b[1]];
        else {
            (cornerSign == "A" || cornerSign == "B") ? coords = [coords[0] + b[0], coords[1] + b[1]] : coords = [coords[0] - b[0], coords[1] - b[1]];
            (cornerSign == "A" || cornerSign == "D") ? coords = [coords[0] + a[0], coords[1] + a[1]] : coords = [coords[0] - a[0], coords[1] - a[1]];
        }
        if (cornerSign !== "R") coords = this.transformPointBack(coords);
        switch (cornerSign) {
            case "A":
                let bottomRight = this.transformPoint([rect.x + rect.w, rect.y + rect.h]);
                this.rect.w *= (rect.x + rect.w - coords[0]) / rect.w;
                this.rect.h *= (rect.y + rect.h - coords[1]) / rect.h;
                let newBottomRight = this.transformPoint([rect.x + rect.w, rect.y + rect.h]);
                this.rect.x += -newBottomRight[0] + bottomRight[0];
                this.rect.y += -newBottomRight[1] + bottomRight[1];
                break;
            case "B":
                let bottomLeft = this.transformPoint([rect.x, rect.y + rect.h]);
                this.rect.w *= (coords[0] - rect.x) / rect.w;
                this.rect.h *= (rect.y + rect.h - coords[1]) / rect.h;
                let newBottomLeft = this.transformPoint([rect.x, rect.y + rect.h]);
                this.rect.x += -newBottomLeft[0] + bottomLeft[0];
                this.rect.y += -newBottomLeft[1] + bottomLeft[1];
                break;
            case "C":
                let topLeft = this.transformPoint([rect.x, rect.y]);
                this.rect.w *= (coords[0] - rect.x) / rect.w;
                this.rect.h *= (coords[1] - rect.y) / rect.h;
                let newTopLeft = this.transformPoint([rect.x, rect.y]);
                this.rect.x += -newTopLeft[0] + topLeft[0];
                this.rect.y += -newTopLeft[1] + topLeft[1];
                break;
            case "D":
                let topRight = this.transformPoint([rect.x + rect.w, rect.y]);
                this.rect.w *= (rect.x + rect.w - coords[0]) / rect.w;
                this.rect.h *= (coords[1] - rect.y) / rect.h;
                let newTopRight = this.transformPoint([rect.x + rect.w, rect.y]);
                this.rect.x += -newTopRight[0] + topRight[0];
                this.rect.y += -newTopRight[1] + topRight[1];
                break;
            case "R":
                let middle = this.transformPoint([rect.x + rect.w / 2, rect.y + rect.h / 2]);
                let vec = [coords[0] - middle[0], coords[1] - middle[1]];
                this.rect.r = -Math.acos(-Math.sign(this.rect.h) * vec[1] / Math.hypot(...vec)) * Math.sign(vec[0] * this.rect.h);
                let newMiddle = this.transformPoint([rect.x + rect.w / 2, rect.y + rect.h / 2]);
                this.rect.x += -newMiddle[0] + middle[0];
                this.rect.y += -newMiddle[1] + middle[1];
                break;
            case "rect":
                let wrapperRect = wrapper.getBoundingClientRect();
                this.rect.x += movement[0] * 800 / wrapperRect.width;
                this.rect.y += movement[1] * 800 / wrapperRect.height;
                break;
        }

        this.pointsTransformed = this.transformPoints(this.points);
    }

    escape() {
        for (let node of this.nodes.primary.concat(this.nodes.secondary)) node.remove();
        this.nodes = { primary: [], secondary: [] };
        activePath = undefined;
        boundingRect.innerHTML = ``;
    }

    delete() {
        console.log("deleting path");
        this.escape();
        paths[paths.indexOf(paths.find(e => e === this))] = undefined;
        this.element.remove();
        delete this;
    }
}

class PathGroup extends Path {
    constructor(paths) {
        super(undefined, undefined, undefined, true);

        this.paths = paths;
    }

    escape() {
        for (let path of this.paths) path.escape();
    }

    updateElement() {
        for (let path of this.paths) path.updateElement();
    }

    select() {
        activePath?.escape();
        activePath = this;
        activeTool = this.shape;

        boundingRect.innerHTML = `<path class="rect" d="M${A[0]},${A[1]} L${B[0]},${B[1]} L${C[0]},${C[1]} L${D[0]},${D[1]} z" />
<circle class="corner A" cx="${A[0]}" cy="${A[1]}" r="6" />
<circle class="corner B" cx="${B[0]}" cy="${B[1]}" r="6" />
<circle class="corner C" cx="${C[0]}" cy="${C[1]}" r="6" />
<circle class="corner D" cx="${D[0]}" cy="${D[1]}" r="6" />
<circle class="corner R" cx="${(A[0] + B[0]) / 2}" cy="${(A[1] + B[1]) / 2}" r="6" /> `
    }

    moveCorner() {

    }

    delete() {
        for (let path of this.paths) path.delete();
        delete this;
    }
}

const shapes = { // shapes are a subset of tools, tools contain select, erase, ... as well
    line: {
        createElement: () => {
            let element = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
            canvas.appendChild(element);
            return element;
        },
        getNodes: (points) => {
            let midPoints = [];
            for (let i = 0; i < points.length - 1; i++) midPoints.push([(points[i][0] + points[i + 1][0]) / 2, (points[i][1] + points[i + 1][1]) / 2]);
            return {
                primary: points,
                secondary: midPoints,
            }
        },
        updateElement: (element, points, style) => {
            element.setAttribute("points", points.map(e => `${e[0]},${e[1]}`).join(" "));
            for (let attr in style) element.setAttribute(attr, style[attr]);
        },
        getBoundingRect: (points) => {
            let xmin = Math.min(...points.map(e => e[0])),
                ymin = Math.min(...points.map(e => e[1]));
            let xmax = Math.max(...points.map(e => e[0])),
                ymax = Math.max(...points.map(e => e[1]));

            return { x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin }
        }
    },
    curve: {
        createElement: () => {
            let element = document.createElementNS("http://www.w3.org/2000/svg", "path");
            canvas.appendChild(element);
            return element;
        },
        getNodes: (points) => {
            return {
                primary: points,
                // secondary: [],
                secondary: points.length < 2 ? [] : Array.from({ length: points.length - 1 }, () => 0).map((_, t) => shapes.curve.getPointOnCRS(points, t + 0.5)),
            }
        },
        updateElement: (element, points, style) => {
            element.setAttribute("d", shapes.curve.parseCRS(points));
            for (let attr in style) element.setAttribute(attr, style[attr]);
        },
        getBoundingRect: (points) => {
            let xmin = Math.min(...points.map(e => e[0])),
                ymin = Math.min(...points.map(e => e[1]));
            let xmax = Math.max(...points.map(e => e[0])),
                ymax = Math.max(...points.map(e => e[1]));

            return { x: xmin, y: ymin, w: xmax - xmin, h: ymax - ymin }
        },
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
        getPointOnCRS: (points, t) => {
            const n = points.length;
            if (n < 2) throw new Error("Need at least two points");

            // Clamp t
            t = Math.max(0, Math.min(t, n - 1));

            const i = Math.floor(t);
            const u = t - i;

            // Handle boundary conditions by clamping endpoints
            const p0 = points[i - 1] || points[i];
            const p1 = points[i];
            const p2 = points[i + 1] || points[i];
            const p3 = points[i + 2] || p2;

            const u2 = u * u;
            const u3 = u2 * u;

            const x =
                0.5 * (
                    2 * p1[0] +
                    (-p0[0] + p2[0]) * u +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3
                );

            const y =
                0.5 * (
                    2 * p1[1] +
                    (-p0[1] + p2[1]) * u +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3
                );

            return [x, y];
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
        getPointsOnClosedCRS: (points, t) => {
            const n = points.length;
            t = ((t % n) + n) % n;

            const i = Math.floor(t);
            const u = t - i;

            const p0 = points[(i - 1 + n) % n];
            const p1 = points[i % n];
            const p2 = points[(i + 1) % n];
            const p3 = points[(i + 2) % n];

            const u2 = u * u;
            const u3 = u2 * u;

            const x =
                0.5 * (
                    2 * p1[0] +
                    (-p0[0] + p2[0]) * u +
                    (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 +
                    (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3
                );

            const y =
                0.5 * (
                    2 * p1[1] +
                    (-p0[1] + p2[1]) * u +
                    (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 +
                    (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3
                );

            return [x, y];
        }
    },
    ellipse: {
        createElement: () => {
            let element = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
            canvas.appendChild(element);
            return element;
        },
        getNodes: (points) => {
            return {
                primary: [],
                secondary: [],
            }
        },
        updateElement: (element, points, style) => {
            element.setAttribute("cx", points[0][0]);
            element.setAttribute("cy", points[0][1]);
            element.setAttribute("rx", Math.hypot(points[0][0] - points[1][0], points[0][1] - points[1][1]));
            element.setAttribute("ry", Math.hypot(points[0][0] - points[1][0], points[0][1] - points[1][1]));
            for (let attr in style) element.setAttribute(attr, style[attr]);
        },
        getBoundingRect: (points) => {
            let r = Math.hypot(points[0][0] - points[1][0], points[0][1] - points[1][1]);
            return { x: points[0][0] - r, y: points[0][1] - r, w: 2 * r, h: 2 * r }
        }
    },
    rect: {
        createElement: () => {
            let element = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            canvas.appendChild(element);
            return element;
        },
        getNodes: (points) => {
            return {
                primary: [],
                secondary: [],
            }
        },
        updateElement: (element, points, style) => {
            // points[0]: top left corner, points[1]: bottom right corner -- but sometimes swapped
            element.setAttribute("x", Math.min(points[0][0], points[1][0]));
            element.setAttribute("y", Math.min(points[0][1], points[1][1]));
            element.setAttribute("width", Math.abs(points[0][0] - points[1][0]));
            element.setAttribute("height", Math.abs(points[0][1] - points[1][1]));
            for (let attr in style) element.setAttribute(attr, style[attr]);
        },
        getBoundingRect: (points) => {
            return { x: points[0][0], y: points[0][1], w: points[1][0] - points[0][0], h: points[1][1] - points[0][1] }
        }
    },
};

const metaTools = {
    select: {

    },
};

const cellSize = 80; // 10*10 grid

let activeTool;
let activePath;
const selectTool = (tool = "line") => {
    console.log("selecting ", tool);
    activeTool = shapes[tool] || metaTools[tool];
    activePath?.escape();
}

const snapToGrid = (coords) => {
    return coords.map(f => (Math.round((f - cellSize / 2) / cellSize) + 1 / 2) * cellSize);
}

const getCoords = (e, snap = false) => {
    let coords = [e.clientX, e.clientY]
    let wrapperRect = wrapper.getBoundingClientRect();
    coords = [coords[0] - wrapperRect.left, coords[1] - wrapperRect.top];
    coords = coords.map(f => Math.round(800 / wrapperRect.width * f));
    if (snap) coords = snapToGrid(coords);

    return coords;
}

let click = false;
let pointerDown = false;
let draggingNode = {}, draggingCorner;
let createNodeOnMove = false;
wrapper.addEventListener("pointerdown", e => {
    click = true;
    pointerDown = true;
    let coords = getCoords(e, e.altKey);
    if (!e.target.matches(".primary, .secondary, .corner, .rect, .canvas *")) {
        createNodeOnMove = { tool: activeTool, start: coords };
        return;
    }

    if (e.target.matches(".canvas *")) {
        paths.find(f => f.element === e.target)?.select();
        draggingCorner = "rect";
        return;
    }

    if (e.target.matches(".corner, .rect")) {
        draggingCorner = ["A", "B", "C", "D", "R", "rect"].filter(f => e.target.classList.contains(f))[0];
        return;
    }

    let index = e.target.index;
    if (e.target.matches(".secondary")) {
        index++;
        e.target.path.addPoint(coords, index);
    }

    draggingNode = { path: e.target.path, index };
});

wrapper.addEventListener("pointermove", e => {
    let coords = getCoords(e, e.altKey);
    if (createNodeOnMove) {
        console.log("creating path");
        let newPath = new Path(createNodeOnMove.tool, [createNodeOnMove.start, coords]);
        newPath.select();
        draggingNode = { path: newPath, index: 1 };
        createNodeOnMove = false;
    }

    if (pointerDown) click = false;
    if (pointerDown && draggingNode.path) {
        draggingNode.path.movePoint(coords, draggingNode.index);
        activePath.updateElement();
        activePath.select();
    } else if (pointerDown && draggingCorner) {
        activePath.moveCorner(coords, draggingCorner, [e.movementX, e.movementY]);
        activePath.updateElement();
        activePath.select();
    }
});

wrapper.addEventListener("pointerup", e => {
    console.log(e.target);
    pointerDown = false;
    draggingNode = {};
    draggingCorner = undefined;
    createNodeOnMove = false;


    if (!click) return;
    if (!e.target.matches(".primary, .secondary, .corner, .rect") && e.target != activePath?.element) activePath?.escape();
});

document.addEventListener("keydown", e => {
    let key = e.key;
    e.preventDefault();

    switch (key) {
        case "Escape":
            activePath = undefined;
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
        case "Backspace":
            if (draggingNode.path) {
                activePath.deletePoint(draggingNode.index);
                draggingNode = {};
                if (activePath) {
                    activePath.updateElement();
                    activePath.select();
                }
            }
            else if (activePath) activePath.delete();
            break;
    }
});


new Path(shapes.line, [[280, 520], [440, 520]], {});
paths[0].updateElement();
new Path(shapes.line, [[360, 680], [360, 520]], {});
paths[1].updateElement();
new Path(shapes.curve, [[520, 680], [520, 520], [600, 600], [680, 520], [680, 680]], {});
paths[2].select();
activePath.updateElement()
activePath.select()
