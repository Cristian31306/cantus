import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../auth/firebaseConfig';

export type Canto = {
    id?: string;
    title: string;
    content: string;
    key: string;
    category: string;
    note?: string;
    transpose_offset: number;
    created_at: number;
    updated_at: number;
    _deleted?: number;
};

export class CantosRepository {
    static async create(canto: Omit<Canto, 'id' | 'created_at' | 'updated_at' | '_deleted'>) {
        const now = Date.now();
        const newRef = doc(collection(db, 'cantos'));
        await setDoc(newRef, {
            ...canto,
            created_at: now,
            updated_at: now,
            transpose_offset: 0
        });
        return newRef.id;
    }

    static async getAll() {
        const q = query(collection(db, 'cantos'), orderBy('title', 'asc'));
        const sn = await getDocs(q);
        return sn.docs
            .map(d => ({ id: d.id, ...d.data() } as Canto))
            .filter(d => !d._deleted);
    }

    static subscribeAll(callback: (cantos: Canto[]) => void) {
        const q = query(collection(db, 'cantos'), orderBy('title', 'asc'));
        return onSnapshot(q, (sn) => {
            const data = sn.docs
                .map(d => ({ id: d.id, ...d.data() } as Canto))
                .filter(d => !d._deleted);
            callback(data);
        });
    }

    static async getById(id: string) {
        const docRef = doc(db, 'cantos', id);
        const sn = await getDoc(docRef);
        if (!sn.exists()) return undefined;
        return { id: sn.id, ...sn.data() } as Canto;
    }

    static async update(id: string, updates: Partial<Omit<Canto, 'id' | 'created_at' | 'updated_at' | '_deleted'>>) {
        const docRef = doc(db, 'cantos', id);
        await updateDoc(docRef, { ...updates, updated_at: Date.now() });
    }

    static async delete(id: string) {
        const docRef = doc(db, 'cantos', id);
        await updateDoc(docRef, { _deleted: 1, updated_at: Date.now() });
    }

    static async search(queryText: string) {
        const all = await this.getAll();
        const q = queryText.toLowerCase();
        return all.filter(c =>
            c.title.toLowerCase().includes(q) ||
            c.content.toLowerCase().includes(q) ||
            c.category.toLowerCase().includes(q)
        );
    }
}
