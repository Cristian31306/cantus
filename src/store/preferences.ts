import type { Notation } from '../core/music/transposition';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PreferencesState {
    notation: Notation;
    fontSize: number;
    theme: 'light' | 'dark' | 'system';
    cantoOffsets: Record<string, number>;
    setNotation: (notation: Notation) => void;
    setFontSize: (size: number) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
    setCantoOffset: (cantoId: string, offset: number) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            notation: 'american', // default
            fontSize: 16,
            theme: 'system',
            cantoOffsets: {},
            setNotation: (notation) => set({ notation }),
            setFontSize: (fontSize) => set({ fontSize }),
            setTheme: (theme) => set({ theme }),
            setCantoOffset: (cantoId, offset) => set((state) => ({
                cantoOffsets: { ...state.cantoOffsets, [cantoId]: offset }
            })),
        }),
        {
            name: 'cantus-preferences',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
