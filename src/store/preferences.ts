import type { Notation } from '../core/music/transposition';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PreferencesState {
    notation: Notation;
    fontSize: number;
    theme: 'light' | 'dark' | 'system';
    setNotation: (notation: Notation) => void;
    setFontSize: (size: number) => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            notation: 'american', // default
            fontSize: 16,
            theme: 'system',
            setNotation: (notation) => set({ notation }),
            setFontSize: (fontSize) => set({ fontSize }),
            setTheme: (theme) => set({ theme }),
        }),
        {
            name: 'cantus-preferences',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
