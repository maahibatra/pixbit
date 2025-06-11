// VARIABLES

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let gridSize = 16;
let cellSize = canvas.width / gridSize;

let color = localStorage.getItem("color") || "#ff69b4";

const toolbar = document.getElementById("toolbar");
let tool = localStorage.getItem("tool") || "b";
let toolSwitch = document.getElementById("toolSwitch");
let toolSwitchMsg = {
    z: "NOTHING TO UNDO",
    y: "NOTHING TO REDO"
};
let toolNames = {
    b: "BRUSH",
    e: "ERASER",
    i: "EYEDROPPER",
    f: "FILL",
    z: "UNDO",
    y: "REDO",
    s: "SAVE",
    g: "GALLERY"
};
const realTools = ["b", "e", "i", "f"];

let eyedropperActive = false;

let queue, visited, targetColor;

const undo = document.getElementById("undo");
const redo = document.getElementById("redo");
let undoStack = [];
let redoStack = [];

const resize = document.getElementById("resize");
const grid = document.getElementById("grid");
if (grid)
    grid.style.setProperty("--grid-division", gridSize);

const save = document.getElementById("save");

const galBtn = document.getElementById("galBtn");
const artName = document.getElementById("artName");
let openedI = null;

let lastCol = null;
let lastRow = null;
let isDrawing = false;
let mouseClick = false;
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

    if (tool === "e") {
        tool = "b";
        setActiveTool();
    }
    
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
    let currentTool = localStorage.getItem("tool") || "b";

    const btn = toolbar.querySelector(`button[data-tool="${tool}"]`);
    if (btn) {
        [...toolbar.children].forEach(child => {
            if (realTools.includes(tool))
                child.classList.toggle("active", child === btn);
        });
    }

    toolSwitch.textContent = toolSwitchMsg[tool] || toolNames[tool];
    toolSwitch.classList.add("slideUp");
    setTimeout(() => {
        toolSwitch.classList.remove("slideUp");
    }, 1000);

    if (realTools.includes(tool)) {
        let currentTool = tool;
        localStorage.setItem("tool", tool);
    } else
        tool = currentTool;
}

// UNDO AND REDO

undo.addEventListener("click", () => {
    if (undoStack.length === 0)
        toolSwitchMsg.z = "NOTHING TO UNDO";
    else if (undoStack.length > 0) {
        toolSwitchMsg.z = null;
        const state = undoStack.pop();
        redoStack.push(canvas.toDataURL());
        loadState(state, undo);
    }
});

redo.addEventListener("click", () => {
    if (redoStack.length === 0)
        toolSwitchMsg.y = "NOTHING TO REDO";
    else if (redoStack.length > 0) {
        toolSwitchMsg.y = null;
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
    }, 600);
    const img = new Image();
    img.src = state;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }
}

// RESIZE CANVAS

resize.addEventListener("click", () => {
    const newSize = parseInt(prompt("Enter new canvas size:"), 10);
    if (isNaN(newSize) || newSize <= 0) {
        alert("Please enter a valid size.");
        return;
    }

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");
    tempCtx.drawImage(canvas, 0, 0, gridSize, gridSize);

    gridSize = newSize;
    cellSize = canvas.width / gridSize;
    if (grid)
        grid.style.setProperty("--grid-division", gridSize);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
});

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

function saveArt() {
    const artworks = JSON.parse(localStorage.getItem("artworks")) || [];

    const saveCanvas = document.createElement("canvas");
    saveCanvas.width = gridSize;
    saveCanvas.height = gridSize;
    const saveCtx = saveCanvas.getContext("2d");
    saveCtx.drawImage(canvas, 0, 0, gridSize, gridSize);
    const data = saveCanvas.toDataURL();

    if (openedI !== null) {
        artworks[openedI].data = data;
        artworks[openedI].gridSize = gridSize;
    }

    localStorage.setItem("artworks", JSON.stringify(artworks));
}

