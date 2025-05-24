// VARIABLES

const newArt = document.getElementById("newArt");

const gallery = document.getElementById("gallery");
const artworks = JSON.parse(localStorage.getItem("artworks")) || [];
const artMenu = document.getElementById("artMenu");
const del = document.getElementById("del");
const close = document.getElementById("close");

// NEW ARTWORK

newArt.addEventListener("click", () => {
    window.location.href = "canvas.html";
});

// LOAD AND DELETE ARTWORK

artworks.forEach((art, i) => {
    const wrapper = document.createElement("div");
    wrapper.className = "artEl";

    const link = document.createElement("a");
    link.href = `canvas.html?artwork=${i}`;

    const img = document.createElement("img");
    img.src = art.data;
    img.alt = art.name;

    link.appendChild(img);
    wrapper.appendChild(link);

    const artOpts = document.createElement("button");
    artOpts.className = "artOpts";
    artOpts.textContent = "...";

    artOpts.addEventListener("click", (e) => {
        const rect = e.target.getBoundingClientRect();
        artMenu.style.left = `${e.target.offsetLeft}px`;
        artMenu.style.top = `${e.target.offsetTop + e.target.offsetHeight}px`;
        artMenu.classList.toggle("show");
        del.addEventListener("click", () => {
            artworks.splice(i, 1);
            localStorage.setItem("artworks", JSON.stringify(artworks));
            location.reload();
        });
    });

    wrapper.appendChild(artOpts);
    gallery.appendChild(wrapper);
});

close.addEventListener("click", () => {
    artMenu.style.display = "none";
}); 