import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as Babel from '@babel/standalone';
import { ArrowLeft, AlertCircle, FileText, LoaderCircle } from 'lucide-react';
import ElementPreview from '../components/ElementPreview';
import ThemeProvider from '../components/ThemeProvider';
import { authenticatedFetch, parseJsonResponse } from '../utils/api';
import { BUILT_IN_PRESET_THEMES, normalizeThemeConfig } from '../utils/themeDefaults';
import { loadGoogleFont } from '../utils/loadGoogleFont';
import { loadCustomFont } from '../utils/fontManager';
import { registerFont } from '../utils/fontLoader';
import { sanitizeRows } from '../utils/jsonImporter';

function getViewportDevice() {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 640) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function findNavbarElementInRows(rows = []) {
  for (const row of rows) {
    for (const col of row.cols || []) {
      for (const el of col.elements || []) {
        if (el.type === 'navbar') return el;
        if (Array.isArray(el.rows)) {
          const nested = findNavbarElementInRows(el.rows);
          if (nested) return nested;
        }
      }
    }
  }
  return null;
}

function findNavbarRowInRows(rows = []) {
  for (const row of rows) {
    for (const col of row.cols || []) {
      if ((col.elements || []).some((el) => el.type === 'navbar')) {
        return row;
      }
    }
  }
  return null;
}

function isDefaultUnconfiguredNavbar(el) {
  if (!el || el.type !== 'navbar') return false;
  const hasCustomUrls = el.linkUrls && Object.keys(el.linkUrls).length > 0;
  return (
    !hasCustomUrls &&
    el.brand === 'Brand' &&
    !el.logoUrl &&
    el.links === 'Home, Features, Pricing, Contact' &&
    !el.submenus &&
    el.bg === '#ffffff' &&
    el.color === '#111827'
  );
}

