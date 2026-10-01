const roundedMap = { none: 'rounded-none', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };
const paddingMap = { sm: 'px-3 py-1.5', md: 'px-4 py-2', lg: 'px-6 py-3' };
const fontWeightMap = { normal: 'font-normal', medium: 'font-medium', bold: 'font-bold' };
const alignMap = { left: 'text-left', center: 'text-center', right: 'text-right' };

const resolveResponsiveValue = (value, device) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (device === 'mobile') return value.mobile ?? value.tablet ?? value.desktop ?? '';
    if (device === 'tablet') return value.tablet ?? value.desktop ?? value.mobile ?? '';
    return value.desktop ?? value.tablet ?? value.mobile ?? '';
  }
  return value;
};

const resolveResponsiveFontWeight = (value, device) => {
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

const getFontWeightClass = (value, device = 'mobile', prefix = '') => {
  const resolved = resolveResponsiveFontWeight(value, device);
  const normalized = String(resolved ?? '').toLowerCase();

  if (resolved === 700 || normalized === 'bold') {
    return `${prefix}font-bold`;
  }

  if (resolved === 500 || normalized === 'medium') {
    return `${prefix}font-medium`;
  }

  if (
    resolved === 400 ||
    normalized === 'normal' ||
    resolved === undefined
  ) {
    return `${prefix}font-normal`;
  }

  return `${prefix}font-[${resolved}]`;
};

const getResponsiveTypographyClasses = (fontSize, fontWeight, lineHeight) => {
  const classes = [];

  const baseFontSize = resolveResponsiveValue(fontSize, 'mobile');
  if (baseFontSize !== '' && baseFontSize !== undefined && baseFontSize !== null) {
    classes.push(`text-[${baseFontSize}px]`);
  }

  const tabletFontSize = resolveResponsiveValue(fontSize, 'tablet');
  if (tabletFontSize !== '' && tabletFontSize !== undefined && tabletFontSize !== null && tabletFontSize !== baseFontSize) {
    classes.push(`md:text-[${tabletFontSize}px]`);
  }

  const desktopFontSize = resolveResponsiveValue(fontSize, 'desktop');
  if (desktopFontSize !== '' && desktopFontSize !== undefined && desktopFontSize !== null && desktopFontSize !== tabletFontSize && desktopFontSize !== baseFontSize) {
    classes.push(`lg:text-[${desktopFontSize}px]`);
  }

  const baseLineHeight = resolveResponsiveValue(lineHeight, 'mobile');
  if (baseLineHeight !== '' && baseLineHeight !== undefined && baseLineHeight !== null) {
    classes.push(`leading-[${baseLineHeight}]`);
  }

  const tabletLineHeight = resolveResponsiveValue(lineHeight, 'tablet');
  if (tabletLineHeight !== '' && tabletLineHeight !== undefined && tabletLineHeight !== null && tabletLineHeight !== baseLineHeight) {
    classes.push(`md:leading-[${tabletLineHeight}]`);
  }

  const desktopLineHeight = resolveResponsiveValue(lineHeight, 'desktop');
  if (desktopLineHeight !== '' && desktopLineHeight !== undefined && desktopLineHeight !== null && desktopLineHeight !== tabletLineHeight && desktopLineHeight !== baseLineHeight) {
    classes.push(`lg:leading-[${desktopLineHeight}]`);
  }

  const mobileWeightClass = getFontWeightClass(fontWeight, 'mobile');
  classes.push(mobileWeightClass);

  const tabletWeightClass = getFontWeightClass(
    fontWeight,
    'tablet',
    'md:'
  );

  if (
    tabletWeightClass.replace('md:', '') !== mobileWeightClass
  ) {
    classes.push(tabletWeightClass);
  }

  const desktopWeightClass = getFontWeightClass(
    fontWeight,
    'desktop',
    'lg:'
  );

  if (
    desktopWeightClass.replace('lg:', '') !==
    tabletWeightClass.replace('md:', '')
  ) {
    classes.push(desktopWeightClass);
  }

  return classes.join(' ');
};

// ── Helper-component registry ──────────────────────────────────────────
// Some elements (e.g. navbar) need their own local React state (a mobile
// menu toggle) in the exported code. Rather than lifting that state up into
// the top-level component, we extract each into a small named sub-component
// defined above the main export. This registry collects those definitions
// during a single generateJSX() call and resets at the start of the next.
let _helperComponents = [];
let _navbarCounter = 0;

function resetHelperRegistry() {
  _helperComponents = [];
  _navbarCounter = 0;
}
function nextNavbarName() {
  _navbarCounter += 1;
  return _navbarCounter === 1 ? 'Navbar' : `Navbar${_navbarCounter}`;
}
function registerHelperComponent(name, definition) {
  _helperComponents.push(definition);
}

const hideClasses = (hideOn) => {
  const cls = [];
  if (hideOn?.mobile) cls.push('sm:block hidden');
  if (hideOn?.tablet) cls.push('md:block sm:hidden');
  if (hideOn?.desktop) cls.push('lg:hidden');
  return cls.join(' ');
};

const normalizeFormFields = (fields) => {
  if (Array.isArray(fields)) {
    return fields.map((field, index) => {
      if (typeof field === 'string') {
        return { label: field, type: 'input', placeholder: '', inputType: 'text', validationRegex: '', icon: 'none' };
      }
      return {
        label: field?.label || `Field ${index + 1}`,
        type: field?.type || 'input',
        placeholder: field?.placeholder || '',
        options: field?.options || '',
        required: Boolean(field?.required),
        inputType: field?.inputType || 'text',
        validationType: field?.validationType || 'none',
        validationRegex: field?.validationRegex || '',
        validationMessage: field?.validationMessage || '',
        icon: field?.icon || 'none',
      };
    });
  }

  return (fields || '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((label) => ({ label, type: 'input', placeholder: '', required: false, inputType: 'text', validationType: 'none', validationRegex: '', validationMessage: '', icon: 'none' }));
};

const escapeAttr = (value) => String(value || '').replace(/"/g, '&quot;');

const formFieldIconLabel = (iconName) => {
  switch (iconName) {
    case 'mail':
      return './assets/icons/mail.svg';
    case 'lock':
      return './assets/icons/lock.svg';
    case 'user':
      return './assets/icons/user.svg';
    default:
      return './assets/icons/default.svg';
  }
};

const passwordFieldToJSX = (field, indent, label, index) => {
  const fieldId = `field-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const hasIcon = field.icon && field.icon !== 'none';
  const iconMarkup = hasIcon
    ? `${indent}<span className="absolute inset-y-0 left-0 flex items-center pl-3">
${indent}  <img
${indent}    src="${formFieldIconLabel(field.icon)}"
${indent}    alt="${field.icon}"
${indent}    className="w-5 h-5"
${indent}  />
${indent}</span>
`
    : '';
  const inputClass = hasIcon
    ? 'border border-gray-300 rounded-md px-3 py-2 pl-10 pr-10 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
    : 'border border-gray-300 rounded-md px-3 py-2 pr-10 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return `${indent}{(() => {
${indent}  const [showPassword, setShowPassword] = React.useState(false);
${indent}  return (
${indent}    <div className="flex flex-col gap-1">
${indent}      <label htmlFor="${fieldId}" className="text-sm font-medium text-gray-700">${label}${field.required ? ' *' : ''}</label>
${indent}      <div className="relative">
${iconMarkup}${indent}      <input id="${fieldId}" name="${fieldId}" type={showPassword ? 'text' : 'password'} placeholder="${field.placeholder || `Enter ${label.toLowerCase()}`}" className="${inputClass}" ${field.required ? ' required' : ''} aria-required="${field.required ? 'true' : 'false'}" />
${indent}        <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword((value) => !value)}>
${indent}          {showPassword ? (
${indent}            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
${indent}              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 012.152-3.292m3.358-2.358A9.956 9.956 0 0112 5c4.478 0 8.268 2.943 9.543 7a9.97 9.97 0 01-4.043 5.197M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
${indent}            </svg>
${indent}          ) : (
${indent}            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
${indent}              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
${indent}              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
${indent}            </svg>
${indent}          )}
${indent}        </button>
${indent}      </div>
${indent}    </div>
${indent}  );
${indent}})()}`;
};

const formFieldToJSX = (field, indent, index) => {
  const label = field.label || `Field ${index + 1}`;
  const fieldId = `field-${index}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const invalidAttr = field.validationMessage
    ? `
        onInvalid={(e) => {
          e.target.setCustomValidity("${escapeAttr(field.validationMessage)}");
        }}
        onInput={(e) => {
          e.target.setCustomValidity("");
        }}`
    : '';
  switch (field.type) {
    case 'textarea':
      return `${indent}<div className="flex flex-col gap-1">
    ${indent}  <label htmlFor="${fieldId}" className="text-sm font-medium text-gray-700">${label}${field.required ? ' *' : ''}</label>
    ${indent}  <textarea
    ${indent}    id="${fieldId}"
    ${indent}    name="${fieldId}"
    ${indent}    placeholder="${field.placeholder || `Enter ${label.toLowerCase()}`}"
    ${indent}    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 w-full focus:ring-blue-500 min-h-[96px]"
    ${indent}    ${field.required ? 'required' : ''}
    ${indent}    aria-required="${field.required ? 'true' : 'false'}"
    ${indent}  />
    ${indent}</div>`;
    case 'dropdown': {
      const options = (field.options || '').split(',').map((opt) => opt.trim()).filter(Boolean);
      const opts = options.length ? options.map((opt) => `${indent}    <option value="${opt}">${opt}</option>`).join('\n') : `${indent}    <option value="">Select</option>`;
      return `${indent}<div className="flex flex-col gap-1">
      ${indent}  <label htmlFor="${fieldId}" className="text-sm font-medium text-gray-700">${label}${field.required ? ' *' : ''}</label>
      ${indent}  <select
      ${indent}    id="${fieldId}"
      ${indent}    name="${fieldId}"
      ${indent}    className="border border-gray-300 rounded-md px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      ${indent}    ${field.required ? 'required' : ''}
      ${indent}    aria-required="${field.required ? 'true' : 'false'}"
      ${indent}  >
      ${opts}
      ${indent}  </select>
      ${indent}</div>`;
    }
    case 'checkbox':
      return `${indent}<div className="flex items-center gap-2">
    ${indent}  <input
    ${indent}    type="checkbox"
    ${indent}    id="${fieldId}"
    ${indent}    name="${fieldId}"
    ${indent}    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
    ${indent}    ${field.required ? 'required' : ''}
    ${indent}    aria-required="${field.required ? 'true' : 'false'}"
    ${indent}  />
    ${indent}  <label htmlFor="${fieldId}" className="text-sm text-gray-700">${label}${field.required ? ' *' : ''}</label>
    ${indent}</div>`;
    default: {
      const inputType = field.inputType || 'text';
      if (inputType === 'password') {
        return passwordFieldToJSX(field, indent, label, index);
      }

      const hasIcon = field.icon && field.icon !== 'none';
      const iconMarkup = hasIcon
        ? `${indent}<span className="absolute inset-y-0 left-0 flex items-center pl-3">
      ${indent}  <img
      ${indent}    src="${formFieldIconLabel(field.icon)}"
      ${indent}    alt="${field.icon}"
      ${indent}    className="w-5 h-5"
      ${indent}  />
      ${indent}</span>
      `
        : '';
      const patternAttr = field.validationRegex
        ? ` pattern="${escapeAttr(field.validationRegex)}"`
        : '';
      const message = escapeAttr(field.validationMessage || '');
      const titleAttr =
        field.validationRegex && message
          ? ` title="${message}"`
          : '';
      const inputClass = hasIcon
        ? 'border border-gray-300 rounded-md px-3 py-2 pl-10 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500'
        : 'border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500';

      return `${indent}<div className="flex flex-col gap-1">
      ${indent}  <label
      ${indent}    htmlFor="${fieldId}"
      ${indent}    className="text-sm font-medium text-gray-700"
      ${indent}  >
      ${indent}    ${label}${field.required ? ' *' : ''}
      ${indent}  </label>
      ${indent}  <div className="relative">
      ${iconMarkup}${indent}    <input
      ${indent}      id="${fieldId}"
      ${indent}      name="${fieldId}"
      ${indent}      type="${inputType}"
      ${indent}      placeholder="${field.placeholder || `Enter ${label.toLowerCase()}`}"
      ${indent}      className="${inputClass}"
      ${indent}      ${patternAttr}
      ${indent}      ${titleAttr}
      ${indent}      ${field.required ? 'required' : ''}
      ${indent}      aria-required="${field.required ? 'true' : 'false'}"
      ${indent}      ${invalidAttr}
      ${indent}    />
      ${indent}  </div>
      ${indent}</div>`;
    }
  }
};

const elToJSX = (el, indent = '          ') => {
  const hide = hideClasses(el.hideOn);
  const hc = hide ? ` className="${hide}"` : '';

  switch (el.type) {
    case 'button': {
      const r = roundedMap[el.rounded] || 'rounded-md';
      const p = paddingMap[el.padding] || 'px-4 py-2';
      const typographyClasses = getResponsiveTypographyClasses(el.fontSize, el.fontWeight, el.lineHeight);
      return `${indent}<button${hc} className="${p} ${r} cursor-pointer ${typographyClasses}" style={{background:'${el.bg}',color:'${el.color}'}}>\n${indent}  ${el.label}\n${indent}</button>`;
    }
    case "radio": {
      const typographyClasses = getResponsiveTypographyClasses(
        el.fontSize,
        el.fontWeight,
        el.lineHeight
      );

      return `
        <div style={{textAlign:"${el.align}"}}>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="${el.group}"
              value="${el.value}"
              ${el.checked ? "defaultChecked" : ""}
              style={{accentColor:"${el.color}"}}
            />
            <span
              className="${typographyClasses}"
              style={{color:"${el.color}"}}
            >
              ${el.label}
            </span>
          </label>
        </div>`;
      }

    case "checkbox": {
        const typographyClasses = getResponsiveTypographyClasses(
          el.fontSize,
          el.fontWeight,
          el.lineHeight
        );

        return `
        <div style={{display:"flex",justifyContent:"${
            el.align === "center"
              ? "center"
              : el.align === "right"
              ? "flex-end"
              : "flex-start"
          }"}}>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              ${el.checked ? "defaultChecked" : ""}
              style={{accentColor:"${el.color}"}}
            />
            <span
              className="${typographyClasses}"
              style={{color:"${el.color}"}}
            >
              ${el.label}
            </span>
          </label>
        </div>`;
    }

    case "alert": {
      const alertClass =
        el.variant === "success"
          ? "bg-green-50 border border-green-300 text-green-700"
          : el.variant === "warning"
          ? "bg-yellow-50 border border-yellow-300 text-yellow-700"
          : el.variant === "error"
          ? "bg-red-50 border border-red-300 text-red-700"
          : "bg-blue-50 border border-blue-300 text-blue-700";

      const closeButton = el.closable
        ? `<button onClick={(e)=>e.currentTarget.closest(".alert-box")?.remove()} className="mt-3 text-sm underline">Close</button>`
        : "";

      return `<div
          role="alert"
          aria-live="assertive"
          className="${alertClass} rounded-md p-4 alert-box"
        >
        <div className="font-semibold">${el.title}</div>
        <div className="mt-2">${el.message}</div>
        ${closeButton}
      </div>`;
    }

    case "loader": {
      let loader = "";

      if (el.loaderType === "spinner") {
        loader = `<div className="rounded-full border-4 border-gray-200 animate-spin ${
          el.size === "sm"
            ? "h-6 w-6"
            : el.size === "lg"
            ? "h-12 w-12"
            : "h-8 w-8"
        }" style={{borderTopColor:"${el.color}",animationDuration:"${el.speed}s"}}></div>`;
      } else if (el.loaderType === "dots") {
        loader = `<div className="flex gap-2">${[0,1,2].map(i => `<span className="${
          el.size === "sm"
            ? "w-2 h-2"
            : el.size === "lg"
            ? "w-4 h-4"
            : "w-3 h-3"
        } rounded-full animate-bounce" style={{backgroundColor:"${el.color}",animationDelay:"${i * 0.15}s",animationDuration:"${el.speed}s"}}></span>`).join("")}</div>`;
      } else if (el.loaderType === "pulse") {
        loader = `<div className="${
          el.size === "sm"
            ? "w-6 h-6"
            : el.size === "lg"
            ? "w-12 h-12"
            : "w-8 h-8"
        } rounded-full animate-pulse" style={{backgroundColor:"${el.color}",animationDuration:"${el.speed}s"}}></div>`;
      } else if (el.loaderType === "bars") {
        loader = `<div className="flex items-end gap-1">${[0,1,2,3].map(i => `<span className="${
          el.size === "sm"
            ? "w-1 h-5"
            : el.size === "lg"
            ? "w-2 h-10"
            : "w-1.5 h-7"
        } animate-pulse rounded-sm" style={{backgroundColor:"${el.color}",animationDelay:"${i * 0.15}s",animationDuration:"${el.speed}s"}}></span>`).join("")}</div>`;
      }

      return `<div className="flex flex-col items-center justify-center gap-3">${loader}${
        el.showLabel
          ? `<span className="text-sm" style={{color:"${el.color}"}}>${el.label || "Loading..."}</span>`
          : ""
      }</div>`;
    }

    case "toggle":
      const typographyClasses = getResponsiveTypographyClasses(
        el.fontSize,
        el.fontWeight,
        el.lineHeight
      );
      return `${indent}{(() => {
        ${indent}  const [enabled, setEnabled] = React.useState(${el.checked ? "true" : "false"});
        ${indent}  return (
        ${indent}    <div
        ${indent}      style={{
        ${indent}        display:"flex",
        ${indent}        justifyContent:"${el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start"}"
        ${indent}      }}
        ${indent}    >
        ${indent}      <div className="flex items-center gap-2">
        ${indent}        <button
        ${indent}          type="button"
        ${indent}          role="switch"
        ${indent}          aria-checked={enabled}
        ${indent}          aria-label="${el.label}"
        ${indent}          onClick={() => setEnabled((value) => !value)}
        ${indent}          style={{
        ${indent}            width:"44px",
        ${indent}            height:"24px",
        ${indent}            borderRadius:"999px",
        ${indent}            border:"none",
        ${indent}            cursor:"pointer",
        ${indent}            background: enabled ? "${el.color}" : "#d1d5db",
        ${indent}            position:"relative",
        ${indent}            transition:"background .2s"
        ${indent}          }}
        ${indent}        >
        ${indent}          <span
        ${indent}            aria-hidden="true"
        ${indent}            style={{
        ${indent}              position:"absolute",
        ${indent}              top:"2px",
        ${indent}              left: enabled ? "22px" : "2px",
        ${indent}              width:"20px",
        ${indent}              height:"20px",
        ${indent}              borderRadius:"50%",
        ${indent}              background:"#fff",
        ${indent}              transition:"left .2s"
        ${indent}            }}
        ${indent}          />
        ${indent}        </button>
        ${indent}        <span
        ${indent}          className="${typographyClasses}"
        ${indent}          style={{
        ${indent}            color:"${el.labelColor || "#000"}"
        ${indent}          }}
        ${indent}        >
        ${indent}          ${el.label}
        ${indent}        </span>
        ${indent}      </div>
        ${indent}    </div>
        ${indent}  );
      ${indent}})()}`;
    
    case 'text': {
      const typographyClasses = getResponsiveTypographyClasses(el.fontSize, el.fontWeight, el.lineHeight);
      return `${indent}<p${hc} className="${alignMap[el.align] || 'text-left'} ${typographyClasses}" style={{color:'${el.color}'}}>
      ${indent}  ${el.label}
      ${indent}</p>`;
    }
    case 'heading': {
      const typographyClasses = getResponsiveTypographyClasses(el.fontSize, el.fontWeight, el.lineHeight);
      return `${indent}<h2${hc} className="${alignMap[el.align] || 'text-left'} ${typographyClasses}" style={{color:'${el.color}'}}>
      ${indent}  ${el.label}
      ${indent}</h2>`;
    }

    case 'input':
      return `${indent}<div${hc} className="flex flex-col gap-1">\n${indent}  <label className="text-sm font-medium text-gray-700">${el.label}</label>\n${indent}  <input type="${el.type}" placeholder="${el.placeholder}" className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />\n${indent}</div>`;
    case 'image':
      return `${indent}<img${hc} src="${el.src}" alt="${el.alt}" className="w-full ${roundedMap[el.rounded] || 'rounded-md'} object-${el.objectFit || 'cover'}" />`;
    case 'card': {
      const imgJSX = el.image ? `${indent}  <img src="${el.image}" alt="${el.imageAlt || ''}" className="w-full h-40 object-cover" />\n` : '';
      const ctaJSX = el.ctaLabel ? `${indent}    <button className="mt-3 self-start px-4 py-2 rounded-md ${getResponsiveTypographyClasses( el.ctaFontSize, el.ctaFontWeight, el.ctaLineHeight )}" style={{background:'${el.ctaBg}',color:'${el.ctaColor}'}}>${el.ctaLabel}</button>\n` : '';
      const cardInner = `${indent}<div${hc} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col" style={{background:'${el.bg}'}}>\n${imgJSX}${indent}  <div className="p-4 flex flex-col gap-1">\n${indent}    <p className="${getResponsiveTypographyClasses( el.titleFontSize, el.titleFontWeight, el.titleLineHeight )}" style={{ color:'${el.titleColor || "#111827"}' }} > ${el.title} </p>\n${indent}    <p className="${getResponsiveTypographyClasses( el.subtitleFontSize, el.subtitleFontWeight, el.subtitleLineHeight )}" style={{ color:'${el.subtitleColor || "#6B7280"}' }} > ${el.subtitle} </p>\n${ctaJSX}${indent}  </div>\n${indent}</div>`;
      // If a link URL is set, wrap the whole card in an anchor tag.
      return cardInner;
    }
    case 'badge':
      return `${indent}<span${hc} className="absolute top-2 left-2 z-20 px-3 py-1 rounded-full text-xs font-medium" style={{background:'${el.bg}',color:'${el.color}'}}> ${el.label} </span>`;
    case 'divider':
      return `${indent}<hr${hc} className="w-full" style={{borderColor:'${el.color}',borderTopWidth:${el.thickness}}} />`;

    case 'modal': {
      const modalbuttonBg =
        el.modalButtonType === 'button'
          ? `style={{background:'${el.modalButtonBg}',color:'${el.modalButtonColor}'}}`
          : `style={{color:'${el.modalButtonColor}'}}`;

      const triggerClass =
        el.modalButtonType === 'button'
          ? 'px-4 py-2 rounded-md text-sm font-medium'
          : 'text-sm font-medium underline';

      const modalContent =
        el.rows && el.rows.length
          ? rowsToJSX(el.rows, indent + '      ')
          : `${indent}      <p className="text-gray-600">Modal content goes here</p>`;

      return `${indent}{(() => {
        ${indent}  const [modalOpen, setModalOpen] = React.useState(false);
        ${indent}  const openButtonRef = React.useRef(null);
        ${indent}  const closeButtonRef = React.useRef(null);
        ${indent}  const modalRef = React.useRef(null);

        ${indent}  React.useEffect(() => {
        ${indent}    if (!modalOpen) return;

        ${indent}    closeButtonRef.current?.focus();

        ${indent}    const handleKeyDown = (event) => {
        ${indent}      if (event.key === 'Escape') {
        ${indent}        setModalOpen(false);
        ${indent}        openButtonRef.current?.focus();
        ${indent}      }
        ${indent}    };

        ${indent}    window.addEventListener('keydown', handleKeyDown);

        ${indent}    return () => {
        ${indent}      window.removeEventListener('keydown', handleKeyDown);
        ${indent}    };
        ${indent}  }, [modalOpen]);

        ${indent}  React.useEffect(() => {
        ${indent}    if (!modalOpen) return;

        ${indent}    const modal = modalRef.current;
        ${indent}    if (!modal) return;

        ${indent}    const handleTabKey = (event) => {
        ${indent}      if (event.key !== 'Tab') return;

        ${indent}      const focusableElements = modal.querySelectorAll(
        ${indent}        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ${indent}      );

        ${indent}      if (!focusableElements.length) return;

        ${indent}      const firstElement = focusableElements[0];
        ${indent}      const lastElement = focusableElements[focusableElements.length - 1];

        ${indent}      if (event.shiftKey && document.activeElement === firstElement) {
        ${indent}        event.preventDefault();
        ${indent}        lastElement.focus();
        ${indent}      } else if (!event.shiftKey && document.activeElement === lastElement) {
        ${indent}        event.preventDefault();
        ${indent}        firstElement.focus();
        ${indent}      }
        ${indent}    };

        ${indent}    modal.addEventListener('keydown', handleTabKey);

        ${indent}    return () => {
        ${indent}      modal.removeEventListener('keydown', handleTabKey);
        ${indent}    };
        ${indent}  }, [modalOpen]);

        ${indent}  return (
        ${indent}    <div${hc}>
        ${indent}      <button
        ${indent}        type="button"
        ${indent}        ref={openButtonRef}
        ${indent}        onClick={() => setModalOpen(true)}
        ${indent}        aria-haspopup="dialog"
        ${indent}        className="${triggerClass}"
        ${indent}        ${modalbuttonBg}
        ${indent}      >
        ${indent}        ${el.modalButtonLabel}
        ${indent}      </button>

        ${indent}      {modalOpen && (
        ${indent}        <div
        ${indent}          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 rounded-lg"
        ${indent}          onClick={() => {
        ${indent}            setModalOpen(false);
        ${indent}            openButtonRef.current?.focus();
        ${indent}          }}
        ${indent}        >
        ${indent}          <div
        ${indent}            ref={modalRef}
        ${indent}            role="dialog"
        ${indent}            aria-modal="true"
        ${indent}            aria-labelledby="modal-title"
        ${indent}            className="bg-white rounded-lg shadow-xl p-6 relative max-h-[80vh] overflow-y-auto"
        ${indent}            style={{width:'${el.modalContentWidth || '500px'}', background:'${el.modalContentBg || '#ffffff'}'}}
        ${indent}            onClick={(event) => event.stopPropagation()}
        ${indent}          >
        ${indent}            <button
        ${indent}              type="button"
        ${indent}              ref={closeButtonRef}
        ${indent}              onClick={() => {
        ${indent}                setModalOpen(false);
        ${indent}                openButtonRef.current?.focus();
        ${indent}              }}
        ${indent}              aria-label="Close modal"
        ${indent}              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-xl"
        ${indent}              style={{background:'none',border:'none',cursor:'pointer'}}
        ${indent}            >
        ${indent}              ×
        ${indent}            </button>

        ${indent}            <h2
        ${indent}              id="modal-title"
        ${indent}              className="${getResponsiveTypographyClasses({ fontSize: el.modalTitleFontSize || { desktop: 18, tablet: 16, mobile: 14 }, fontWeight: el.modalTitleFontWeight || { desktop: '600', tablet: '600', mobile: '600' }, lineHeight: el.modalTitleLineHeight || { desktop: 1.2, tablet: 1.3, mobile: 1.4 } }, 'mobile')} mb-4 pr-6"
        ${indent}            >
        ${indent}              ${el.modalContentTitle || 'Modal'}
        ${indent}            </h2>

        ${indent}            <div className="flex flex-col gap-4">
        ${modalContent}
        ${indent}            </div>
        ${indent}          </div>
        ${indent}        </div>
        ${indent}      )}
        ${indent}    </div>
        ${indent}  );
        ${indent}})()
      }`;
    }

case 'popover': {
  const position = el.popoverContentPosition || "bottom";

  const positionClasses = {
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    right: "left-full ml-3 top-1/2 -translate-y-1/2"
  };

  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-t-8 border-transparent",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-l-8 border-r-8 border-b-8 border-transparent",
    left: "left-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-l-8 border-transparent",
    right: "right-full top-1/2 -translate-y-1/2 border-t-8 border-b-8 border-r-8 border-transparent"
  };

  const popoverId = `popover-${Math.random().toString(36).slice(2, 8)}`;

  return `${indent}{(() => {
    ${indent} const [open, setOpen] = React.useState(false);
    ${indent} const buttonRef = React.useRef(null);
    ${indent} const popoverRef = React.useRef(null);

    ${indent} React.useEffect(() => {
    ${indent}   if (!open) return;

    ${indent}   const handleKeyDown = (event) => {
    ${indent}     if (event.key === 'Escape') {
    ${indent}       setOpen(false);
    ${indent}       buttonRef.current?.focus();
    ${indent}     }
    ${indent}   };

    ${indent}   const handleOutsideClick = (event) => {
    ${indent}     if (
    ${indent}       popoverRef.current &&
    ${indent}       !popoverRef.current.contains(event.target) &&
    ${indent}       buttonRef.current &&
    ${indent}       !buttonRef.current.contains(event.target)
    ${indent}     ) {
    ${indent}       setOpen(false);
    ${indent}     }
    ${indent}   };

    ${indent}   window.addEventListener('keydown', handleKeyDown);
    ${indent}   document.addEventListener('mousedown', handleOutsideClick);


    ${indent}   return () => {
    ${indent}     window.removeEventListener('keydown', handleKeyDown);
    ${indent}     document.removeEventListener('mousedown', handleOutsideClick);
    ${indent}   };
    ${indent} }, [open]);

    ${indent} return (
    ${indent} <div className="relative inline-block w-max text-left">

    ${indent}   <button
    ${indent}     ref={buttonRef}
    ${indent}     type="button"
    ${indent}     onClick={() => setOpen(!open)}
    ${indent}     aria-expanded={open}
    ${indent}     aria-controls="${popoverId}"
    ${indent}     className="px-4 py-2 rounded-md text-sm font-medium"
    ${indent}     style={{
    ${indent}       background:'${el.popoverButtonBg}',
    ${indent}       color:'${el.popoverButtonColor}'
    ${indent}     }}
    ${indent}   >
    ${indent}     ${el.popoverButtonLabel}
    ${indent}   </button>

    ${indent}   {open && (
    ${indent}     <div
    ${indent}       ref={popoverRef}
    ${indent}       id="${popoverId}"
    ${indent}       role="dialog"
    ${indent}       aria-labelledby="${popoverId}-title"
    ${indent}       className="absolute z-50 rounded-lg shadow-lg p-4 ${positionClasses[position]}"
    ${indent}       style={{
    ${indent}         width:'${el.popoverContentWidth || "280px"}',
    ${indent}         background:'${el.popoverContentBg}',
    ${indent}         color:'${el.popoverContentColor}'
    ${indent}       }}
    ${indent}     >

    ${indent}       <div
    ${indent}         className="absolute w-0 h-0 ${arrowClasses[position]}"
    ${indent}         aria-hidden="true"
    ${indent}         style={{
    ${indent}           borderColor:'transparent',
    ${indent}           ${position === "top" ? "borderTopColor:'" + el.popoverContentBg + "'" : ""}
    ${indent}           ${position === "bottom" ? "borderBottomColor:'" + el.popoverContentBg + "'" : ""}
    ${indent}           ${position === "left" ? "borderLeftColor:'" + el.popoverContentBg + "'" : ""}
    ${indent}           ${position === "right" ? "borderRightColor:'" + el.popoverContentBg + "'" : ""}
    ${indent}         }}
    ${indent}       ></div>

    ${indent}       <h3
    ${indent}         id="${popoverId}-title"
    ${indent}         className="${getResponsiveTypographyClasses({ fontSize: el.popoverTitleFontSize || { desktop: 14, tablet: 13, mobile: 12 }, fontWeight: el.popoverTitleFontWeight || { desktop: 'medium', tablet: 'medium', mobile: 'medium' }, lineHeight: el.popoverTitleLineHeight || { desktop: 1.2, tablet: 1.3, mobile: 1.4 } }, 'mobile')} mb-2"
    ${indent}       >
    ${indent}         ${el.popoverContentTitle}
    ${indent}       </h3>

    ${indent}       <p
    ${indent}        className="${getResponsiveTypographyClasses({ fontSize: el.popoverTextFontSize || { desktop: 12, tablet: 11, mobile: 10 }, fontWeight: el.popoverTextFontWeight || { desktop: 'normal', tablet: 'normal', mobile: 'normal' }, lineHeight: el.popoverTextLineHeight || { desktop: 1.4, tablet: 1.5, mobile: 1.6 } }, 'mobile')}"
    ${indent}       >
    ${indent}       ${el.popoverContentText}
    ${indent}       </p>

    ${indent}     </div>
    ${indent}   )}

    ${indent} </div>
    ${indent} );
    ${indent}})()
  }`;
}

    case 'navbar': {
      const navLinkNames = (el.links || '').split(',').map((l) => l.trim()).filter(Boolean);
      let submenus = {};
      try { submenus = el.submenus ? JSON.parse(el.submenus) : {}; } catch (e) { }
      const logoAlign = el.logoAlign || 'left';

      const logoJSX = `<div className="flex items-center gap-2 shrink-0">${el.logoUrl ? `<img src="${el.logoUrl}" alt="logo" className="h-7 w-auto object-contain" />` : ''}${el.brand ? `<span className="font-bold text-sm whitespace-nowrap">${el.brand}</span>` : ''}</div>`;

      // Desktop inline links (hover submenus) — visible md and up only.
      const desktopLinkItems = navLinkNames.map((l) => {
        const hasSub = submenus[l] && submenus[l].length > 0;
        if (hasSub) {
          const subs = submenus[l].split(',').map(s => s.trim());
          const subJSX = subs.map(s => `${indent}          <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">${s}</a>`).join('\n');
          return `${indent}      <div className="relative group">\n${indent}        <button className="flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5 text-sm font-medium">${l} &#8964;</button>\n${indent}        <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block min-w-[160px] z-50">\n${subJSX}\n${indent}        </div>\n${indent}      </div>`;
        }
        return `${indent}      <a href="#" className="px-2 py-1 rounded hover:bg-black/5 text-sm font-medium whitespace-nowrap">${l}</a>`;
      }).join('\n');

      // Mobile accordion links — submenus expand inline on click (no hover on touch).
      const mobileLinkItems = navLinkNames.map((l) => {
        const hasSub = submenus[l] && submenus[l].length > 0;
        if (hasSub) {
          const subs = submenus[l].split(',').map(s => s.trim());
          const subJSX = subs.map(s => `${indent}            <div className="px-2 py-1.5 text-xs text-gray-600">${s}</div>`).join('\n');
          const slug = l.replace(/[^a-zA-Z0-9]/g, '');
          return `${indent}        <div>\n${indent}          <button onClick={() => setOpenMenu(openMenu === '${slug}' ? null : '${slug}')} className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-black/5 text-left text-sm font-medium">\n${indent}            ${l}\n${indent}            <span className={\`transition-transform \${openMenu === '${slug}' ? 'rotate-180' : ''}\`}>&#8964;</span>\n${indent}          </button>\n${indent}          {openMenu === '${slug}' && (\n${indent}            <div className="flex flex-col pl-4 pb-1">\n${subJSX}\n${indent}            </div>\n${indent}          )}\n${indent}        </div>`;
        }
        return `${indent}        <a href="#" className="px-2 py-2 rounded hover:bg-black/5 text-sm font-medium block">${l}</a>`;
      }).join('\n');

      const justifyClass = logoAlign === 'right' ? 'justify-between flex-row-reverse' : 'justify-between';

      // Self-contained sub-component: owns its own mobile-menu open state so
      // multiple navbars in one export don't share toggle state.
      const compName = nextNavbarName();
      const componentDef = `function ${compName}() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openMenu, setOpenMenu] = React.useState(null);
  return (
    <header className="compify-header w-full rounded-lg overflow-hidden" style={{background:'${el.bg}',color:'${el.color}'}}>
      {/* Desktop nav — hidden below md */}
      <div className="hidden md:grid md:grid-cols-3 items-center px-4 py-3${el.shadow ? ' shadow-md' : ''}">
        <div className="flex items-center justify-start">${logoAlign === 'right' ? `<div className="flex items-center gap-1 text-sm font-medium">\n${desktopLinkItems}\n      </div>` : logoJSX}</div>
        <div className="flex items-center justify-center">${logoAlign === 'center' ? logoJSX : ''}</div>
        <div className="flex items-center justify-end">${logoAlign === 'right' ? logoJSX : `<div className="flex items-center gap-1 text-sm font-medium">\n${desktopLinkItems}\n      </div>`}</div>
      </div>
      {/* Mobile / tablet nav — hamburger toggle, hidden md and up */}
      <div className="md:hidden">
        <div className="flex items-center ${justifyClass} px-4 py-3${el.shadow ? ' shadow-md' : ''}">
          ${logoJSX}
          <button onClick={() => setMobileOpen(o => !o)} className="p-1 rounded hover:bg-black/5" aria-label="Toggle menu">
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            )}
          </button>
        </div>
        {mobileOpen && (
          <div className="border-t border-black/5 bg-white/95 flex flex-col gap-0.5 px-3 pb-2">
${mobileLinkItems}
          </div>
        )}
      </div>
    </header>
  );
}`;
      registerHelperComponent(compName, componentDef);
      return `${indent}<${compName} />`;
    }

    case 'hero': {
      const alignCls = el.align === 'right' ? 'items-end text-right' : el.align === 'center' ? 'items-center text-center' : 'items-start text-left';
      const Tag = ['h1', 'h2', 'h3', 'h4'].includes(el.titleTag) ? el.titleTag : 'h1';
      const hasBgImage = el.bgImageDesktop || el.bgImageTablet || el.bgImageMobile;

      const heightStyleStr =
        el.heightMode === 'fixed' ? `minHeight:${el.minHeight || 400}` :
          el.heightMode === 'viewport' ? `minHeight:'${el.viewportHeight || 60}vh'` :
            '';
      const verticalPadding = el.verticalPadding || {
        desktop: 8,
        tablet: 6,
        mobile: 4,
      };

      const horizontalPadding = el.horizontalPadding || {
        desktop: 8,
        tablet: 6,
        mobile: 4,
      };

      const pyClass = `py-${verticalPadding.mobile} md:py-${verticalPadding.tablet} lg:py-${verticalPadding.desktop}`;

      const pxClass = `px-${horizontalPadding.mobile} md:px-${horizontalPadding.tablet} lg:px-${horizontalPadding.desktop}`;

      // Background: use a real <picture>-style approach via CSS custom
      // properties + media queries so desktop/tablet/mobile each get their
      // own image. We emit a <style> block scoped with a unique class.
      const heroClass = `hero-bg-${Math.random().toString(36).slice(2, 8)}`;
      let bgCss = '';
      if (hasBgImage) {
        const overlay = el.bgOverlay ?? 0.3;
        const desktopImg = el.bgImageDesktop || el.bgImageTablet || el.bgImageMobile;
        const tabletImg = el.bgImageTablet || desktopImg;
        const mobileImg = el.bgImageMobile || tabletImg;
        bgCss = `
      /* Responsive hero background — ${heroClass} */
      .${heroClass} {
        background-image: linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url('${desktopImg}');
        background-size: cover;
        background-position: center;
      }
      @media (max-width: 1024px) {
        .${heroClass} {
          background-image: linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url('${tabletImg}');
        }
      }
      @media (max-width: 640px) {
        .${heroClass} {
          background-image: linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url('${mobileImg}');
        }
      }`;
      }

      const textColorWhenBg = hasBgImage ? '#ffffff' : undefined;
      const titleTypography = getResponsiveTypographyClasses(el.titleSize, el.titleWeight, el.titleLineHeight);
      const subtitleTypography = getResponsiveTypographyClasses(el.subtitleSize, el.subtitleFontWeight, el.subtitleLineHeight);
      const ctaTypography = getResponsiveTypographyClasses(el.ctaSize, el.ctaFontWeight, el.ctaLineHeight);
      const heroDiv = `${indent}<div${hc} className="w-full rounded-xl ${pxClass} ${pyClass} flex flex-col gap-4 justify-center ${alignCls}${hasBgImage ? ' ' + heroClass : ''}" style={{${hasBgImage ? '' : `background:'${el.bg}',`}${heightStyleStr ? heightStyleStr + ',' : ''}}}>\n${indent}  <${Tag} className="${titleTypography}" style={{color:'${el.titleColor || textColorWhenBg || '#111827'}',margin:0}}>${el.title}</${Tag}>\n${indent}  <p className="${subtitleTypography}" style={{color:'${el.subtitleColor || textColorWhenBg || '#6b7280'}',margin:0,maxWidth:560}}>${el.subtitle}</p>\n${indent}  <button className="mt-1 ${roundedMap[el.ctaRounded] || 'rounded-md'} ${ctaTypography}" style={{background:'${el.ctaBg || '#3b82f6'}',color:'${el.ctaColor || '#ffffff'}',padding:'10px 24px',border:'none'}}>${el.ctaLabel}</button>\n${indent}</div>`;

      return hasBgImage ? `${indent}<style>{\`${bgCss}\`}</style>\n${heroDiv}` : heroDiv;
    }

    case 'formgroup': {
      const fields = normalizeFormFields(el.fields);
      const fieldsJSX = fields.map((field, index) => formFieldToJSX(field, `${indent}  `, index)).join('\n');
      return `${indent}<form${hc} className="w-full rounded-xl border border-gray-200 p-4 flex flex-col gap-3 bg-white text-left">\n${indent}  <p className="font-semibold text-gray-900">${el.title}</p>\n${fieldsJSX}\n${indent}  <button type="submit" className="mt-1 px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white self-start">${el.buttonLabel}</button>\n${indent}</form>`;
    }

    case 'container': {
      const inner = rowsToJSX(el.rows || [], indent + '  ');
      return `${indent}<div${hc} className="w-full">\n${inner || `${indent}  {/* empty nested layout */}`}\n${indent}</div>`;
    }

    default:
      return `${indent}{/* unknown element: ${el.type} */}`;
  }
};

