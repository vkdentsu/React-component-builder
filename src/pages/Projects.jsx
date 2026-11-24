import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  FolderKanban,
  Globe,
  Plus,
  RefreshCw,
  Rocket,
  X,
} from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import { authenticatedFetch } from '../utils/api';
import { ensureUserTheme } from '../utils/ensureUserTheme';
import { BUILT_IN_PRESET_THEMES, mergeThemes } from '../utils/themeDefaults';
import { deployProjectToVercel } from '../utils/projectDeployment';

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function Projects({ embedded = false }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [project, setProject] = useState(null);
  const [themes, setThemes] = useState([]);
  const [vercelConnected, setVercelConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createPageOpen, setCreatePageOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectSlug, setProjectSlug] = useState('');
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [pageThemeId, setPageThemeId] = useState('');

  const availableThemes = useMemo(
    () => mergeThemes(themes, BUILT_IN_PRESET_THEMES),
    [themes],
  );
  const deployment = project?.deploymentJson;

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 4000);
  };

  const loadProjects = useCallback(async () => {
    const response = await authenticatedFetch('/api/projects');
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Could not load projects.');
    setProjects(result.data || []);
  }, []);

  const loadProject = useCallback(async () => {
    if (!projectId) {
      setProject(null);
      return;
    }
    const response = await authenticatedFetch(`/api/projects/${encodeURIComponent(projectId)}`);
    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message || 'Could not load this project.');
    setProject(result.data);
  }, [projectId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadProjects(), loadProject()]);
    } catch (loadError) {
      setError(loadError.message || 'Could not load projects.');
    } finally {
      setLoading(false);
    }
  }, [loadProject, loadProjects]);

  useEffect(() => {
    Promise.resolve().then(refresh);
    authenticatedFetch('/api/themes')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Could not load themes.');
        setThemes(result.data || []);
      })
      .catch((themeError) => setError(themeError.message));
    authenticatedFetch('/api/integrations/connections')
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || 'Could not load integrations.');
        setVercelConnected(Boolean(result.data?.vercel));
      })
      .catch((integrationError) => setError(integrationError.message));
  }, [projectId, refresh]);

  const handleCreateProject = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = await authenticatedFetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: projectName.trim(), slug: projectSlug.trim() }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not create project.');
      setCreateProjectOpen(false);
      setProjectName('');
      setProjectSlug('');
      navigate(`/projects/${result.data.id}`);
    } catch (createError) {
      setError(createError.message || 'Could not create project.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = async (event) => {
    event.preventDefault();
    if (!project) return;
    setSaving(true);
    setError('');
    try {
      const selectedTheme = availableThemes.find((theme) => theme.id === pageThemeId)
        || availableThemes.find((theme) => theme.id === useBuilderStore.getState().defaultThemeId)
        || availableThemes[0];
      let themeId = selectedTheme?.id;
      if (!themeId || String(themeId).startsWith('preset-') || selectedTheme?.isPreset) {
        const persistedTheme = await ensureUserTheme(selectedTheme || themeId);
        if (!persistedTheme?.id) throw new Error('Could not save the selected theme.');
        themeId = persistedTheme.id;
      }

      const response = await authenticatedFetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pageName.trim(),
          slug: pageSlug.trim(),
          themeId,
          projectId: project.id,
          contentJson: { rows: [] },
          status: 'DRAFT',
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Could not create page.');
      setCreatePageOpen(false);
      setPageName('');
      setPageSlug('');
      setPageThemeId('');
      navigate(`/custom-builder?pageId=${encodeURIComponent(result.data.id)}`);
    } catch (createError) {
      setError(createError.message || 'Could not create page.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (!project) return;
    if (!vercelConnected) {
      showToast('Connect Vercel in Dashboard > Settings before deploying.');
      return;
    }
    if (!project.pages?.length) {
      showToast('Add at least one page before deploying this project.');
      return;
    }
    setDeploying(true);
    try {
      const result = await deployProjectToVercel(project.id, project.pages);
      setProject((current) => ({ ...current, deploymentJson: result }));
      showToast(result.deploymentUrl
        ? `Project deployment ready: ${result.deploymentUrl}`
        : 'Project deployment started. Check Vercel for its status.');
    } catch (deployError) {
      showToast(deployError.message || 'Could not deploy the project.');
    } finally {
      setDeploying(false);
    }
  };

  const setProjectNameAndSlug = (value) => {
    setProjectName(value);
    setProjectSlug(slugify(value));
  };

  const setPageNameAndSlug = (value) => {
    setPageName(value);
    setPageSlug(slugify(value));
  };

  const defaultThemeId = useBuilderStore.getState().defaultThemeId;

  return (
    <div className={embedded ? '' : 'min-h-screen bg-slate-50 text-slate-900'}>
      {!embedded && <header className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <FolderKanban size={18} />
          </div>
          <div>
            <p className="text-sm font-bold">Compify Projects</p>
            <p className="text-xs text-slate-500">Build and deploy complete websites</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>
      </header>}

      <main className={embedded ? 'w-full' : 'mx-auto max-w-6xl px-5 py-8 sm:px-8'}>
        {error && (
          <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        {toast && (
          <div role="status" className="fixed bottom-5 right-5 z-40 max-w-md rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
            {toast}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={16} />
            Loading projects...
          </div>
        ) : projectId && project ? (
          <section>
            <button type="button" onClick={() => navigate('/projects')} className="mb-5 text-xs font-medium text-blue-600 hover:text-blue-800">
              ← All projects
            </button>
            <div className="mb-7 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-600">Project</p>
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <p className="mt-1 text-sm text-slate-500">/{project.slug} · {project.pages?.length || 0} pages</p>
                {deployment?.deploymentUrl && (
                  <a className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:underline" href={deployment.deploymentUrl} target="_blank" rel="noreferrer">
                    <Globe size={14} /> {deployment.deploymentUrl} <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCreatePageOpen(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Plus size={15} /> Add page
                </button>
                <button
                  type="button"
                  onClick={handleDeploy}
                  disabled={deploying || !project.pages?.length}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Rocket size={15} />
                  {deploying ? 'Deploying project...' : 'Deploy project'}
                </button>
              </div>
            </div>

            {!vercelConnected && (
              <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Connect Vercel in <button className="font-semibold underline" onClick={() => navigate('/settings')}>Dashboard Settings</button> to deploy this project.
              </div>
            )}

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="font-semibold">Project pages</h2>
                <p className="mt-1 text-xs text-slate-500">Every page in this list is included when you deploy the project.</p>
              </div>
              {project.pages?.length ? (
                <div className="divide-y divide-slate-100">
                  {project.pages.map((page) => (
                    <div key={page.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><FileText size={17} /></div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{page.name}</p>
                          <p className="truncate text-xs text-slate-500">/{project.slug}/{page.slug} · {page.status === 'PUBLISHED' ? 'Published' : 'Draft'}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/custom-builder?pageId=${encodeURIComponent(page.id)}`)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Open in builder
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-14 text-center">
                  <FileText className="mx-auto mb-3 text-slate-300" size={28} />
                  <p className="font-semibold">No pages yet</p>
                  <p className="mt-1 text-sm text-slate-500">Add pages here, then deploy them together as one website.</p>
                  <button type="button" onClick={() => setCreatePageOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <Plus size={15} /> Add first page
                  </button>
                </div>
              )}
            </div>
          </section>
        ) : (
          <section>
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold">Your projects</h1>
                <p className="mt-1 text-sm text-slate-500">Create a project first, add pages to it, and deploy them together.</p>
              </div>
              <button type="button" onClick={() => setCreateProjectOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                <Plus size={16} /> Create project
              </button>
            </div>
            {projects.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((item) => (
                  <button key={item.id} type="button" onClick={() => navigate(`/projects/${item.id}`)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><FolderKanban size={19} /></span>
                      <span className="text-xs text-slate-500">{item._count?.pages || 0} pages</span>
                    </div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="mt-1 text-xs text-slate-500">/{item.slug}</p>
                    <p className="mt-4 text-xs font-semibold text-blue-600">Manage project →</p>
                    {item.deploymentJson?.deploymentUrl && <p className="mt-2 truncate text-xs text-emerald-700">{item.deploymentJson.deploymentUrl}</p>}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
                <FolderKanban className="mx-auto mb-3 text-slate-300" size={30} />
                <p className="font-semibold">No projects yet</p>
                <p className="mt-1 text-sm text-slate-500">Create a project to start organizing your website pages.</p>
                <button type="button" onClick={() => setCreateProjectOpen(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  <Plus size={15} /> Create project
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {createProjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleCreateProject} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="font-bold">Create project</h2><p className="mt-1 text-xs text-slate-500">You can add pages after creating it.</p></div>
              <button type="button" aria-label="Close" onClick={() => setCreateProjectOpen(false)}><X size={18} /></button>
            </div>
            <label className="mb-1 block text-xs font-semibold">Project name</label>
            <input required maxLength={100} value={projectName} onChange={(event) => setProjectNameAndSlug(event.target.value)} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="My Website" />
            <label className="mb-1 block text-xs font-semibold">Project URL slug</label>
            <div className="mb-5 flex items-center rounded-lg border border-slate-300"><span className="px-3 text-sm text-slate-400">/</span><input required maxLength={63} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={projectSlug} onChange={(event) => setProjectSlug(event.target.value.toLowerCase())} className="w-full rounded-r-lg border-l border-slate-200 px-3 py-2 font-mono text-sm" /></div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreateProjectOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create project'}</button>
            </div>
          </form>
        </div>
      )}

      {createPageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form onSubmit={handleCreatePage} className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div><h2 className="font-bold">Add page to {project?.name}</h2><p className="mt-1 text-xs text-slate-500">This page will be part of the project deployment.</p></div>
              <button type="button" aria-label="Close" onClick={() => setCreatePageOpen(false)}><X size={18} /></button>
            </div>
            <label className="mb-1 block text-xs font-semibold">Page name</label>
            <input required value={pageName} onChange={(event) => setPageNameAndSlug(event.target.value)} className="mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="About Us" />
            <label className="mb-1 block text-xs font-semibold">Page route</label>
            <div className="mb-4 flex items-center rounded-lg border border-slate-300"><span className="px-3 text-sm text-slate-400">/</span><input required pattern="[a-z0-9]+(-[a-z0-9]+)*" value={pageSlug} onChange={(event) => setPageSlug(event.target.value.toLowerCase())} className="w-full rounded-r-lg border-l border-slate-200 px-3 py-2 font-mono text-sm" /></div>
            <label className="mb-1 block text-xs font-semibold">Page theme</label>
            <select value={pageThemeId || defaultThemeId || availableThemes[0]?.id || ''} onChange={(event) => setPageThemeId(event.target.value)} className="mb-5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {availableThemes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCreatePageOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Creating...' : 'Create & open builder'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
