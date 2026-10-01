import { useEffect } from 'react';
import ImageUploadField from './ImageUploadField';
import useBuilderStore from '../store/builderStore';
import { FONT_OPTIONS } from "../utils/fonts";
import FontUpload from "./FontUpload";
import { createFontData, loadCustomFont } from "../utils/fontManager";
import {
  ResponsiveFontSizeControl,
  ResponsiveFontWeightControl,
  ResponsiveLineHeightControl,
} from './ResponsiveTypographyControls';

/* ── Primitive UI controls ─────────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[11px] text-gray-500">{label}</label>
    {children}
  </div>
);

const Inp = ({ value, onChange, type = 'text', min, max, placeholder }) => (
  <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} min={min} max={max} placeholder={placeholder}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
);

const ColorPicker = ({ value, onChange }) => (
  <div className="flex items-center gap-2">
    <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
      className="w-7 h-7 rounded cursor-pointer border border-gray-200 p-0.5 shrink-0" />
    <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)}
      className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-[11px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-300" />
  </div>
);

const Sel = ({ value, onChange, options }) => (
  <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white">
    {options.map(({ value: v, label }) => <option key={v} value={v}>{label}</option>)}
  </select>
);

const Toggle = ({ checked, onChange, label }) => (
  <label className="flex items-center justify-between cursor-pointer select-none">
    <span className="text-xs text-gray-600">{label}</span>
    <button onClick={() => onChange(!checked)}
      className={`w-8 h-4 rounded-full transition-colors duration-150 relative shrink-0 ${checked ? 'bg-blue-500' : 'bg-gray-200'}`}>
      <span className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform duration-150 ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
    </button>
  </label>
);

const Textarea = ({ value, onChange, rows = 3 }) => (
  <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={rows}
    className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 resize-y bg-white" />
);

/* ── Per-type panels ─────────────────────────────────────────────────── */
function ButtonProps({ el, update }) {
  return (
    <>
      <Section title="Content">
        <Field label="Label"><Inp value={el.label} onChange={(v) => update({ label: v })} /></Field>
      </Section>
      <Section title="Style">
        <Field label="Background"><ColorPicker value={el.bg} onChange={(v) => update({ bg: v })} /></Field>
        <Field label="Text color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
        <ResponsiveFontSizeControl
          value={el.fontSize}
          onChange={(v) => update({ fontSize: v })}
          label="Font size"
          min={10}
          max={32}
        />
        <ResponsiveFontWeightControl
          value={el.fontWeight}
          onChange={(v) => update({ fontWeight: v })}
          label="Font weight"
        />
        <ResponsiveLineHeightControl
          value={el.lineHeight}
          onChange={(v) => update({ lineHeight: v })}
          label="Line height"
          min={0.8}
          max={2.5}
        />
        <Field label="Rounded">
          <Sel value={el.rounded} onChange={(v) => update({ rounded: v })}
            options={[{value:'none',label:'None'},{value:'sm',label:'Small'},{value:'md',label:'Medium'},{value:'lg',label:'Large'},{value:'full',label:'Full'}]} />
        </Field>
        <Field label="Padding">
          <Sel value={el.padding} onChange={(v) => update({ padding: v })}
            options={[{value:'sm',label:'Small'},{value:'md',label:'Medium'},{value:'lg',label:'Large'}]} />
        </Field>
      </Section>
    </>
  );
}

function TextProps({ el, update }) {
  return (
    <>
      <Section title="Content">
        <Field label="Text"><Textarea value={el.label} onChange={(v) => update({ label: v })} /></Field>
      </Section>
      <Section title="Style">
        <Field label="Color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
        <ResponsiveFontSizeControl
          value={el.fontSize}
          onChange={(v) => update({ fontSize: v })}
          label="Font size"
          min={10}
          max={72}
        />
        <ResponsiveFontWeightControl
          value={el.fontWeight}
          onChange={(v) => update({ fontWeight: v })}
          label="Font weight"
        />
        <ResponsiveLineHeightControl
          value={el.lineHeight}
          onChange={(v) => update({ lineHeight: v })}
          label="Line height"
          min={0.8}
          max={2.5}
        />
        <Field label="Align">
          <Sel value={el.align} onChange={(v) => update({ align: v })}
            options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} />
        </Field>
      </Section>
    </>
  );
}

function HeadingProps({ el, update }) {
  return (
    <>
      <Section title="Content">
        <Field label="Text"><Inp value={el.label} onChange={(v) => update({ label: v })} /></Field>
      </Section>
      <Section title="Style">
        <Field label="HTML tag">
          <Sel value={el.tag || 'h2'} onChange={(v) => update({ tag: v })}
            options={['h1','h2','h3','h4','h5','h6'].map((t) => ({ value: t, label: t.toUpperCase() }))} />
        </Field>
        <Field label="Color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
        <ResponsiveFontSizeControl
          value={el.fontSize}
          onChange={(v) => update({ fontSize: v })}
          label="Font size"
          min={14}
          max={96}
        />
        <ResponsiveFontWeightControl
          value={el.fontWeight}
          onChange={(v) => update({ fontWeight: v })}
          label="Font weight"
        />
        <ResponsiveLineHeightControl
          value={el.lineHeight}
          onChange={(v) => update({ lineHeight: v })}
          label="Line height"
          min={0.8}
          max={2.5}
        />
        <Field label="Align">
          <Sel value={el.align} onChange={(v) => update({ align: v })}
            options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} />
        </Field>
      </Section>
    </>
  );
}

function InputProps({ el, update }) {
  return (
    <Section title="Content">
      <Field label="Label"><Inp value={el.label} onChange={(v) => update({ label: v })} /></Field>
      <Field label="Placeholder"><Inp value={el.placeholder} onChange={(v) => update({ placeholder: v })} /></Field>
      <Field label="Input type">
        <Sel value={el.type} onChange={(v) => update({ type: v })}
          options={[{value:'text',label:'Text'},{value:'email',label:'Email'},{value:'number',label:'Number'},{value:'password',label:'Password'},{value:'url',label:'URL'}]} />
      </Field>
    </Section>
  );
}

