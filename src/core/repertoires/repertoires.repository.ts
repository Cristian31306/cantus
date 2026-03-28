import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../auth/firebaseConfig';
import { CantosRepository } from '../cantos/cantos.repository';

export type Repertoire = {
    id?: string;
    title: string;
    date: number;
    team_id: string;
    created_at: number;
    updated_at: number;
    _deleted?: number;
    color?: string;
    items?: RepertoireItem[];
    position?: number;
};

export type RepertoireItem = {
    id: string;
    repertoire_id: string;
    canto_id: string;
    position: number;
    transpose_offset: number;
    note: string;
    // Joined fields visuales
    canto_title?: string;
    canto_key?: string;
    canto_category?: string;
};

export class RepertoiresRepository {
    static async create(repertoire: Omit<Repertoire, 'id' | 'created_at' | 'updated_at' | '_deleted'>) {
        const now = Date.now();
        const newRef = doc(collection(db, 'repertoires'));
        await setDoc(newRef, {
            ...repertoire,
            created_at: now,
            updated_at: now,
            items: []
        });
        return newRef.id;
    }

    static async getAll() {
        // En firebase las colecciones racine de repertoires
        const q = query(collection(db, 'repertoires'), orderBy('date', 'desc'));
        const sn = await getDocs(q);
        return sn.docs
            .map(d => ({ id: d.id, ...d.data() } as Repertoire))
            .filter(d => !d._deleted)
            .sort((a, b) => (a.position || 0) - (b.position || 0)); // Sort secundario
    }

    static subscribeAll(callback: (repertoires: Repertoire[]) => void) {
        const q = query(collection(db, 'repertoires'), orderBy('date', 'desc'));
        return onSnapshot(q, (sn) => {
            const data = sn.docs
                .map(d => ({ id: d.id, ...d.data() } as Repertoire))
                .filter(d => !d._deleted)
                .sort((a, b) => {
                    const posA = a.position !== undefined ? a.position : Number.MAX_SAFE_INTEGER;
                    const posB = b.position !== undefined ? b.position : Number.MAX_SAFE_INTEGER;
                    if (posA !== posB) return posA - posB;
                    return b.date - a.date;
                });
            callback(data);
        });
    }

    static async getById(id: string) {
        const docRef = doc(db, 'repertoires', id);
        const sn = await getDoc(docRef);
        if (!sn.exists()) return undefined;
        return { id: sn.id, ...sn.data() } as Repertoire;
    }

    static async update(id: string, updates: Partial<Omit<Repertoire, 'id' | 'created_at' | 'updated_at' | '_deleted'>>) {
        const docRef = doc(db, 'repertoires', id);
        await updateDoc(docRef, { ...updates, updated_at: Date.now() });
    }

    static async delete(id: string) {
        const docRef = doc(db, 'repertoires', id);
        await updateDoc(docRef, { _deleted: 1, updated_at: Date.now() });
    }

    static subscribeToRepertoire(id: string, callback: (repertoire: Repertoire | undefined) => void) {
        const docRef = doc(db, 'repertoires', id);
        return onSnapshot(docRef, (sn) => {
            if (!sn.exists()) {
                callback(undefined);
            } else {
                callback({ id: sn.id, ...sn.data() } as Repertoire);
            }
        });
    }

    // Items Management relies on the 'items' array inside the Repertoire doc.

    static async getItems(repertoireId: string) {
        const rep = await this.getById(repertoireId);
        if (!rep || !rep.items) return [];

        // Carga en paralelo para evitar waterfall y mejorar velocidad significativamente
        const populated = await Promise.all(rep.items.map(async (item) => {
            const canto = await CantosRepository.getById(item.canto_id);
            return {
                ...item,
                canto_title: canto?.title || 'Canto Eliminado',
                canto_key: canto?.key || 'C',
                canto_category: canto?.category || ''
            };
        }));

        return populated.sort((a, b) => a.position - b.position);
    }

    static async addItem(repertoireId: string, cantoId: string, position: number) {
        const rep = await this.getById(repertoireId);
        if (!rep) return '';

        const items = rep.items || [];
        const newItem: RepertoireItem = {
            id: crypto.randomUUID(),
            repertoire_id: repertoireId,
            canto_id: cantoId,
            position,
            transpose_offset: 0,
            note: ''
        };
        items.push(newItem);

        await this.update(repertoireId, { items });
        return newItem.id;
    }

    static async removeItem(itemId: string, repertoireId: string) {
        const rep = await this.getById(repertoireId);
        if (!rep) return;
        const items = (rep.items || []).filter(i => i.id !== itemId);
        await this.update(repertoireId, { items });
    }

    static async updateItem(itemId: string, repertoireId: string, updates: Partial<Pick<RepertoireItem, 'transpose_offset' | 'note' | 'position'>>) {
        const rep = await this.getById(repertoireId);
        if (!rep) return;

        const items = rep.items || [];
        const index = items.findIndex(i => i.id === itemId);
        if (index > -1) {
            items[index] = { ...items[index], ...updates };
            await this.update(repertoireId, { items });
        }
    }

    static async reorderItems(repertoireId: string, itemsList: { id: string }[]) {
        const rep = await this.getById(repertoireId);
        if (!rep) return;

        const currentItems = rep.items || [];
        const idToPos = new Map(itemsList.map((item, idx) => [item.id, idx]));

        currentItems.forEach(item => {
            if (idToPos.has(item.id)) {
                item.position = idToPos.get(item.id)!;
            }
        });

        await this.update(repertoireId, { items: currentItems });
    }

    static async reorderRepertoires(repertoires: { id: string }[]) {
        // Needs sequence of updates
        const promises = repertoires.map((rep, idx) => {
            const docRef = doc(db, 'repertoires', rep.id);
            return updateDoc(docRef, { position: idx, updated_at: Date.now() });
        });
        await Promise.all(promises);
    }

    static async clone(id: string) {
        const original = await this.getById(id);
        if (!original) throw new Error('Repertoire not found');

        const newTitle = `${original.title} (Copia)`;
        const newDate = Date.now();

        // Regenerate IDs for cloned items
        const clonedItems = (original.items || []).map(item => ({
            ...item,
            id: crypto.randomUUID()
        }));

        const newId = await this.create({
            title: newTitle,
            date: newDate,
            team_id: original.team_id,
            color: original.color
        });

        // Set the items directly
        await this.update(newId, { items: clonedItems });

        return newId;
    }
}
