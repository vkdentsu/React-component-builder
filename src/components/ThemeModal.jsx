import { X } from 'lucide-react';
import useBuilderStore from '../store/builderStore';
import ConfigurationAndThemes from '../pages/ConfigurationAndThemes';

export default function ThemeModal({ onClose, onSaved }) {
  const { isThemeModalOpen, closeThemeModal } = useBuilderStore();

  if (!isThemeModalOpen && !onClose) return null;

  const handleClose = () => {
    if (onClose) onClose();
    else closeThemeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-6xl max-h-[92vh] bg-slate-50 rounded-2xl overflow-y-auto p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
        <button
          onClick={handleClose}
          aria-label="Close Theme Studio"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors z-20 cursor-pointer"
        >
          <X size={20} />
        </button>

        <ConfigurationAndThemes onRefresh={onSaved} />
      </div>
    </div>
  );
}