function findConfiguredSharedNavbar(publishedPages = []) {
  // Prefer a customized navbar (with custom linkUrls, custom brand, logo, or custom links) from Home or most recently updated published page
  const ordered = [...publishedPages].sort((a, b) => {
    const aIsHome = String(a.slug || '').toLowerCase() === 'home' ? -1 : 0;
    const bIsHome = String(b.slug || '').toLowerCase() === 'home' ? -1 : 0;
    if (aIsHome !== bIsHome) return aIsHome - bIsHome;
    return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
  });

  let fallbackNav = null;
  let fallbackRow = null;

  for (const p of ordered) {
    const raw = p.contentJson || {};
    const pRows = Array.isArray(raw.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
    const navEl = findNavbarElementInRows(pRows);
    const navRow = findNavbarRowInRows(pRows);
    if (navEl) {
      if (!fallbackNav) {
        fallbackNav = navEl;
        fallbackRow = navRow;
      }
      if (!isDefaultUnconfiguredNavbar(navEl)) {
        return { navEl, navRow };
      }
    }
  }

  return { navEl: fallbackNav, navRow: fallbackRow };
}

function applySharedNavbarToRows(rows, sharedNav) {
  if (!sharedNav?.navEl) return rows;
  const currentNav = findNavbarElementInRows(rows);

  // If this page has no navbar row at all, prepend the shared navbar row so the header stays consistent across published pages
  if (!currentNav && sharedNav.navRow) {
    return [sharedNav.navRow, ...rows];
  }

  // If this page has an untouched default navbar while another published page has a configured navbar, use the configured navbar
  if (currentNav && isDefaultUnconfiguredNavbar(currentNav) && !isDefaultUnconfiguredNavbar(sharedNav.navEl)) {
    return rows.map((row) => ({
      ...row,
      cols: (row.cols || []).map((col) => ({
        ...col,
        elements: (col.elements || []).map((el) =>
          el.type === 'navbar' ? { ...sharedNav.navEl, id: el.id } : el
        ),
      })),
    }));
  }

  // If this page's navbar doesn't have linkUrls configured yet, inherit linkUrls from the shared navbar
  if (
    currentNav &&
    (!currentNav.linkUrls || Object.keys(currentNav.linkUrls).length === 0) &&
    sharedNav.navEl.linkUrls &&
    Object.keys(sharedNav.navEl.linkUrls).length > 0
  ) {
    return rows.map((row) => ({
      ...row,
      cols: (row.cols || []).map((col) => ({
        ...col,
        elements: (col.elements || []).map((el) =>
          el.type === 'navbar' ? { ...el, linkUrls: sharedNav.navEl.linkUrls } : el
        ),
      })),
    }));
  }

  return rows;
}

function PublishedElement({ el, device, publishedPages, draftPages, onNavigatePublished }) {
  const hideOn = el.hideOn || {};
  const hidden =
    (device === 'mobile' && hideOn.mobile) ||
    (device === 'tablet' && hideOn.tablet) ||
    (device === 'desktop' && hideOn.desktop);
  if (hidden) return null;

  if (el.type === 'container') {
    return (
      <div style={{ width: '100%' }}>
        <PublishedRows
          rows={el.rows || []}
          device={device}
          publishedPages={publishedPages}
          draftPages={draftPages}
          onNavigatePublished={onNavigatePublished}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      <ElementPreview
        el={el}
        isSelected={false}
        device={device}
        publishedPages={publishedPages}
        draftPages={draftPages}
        onNavigatePublished={onNavigatePublished}
      />
    </div>
  );
}

function PublishedCol({ col, device, publishedPages, draftPages, onNavigatePublished }) {
  const horizontalPadding = col.horizontalPadding || {
    desktop: 0,
    tablet: 0,
    mobile: 0,
  };

  const paddingX =
    device === 'mobile'
      ? horizontalPadding.mobile
      : device === 'tablet'
      ? horizontalPadding.tablet
      : horizontalPadding.desktop;

  const badgeElement = (col.elements || []).find((el) => el.type === 'badge');
  const contentElements = (col.elements || []).filter((el) => el.type !== 'badge');

  return (
    <div
      style={{
        flex: col.flex || 1,
        paddingLeft: paddingX * 4,
        paddingRight: paddingX * 4,
      }}
      className="relative flex min-w-0 flex-col gap-3"
    >
      {badgeElement && (
        <div className="absolute top-2 left-2 z-20">
          <ElementPreview
            el={badgeElement}
            isSelected={false}
            device={device}
            publishedPages={publishedPages}
            draftPages={draftPages}
            onNavigatePublished={onNavigatePublished}
          />
        </div>
      )}

      {contentElements.map((el) => (
        <PublishedElement
          key={el.id}
          el={el}
          device={device}
          publishedPages={publishedPages}
          draftPages={draftPages}
          onNavigatePublished={onNavigatePublished}
        />
      ))}
    </div>
  );
}

function PublishedRow({ row, device, publishedPages, draftPages, onNavigatePublished }) {
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
    device === 'mobile'
      ? horizontalPadding.mobile
      : device === 'tablet'
      ? horizontalPadding.tablet
      : horizontalPadding.desktop;

  const paddingY =
    device === 'mobile'
      ? verticalPadding.mobile
      : device === 'tablet'
      ? verticalPadding.tablet
      : verticalPadding.desktop;

  const gap = row.gap || {
    desktop: 4,
    tablet: 3,
    mobile: 2,
  };

  const columnGap =
    device === 'mobile'
      ? gap.mobile
      : device === 'tablet'
      ? gap.tablet
      : gap.desktop;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isStacked ? 'column' : 'row',
        gap: columnGap * 4,
        paddingTop: paddingY * 4,
        paddingBottom: paddingY * 4,
        paddingLeft: paddingX * 4,
        paddingRight: paddingX * 4,
      }}
    >
      {(row.cols || []).map((col) => (
        <PublishedCol
          key={col.id}
          col={col}
          device={device}
          publishedPages={publishedPages}
          draftPages={draftPages}
          onNavigatePublished={onNavigatePublished}
        />
      ))}
    </div>
  );
}

function PublishedRows({ rows, device, publishedPages, draftPages, onNavigatePublished }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {rows.map((row) => (
        <PublishedRow
          key={row.id}
          row={row}
          device={device}
          publishedPages={publishedPages}
          draftPages={draftPages}
          onNavigatePublished={onNavigatePublished}
        />
      ))}
    </div>
  );
}