function loadArt() {
    const params = new URLSearchParams(window.location.search);
    const i = params.get("artwork");

    if (i !== null) {
        const artworks = JSON.parse(localStorage.getItem("artworks")) || [];
        const art = artworks[parseInt(i)];

        if (art) {
            openedI = parseInt(i);
            artName.textContent = art.name;

            if (art.gridSize) {
                gridSize = art.gridSize;
                cellSize = canvas.width / gridSize;
                if (grid)
                    grid.style.setProperty("--grid-division", gridSize);
            }

            const img = new Image();
            img.src = art.data;
            img.onload = () => {
                ctx.imageSmoothingEnabled = false;
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
            case "f":
                e.preventDefault();
                tool = "f";
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
            case "g":
                e.preventDefault();
                window.location = "index.html";
                break;
        }
    }
})

// DRAWING EVENT LISTENERS

canvas.addEventListener("mousedown", (e) => {
    if (tool === "b" || tool === "e" || tool === "f") {
        saveState();
    }
    isDrawing = true;
    mouseClick = true;
    draw(e);
});

canvas.addEventListener("mousemove", (e) => {
    if(isDrawing)
        draw(e);
});

window.addEventListener("mouseup", () => {
    if (tool === "b" || tool === "e" || tool === "f") {
        saveArt();
    }

    isDrawing = false;
    lastCol = null;
    lastRow = null;

    if (eyedropperActive) {
        tool = "b";
        setActiveTool();
        eyedropperActive = false;
    }
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
    else if (mouseClick = true) {
        drawPixel(col, row);
        mouseClick = false;
    }
    
    lastCol = col;
    lastRow = row;
}

function path(x0, y0, x1, y1) {
    if (tool === "f") return;

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
    x = col * cellSize;
    y = row * cellSize;
    if (tool === "b") {
        if (color === "#00000000")
            ctx.clearRect(x, y, cellSize, cellSize);
        else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, cellSize, cellSize);
        }
    } else if (tool === "e") {
        ctx.clearRect(x, y, cellSize, cellSize);
    } else if (tool === "i") {
        imageData = ctx.getImageData(x, y, 1, 1);
        const [r, g, b, a] = imageData.data;
        color = rgbaToHex(r, g, b, a);

        pickr.setColor(color);
        localStorage.setItem("color", color);

        eyedropperActive = true;
    } else if (tool === "f") {
        imageData = ctx.getImageData(x, y, 1, 1);
        const [r, g, b, a] = imageData.data;
        targetColor = rgbaToHex(r, g, b, a);

        let fillColor = color;
        if (fillColor.length === 7)
            fillColor += "FF";

        if (targetColor.toLowerCase() === fillColor.toLowerCase()) {
            console.log("fill color matches target");
            return;
        }

        queue = [[col, row]];
        visited = new Set();
        visited.add(`${col},${row}`);

        while (queue.length > 0) {
            const [curCol, curRow] = queue.shift();

            ctx.fillStyle = color;
            ctx.fillRect(curCol * cellSize, curRow * cellSize, cellSize, cellSize);

            checkNeighbor(curCol + 1, curRow);
            checkNeighbor(curCol, curRow + 1);
            checkNeighbor(curCol - 1, curRow);
            checkNeighbor(curCol, curRow - 1);
        }
    }
}

function checkNeighbor(neighborCol, neighborRow) {
    if (neighborCol < 0 || neighborRow < 0 || neighborCol >= canvas.width / cellSize || neighborRow >= canvas.height / cellSize)
        return;

    const neighborX = neighborCol * cellSize;
    const neighborY = neighborRow * cellSize;

    neighborData = ctx.getImageData(neighborX, neighborY, 1, 1)
    const [nr, ng, nb, na] = neighborData.data;
    const neighborColor = rgbaToHex(nr, ng, nb, na);

    if (neighborColor.toLowerCase() === targetColor.toLowerCase() && !visited.has(`${neighborCol},${neighborRow}`)) {
        queue.push([neighborCol, neighborRow]);
        visited.add(`${neighborCol},${neighborRow}`);
    }
}

function rgbaToHex(r, g, b, a) {
    return "#" + [r, g, b, a].map(x => x.toString(16).padStart(2, "0")).join("");
}

// ON PAGE LOAD

setActiveTool(tool);
loadArt();

// BEFORE PAGE RELOAD

window.addEventListener("beforeunload", (e) => {
    saveArt();
});
