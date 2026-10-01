import { useState } from 'react';
import RowsCanvas from './RowsCanvas';
import useBuilderStore from '../store/builderStore';
import { getResponsiveTypographyClassName, getResponsiveTypographyClasses, getResponsiveTypographyStyles } from '../utils/responsiveTypography';
import { ChevronDown, Menu, X, Lock, Mail, User, Eye, EyeOff, Type, Phone } from 'lucide-react';

const roundedCls = { none: '', sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };

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
        validationRegex: field?.validationRegex || '',
        icon: field?.icon || 'none',
      };
    });
  }

  return (fields || '')
    .split(',')
    .map((f) => f.trim())
    .filter(Boolean)
    .map((label) => ({ label, type: 'input', placeholder: '', required: false, inputType: 'text', validationRegex: '', icon: 'none' }));
};

const renderInputIcon = (iconName) => {
  switch (iconName) {
    case 'mail': return <Mail size={14} />;
    case 'lock': return <Lock size={14} />;
    case 'user': return <User size={14} />;
    case 'number': return <Phone size={14} />;
    default: return <Type size={14} />;
  }
};

const PasswordFieldPreview = ({ field, index }) => {
  const [showPassword, setShowPassword] = useState(false);
  const label = field.label || `Field ${index + 1}`;
  const hasIcon = field.icon && field.icon !== 'none';

  return (
    <div key={`${label}-${index}`} className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}{field.required ? ' *' : ''}</label>
      <div className="relative">
        {hasIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {renderInputIcon(field.icon)}
          </div>
        )}
        <input
          disabled
          type={showPassword ? 'text' : 'password'}
          placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
          pattern={field.validationRegex || undefined}
          title={field.validationRegex ? `Must match: ${field.validationRegex}` : undefined}
          className={`border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full ${hasIcon ? 'pl-10' : ''} pr-10`}
        />
        <button
          disabled={true}
          type="button"
          className="
            absolute inset-y-0 right-0 flex items-center pr-3
            text-gray-400
            hover:text-gray-600
            disabled:hover:text-gray-400
            disabled:cursor-not-allowed
            disabled:pointer-events-none
          "
          onClick={() => setShowPassword((value) => !value)}
        >
          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
};

const renderFormFieldPreview = (field, index) => {
  const label = field.label || `Field ${index + 1}`;

  switch (field.type) {
    case 'textarea':
      return (
        <div key={`${label}-${index}`} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">{label}{field.required ? ' *' : ''}</label>
          <textarea disabled placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full min-h-[72px]" />
        </div>
      );
    case 'dropdown':
      return (
        <div key={`${label}-${index}`} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">{label}{field.required ? ' *' : ''}</label>
          <select disabled className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full">
            {((field.options || '').split(',').map((opt) => opt.trim()).filter(Boolean)).length > 0 ? (
              (field.options || '').split(',').map((opt) => opt.trim()).filter(Boolean).map((opt) => <option key={opt}>{opt}</option>)
            ) : (
              <option>Select</option>
            )}
          </select>
        </div>
      );
    case 'checkbox':
      return (
        <label key={`${label}-${index}`} className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" disabled className="h-4 w-4 rounded border-gray-300 text-blue-600" />
          <span>{label}{field.required ? ' *' : ''}</span>
        </label>
      );
    default: {
      const inputType = field.inputType || 'text';
      if (inputType === 'password') {
        return <PasswordFieldPreview field={field} index={index} />;
      }

      const hasIcon = field.icon && field.icon !== 'none';
      return (
        <div key={`${label}-${index}`} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">{label}{field.required ? ' *' : ''}</label>
          <div className="relative">
            {hasIcon && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {renderInputIcon(field.icon)}
              </div>
            )}
            <input
              disabled
              type={inputType}
              placeholder={field.placeholder || `Enter ${label.toLowerCase()}`}
              pattern={field.validationRegex || undefined}
              title={field.validationRegex ? `Must match: ${field.validationRegex}` : undefined}
              className={`border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full ${hasIcon ? 'pl-10' : ''}`}
            />
          </div>
        </div>
      );
    }
  }
};

