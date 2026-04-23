import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SingleScaleState, ScaleType } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ScaleStoreState {
  small: SingleScaleState;
  large: SingleScaleState;

  setWeight:       (scale: ScaleType, weight: number, stable: boolean, timestamp: string) => void;
  setConnection:   (scale: ScaleType, connected: boolean) => void;
  setOverload:     (scale: ScaleType, shown: boolean) => void;
  resetAll:        () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

const defaultScale: SingleScaleState = {
  weight:        0,
  stable:        false,
  connected:     false,
  lastUpdate:    null,
  overloadShown: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────────────────────────────────────

export const useScaleStore = create<ScaleStoreState>()(
  devtools(
    (set) => ({
      small: { ...defaultScale },
      large: { ...defaultScale },

      setWeight: (scale, weight, stable, timestamp) =>
        set((state) => ({
          [scale]: { ...state[scale], weight, stable, lastUpdate: timestamp },
        })),

      setConnection: (scale, connected) =>
        set((state) => ({
          [scale]: { ...state[scale], connected },
        })),

      setOverload: (scale, shown) =>
        set((state) => ({
          [scale]: { ...state[scale], overloadShown: shown },
        })),

      resetAll: () =>
        set({
          small: { ...defaultScale },
          large: { ...defaultScale },
        }),
    }),
    { name: 'scale-store' },
  ),
);
