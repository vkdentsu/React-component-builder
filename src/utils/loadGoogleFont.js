export function loadGoogleFont(fontName) {

    if (!fontName) return;

    const family = fontName
        .replace(/'/g, "")
        .split(",")[0]
        .trim();

    const id = "font-" + family;

    if (document.getElementById(id)) return;

    const link = document.createElement("link");

    link.id = id;

    link.rel = "stylesheet";

    link.href =
        `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@100;200;300;400;500;600;700;800;900&display=swap`;

    document.head.appendChild(link);

}