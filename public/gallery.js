const gallery = document.getElementById("gallery");

const artworks = JSON.parse(localStorage.getItem("artworks")) || [];

artworks.forEach(art => {
    const img = new Image();
    img.src = art.data;
    gallery.appendChild(img);
});