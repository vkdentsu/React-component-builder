import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { arrayMove } from '@dnd-kit/sortable';
import { nanoid } from '../utils/nanoid';
import {
  updateRowsAtLocation,
  findLocation,
  findColLocation,
  findRowLocation,
  findElementById,
} from '../utils/treeHelpers';

const defaultElementProps = {
  button: {
    label: 'Click me',
    bg: '#3b82f6',
    color: '#ffffff',
    fontSize: { desktop: 14, tablet: 13, mobile: 12 },
    fontWeight: { desktop: 'medium', tablet: 'medium', mobile: 'medium' },
    lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.5 },
    rounded: 'md',
    padding: 'md',
  },
  text: {
    label: 'Paragraph text here.',
    color: '#374151',
    fontSize: { desktop: 14, tablet: 13, mobile: 12 },
    fontWeight: { desktop: 'normal', tablet: 'normal', mobile: 'normal' },
    lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.5 },
    align: 'left',
  },
  radio: {
    label: "Radio Button",
    group: "group1",
    value: "option1",
    checked: false,
    color: "#2563eb",
    fontSize: { desktop: 14, tablet: 13, mobile: 12 },
    fontWeight: { desktop: 'normal', tablet: 'normal', mobile: 'normal' },
    lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.5 },
    align: "left",
  },
  checkbox: {
    label: "Checkbox",
    checked: false,
    value: "option1",
    color: "#2563eb",
    fontSize: { desktop: 14, tablet: 13, mobile: 12 },
    fontWeight: { desktop: 'normal', tablet: 'normal', mobile: 'normal' },
    lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.5 },
    align: "left",
  },
  heading: {
    label: 'Section Heading',
    color: '#111827',
    fontSize: { desktop: 24, tablet: 20, mobile: 18 },
    fontWeight: { desktop: 'bold', tablet: 'medium', mobile: 'normal' },
    lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.5 },
    align: 'left',
  },
  input: { placeholder: 'Enter value…', label: 'Label', type: 'text' },
  image: { src: 'https://placehold.co/600x300/e0e7ff/6366f1?text=Image', alt: 'Image', rounded: 'md', objectFit: 'cover' },
  // card: { image: '', imageAlt: '', title: 'Card title', subtitle: 'Supporting description text.', bg: '#ffffff', ctaLabel: '', ctaBg: '#3b82f6', ctaColor: '#ffffff', link: '' },
  card: {
    image: '',
    imageAlt: '',

    title: 'Card title',
    titleColor: '#111827',
    titleFontSize: {
      desktop: 24,
      tablet: 20,
      mobile: 18,
    },
    titleFontWeight: {
      desktop: 'bold',
      tablet: 'medium',
      mobile: 'normal',
    },
    titleLineHeight: {
      desktop: 1.2,
      tablet: 1.3,
      mobile: 1.5,
    },

    subtitle: 'Supporting description text.',
    subtitleColor: '#6b7280',
    subtitleFontSize: {
      desktop: 16,
      tablet: 15,
      mobile: 14,
    },
    subtitleFontWeight: {
      desktop: 'normal',
      tablet: 'normal',
      mobile: 'normal',
    },
    subtitleLineHeight: {
      desktop: 1.4,
      tablet: 1.5,
      mobile: 1.6,
    },

    ctaLabel: 'Learn More',

    ctaBg: '#3b82f6',
    ctaColor: '#ffffff',

    ctaFontSize: {
      desktop: 14,
      tablet: 13,
      mobile: 12,
    },
    ctaFontWeight: {
      desktop: 'medium',
      tablet: 'medium',
      mobile: 'medium',
    },
    ctaLineHeight: {
      desktop: 1.2,
      tablet: 1.3,
      mobile: 1.4,
    },

    bg: '#ffffff',
    rounded: 'lg',

    link: '',
  },
  badge: { label: 'Badge', bg: '#ede9fe', color: '#6d28d9' },
  alert: { title: "Alert", message: "This is an alert message.", variant: "info", closable: false, bg: "#e0f2fe", color: "#0369a1", icon: true },
  toggle: {
    label: 'Toggle',
    checked: false,
    color: '#3b82f6',
    labelColor: '#000000',
    fontSize: { desktop: 14, tablet: 13, mobile: 12 },
    fontWeight: { desktop: '500', tablet: '500', mobile: '400' },
    lineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.5 },
    align: 'left',
  },
  divider: { color: '#e5e7eb', thickness: 1 },
  loader: { loaderType: "spinner", size: "md", color: "#3b82f6", speed: 1, label: "Loading...", showLabel: true },
  modal: { modalButtonLabel: 'Open Modal', modalButtonType: 'button', modalButtonBg: '#3b82f6', modalButtonColor: '#ffffff', modalContenttitle: 'Modal Title', modalContentbg: '#ffffff', modalContentwidth: '500px' },
  popover: { popoverButtonLabel: 'Open Popover', popoverButtonType: 'button', popoverButtonBg: '#3b82f6', popoverButtonColor: '#ffffff', popoverContentTitle: 'Popover', popoverContentText: 'This is a popover.', popoverContentPosition: 'bottom', popoverContentBg: '#ffffff', popoverContentColor: '#111827', popoverContentWidth: '280px' },
  navbar: { brand: 'Brand', logoUrl: '', logoAlign: 'left', links: 'Home, Features, Pricing, Contact', submenus: '', bg: '#ffffff', color: '#111827', shadow: true },
  hero: {
    title: 'Build something great',
    titleTag: 'h1',
    titleSize: { desktop: 40, tablet: 32, mobile: 24 },
    titleColor: '#111827',
    titleWeight: { desktop: 'bold', tablet: 'medium', mobile: 'normal' },
    titleLineHeight: { desktop: 1.1, tablet: 1.2, mobile: 1.4 },
    subtitle: 'A short supporting line about your product or page.',
    subtitleSize: { desktop: 18, tablet: 16, mobile: 14 },
    subtitleColor: '#6b7280',
    subtitleLineHeight: { desktop: 1.4, tablet: 1.5, mobile: 1.6 },
    ctaLabel: 'Get started',
    ctaBg: '#3b82f6',
    ctaColor: '#ffffff',
    ctaSize: { desktop: 15, tablet: 14, mobile: 13 },
    ctaLineHeight: { desktop: 1.2, tablet: 1.3, mobile: 1.4 },
    ctaRounded: 'md',
    bg: '#eef2ff',
    bgImageMobile: '',
    bgImageTablet: '',
    bgImageDesktop: '',
    bgOverlay: 0.3,
    align: 'center',
    heightMode: 'auto',
    minHeight: 400,
    viewportHeight: 60,
    verticalPadding: { desktop: 8, tablet: 6, mobile: 4 },
    horizontalPadding: { desktop: 8, tablet: 6, mobile: 4 },
  },
  formgroup: {
    title: 'Contact us',
    fields: [
      { label: 'Name', type: 'input', placeholder: 'Enter your name', inputType: 'text', validationType: 'none', validationRegex: '', validationMessage: '' },
      { label: 'Message', type: 'textarea', placeholder: 'Tell us more' },
      { label: 'Role', type: 'dropdown', options: 'View, Edit' },
      { label: 'Subscribe', type: 'checkbox' },
    ],
    buttonLabel: 'Submit',
  },
};

