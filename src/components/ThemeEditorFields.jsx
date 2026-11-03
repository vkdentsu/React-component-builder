import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import GOOGLE_FONTS from '../utils/googleFonts';
import FontUpload from './FontUpload';
import { nanoid } from '../utils/nanoid';

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none';
const labelClass = 'block space-y-1 text-[11px] font-medium text-slate-600';
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const slug = (value) => value.trim().replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
const colorKeyFromName = (name) => {
  const words = String(name || '').match(/[a-zA-Z0-9]+/g) || [];
  return words
    .map((word, index) => index === 0
      ? word.charAt(0).toLowerCase() + word.slice(1)
      : word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
};

function DimensionInput({ label, value, units, onChange, slider = false }) {
  const match = String(value ?? '').match(/^(-?(?:\d+\.?\d*|\.\d+))\s*(px|rem|em|%)?$/);
  const amount = match?.[1] || '';
  const unit = match?.[2] || units[0];
  const numeric = Number(amount);
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <div className="flex gap-2">
        <input type="number" step="any" value={amount} onChange={(event) => onChange(event.target.value ? `${event.target.value}${unit}` : '')} className={fieldClass} />
        <select aria-label={`${label} unit`} value={unit} onChange={(event) => onChange(amount ? `${amount}${event.target.value}` : '')} className={`${fieldClass} w-20 shrink-0`}>
          {units.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>
      {slider && <input aria-label={`${label} slider`} type="range" min="0" max="64" step="1" value={Number.isFinite(numeric) ? Math.min(64, Math.max(0, numeric)) : 0} onChange={(event) => onChange(`${event.target.value}${unit}`)} className="w-full accent-blue-600" />}
    </label>
  );
}

function ColorInput({ label, value, onChange }) {
  return (
    <label className={labelClass}>
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={`${label} color picker`} value={HEX_COLOR.test(value || '') ? value : '#000000'} onChange={(event) => onChange(event.target.value)} className="h-9 w-10 cursor-pointer rounded border border-slate-200 p-1" />
        <input value={value || ''} maxLength={7} aria-label={`${label} HEX value`} onChange={(event) => onChange(event.target.value)} className={`${fieldClass} font-mono`} />
      </div>
    </label>
  );
}

function ColorPalette({ tokens, onChange }) {
  const [customName, setCustomName] = useState('');
  const colors = [
    ['primary', 'Primary Brand Color', 'Main color for buttons and highlights.'],
    ['secondary', 'Secondary Accent Color', 'Supporting accent for secondary elements.'],
    ['background', 'Page Background', 'Main canvas and page background.'],
    ['surface', 'Card & Surface', 'Background for cards and panels.'],
    ['text', 'Main Text', 'Primary color for text.'],
    ['textMuted', 'Muted Text', 'Color for secondary text and hints.'],
    ['border', 'Borders & Lines', 'Color for outlines and dividers.'],
  ];
  const updateColor = (key, value) => onChange({ ...tokens, colors: { ...tokens.colors, [key]: value } });
  const standardColorKeys = new Set(colors.map(([key]) => key));
  const customColors = Object.entries(tokens.colors)
    .filter(([key]) => !standardColorKeys.has(key))
    .map(([key, value]) => ({ key, value }));
  return (
    <div className="space-y-4">
      <header><h3 className="text-sm font-semibold text-slate-900">Color Palette</h3><p className="text-xs text-slate-500">Customize theme colors and additional reusable color tokens.</p></header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {colors.map(([key, label, description]) => <div key={key} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"><ColorInput label={label} value={tokens.colors[key]} onChange={(value) => updateColor(key, value)} /><p className="mt-1 text-[10px] text-slate-500">{description}</p></div>)}
      </div>
      <section className="space-y-3 rounded-xl border border-slate-200 p-4">
        <div><h4 className="text-xs font-semibold text-slate-800">Custom Colors</h4><p className="text-[11px] text-slate-500">Add named colors in addition to the theme palette.</p></div>
        {customColors.map((color) => <div key={color.key} className="flex items-end gap-2 rounded-lg bg-slate-50 p-2"><label className={`${labelClass} min-w-0 flex-1`}><span>Color name</span><input value={color.key} onChange={(event) => { const nextKey = colorKeyFromName(event.target.value); if (!nextKey || (nextKey !== color.key && Object.hasOwn(tokens.colors, nextKey))) return; const nextColors = { ...tokens.colors }; delete nextColors[color.key]; nextColors[nextKey] = color.value; onChange({ ...tokens, colors: nextColors }); }} className={fieldClass} /></label><div className="min-w-0 flex-[1.4]"><ColorInput label="Color value" value={color.value} onChange={(value) => updateColor(color.key, value)} /></div><button type="button" aria-label={`Remove ${color.key}`} onClick={() => { if (window.confirm(`Remove custom color "${color.key}"?`)) { const nextColors = { ...tokens.colors }; delete nextColors[color.key]; onChange({ ...tokens, colors: nextColors }); } }} className="mb-1 rounded p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button></div>)}
        <div className="flex gap-2"><input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="New color name" className={fieldClass} /><button type="button" onClick={() => { const key = colorKeyFromName(customName); if (key && !Object.hasOwn(tokens.colors, key)) { onChange({ ...tokens, colors: { ...tokens.colors, [key]: '#2563eb' } }); setCustomName(''); } }} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"><Plus size={13} /> Add Color</button></div>
      </section>
    </div>
  );
}

function TypographyEditor({ tokens, onChange, customFonts, onFontUpload }) {
  const typography = tokens.typography;
  const update = (patch) => onChange({ ...tokens, typography: { ...typography, ...patch } });
  const fonts = [...GOOGLE_FONTS, ...(customFonts || []).map((font) => ({ label: font.name, value: font.name }))];
  const fontRoles = ['primary', 'secondary', 'heading', 'body', 'button', 'link'];
  const textStyles = [
    ['h1', 'Heading 1'], ['h2', 'Heading 2'], ['h3', 'Heading 3'], ['h4', 'Heading 4'],
    ['h5', 'Heading 5'], ['h6', 'Heading 6'], ['paragraph', 'Paragraph'],
    ['primaryButton', 'Primary Button'], ['secondaryButton', 'Secondary Button'], ['link', 'Link'],
  ];
  const weights = [[100, 'Thin'], [300, 'Light'], [400, 'Regular'], [500, 'Medium'], [600, 'Semi Bold'], [700, 'Bold'], [800, 'Extra Bold']];
  const updateFonts = (role, value) => update({
    fonts: { ...typography.fonts, [role]: value },
    ...(role === 'primary' ? { fontFamily: value } : {}),
  });
  const updateTextStyle = (key, patch) => update({
    textStyles: {
      ...typography.textStyles,
      [key]: { ...typography.textStyles[key], ...patch },
    },
  });
  return (
    <div className="space-y-4">
      <header><h3 className="text-sm font-semibold text-slate-900">Fonts & Text</h3><p className="text-xs text-slate-500">Set font roles, type scale, and text treatments.</p></header>
      <details open className="rounded-xl border border-slate-200"><summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-800">Font Family</summary><div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2">{fontRoles.map((role) => <label key={role} className={labelClass}><span>{role[0].toUpperCase()}{role.slice(1)} Font</span><select value={typography.fonts?.[role] || typography.fontFamily} onChange={(event) => updateFonts(role, event.target.value)} className={fieldClass}>{fonts.map((font) => <option key={`${role}-${font.value}`} value={font.value}>{font.label}</option>)}</select></label>)}<div className="sm:col-span-2"><FontUpload onFontUpload={onFontUpload} /></div></div></details>
      <details open className="rounded-xl border border-slate-200"><summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-slate-800">Font Size & Text Styles</summary><div className="space-y-3 border-t border-slate-100 p-4">{textStyles.map(([key, label]) => {
        const style = typography.textStyles[key];
        return <details key={key} className="rounded-lg border border-slate-200 bg-slate-50/50"><summary className="cursor-pointer px-3 py-2.5 text-xs font-semibold text-slate-700">{label}<span className="ml-2 font-normal text-slate-500">{typography.sizes[key] || '16px'}</span></summary><div className="grid gap-3 border-t border-slate-100 p-3 sm:grid-cols-2"><DimensionInput label="Font Size" value={typography.sizes[key] || '16px'} units={['px', 'rem', 'em']} onChange={(value) => update({ sizes: { ...typography.sizes, [key]: value } })} /><label className={labelClass}><span>Line Height</span><input type="number" min="0.5" max="4" step="0.1" value={style.lineHeight} onChange={(event) => updateTextStyle(key, { lineHeight: Number(event.target.value) })} className={fieldClass} /></label><DimensionInput label="Letter Spacing" value={style.letterSpacing} units={['px', 'rem', 'em']} onChange={(value) => updateTextStyle(key, { letterSpacing: value })} /><label className={labelClass}><span>Font Weight</span><select value={style.fontWeight} onChange={(event) => updateTextStyle(key, { fontWeight: Number(event.target.value) })} className={fieldClass}>{weights.map(([value, name]) => <option key={value} value={value}>{name} ({value})</option>)}</select></label><label className={`${labelClass} sm:col-span-2`}><span>Font Style</span><select value={style.fontStyle} onChange={(event) => updateTextStyle(key, { fontStyle: event.target.value })} className={fieldClass}><option value="normal">Normal</option><option value="italic">Italic</option><option value="oblique">Oblique</option></select></label></div></details>;
      })}</div></details>
    </div>
  );
}

const SPACING_FIELDS = [
  ['none', 'None'], ['base', 'Base Spacing'], ['xs', 'Extra Small'], ['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra Large'],
  ['2xl', 'Extra Extra Large'], ['containerPadding', 'Container Padding'], ['section', 'Section Spacing'], ['componentGap', 'Component Gap'], ['gridGap', 'Grid Gap'],
];

function SpacingEditor({ tokens, onChange }) {
  const [customName, setCustomName] = useState('');
  const [customRadiusName, setCustomRadiusName] = useState('');
  const spacingKeys = Object.keys(tokens.spacing);
  const knownSpacing = new Set(SPACING_FIELDS.map(([key]) => key));
  const customSpacing = spacingKeys.filter((key) => !knownSpacing.has(key));
  const addSpacing = () => {
    const key = slug(customName);
    if (!key || Object.hasOwn(tokens.spacing, key)) return;
    onChange({ ...tokens, spacing: { ...tokens.spacing, [key]: '16px' } });
    setCustomName('');
  };
  const removeSpacing = (key) => {
    if (!window.confirm(`Remove spacing "${key}"?`)) return;
    const spacing = { ...tokens.spacing };
    delete spacing[key];
    onChange({ ...tokens, spacing });
  };
  const radiusLabels = { none: 'None', xs: 'Extra Small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra Large', full: 'Full / Pill' };
  const customRadii = Object.keys(tokens.borderRadius).filter((key) => !Object.hasOwn(radiusLabels, key));
  const addRadius = () => {
    const key = slug(customRadiusName);
    if (!key || Object.hasOwn(tokens.borderRadius, key)) return;
    onChange({ ...tokens, borderRadius: { ...tokens.borderRadius, [key]: '12px' } });
    setCustomRadiusName('');
  };
  const removeRadius = (key) => {
    if (!window.confirm(`Remove radius "${key}"?`)) return;
    const borderRadius = { ...tokens.borderRadius };
    delete borderRadius[key];
    onChange({ ...tokens, borderRadius });
  };
  const updateSpacing = (key, value) => onChange({ ...tokens, spacing: { ...tokens.spacing, [key]: value } });
  const updateRadius = (key, value) => onChange({ ...tokens, borderRadius: { ...tokens.borderRadius, [key]: value } });
  return <div className="space-y-5">
    <header><h3 className="text-sm font-semibold text-slate-900">Spacing & Radius</h3><p className="text-xs text-slate-500">Set reusable layout, component spacing, and corner radius values.</p></header>
    <section className="space-y-3"><h4 className="text-xs font-semibold text-slate-800">Spacing</h4><div className="grid gap-3 sm:grid-cols-2">{[...SPACING_FIELDS, ...customSpacing.map((key) => [key, key])].map(([key, label]) => <div key={key} className="relative rounded-xl border border-slate-200 p-3"><DimensionInput label={label} value={tokens.spacing[key]} units={['px', 'rem', '%']} slider onChange={(value) => updateSpacing(key, value)} />{customSpacing.includes(key) && <button type="button" aria-label={`Remove ${key} spacing`} onClick={() => removeSpacing(key)} className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button>}</div>)}</div><div className="flex gap-2"><input value={customName} onChange={(event) => setCustomName(event.target.value)} placeholder="Custom spacing name" className={fieldClass} /><button type="button" onClick={addSpacing} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"><Plus size={13} /> Add Spacing</button></div></section>
    <section className="space-y-3 border-t border-slate-100 pt-4"><h4 className="text-xs font-semibold text-slate-800">Corner Radius</h4><div className="grid gap-3 sm:grid-cols-2">{[...Object.keys(radiusLabels), ...customRadii].map((key) => <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"><span className="h-10 w-10 shrink-0 border-2 border-blue-500 bg-blue-100" style={{ borderRadius: tokens.borderRadius[key] }} /><div className="min-w-0 flex-1"><span className="mb-1 block text-[11px] font-semibold text-slate-700">{radiusLabels[key] || key}</span><input value={tokens.borderRadius[key]} onChange={(event) => updateRadius(key, event.target.value)} className={`${fieldClass} font-mono`} /></div>{customRadii.includes(key) && <button type="button" aria-label={`Remove ${key} radius`} onClick={() => removeRadius(key)} className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={13} /></button>}</div>)}</div><div className="flex gap-2"><input value={customRadiusName} onChange={(event) => setCustomRadiusName(event.target.value)} placeholder="Custom radius name" className={fieldClass} /><button type="button" onClick={addRadius} className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700"><Plus size={13} /> Add Radius</button></div></section>
  </div>;
}

function OptionRow({ option, onChange, onDelete }) {
  const setType = (valueType) => onChange({
    ...option,
    valueType,
    value: valueType === 'number' ? 0 : valueType === 'color' ? '#2563eb' : '',
  });
  return (
    <div className="grid gap-2 rounded-lg border border-slate-200 bg-white p-2 sm:grid-cols-[minmax(115px,.8fr)_minmax(100px,.8fr)_minmax(150px,1.3fr)_32px] sm:items-end">
      <label className={labelClass}><span>Value Type</span><select value={option.valueType} onChange={(event) => setType(event.target.value)} className={fieldClass}><option value="text">Text</option><option value="number">Number</option><option value="color">Select Color</option></select></label>
      <label className={labelClass}><span>Name</span><input value={option.name} onChange={(event) => onChange({ ...option, name: event.target.value })} placeholder="e.g. primaryColor" className={fieldClass} /></label>
      <label className={labelClass}><span>Value</span>{option.valueType === 'color' ? <div className="flex gap-2"><input type="color" aria-label={`${option.name} color picker`} value={HEX_COLOR.test(String(option.value)) ? option.value : '#000000'} onChange={(event) => onChange({ ...option, value: event.target.value })} className="h-9 w-10 shrink-0 rounded border border-slate-200 p-1" /><input value={String(option.value ?? '')} onChange={(event) => onChange({ ...option, value: event.target.value })} className={`${fieldClass} font-mono`} /></div> : <input type={option.valueType === 'number' ? 'number' : 'text'} step={option.valueType === 'number' ? 'any' : undefined} value={option.value ?? ''} onChange={(event) => onChange({ ...option, value: option.valueType === 'number' ? event.target.value === '' ? '' : Number(event.target.value) : event.target.value })} placeholder={option.valueType === 'number' ? '0' : 'Enter a value'} className={fieldClass} />}</label>
      <button type="button" aria-label={`Delete option ${option.name || ''}`} title="Delete option" onClick={() => { if (window.confirm(`Delete option "${option.name || 'unnamed'}"?`)) onDelete(); }} className="mb-1 flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
    </div>
  );
}

function ConfigGroupItem({ group, groups, onChange }) {
  const updateGroup = (patch) => onChange(groups.map((item) => item.id === group.id ? { ...item, ...patch } : item));
  const addOption = () => updateGroup({ options: [...group.options, { id: nanoid(), name: '', valueType: 'text', value: '' }] });
  const updateOption = (option) => updateGroup({ options: group.options.map((item) => item.id === option.id ? option : item) });
  const deleteOption = (optionId) => updateGroup({ options: group.options.filter((item) => item.id !== optionId) });
  return (
    <details open className="rounded-xl border border-slate-200 bg-slate-50/50">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-3">
        <input aria-label="Group name" value={group.name} onClick={(event) => event.stopPropagation()} onChange={(event) => updateGroup({ name: event.target.value })} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-semibold text-slate-800 focus:outline-none" />
        <span className="text-[10px] text-slate-400">{group.options.length} options</span>
        <button type="button" aria-label={`Delete group ${group.name}`} title="Delete group" onClick={(event) => { event.preventDefault(); if (window.confirm(`Delete group "${group.name}" and all its options?`)) onChange(groups.filter((item) => item.id !== group.id)); }} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
      </summary>
      <div className="space-y-2 border-t border-slate-200 p-3">
        {group.options.map((option) => <OptionRow key={option.id} option={option} onChange={updateOption} onDelete={() => deleteOption(option.id)} />)}
        <button type="button" onClick={addOption} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"><Plus size={14} /> Add Option</button>
      </div>
    </details>
  );
}

function ConfigGroupsEditor({ tokens, onChange }) {
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupError, setGroupError] = useState('');
  const groups = tokens.configGroups || [];
  const createGroup = () => {
    const name = groupName.trim();
    if (!name) { setGroupError('Group name is required.'); return; }
    if (groups.some((group) => group.name.trim().toLowerCase() === name.toLowerCase())) { setGroupError('A group with this name already exists.'); return; }
    onChange({ ...tokens, configGroups: [...groups, { id: nanoid(), name, options: [] }] });
    setGroupName('');
    setGroupError('');
    setCreating(false);
  };
  return (
    <div className="space-y-4">
      <header><h3 className="text-sm font-semibold text-slate-900">Configuration Groups</h3><p className="text-xs text-slate-500">Create custom configuration groups and add reusable styling values.</p></header>
      {creating ? <div className="flex flex-wrap gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3"><input autoFocus value={groupName} onChange={(event) => { setGroupName(event.target.value); setGroupError(''); }} onKeyDown={(event) => { if (event.key === 'Enter') createGroup(); if (event.key === 'Escape') { setCreating(false); setGroupError(''); } }} placeholder="Group name (e.g. Colors)" className={`${fieldClass} min-w-[180px] flex-1`} /><button type="button" onClick={createGroup} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Create Group</button><button type="button" onClick={() => { setCreating(false); setGroupName(''); setGroupError(''); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-white">Cancel</button>{groupError && <p role="alert" className="w-full text-xs text-rose-600">{groupError}</p>}</div> : <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={14} /> Create Group</button>}
      {groups.length ? <div className="space-y-3">{groups.map((group) => <ConfigGroupItem key={group.id} group={group} groups={groups} onChange={(configGroups) => onChange({ ...tokens, configGroups })} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center"><p className="text-sm font-medium text-slate-700">No configuration groups created yet.</p><p className="mt-1 text-xs text-slate-500">Click Create Group to add your first configuration group.</p></div>}
    </div>
  );
}

function ConfigStyleItem({ group, groups, onChange }) {
  const updateGroup = (patch) => onChange(groups.map((item) => item.id === group.id ? { ...item, ...patch } : item));
  const addProperty = () => updateGroup({ options: [...group.options, { id: nanoid(), property: 'color', value: '#000000' }] });
  const updateOption = (option) => updateGroup({ options: group.options.map((item) => item.id === option.id ? option : item) });
  const deleteOption = (optionId) => updateGroup({ options: group.options.filter((item) => item.id !== optionId) });
  return <details open className="rounded-xl border border-slate-200 bg-slate-50/50">
    <summary className="flex cursor-pointer list-none items-center gap-2 p-3">
      <input aria-label="Style group name" value={group.name} onClick={(event) => event.stopPropagation()} onChange={(event) => updateGroup({ name: event.target.value })} className="min-w-0 flex-1 border-0 bg-transparent p-0 text-xs font-semibold text-slate-800 focus:outline-none" />
      <span className="text-[10px] text-slate-400">{group.options.length} styles</span>
      <button type="button" aria-label={`Delete style group ${group.name}`} title="Delete style group" onClick={(event) => { event.preventDefault(); if (window.confirm(`Delete style group "${group.name}"?`)) onChange(groups.filter((item) => item.id !== group.id)); }} className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
    </summary>
    <div className="space-y-3 border-t border-slate-200 p-3">
      <div className="grid gap-2 sm:grid-cols-[110px_minmax(0,1fr)]">
        <label className={labelClass}><span>Selector type</span><select value={group.selectorType} onChange={(event) => updateGroup({ selectorType: event.target.value })} className={fieldClass}><option value="class">Class</option><option value="id">ID</option></select></label>
        <label className={labelClass}><span>{group.selectorType === 'id' ? 'ID name' : 'Class name'}</span><div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{group.selectorType === 'id' ? '#' : '.'}</span><input value={group.selector} onChange={(event) => updateGroup({ selector: event.target.value.replace(/^[.#]/, '') })} placeholder="primary-heading" className={fieldClass} /></div></label>
      </div>
      {group.options.map((option) => <div key={option.id} className="grid gap-2 sm:grid-cols-[minmax(100px,.8fr)_minmax(120px,1fr)_32px] sm:items-end">
        <label className={labelClass}><span>CSS property</span><input value={option.property} onChange={(event) => updateOption({ ...option, property: event.target.value.toLowerCase() })} placeholder="font-size" className={`${fieldClass} font-mono`} /></label>
        <label className={labelClass}><span>Value</span><input value={option.value} onChange={(event) => updateOption({ ...option, value: event.target.value })} placeholder="16px or #000000" className={fieldClass} /></label>
        <button type="button" aria-label={`Delete ${option.property || 'style'} property`} title="Delete property" onClick={() => { if (window.confirm(`Delete the "${option.property || 'unnamed'}" style?`)) deleteOption(option.id); }} className="mb-1 flex h-8 w-8 items-center justify-center justify-self-end rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={14} /></button>
      </div>)}
      <button type="button" onClick={addProperty} className="inline-flex items-center gap-1 rounded-lg border border-dashed border-blue-300 bg-white px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-50"><Plus size={14} /> Add Style</button>
    </div>
  </details>;
}

function ConfigStylesEditor({ tokens, onChange }) {
  const [creating, setCreating] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectorType, setSelectorType] = useState('class');
  const [selector, setSelector] = useState('');
  const [groupError, setGroupError] = useState('');
  const groups = tokens.configStyles || [];
  const createGroup = () => {
    const name = groupName.trim();
    const target = selector.trim().replace(/^[.#]/, '');
    if (!name || !target) { setGroupError('Enter both a style group name and a class or ID name.'); return; }
    if (!/^[A-Za-z_][A-Za-z0-9_-]*$/.test(target)) { setGroupError('Class and ID names must start with a letter or underscore and contain only letters, numbers, underscores, or hyphens.'); return; }
    if (groups.some((group) => group.name.trim().toLowerCase() === name.toLowerCase())) { setGroupError('A style group with this name already exists.'); return; }
    if (groups.some((group) => group.selectorType === selectorType && group.selector === target)) { setGroupError('A style group for this selector already exists.'); return; }
    onChange({ ...tokens, configStyles: [...groups, { id: nanoid(), name, selectorType, selector: target, options: [] }] });
    setGroupName('');
    setSelector('');
    setGroupError('');
    setCreating(false);
  };
  return <div className="space-y-4">
    <header><h3 className="text-sm font-semibold text-slate-900">Config Styles</h3><p className="text-xs text-slate-500">Create reusable CSS rules for class or ID selectors.</p></header>
    {creating ? <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-3">
      <div className="grid gap-2 sm:grid-cols-2"><label className={labelClass}><span>Style group name</span><input autoFocus value={groupName} onChange={(event) => { setGroupName(event.target.value); setGroupError(''); }} placeholder="Primary Heading" className={fieldClass} /></label><label className={labelClass}><span>Selector type</span><select value={selectorType} onChange={(event) => setSelectorType(event.target.value)} className={fieldClass}><option value="class">Class</option><option value="id">ID</option></select></label><label className={`${labelClass} sm:col-span-2`}><span>{selectorType === 'id' ? 'ID name' : 'Class name'}</span><div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{selectorType === 'id' ? '#' : '.'}</span><input value={selector} onChange={(event) => { setSelector(event.target.value.replace(/^[.#]/, '')); setGroupError(''); }} placeholder="primary-heading" className={fieldClass} /></div></label></div>
      <div className="flex flex-wrap gap-2"><button type="button" onClick={createGroup} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">Create Style Group</button><button type="button" onClick={() => { setCreating(false); setGroupName(''); setSelector(''); setGroupError(''); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-white">Cancel</button></div>
      {groupError && <p role="alert" className="text-xs text-rose-600">{groupError}</p>}
    </div> : <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={14} /> Create Style Group</button>}
    {groups.length ? <div className="space-y-3">{groups.map((group) => <ConfigStyleItem key={group.id} group={group} groups={groups} onChange={(configStyles) => onChange({ ...tokens, configStyles })} />)}</div> : <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center"><p className="text-sm font-medium text-slate-700">No style groups created yet.</p><p className="mt-1 text-xs text-slate-500">Create a group to add CSS properties for a class or ID.</p></div>}
  </div>;
}

export default function ThemeEditorFields({ activeTab, tokens, onChange, customFonts, onFontUpload }) {
  if (activeTab === 'palette') return <ColorPalette tokens={tokens} onChange={onChange} />;
  if (activeTab === 'typography') return <TypographyEditor tokens={tokens} onChange={onChange} customFonts={customFonts} onFontUpload={onFontUpload} />;
  if (activeTab === 'spacing') return <SpacingEditor tokens={tokens} onChange={onChange} />;
  if (activeTab === 'config') return <ConfigGroupsEditor tokens={tokens} onChange={onChange} />;
  return <ConfigStylesEditor tokens={tokens} onChange={onChange} />;
}
