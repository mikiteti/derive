class DefaultSnippets {
    constructor(editor) {
        this.editor = editor;

        this.snippets = [
            // { from: /^(?:.*[+\-= ,])?([^+\-= ,]+)\/$/, to: "\\frac{[[0]]}{${0}}${1}", in: "m" },
            { from: ";a", to: "• ", in: "tA" },
            { from: ";s", to: "– ", in: "tA" },
            { from: ";d", to: "∘ ", in: "tA" },
            { from: "=>", to: "⇒ ", in: "tA" },
            { from: "->", to: "→ ", in: "tA" }, // →
            { from: "<=", to: "⇐ ", in: "tA" },
            { from: "<-", to: "← ", in: "tA" }, // ←
            { from: "⇐ >", to: "⇔ ", in: "tA", priority: 1 },
            { from: "← >", to: "↔ ", in: "tA", priority: 1 },
            { from: "!>", to: "↦ ", in: "tA" },
            { from: "<!", to: "↤ ", in: "tA" },
            { from: "--", to: "\–", in: "tA" },
            { from: ", ", to: ",\\enspace ${0}", in: "mA" },
            { from: ",,", to: "\\, ", in: "mA" },
            { from: "  ", to: "\\enspace ${0}", in: "mA" },
            { from: "text", to: "\\text{${0}}${1}", in: "mA" },
            { from: "b\\otimes ed", to: "\\boxed{${0}} ${1}", in: "mA" },

            { from: "=>", to: "\\implies ", in: "mA" },
            { from: "->", to: "\\longrightarrow ", in: "mA" }, // →
            { from: "\\longleftarrow >", to: "\\longleftrightarrow ", in: "mA", priority: 1 },
            // { from: "<=>", to: "\\longleftrightarrow ", in: "mA", priority: 1 },
            // { from: "\\leq >", to: "\\longleftrightarrow ", in: "mA", priority: 1 },
            { from: "equiv", to: "\\Longleftrightarrow ", in: "mA", priority: 1 },
            // {from: "<=", to: "\\impliedby ", in: "mA"},
            { from: "<-", to: "\\longleftarrow ", in: "mA" }, // ←
            { from: "!>", to: "\\mapsto", in: "mA" },

            //Experimental
            { from: ";j", to: "(${0})${1}", in: "mtA" },
            { from: ";u", to: "-", in: "mtA" },
            { from: ";i", to: "=", in: "mtA" },
            { from: ";o", to: "+", in: "mtA" },
            { from: "..", to: "\\cdot", in: "mA", priority: -1 },
            { from: " \/", to: "/", in: "mA" },

            // Greek letters
            { from: ";a", to: "\\alpha", in: "mA" },
            { from: ";b", to: "\\beta", in: "mA" },
            { from: ";g", to: "\\gamma", in: "mA" },
            { from: ";G", to: "\\Gamma", in: "mA" },
            { from: ";d", to: "\\delta", in: "mA" },
            { from: ";D", to: "\\Delta", in: "mA" },
            { from: ";e", to: "\\varepsilon", in: "mA" },
            { from: ";z", to: "\\zeta", in: "mA" },
            { from: ";h", to: "\\eta", in: "mA" },
            { from: ";t", to: "\\theta", in: "mA" },
            { from: ";T", to: "\\Theta", in: "mA" },
            // {from: ";i", to: "\\iota", in: "mA"},
            { from: ";k", to: "\\kappa", in: "mA" },
            { from: ";l", to: "\\lambda", in: "mA" },
            { from: ";L", to: "\\Lambda", in: "mA" },
            { from: ";m", to: "\\mu", in: "mA" },
            { from: ";n", to: "\\nu", in: "mA" },
            { from: ";x", to: "\\xi", in: "mA" },
            { from: ";X", to: "\\Xi", in: "mA" },
            // {from: ";p", to: "\\pi", in: "mA"},
            // {from: ";P", to: "\\Pi", in: "mA"},
            { from: ";r", to: "\\rho", in: "mA" },
            { from: ";s", to: "\\sigma", in: "mA" },
            { from: ";S", to: "\\Sigma", in: "mA" },
            // \tau
            // {from: ";u", to: "\\upsilon", in: "mA"},
            // {from: ";U", to: "\\Upsilon", in: "mA"},
            { from: ";f", to: "\\varphi", in: "mA" },
            { from: ";F", to: "\\Phi", in: "mA" },
            { from: ";c", to: "\\chi", in: "mA" },
            { from: ";p", to: "\\psi", in: "mA" },
            { from: ";P", to: "\\Psi", in: "mA" },
            { from: ";w", to: "\\omega", in: "mA" },
            { from: ";W", to: "\\Omega", in: "mA" },

            // Basic operations
            { from: "abs", to: "|${0}|${1}", in: "mA" },
            { from: /\\(${GREEK}|${SYMBOL}) sr/, to: "\\[[0]]^2", in: "rmA" },
            { from: "sr", to: "^2", in: "mA" },
            { from: /\\(${GREEK}|${SYMBOL}) cb/, to: "\\[[0]]^3", in: "rmA" },
            { from: "cb", to: "^3", in: "mA" },
            { from: /\\(${GREEK}|${SYMBOL}) inv/, to: "\\[[0]]^{-1}", in: "rmA" },
            { from: "inv", to: "^{-1}", in: "mA" },
            { from: /\\(${GREEK}|${SYMBOL}) \"/, to: "\\[[0]]^{${0}}${1}", in: "rmA" },
            { from: "\"", to: "^{${0}}${1}", in: "mA" },
            { from: /([^ ]):/, to: "[[0]]_{${0}}${1}", in: "rmA", priority: -1 },
            { from: "_{:", to: "_\\text{${0}", in: "mA", priority: 1 },
            // {from: "_", to: ":${0}", in: "mA"},
            // {from: "sts", to: "_\\text{${0}}", in: "mA"},

            { from: "sq", to: "\\sqrt{${0}}${1}", in: "mA" },
            { from: "dsq", to: "\\sqrt[${0}]{${1}}${2}", in: "mA", priority: 1 },
            { from: "//", to: "\\frac{${0}}{${1}}${2}", in: "mA" },
            { from: "ee", to: "e^{ ${0} }${1}", in: "mA" },
            { from: "conj", to: "^{*}${0}", in: "mA" },
            { from: "Re", to: "\\mathrm{Re}", in: "mA" },
            { from: "Im", to: "\\mathrm{Im}", in: "mA" },
            { from: /([^\\])(det)/, to: "[[0]]\\[[1]]", in: "rmA" },
            { from: "trace", to: "\\mathrm{Tr}", in: "mA" },
            { from: "nCr", to: "{${0:n} \\choose ${1:r}}${2}", in: "mA" },

            // Aftercare
            { from: /([A-Za-z])(\d)/, to: "[[0]]_{[[1]]}", in: "rmA", description: "Auto letter subscript", priority: -1 },
            { from: /(\d)deg/, to: "[[0]]^\\circ", in: "rmA", description: "Degrees" },

            { from: /\\(${GREEK}|${SYMBOL}) hat/, to: "\\hat{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) bar/, to: "\\bar{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) ring/, to: "\\mathring{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) dot/, to: "\\dot{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) \\mathrm{d}ot/, to: "\\ddot{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) tilde/, to: "\\tilde{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) und/, to: "\\underline{\\[[0]]}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}) vec/, to: "\\vec{\\[[0]]}", in: "rmA" },
            { from: /\\(${SUBSCRIPTABLE}){\\(${GREEK})},\./, to: "\\vec{\\[[0]]{\\[[1]]}}", in: "rmA" },
            { from: /\\(${SUBSCRIPTABLE}){\\(${GREEK})}\.,/, to: "\\vec{\\[[0]]{\\[[1]]}}", in: "rmA" },
            { from: /\\(${GREEK}|${SYMBOL}),\./, to: "\\vec{\\[[0]]}", in: "rmA", priority: 1 },
            { from: /\\(${GREEK}|${SYMBOL})\.,/, to: "\\vec{\\[[0]]}", in: "rmA" },

            { from: /([a-zA-Z])hat/, to: "\\hat{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])bar/, to: "\\bar{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])ring/, to: "\\mathring{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])dot/, to: "\\dot{[[0]]}", in: "rmA", priority: -1 },
            { from: /([a-zA-Z])\\mathrm{d}ot/, to: "\\ddot{[[0]]}", in: "rmA", priority: 1 },
            { from: /([a-zA-Z])tilde/, to: "\\tilde{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])und/, to: "\\underline{[[0]]}", in: "rmA" },
            { from: /([A-Z])cal/, to: "\\mathcal{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])bb/, to: "\\mathbb{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])scr/, to: "\\mathscr{[[0]]}", in: "rmA" },
            { from: /([a-zA-Z])vec/, to: "\\vec{[[0]]}", in: "rmA" },
            { from: /\\(${SUBSCRIPTABLE}){([a-zA-z])},\./, to: "\\mathbf{\\[[0]]{[[1]]}}", in: "rmA" },
            { from: /\\(${SUBSCRIPTABLE}){([a-zA-z])}\.,/, to: "\\mathbf{\\[[0]]{[[1]]}}", in: "rmA" },
            { from: /([a-zA-Z]),\./, to: "\\mathbf{[[0]]}", in: "rmA", priority: 1 },
            { from: /([a-zA-Z])\.,/, to: "\\mathbf{[[0]]}", in: "rmA" },

            // Beforecare
            { from: "hat", to: "\\hat{${0}}${1}", in: "mA" },
            { from: "bar", to: "\\bar{${0}}${1}", in: "mA" },
            { from: "ring", to: "\\mathring{${0}}${1}", in: "mA" },
            { from: "dot", to: "\\dot{${0}}${1}", in: "mA", priority: -1 },
            { from: "\\mathrm{d}ot", to: "\\ddot{${0}}${1}", in: "mA" },
            { from: "tilde", to: "\\tilde{${0}}${1}", in: "mA" },
            { from: "und", to: "\\underline{${0}}${1}", in: "mA" },
            { from: "cal", to: "\\mathcal{${0}}${1}", in: "mA" },
            { from: "bb", to: "\\mathbb{${0}}${1}", in: "mA" },
            { from: "scr", to: "\\mathscr{${0}}${1}", in: "mA" },
            { from: "vec", to: "\\vec{${0}}${1}", in: "mA" },
            { from: "bf", to: "\\mathbf{${0}}${1}", in: "mA" },
            { from: "rm", to: "\\mathrm{${0}}${1}", in: "mA" },

            // {from: "pu", to: "\\pu{${0}}\\,${1}", in: "mA"},
            { from: "unit", to: "\\,\\si{${0}}\\,${1}", in: "mA" },
            { from: "pu", to: "\\SI{${0}}{${1}}\\,${2}", in: "mA" },
            { from: "tag", to: "\\tag{${0}}${1}", in: "mA" },

            // More auto letter subscript
            { from: /([A-Za-z])_(\d\d)/, to: "[[0]]_{[[1]]}", in: "rmA" },
            { from: /\\(${SUBSCRIPTABLE}){([A-Za-z])}(\d)/, to: "\\[[0]]{[[1]]}_{[[2]]}", in: "rmA" },
            { from: /\\(${SUBSCRIPTABLE}){\\(${GREEK})}(\d)/, to: "\\[[0]]{\\[[1]]}_{[[2]]}", in: "rmA" },

            // Symbols
            { from: "oo", to: "\\infty", in: "mA" },
            { from: /([^\\])sum/, to: "[[0]]\\sum", in: "mA", priority: -1 },
            { from: /^sum/, to: "\\sum", in: "mA", priority: -1 },
            { from: "dsum", to: "\\sum_{${0:i}=${1:0}}^{${2:n}} ${3}", in: "mA" },
            { from: "prod", to: "\\prod", in: "mA" },
            { from: "dprod", to: "\\prod_{${0:i}=${1:1}}^{${2:N}} ${3}", in: "m", priority: 1 },
            { from: "lim", to: "\\lim_{ ${0:n} \\to ${1:\\infty} } ${2}", in: "mA" },
            { from: "+-", to: "\\pm", in: "mA" },
            { from: "-+", to: "\\mp", in: "mA" },
            { from: "\\cdot.", to: "\\dots", in: "mA", priority: 1 },
            { from: "del", to: "\\nabla", in: "mA" },
            { from: "part", to: "\\partial", in: "mA" },
            { from: "xx", to: "\\times", in: "mA" },
            { from: "*", to: "^{*}${0}", in: "mA" },
            { from: "para", to: "\\parallel", in: "mA" },

            { from: "===", to: "\\equiv ", in: "mA" },
            { from: "/=", to: "\\neq ", in: "mA" },
            { from: ">=", to: "\\geq ", in: "mA" },
            { from: "<=", to: "\\leq ", in: "mA" },
            { from: ">>", to: "\\gg ", in: "mA" },
            { from: "<<", to: "\\ll ", in: "mA" },
            { from: "simm", to: "\\sim ", in: "mA" },
            { from: "sim=", to: "\\simeq ", in: "mA" },
            { from: "appr", to: "\\approx ", in: "mA" },
            { from: "prop", to: "\\propto ", in: "mA" },

            { from: "and", to: "\\cap", in: "mA" },
            { from: "orr", to: "\\cup", in: "mA" },
            { from: "inn", to: "\\in", in: "mA" },
            { from: "notin", to: "\\not\\in", in: "mA" },
            { from: "\\\\\\", to: "\\setminus", in: "mA" },
            { from: "sub=", to: "\\subseteq", in: "mA" },
            { from: "sup=", to: "\\supseteq", in: "mA" },
            { from: "eset", to: "\\emptyset", in: "mA" },
            { from: "set", to: "\\{ ${0} \\}${1}", in: "mA" },

            { from: "LL", to: "\\mathcal{L}", in: "mA" },
            { from: "HH", to: "\\mathcal{H}", in: "mA" },
            { from: "PP", to: "\\mathcal{P}", in: "mA" },
            { from: "OO", to: "\\mathcal{O}", in: "mA" },
            { from: "SS", to: "\\mathcal{S}", in: "mA" },
            { from: "VV", to: "\\mathcal{V}", in: "mA" },
            { from: "NN", to: "\\mathbb{N}", in: "mA" },
            { from: "ZZ", to: "\\mathbb{Z}", in: "mA" },
            { from: "QQ", to: "\\mathbb{Q}", in: "mA" },
            { from: "RR", to: "\\mathbb{R}", in: "mA" },
            { from: "CC", to: "\\mathbb{C}", in: "mA" },
            { from: "AA", to: "\\forall", in: "mA" },
            { from: "EE", to: "\\exists", in: "mA" },
            { from: "ii", to: "\\mathrm{i}", in: "mA" },
            { from: "dd", to: "\\mathrm{d}", in: "mA" },


            // Handle spaces and backslashes
            // Insert space after Greek letters and symbols
            { from: /([^\\])(${AUTOGREEK}|${SYMBOL}|${TRIG}|${FUNC})/, to: "[[0]]\\[[1]]", in: "rmA", description: "Add backslash before what needs one", priority: 2 },
            { from: /^(${AUTOGREEK}|${SYMBOL}|${TRIG}|${FUNC})/, to: "\\[[0]]", in: "rmA", description: "Add backslash before what needs one", priority: 1 },
            { from: /\\(${GREEK}|${SYMBOL}|${MORE_SYMBOLS}|${TRIGH})([A-Za-z])/, to: "\\[[0]] [[1]]", in: "rmA", description: "Add space after what needs one", priority: 2 },
            { from: /\\(${TRIG})([A-Za-gi-z])/, to: "\\[[0]] [[1]]", in: "rmA", description: "Add space after trig funcs. Skips letter h to allow sinh, cosh, etc." },
            { from: /\\(${SYMBOL}|${MORE_SYMBOLS}|${TRIG}|${TRIGH}|${FUNC})([0-9])/, to: "\\[[0]] [[1]]", in: "rmA", priority: 10 },

            // Derivatives and integrals
            { from: "pard", to: "\\frac{ \\partial ${0:y} }{ \\partial ${1:x} } ${2}", in: "mA" },
            { from: /par(\d)/, to: "\\frac{\\partial^{[[0]]} ${0:y} }{ \\partial {${1:x}}^{[[0]]} } ${2}", in: "mA" },
            { from: "parn", to: "\\frac{\\partial^{${0:n}} ${1:y}}{\\partial {${2:x}}^{${0:n}}} ${3}", in: "mA" },
            { from: "der", to: "\\frac{\\mathrm{d} ${0:y}}{\\mathrm{d} ${1:x}} ${2}", in: "mA" },
            { from: /\\mathrm{d}(\d)/, to: "\\frac{\\mathrm{d}^{[[0]]} ${0:y}}{\\mathrm{d} ${1:x}^{[[0]]}} ${2}", in: "mA" },
            { from: "\\mathrm{d}n", to: "\\frac{\\mathrm{d}^{${0:n}} ${1:y}}{\\mathrm{d} ${2:x}^{${0:n}}} ${3}", in: "mA" },
            // { from: "\\mathrm{d}t", to: "\\frac{\\mathrm{d}}{\\mathrm{d}t} ", in: "mA" },

            { from: /([^\\])int/, to: "[[0]]\\int${0} \\, \\mathrm{d}${1:x} ${2}", in: "mA", priority: -1 },
            { from: /^int/, to: "\\int${0} \\, \\mathrm{d}${1:x} ${2}", in: "mA", priority: -1 },
            { from: "dint", to: "\\int_{${0:0}}^{${1:1}} ${2} \\, \\mathrm{d}${3:x} ${4}", in: "mA" },
            { from: "oint", to: "\\oint_{${0}} ${1} \\, \\mathrm{d} ${2:\\ell} ${3}", in: "mA" },
            { from: "\\mathrm{i}nt", to: "\\iint", in: "mA" },
            { from: "\\mathrm{i}int", to: "\\iiint", in: "mA" },
            { from: "oinf", to: "\\int_{0}^{\\infty} ${0} \\, \\mathrm{d}${1:x} ${2}", in: "mA" },
            { from: "infi", to: "\\int_{-\\infty}^{\\infty} ${0} \\, \\mathrm{d}${1:x} ${2}", in: "mA" },


            // Visual operations
            // {from: "U", to: "\\underbrace{ ${VISUAL} }_{ ${0} }", in: "mA"},
            // {from: "O", to: "\\overbrace{ ${VISUAL} }^{ ${0} }", in: "mA"},
            // {from: "B", to: "\\underset{ ${0} }{ ${VISUAL} }", in: "mA"},
            // {from: "C", to: "\\cancel{ ${VISUAL} }", in: "mA"},
            // {from: "K", to: "\\cancelto{ ${0} }{ ${VISUAL} }", in: "mA"},
            // {from: "S", to: "\\sqrt{${VISUAL}}", in: "mA"},


            // Quantum mechanics
            { from: "dag", to: "^{\\dagger}", in: "mA" },
            { from: "o+", to: "\\oplus ", in: "mA" },
            { from: "ox", to: "\\otimes ", in: "mA" },
            { from: "Box", to: "\\Box", in: "mA", priority: 1 },
            { from: "bra", to: "\\bra{${0}}${1}", in: "mA" },
            { from: "ket", to: "\\ket{${0}}${1}", in: "mA" },
            { from: "brk", to: "\\braket{${0}|${1}}${2}", in: "mA" },
            { from: "outer", to: "\\ket{${0:\\psi}} \\bra{${0:\\psi}} ${1}", in: "mA" },

            // Environments
            { from: "pmat", to: "\\begin{pmatrix}${0}\\end{pmatrix}${1}", in: "mA" },
            { from: "bmat", to: "\\begin{bmatrix}${0}\\end{bmatrix}${1}", in: "mA" },
            { from: "Bmat", to: "\\begin{Bmatrix}${0}\\end{Bmatrix}${1}", in: "mA" },
            { from: "vmat", to: "\\begin{vmatrix}${0}\\end{vmatrix}${1}", in: "mA" },
            { from: "Vmat", to: "\\begin{Vmatrix}${0}\\end{Vmatrix}${1}", in: "mA" },
            { from: "matrix", to: "\\begin{matrix}${0}\\end{matrix}${1}", in: "mA" },

            { from: "cases", to: "\\begin{cases} ${0} \\end{cases}", in: "mA" },
            { from: "align", to: "\\begin{align} ${0} \\end{align}${1}", in: "mA" },
            // { from: "array", to: "\\begin{array} ${0} \\end{array}${1}", in: "mA" },

            // Brackets
            { from: "avg", to: "\\langle ${0} \\rangle ${1}", in: "mA" },
            { from: "norm", to: "\\lvert ${0} \\rvert ${1}", in: "mA", priority: 1 },
            { from: "Norm", to: "\\lVert ${0} \\rVert ${1}", in: "mA", priority: 1 },
            { from: "ceil", to: "\\lceil ${0} \\rceil ${1}", in: "mA" },
            { from: "fl\\inftyr", to: "\\lfloor ${0} \\rfloor ${1}", in: "mA", priority: 3 },
            // { from: "mod", to: "|${0}|${1}", in: "mA" },
            // { from: "(", to: "(${VISUAL})", in: "mA" },
            // { from: "[", to: "[${VISUAL}]", in: "mA" },
            // { from: "{", to: "{${VISUAL}}", in: "mA" },
            { from: "(", to: "(${0})${1}", in: "mA" },
            { from: "{", to: "{${0}}${1}", in: "mA" },
            { from: "[", to: "[${0}]${1}", in: "mA" },
            { from: " {", to: "\\{${0}\\}${1}", in: "mA", priority: 1 }, // test
            { from: "lr(", to: "\\left( ${0} \\right) ${1}", in: "mA", priority: 2 },
            { from: "lr{", to: "\\left\\{ ${0} \\right\\} ${1}", in: "mA", priority: 2 },
            { from: "lr[", to: "\\left[ ${0} \\right] ${1}", in: "mA", priority: 2 },
            { from: "lr|", to: "\\left| ${0} \\right| ${1}", in: "mA", priority: 2 },
            { from: "lr<", to: "\\left< ${0} \\right> ${1}", in: "mA", priority: 2 },


            // Misc

            // Automatically convert standalone letters in text to math (except a, A, I).
            // (Un-comment to enable)
            // {from: /([^'])\b([B-HJ-Zb-hj-z])\b([\n\s.,?!:'])/, to: "[[0]]$[[1]]$[[2]]", in: "tA"},

            // Automatically convert Greek letters in text to math.
            // { from: /(${GREEK})([\\n\\s.,?!:'])/, to: "$\\[[0]]$[[1]]", in: "rtAw" },

            // Snippet replacements can have placeholders.
            { from: "tayl", to: "${0:f}(${1:x} + ${2:h}) = ${0:f}(${1:x}) + ${0:f}'(${1:x})${2:h} + ${0:f}''(${1:x}) \\frac{${2:h}^{2}}{2!} + \\dots${3}", in: "mA", description: "Taylor expansion" },

            // Snippet replacements can also be JavaScript functions.
            // See the documentation for more information.
            {
                from: /iden(\d)/, to: (match) => {
                    const n = match[1];

                    let arr = [];
                    for (let j = 0; j < n; j++) {
                        arr[j] = [];
                        for (let i = 0; i < n; i++) {
                            arr[j][i] = (i === j) ? 1 : 0;
                        }
                    }

                    let output = arr.map(el => el.join(" & ")).join(" \\\\");
                    output = `\\begin{pmatrix}${output}\\end{pmatrix}`;
                    return output;
                }, in: "mA", description: "N x N identity matrix"
            },

            {
                from: /(\d)mat/, to: (match) => {
                    const n = match[1];

                    let arr = [];
                    let counter = 0;
                    for (let j = 0; j < n; j++) {
                        arr[j] = [];
                        for (let i = 0; i < n; i++) {
                            arr[j][i] = "${" + counter + ":0}";
                            counter++;
                        }
                    }

                    return `\\begin{bmatrix} ${arr.map(el => el.join(" & ")).join(" \\\\ ")} \\end{bmatrix} \${${counter}}`;
                }, in: "mA", description: "square matrices"
            },

            {
                from: /(\d)(\d)mat/, to: (match) => {
                    const n = match[1], k = match[2];

                    let arr = [];
                    let counter = 0;
                    for (let j = 0; j < k; j++) {
                        arr[j] = [];
                        for (let i = 0; i < n; i++) {
                            arr[j][i] = "${" + counter + ":0}";
                            counter++;
                        }
                    }

                    return `\\begin{bmatrix} ${arr.map(el => el.join(" & ")).join(" \\\\ ")} \\end{bmatrix} \${${counter}}`;
                }, in: "mA", description: "matrices", priority: 1
            },

            {
                from: /(\d)vec/, to: (match) => {
                    const n = match[1];

                    let arr = [];
                    let counter = 0;
                    while (counter < n) {
                        arr.push(counter);
                        counter++;
                    }

                    return `\\begin{pmatrix} \${${arr.join(":0} \\\\ ${")}:0} \\end{pmatrix} \${${counter}}`;
                }, in: "mA", description: "vectors", priority: 1,
            },

            {
                from: /h([0-6])/, to: (match) => {
                    const n = parseInt(match[1]);
                    console.log("running h", n);

                    if (n === 0) {
                        this.editor.input.caret.forAll(pos => {
                            pos.Line.removeDeco(this.editor.render.decos);
                            this.editor.render.renderLine(pos.Line);
                        });
                        this.editor.input.caret.placeAllAt();

                        return;
                    }

                    this.editor.doc.history.newChangeGroup();
                    this.editor.input.caret.forAll(pos => {
                        pos.Line.addDeco(`h${n}`);
                        this.editor.render.renderLine(pos.Line);
                    });
                    this.editor.input.caret.placeAllAt();
                    this.editor.doc.history.newChangeGroup();

                    return;
                }, in: "At", description: "Headings", priority: 1,
            },

            {
                from: "dm", to: (match) => {
                    this.editor.doc.history.newChangeGroup();
                    this.editor.input.caret.forAll(pos => {
                        pos.Line.toggleDeco("math");
                        this.editor.render.renderLine(pos.Line);
                    });
                    this.editor.input.caret.placeAllAt();
                    this.editor.doc.history.newChangeGroup();

                    return;
                }, in: "At", description: "Display math", priority: 1,
            },
        ]
    }
}

class DefaultSnippetVariables {
    constructor() {
        this.snippetVariables = {
            "${GREEK}": "alpha|Alpha|beta|Beta|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|vartheta|Theta|iota|kappa|lambda|Lambda|mu|nu|xi|omicron|pi|rho|varrho|sigma|Sigma|tau|upsilon|Upsilon|phi|varphi|Phi|chi|psi|Psi|omega|Omega",
            "${AUTOGREEK}": "alpha|Alpha|beta|Beta|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|vartheta|Theta|iota|kappa|lambda|Lambda|omicron|pi|rho|varrho|sigma|Sigma|tau|upsilon|Upsilon|phi|varphi|Phi|chi|psi|Psi|omega|Omega",
            "${SYMBOL}": "parallel|perp|partial|nabla|hbar|ell|infty|oplus|ominus|otimes|oslash|square|star|dagger|vee|wedge|subseteq|subset|supseteq|supset|emptyset|exists|nexists|forall|implies|impliedby|iff|setminus|neg|lor|land|bigcup|bigcap|cdot|times|simeq|approx|uparrow|downarrow|circ|not|neq",
            "${MORE_SYMBOLS}": "leq|geq|neq|gg|ll|equiv|sim|propto|rightarrow|leftarrow|Rightarrow|Leftarrow|leftrightarrow|to|mapsto|cap|cup|in|sum|prod|exp|ln|log|det|dots|vdots|ddots|pm|mp|int|iint|iiint|oint|min|max",
            "${SUBSCRIPTABLE}": "vec|dot|ddot|mathbb|mathcal|mathscr|hat|bar|tilde|underline|mathbf",
            "${TRIG}": "arcsin|sin|arccos|cos|arctan|tan|csc|sec|cot",
            "${TRIGH}": "sinh|cosh|tanh|coth",
            "${FUNC}": "exp|log|ln|min|max",
        }
    }
}

export { DefaultSnippets, DefaultSnippetVariables };