/* ── Navbar ──────────────────────────────────────────────────────────── */
function NavbarPreview({ el, device }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const links = (el.links || '').split(',').map((l) => l.trim()).filter(Boolean);

  let submenus = {};
  try { submenus = el.submenus ? JSON.parse(el.submenus) : {}; } catch {}

  // Hamburger kicks in on tablet and mobile previews — desktop keeps the
  // full inline nav with hover submenus.
  const isCompact = device === 'mobile' || device === 'tablet';

  const logoArea = (
    <div className="flex items-center gap-2 shrink-0">
      {el.logoUrl && (
        <img src={el.logoUrl} alt="logo" className="h-7 w-auto object-contain"
          onError={(e) => { e.target.style.display = 'none'; }} />
      )}
      {el.brand && <span className="font-bold text-sm whitespace-nowrap">{el.brand}</span>}
    </div>
  );

  // Rendered exactly once — never duplicated, regardless of logo alignment.
  const navLinks = (
    <div className="flex items-center gap-1 text-xs font-medium">
      {links.map((link, i) => {
        const hasSub = submenus[link]?.length > 0;
        const subItems = hasSub ? submenus[link].split(',').map((s) => s.trim()) : [];
        return (
          <div key={i} className="relative">
            <button
              onMouseEnter={() => hasSub && setOpenMenu(link)}
              onMouseLeave={() => setOpenMenu(null)}
              className="flex items-center gap-0.5 px-2 py-1 rounded hover:bg-black/5 transition-colors whitespace-nowrap"
              style={{ color: el.color }}
            >
              {link}
              {hasSub && <ChevronDown size={11} />}
            </button>
            {hasSub && openMenu === link && (
              <div
                className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 min-w-[140px]"
                onMouseEnter={() => setOpenMenu(link)}
                onMouseLeave={() => setOpenMenu(null)}
              >
                {subItems.map((sub, j) => (
                  <div key={j} className="px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
                    {sub}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Stacked accordion-style links for the mobile/tablet dropdown panel —
  // submenus expand inline instead of on hover (no hover affordance on touch).
  const mobileLinks = (
    <div className="flex flex-col gap-0.5 px-1 pb-2">
      {links.map((link, i) => {
        const hasSub = submenus[link]?.length > 0;
        const subItems = hasSub ? submenus[link].split(',').map((s) => s.trim()) : [];
        const expanded = openMenu === link;
        return (
          <div key={i}>
            <button
              onClick={() => setOpenMenu(expanded ? null : (hasSub ? link : null))}
              className="w-full flex items-center justify-between px-2 py-2 rounded hover:bg-black/5 text-left text-sm font-medium"
              style={{ color: el.color }}
            >
              {link}
              {hasSub && <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />}
            </button>
            {hasSub && expanded && (
              <div className="flex flex-col pl-4 pb-1">
                {subItems.map((sub, j) => (
                  <div key={j} className="px-2 py-1.5 text-xs text-gray-600">{sub}</div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const align = el.logoAlign || 'left';

  // 3-cell grid for desktop: [left-cell] [center-cell] [right-cell].
  let leftCell = null, centerCell = null, rightCell = null;
  if (align === 'left') {
    leftCell = logoArea;
    rightCell = navLinks;
  } else if (align === 'right') {
    leftCell = navLinks;
    rightCell = logoArea;
  } else {
    centerCell = logoArea;
    rightCell = navLinks;
  }

  if (isCompact) {
    // Compact layout: logo on one side, hamburger toggle on the other —
    // alignment still controls which side the logo sits on.
    return (
      <div className="w-full rounded-lg overflow-hidden" style={{ background: el.bg }}>
        <div className={`flex items-center justify-between px-4 py-3 ${el.shadow ? 'shadow-md' : ''}`}>
          {align === 'right' ? (
            <>
              <button onClick={() => setMobileMenuOpen((o) => !o)} className="p-1 rounded hover:bg-black/5" style={{ color: el.color }}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {logoArea}
            </>
          ) : (
            <>
              {logoArea}
              <button onClick={() => setMobileMenuOpen((o) => !o)} className="p-1 rounded hover:bg-black/5" style={{ color: el.color }}>
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          )}
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-black/5 bg-white/95">
            {mobileLinks}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`w-full grid grid-cols-3 items-center px-4 py-3 rounded-lg ${el.shadow ? 'shadow-md' : ''}`}
      style={{ background: el.bg, color: el.color }}
    >
      <div className="flex items-center justify-start">{leftCell}</div>
      <div className="flex items-center justify-center">{centerCell}</div>
      <div className="flex items-center justify-end">{rightCell}</div>
    </div>
  );
}

/* ── Hero ────────────────────────────────────────────────────────────── */
function HeroPreview({ el, device }) {
  const alignCls = el.align === 'right' ? 'items-end text-right' : el.align === 'center' ? 'items-center text-center' : 'items-start text-left';
  const Tag = ['h1','h2','h3','h4'].includes(el.titleTag) ? el.titleTag : 'h1';

  // Pick the right background image for the currently simulated device,
  // falling back up the chain: mobile -> tablet -> desktop -> none.
  const bgImage =
    device === 'mobile'  ? (el.bgImageMobile || el.bgImageTablet || el.bgImageDesktop) :
    device === 'tablet'  ? (el.bgImageTablet || el.bgImageDesktop || el.bgImageMobile) :
                            (el.bgImageDesktop || el.bgImageTablet || el.bgImageMobile);

  const heightMode = el.heightMode || 'auto';
  const heightStyle =
    heightMode === 'fixed'    ? { minHeight: el.minHeight || 400 } :
    heightMode === 'viewport' ? { minHeight: `${el.viewportHeight || 60}vh` } :
    {}; // 'auto' — height follows content + paddingY only

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

  const paddingY =
    device === "mobile"
      ? verticalPadding.mobile
      : device === "tablet"
      ? verticalPadding.tablet
      : verticalPadding.desktop;

  const paddingX =
    device === "mobile"
      ? horizontalPadding.mobile
      : device === "tablet"
      ? horizontalPadding.tablet
      : horizontalPadding.desktop;

  const bgStyle = bgImage
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,${el.bgOverlay ?? 0.3}), rgba(0,0,0,${el.bgOverlay ?? 0.3})), url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        ...heightStyle,
      }
    : { background: el.bg, ...heightStyle };

  const textColorWhenBgImage = bgImage ? '#ffffff' : undefined;
  const titleTypography = getResponsiveTypographyStyles({ fontSize: el.titleSize, fontWeight: el.titleWeight, lineHeight: el.titleLineHeight }, device);
  const subtitleTypography = getResponsiveTypographyStyles({ fontSize: el.subtitleSize, fontWeight: el.subtitleFontWeight, lineHeight: el.subtitleLineHeight }, device);
  const ctaTypography = getResponsiveTypographyStyles({ fontSize: el.ctaSize, fontWeight: el.ctaFontWeight, lineHeight: el.ctaLineHeight }, device);

  return (
    <div
      className={`w-full rounded-xl flex flex-col gap-4 justify-center ${alignCls}`}
      style={{
        ...bgStyle,
        paddingTop: paddingY * 4,
        paddingBottom: paddingY * 4,
        paddingLeft: paddingX * 4,
        paddingRight: paddingX * 4,
      }}
    >
      <Tag
        className={getResponsiveTypographyClasses({ fontSize: el.titleSize, fontWeight: el.titleWeight, lineHeight: el.titleLineHeight }, device)}
        style={{
          color: el.titleColor || textColorWhenBgImage || '#111827',
          margin: 0,
        }}
      >
        {el.title}
      </Tag>
      <p className={getResponsiveTypographyClasses({ fontSize: el.subtitleSize, fontWeight: el.subtitleFontWeight, lineHeight: el.subtitleLineHeight }, device)} style={{ color: el.subtitleColor || textColorWhenBgImage || '#6b7280', margin: 0, maxWidth: 560 }}>
        {el.subtitle}
      </p>
      <button
        className={`mt-1 ${getResponsiveTypographyClasses({ fontSize: el.ctaSize, fontWeight: el.ctaFontWeight, lineHeight: el.ctaLineHeight }, device)} ${roundedCls[el.ctaRounded] || 'rounded-md'}`}
        style={{
          background: el.ctaBg || '#3b82f6',
          color: el.ctaColor || '#ffffff',
          padding: '10px 24px',
          border: 'none',
          pointerEvents: 'none',
          cursor: 'default',
        }}
      >
        {el.ctaLabel}
      </button>
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────────────────── */
export default function ElementPreview({ el, isSelected, device }) {
  const hideOn = el.hideOn || {};
  const hidden =
    (device === 'mobile'  && hideOn.mobile)  ||
    (device === 'tablet'  && hideOn.tablet)  ||
    (device === 'desktop' && hideOn.desktop);

  if (hidden) {
    return (
      <div className="px-2 py-1 border border-dashed border-orange-300 bg-orange-50 rounded text-xs text-orange-400 text-center select-none">
        Hidden on {device}
      </div>
    );
  }

  switch (el.type) {
    case 'button': {
      const typography = getResponsiveTypographyStyles(el, device);
      return (
        <button
          className={`text-sm ${roundedCls[el.rounded] || 'rounded-md'} ${el.padding === 'sm' ? 'px-3 py-1.5' : el.padding === 'lg' ? 'px-6 py-3' : 'px-4 py-2'}`}
          style={{ background: el.bg, color: el.color, fontSize: typography.fontSize, fontWeight: typography.fontWeight, lineHeight: typography.lineHeight, pointerEvents: 'none', border: 'none', cursor: 'default' }}
        >
          {el.label}
        </button>
      );
    }

    case 'text': {
      const typography = getResponsiveTypographyStyles(el, device);
      return (
        <p
          className={`leading-relaxed ${getResponsiveTypographyClassName(el, device)} ${el.align === 'center' ? 'text-center' : el.align === 'right' ? 'text-right' : 'text-left'}`}
          style={{ color: el.color, fontSize: typography.fontSize, fontWeight: typography.fontWeight, lineHeight: typography.lineHeight, margin: 0 }}
        >
          {el.label}
        </p>
      );
    }

    case "radio": {
        const typography = getResponsiveTypographyStyles(el, device);
        return (
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={el.group}
              value={el.value}
              checked={el.checked}
              onChange={() =>
                useBuilderStore
                  .getState()
                  .updateRadioSelection(el.id, true)
              }
              style={{
                accentColor: el.color,
                textAlign: el.align,
              }}
            />

            <span className={`${getResponsiveTypographyClasses({ fontSize: el.fontSize, fontWeight: el.fontWeight, lineHeight: el.lineHeight }, device)} ${el.align === 'center' ? 'text-center' : el.align === 'right' ? 'text-right' : 'text-left'}`} style={{ color: el.color }}>{el.label}</span>
          </label>
        );
    }

    case "checkbox": {
        const typography = getResponsiveTypographyStyles(el, device);
        return (
          <div
            style={{
              display: "flex",
              justifyContent:
                el.align === "center"
                  ? "center"
                  : el.align === "right"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={el.checked}
                onChange={(e) =>
                  useBuilderStore.getState().updateElement(el.id, {
                    checked: e.target.checked,
                  })
                }
                style={{ accentColor: el.color }}
              />

              <span
                className={`${getResponsiveTypographyClasses({ fontSize: el.fontSize, fontWeight: el.fontWeight, lineHeight: el.lineHeight }, device)} ${el.align === 'center' ? 'text-center' : el.align === 'right' ? 'text-right' : 'text-left'}`}
                style={{ color: el.color }}
              >
                {el.label}
              </span>
            </label>
          </div>
        );
    }

    case 'heading': {
      const Tag = ['h1','h2','h3','h4','h5','h6'].includes(el.tag) ? el.tag : 'h2';
      const typography = getResponsiveTypographyStyles(el, device);
      return (
        <Tag
          className={`leading-tight ${getResponsiveTypographyClassName(el, device)} ${el.align === 'center' ? 'text-center' : el.align === 'right' ? 'text-right' : 'text-left'}`}
          style={{ color: el.color, fontSize: typography.fontSize, fontWeight: typography.fontWeight, lineHeight: typography.lineHeight, margin: 0 }}
        >
          {el.label}
        </Tag>
      );
    }

    case 'input':
      return (
        <div className="flex flex-col gap-1 w-full">
          <label className="text-xs font-medium text-gray-600">{el.label}</label>
          <input type="text" placeholder={el.placeholder} disabled
            className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white w-full" />
        </div>
      );

    case 'image':
      return (
        <img src={el.src} alt={el.alt}
          className={`w-full object-cover ${roundedCls[el.rounded] || 'rounded-md'}`}
          style={{ pointerEvents: 'none' }}
          onError={(e) => { e.target.src = 'https://placehold.co/400x200/f3f4f6/9ca3af?text=Image'; }}
        />
      );

    case 'card': {
  const titleTypography = getResponsiveTypographyStyles(
    {
      fontSize: el.titleFontSize,
      fontWeight: el.titleFontWeight,
      lineHeight: el.titleLineHeight,
    },
    device
  );

  const subtitleTypography = getResponsiveTypographyStyles(
    {
      fontSize: el.subtitleFontSize,
      fontWeight: el.subtitleFontWeight,
      lineHeight: el.subtitleLineHeight,
    },
    device
  );

  const ctaTypography = getResponsiveTypographyStyles(
    {
      fontSize: el.ctaFontSize,
      fontWeight: el.ctaFontWeight,
      lineHeight: el.ctaLineHeight,
    },
    device
  );

  return (
    <div
      className="border border-gray-200 rounded-xl overflow-hidden shadow-md w-full flex flex-col"
      style={{ background: el.bg }}
    >
      {el.image && (
        <img
          src={el.image}
          alt={el.imageAlt || ""}
          className="w-full h-32 object-cover"
          style={{ pointerEvents: "none" }}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      )}

      <div className="p-4 flex flex-col gap-2">

        {/* Title */}
        <p
          style={{
            margin: 0,
            color: "#111827",
            fontSize: titleTypography.fontSize,
            fontWeight: titleTypography.fontWeight,
            lineHeight: titleTypography.lineHeight,
          }}
        >
          {el.title}
        </p>

        {/* Subtitle */}
        <p
          style={{
            margin: 0,
            color: "#6b7280",
            fontSize: subtitleTypography.fontSize,
            fontWeight: subtitleTypography.fontWeight,
            lineHeight: subtitleTypography.lineHeight,
          }}
        >
          {el.subtitle}
        </p>

        {/* CTA Button */}
        {el.ctaLabel && (
          <button
            className="mt-3 self-start px-3 py-1.5 rounded-md"
            style={{
              background: el.ctaBg,
              color: el.ctaColor,
              border: "none",
              pointerEvents: "none",
              cursor: "default",
              fontSize: ctaTypography.fontSize,
              fontWeight: ctaTypography.fontWeight,
              lineHeight: ctaTypography.lineHeight,
            }}
          >
            {el.ctaLabel}
          </button>
        )}

        {/* Link */}
        {el.link && !el.ctaLabel && (
          <span
            style={{
              color: el.ctaBg || "#3b82f6",
              fontSize: ctaTypography.fontSize,
              fontWeight: ctaTypography.fontWeight,
              lineHeight: ctaTypography.lineHeight,
            }}
          >
            {el.link} →
          </span>
        )}
      </div>
    </div>
  );
}

    case 'badge':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
          style={{ background: el.bg, color: el.color }}>
          {el.label}
        </span>
      );

    case "alert":
      return (
          <div
              className={`rounded-md border p-3 ${
                  el.variant === "success"
                      ? "bg-green-50 border-green-300 text-green-700"
                      : el.variant === "warning"
                      ? "bg-yellow-50 border-yellow-300 text-yellow-700"
                      : el.variant === "error"
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-blue-50 border-blue-300 text-blue-700"
              }`}
          >
              <div className="font-semibold">
                  {el.title}
              </div>

              <div className="text-sm mt-1">
                  {el.message}
              </div>

              {el.closable && (
                  <div className="mt-2 text-xs">
                      ✕ Close
                  </div>
              )}
          </div>
      );

      case "loader":
        return (
          <div className="w-full flex justify-center">
            <div className="px-6 py-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 text-sm font-medium">
              ⟳ Loader
            </div>
          </div>
        );
    
    case "toggle": {
      const typography = getResponsiveTypographyStyles(el, device);
      return (
        <div className="w-full flex justify-center">
          <div className="px-6 py-3 rounded-md border-2 border-dashed border-gray-300 bg-gray-50 text-gray-600 flex items-center gap-2">
            <span className="text-base">⏻</span>
            <span className={`${getResponsiveTypographyClasses({ fontSize: el.fontSize, fontWeight: el.fontWeight, lineHeight: el.lineHeight }, device)} ${el.align === 'center' ? 'text-center' : el.align === 'right' ? 'text-right' : 'text-left'}`}>{el.label}</span>
          </div>
        </div>
      );
    }

    case 'divider':
      return <hr className="w-full" style={{ borderColor: el.color, borderTopWidth: el.thickness, borderTopStyle: 'solid', margin: 0 }} />;

    case 'navbar':
      return <NavbarPreview el={el} device={device} />;

    case 'hero':
      return <HeroPreview el={el} device={device} />;

    case 'formgroup':
      return (
        <div className="w-full rounded-xl border border-gray-200 p-4 flex flex-col gap-3 bg-white">
          <p className={`font-semibold ${getResponsiveTypographyClasses({ fontSize: { desktop: 14, tablet: 13, mobile: 12 }, fontWeight: { desktop: '600', tablet: '600', mobile: '600' }, lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.4 } }, device)} text-gray-900`}>{el.title}</p>
          {normalizeFormFields(el.fields).map((field, index) => renderFormFieldPreview(field, index))}
          <button className={`mt-1 px-4 py-2 rounded-md ${getResponsiveTypographyClasses({ fontSize: { desktop: 14, tablet: 13, mobile: 12 }, fontWeight: { desktop: 'medium', tablet: 'medium', mobile: 'medium' }, lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.4 } }, device)} bg-blue-600 text-white self-start`} style={{ pointerEvents: 'none' }}>
            {el.buttonLabel}
          </button>
        </div>
      );

    case 'modal': {
      return (
        <div className="w-full flex flex-col gap-2 p-2 border-2 rounded-lg">
          {el.modalButtonType === 'link' ? (
            <button
              disabled
              className="text-sm font-medium underline self-start cursor-default"
              style={{ background: 'none', color: el.modalButtonColor || '#3b82f6',textDecoration: 'none', border: 'none', padding: 0 }}
            >
              {el.modalButtonLabel}
            </button>
          ) : (
            <button 
              disabled
              className="text-sm font-medium self-start px-3 py-1.5 rounded-md cursor-default"
              style={{ background: el.modalButtonBg || '#3b82f6', color: el.modalButtonColor || '#ffffff', border: 'none' }}
            >
              {el.modalButtonLabel}
            </button>
          )}
        <div 
          className="mt-4 border-t pt-4"
          style={{ background: el.modalContentBg || '#ffffff' }}
        >
          <p className={`${getResponsiveTypographyClasses({ fontSize: el.modalTitleFontSize || { desktop: 16, tablet: 15, mobile: 14 }, fontWeight: el.modalTitleFontWeight || { desktop: '600', tablet: '600', mobile: '600' }, lineHeight: el.modalTitleLineHeight || { desktop: 1.2, tablet: 1.3, mobile: 1.4 } }, device)}`}>{el.modalContentTitle}</p>
          <RowsCanvas
            rows={el.rows || []}
            hops={[el.id]}
            device={device}
            nested
          />
        </div>
        </div>
      );
    }

case 'popover': {
  return (
    <div className="w-full flex flex-col gap-3 p-2 border rounded-lg">
      {el.popoverButtonType === 'link' ? (
        <button
          disabled
          className="text-sm font-medium self-start"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            color: el.popoverButtonColor || '#2563eb',
            textDecoration: 'underline',
            cursor: 'default',
          }}
        >
          {el.popoverButtonLabel}
        </button>
      ) : (
        <button
          disabled
          className="px-3 py-2 rounded-md text-sm font-medium self-start"
          style={{
            background: el.popoverButtonBg || '#2563eb',
            color: el.popoverButtonColor || '#ffffff',
            border: 'none',
            cursor: 'default',
          }}
        >
          {el.popoverButtonLabel}
        </button>
      )}

      <div
        className="border rounded-md p-3 bg-white shadow-sm"
        style={{ width: el.popoverContentWidth || '250px' }}
      >
        <p className={`mb-2 ${getResponsiveTypographyClasses({ fontSize: el.popoverTitleFontSize || { desktop: 14, tablet: 13, mobile: 12 }, fontWeight: el.popoverTitleFontWeight || { desktop: 'medium', tablet: 'medium', mobile: 'medium' }, lineHeight: el.popoverTitleLineHeight || { desktop: 1.2, tablet: 1.3, mobile: 1.4 } }, device)}`}>
          {el.popoverContentTitle}
        </p>

        <p className={`${getResponsiveTypographyClasses({ fontSize: el.popoverTextFontSize || { desktop: 12, tablet: 11, mobile: 10 }, fontWeight: el.popoverTextFontWeight || { desktop: 'normal', tablet: 'normal', mobile: 'normal' }, lineHeight: el.popoverTextLineHeight || { desktop: 1.4, tablet: 1.5, mobile: 1.6 } }, device)} text-gray-600`}>
          {el.popoverContentText}
        </p>
      </div>
    </div>
  );
}

    default:
      return <div className="text-xs text-gray-400">Unknown: {el.type}</div>;
  }
}
