import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code2 } from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import ThemeModal from '../components/ThemeModal';

export default function ThemesPage() {
  const navigate = useNavigate();
  const { fetchThemes } = useBuilderStore();

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Code2 size={16} />
          </div>
          <span className="font-semibold text-sm text-white">Compify</span>
          <span className="text-slate-500 text-xs">/</span>
          <span className="text-xs font-medium text-slate-300">Theme Manager</span>
        </div>

        <button
          onClick={() => navigate('/custom-builder')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
        >
          <ArrowLeft size={14} /> Back to Builder
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative flex items-center justify-center p-6">
        <ThemeModal onClose={() => navigate('/custom-builder')} />
      </div>
    </div>
  );
}
