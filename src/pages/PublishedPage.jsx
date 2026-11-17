import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
    RefreshCw,
    AlertCircle,
    ArrowLeft,
    Edit3,
    Globe,
    Eye,
    EyeOff,
    CheckCircle2,
    Share2,
} from "lucide-react";
import { authenticatedFetch } from "../utils/api";
import { hasUnexpiredAuthToken } from "../utils/auth";
import { PreviewRows } from "../components/PreviewModal";
import ThemeProvider from "../components/ThemeProvider";
import { loadGoogleFont } from "../utils/loadGoogleFont";
import { buildGeneratedPreviewDocument } from "../utils/generatedPreview";
import { BUILT_IN_PRESET_THEMES, mergeThemes } from "../utils/themeDefaults";
import useBuilderStore from "../store/builderStore";

export default function PublishedPage() {
    const { idOrSlug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [page, setPage] = useState(location.state?.page || null);
    const [loading, setLoading] = useState(Boolean(idOrSlug && !location.state?.page));
    const [error, setError] = useState(null);
    const [showAuthorBar, setShowAuthorBar] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);
    const [copied, setCopied] = useState(false);

    const isAuthor = hasUnexpiredAuthToken();

    // Window width tracking for responsive layout
    const [windowWidth, setWindowWidth] = useState(
        typeof window !== "undefined" ? window.innerWidth : 1200
    );

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const device = useMemo(() => {
        if (windowWidth < 640) return "mobile";
        if (windowWidth < 1024) return "tablet";
        return "desktop";
    }, [windowWidth]);

    // Load page data using existing FE-accessible endpoints
    useEffect(() => {
        if (!idOrSlug) return;
        if (page && (page.id === idOrSlug || page.slug === idOrSlug)) {
            return;
        }

        let isCancelled = false;

        const fetchPage = async () => {
            try {
                let fetched = null;

                // 1. Try fetching directly by ID
                try {
                    const res = await authenticatedFetch(`/api/pages/${encodeURIComponent(idOrSlug)}`);
                    if (res.ok) {
                        const json = await res.json();
                        if (json.data) fetched = json.data;
                    }
                } catch {
                    // Fallback to searching pages list
                }

                // 2. Fallback: Search in user's pages list by ID or slug
                if (!fetched) {
                    try {
                        const listRes = await authenticatedFetch('/api/pages');
                        if (listRes.ok) {
                            const json = await listRes.json();
                            const matched = (json.data || []).find(
                                (p) => p.id === idOrSlug || p.slug === idOrSlug
                            );
                            if (matched) fetched = matched;
                        }
                    } catch {
                        // Ignore
                    }
                }

                if (!fetched) {
                    throw new Error("This page was not found in your pages list.");
                }

                if (!isCancelled) {
                    setPage(fetched);
                    setLoading(false);
                }
            } catch (err) {
                if (!isCancelled) {
                    setError(err.message || "Failed to load page.");
                    setLoading(false);
                }
            }
        };

        fetchPage();

        return () => {
            isCancelled = true;
        };
    }, [idOrSlug, isAuthor, page]);

    // Ensure themes are fetched in store for theme styling
    useEffect(() => {
        const store = useBuilderStore.getState();
        if (!store.availableThemes || store.availableThemes.length === 0) {
            store.fetchThemes?.();
        }
    }, []);

    // Update document title
    useEffect(() => {
        if (page?.name) {
            document.title = `${page.name} | Published Page`;
        }
        return () => {
            document.title = "Compify";
        };
    }, [page?.name]);

    // Handle fonts
    useEffect(() => {
        const font = page?.contentJson?.globalFont || page?.theme?.configJson?.typography?.fontFamily;
        if (font) {
            loadGoogleFont(font);
        }
    }, [page]);

    // Theme resolution
    const resolvedTheme = useMemo(() => {
        if (!page) return null;
        if (page.theme && page.theme.configJson) {
            return page.theme;
        }
        const availableThemes = mergeThemes(
            useBuilderStore.getState().availableThemes || [],
            BUILT_IN_PRESET_THEMES
        );
        return availableThemes.find((t) => t.id === page.themeId) || page.theme || availableThemes[0];
    }, [page]);

    // Generated JSX Preview Document
    const isDesignConverted = page?.contentJson?.type === "generated-jsx";
    const { previewDoc, previewErr } = useMemo(() => {
        if (!isDesignConverted || !page?.contentJson?.jsx) {
            return { previewDoc: "", previewErr: "" };
        }
        try {
            return {
                previewDoc: buildGeneratedPreviewDocument(page.name, page.contentJson.jsx),
                previewErr: "",
            };
        } catch (err) {
            return {
                previewDoc: "",
                previewErr: err.message || "Could not render JSX component.",
            };
        }
    }, [isDesignConverted, page]);

    // Handle publish action for draft page
    const handlePublish = async () => {
        if (!page) return;
        setIsPublishing(true);
        try {
            const res = await authenticatedFetch(`/api/pages/${page.id}/publish`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error?.message || "Failed to publish page.");
            }
            setPage((prev) => ({ ...prev, status: "PUBLISHED" }));
        } catch (err) {
            alert(err.message || "Failed to publish page.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleShare = () => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(window.location.href);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleEdit = () => {
        if (isDesignConverted) {
            navigate("/preview", {
                state: {
                    pageName: page.name,
                    generatedJSX: page.contentJson.jsx,
                },
            });
        } else {
            navigate(`/custom-builder?pageId=${encodeURIComponent(page.id)}`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
                <RefreshCw size={28} className="animate-spin text-blue-600 mb-3" />
                <p className="text-sm font-medium">Loading published page...</p>
            </div>
        );
    }

    const displayError = !idOrSlug ? "No page identifier provided." : error;

    if (displayError || !page) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                    <AlertCircle size={28} />
                </div>
                <h1 className="text-xl font-bold text-slate-800 mb-2">Page Not Found</h1>
                <p className="text-sm text-slate-500 max-w-md mb-6">
                    {displayError || "The requested published page could not be found."}
                </p>
                <button
                    onClick={() => navigate(isAuthor ? "/pages" : "/")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm transition-all"
                >
                    <ArrowLeft size={14} />
                    <span>{isAuthor ? "Back to Pages" : "Go to Home"}</span>
                </button>
            </div>
        );
    }

    const rows = Array.isArray(page.contentJson?.rows)
        ? page.contentJson.rows
        : Array.isArray(page.contentJson)
            ? page.contentJson
            : [];

    return (
        <div className="min-h-screen bg-white flex flex-col relative selection:bg-blue-100">
            {/* Top Author Navigation Bar (Only for signed-in author) */}
            {isAuthor && showAuthorBar && (
                <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md text-white border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-xs gap-3 shadow-md">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button
                            onClick={() => navigate("/pages")}
                            title="Return to Pages Management"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-colors"
                        >
                            <ArrowLeft size={13} />
                            <span className="hidden sm:inline">Pages</span>
                        </button>

                        <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-slate-100 truncate max-w-[180px] sm:max-w-xs">
                                {page.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                                /{page.slug}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    page.status === "PUBLISHED"
                                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                        : "bg-amber-950 text-amber-400 border border-amber-800"
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        page.status === "PUBLISHED" ? "bg-emerald-400" : "bg-amber-400"
                                    }`}
                                />
                                {page.status === "PUBLISHED" ? "Published" : "Draft Preview"}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {page.status === "DRAFT" && (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors disabled:opacity-50"
                            >
                                <Globe size={13} />
                                <span>{isPublishing ? "Publishing..." : "Publish Page"}</span>
                            </button>
                        )}

                        <button
                            onClick={handleEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                        >
                            <Edit3 size={13} />
                            <span className="hidden sm:inline">Edit in Builder</span>
                            <span className="sm:hidden">Edit</span>
                        </button>

                        <button
                            onClick={handleShare}
                            title="Copy Published Link"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                        >
                            {copied ? <CheckCircle2 size={13} className="text-emerald-400" /> : <Share2 size={13} />}
                            <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
                        </button>

                        <button
                            onClick={() => setShowAuthorBar(false)}
                            title="Hide bar for 100% clean view"
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
                        >
                            <EyeOff size={14} />
                        </button>
                    </div>
                </header>
            )}

            {/* Floating button to restore author bar if hidden */}
            {isAuthor && !showAuthorBar && (
                <button
                    onClick={() => setShowAuthorBar(true)}
                    title="Show Author Controls"
                    className="fixed top-4 right-4 z-50 p-2.5 rounded-full bg-slate-900/90 text-white shadow-xl hover:bg-slate-950 border border-slate-700 transition-all opacity-80 hover:opacity-100"
                >
                    <Eye size={16} />
                </button>
            )}

            {/* Published Content View */}
            <main className="flex-1 w-full">
                {isDesignConverted ? (
                    previewErr ? (
                        <div className="p-8 max-w-xl mx-auto text-center">
                            <p className="text-sm text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-200">
                                {previewErr}
                            </p>
                        </div>
                    ) : (
                        <iframe
                            title={`${page.name} published view`}
                            sandbox="allow-scripts"
                            srcDoc={previewDoc}
                            className="w-full min-h-screen border-none block"
                        />
                    )
                ) : rows.length === 0 ? (
                    <div className="py-24 px-6 text-center text-slate-400">
                        <span className="text-4xl mb-3 block">🎨</span>
                        <h2 className="text-base font-semibold text-slate-700 mb-1">Page has no content yet</h2>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                            This page was published without any rows or elements. Return to the Component Builder to add elements.
                        </p>
                    </div>
                ) : (
                    <ThemeProvider
                        theme={resolvedTheme}
                        className="w-full min-h-screen"
                        style={{
                            backgroundColor: "var(--theme-bg, #ffffff)",
                            color: "var(--theme-text, #0f172a)",
                            fontFamily: page.contentJson?.globalFont || undefined,
                        }}
                    >
                        <div className="w-full">
                            <PreviewRows rows={rows} device={device} />
                        </div>
                    </ThemeProvider>
                )}
            </main>
        </div>
    );
}