// Element types that can hold nested rows
const makeElement = (type) => {
  const base = {
    id: nanoid(),
    type,
    hideOn: { mobile: false, tablet: false, desktop: false },
    ...JSON.parse(JSON.stringify(defaultElementProps[type] || {})),
  };
  if (type === 'container') base.rows = [];
  return base;
};

const makeColumn = (flex = 1) => ({ id: nanoid(), flex, elements: [] });

const makeRow = (cols = 2) => ({
  id: nanoid(),
  gap: {
    desktop: 4,
    tablet: 3,
    mobile: 2,
  },
  stackOnMobile: true,

  // Responsive Vertical Padding
  verticalPadding: {
    desktop: 2,
    tablet: 2,
    mobile: 2,
  },

  // Responsive Horizontal Padding
  horizontalPadding: {
    desktop: 4,
    tablet: 3,
    mobile: 2,
  },

  cols: Array.from({ length: cols }, () => makeColumn()),
});

const makeDocument = (name = 'My Component') => ({
  id: nanoid(),
  name,
  rows: [],
});

const HISTORY_LIMIT = 50;
const CUSTOM_FONTS_STORAGE_KEY = 'component-builder-custom-fonts';

const readStoredCustomFonts = () => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = window.localStorage.getItem(CUSTOM_FONTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Failed to read stored custom fonts', error);
    return [];
  }
};

