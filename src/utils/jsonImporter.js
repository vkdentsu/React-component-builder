import { nanoid } from './nanoid';

/**
 * Counts all elements in a list of rows recursively, including nested containers.
 */
export function countElements(rows = []) {
  if (!Array.isArray(rows)) return 0;
  let count = 0;
  for (const row of rows) {
    if (row && Array.isArray(row.cols)) {
      for (const col of row.cols) {
        if (col && Array.isArray(col.elements)) {
          for (const el of col.elements) {
            count += 1;
            if (el && Array.isArray(el.rows)) {
              count += countElements(el.rows);
            }
          }
        }
      }
    }
  }
  return count;
}

/**
 * Ensures all rows, columns, and elements have unique IDs and required structural defaults.
 */
export function sanitizeRows(rows = [], existingIds = new Set()) {
  if (!Array.isArray(rows)) return [];

  const getUniqueId = (id) => {
    if (id && !existingIds.has(id)) {
      existingIds.add(id);
      return id;
    }
    const fresh = nanoid();
    existingIds.add(fresh);
    return fresh;
  };

  const sanitizeElement = (el) => {
    if (!el || typeof el !== 'object') return null;
    const id = getUniqueId(el.id);
    const sanitized = {
      ...el,
      id,
      hideOn: el.hideOn || { mobile: false, tablet: false, desktop: false },
    };

    if (Array.isArray(el.rows)) {
      sanitized.rows = sanitizeRows(el.rows, existingIds);
    }
    return sanitized;
  };

  const sanitizeCol = (col) => {
    if (!col || typeof col !== 'object') {
      return { id: getUniqueId(), flex: 1, elements: [] };
    }
    const id = getUniqueId(col.id);
    const elements = Array.isArray(col.elements)
      ? col.elements.map(sanitizeElement).filter(Boolean)
      : [];
    return {
      ...col,
      id,
      flex: typeof col.flex === 'number' ? col.flex : 1,
      elements,
    };
  };

  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => {
      const id = getUniqueId(row.id);
      const cols = Array.isArray(row.cols) && row.cols.length > 0
        ? row.cols.map(sanitizeCol)
        : [{ id: getUniqueId(), flex: 1, elements: [] }];

      return {
        ...row,
        id,
        gap: row.gap || { desktop: 4, tablet: 3, mobile: 2 },
        stackOnMobile: row.stackOnMobile ?? true,
        verticalPadding: row.verticalPadding || { desktop: 2, tablet: 2, mobile: 2 },
        horizontalPadding: row.horizontalPadding || { desktop: 4, tablet: 3, mobile: 2 },
        cols,
      };
    });
}

/**
 * Parses and validates raw input (string or parsed object).
 * Returns { isValid, data, summary } or { isValid: false, error }.
 */
export function validateImportJson(rawInput) {
  if (!rawInput) {
    return { isValid: false, error: 'Input is empty.' };
  }

  let parsed;
  if (typeof rawInput === 'string') {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return { isValid: false, error: 'JSON string is empty.' };
    }
    try {
      parsed = JSON.parse(trimmed);
    } catch (err) {
      return { isValid: false, error: `Invalid JSON format: ${err.message}` };
    }
  } else if (typeof rawInput === 'object') {
    parsed = rawInput;
  } else {
    return { isValid: false, error: 'Expected a JSON string or object.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { isValid: false, error: 'JSON must be an object or array.' };
  }

  // Support zustand persist format: { state: { ... } }
  const payload = parsed.state && typeof parsed.state === 'object' ? parsed.state : parsed;

  // Pattern 1: Full project state with multiple documents
  if (Array.isArray(payload.documents) && payload.documents.length > 0) {
    const totalElements = payload.documents.reduce(
      (sum, d) => sum + countElements(d.rows || []),
      0
    );
    const totalRows = payload.documents.reduce(
      (sum, d) => sum + (Array.isArray(d.rows) ? d.rows.length : 0),
      0
    );

    return {
      isValid: true,
      data: payload,
      type: 'full-project',
      summary: {
        type: 'Full Project State',
        documentsCount: payload.documents.length,
        rowsCount: totalRows,
        elementsCount: totalElements,
        documentNames: payload.documents.map((d) => d.name || 'Untitled').slice(0, 5),
        globalFont: payload.globalFont,
      },
    };
  }

  // Pattern 2: Single document object with { rows: [...] }
  if (Array.isArray(payload.rows)) {
    const elCount = countElements(payload.rows);
    return {
      isValid: true,
      data: payload,
      type: 'document',
      summary: {
        type: 'Component Document',
        name: payload.name || 'Imported Component',
        rowsCount: payload.rows.length,
        elementsCount: elCount,
        globalFont: payload.globalFont,
      },
    };
  }

  // Pattern 3: Direct array of rows: [ { id, cols, ... } ]
  if (Array.isArray(payload)) {
    // Check if items look like rows (having cols or elements or row-like structure)
    const isLikelyRows = payload.length === 0 || payload.some((item) => item && (item.cols || item.id));
    if (isLikelyRows) {
      const elCount = countElements(payload);
      return {
        isValid: true,
        data: { name: 'Imported Rows', rows: payload },
        type: 'rows',
        summary: {
          type: 'Rows Array',
          name: 'Imported Rows',
          rowsCount: payload.length,
          elementsCount: elCount,
        },
      };
    }
  }

  return {
    isValid: false,
    error: 'Unrecognized JSON structure. Expected component rows array, a document with a "rows" field, or full project state.',
  };
}
