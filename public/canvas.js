// VARIABLES

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gridSize = 16;
const cellSize = canvas.width / gridSize;

let color = localStorage.getItem("color") || "#ff69b4";

const toolbar = document.getElementById("toolbar");
let tool = localStorage.getItem("tool") || "b";
const undo = document.getElementById("undo");
const redo = document.getElementById("redo");
let undoStack = [];
let redoStack = [];

const save = document.getElementById("save");

const galBtn = document.getElementById("galBtn");
const artName = document.getElementById("artName");
let openedI = null;

let lastCol = null;
let lastRow = null;
let isDrawing = false;
let skip = false;

// PICKR/COLOR

const pickr = Pickr.create({
    el: "#pickr",
    theme: "nano",
    default: color,
    components: {
        preview: true,
        opacity: true,
        hue: true,

        interaction: {
            hex: true,
            rgba: true,
            input: true,
            save: true
        }
    }
});

pickr.on("save", (newColor) => {
    color = newColor.toHEXA().toString();
    localStorage.setItem("color", color);

    tool = "b";
    setActiveTool();
    
    pickr.hide();
})

// SWITCH TOOLS

toolbar.onclick = (e) => {
    const btn = e.target.closest("button[data-tool]");
    if (!btn) return;

    tool = btn.dataset.tool;
    setActiveTool(tool);
}

function setActiveTool() {
    const btn = toolbar.querySelector(`button[data-tool="${tool}"]`);
    if (btn) {
        [...toolbar.children].forEach(child => {
            child.classList.toggle("active", child === btn);
        });
    }
    localStorage.setItem("tool", tool);
}

// UNDO AND REDO

undo.addEventListener("click", () => {
    if (undoStack.length > 0) {
        const state = undoStack.pop();
        redoStack.push(canvas.toDataURL());
        loadState(state, undo);
    }
});

redo.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        undoStack.push(canvas.toDataURL());
        loadState(state, redo);
    }
});

function saveState() {
    redoStack = [];
    undoStack.push(canvas.toDataURL());
    if (undoStack.length > 25)
        undoStack.shift();
}

function loadState(state, button) {
    button.classList.add("active");
    setTimeout(() => {
        button.classList.remove("active");
    }, 300);
    const img = new Image();
    img.src = state;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }
}

// SAVING ARTWORK

save.addEventListener("click", (e) => {
    e.stopPropagation();
    saveMenu.classList.toggle("show");
    saveBtn.classList.toggle("active");
});

window.addEventListener("click", (e) => {
    if (!saveMenu.contains(e.target)) {
        saveMenu.classList.remove("show");
        saveBtn.classList.remove("active");
    }
});

saveMenu.addEventListener("click", (e) => {
    const type = e.target.dataset.save;
    if (!type) return;

    const expCanvas = document.createElement("canvas");
    expCanvas.width = gridSize;
    expCanvas.height = gridSize;
    const expCtx = expCanvas.getContext("2d");

    const link = document.createElement("a");
    link.download = "image.png";

    if (type === "transparent") {
        expCtx.drawImage(canvas, 0, 0, gridSize, gridSize);

        link.href = expCanvas.toDataURL("image/png");
    } else {
        expCtx.fillStyle = "#ffffff";
        expCtx.fillRect(0, 0, gridSize, gridSize);
        expCtx.drawImage(canvas, 0, 0, gridSize, gridSize);

        link.href = expCanvas.toDataURL("image/png");
    }

    link.click();
});

// SAVE TO AND LOAD FROM GALLERY

galBtn.addEventListener("click", () => {
    const artworks = JSON.parse(localStorage.getItem("artworks")) || [];
    const data = canvas.toDataURL();

    if (openedI !== null) {
        artworks[openedI].data = data;
    } else {
        let untitledC = 1;
        const baseName = "Untitled";
        const existingNames = artworks.map(a => a.name);

        while (existingNames.includes(`${baseName} ${untitledC}`)) {
            untitledC++;
        }

        const name = `${baseName} ${untitledC}`;
        artworks.push({ name, data });
    }

    localStorage.setItem("artworks", JSON.stringify(artworks));
    window.location.href = "index.html";
});

function loadArt() {
    const params = new URLSearchParams(window.location.search);
    const i = params.get("artwork");

    if (i !== null) {
        const artworks = JSON.parse(localStorage.getItem("artworks")) || [];
        const art = artworks[parseInt(i)];

        if (art) {
            openedI = parseInt(i);
            artName.textContent = art.name;
            const img = new Image();
            img.src = art.data;
            img.onload = () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
        }

        artName.addEventListener("click", () => {
            const newName = prompt("Enter new name:");
            if (newName) {
                artworks[i].name = newName;
                localStorage.setItem("artworks", JSON.stringify(artworks));
                location.reload();
            }
        });
    }
}

// KEYBINDS

window.addEventListener("keydown", (e) => {
    if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
            case "b":
                e.preventDefault();
                tool = "b";
                setActiveTool();
                break;
            case "e":
                e.preventDefault();
                tool = "e";
                setActiveTool();
                break;
            case "i":
                e.preventDefault();
                tool = "i";
                setActiveTool();
                break;
            case "z":
                e.preventDefault();
                undo.click();
                break;
            case "y":
                e.preventDefault();
                redo.click();
                break;
            case "s":
                e.preventDefault();
                save.click();
                break;
        }
    }
})

// DRAWING EVENT LISTENERS

canvas.addEventListener("mousedown", (e) => {
    if (tool === "b" || tool === "e") {
        saveState();
    }
    isDrawing = true;
    draw(e);
});

canvas.addEventListener("mousemove", (e) => {
    if(isDrawing)
        draw(e);
});

window.addEventListener("mouseup", () => {
    isDrawing = false;
    lastCol = null;
    lastRow = null;
});

canvas.addEventListener("mouseleave", (e) => {
    skip = true;
});

// CANVAS FUNCTIONS

function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (col === lastCol && row === lastRow) return;

    if (skip) {
        drawPixel(col, row);
        skip = false;
    } else if (lastCol !== null && lastRow !== null)
        path(lastCol, lastRow, col, row);

    lastCol = col;
    lastRow = row;
}

function path(x0, y0, x1, y1) {
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        drawPixel(x0, y0);
        
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        } if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

function drawPixel(col, row) {
    if (tool === "b") {
        if (color === "#00000000")
            ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
        else {
            ctx.fillStyle = color;
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    } else if (tool === "e") {
        ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
    } else if (tool === "i") {
        function eyedropperFunction() {
            imageData = ctx.getImageData(col * cellSize, row * cellSize, cellSize, cellSize);
            const [r, g, b, a] = imageData.data;
            color = rgbaToHex(r, g, b, a);
            pickr.setColor(color);
            localStorage.setItem("color", color);
            tool = "b";
            setActiveTool();
        }

        canvas.addEventListener("mouseup", eyedropperFunction);
        setTimeout(() => {
            canvas.removeEventListener("mouseup", eyedropperFunction);
        }, 100);
    }
}

function rgbaToHex(r, g, b, a) {
    return "#" + [r, g, b, a].map(x => x.toString(16).padStart(2, "0")).join("");
}

// ON PAGE LOAD

setActiveTool(tool);
loadArt();