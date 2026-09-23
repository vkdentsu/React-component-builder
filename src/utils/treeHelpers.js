// Generic recursive helpers for the layout tree.
//
// Shape:
//   rows: [ { id, cols: [ { id, flex, elements: [ element, ... ] }, ... ], ... } ]
//   element: { id, type, ...props, rows?: [...] }  // 'container' elements have nested rows
//
// `hops` is an array of container-element-ids describing a path from the root
// down to the rows-array that directly contains a given row/col.

export function getRowsAtHops(rootRows, hops) {
  let rows = rootRows;
  for (const hop of hops) {
    let found = null;
    outer: for (const row of rows) {
      for (const col of row.cols) {
        const el = col.elements.find((e) => e.id === hop);
        if (el) { found = el; break outer; }
      }
    }
    if (!found || !found.rows) return [];
    rows = found.rows;
  }
  return rows;
}

export function setRowsAtHops(rootRows, hops, newRows) {
  if (hops.length === 0) return newRows;
  const [hop, ...rest] = hops;
  return rootRows.map((row) => ({
    ...row,
    cols: row.cols.map((col) => ({
      ...col,
      elements: col.elements.map((el) =>
        el.id === hop ? { ...el, rows: setRowsAtHops(el.rows || [], rest, newRows) } : el
      ),
    })),
  }));
}

export function updateRowsAtLocation(rootRows, hops, updater) {
  const local = getRowsAtHops(rootRows, hops);
  const updated = updater(local);
  return setRowsAtHops(rootRows, hops, updated);
}

// Find the {hops, rowId, colId} of the column containing element `elId`.
export function findLocation(rows, elId, hops = []) {
  for (const row of rows) {
    for (const col of row.cols) {
      if (col.elements.some((e) => e.id === elId)) {
        return { hops, rowId: row.id, colId: col.id };
      }
      for (const el of col.elements) {
        if (el.rows) {
          const sub = findLocation(el.rows, elId, [...hops, el.id]);
          if (sub) return sub;
        }
      }
    }
  }
  return null;
}

// Find the {hops, rowId, colId} of column `colId` itself.
export function findColLocation(rows, colId, hops = []) {
  for (const row of rows) {
    for (const col of row.cols) {
      if (col.id === colId) return { hops, rowId: row.id, colId };
      for (const el of col.elements) {
        if (el.rows) {
          const sub = findColLocation(el.rows, colId, [...hops, el.id]);
          if (sub) return sub;
        }
      }
    }
  }
  return null;
}

// Find the {hops} of row `rowId` (hops = path to the rows-array containing it).
export function findRowLocation(rows, rowId, hops = []) {
  for (const row of rows) {
    if (row.id === rowId) return { hops };
    for (const col of row.cols) {
      for (const el of col.elements) {
        if (el.rows) {
          const sub = findRowLocation(el.rows, rowId, [...hops, el.id]);
          if (sub) return sub;
        }
      }
    }
  }
  return null;
}

// Deep search for an element object by id (returns the element itself).
export function findElementById(rows, elId) {
  for (const row of rows) {
    for (const col of row.cols) {
      for (const el of col.elements) {
        if (el.id === elId) return el;
        if (el.rows) {
          const found = findElementById(el.rows, elId);
          if (found) return found;
        }
      }
    }
  }
  return null;
}

// Build a `col::` droppable id, encoding hops so nested containers get unique ids.
export function colDroppableId(hops, rowId, colId) {
  return `col::${hops.join(',')}::${rowId}::${colId}`;
}

export function parseColDroppableId(id) {
  // format: col::<hopsCsv>::<rowId>::<colId>
  const parts = id.split('::');
  if (parts.length !== 4 || parts[0] !== 'col') return null;
  const hopsCsv = parts[1];
  const hops = hopsCsv === '' ? [] : hopsCsv.split(',');
  return { hops, rowId: parts[2], colId: parts[3] };
}

// Build a root canvas droppable id for a (possibly nested) rows array.
export function rootDroppableId(hops) {
  return hops.length === 0 ? 'canvas-root' : `root::${hops.join(',')}`;
}

export function parseRootDroppableId(id) {
  if (id === 'canvas-root') return { hops: [] };
  if (id.startsWith('root::')) {
    const hopsCsv = id.slice('root::'.length);
    return { hops: hopsCsv === '' ? [] : hopsCsv.split(',') };
  }
  return null;
}
