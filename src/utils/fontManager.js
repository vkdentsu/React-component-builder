export async function createFontData(file) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read font file'));
    reader.readAsDataURL(file);
  });

  return {
    name: file.name.replace(/\.[^/.]+$/, ''),
    dataUrl,
    fileName: file.name,
  };
}

export function loadCustomFont(font) {
  const source = font.dataUrl || (font.file ? URL.createObjectURL(font.file) : null);
  if (!source) return null;

  const safeName = (font.name || 'CustomFont').replace(/['"]/g, '');
  const style = document.createElement('style');
  style.innerHTML = `@font-face { font-family: '${safeName}'; src: url('${source}'); }`;
  document.head.appendChild(style);
  return style;
}