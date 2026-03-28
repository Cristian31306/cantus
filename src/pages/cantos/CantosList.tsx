import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, ListFilter } from 'lucide-react';
import { CantosRepository, type Canto } from '../../core/cantos/cantos.repository';
import { usePreferencesStore } from '../../store/preferences';

export const CantosList = () => {
    const navigate = useNavigate();
    const [cantos, setCantos] = useState<Canto[]>([]);
    const [search, setSearch] = useState('');
    const { cantosCategoryFilter, setCantosCategoryFilter } = usePreferencesStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = CantosRepository.subscribeAll((data) => {
            // Ordenamiento alfanumérico inteligente (01, 02... 11, 20)
            const sortedData = data.sort((a, b) =>
                a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
            );
            setCantos(sortedData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const categories = useMemo(() => {
        const cats = new Set(cantos.map(c => c.category || 'General'));
        return Array.from(cats);
    }, [cantos]);

    const filtered = useMemo(() => {
        let results = cantos;

        if (cantosCategoryFilter) {
            results = results.filter(c => (c.category || 'General') === cantosCategoryFilter);
        }

        if (!search) return results;

        const normalizeText = (text: string) => {
            if (!text) return '';
            return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        };
        const lowerQuery = normalizeText(search);

        results = results.filter(c =>
            normalizeText(c.title).includes(lowerQuery) ||
            normalizeText(c.category).includes(lowerQuery) ||
            (c.content && normalizeText(c.content).includes(lowerQuery))
        );

        // Ordenar por relevancia: Match en Título va primero
        return results.sort((a, b) => {
            const aTitleMatch = normalizeText(a.title).includes(lowerQuery);
            const bTitleMatch = normalizeText(b.title).includes(lowerQuery);
            if (aTitleMatch && !bTitleMatch) return -1;
            if (!aTitleMatch && bTitleMatch) return 1;
            return 0;
        });
    }, [search, cantos, cantosCategoryFilter]);

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Cantos</h1>
                <button
                    onClick={() => navigate('/cantos/new')}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={20} /> Nuevo Canto
                </button>
            </div>

            <div className="input-field" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', padding: '0', overflow: 'hidden', maxWidth: '700px' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px', borderRight: '1px solid var(--border-color)', alignSelf: 'stretch', cursor: 'pointer', backgroundColor: cantosCategoryFilter ? 'rgba(59, 130, 246, 0.1)' : 'transparent', transition: 'var(--transition)' }}>
                    <ListFilter size={20} color={cantosCategoryFilter ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                    {cantosCategoryFilter && (
                        <span style={{ marginLeft: '8px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-color)' }}>
                            {cantosCategoryFilter}
                        </span>
                    )}
                    <select 
                        title="Filtrar por categoría"
                        value={cantosCategoryFilter} 
                        onChange={(e) => setCantosCategoryFilter(e.target.value)}
                        style={{ 
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            opacity: 0, cursor: 'pointer', appearance: 'none'
                        }}
                    >
                        <option value="">Todas las categorías</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <Search size={20} style={{ marginLeft: '12px', color: 'var(--text-secondary)', flexShrink: 0 }} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por título..."
                    style={{ flex: 1, padding: '12px 16px', border: 'none', backgroundColor: 'transparent', outline: 'none', color: 'var(--text-primary)', minWidth: '150px' }}
                />
            </div>

            {loading ? (
                <p>Cargando cantos...</p>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                }}>
                    {filtered.map(canto => (
                        <div
                            key={canto.id}
                            onClick={() => navigate(`/cantos/${canto.id}`)}
                            style={{
                                padding: '20px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.borderColor = 'var(--accent-color)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                        >
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>{canto.title}</h3>
                            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-color)', padding: '2px 8px', borderRadius: '4px' }}>
                                    {canto.category || 'Sin Categoría'}
                                </span>
                                <span>Tono: <strong>{canto.key}</strong></span>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No se encontraron resultados.</p>}
                </div>
            )}
        </div>
    );
};
