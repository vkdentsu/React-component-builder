export const registerFont = (fontName, fontSource) => {
  const safeName = String(fontName || '').replace(/[^a-zA-Z0-9 _-]/g, '').trim();
  const isSafeDataUrl = (url) =>
    typeof url === 'string' && /^data:[a-z0-9.+-]+\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(url);
  const sources = Array.isArray(fontSource?.sources)
    ? fontSource.sources.filter((source) => isSafeDataUrl(source?.url))
    : [];
  if (sources.length === 0 && isSafeDataUrl(fontSource)) sources.push({ url: fontSource });
  if (sources.length === 0 && isSafeDataUrl(fontSource?.url)) sources.push({ url: fontSource.url });
  if (sources.length === 0 && isSafeDataUrl(fontSource?.dataUrl)) sources.push({ url: fontSource.dataUrl });
  if (!safeName || sources.length === 0) return;

  const styleId = `font-${safeName}`;
  const style = document.getElementById(styleId) || document.createElement('style');
  style.id = styleId;
  const formats = { woff2: 'woff2', woff: 'woff', truetype: 'truetype', opentype: 'opentype' };
  const src = sources.map(({ url, format }) =>
    `url('${url}')${formats[format] ? ` format('${formats[format]}')` : ''}`).join(', ');
  style.textContent = `@font-face { font-family: '${safeName}'; src: ${src}; }`;
  if (!style.isConnected) document.head.appendChild(style);
};