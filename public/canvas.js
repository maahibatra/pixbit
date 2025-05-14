// VARIABLES

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const gridSize = 16;
const cellSize = canvas.width / gridSize;
const toolbar = document.getElementById("toolbar");
let currentTool = "p";
let isDrawing = false;

// SWITCH TOOLS

toolbar.onclick = (e) => {
    const btn = e.target.closest("button[data-tool]");
    if (!btn) return;

    currentTool = btn.dataset.tool;
    setActiveTool(currentTool);
}

function setActiveTool  () {
    const btn = toolbar.querySelector(`button[data-tool="${currentTool}"]`);
    if (btn) {
        [...toolbar.children].forEach(child => {
            child.classList.toggle("active", child === btn);
        });
    }
}

// DRAWING EVENT LISTENERS

canvas.addEventListener("mousedown", (e) => {
    isDrawing = true;
    drawPixel(e);
});

canvas.addEventListener("mousemove", (e) => {
    if(isDrawing)
        drawPixel(e);
});

window.addEventListener("mouseup", () => {
    isDrawing = false;
});

// CANVAS FUNCTIONS

function drawPixel(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / cellSize);
    const row = Math.floor(y / cellSize);

    if (currentTool === "p") {
        ctx.fillStyle = "blue";
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    } else if (currentTool === "e") {
        ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
}

// ON PAGE LOAD

setActiveTool(currentTool);