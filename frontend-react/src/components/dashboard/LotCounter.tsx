import { useMOStore } from '@/store/moStore';
import { cn } from '@/utils/cn';

export function LotCounter() {
  const currentLot = useMOStore((s) => s.currentLot);
  const totalLot   = useMOStore((s) => s.totalLot);

  return (
    <div className="inline-flex items-center gap-[5px] px-4 py-1.5 rounded-pill border-[1.5px] border-b-card bg-bg-card">
      <span className="text-[9px] font-extrabold text-t-muted uppercase tracking-[1.3px] mr-0.5">
        LOT
      </span>
      <span className="font-mono text-lg font-bold text-c-blue tabular-nums min-w-[22px] text-center">
        {currentLot}
      </span>
      <span className="text-t-muted text-sm">/</span>
      <span className="font-mono text-lg font-bold text-c-blue tabular-nums min-w-[22px] text-center">
        {totalLot}
      </span>
    </div>
  );
}