const flexRatioToClass = (flex) => {
  const map = { 1: 'flex-1', 2: 'flex-[2]', 3: 'flex-[3]', 4: 'flex-[4]' };
  return map[flex] || 'flex-1';
};

const rowsToJSX = (rows, indent = '      ') => {
  if (!rows.length) return '';
  return rows.map((row) => {
    const gap = row.gap || {
      desktop: 4,
      tablet: 3,
      mobile: 2,
    };

    const gapClass = `gap-${gap.mobile} md:gap-${gap.tablet} lg:gap-${gap.desktop}`;
    const stackClass = row.stackOnMobile ? 'flex-col md:flex-row' : 'flex-row';
    // const pyClass = `py-${row.paddingY || 2}`;
    const verticalPadding = row.verticalPadding || {
      desktop: row.paddingY || 2,
      tablet: row.paddingY || 2,
      mobile: row.paddingY || 2,
    };

    const horizontalPadding = row.horizontalPadding || {
      desktop: 4,
      tablet: 3,
      mobile: 2,
    };

    // const pxClass = `px-${horizontalPadding.mobile} md:px-${horizontalPadding.tablet} lg:px-${horizontalPadding.desktop}`;

    const pyClass = `py-${verticalPadding.mobile} md:py-${verticalPadding.tablet} lg:py-${verticalPadding.desktop}`;
    const pxClass = `px-${horizontalPadding.mobile} md:px-${horizontalPadding.tablet} lg:px-${horizontalPadding.desktop}`;
    const colsCode = row.cols.map((col) => {

      const flexClass = flexRatioToClass(col.flex);
      const badges = col.elements.filter(el => el.type === 'badge');
      const others = col.elements.filter(el => el.type !== 'badge');
      
      const badgeCode = badges
        .map(el => elToJSX(el, indent + '      '))
        .join('\n');

      const otherCode = others
        .map(el => elToJSX(el, indent + '      '))
        .join('\n');

      return `${indent}  <div className="${flexClass} relative flex flex-col gap-3">

      ${badgeCode}

      ${otherCode || `${indent}    {/* empty column */}`}

      ${indent}  </div>`;
    }).join('\n');

    return `${indent}{/* Row */}\n${indent}<div className="flex ${stackClass} ${gapClass} ${pxClass} ${pyClass}">\n${colsCode}\n${indent}</div>`;
  }).join('\n\n');
};

export const generateJSX = (rows, componentName = 'MyComponent', globalFont = "'Inter', sans-serif") => {
  resetHelperRegistry();

  if (!rows.length) return `// Canvas is empty — drag rows and elements to get started.`;

  const safeName = (componentName || 'MyComponent').replace(/[^a-zA-Z0-9]/g, '') || 'MyComponent';
  const rowsCode = rowsToJSX(rows, '      ');

  const usesReactHooks = _helperComponents.length > 0;
  const helpersCode = _helperComponents.length > 0
    ? '\n' + _helperComponents.join('\n\n') + '\n'
    : '';

  return `import React from 'react';

/**
 * Generated by Component Builder
 * Tailwind CSS classes used — make sure Tailwind is configured in your project.
 */${helpersCode}
export default function ${safeName}() {
  return (
    <div className="compify-root w-full max-w-5xl mx-auto px-4" style={{ fontFamily: "${globalFont}" }}>
${rowsCode}
    </div>
  );
}
`;
};
