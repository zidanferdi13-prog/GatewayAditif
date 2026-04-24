import { AlertTriangle } from 'lucide-react';
import { ModalOverlay } from './ModalOverlay';
import { useMOStore } from '@/store/moStore';
import { useUIStore } from '@/store/uiStore';
import { useScaleStore } from '@/store/scaleStore';

export function ConfirmResetModal() {
  const isOpen    = useUIStore((s) => s.openModals.has('confirmReset'));
  const closeModal = useUIStore((s) => s.closeModal);
  const activeMO  = useMOStore((s) => s.activeMO);
  const resetMO   = useMOStore((s) => s.resetMO);
  const resetScale = useScaleStore((s) => s.resetAll);

  const handleReset = () => {
    resetMO();
    resetScale();
    closeModal('confirmReset');
    useUIStore.getState().openModal('moInput');
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={() => closeModal('confirmReset')}>
      <div className="w-full max-w-sm bg-bg-card border border-c-amber/40 rounded-xl shadow-2xl overflow-hidden">
        {/* Head */}
        <div className="px-6 pt-6 pb-4 text-center border-b border-b-card">
          <AlertTriangle className="mx-auto text-c-amber mb-2" size={32} />
          <h2 className="text-lg font-bold text-t-primary">Reset MO?</h2>
          <p className="text-sm text-t-secondary mt-1">Semua progres lot saat ini akan dihapus</p>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center justify-between px-4 py-3 rounded-lg border border-c-amber/30 bg-c-amber-dim">
            <span className="text-xs font-semibold text-t-secondary uppercase tracking-wider">MO Aktif</span>
            <span className="font-mono text-sm font-bold text-c-amber">{activeMO ?? '—'}</span>
          </div>
        </div>

        {/* Foot */}
        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={() => closeModal('confirmReset')}
            className="px-5 py-2 rounded-lg border border-b-card text-t-secondary text-sm font-medium
                       hover:bg-bg-elevated transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleReset}
            className="px-5 py-2 rounded-lg bg-c-red text-white text-sm font-semibold
                       hover:shadow-glow-red transition-all"
          >
            Reset MO
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
}
