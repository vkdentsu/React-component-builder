export const registerFont = (fontName, fontUrl) => {
  const styleId = `font-${fontName}`;

  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;

  style.innerHTML = `
    @font-face {
      font-family: '${fontName}';
      src: url('${fontUrl}');
    }
  `;

  document.head.appendChild(style);
};