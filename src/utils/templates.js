
export const TEMPLATES_PRESET = [
  {
    name: 'Basic template',
  },
];

export const BUILT_IN_TEMPLATES = TEMPLATES_PRESET.map((p, idx) => ({
  id: `preset-${idx}`,
  name: p.name,
}));