function RadioProps({ el, update }) {
    return (
        <>
            <Section title="Radio">

                <Field label="Label">
                    <Inp
                        value={el.label}
                        onChange={(v) =>
                            update({ label: v })
                        }
                    />
                </Field>

                <Field label="Group Name">
                    <Inp
                        value={el.group}
                        onChange={(v) =>
                            update({ group: v })
                        }
                    />
                </Field>

                <Field label="Value">
                    <Inp
                        value={el.value}
                        onChange={(v) =>
                            update({ value: v })
                        }
                    />
                </Field>

                <Field label="Color">
                    <ColorPicker
                        value={el.color}
                        onChange={(v) =>
                            update({ color: v })
                        }
                    />
                </Field>

                <Field label="Selected">
                    <input
                        type="checkbox"
                        checked={el.checked}
                        onChange={(e) =>
                            update({
                                checked: e.target.checked,
                            })
                        }
                    />
                </Field>

                <ResponsiveFontSizeControl
                  value={el.fontSize}
                  onChange={(v) => update({ fontSize: v })}
                  label="Font size"
                  min={10}
                  max={48}
                />

                <ResponsiveFontWeightControl
                  value={el.fontWeight}
                  onChange={(v) => update({ fontWeight: v })}
                  label="Font weight"
                />

                <ResponsiveLineHeightControl
                  value={el.lineHeight}
                  onChange={(v) => update({ lineHeight: v })}
                  label="Line height"
                  min={0.8}
                  max={2.5}
                />

                <Field label="Alignment">
                  <Sel
                    value={el.align}
                    onChange={(v) => update({ align: v })}
                    options={[
                      { value: "left", label: "Left" },
                      { value: "center", label: "Center" },
                      { value: "right", label: "Right" },
                    ]}
                  />
                </Field>

            </Section>
        </>
    );
}

function ImageProps({ el, update }) {
  return (
    <>
      <Section title="Content">
        <Field label="Image"><ImageUploadField value={el.src} onChange={(v) => update({ src: v })} placeholder="https://image.jpg" /></Field>
        <Field label="Alt text"><Inp value={el.alt} onChange={(v) => update({ alt: v })} /></Field>
      </Section>
      <Section title="Style">
        <Field label="Rounded">
          <Sel value={el.rounded} onChange={(v) => update({ rounded: v })}
            options={[{value:'none',label:'None'},{value:'sm',label:'Small'},{value:'md',label:'Medium'},{value:'lg',label:'Large'},{value:'full',label:'Circle'}]} />
        </Field>
        <Field label="Object fit">
          <Sel value={el.objectFit} onChange={(v) => update({ objectFit: v })}
            options={[{value:'cover',label:'Cover'},{value:'contain',label:'Contain'},{value:'fill',label:'Fill'}]} />
        </Field>
      </Section>
    </>
  );
}

function CardProps({ el, update }) {
  return (
    <>
      <Section title="Image">
        <Field label="Card image"><ImageUploadField value={el.image} onChange={(v) => update({ image: v })} placeholder="https://image.jpg" /></Field>
        {el.image && <Field label="Alt text"><Inp value={el.imageAlt} onChange={(v) => update({ imageAlt: v })} /></Field>}
      </Section>
      <Section title="Content">
        <Field label="Title"><Inp value={el.title} onChange={(v) => update({ title: v })} /></Field>
        <ResponsiveFontSizeControl value={el.titleFontSize} onChange={(v) => update({ titleFontSize: v })} label="Title font size" min={12} max={96} />
        <ResponsiveFontWeightControl value={el.titleFontWeight} onChange={(v) => update({ titleFontWeight: v })} label="Title font weight" />
        <ResponsiveLineHeightControl value={el.titleLineHeight} onChange={(v) => update({ titleLineHeight: v })} label="Title line height" min={0.8} max={2.5} />
        <Field label="Subtitle"><Textarea value={el.subtitle} onChange={(v) => update({ subtitle: v })} rows={2} /></Field>
        <ResponsiveFontSizeControl value={el.subtitleFontSize} onChange={(v) => update({ subtitleFontSize: v })} label="Subtitle font size" min={10} max={48} />
        <ResponsiveFontWeightControl value={el.subtitleFontWeight} onChange={(v) => update({ subtitleFontWeight: v })} label="Subtitle font weight"  />
        <ResponsiveLineHeightControl value={el.subtitleLineHeight} onChange={(v) => update({ subtitleLineHeight: v })} label="Subtitle line height" min={0.8} max={2.5} />
      </Section>
      <Section title="Call to action">
        <Field label="Button label (leave blank to hide)"><Inp value={el.ctaLabel} onChange={(v) => update({ ctaLabel: v })} placeholder="Learn more" /></Field>
        <ResponsiveFontSizeControl value={el.ctaFontSize} onChange={(v) => update({ ctaFontSize: v })} label="Button font size" min={10} max={24} />
        <ResponsiveFontWeightControl value={el.ctaFontWeight} onChange={(v) => update({ ctaFontWeight: v })} label="Button font weight" />
        <ResponsiveLineHeightControl value={el.ctaLineHeight} onChange={(v) => update({ ctaLineHeight: v })} label="Button line height" min={0.8} max={2.5} />
        {el.ctaLabel && (
          <>
            <Field label="Button background"><ColorPicker value={el.ctaBg} onChange={(v) => update({ ctaBg: v })} /></Field>
            <Field label="Button text color"><ColorPicker value={el.ctaColor} onChange={(v) => update({ ctaColor: v })} /></Field>
          </>
        )}
        <Field label="Button rounded">
          <Sel value={el.ctaRounded || 'md'} onChange={(v) => update({ ctaRounded: v })}
            options={[{value:'none',label:'None'},{value:'sm',label:'Small'},{value:'md',label:'Medium'},{value:'lg',label:'Large'},{value:'full',label:'Full'}]} />
        </Field>
        <Field label="Link URL"><Inp value={el.link} onChange={(v) => update({ link: v })} placeholder="https://... or /page" /></Field>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          The whole card links to this URL when clicked. The button (if set) is purely visual styling on top.
        </p>
      </Section>
      <Section title="Style">
        <Field label="Background"><ColorPicker value={el.bg} onChange={(v) => update({ bg: v })} /></Field>
        <Field label="Text color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
      </Section>
      <Section title="Layout">
        <Field label="Alignment">
          <Sel value={el.align || 'center'} onChange={(v) => update({ align: v })}
            options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} />
        </Field>
      </Section>
    </>
  );
}

