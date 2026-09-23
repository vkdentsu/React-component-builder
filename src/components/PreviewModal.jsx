import { useState } from 'react';
import { X, Monitor, Tablet, Smartphone } from 'lucide-react';
import ElementPreview from './ElementPreview';
import useBuilderStore from '../store/builderStore';

const DEVICES = [
  { id: 'desktop', label: 'Desktop', Icon: Monitor,    width: '100%'  },
  { id: 'tablet',  label: 'Tablet',  Icon: Tablet,     width: '768px' },
  { id: 'mobile',  label: 'Mobile',  Icon: Smartphone, width: '375px' },
];

/* Render a full rows tree recursively without dnd chrome */
function PreviewElement({ el, device }) {
  const hideOn = el.hideOn || {};
  const hidden =
    (device === 'mobile'  && hideOn.mobile)  ||
    (device === 'tablet'  && hideOn.tablet)  ||
    (device === 'desktop' && hideOn.desktop);
  if (hidden) return null;

  if (el.type === 'container') {
    return (
      <div style={{ width: '100%' }}>
        <PreviewRows rows={el.rows || []} device={device} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <ElementPreview el={el} isSelected={false} device={device} />
    </div>
  );
}

function PreviewCol({ col, device }) {
  const horizontalPadding = col.horizontalPadding || {
  desktop: 0,
  tablet: 0,
  mobile: 0,
};

const paddingX =
  device === "mobile"
    ? horizontalPadding.mobile
    : device === "tablet"
    ? horizontalPadding.tablet
    : horizontalPadding.desktop;
  const badgeElement = col.elements.find(
    (el) => el.type === "badge"
  );

  const contentElements = col.elements.filter(
    (el) => el.type !== "badge"
  );

  return (
    <div
      style={{
        flex: col.flex || 1,
        paddingLeft: paddingX * 4,
        paddingRight: paddingX * 4,
      }}
      className="relative flex min-w-0 flex-col gap-3"
    >
      {/* Badge Overlay */}
      {badgeElement && (
        <div className="absolute top-2 left-2 z-20">
          <ElementPreview
            el={badgeElement}
            isSelected={false}
            device={device}
          />
        </div>
      )}

      {/* Normal Elements */}
      {contentElements.map((el) => (
        <PreviewElement
          key={el.id}
          el={el}
          device={device}
        />
      ))}
    </div>
  );
}

function PreviewRow({ row, device }) {
  const isStacked = row.stackOnMobile && device === 'mobile';
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

  const paddingX =
    device === "mobile"
      ? horizontalPadding.mobile
      : device === "tablet"
      ? horizontalPadding.tablet
      : horizontalPadding.desktop;

    const paddingY =
      device === "mobile"
        ? verticalPadding.mobile
        : device === "tablet"
        ? verticalPadding.tablet
        : verticalPadding.desktop;
        const gap = row.gap || {
    desktop: 4,
    tablet: 3,
    mobile: 2,
  };

  const columnGap =
    device === "mobile"
      ? gap.mobile
      : device === "tablet"
      ? gap.tablet
      : gap.desktop;
  return (
    <div style={{
        display: "flex",
        flexDirection: isStacked ? "column" : "row",
        gap: columnGap * 4,
        paddingTop: paddingY * 4,
        paddingBottom: paddingY * 4,

        paddingLeft: paddingX * 4,
        paddingRight: paddingX * 4,
      }}>
      
      {row.cols.map((col) => (
        <PreviewCol key={col.id} col={col} device={device} />
      ))}
    </div>
  );
}

function PreviewRows({ rows, device }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((row) => (
        <PreviewRow key={row.id} row={row} device={device} />
      ))}
    </div>
  );
}

export default function PreviewModal({ open, onClose }) {
  const { rows, documents, activeDocId, globalFont } = useBuilderStore();
  const [device, setDevice] = useState('desktop');

  const activeDoc = documents.find((d) => d.id === activeDocId);
  const deviceWidth = DEVICES.find((d) => d.id === device)?.width || '100%';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900/95 backdrop-blur-sm" style={{fontFamily: globalFont,}}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-3 bg-gray-900 border-b border-gray-700 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            Preview — {activeDoc?.name || 'Component'}
          </span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
            {deviceWidth === '100%' ? 'Full width' : deviceWidth}
          </span>
        </div>

        {/* Device switcher */}
        <div className="flex items-center gap-0.5 bg-gray-800 rounded-lg p-0.5">
          {DEVICES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                ${device === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-150"
        >
          <X size={14} /> Close
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex justify-center py-8 px-4 bg-[#1a1a2e]">
        {/* Device frame */}
        <div
          style={{ width: deviceWidth, transition: 'width 0.3s ease' }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[200px] flex flex-col"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 border-b border-gray-200 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            <div className="flex-1 mx-3 bg-white rounded-md px-3 py-1 text-[10px] text-gray-400 border border-gray-200">
              localhost:5173
            </div>
          </div>

          {/* Rendered content */}
          <div className="flex-1 p-4 overflow-auto">
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
                <span className="text-3xl">🎨</span>
                <p className="text-sm">Nothing to preview yet — add some elements first</p>
              </div>
            ) : (
              <PreviewRows rows={rows} device={device} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
