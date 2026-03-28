import { create } from 'zustand';

interface SyncState {
    syncCounter: number;
    triggerRefresh: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
    syncCounter: 0,
    triggerRefresh: () => set((state) => ({ syncCounter: state.syncCounter + 1 }))
}));