function BadgeProps({ el, update }) {
  return (
    <>
      <Section title="Content">
        <Field label="Label"><Inp value={el.label} onChange={(v) => update({ label: v })} /></Field>
      </Section>
      <Section title="Style">
        <Field label="Background"><ColorPicker value={el.bg} onChange={(v) => update({ bg: v })} /></Field>
        <Field label="Text color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
      </Section>
    </>
  );
}

function DividerProps({ el, update }) {
  return (
    <Section title="Style">
      <Field label="Color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
      <Field label="Thickness"><Inp type="number" value={el.thickness} onChange={(v) => update({ thickness: +v })} min={1} max={8} /></Field>
    </Section>
  );
}

function NavbarProps({ el, update }) {
  return (
    <>
      <Section title="Logo">
        <Field label="Brand name"><Inp value={el.brand} onChange={(v) => update({ brand: v })} /></Field>
        <Field label="Logo image"><ImageUploadField value={el.logoUrl} onChange={(v) => update({ logoUrl: v })} placeholder="https://logo.png" /></Field>
        <Field label="Logo position">
          <Sel value={el.logoAlign || 'left'} onChange={(v) => update({ logoAlign: v })}
            options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} />
        </Field>
      </Section>
      <Section title="Navigation">
        <Field label="Links (comma separated)"><Inp value={el.links} onChange={(v) => update({ links: v })} placeholder="Home, About, Contact" /></Field>
        <Field label="Submenus (JSON)">
          <Textarea value={el.submenus} onChange={(v) => update({ submenus: v })} rows={3} />
          <p className="text-[10px] text-gray-400 leading-relaxed mt-1">
            Format: {`{"Features":"Analytics,Reports","Pricing":"Starter,Pro"}`}
          </p>
        </Field>
      </Section>
      <Section title="Style">
        <Field label="Background"><ColorPicker value={el.bg} onChange={(v) => update({ bg: v })} /></Field>
        <Field label="Text color"><ColorPicker value={el.color} onChange={(v) => update({ color: v })} /></Field>
        <ResponsiveFontSizeControl value={el.fontSize} onChange={(v) => update({ fontSize: v })} label="Text font size" min={10} max={24} />
        <ResponsiveFontWeightControl value={el.fontWeight} onChange={(v) => update({ fontWeight: v })} label="Text font weight" />
        <ResponsiveLineHeightControl value={el.lineHeight} onChange={(v) => update({ lineHeight: v })} label="Text line height" min={0.8} max={2.5} />
        <Toggle checked={el.shadow} onChange={(v) => update({ shadow: v })} label="Drop shadow" />
      </Section>
    </>
  );
}

