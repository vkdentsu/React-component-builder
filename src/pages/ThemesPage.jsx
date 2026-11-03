import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code2, LayoutDashboard } from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import ConfigurationAndThemes from './ConfigurationAndThemes';

export default function ThemesPage() {
  const navigate = useNavigate();
  const { availableThemes, fetchThemes } = useBuilderStore();

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Code2 size={16} />
          </div>
          <span className="font-semibold text-sm text-white">Compify</span>
          <span className="text-slate-500 text-xs">/</span>
          <span className="text-xs font-medium text-slate-300">Theme Management</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button
            onClick={() => navigate('/custom-builder')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <ArrowLeft size={14} /> Open Builder
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        <ConfigurationAndThemes themes={availableThemes} onRefresh={fetchThemes} />
      </main>
    </div>
  );
}
