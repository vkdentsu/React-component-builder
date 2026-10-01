export const resolveResponsiveValue = (value, device) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (device === 'mobile') return value.mobile ?? value.tablet ?? value.desktop ?? '';
    if (device === 'tablet') return value.tablet ?? value.desktop ?? value.mobile ?? '';
    return value.desktop ?? value.tablet ?? value.mobile ?? '';
  }

  return value;
};

export const resolveResponsiveFontWeight = (value, device) => {
  const resolved = resolveResponsiveValue(value, device);

  if (resolved === '' || resolved === null || resolved === undefined) return undefined;
  if (typeof resolved === 'number') return resolved;

  const normalized = String(resolved).toLowerCase();
  if (normalized === 'bold') return 700;
  if (normalized === 'medium') return 500;
  if (normalized === 'normal') return 400;
  if (['100', '200', '300', '400', '500', '600', '700', '800', '900'].includes(normalized)) {
    return Number(normalized);
  }

  return resolved;
};

export const getResponsiveTypographyStyles = ({ fontSize, fontWeight, lineHeight }, device) => ({
  fontSize: resolveResponsiveValue(fontSize, device),
  fontWeight: resolveResponsiveFontWeight(fontWeight, device),
  lineHeight: resolveResponsiveValue(lineHeight, device),
});

export const getResponsiveTypographyClassName = ({ fontWeight }, device) => {
  const resolvedWeight = resolveResponsiveFontWeight(fontWeight, device);

  if (resolvedWeight === 700 || resolvedWeight === '700') return 'font-bold';
  if (resolvedWeight === 500 || resolvedWeight === '500' || resolvedWeight === 'medium') return 'font-medium';
  return 'font-normal';
};

export const getResponsiveTypographyClasses = (typography, device) => {
  const fontSize = resolveResponsiveValue(typography?.fontSize, device);
  const lineHeight = resolveResponsiveValue(typography?.lineHeight, device);
  const fontWeight = resolveResponsiveFontWeight(typography?.fontWeight, device);
  const classes = [];

  if (fontSize !== '' && fontSize !== null && fontSize !== undefined) {
    classes.push(`text-[${fontSize}px]`);
  }

  if (lineHeight !== '' && lineHeight !== null && lineHeight !== undefined) {
    classes.push(`leading-[${lineHeight}]`);
  }

  if (fontWeight === 700 || fontWeight === '700') {
    classes.push('font-bold');
  } else if (fontWeight === 500 || fontWeight === '500' || fontWeight === 'medium') {
    classes.push('font-medium');
  } else {
    classes.push('font-normal');
  }

  return classes.join(' ');
};