function HeroProps({ el, update }) {
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
  return (
    <>
      <Section title="Heading">
        <Field label="Title text"><Inp value={el.title} onChange={(v) => update({ title: v })} /></Field>
        <ResponsiveFontSizeControl value={el.titleSize} onChange={(v) => update({ titleSize: v })} label="Title font size" min={16} max={96} />
        <ResponsiveFontWeightControl value={el.titleWeight} onChange={(v) => update({ titleWeight: v })} label="Title font weight" />
        <ResponsiveLineHeightControl value={el.titleLineHeight} onChange={(v) => update({ titleLineHeight: v })} label="Title line height" min={0.8} max={2.5} />
        <Field label="HTML tag">
          <Sel value={el.titleTag || 'h1'} onChange={(v) => update({ titleTag: v })}
            options={['h1','h2','h3','h4'].map((t) => ({ value: t, label: t.toUpperCase() }))} />
        </Field>
        <Field label="Title color"><ColorPicker value={el.titleColor} onChange={(v) => update({ titleColor: v })} /></Field>
      </Section>
      <Section title="Subtitle">
        <Field label="Subtitle text"><Textarea value={el.subtitle} onChange={(v) => update({ subtitle: v })} rows={2} /></Field>
        <Field label="Subtitle color"><ColorPicker value={el.subtitleColor} onChange={(v) => update({ subtitleColor: v })} /></Field>
        <ResponsiveFontSizeControl value={el.subtitleSize} onChange={(v) => update({ subtitleSize: v })} label="Subtitle font size" min={12} max={48} />
        <ResponsiveFontWeightControl value={el.subtitleFontWeight} onChange={(v) => update({ subtitleFontWeight: v })} label="Subtitle font weight" />
        <ResponsiveLineHeightControl value={el.subtitleLineHeight} onChange={(v) => update({ subtitleLineHeight: v })} label="Subtitle line height" min={0.8} max={2.5} />
      </Section>
      <Section title="CTA Button">
        <Field label="Button label"><Inp value={el.ctaLabel} onChange={(v) => update({ ctaLabel: v })} /></Field>
        <Field label="Button background"><ColorPicker value={el.ctaBg} onChange={(v) => update({ ctaBg: v })} /></Field>
        <Field label="Button text color"><ColorPicker value={el.ctaColor} onChange={(v) => update({ ctaColor: v })} /></Field>
        <ResponsiveFontSizeControl value={el.ctaSize} onChange={(v) => update({ ctaSize: v })} label="Button font size" min={11} max={24} />
        <ResponsiveFontWeightControl value={el.ctaFontWeight} onChange={(v) => update({ ctaFontWeight: v })} label="Button font weight" />
        <ResponsiveLineHeightControl value={el.ctaLineHeight} onChange={(v) => update({ ctaLineHeight: v })} label="Button line height" min={0.8} max={2.5} />
        <Field label="Button rounded">
          <Sel value={el.ctaRounded || 'md'} onChange={(v) => update({ ctaRounded: v })}
            options={[{value:'none',label:'None'},{value:'sm',label:'Small'},{value:'md',label:'Medium'},{value:'lg',label:'Large'},{value:'full',label:'Full'}]} />
        </Field>
      </Section>
      <Section title="Background">
        <Field label="Background color (fallback)"><ColorPicker value={el.bg} onChange={(v) => update({ bg: v })} /></Field>
        <Field label="🖥️ Desktop image"><ImageUploadField value={el.bgImageDesktop} onChange={(v) => update({ bgImageDesktop: v })} placeholder="https://image.jpg" /></Field>
        <Field label="📱 Tablet image"><ImageUploadField value={el.bgImageTablet} onChange={(v) => update({ bgImageTablet: v })} placeholder="Falls back to desktop" /></Field>
        <Field label="📱 Mobile image"><ImageUploadField value={el.bgImageMobile} onChange={(v) => update({ bgImageMobile: v })} placeholder="Falls back to tablet/desktop" /></Field>
        {(el.bgImageDesktop || el.bgImageTablet || el.bgImageMobile) && (
          <Field label={`Overlay opacity (${Math.round((el.bgOverlay ?? 0.3) * 100)}%)`}>
            <input type="range" min={0} max={1} step={0.05} value={el.bgOverlay ?? 0.3}
              onChange={(e) => update({ bgOverlay: +e.target.value })}
              className="w-full accent-blue-500" />
          </Field>
        )}
        <p className="text-[10px] text-gray-400 leading-relaxed">
          Switch the device preview (Desktop/Tablet/Mobile) above the canvas to see each image. Export uses a real &lt;picture&gt; tag with media queries.
        </p>
      </Section>
      <Section title="Height">
        <Field label="Height mode">
          <Sel value={el.heightMode || 'auto'} onChange={(v) => update({ heightMode: v })}
            options={[
              {value:'auto',label:'Auto (fits content)'},
              {value:'fixed',label:'Fixed (px)'},
              {value:'viewport',label:'Viewport (% of screen)'},
            ]} />
        </Field>
        {el.heightMode === 'fixed' && (
          <Field label="Min height (px)"><Inp type="number" value={el.minHeight} onChange={(v) => update({ minHeight: +v })} min={100} max={1000} /></Field>
        )}
        {el.heightMode === 'viewport' && (
          <Field label={`Viewport height (${el.viewportHeight || 60}vh)`}>
            <input type="range" min={20} max={100} step={5} value={el.viewportHeight || 60}
              onChange={(e) => update({ viewportHeight: +e.target.value })}
              className="w-full accent-blue-500" />
          </Field>
        )}
        
      <Field label="Vertical Padding">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "desktop", label: "Desktop" },
              { key: "tablet", label: "Tablet" },
              { key: "mobile", label: "Mobile" },
            ].map((device) => (
              <div key={device.key}>
                <label className="block text-[10px] text-gray-500 mb-1">
                  {device.label}
                </label>

                <Sel
                  value={verticalPadding[device.key]}
                  onChange={(v) =>
                    update({
                      verticalPadding: {
                        ...verticalPadding,
                        [device.key]: Number(v),
                      },
                    })
                  }
                  options={[0,2,4,6,8,10,12].map((n) => ({
                    value: n,
                    label: `(${n * 4}px)`,
                  }))}
                />
              </div>
            ))}
          </div>
        </Field>

        <Field label="Horizontal Padding">
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "desktop", label: "Desktop" },
              { key: "tablet", label: "Tablet" },
              { key: "mobile", label: "Mobile" },
            ].map((device) => (
              <div key={device.key}>
                <label className="block text-[10px] text-gray-500 mb-1">
                  {device.label}
                </label>

                <Sel
                  value={horizontalPadding[device.key]}
                  onChange={(v) =>
                    update({
                      horizontalPadding: {
                        ...horizontalPadding,
                        [device.key]: Number(v),
                      },
                    })
                  }
                  options={[0,2,4,6,8,10,12].map((n) => ({
                    value: n,
                    label: `(${n * 4}px)`,
                  }))}
                />
              </div>
            ))}
          </div>
        </Field>

      </Section>
      <Section title="Layout">
        <Field label="Alignment">
          <Sel value={el.align || 'center'} onChange={(v) => update({ align: v })}
            options={[{value:'left',label:'Left'},{value:'center',label:'Center'},{value:'right',label:'Right'}]} />
        </Field>
      </Section>
    </>
  );
}

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
    .map((label) => ({ label, type: 'input', placeholder: '', required: false, inputType: 'text', validationRegex: '', icon: 'none' }));
};

