// VARIABLES

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const gridSize = 16;
const cellSize = canvas.width / gridSize;

let color = localStorage.getItem("color") || "#ff69b4";

const toolbar = document.getElementById("toolbar");
let tool = localStorage.getItem("tool") || "b";

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

    if (tool === "b") {
        ctx.fillStyle = color;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    } else if (tool === "e") {
        ctx.clearRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
}

// ON PAGE LOAD

setActiveTool(tool);