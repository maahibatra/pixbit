// VARIABLES

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gridSize = 16;
const cellSize = canvas.width / gridSize;

let color = localStorage.getItem("color") || "#ff69b4";

const toolbar = document.getElementById("toolbar");
let tool = localStorage.getItem("tool") || "b";

const save = document.getElementById("save");

let lastCol = null;
let lastRow = null;
let isDrawing = false;

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

// SAVING ARTWORK

save.addEventListener("click", () => {
    saveMenu.classList.toggle("show");
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

// DRAWING EVENT LISTENERS

canvas.addEventListener("mousedown", (e) => {
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

canvas.addEventListener("mouseleave", () => {
    lastCol = null;
    lastRow = null;
});

// CANVAS FUNCTIONS

function draw(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (lastCol === null || lastRow === null) {
        drawPixel(col, row);
        lastCol = col;
        lastRow = row;
        return;
    }

    const dx = col - lastCol;
    const dy = row - lastRow;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));

    for (let i = 0; i <= steps; i++) {
        const ix = Math.round(lastCol + (dx * i) / steps);
        const iy = Math.round(lastRow + (dy * i) / steps);
        drawPixel(ix, iy);
    }

    lastCol = col;
    lastRow = row;
}

function drawPixel(col, row) {
    if (tool === "b") {
        ctx.fillStyle = color;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    } else if (tool === "e") {
        ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
}

// ON PAGE LOAD

setActiveTool(tool);