function FormGroupProps({ el, update }) {
  const fields = normalizeFormFields(el.fields);

  const updateField = (index, patch) => {
    update({
      fields: fields.map((field, fieldIndex) => (fieldIndex === index ? { ...field, ...patch } : field)),
    });
  };

  const addField = () => {
    update({ fields: [...fields, { label: `Field ${fields.length + 1}`, type: 'input', placeholder: '', required: false, inputType: 'text', validationType: 'none', validationRegex: '', validationMessage: '', icon: 'none' }] });
  };

  const removeField = (index) => {
    update({ fields: fields.filter((_, fieldIndex) => fieldIndex !== index) });
  };

  return (
    <Section title="Content">
      <Field label="Title"><Inp value={el.title} onChange={(v) => update({ title: v })} /></Field>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Fields</span>
          <button type="button" onClick={addField} className="text-[11px] font-medium text-blue-600">+ Add field</button>
        </div>
        {fields.map((field, index) => (
          <div key={index} className="rounded-md border border-gray-100 p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500">Field {index + 1}</span>
              <button type="button" onClick={() => removeField(index)} className="text-[10px] text-red-500">Remove</button>
            </div>
            <Field label="Label"><Inp value={field.label} onChange={(v) => updateField(index, { label: v })} /></Field>
            <Field label="Type">
              <Sel value={field.type || 'input'} onChange={(v) => updateField(index, { type: v })}
                options={[
                  { value: 'input', label: 'Input' },
                  { value: 'textarea', label: 'Textarea' },
                  { value: 'dropdown', label: 'Dropdown' },
                  { value: 'checkbox', label: 'Checkbox' },
                ]} />
            </Field>
            {field.type === 'input' && (
              <>
                <Field label="Input type">
                  <Sel value={field.inputType || 'text'} onChange={(v) => updateField(index, { inputType: v })}
                    options={[
                      { value: 'text', label: 'Text' },
                      { value: 'email', label: 'Email' },
                      { value: 'password', label: 'Password' },
                      { value: 'number', label: 'Number' },
                    ]} />
                </Field>
                <Field label="Validation">
                    <Sel
                        value={field.validationType || "none"}
                        onChange={(v) => {

                            let regex = "";
                            let message = "";

                            switch (v) {

                                case "name":
                                    regex = "^[A-Za-z ]+$";
                                    message = "Name should contain only alphabets.";
                                    break;

                                case "email":
                                    regex = "^[\\w-.]+@([\\w-]+\\.)+[\\w-]{2,4}$";
                                    message = "Please enter a valid email address.";
                                    break;

                                case "password":
                                    regex = "^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$";
                                    message =
                                        "Password must contain at least 8 characters, one uppercase letter, one number and one special character.";
                                    break;

                                case "number":
                                    regex = "^[0-9]+$";
                                    message = "Only numbers are allowed.";
                                    break;

                                default:
                                    regex = "";
                                    message = "";
                            }

                            updateField(index, {

                                validationType: v,

                                validationRegex: regex,

                                validationMessage: message

                            });

                        }}

                        options={[
                            { value: "none", label: "None" },
                            { value: "name", label: "Name" },
                            { value: "email", label: "Email" },
                            { value: "password", label: "Password" },
                            { value: "number", label: "Number" },
                        ]}
                    />
                </Field>
                {field.validationRegex && (
                  <div className="text-[10px] text-gray-500">
                    Regex
                    <br />
                    <code>{field.validationRegex}</code>
                  </div>
                )}
                {field.validationMessage && (
                  <div className="text-[11px] text-red-500">
                    {field.validationMessage}
                  </div>
                )}
                <Field label="Icon">
                  <Sel value={field.icon || 'none'} onChange={(v) => updateField(index, { icon: v })}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'user', label: 'User' },
                      { value: 'mail', label: 'Mail' },
                      { value: 'lock', label: 'Lock' },
                      { value: 'number', label: 'Number' },
                    ]} />
                </Field>
              </>
            )}
            <Field label="Required">
              <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(field.required)}
                  onChange={(e) =>
                    updateField(index, { required: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                />
              </label>
            </Field>
            {(field.type === 'input' || field.type === 'textarea') && (
              <Field label="Placeholder"><Inp value={field.placeholder || ''} onChange={(v) => updateField(index, { placeholder: v })} /></Field>
            )}
            {field.type === 'dropdown' && (
              <Field label="Options (comma separated)"><Inp value={field.options || ''} onChange={(v) => updateField(index, { options: v })} /></Field>
            )}
          </div>
        ))}
      </div>
      <Field label="Submit label"><Inp value={el.buttonLabel} onChange={(v) => update({ buttonLabel: v })} /></Field>
      <ResponsiveFontSizeControl value={el.titleFontSize} onChange={(v) => update({ titleFontSize: v })} label="Form title font size" min={10} max={24} />
      <ResponsiveFontWeightControl value={el.titleFontWeight} onChange={(v) => update({ titleFontWeight: v })} label="Form title font weight"  />
      <ResponsiveLineHeightControl value={el.titleLineHeight} onChange={(v) => update({ titleLineHeight: v })} label="Form title line height" min={0.8} max={2.5} />
      <ResponsiveFontSizeControl value={el.buttonFontSize} onChange={(v) => update({ buttonFontSize: v })} label="Button font size" min={10} max={24} />
      <ResponsiveFontWeightControl value={el.buttonFontWeight} onChange={(v) => update({ buttonFontWeight: v })} label="Button font weight" />
      <ResponsiveLineHeightControl value={el.buttonLineHeight} onChange={(v) => update({ buttonLineHeight: v })} label="Button line height" min={0.8} max={2.5} />
    </Section>
  );
}

