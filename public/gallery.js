// VARIABLES

const newArt = document.getElementById("newArt");

const gallery = document.getElementById("gallery");
const artworks = JSON.parse(localStorage.getItem("artworks")) || [];

// NEW ARTWORK

newArt.addEventListener("click", () => {
    window.location.href = "canvas.html";
});

// LOAD ARTWORK

artworks.forEach((art, i) => {
    const link = document.createElement("a");
    link.href = `canvas.html?artwork=${i}`;

    const img = document.createElement("img");
    img.src = art.data;
    img.alt = art.name;

    link.appendChild(img);
    gallery.appendChild(link);
});