const writeStoredCustomFonts = (fonts) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CUSTOM_FONTS_STORAGE_KEY, JSON.stringify(fonts));
  } catch (error) {
    console.warn('Failed to save custom fonts', error);
  }
};

const useBuilderStore = create(
  persist(
    (set, get) => ({
      // Documents 
      documents: [makeDocument('My Component')],
      activeDocId: null, // set on first access below

      rows: [],
      selectedId: null,
      selectedType: null,
      device: 'desktop',
      globalFont: "'Inter', sans-serif",
      customFonts: readStoredCustomFonts(),

      setGlobalFont: (font) =>
        set({
          globalFont: font,
        }),

      addCustomFont: (font) =>
        set((state) => {
          const existingIndex = state.customFonts.findIndex(
            (existingFont) => existingFont.name.toLowerCase() === font.name.toLowerCase()
          );

          const nextFonts = existingIndex >= 0
            ? state.customFonts.map((existingFont, index) => index === existingIndex ? { ...existingFont, ...font } : existingFont)
            : [...state.customFonts, font];

          writeStoredCustomFonts(nextFonts);
          return { customFonts: nextFonts };
        }),


      _history: { past: [], future: [] },

      // History
      _pushHistory: () => {
        const { rows, _history } = get();
        set({
          _history: {
            past: [...(_history.past.slice(-(HISTORY_LIMIT - 1))), rows],
            future: [],
          },
        });
      },

      canUndo: () => get()._history.past.length > 0,
      canRedo: () => get()._history.future.length > 0,

      undo: () =>
        set((s) => {
          if (!s._history.past.length) return {};
          const previous = s._history.past[s._history.past.length - 1];
          const newPast = s._history.past.slice(0, -1);
          return {
            rows: previous,
            _history: { past: newPast, future: [s.rows, ...s._history.future] },
            selectedId: null,
            selectedType: null,
          };
        }),

      redo: () =>
        set((s) => {
          if (!s._history.future.length) return {};
          const [next, ...rest] = s._history.future;
          return {
            rows: next,
            _history: { past: [...s._history.past, s.rows], future: rest },
            selectedId: null,
            selectedType: null,
          };
        }),

      // ── Device ────────────────────────────────────────────────
      setDevice: (device) => set({ device }),

      // ── Rows ──────────────────────────────────────────────────
      addRow: (cols = 2, hops = []) => {
        get()._pushHistory();
        const row = makeRow(cols);
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, hops, (local) => [...local, row]),
          selectedId: row.id,
          selectedType: 'row',
        }));
        return row.id;
      },

      removeRow: (rowId) => {
        const loc = findRowLocation(get().rows, rowId);
        if (!loc) return;
        get()._pushHistory();
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) => local.filter((r) => r.id !== rowId)),
          selectedId: s.selectedId === rowId ? null : s.selectedId,
          selectedType: s.selectedId === rowId ? null : s.selectedType,
        }));
      },

      // ── Row Duplication ───────────────────────────────────────
      duplicateRow: (rowId) => {
        const loc = findRowLocation(get().rows, rowId);
        if (!loc) return;

        get()._pushHistory();

        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) => {
            const index = local.findIndex((row) => row.id === rowId);
            if (index === -1) return local;

            const copiedRow = regenerateIds(JSON.parse(JSON.stringify(local[index])));

            const rows = [...local];
            rows.splice(index + 1, 0, copiedRow);
            return rows;
          }),
        }));
      },

      setRowCols: (rowId, count) => {
        const loc = findRowLocation(get().rows, rowId);
        if (!loc) return;
        get()._pushHistory();
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) => {
              if (r.id !== rowId) return r;
              const cur = r.cols;
              if (count > cur.length) {
                return { ...r, cols: [...cur, ...Array.from({ length: count - cur.length }, () => makeColumn())] };
              }
              return { ...r, cols: cur.slice(0, count) };
            })
          ),
        }));
      },

      updateRow: (rowId, patch) => {
        const loc = findRowLocation(get().rows, rowId);
        if (!loc) return;
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) => (r.id === rowId ? { ...r, ...patch } : r))
          ),
        }));
      },

      updateColFlex: (rowId, colId, flex) => {
        const loc = findRowLocation(get().rows, rowId);
        if (!loc) return;
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) =>
              r.id !== rowId ? r : { ...r, cols: r.cols.map((c) => (c.id === colId ? { ...c, flex } : c)) }
            )
          ),
        }));
      },

      // ── Elements ──────────────────────────────────────────────
      addElement: (colId, type) => {
        const loc = findColLocation(get().rows, colId);
        if (!loc) return null;
        get()._pushHistory();
        const el = makeElement(type);
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) =>
              r.id !== loc.rowId ? r : {
                ...r,
                cols: r.cols.map((c) => (c.id !== colId ? c : { ...c, elements: [...c.elements, el] })),
              }
            )
          ),
          selectedId: el.id,
          selectedType: 'element',
        }));
        return el.id;
      },

      removeElement: (elId) => {
        const loc = findLocation(get().rows, elId);
        if (!loc) return;
        get()._pushHistory();
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) =>
              r.id !== loc.rowId ? r : {
                ...r,
                cols: r.cols.map((c) =>
                  c.id !== loc.colId ? c : { ...c, elements: c.elements.filter((e) => e.id !== elId) }
                ),
              }
            )
          ),
          selectedId: s.selectedId === elId ? null : s.selectedId,
          selectedType: s.selectedId === elId ? null : s.selectedType,
        }));
      },

      updateElement: (elId, patch) => {
        const loc = findLocation(get().rows, elId);
        if (!loc) return;
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) =>
              r.id !== loc.rowId ? r : {
                ...r,
                cols: r.cols.map((c) =>
                  c.id !== loc.colId ? c : {
                    ...c,
                    elements: c.elements.map((e) => (e.id === elId ? { ...e, ...patch } : e)),
                  }
                ),
              }
            )
          ),
        }));
      },

      updateRadioSelection: (id, checked) =>
        set((state) => {
          const rows = structuredClone(state.rows);
          rows.forEach(row => {
            row.cols.forEach(col => {
              const current = col.elements.find(
                e => e.id === id
              );
              if (!current) return;
              col.elements.forEach(el => {
                if (
                  el.type === "radio" &&
                  el.group === current.group
                ) {
                  el.checked = false;
                }
              });
              current.checked = checked;
            });
          });
          return { rows };
        }),

      // ── Reorder elements within a column ─────────────────────
      reorderElements: (colId, oldIndex, newIndex) => {
        const loc = findColLocation(get().rows, colId);
        if (!loc) return;
        get()._pushHistory();
        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) =>
              r.id !== loc.rowId ? r : {
                ...r,
                cols: r.cols.map((c) =>
                  c.id !== colId ? c : { ...c, elements: arrayMove(c.elements, oldIndex, newIndex) }
                ),
              }
            )
          ),
        }));
      },

      // ── duplicate elements within a column ─────────────────────
      duplicateElement: (elId) => {
        const loc = findLocation(get().rows, elId);
        if (!loc) return;

        const originalElement = findElementById(get().rows, elId);
        if (!originalElement) return;

        get()._pushHistory();

        // Deep clone then regenerate every id in the subtree so
        const cloned = JSON.parse(JSON.stringify(originalElement));
        const duplicatedElement = {
          ...cloned,
          id: nanoid(),
          ...(cloned.rows ? { rows: cloned.rows.map(regenerateIds) } : {}),
        };

        set((s) => ({
          rows: updateRowsAtLocation(s.rows, loc.hops, (local) =>
            local.map((r) =>
              r.id !== loc.rowId
                ? r
                : {
                  ...r,
                  cols: r.cols.map((c) => {
                    if (c.id !== loc.colId) return c;

                    const index = c.elements.findIndex(
                      (e) => e.id === elId
                    );

                    const elements = [...c.elements];

                    elements.splice(
                      index + 1,
                      0,
                      duplicatedElement
                    );

                    return {
                      ...c,
                      elements,
                    };
                  }),
                }
            )
          ),
          selectedId: duplicatedElement.id,
          selectedType: 'element',
        }));
      },

      // ── Move element to another column (any depth) ───────────
      moveElement: (elId, toColId, toIndex = -1) => {
        const fromLoc = findLocation(get().rows, elId);
        if (!fromLoc) return;
        const el = findElementById(get().rows, elId);
        if (!el) return;

        get()._pushHistory();

        set((s) => {
          // 1. remove from source
          let rows = updateRowsAtLocation(s.rows, fromLoc.hops, (local) =>
            local.map((r) =>
              r.id !== fromLoc.rowId ? r : {
                ...r,
                cols: r.cols.map((c) =>
                  c.id !== fromLoc.colId ? c : { ...c, elements: c.elements.filter((e) => e.id !== elId) }
                ),
              }
            )
          );

          // 2. insert into destination
          const toLoc = findColLocation(rows, toColId);
          if (!toLoc) return { rows };

          rows = updateRowsAtLocation(rows, toLoc.hops, (local) =>
            local.map((r) =>
              r.id !== toLoc.rowId ? r : {
                ...r,
                cols: r.cols.map((c) => {
                  if (c.id !== toColId) return c;
                  const els = [...c.elements];
                  els.splice(toIndex >= 0 ? toIndex : els.length, 0, el);
                  return { ...c, elements: els };
                }),
              }
            )
          );

          return { rows };
        });
      },

      // ── Selection ──────────────────────────────────────────────
      select: (id, type) => set({ selectedId: id, selectedType: type }),
      deselect: () => set({ selectedId: null, selectedType: null }),

      // ── Helpers ───────────────────────────────────────────────
      getSelectedRow: () => {
        const { rows, selectedId, selectedType } = get();
        if (selectedType !== 'row') return null;
        return findRowObject(rows, selectedId);
      },

      getSelectedElement: () => {
        const { rows, selectedId, selectedType } = get();
        if (selectedType !== 'element') return null;
        return findElementById(rows, selectedId);
      },

      findElementLocation: (elId) => findLocation(get().rows, elId),

      clearAll: () => {
        get()._pushHistory();
        set({ rows: [], selectedId: null, selectedType: null });
      },

      // ── Multi-document management ────────────────────────────
      newDocument: () => {
        const { documents, rows, activeDocId } = get();
        const syncedDocs = documents.map((d) => (d.id === activeDocId ? { ...d, rows } : d));
        const doc = makeDocument(`Component ${documents.length + 1}`);
        set({
          documents: [...syncedDocs, doc],
          activeDocId: doc.id,
          rows: [],
          selectedId: null,
          selectedType: null,
          _history: { past: [], future: [] },
        });
      },

      switchDocument: (docId) => {
        const { documents, rows, activeDocId } = get();
        if (docId === activeDocId) return;
        const syncedDocs = documents.map((d) => (d.id === activeDocId ? { ...d, rows } : d));
        const target = syncedDocs.find((d) => d.id === docId);
        if (!target) return;
        set({
          documents: syncedDocs,
          activeDocId: docId,
          rows: target.rows,
          selectedId: null,
          selectedType: null,
          _history: { past: [], future: [] },
        });
      },

      renameDocument: (docId, name) => {
        set((s) => ({
          documents: s.documents.map((d) => (d.id === docId ? { ...d, name } : d)),
        }));
      },

      deleteDocument: (docId) => {
        const { documents, activeDocId, rows } = get();
        if (documents.length <= 1) return; // keep at least one
        const remaining = documents.filter((d) => d.id !== docId);
        if (docId === activeDocId) {
          const next = remaining[0];
          set({
            documents: remaining,
            activeDocId: next.id,
            rows: next.rows,
            selectedId: null,
            selectedType: null,
            _history: { past: [], future: [] },
          });
        } else {
          const syncedDocs = remaining.map((d) => (d.id === activeDocId ? { ...d, rows } : d));
          set({ documents: syncedDocs });
        }
      },

      duplicateDocument: (docId) => {
        const { documents, rows, activeDocId } = get();
        const syncedDocs = documents.map((d) => (d.id === activeDocId ? { ...d, rows } : d));
        const source = syncedDocs.find((d) => d.id === docId);
        if (!source) return;
        const copy = {
          id: nanoid(),
          name: `${source.name} copy`,
          rows: JSON.parse(JSON.stringify(source.rows)),
        };
        set({ documents: [...syncedDocs, copy] });
      },
    }),
    {
      name: 'component-builder-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const documents = state.documents.map((d) =>
          d.id === state.activeDocId ? { ...d, rows: state.rows } : d
        );

        return {
          documents,
          activeDocId: state.activeDocId,
          rows: state.rows,
          selectedId: state.selectedId,
          selectedType: state.selectedType,
          device: state.device,
          globalFont: state.globalFont,
          customFonts: state.customFonts,
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!state.documents || state.documents.length === 0) {
          state.documents = [makeDocument('My Component')];
        }
        if (!state.activeDocId || !state.documents.find((d) => d.id === state.activeDocId)) {
          state.activeDocId = state.documents[0].id;
        }
        const active = state.documents.find((d) => d.id === state.activeDocId);
        state.rows = active ? active.rows : [];
        state._history = { past: [], future: [] };
        state.selectedId = null;
        state.selectedType = null;

        if (!state.globalFont) {
          state.globalFont = "'Inter', sans-serif";
        }

        if (!Array.isArray(state.customFonts) || state.customFonts.length === 0) {
          state.customFonts = readStoredCustomFonts();
        }
      },
    }
  )
);