/* Row props */
function RowProps({ row }) {
  const { updateRow, setRowCols, updateColFlex } = useBuilderStore();
  const verticalPadding = row.verticalPadding || {
    desktop: 4,
    tablet: 4,
    mobile: 4,
  };
  const horizontalPadding = row.horizontalPadding || {
    desktop: 4,
    tablet: 4,
    mobile: 4,
  };
  const gap = row.gap || {
    desktop: 4,
    tablet: 3,
    mobile: 2,
  };
  return (
    <>
      <Section title="Layout">
        <Field label="Columns">
          <Sel value={row.cols.length} onChange={(v) => setRowCols(row.id, +v)}
            options={[1,2,3,4,5,6].map((n) => ({ value: n, label: `${n} column${n > 1 ? 's' : ''}` }))} />
        </Field>
          <Field label="Column Gap">
            <div className="grid grid-cols-3 gap-2">

              {[
                { key: "desktop", label: "Desktop" },
                { key: "tablet", label: "Tablet" },
                { key: "mobile", label: "Mobile" },
              ].map((device) => (

                <div key={device.key}>
                  <label className="block text-[10px] text-gray-500 mb-1">
                    {device.label}
                  </label>

                  <Sel
                    value={row.gap?.[device.key] ?? 4}
                    onChange={(v) =>
                      updateRow(row.id, {
                        gap: {
                          ...row.gap,
                          [device.key]: Number(v),
                        },
                      })
                    }
                    options={[0,2,3,4,6,8].map((n) => ({
                      value: n,
                      label: `(${n * 4}px)`,
                    }))}
                  />
                </div>

              ))}

            </div>
          </Field>
        <Field label="Vertical Padding">
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "desktop", label: "Desktop" },
                { key: "tablet", label: "Tablet" },
                { key: "mobile", label: "Mobile" },
              ].map((device) => (
                <div key={device.key}>
                  <label className="block text-[10px] text-gray-500 mb-1">
                    {device.label}
                  </label>

                  <Sel
                    value={verticalPadding[device.key]}
                    onChange={(v) =>
                      updateRow(row.id, {
                        verticalPadding: {
                          ...verticalPadding,
                          [device.key]: Number(v),
                        },
                      })
                    }
                    options={[0,2,4,6,8,10,12].map((n) => ({
                      value: n,
                      label: `(${n * 4}px)`,
                    }))}
                  />
                </div>
              ))}
            </div>
          </Field>
          <Field label="Horizontal Padding">
            <div className="grid grid-cols-3 gap-2">

              {[
                { key: "desktop", label: "Desktop" },
                { key: "tablet", label: "Tablet" },
                { key: "mobile", label: "Mobile" },
              ].map((device) => (

                <div key={device.key}>

                  <label className="block text-[10px] text-gray-500 mb-1">
                    {device.label}
                  </label>

                  <Sel
                    value={horizontalPadding[device.key]}
                    onChange={(v) =>
                      updateRow(row.id, {
                        horizontalPadding: {
                          ...horizontalPadding,
                          [device.key]: Number(v),
                        },
                      })
                    }
                    options={[0,2,4,6,8,10,12].map((n) => ({
                      value: n,
                      label: `(${n * 4}px)`,
                    }))}
                  />

                </div>

              ))}

            </div>
          </Field>
        <Toggle checked={row.stackOnMobile} onChange={(v) => updateRow(row.id, { stackOnMobile: v })} label="Stack columns on mobile" />
      </Section>
      <Section title="Column widths (flex ratio)">
        {row.cols.map((col, i) => (
          <Field key={col.id} label={`Column ${i + 1}`}>
            <Sel value={col.flex || 1} onChange={(v) => updateColFlex(row.id, col.id, +v)}
              options={[{value:1,label:'1 — equal'},{value:2,label:'2 — double'},{value:3,label:'3 — triple'},{value:4,label:'4 — quad'}]} />
          </Field>
        ))}
        <p className="text-[10px] text-gray-400">e.g. Col1=1, Col2=2 → 33% / 66%</p>
      </Section>
    </>
  );
}

/* Responsive visibility */
function ResponsiveSection({ el, update }) {
  return (
    <Section title="Responsive visibility">
      <p className="text-[10px] text-gray-400 -mt-1 mb-1">Switch device preview above to test</p>
      {['mobile','tablet','desktop'].map((bp) => (
        <Toggle
          key={bp}
          label={`Hide on ${bp}`}
          checked={!!(el.hideOn?.[bp])}
          onChange={(v) => update({ hideOn: { ...(el.hideOn || {}), [bp]: v } })}
        />
      ))}
    </Section>
  );
}

function ModalProps({ el, update }) {
  return (
    <>
      <Section title="Modal">
        <Field label="Modal Button Type">
          <Sel value={el.modalButtonType || 'button'} onChange={(v) => update({ modalButtonType: v })}
            options={[{value:'button',label:'Button'},{value:'link',label:'Link'}]} />
        </Field>
        <Field label="Modal Button Text"><Inp value={el.modalButtonLabel} onChange={(v) => update({ modalButtonLabel: v })} /></Field>
        {el.modalButtonType === 'button' && (
          <>
            <Field label="Modal Button Background Color"><ColorPicker value={el.modalButtonBg} onChange={(v) => update({ modalButtonBg: v })} /></Field>
            <Field label="Modal Button Text Color"><ColorPicker value={el.modalButtonColor} onChange={(v) => update({ modalButtonColor: v })} /></Field>
          </>
        )}
        {el.modalButtonType === 'link' && (
          <Field label="Modal Button Text Color"><ColorPicker value={el.modalButtonColor} onChange={(v) => update({ modalButtonColor: v })} /></Field>
        )}
      </Section>
      <Section title="Modal Content">
        <Field label="Modal Content Title"><Inp value={el.modalContentTitle} onChange={(v) => update({ modalContentTitle: v })} /></Field>
        <ResponsiveFontSizeControl value={el.modalTitleFontSize} onChange={(v) => update({ modalTitleFontSize: v })} label="Title font size" min={10} max={36} />
        <ResponsiveFontWeightControl value={el.modalTitleFontWeight} onChange={(v) => update({ modalTitleFontWeight: v })} label="Title font weight" />
        <ResponsiveLineHeightControl value={el.modalTitleLineHeight} onChange={(v) => update({ modalTitleLineHeight: v })} label="Title line height" min={0.8} max={2.5} />
        <Field label="Modal Content Background"><ColorPicker value={el.modalContentBg} onChange={(v) => update({ modalContentBg: v })} /></Field>
        <Field label="Modal Content Width">
          <Sel value={el.modalContentWidth || '500px'} onChange={(v) => update({ modalContentWidth: v })}
            options={[
              {value:'400px',label:'Small (400px)'},
              {value:'500px',label:'Medium (500px)'},
              {value:'600px',label:'Large (600px)'},
              {value:'700px',label:'Extra Large (700px)'},
              {value:'90%',label:'Full Width (90%)'},
            ]} />
        </Field>
      </Section>
    </>
  );
}

