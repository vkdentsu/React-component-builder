function size(typography, key, fallback) {
  return typography.sizes[key] || typography.sizes[fallback] || '14px';
}

function textStyle(typography, key, role) {
  const settings = typography.textStyles?.[key] || {};
  const family = typography.fonts?.[role] || typography.fontFamily || 'Inter';
  return {
    fontFamily: `'${family}', sans-serif`,
    fontSize: size(typography, key, key === 'paragraph' ? 'bodyMedium' : 'button'),
    fontWeight: settings.fontWeight || 400,
    lineHeight: settings.lineHeight || typography.lineHeight,
    letterSpacing: settings.letterSpacing || typography.letterSpacing,
    fontStyle: settings.fontStyle || 'normal',
  };
}

function styleObject(options) {
  return options.reduce((result, option) => {
    if (!/^(?:--[a-z][a-z0-9_-]*|-?[a-z][a-z0-9-]*)$/i.test(option.property) || !String(option.value).trim() || /[;{}<>\\\r\n]/.test(String(option.value))) return result;
    const key = option.property.startsWith('--')
      ? option.property
      : option.property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    result[key] = option.value;
    return result;
  }, {});
}

function styleRule(group) {
  const selector = `${group.selectorType === 'id' ? '#' : '.'}${group.selector}`;
  const declarations = group.options.filter((option) =>
    /^(?:--[a-z][a-z0-9_-]*|-?[a-z][a-z0-9-]*)$/i.test(option.property)
    && String(option.value).trim()
    && !/[;{}<>\\\r\n]/.test(String(option.value)));
  return `${selector} {\n${declarations.map((option) => `  ${option.property}: ${option.value};`).join('\n')}\n}`;
}

