import newEditor from "./editor/main.js";

let myFile = {
    "lines": [
        { "text": "Rezgések", "tabs": { "full": 0 }, "decos": ["middle", "Bold", "accent", "capital", "underline"] },
        { "text": "Harmonikus oszcillátorok", "tabs": { "full": 0 }, "decos": ["middle", "bold", "accent", "small"] },
        { "text": "Szabad Rezgés", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "• Eredő erő: F_{x}=-Dx", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 61, "to": 70 }] },
        { "text": "• Mozgásegyenlet:", "tabs": { "full": 0 } },
        { "text": "\\frac{d^{2} x}{d t^{2}} +\\omega_{0}^2x=0,\\enspace \\omega_{0}=\\sqrt{D/m}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• A megoldás alakja:", "tabs": { "full": 0 } },
        { "text": "x(t)=A\\cos(\\omega_{0}t+\\varphi)", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• A teljes mechanikai energia:", "tabs": { "full": 0 } },
        { "text": "E(t)=\\frac{1}{2}Dx^2+\\frac{1}{2}m\\dot{x}^2=\\frac{1}{2}DA^2=const.", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "Csillapítással", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "• Eredő erő: F_{x}=-Dx-kv", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 339, "to": 351 }] },
        { "text": "• Mozgásegyenlet:", "tabs": { "full": 0 } },
        { "text": "\\frac{d^{2} x}{d t^{2}} +2\\beta \\frac{d x}{d t} +\\omega_{0}^2x=0,\\enspace \\omega_{0}=\\sqrt{D/m},\\enspace 2\\beta=k/m", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• A megoldás alakja:", "tabs": { "full": 0 } },
        { "text": "x(t)=e^{ \\lambda t }", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• Próbafüggvény behelyettesítése:", "tabs": { "full": 0 } },
        { "text": "\\lambda^2e^{ \\lambda t }+2\\beta\\lambda e^{ \\lambda t }+\\omega_{0}^2e^{ \\lambda t }=0", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\implies \\lambda^2+2\\beta\\lambda+\\omega_{0}^2=0\\implies \\lambda=-\\beta\\pm \\sqrt{\\beta^2-\\omega_{0}^2}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "A megoldás alakja a csillapítás mértékétől függ!", "tabs": { "full": 0 } },
        { "tabs": { "full": 0 } },
        { "text": "Tulcsillapitott", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "2 valos gyok, a megoldes egy linearis kombinacio", "tabs": { "full": 0 } },
        { "text": "• Vezessuk be:", "tabs": { "full": 0 } },
        { "text": "\\beta_{1}=-\\lambda_{1}=\\beta+\\sqrt{\\beta^2-\\omega_{0}^2}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\beta_{2}=-\\lambda_{2}=\\beta-\\sqrt{\\beta^2-\\omega_{0}^2}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• Ekkor a megoldas alakja:", "tabs": { "full": 0 } },
        { "text": "x(t)=A_{1}e^{ -\\beta_{1}t }+A_{2}e^{ -\\beta_{2}t }", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "Aperiodikus hatareset", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "1 gyok, de a probafuggveny t-szerese is megjelenik", "tabs": { "full": 0 } },
        { "text": "• Tudjuk, hogy: \\lambda=-\\beta", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 1160, "to": 1174 }] },
        { "text": "• Megoldas:", "tabs": { "full": 0 } },
        { "text": "x(t)=A_{1}e^{ -\\beta t }+A_{2}te^{ -\\beta t }=(A_1+A_{2}t)e^{ -\\beta t }", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "Valodi csillapitott rezges", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "2 komplex gyok", "tabs": { "full": 0 } },
        { "text": "\\lambda_{1}=-\\beta+i\\sqrt{\\omega_{0}^2-\\beta^2}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\lambda_{2}=-\\beta-i\\sqrt{\\omega_{0}^2-\\beta^2}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• Tehat bevezetjuk a korfrekvenciat:", "tabs": { "full": 0 } },
        { "text": "\\omega'=\\sqrt{\\omega_{0}^2-\\beta^2}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "• Amivel a megoldas:", "tabs": { "full": 0 } },
        { "text": "x(t)=A_{0}e^{ -\\beta t }\\sin(\\omega't+\\varphi)", "tabs": { "full": 0 }, "decos": ["math"] },
        { "tabs": { "full": 0 } },
        { "text": "Hotani egyensulyban levo A hangra hangolt m tomegu zongorahur rezgesenek aplitudoja szobahomersekleten", "tabs": { "full": 0 }, "decos": ["middle", "Bold", "accent", "capital", "underline"] },
        { "text": "Egyedi esetekkel:", "tabs": { "full": 0 } },
        { "text": "W(E)=1\\implies \\mathbb{P}\\propto e^{ -\\beta E },\\enspace \\int_{0}^{\\infty} \\mathbb{P}(E) \\, dE=1\\implies \\mathbb{P}=\\beta e^{ -\\beta E }", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\langle E \\rangle =\\int_{0}^{\\infty} E\\mathbb{P}(E) \\, dE=\\int_{0}^{\\infty} \\beta Ee^{ -\\beta E } \\, dE=\\frac{1}{\\beta}\\int_{0}^{\\infty} xe^{ -x } \\, dx=\\frac{1}{\\beta}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\langle E \\rangle =\\frac{1}{2}DA^2\\frac{1}{\\pi}\\int_{0}^{\\pi} \\sin ^2x \\, dx=\\frac{1}{4}m\\omega^2A^2\\implies A=\\frac{2}{\\omega \\sqrt{m\\beta}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\omega=2\\pi\\cdot 440\\mathrm{Hz},\\enspace \\beta=\\frac{1}{k_{B}\\cdot 300\\mathrm{K}},\\enspace m :=0.01\\mathrm{kg}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "A\\approx 4.7\\cdot 10^{-13}\\mathrm{m}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "tabs": { "full": 0 } },
        { "text": "What if gravity weakened cubically? What shape would orbits be?", "tabs": { "full": 0 }, "decos": ["middle", "Bold", "accent", "capital", "underline"] },
        { "text": "Physics", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "v_{t}=R\\frac{d \\theta}{d t},\\enspace v_{t}R=v_{0}R_{0}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "F=\\frac{mk}{R^{3}}\\implies V=-\\int_{R}^{\\infty} mk/r^{3} \\, dr=-\\frac{mk}{2R^{2}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "V+K=V(R_{0})+\\frac{1}{2}mv_{0}^{2}=-\\frac{mk}{2R_{0}^{2}}+\\frac{1}{2}mv_{0}^{2}=-\\frac{mk}{2R^{2}}+K", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\implies K=\\frac{1}{2}m\\left( -\\frac{k}{R_{0}^{2}} +\\frac{k}{R^{2}}+v_{0}^{2} \\right)\\implies v=\\sqrt{ -\\frac{k}{R_{0}^{2}}+v_{0}^{2}+\\frac{k}{R^{2}} }", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "v_{R}=\\frac{d R}{d t} =\\frac{d R}{d \\theta}\\cdot \\frac{d \\theta}{d t} =\\frac{d R}{d \\theta} \\cdot \\frac{v_{t}}{R}\\implies \\frac{d R}{d \\theta} =R \\frac{v_{R}}{v_{t}}=R\\frac{\\sqrt{ v^{2}-v_{t}^{2} }}{v_{t}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=R\\sqrt{ \\frac{v^{2}}{v_{t}^{2} }-1}=R\\sqrt{\\frac{-k/R_{0}^{2}+v_{0}^{2}+k/R^{2}}{v_{0}^{2}R_{0}^{2}/R^{2}}-1 }", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=R\\left[ R^{2}\\left( \\frac{-k}{v_{0}^{2}R_{0}^{4}}+\\frac{1}{R_{0}^{2}} \\right)+\\frac{k}{v_{0}^{2}R_{0}^{2}}-1 \\right]^{1/2} ", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "Maths, abstraction", "tabs": { "full": 0 }, "decos": ["underline", "bold", "accent"] },
        { "text": "b :=\\frac{-k}{v_{0}^{2}R_{0}^{4}}+\\frac{1}{R_{0}^{2}},\\enspace c := \\frac{k}{v_{0}^{2}R_{0}^{2}}-1=-R_{0}^{2}b", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\frac{d y}{d x} =y\\sqrt{ by^{2}+c }\\implies \\int_{y_{0}}^{y'} \\frac{dy}{y\\sqrt{ by^{2}+c }} \\,=\\int_{x_{0}}^{x'}  \\, dx", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "u :=\\sqrt{ by^{2}+c }\\implies du=\\frac{by}{u}dy", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\int_{u_{0}}^{u'} \\frac{1}{yu}\\cdot \\frac{u}{by} \\, du=\\int_{u_{0}}^{u'} \\frac{du}{u^{2}-c}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "Cases", "tabs": { "full": 0 } },
        { "text": "1. Case: c=0 \\Longleftrightarrow k=v_{0}^{2}R_{0}^{2} – circle", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 3569, "to": 3613 }] },
        { "text": "x'-x_{0}=\\theta= \\int_{u_{0}}^{u'} \\frac{du}{u^{2}} = -u'^{-1}+u_{0}^{-1}=-(\\sqrt{ b }R)^{-1}+(\\sqrt{ b }R_{0})^{-1} \\\\", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\frac{1}{\\sqrt{ b }}\\left( \\frac{1}{R_{0}}-\\frac{1}{R} \\right)\\implies \\left( \\frac{1}{R_{0}}-\\sqrt{ b }\\theta \\right)^{-1}=R \\\\", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "b=-R_{0}^{-2}c=0\\implies \\boxed{R=R_{0}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "2. Case: c<0\\Longleftrightarrow k<v_{0}^2R_{0}^2 – spiral out", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 3923, "to": 3962 }] },
        { "text": "x'-x_{0}=\\theta=\\frac{1}{\\sqrt{ -c }}\\left. \\tan ^{-1}\\left( \\frac{u}{\\sqrt{ -c }} \\right)\\right|_{u_{0}}^{u'}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\frac{1}{\\sqrt{ -c }}\\left( \\tan ^{-1}\\sqrt{ -\\frac{b}{c}R^{2}-1 } -\\tan ^{-1}\\sqrt{ -\\frac{b}{c}R_{0}^{2}-1 }\\right)", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\frac{1}{\\sqrt{ -c }}\\left( \\tan ^{-1}\\sqrt{ \\frac{R^{2}}{R_{0}^{2}}-1 }-0 \\right)", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\boxed{\\theta=\\frac{\\tan ^{-1}\\sqrt{ R^{2}/R_{0}^{2}-1 }}{\\sqrt{ 1-k/v_{0}^{2}R_{0}^{2} }}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "3. Case: c>0\\Longleftrightarrow k>v_{0}^2R_{0}^2 – spiral in", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 4391, "to": 4430 }] },
        { "text": "x'-x_{0}=\\theta=\\int_{u'}^{u_{0}} \\frac{du}{c-u^{2}} \\, =\\frac{1}{\\sqrt{ c }}\\left.\\tanh ^{-1}\\left( \\frac{u}{\\sqrt{ c }} \\right)\\right|_{u'}^{u_{0}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\frac{1}{\\sqrt{ c }}\\left( \\tanh ^{-1}\\sqrt{ \\frac{b}{c}R_{0}^{2}+1 }-\\tanh ^{-1}\\sqrt{ \\frac{b}{c}R^{2}+1 } \\right)", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "= \\frac{1}{\\sqrt{ c }}\\left( 0-\\tanh ^{-1}\\sqrt{ 1-\\frac{R^{2}}{R_{0}^{2}} } \\right)", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "\\boxed{\\theta=\\frac{\\tanh ^{-1}\\sqrt{1-R^{2}/R_{0}^{2}}}{\\sqrt{ k/v_{0}^{2}R_{0}^{2}-1 }}}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "tabs": { "full": 0 } },
        { "text": "Since the orbits are mostly unstable, it makes more sense to write \\theta(R), not R(\\theta). In case 1, the orbit is a circle, in case 2 it is an outward spiral, in case 3 it is an inward spiral (the coefficient of gravity is just strong enough, not strong enough and too strong respectively).", "tabs": { "full": 0 }, "marks": [{ "role": "math", "from": 4955, "to": 4964 }, { "role": "math", "from": 4970, "to": 4979 }] },
        { "tabs": { "full": 0 } },
        { "text": "Richard Behiel Integral", "tabs": { "full": 0 }, "decos": ["middle", "Bold", "accent", "capital", "underline"] },
        { "text": "\\int_{0}^{\\infty} \\sum_{m=0}^{\\infty} \\sum_{p=0}^{\\infty}\\frac{i^{p+2n}\\pi^{p}}{n!m!p!}x^{n+m}(n+m)^{p} \\, dx", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\int_{0}^{\\infty}\\frac{(-1)^{n}x^{n}}{n!}\\sum_{m=0}^{\\infty}\\frac{x^{m}}{m!}\\sum_{p=0}^{\\infty}\\frac{(i\\pi(n+m))^{p}}{p!} \\, dx", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\int_{0}^{\\infty}\\frac{(-1)^{n}x^{n}}{n!}\\sum_{m=0}^{\\infty}\\frac{x^{m}}{m!}(-1)^{n+m} \\, dx", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\int_{0}^{\\infty}\\frac{x^{n}}{n!}\\sum_{m=0}^{\\infty}\\frac{(-x)^{m}}{m!} \\, dx", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\int_{0}^{\\infty}\\frac{x^{n}}{n!}e^{ -x } \\, dx", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=\\frac{1}{n!}[-n!e^{ -x }]_{x=0}^{x=\\infty}", "tabs": { "full": 0 }, "decos": ["math"] },
        { "text": "=1", "tabs": { "full": 0 }, "decos": ["math"] }
    ]
};

window.MathJax.startup.promise.then(_ => {
    const editor = newEditor({ file: myFile, layout: "vim", interactive: !matchMedia('(pointer: coarse)').matches });
    window.editor = editor;
    window.doc = editor.doc;
    window.render = editor.render;
    window.selection = editor.render.selection;
    window.input = editor.input;
    window.caret = editor.input?.caret;
    window.snippets = editor.input?.snippets;
    console.log({ editor });
    console.log({ doc: window.doc });
    setTimeout(() => { // TODO: find out why caret behaves badly on startup
        window.caret?.placeAllAt();
    }, 200);
    queueMicrotask(() => {
        window.editor.render.textarea.animate([
            { opacity: "0" },
            { opacity: "1" },
        ], {
            duration: 100,
        });
    });
});

document.addEventListener("click", e => {
    if (!window.editor.interactive) return;
    document.getElementById("focus").focus();
});

window.addEventListener("resize", _ => {
    window.caret?.placeAllAt();
});
