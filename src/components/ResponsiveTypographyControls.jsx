const deviceOptions = [
  { key: 'desktop', label: 'Desktop' },
  { key: 'tablet', label: 'Tablet' },
  { key: 'mobile', label: 'Mobile' },
];

const getResolvedValue = (value) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      desktop: value.desktop ?? '',
      tablet: value.tablet ?? '',
      mobile: value.mobile ?? '',
    };
  }

  // Legacy components stored one value. Showing it in all three fields keeps
  // old saved components editable while preserving their existing appearance.
  return { desktop: value ?? '', tablet: value ?? '', mobile: value ?? '' };
};

const normalizeNumber = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const parsed = Number(value);
  return Number.isNaN(parsed) ? '' : parsed;
};

function ResponsiveControlShell({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] text-gray-500">{label}</label>
      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

function ResponsiveInputCell({ device, value, onChange, type = 'text', min, max, step, placeholder }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1">{device.label}</label>
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
      />
    </div>
  );
}

function ResponsiveSelectCell({ device, value, onChange, options }) {
  return (
    <div>
      <label className="block text-[10px] text-gray-500 mb-1">{device.label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
      >
        {options.map(({ value: optionValue, label }) => (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ResponsiveFontSizeControl({ value, onChange, label = 'Font size', min = 10, max = 96, step = 1 }) {
  const resolvedValue = getResolvedValue(value);

  const updateDeviceValue = (deviceKey, nextValue) => {
    onChange({
      ...resolvedValue,
      [deviceKey]: normalizeNumber(nextValue),
    });
  };

  return (
    <ResponsiveControlShell label={label}>
      {deviceOptions.map((device) => (
        <ResponsiveInputCell
          key={device.key}
          device={device}
          value={resolvedValue[device.key]}
          onChange={(nextValue) => updateDeviceValue(device.key, nextValue)}
          type="number"
          min={min}
          max={max}
          step={step}
        />
      ))}
    </ResponsiveControlShell>
  );
}

export function ResponsiveFontWeightControl({ value, onChange, label = 'Font weight', options }) {
  const resolvedValue = getResolvedValue(value);
  const weightOptions = options || [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'bold', label: 'Bold' },
    { value: '400', label: '400' },
    { value: '500', label: '500' },
    { value: '600', label: '600' },
    { value: '700', label: '700' },
    { value: '800', label: '800' },
    { value: '900', label: '900' },
  ];

  const updateDeviceValue = (deviceKey, nextValue) => {
    onChange({
      ...resolvedValue,
      [deviceKey]: nextValue,
    });
  };

  return (
    <ResponsiveControlShell label={label}>
      {deviceOptions.map((device) => (
        <ResponsiveSelectCell
          key={device.key}
          device={device}
          value={resolvedValue[device.key]}
          onChange={(nextValue) => updateDeviceValue(device.key, nextValue)}
          options={weightOptions}
        />
      ))}
    </ResponsiveControlShell>
  );
}

export function ResponsiveLineHeightControl({ value, onChange, label = 'Line height', min = 0.8, max = 2.5, step = 0.1 }) {
  const resolvedValue = getResolvedValue(value);

  const updateDeviceValue = (deviceKey, nextValue) => {
    onChange({
      ...resolvedValue,
      [deviceKey]: normalizeNumber(nextValue),
    });
  };

  return (
    <ResponsiveControlShell label={label}>
      {deviceOptions.map((device) => (
        <ResponsiveInputCell
          key={device.key}
          device={device}
          value={resolvedValue[device.key]}
          onChange={(nextValue) => updateDeviceValue(device.key, nextValue)}
          type="number"
          min={min}
          max={max}
          step={step}
        />
      ))}
    </ResponsiveControlShell>
  );
}