function GeneratedJsxFrame({ pageName, generatedJSX }) {
  const { previewDocument, error } = useMemo(() => {
    if (!generatedJSX) {
      return { previewDocument: '', error: 'No generated JSX content found.' };
    }
    try {
      let source = generatedJSX;
      const reactImports = [];

      source = source.replace(
        /^\s*import\s+(.+?)\s+from\s+["']react["'];?\s*$/gm,
        (match, imports) => {
          reactImports.push(imports);
          return '';
        }
      );
      source = source.replace(/^\s*import\s+[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, '');
      source = source.replace(/^\s*export\s+default\s+/gm, '');
      source = source.replace(/^\s*export\s+/gm, '');

      let hookNames = [];
      reactImports.forEach((imports) => {
        const match = imports.match(/\{([\s\S]*?)\}/);
        if (match) {
          const names = match[1]
            .split(',')
            .map((item) => item.trim().split(/\s+as\s+/)[0].trim())
            .filter(Boolean);
          hookNames.push(...names);
        }
      });
      hookNames = [...new Set(hookNames)];

      const hookSetup = hookNames.length > 0 ? `const { ${hookNames.join(', ')} } = React;` : '';

      const result = Babel.transform(source, {
        presets: [['react', { runtime: 'classic' }]],
        filename: 'PublishedComponent.jsx',
      });

      const safePageName = String(pageName || 'PublishedComponent').replace(/[^a-zA-Z0-9_$]/g, '') || 'PublishedComponent';

      const runtimeCode = `
        ${hookSetup}
        ${result.code}
        if (typeof ${safePageName} !== "undefined") {
          const root = ReactDOM.createRoot(document.getElementById("root"));
          root.render(React.createElement(${safePageName}));
        }
      `;

      const documentHTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; width: 100%; min-height: 100%; font-family: system-ui, sans-serif; }
    #root { width: 100%; min-height: 100vh; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script>
    const runComponent = new Function("React", "ReactDOM", ${JSON.stringify(runtimeCode)});
    runComponent(React, ReactDOM);
  </script>
</body>
</html>`;

      return { previewDocument: documentHTML, error: '' };
    } catch (err) {
      return { previewDocument: '', error: err.message || 'Unable to render published JSX.' };
    }
  }, [generatedJSX, pageName]);

  if (error) {
    return (
      <div className="p-8 text-center text-rose-600 text-sm">
        <p className="font-semibold">Error rendering published page</p>
        <pre className="mt-2 text-xs bg-rose-50 p-4 rounded-xl inline-block text-left">{error}</pre>
      </div>
    );
  }

  return (
    <iframe
      title={pageName || 'Published Page'}
      sandbox="allow-scripts"
      srcDoc={previewDocument}
      className="w-full min-h-screen border-0 block bg-white"
    />
  );
}

export default function PublishedPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const isDraftView = searchParams.get('mode') === 'draft';
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [publishedPages, setPublishedPages] = useState([]);
  const [draftPages, setDraftPages] = useState([]);
  const [theme, setTheme] = useState(BUILT_IN_PRESET_THEMES[0]);
  const [loading, setLoading] = useState(true);
  const [notFoundReason, setNotFoundReason] = useState('');
  const [device, setDevice] = useState(getViewportDevice);
  const allPagesCacheRef = useRef([]);
  const themesCacheRef = useRef(new Map());

  useEffect(() => {
    const handleResize = () => setDevice(getViewportDevice());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let active = true;
    const normalizedSlug = String(slug || '').trim().toLowerCase();

    const resolveThemeForPage = async (targetPage) => {
      if (!targetPage?.themeId) return BUILT_IN_PRESET_THEMES[0];
      const preset = BUILT_IN_PRESET_THEMES.find((t) => t.id === targetPage.themeId);
      if (preset || String(targetPage.themeId).startsWith('preset-')) {
        return preset || BUILT_IN_PRESET_THEMES[0];
      }
      if (themesCacheRef.current.has(targetPage.themeId)) {
        return themesCacheRef.current.get(targetPage.themeId);
      }
      try {
        const themeRes = await authenticatedFetch(`/api/themes/${targetPage.themeId}`);
        if (themeRes.ok) {
          const themeJson = await parseJsonResponse(themeRes, 'Could not load theme.');
          if (themeJson?.data) {
            const resolved = {
              ...themeJson.data,
              configJson: normalizeThemeConfig(themeJson.data.configJson),
            };
            themesCacheRef.current.set(targetPage.themeId, resolved);
            return resolved;
          }
        }
      } catch {
        // Fallback to default preset theme if theme fetch fails
      }
      return BUILT_IN_PRESET_THEMES[0];
    };

    const applyPagesForSlug = async (allPages) => {
      const onlyPublishedPages = allPages.filter((p) => p.status === 'PUBLISHED');
      const onlyDraftPages = allPages.filter((p) => p.status === 'DRAFT');
      const matchedPage =
        onlyPublishedPages.find(
          (p) => String(p.slug || '').trim().toLowerCase() === normalizedSlug
        ) ||
        allPages.find(
          (p) => String(p.slug || '').trim().toLowerCase() === normalizedSlug
        );

      if (!matchedPage) {
        if (active) {
          setPage(null);
          setPublishedPages(onlyPublishedPages);
          setDraftPages(onlyDraftPages);
          setNotFoundReason(`No page was found with the route "/${slug}".`);
        }
        return false;
      }

      if (matchedPage.status !== 'PUBLISHED' && !isDraftView) {
        if (active) {
          setPage(null);
          setPublishedPages(onlyPublishedPages);
          setDraftPages(onlyDraftPages);
          setNotFoundReason(`The page "${matchedPage.name}" (/${matchedPage.slug}) is currently Unpublished and has not been published yet.`);
        }
        return false;
      }

      const resolvedTheme = await resolveThemeForPage(matchedPage);

      if (active) {
        setPage(matchedPage);
        setPublishedPages(onlyPublishedPages);
        setDraftPages(onlyDraftPages);
        setTheme(resolvedTheme);
        setNotFoundReason('');
        document.title = `${matchedPage.name} — ${isDraftView || matchedPage.status === 'DRAFT' ? 'Draft Page' : 'Published Page'}`;
      }
      return true;
    };

    const fetchPublishedPage = async () => {
      const cachedPages = allPagesCacheRef.current;
      let renderedFromCache = false;

      if (cachedPages.length > 0) {
        renderedFromCache = await applyPagesForSlug(cachedPages);
        if (active && renderedFromCache) {
          setLoading(false);
        }
      } else {
        setLoading(true);
        setNotFoundReason('');
      }

      try {
        const res = await authenticatedFetch('/api/pages');
        const json = await parseJsonResponse(res, 'Could not load pages.');
        const allPages = Array.isArray(json.data) ? json.data : [];
        allPagesCacheRef.current = allPages;
        await applyPagesForSlug(allPages);
      } catch (err) {
        if (active && !renderedFromCache) {
          setNotFoundReason(err.message || 'Could not load the published page.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPublishedPage();
    return () => {
      active = false;
    };
  }, [slug, isDraftView]);

  const rawContent = page?.contentJson || {};
  const globalFont = rawContent.globalFont || "'Inter', sans-serif";

  useEffect(() => {
    if (globalFont) {
      loadGoogleFont(globalFont);
    }
    if (Array.isArray(rawContent.customFonts)) {
      rawContent.customFonts.forEach((font) => {
        if (font?.name) {
          registerFont(font.name, font);
          if (font.dataUrl || font.file) {
            loadCustomFont(font);
          }
        }
      });
    }
  }, [globalFont, rawContent.customFonts]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-2.5">
        <LoaderCircle size={26} className="animate-spin text-blue-600" />
        <p className="text-xs font-medium">Loading published page...</p>
      </div>
    );
  }

  if (!page || notFoundReason) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-xs p-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Page Unavailable</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {notFoundReason || 'This page does not exist or is not published.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/pages')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Pages</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (rawContent.type === 'generated-jsx') {
    return <GeneratedJsxFrame pageName={page.name} generatedJSX={rawContent.jsx} />;
  }

  const rawRows = Array.isArray(rawContent.rows)
    ? rawContent.rows
    : Array.isArray(rawContent)
    ? rawContent
    : [];
  const sharedNav = findConfiguredSharedNavbar(publishedPages);
  const rowsWithSharedHeader = applySharedNavbarToRows(rawRows, sharedNav);
  const rows = sanitizeRows(rowsWithSharedHeader);

  return (
    <ThemeProvider
      theme={theme}
      scope=".published-theme-canvas"
      style={{
        fontFamily: globalFont,
        backgroundColor: 'var(--theme-bg, #ffffff)',
        color: 'var(--theme-text, #0f172a)',
      }}
      className="published-theme-canvas min-h-screen w-full flex flex-col"
    >
      <div className="flex-1 w-full">
        {rows.length === 0 ? (
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <FileText size={22} />
            </div>
            <p className="text-sm font-semibold text-slate-700">{page.name}</p>
            <p className="text-xs text-slate-400 mt-1">This published page has no content rows yet.</p>
          </div>
        ) : (
          <PublishedRows
            rows={rows}
            device={device}
            publishedPages={publishedPages}
            draftPages={draftPages}
            onNavigatePublished={(targetPath) => navigate(targetPath)}
          />
        )}
      </div>
    </ThemeProvider>
  );
}
