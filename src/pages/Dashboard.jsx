import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    FileText,
    Palette,
    Image as ImageIcon,
    Settings,
    Plus,
    Search,
    Edit3,
    Trash2,
    Copy,
    ChevronDown,
    User,
    Sliders,
    Sparkles,
    HelpCircle,
    LogOut,
    X,
    AlertCircle,
    CheckCircle2,
    Database,
    Activity,
    Code2,
    RefreshCw,
    Globe,
    Upload,
} from 'lucide-react';
import { authenticatedFetch, getApiUrl } from '../utils/api';
import { clearAuthSession } from '../utils/auth';

export default function Dashboard({ initialTab = 'dashboard' }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Tab State: dashboard | pages | themes | media | settings
    const determineInitialTab = () => {
        if (initialTab && ['dashboard', 'pages', 'themes', 'media', 'settings'].includes(initialTab)) {
            return initialTab;
        }
        const path = location.pathname.replace('/', '').toLowerCase();
        if (['dashboard', 'pages', 'themes', 'media', 'settings'].includes(path)) {
            return path;
        }
        return 'dashboard';
    };

    const [activeTab, setActiveTab] = useState(determineInitialTab);
    const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
    if (prevInitialTab !== initialTab) {
        setPrevInitialTab(initialTab);
        setActiveTab(determineInitialTab());
    }

    const [profileOpen, setProfileOpen] = useState(false);
    const profileRef = useRef(null);

    // Database Data States
    const [pages, setPages] = useState([]);
    const [themes, setThemes] = useState([]);
    const [health, setHealth] = useState({ status: 'checking', database: 'checking' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Search & Filter for Pages
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL | DRAFT | PUBLISHED

    // Create Page Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [newPageName, setNewPageName] = useState('');
    const [newPageSlug, setNewPageSlug] = useState('');
    const [creatingPage, setCreatingPage] = useState(false);
    const [createError, setCreateError] = useState('');

    // Delete Confirmation Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [pageToDelete, setPageToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Notification Toast
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Click outside listener for profile dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch initial data
    const loadData = () => {
        setLoading(true);
        setError(null);
        return Promise.all([
            authenticatedFetch('/api/pages').then((r) => r.json()),
            authenticatedFetch('/api/themes').then((r) => r.json()),
            fetch(getApiUrl('/api/health')).then((r) => r.json()).catch(() => ({ status: 'error', database: 'unavailable' })),
        ]).then(([pagesRes, themesRes, healthRes]) => {
            if (pagesRes.data) setPages(pagesRes.data);
            if (themesRes.data) {
                setThemes(themesRes.data);
            }
            if (healthRes) setHealth(healthRes);
        }).catch((err) => {
            console.error('Failed to load dashboard data:', err);
            setError('Could not connect to the backend API. Please make sure the server is running on port 3001.');
        }).finally(() => {
            setLoading(false);
        });
    };

    const handleRefresh = () => {
        loadData();
    };

    useEffect(() => {
        let isMounted = true;
        Promise.all([
            authenticatedFetch('/api/pages').then((r) => r.json()),
            authenticatedFetch('/api/themes').then((r) => r.json()),
            fetch(getApiUrl('/api/health')).then((r) => r.json()).catch(() => ({ status: 'error', database: 'unavailable' })),
        ]).then(([pagesRes, themesRes, healthRes]) => {
            if (!isMounted) return;
            if (pagesRes.data) setPages(pagesRes.data);
            if (themesRes.data) {
                setThemes(themesRes.data);
            }
            if (healthRes) setHealth(healthRes);
            setLoading(false);
        }).catch((err) => {
            console.error('Failed to load dashboard data:', err);
            if (isMounted) {
                setError('Could not connect to the backend API. Please make sure the server is running on port 3001.');
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    // Handle auto-slug creation
    const handleNameChange = (val) => {
        setNewPageName(val);
        const slugified = val
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        setNewPageSlug(slugified);
    };

    // Create Page Handler
    const handleCreatePage = async (e) => {
        e.preventDefault();
        if (!newPageName.trim()) {
            setCreateError('Please enter a page name.');
            return;
        }
        if (!newPageSlug.trim()) {
            setCreateError('Please enter a page slug.');
            return;
        }

        setCreatingPage(true);
        setCreateError('');

        try {
            // Find fallback theme if required by current Prisma schema
            let themeIdToUse = themes[0]?.id;
            if (!themeIdToUse) {
                try {
                    const themesRes = await authenticatedFetch('/api/themes').then((r) => r.json());
                    themeIdToUse = themesRes.data?.[0]?.id;
                } catch (themeErr) {
                    console.warn('Could not fetch default theme:', themeErr);
                }
            }

            const res = await authenticatedFetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newPageName.trim(),
                    slug: newPageSlug.trim(),
                    ...(themeIdToUse ? { themeId: themeIdToUse } : {}),
                    contentJson: { rows: [] },
                    status: 'DRAFT',
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to create page');
            }

            setCreateModalOpen(false);
            setNewPageName('');
            setNewPageSlug('');
            showToast(`Page "${json.data.name}" created! Opening builder...`);

            // Refresh list and navigate to builder with newly created page id
            await loadData();
            navigate(`/custom-builder?pageId=${json.data.id}`);
        } catch (err) {
            setCreateError(err.message);
        } finally {
            setCreatingPage(false);
        }
    };

    // Delete Page Handler
    const confirmDelete = async () => {
        if (!pageToDelete) return;
        setDeleting(true);
        try {
            const res = await authenticatedFetch(`/api/pages/${pageToDelete.id}`, {
                method: 'DELETE',
            });
            if (!res.ok && res.status !== 204) {
                throw new Error('Failed to delete page');
            }

            setPages((prev) => prev.filter((p) => p.id !== pageToDelete.id));
            setDeleteModalOpen(false);
            showToast(`Page "${pageToDelete.name}" deleted successfully.`);
            setPageToDelete(null);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setDeleting(false);
        }
    };

    // Duplicate Page Handler
    const handleDuplicate = async (page) => {
        try {
            const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
            const newName = `${page.name} Copy`;
            const newSlug = `${page.slug}-copy-${uniqueSuffix}`;

            const res = await authenticatedFetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    slug: newSlug,
                    themeId: page.themeId,
                    contentJson: page.contentJson || { rows: [] },
                    status: 'DRAFT',
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to duplicate page');
            }

            showToast(`Page duplicated as "${newName}"`);
            await loadData();
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Toggle Publish Status
    const handleTogglePublish = async (page) => {
        try {
            const newStatus = page.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
            let res;
            if (newStatus === 'PUBLISHED') {
                res = await authenticatedFetch(`/api/pages/${page.id}/publish`, { method: 'POST' });
            } else {
                res = await authenticatedFetch(`/api/pages/${page.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'DRAFT' }),
                });
            }

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error?.message || 'Failed to update page status');
            }

            setPages((prev) =>
                prev.map((p) => (p.id === page.id ? { ...p, status: newStatus } : p))
            );
            showToast(`Page status changed to ${newStatus}`);
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Filtered pages for table/cards
    const filteredPages = useMemo(() => {
        return pages.filter((page) => {
            const matchesSearch =
                page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                page.slug.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus =
                statusFilter === 'ALL' ? true : page.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [pages, searchQuery, statusFilter]);

    // Quick stats
    const publishedCount = pages.filter((p) => p.status === 'PUBLISHED').length;
    const draftCount = pages.filter((p) => p.status === 'DRAFT').length;

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-slate-800">
            {/* Toast Alert */}
            {toast && (
                <div
                    className={`fixed bottom-5 left-8 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-medium transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${toast.type === 'error'
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                        }`}
                >
                    {toast.type === 'error' ? (
                        <AlertCircle size={18} />
                    ) : (
                        <CheckCircle2 size={18} />
                    )}
                    <span>{toast.message}</span>
                    <button
                        onClick={() => setToast(null)}
                        className="ml-2 text-white/80 hover:text-white"
                    >
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Main Content Area (Spacious & Responsive) */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Top Header with Breadcrumb and User Profile Section */}
                <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/')}
                            className="text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
                        >
                            Compify
                        </button>
                        <span className="text-slate-300">/</span>
                        <span className="text-sm font-semibold capitalize text-slate-800">
                            {activeTab}
                        </span>
                    </div>

                    {/* User Profile Section (Top-Right) */}
                    <div className="relative" ref={profileRef}>
                        <button
                            onClick={() => setProfileOpen((o) => !o)}
                            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            aria-label="User account menu"
                        >
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                                AU
                            </div>
                            <span className="text-xs font-medium text-slate-700 hidden sm:inline">
                                Admin User
                            </span>
                            <ChevronDown
                                size={14}
                                className={`text-slate-400 transition-transform duration-150 ${profileOpen ? 'rotate-180' : ''
                                    }`}
                            />
                        </button>

                        {/* User Profile Dropdown Menu */}
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-xs font-semibold text-slate-800">
                                        Admin User
                                    </p>
                                    <p className="text-[11px] text-slate-400">admin@compify.dev</p>
                                </div>

                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            showToast('User Profile modal (placeholder)');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                    >
                                        <User size={15} className="text-slate-400" />
                                        <span>My Profile</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            showToast('Account Settings modal (placeholder)');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                    >
                                        <Sliders size={15} className="text-slate-400" />
                                        <span>Account Settings</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            showToast('Preferences modal (placeholder)');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                    >
                                        <Sparkles size={15} className="text-slate-400" />
                                        <span>Preferences</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            showToast('Help & Support opened (placeholder)');
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                                    >
                                        <HelpCircle size={15} className="text-slate-400" />
                                        <span>Help & Support</span>
                                    </button>
                                </div>

                                <div className="border-t border-slate-100 pt-1 mt-1">
                                    <button
                                        onClick={() => {
                                            setProfileOpen(false);
                                            clearAuthSession();
                                            navigate('/login', { replace: true });
                                        }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <LogOut size={15} className="text-rose-500" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Content Body */}
                <div className="p-6 sm:p-8 max-w-7xl mx-auto w-full flex-1">
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-3">
                            <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                            <div className="text-xs">
                                <p className="font-semibold">{error}</p>
                                <p className="mt-1 text-amber-700">
                                    You can still browse the interface, and pages created will attempt to save once the backend is reachable.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 1: DASHBOARD OVERVIEW                                                 */}
                    {/* ========================================================================= */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8 animate-in fade-in duration-200">
                            {/* Welcome Banner */}
                            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10 max-w-2xl">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-medium tracking-wide mb-3">
                                        <Activity size={12} />
                                        <span>SYSTEM DASHBOARD</span>
                                    </div>
                                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                        Welcome to Compify Dashboard
                                    </h1>
                                    <p className="mt-2 text-blue-100 text-sm leading-relaxed">
                                        Centralized hub to manage your website pages, design themes, media assets, and configuration. Create and customize live React components with our drag-and-drop builder.
                                    </p>
                                    <div className="mt-6 flex flex-wrap gap-3">
                                        <button
                                            onClick={() => setCreateModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-xs shadow-sm hover:bg-blue-50 transition-all hover:scale-[1.02]"
                                        >
                                            <Plus size={15} />
                                            <span>Create Page</span>
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('pages')}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700/60 hover:bg-blue-700 text-white font-medium text-xs border border-white/20 transition-all"
                                        >
                                            <FileText size={15} />
                                            <span>View Pages</span>
                                        </button>
                                        <button
                                            onClick={() => navigate('/custom-builder')}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all"
                                        >
                                            <Code2 size={15} />
                                            <span>Open Free Builder</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Overview Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">Total Pages</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {loading ? '...' : pages.length}
                                        </p>
                                        <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                            <CheckCircle2 size={11} /> Database synced
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText size={22} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">Published Pages</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {loading ? '...' : publishedCount}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">Live in project</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <Globe size={22} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">Draft Pages</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {loading ? '...' : draftCount}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">In progress</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                        <Edit3 size={22} />
                                    </div>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">Active Themes</p>
                                        <p className="text-2xl font-bold text-slate-800 mt-1">
                                            {loading ? '...' : themes.length}
                                        </p>
                                        <p className="text-[11px] text-blue-600 font-medium mt-1">
                                            Available in database
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                        <Palette size={22} />
                                    </div>
                                </div>
                            </div>

                            {/* Recently Created / Updated Pages */}
                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                                <div className="p-5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Recently Created or Updated Pages
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Pages saved in your PostgreSQL database
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setActiveTab('pages')}
                                        className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                    >
                                        View All ({pages.length})
                                    </button>
                                </div>

                                {loading ? (
                                    <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-xs">
                                        <RefreshCw className="animate-spin mb-2" size={18} />
                                        <span>Loading database records...</span>
                                    </div>
                                ) : pages.length === 0 ? (
                                    <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                            <FileText size={20} />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">No pages created yet</p>
                                        <p className="text-xs text-slate-400 max-w-sm mt-1">
                                            Click below to create your first page and start dragging components.
                                        </p>
                                        <button
                                            onClick={() => setCreateModalOpen(true)}
                                            className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all"
                                        >
                                            <Plus size={14} />
                                            <span>Create Page</span>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {pages.slice(0, 5).map((page) => (
                                            <div
                                                key={page.id}
                                                className="px-6 py-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors group"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-xs font-semibold text-slate-800 truncate">
                                                                {page.name}
                                                            </p>
                                                            <span
                                                                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${page.status === 'PUBLISHED'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                                    }`}
                                                            >
                                                                {page.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                            /{page.slug}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className="text-[11px] text-slate-400 hidden md:inline">
                                                        Updated {new Date(page.updatedAt || page.createdAt).toLocaleDateString()}
                                                    </span>
                                                    <button
                                                        onClick={() => navigate(`/custom-builder?pageId=${page.id}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                                                    >
                                                        <Edit3 size={13} />
                                                        <span>Edit in Builder</span>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick Navigation Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div
                                    onClick={() => setActiveTab('themes')}
                                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                        <Palette size={20} />
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        Design Themes
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Manage colors, typography, buttons, and responsive breakpoints ({themes.length} available).
                                    </p>
                                </div>

                                <div
                                    onClick={() => setActiveTab('media')}
                                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                        <ImageIcon size={20} />
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        Media Assets
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Manage project images, SVGs, logos, and graphic assets for your page layouts.
                                    </p>
                                </div>

                                <div
                                    onClick={() => setActiveTab('settings')}
                                    className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                                        <Settings size={20} />
                                    </div>
                                    <h4 className="text-sm font-semibold text-slate-800">
                                        Global Settings
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Check backend connection ({health.status === 'ok' ? 'Connected' : 'Offline'}), database status, and export configurations.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 2: PAGES MANAGEMENT VIEW                                              */}
                    {/* ========================================================================= */}
                    {activeTab === 'pages' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            {/* Top Controls */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">Pages</h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Manage database-backed pages, edit in the component builder, and publish.
                                    </p>
                                </div>

                                <button
                                    onClick={() => setCreateModalOpen(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all hover:scale-[1.02] shrink-0"
                                >
                                    <Plus size={15} />
                                    <span>Create Page</span>
                                </button>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                                <div className="relative flex-1">
                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                    />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search pages by name or slug..."
                                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                    />
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-xs text-slate-400 font-medium">Status:</span>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    >
                                        <option value="ALL">All ({pages.length})</option>
                                        <option value="PUBLISHED">Published ({publishedCount})</option>
                                        <option value="DRAFT">Draft ({draftCount})</option>
                                    </select>

                                    <button
                                        onClick={handleRefresh}
                                        title="Reload from database"
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                                    >
                                        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>

                            {/* Pages Content List / Empty State */}
                            {loading ? (
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-slate-400">
                                    <RefreshCw className="animate-spin mb-3 text-blue-600" size={24} />
                                    <p className="text-xs font-medium">Loading pages from database...</p>
                                </div>
                            ) : filteredPages.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-slate-200/80 p-16 flex flex-col items-center justify-center text-center shadow-xs">
                                    <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                                        <FileText size={28} />
                                    </div>
                                    <h3 className="text-base font-semibold text-slate-800">
                                        {searchQuery || statusFilter !== 'ALL'
                                            ? 'No matching pages found'
                                            : 'No pages created yet'}
                                    </h3>
                                    <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
                                        {searchQuery || statusFilter !== 'ALL'
                                            ? 'Try adjusting your search query or status filter.'
                                            : 'Create a new page document to start building with the drag-and-drop Component Builder.'}
                                    </p>
                                    <button
                                        onClick={() => setCreateModalOpen(true)}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all hover:scale-[1.02]"
                                    >
                                        <Plus size={15} />
                                        <span>Create Page</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                    <th className="py-3 px-6">Page</th>
                                                    <th className="py-3 px-6">Route Slug</th>
                                                    <th className="py-3 px-6">Theme</th>
                                                    <th className="py-3 px-6">Status</th>
                                                    <th className="py-3 px-6">Last Updated</th>
                                                    <th className="py-3 px-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                                                {filteredPages.map((page) => (
                                                    <tr
                                                        key={page.id}
                                                        className="hover:bg-slate-50/70 transition-colors group"
                                                    >
                                                        <td className="py-4 px-6 font-semibold text-slate-800">
                                                            <div className="flex items-center gap-2.5">
                                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                                                    <FileText size={15} />
                                                                </div>
                                                                <span className="truncate max-w-[200px]">{page.name}</span>
                                                            </div>
                                                        </td>

                                                        <td className="py-4 px-6 font-mono text-slate-500 text-[11px]">
                                                            /{page.slug}
                                                        </td>

                                                        <td className="py-4 px-6 text-slate-600">
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[11px]">
                                                                <Palette size={11} className="text-violet-500" />
                                                                {page.theme?.name || 'Default Theme'}
                                                            </span>
                                                        </td>

                                                        <td className="py-4 px-6">
                                                            <button
                                                                onClick={() => handleTogglePublish(page)}
                                                                title="Click to toggle publish status"
                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${page.status === 'PUBLISHED'
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                    : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                                                    }`}
                                                            >
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full ${page.status === 'PUBLISHED'
                                                                        ? 'bg-emerald-500'
                                                                        : 'bg-amber-500'
                                                                        }`}
                                                                />
                                                                {page.status}
                                                            </button>
                                                        </td>

                                                        <td className="py-4 px-6 text-slate-400 text-[11px]">
                                                            {new Date(page.updatedAt || page.createdAt).toLocaleString(
                                                                undefined,
                                                                {
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                }
                                                            )}
                                                        </td>

                                                        <td className="py-4 px-6 text-right">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        navigate(`/custom-builder?pageId=${page.id}`)
                                                                    }
                                                                    title="Edit in Component Builder"
                                                                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>

                                                                <button
                                                                    onClick={() => handleDuplicate(page)}
                                                                    title="Duplicate Page"
                                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
                                                                >
                                                                    <Copy size={14} />
                                                                </button>

                                                                <button
                                                                    onClick={() => {
                                                                        setPageToDelete(page);
                                                                        setDeleteModalOpen(true);
                                                                    }}
                                                                    title="Delete Page"
                                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 3: THEMES VIEW                                                        */}
                    {/* ========================================================================= */}
                    {activeTab === 'themes' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">Themes</h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Configured themes stored in the database for typography and color palettes.
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigate('/')}
                                    className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition-colors"
                                >
                                    Configure New Theme
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {themes.map((theme) => {
                                    const colors = theme.configJson?.colors || {};
                                    return (
                                        <div
                                            key={theme.id}
                                            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-sm font-bold text-slate-800">
                                                        {theme.name}
                                                    </h3>
                                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                                                        /{theme.slug}
                                                    </span>
                                                </div>

                                                {/* Color Swatches */}
                                                <div className="flex items-center gap-2 mb-4">
                                                    {colors.primary && (
                                                        <span
                                                            style={{ backgroundColor: colors.primary }}
                                                            className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                                                            title={`Primary: ${colors.primary}`}
                                                        />
                                                    )}
                                                    {colors.secondary && (
                                                        <span
                                                            style={{ backgroundColor: colors.secondary }}
                                                            className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                                                            title={`Secondary: ${colors.secondary}`}
                                                        />
                                                    )}
                                                    {colors.surface && (
                                                        <span
                                                            style={{ backgroundColor: colors.surface }}
                                                            className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                                                            title={`Surface: ${colors.surface}`}
                                                        />
                                                    )}
                                                    {colors.background && (
                                                        <span
                                                            style={{ backgroundColor: colors.background }}
                                                            className="w-6 h-6 rounded-md shadow-xs border border-black/10"
                                                            title={`Background: ${colors.background}`}
                                                        />
                                                    )}
                                                </div>

                                                <div className="space-y-1.5 text-[11px] text-slate-500">
                                                    <p>
                                                        <span className="text-slate-400">Font:</span>{' '}
                                                        <span className="font-medium text-slate-700">
                                                            {theme.configJson?.typography?.fontFamily ||
                                                                theme.configJson?.googleFont ||
                                                                'Inter'}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        <span className="text-slate-400">Connected Pages:</span>{' '}
                                                        <span className="font-semibold text-blue-600">
                                                            {theme._count?.pages ?? 0}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mt-5 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
                                                <span>
                                                    Created {new Date(theme.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="text-emerald-600 font-medium">Ready</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 4: MEDIA VIEW                                                         */}
                    {/* ========================================================================= */}
                    {activeTab === 'media' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-800">Media Assets</h1>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Upload and manage project media for hero banners, cards, and image elements.
                                    </p>
                                </div>
                                <button
                                    onClick={() => showToast('Media upload modal (placeholder)')}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                                >
                                    <Upload size={14} />
                                    <span>Upload Asset</span>
                                </button>
                            </div>

                            {/* Upload Dropzone Placeholder */}
                            <div
                                onClick={() => showToast('Media upload dialog (placeholder)')}
                                className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer bg-white hover:bg-blue-50/20 transition-all"
                            >
                                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                                    <Upload size={20} />
                                </div>
                                <p className="text-sm font-semibold text-slate-700">
                                    Drag and drop files here, or browse
                                </p>
                                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                                    PNG, JPG, SVG, WebP up to 10MB supported for component image elements.
                                </p>
                            </div>

                            {/* Sample Media Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {[
                                    { title: 'Hero Background', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&auto=format&fit=crop&q=60' },
                                    { title: 'Product Showcase', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=60' },
                                    { title: 'Abstract Gradient', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=500&auto=format&fit=crop&q=60' },
                                    { title: 'App Mockup', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60' },
                                ].map((item, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs group"
                                    >
                                        <div className="h-32 bg-slate-100 overflow-hidden relative">
                                            <img
                                                src={item.url}
                                                alt={item.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <p className="text-xs font-semibold text-slate-800 truncate">
                                                {item.title}
                                            </p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Ready for Builder</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ========================================================================= */}
                    {/* TAB 5: SETTINGS VIEW                                                      */}
                    {/* ========================================================================= */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Global application parameters, database connection, and API status.
                                </p>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs divide-y divide-slate-100">
                                {/* System Status */}
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                        <Database size={16} className="text-blue-600" />
                                        <span>Database & Backend Connection</span>
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                                            <p className="text-[11px] text-slate-400">API Health</p>
                                            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${health.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}
                                                />
                                                {health.status === 'ok' ? 'Online' : 'Unavailable'}
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                                            <p className="text-[11px] text-slate-400">Database Engine</p>
                                            <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1.5">
                                                <span
                                                    className={`w-2 h-2 rounded-full ${health.database === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`}
                                                />
                                                PostgreSQL (Prisma)
                                            </p>
                                        </div>

                                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70">
                                            <p className="text-[11px] text-slate-400">Server Endpoint</p>
                                            <p className="text-sm font-mono text-slate-800 mt-1 truncate">
                                                http://localhost:3001
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* General Configuration */}
                                <div className="p-6">
                                    <h3 className="text-sm font-semibold text-slate-800 mb-3">
                                        Project Defaults
                                    </h3>
                                    <div className="space-y-4 max-w-xl text-xs">
                                        <div>
                                            <label className="block text-slate-500 font-medium mb-1">
                                                Application Name
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue="React Component Builder"
                                                disabled
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-slate-500 font-medium mb-1">
                                                Default Font Family
                                            </label>
                                            <input
                                                type="text"
                                                defaultValue="'Inter', system-ui, sans-serif"
                                                disabled
                                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* ========================================================================= */}
            {/* RIGHT-HAND DARK GLOBAL NAVIGATION PANEL                                   */}
            {/* ========================================================================= */}
            <aside className="w-64 sm:w-72 bg-[#0f172a] border-l border-slate-800/80 flex flex-col justify-between shrink-0 shadow-2xl z-40">
                <div>
                    {/* Header Brand */}
                    <div className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
                                <Code2 size={16} />
                            </div>
                            <div>
                                <span className="font-bold text-sm text-white tracking-tight">Compify</span>
                                <span className="block text-[9px] font-medium text-slate-400 tracking-wider uppercase">
                                    Workspace
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            title="Return to Home"
                            className="text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800/60 transition-colors"
                        >
                            Home
                        </button>
                    </div>

                    {/* Navigation Items (Dashboard, Pages, Themes, Media, Settings) */}
                    <div className="p-4 space-y-1.5">
                        <p className="px-3 text-[10px] font-bold text-slate-500 tracking-wider uppercase mb-2">
                            Navigation
                        </p>

                        {/* 1. Dashboard */}
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'dashboard'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <LayoutDashboard size={16} />
                                <span>Dashboard</span>
                            </div>
                        </button>

                        {/* 2. Pages */}
                        <button
                            onClick={() => setActiveTab('pages')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'pages'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <FileText size={16} />
                                <span>Pages</span>
                            </div>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'pages'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {pages.length}
                            </span>
                        </button>

                        {/* 3. Themes */}
                        <button
                            onClick={() => setActiveTab('themes')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'themes'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Palette size={16} />
                                <span>Themes</span>
                            </div>
                            <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${activeTab === 'themes'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                    }`}
                            >
                                {themes.length}
                            </span>
                        </button>

                        {/* 4. Media */}
                        <button
                            onClick={() => setActiveTab('media')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'media'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <ImageIcon size={16} />
                                <span>Media</span>
                            </div>
                        </button>

                        {/* 5. Settings */}
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${activeTab === 'settings'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Settings size={16} />
                                <span>Settings</span>
                            </div>
                            <span
                                className={`w-2 h-2 rounded-full ${health.status === 'ok' ? 'bg-emerald-400' : 'bg-rose-400'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {/* Bottom Panel Actions & Info */}
                <div className="p-4 border-t border-slate-800/80 space-y-3">
                    {/* <button
            onClick={() => setCreateModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md transition-all"
          >
            <Plus size={15} />
            <span>Create Page</span>
          </button> */}

                    <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1.5">
                            <span
                                className={`w-2 h-2 rounded-full ${health.database === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`}
                            />
                            Database: {health.database}
                        </span>
                        <button
                            onClick={handleRefresh}
                            title="Refresh"
                            className="hover:text-white transition-colors"
                        >
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ========================================================================= */}
            {/* MODAL: CREATE NEW PAGE                                                    */}
            {/* ========================================================================= */}
            {createModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    <FileText size={16} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-slate-800">Create New Page</h3>
                                    <p className="text-[11px] text-slate-400">
                                        Saves record in PostgreSQL and opens Component Builder
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setCreateModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleCreatePage} className="p-6 space-y-4">
                            {createError && (
                                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                                    <AlertCircle size={15} className="shrink-0" />
                                    <span>{createError}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    Page Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newPageName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="e.g. Services, About Us, Landing Page"
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">
                                    URL Route Slug *
                                </label>
                                <div className="flex items-center rounded-xl border border-slate-300 overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500">
                                    <span className="px-3 py-2 text-xs text-slate-400 font-mono bg-slate-100/70 border-r border-slate-200">
                                        /
                                    </span>
                                    <input
                                        type="text"
                                        required
                                        value={newPageSlug}
                                        onChange={(e) => setNewPageSlug(e.target.value)}
                                        placeholder="services"
                                        className="flex-1 px-3 py-2 text-xs bg-white font-mono focus:outline-none"
                                    />
                                </div>
                            </div>



                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setCreateModalOpen(false)}
                                    className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingPage}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                                >
                                    {creatingPage ? 'Creating...' : 'Create & Open Builder'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* MODAL: DELETE CONFIRMATION                                                */}
            {/* ========================================================================= */}
            {deleteModalOpen && pageToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                            <Trash2 size={22} />
                        </div>
                        <h3 className="font-bold text-base text-slate-800">Delete Page?</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            Are you sure you want to delete <strong className="text-slate-800">"{pageToDelete.name}"</strong>? This will permanently remove the page and its component layout from the database.
                        </p>

                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors"
                            >
                                {deleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