// Recursively regenerates every id in a row subtree so duplicated rows
// never share IDs with their originals — dnd-kit requires all IDs to be
// unique across the entire tree at any given time.
function regenerateIds(row) {
  return {
    ...row,
    id: nanoid(),
    cols: row.cols.map((col) => ({
      ...col,
      id: nanoid(),
      elements: col.elements.map((el) => ({
        ...el,
        id: nanoid(),
        // If this element has nested rows (nest-wrapper / container),
        // recurse into them too so nested layouts also get fresh IDs.
        ...(el.rows ? { rows: el.rows.map(regenerateIds) } : {}),
      })),
    })),
  };
}

// Helper used by getSelectedRow (defined outside store to avoid `require`)
function findRowObject(rows, rowId) {
  for (const row of rows) {
    if (row.id === rowId) return row;
    for (const col of row.cols) {
      for (const el of col.elements) {
        if (el.rows) {
          const found = findRowObject(el.rows, rowId);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

// Ensure activeDocId is set even before persisted state hydrates (SSR-safe default)
if (!useBuilderStore.getState().activeDocId) {
  const docs = useBuilderStore.getState().documents;
  useBuilderStore.setState({ activeDocId: docs[0].id, rows: docs[0].rows });
}

export default useBuilderStore;
export { makeElement, defaultElementProps };