export default function ThemePreview({ tokens }) {
  const { colors, typography, spacing, borderRadius } = tokens;
  const fontFamily = typography.fonts?.primary || typography.fontFamily || 'Inter';
  const configStyles = tokens.configStyles || [];
  return (
    <aside className="flex min-h-0 min-w-0 flex-col overflow-y-auto border-t border-slate-200 bg-slate-50/70 lg:w-[40%] lg:border-l lg:border-t-0">
      <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-4">
        <h3 className="text-sm font-semibold text-slate-900">Theme Preview</h3>
        <p className="mt-0.5 text-xs text-slate-500">Updates as you edit your configuration.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div
          className="space-y-4 rounded-xl border p-4 transition-colors"
          style={{
            backgroundColor: colors.background,
            borderColor: colors.border,
            color: colors.text,
            fontFamily: `'${fontFamily}', sans-serif`,
            fontSize: size(typography, 'paragraph', 'bodyMedium'),
            lineHeight: typography.lineHeight,
            letterSpacing: typography.letterSpacing,
          }}
        >
          <section>
            <h1 style={textStyle(typography, 'h1', 'heading')}>A thoughtful design system</h1>
            <p className="mt-1" style={{ ...textStyle(typography, 'paragraph', 'body'), color: colors.textMuted }}>Preview headings, body copy, and controls using the active theme tokens.</p>
            <a href="#" onClick={(event) => event.preventDefault()} className="mt-2 inline-block underline" style={textStyle(typography, 'link', 'link')}>Sample link</a>
          </section>

          <article className="space-y-3 border p-4" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.md, padding: spacing.componentGap }}>
            <div className="flex items-start justify-between gap-2">
              <div><h2 style={textStyle(typography, 'h3', 'heading')}>Content Card</h2><p className="mt-1" style={{ ...textStyle(typography, 'paragraph', 'body'), color: colors.textMuted }}>A reusable surface with clear hierarchy and comfortable spacing.</p></div>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700" style={{ borderRadius: borderRadius.full }}>Active</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-3 py-2 text-white" style={{ backgroundColor: colors.primary, border: 0, borderRadius: borderRadius.md, ...textStyle(typography, 'primaryButton', 'button') }}>Primary Button</button>
              <button type="button" className="border px-3 py-2" style={{ backgroundColor: colors.background, borderColor: colors.border, color: colors.text, borderRadius: borderRadius.md, ...textStyle(typography, 'secondaryButton', 'button') }}>Secondary Button</button>
            </div>
          </article>

          <label className="block space-y-1 text-[11px] font-medium" style={{ color: colors.textMuted }}>
            Sample Input Field
            <input readOnly value="Enter a value" className="w-full border px-3 py-2 text-xs" style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.sm, color: colors.text, fontSize: size(typography, 'paragraph', 'bodySmall') }} />
          </label>

          <label className="block space-y-1 text-[11px] font-medium" style={{ color: colors.textMuted }}>
            Sample Dropdown
            <select defaultValue="Design system" className="w-full border px-3 py-2 text-xs" style={{ backgroundColor: colors.background, borderColor: colors.border, borderRadius: borderRadius.sm, color: colors.text }}>
              <option>Design system</option><option>Component library</option>
            </select>
          </label>

          <div className="flex flex-wrap gap-4 text-xs">
            <label className="inline-flex items-center gap-2"><input type="checkbox" defaultChecked style={{ accentColor: colors.primary }} /> Checkbox</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" role="switch" defaultChecked style={{ accentColor: colors.primary }} /> Toggle</label>
          </div>

          <div className="border p-3" style={{ borderColor: colors.border, borderRadius: borderRadius.lg, backgroundColor: colors.surface, padding: spacing.containerPadding }}>
            <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: colors.textMuted }}>Sample container</span>
            <div className="mt-2 h-2 rounded-full" style={{ width: spacing.md, backgroundColor: colors.primary, borderRadius: borderRadius.full }} />
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-slate-200 bg-white">
          <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-700">Palette, spacing & radius samples</summary>
          <div className="space-y-3 border-t border-slate-100 p-4">
            <div className="flex flex-wrap gap-2">{Object.entries(colors).map(([name, value]) => <span key={name} title={`${name}: ${value}`} className="h-6 w-6 rounded border border-black/10" style={{ backgroundColor: value }} />)}</div>
            <div className="space-y-1">{Object.entries(spacing).map(([name, value]) => <div key={name} className="flex items-center gap-2 text-[10px] text-slate-500"><span className="w-24">{name}</span><span className="h-2 rounded-full bg-blue-500" style={{ width: value }} /><span>{value}</span></div>)}</div>
            <div className="flex flex-wrap gap-2">{Object.entries(borderRadius).map(([name, value]) => <span key={name} title={`${name}: ${value}`} className="h-8 w-8 border-2 border-blue-500 bg-blue-100" style={{ borderRadius: value }} />)}</div>
          </div>
        </details>

        {tokens.configGroups.length > 0 && <section className="mt-4 space-y-2"><h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Custom configuration</h4>{tokens.configGroups.map((group) => <details key={group.id} className="rounded-lg border border-slate-200 bg-white"><summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">{group.name}</summary><div className="space-y-2 border-t border-slate-100 p-3">{group.options.map((option) => <div key={option.id} className="flex items-center justify-between gap-2 text-[10px]"><span className="truncate text-slate-500">{option.name}</span>{option.valueType === 'color' && <span className="h-4 w-4 shrink-0 rounded border border-black/10" style={{ backgroundColor: option.value }} />}<span className="max-w-32 truncate font-mono text-slate-800">{String(option.value ?? '')}</span></div>)}</div></details>)}</section>}

        {configStyles.length > 0 && <section className="mt-4 space-y-2"><h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Custom styles</h4>{configStyles.map((group) => <details key={group.id} className="rounded-lg border border-slate-200 bg-white"><summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">{group.name} <span className="font-mono font-normal text-slate-500">{group.selectorType === 'id' ? '#' : '.'}{group.selector}</span></summary><div className="space-y-2 border-t border-slate-100 p-3"><div id={group.selectorType === 'id' ? group.selector : undefined} className={group.selectorType === 'class' ? group.selector : undefined} style={styleObject(group.options)}>Sample styled element</div><pre className="overflow-x-auto rounded bg-slate-50 p-2 text-[10px] text-slate-600">{styleRule(group)}</pre></div></details>)}</section>}
      </div>
    </aside>
  );
}