function PopoverProps({ el, update }) {
  return (
    <>
      <Section title="Popover Trigger">
        <Field label="Trigger Type">
          <Sel
            value={el.popoverButtonType || 'button'}
            onChange={(v) => update({ popoverButtonType: v })}
            options={[
              { value: 'button', label: 'Button' },
              { value: 'link', label: 'Link' },
            ]}
          />
        </Field>
        <Field label="Trigger Text">
          <Inp
            value={el.popoverButtonLabel}
            onChange={(v) => update({ popoverButtonLabel: v })}
          />
        </Field>
        {el.popoverButtonType === 'button' && (
          <>
            <Field label="Popover Button Background">
              <ColorPicker
                value={el.popoverButtonBg}
                onChange={(v) => update({ popoverButtonBg: v })}
              />
            </Field>
            <Field label="Popover Button Color">
              <ColorPicker
                value={el.popoverButtonColor}
                onChange={(v) => update({ popoverButtonColor: v })}
              />
            </Field>
          </>
        )}
        {el.popoverButtonType === 'link' && (
          <Field label="Popover Link Color">
            <ColorPicker
              value={el.popoverButtonColor}
              onChange={(v) => update({ popoverButtonColor: v })}
            />
          </Field>
        )}
      </Section>
      <Section title="Popover Content">
        <Field label="Popover Content Text">
          <Textarea
            value={el.popoverContentText}
            onChange={(v) => update({ popoverContentText: v })}
          />
        </Field>
        <ResponsiveFontSizeControl value={el.popoverTitleFontSize} onChange={(v) => update({ popoverTitleFontSize: v })} label="Title font size" min={10} max={36} />
        <ResponsiveFontWeightControl value={el.popoverTitleFontWeight} onChange={(v) => update({ popoverTitleFontWeight: v })} label="Title font weight" />
        <ResponsiveLineHeightControl value={el.popoverTitleLineHeight} onChange={(v) => update({ popoverTitleLineHeight: v })} label="Title line height" min={0.8} max={2.5} />
        <ResponsiveFontSizeControl value={el.popoverTextFontSize} onChange={(v) => update({ popoverTextFontSize: v })} label="Body font size" min={10} max={24} />
        <ResponsiveFontWeightControl value={el.popoverTextFontWeight} onChange={(v) => update({ popoverTextFontWeight: v })} label="Body font weight" />
        <ResponsiveLineHeightControl value={el.popoverTextLineHeight} onChange={(v) => update({ popoverTextLineHeight: v })} label="Body line height" min={0.8} max={2.5} />
        <Field label="Popover Content Background">
          <ColorPicker
            value={el.popoverContentBg}
            onChange={(v) => update({ popoverContentBg: v })}
          />
        </Field>
        <Field label="Popover Content Color">
          <ColorPicker
            value={el.popoverContentColor}
            onChange={(v) => update({ popoverContentColor: v })}
          />
        </Field>
        <Field label="Popover Content Width">
          <Sel
            value={el.popoverContentWidth}
            onChange={(v) => update({ popoverContentWidth: v })}
            options={[
              { value: '180px', label: 'Small' },
              { value: '220px', label: 'Medium' },
              { value: '280px', label: 'Large' },
              { value: '320px', label: 'Extra Large' },
            ]}
          />
        </Field>
        <Field label="Popover Content Position">
          <Sel
            value={el.popoverContentPosition}
            onChange={(v) => update({ popoverContentPosition: v })}
            options={[
              { value: 'top', label: 'Top' },
              { value: 'bottom', label: 'Bottom' },
              { value: 'left', label: 'Left' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </Field>
      </Section>
    </>
  );
}

function CheckboxProps({ el, update }) {
  return (
    <>
      <Section title="Content">

        <Field label="Label">
          <Inp
            value={el.label}
            onChange={(v) => update({ label: v })}
          />
        </Field>

      </Section>

      <Section title="State">

        <Toggle
          checked={el.checked}
          onChange={(v) => update({ checked: v })}
          label="Checked"
        />

      </Section>

      <Section title="Style">

        <Field label="Text Color">
          <ColorPicker
            value={el.color}
            onChange={(v) => update({ color: v })}
          />
        </Field>

        <ResponsiveFontSizeControl
          value={el.fontSize}
          onChange={(v) => update({ fontSize: v })}
          label="Font size"
          min={10} 
          max={24}
        />

        <ResponsiveFontWeightControl
          value={el.fontWeight}
          onChange={(v) => update({ fontWeight: v })}
          label="Font weight"
        />

        <ResponsiveLineHeightControl
          value={el.lineHeight}
          onChange={(v) => update({ lineHeight: v })}
          label="Line height"
          min={0.8}
          max={2.5}
        />

        <Field label="Alignment">
          <Sel
            value={el.align}
            onChange={(v) =>
              update({ align: v })
            }
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </Field>

      </Section>
    </>
  );
}

function AlertProps({ el, update }) {
    return (
        <>
            <Section title="Content">

                <Field label="Title">
                    <Inp
                        value={el.title}
                        onChange={(v)=>update({title:v})}
                    />
                </Field>

                <Field label="Message">
                    <Textarea
                        value={el.message}
                        onChange={(v)=>update({message:v})}
                    />
                </Field>

            </Section>

            <Section title="Style">

                <Field label="Variant">
                    <Sel
                        value={el.variant}
                        onChange={(v)=>update({variant:v})}
                        options={[
                            {value:"info",label:"Info"},
                            {value:"success",label:"Success"},
                            {value:"warning",label:"Warning"},
                            {value:"error",label:"Error"},
                        ]}
                    />
                </Field>

                <Toggle
                    label="Closable"
                    checked={el.closable}
                    onChange={(v)=>update({closable:v})}
                />

            </Section>
        </>
    );
}

function LoaderProps({ el, update }) {
  return (
    <>
      <Section title="Loader">

        <Field label="Loader Type">
          <Sel
            value={el.loaderType || "spinner"}
            onChange={(v) => update({ loaderType: v })}
            options={[
              { value: "spinner", label: "Spinner" },
              { value: "dots", label: "Dots" },
              { value: "pulse", label: "Pulse" },
              { value: "bars", label: "Bars" },
            ]}
          />
        </Field>

        <Field label="Size">
          <Sel
            value={el.size || "md"}
            onChange={(v) => update({ size: v })}
            options={[
              { value: "sm", label: "Small" },
              { value: "md", label: "Medium" },
              { value: "lg", label: "Large" },
            ]}
          />
        </Field>

        <Field label="Color">
          <ColorPicker
            value={el.color || "#3b82f6"}
            onChange={(v) => update({ color: v })}
          />
        </Field>

        <Field label="Speed">
          <Inp
            type="number"
            min={0.2}
            max={5}
            value={el.speed ?? 1}
            onChange={(v) => update({ speed: Number(v) })}
          />
        </Field>

        <Field label="Label">
          <Inp
            value={el.label || ""}
            onChange={(v) => update({ label: v })}
            placeholder="Loading..."
          />
        </Field>

        <Toggle
          label="Show Label"
          checked={!!el.showLabel}
          onChange={(v) => update({ showLabel: v })}
        />

      </Section>
    </>
  );
}

function ToggleProps({ el, update }) {
  return (
    <>
      <Section title="Toggle">
        <Field label="Label">
          <Inp
            value={el.label}
            onChange={(v) => update({ label: v })}
          />
        </Field>

        <Field label="Default state">
          <Sel
            value={el.checked ? "on" : "off"}
            onChange={(v) => update({ checked: v === "on" })}
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
          />
        </Field>

        <Field label="Toggle color">
          <ColorPicker
            value={el.color}
            onChange={(v) => update({ color: v })}
          />
        </Field>

        <Field label="Label color">
          <ColorPicker
            value={el.labelColor || "#000000"}
            onChange={(v) => update({ labelColor: v })}
          />
        </Field>

        <ResponsiveFontSizeControl
          value={el.fontSize}
          onChange={(v) => update({ fontSize: v })}
          label="Font size"
          min={10} 
          max={24}
        />

        <ResponsiveFontWeightControl
          value={el.fontWeight}
          onChange={(v) => update({ fontWeight: v })}
          label="Font weight"
        />

        <ResponsiveLineHeightControl
          value={el.lineHeight}
          onChange={(v) => update({ lineHeight: v })}
          label="Line height"
          min={0.8}
          max={2.5}
        />

        <Field label="Alignment">
          <Sel
            value={el.align}
            onChange={(v) => update({ align: v })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </Field>
      </Section>
    </>
  );
}

/* Panel registry */
const PANELS = {
  button:    ButtonProps,
  text:      TextProps,
  radio:     RadioProps,
  checkbox: CheckboxProps,
  heading:   HeadingProps,
  input:     InputProps,
  image:     ImageProps,
  card:      CardProps,
  badge:     BadgeProps,
  alert: AlertProps,
  loader: LoaderProps, 
  toggle: ToggleProps,
  divider:   DividerProps,
  modal:     ModalProps,
  popover: PopoverProps,
  navbar:    NavbarProps,
  hero:      HeroProps,
  formgroup: FormGroupProps,
};

/* ── Main export */
export default function PropsPanel() {
  const { selectedId, selectedType, getSelectedRow, getSelectedElement, updateElement, globalFont, setGlobalFont } = useBuilderStore();
  const selectedRow = getSelectedRow();
  const selectedEl  = getSelectedElement();
  const ElPanel = selectedEl ? PANELS[selectedEl.type] : null;
  const typeName = selectedEl
    ? selectedEl.type.charAt(0).toUpperCase() + selectedEl.type.slice(1)
    : selectedRow ? 'Row' : '';

  const addCustomFont =useBuilderStore( state=>state.addCustomFont );
  const customFonts = useBuilderStore( state=>state.customFonts );
  const availableFonts=[
      ...FONT_OPTIONS,
      ...customFonts.map(font=>({
      label:font.name,
      value:`'${font.name}'`
    }))
  ];

  useEffect(() => {
    customFonts.forEach((font) => {
      if (font.dataUrl || font.file) {
        loadCustomFont(font);
      }
    });
  }, [customFonts]);
  
  return (
    <aside className="w-60 shrink-0 bg-white border-l border-gray-200 flex flex-col overflow-hidden min-h-0">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <p className="text-xs font-semibold text-gray-700">
          {typeName ? `${typeName} Properties` : 'Properties'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Section title="Global Settings">
          <Field label="Global Font">
            <Sel
              value={globalFont || ''}
              onChange={setGlobalFont}
              options={availableFonts}
            />
          </Field>
          <FontUpload
            onFontUpload={async (file) => {
              const fontData = await createFontData(file);
              addCustomFont(fontData);
              loadCustomFont(fontData);
              setGlobalFont(`'${fontData.name}'`);
            }}
          />
        </Section>
        {!selectedId && (
          <p className="text-xs text-gray-400 text-center mt-8 leading-relaxed">
            Select an element or row<br />to edit its properties
          </p>
        )}

        {selectedRow && <RowProps row={selectedRow} />}

        {selectedEl && ElPanel && (
          <>
            <ElPanel el={selectedEl} update={(patch) => updateElement(selectedEl.id, patch)} />
            <ResponsiveSection el={selectedEl} update={(patch) => updateElement(selectedEl.id, patch)} />
          </>
        )}
      </div>
    </aside>
  );
}
