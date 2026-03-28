import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { CantosRepository, type Canto } from '../../core/cantos/cantos.repository';

export const CantosList = () => {
    const navigate = useNavigate();
    const [cantos, setCantos] = useState<Canto[]>([]);
    const [filtered, setFiltered] = useState<Canto[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = CantosRepository.subscribeAll((data) => {
            // Ordenamiento alfanumérico inteligente (01, 02... 11, 20)
            const sortedData = data.sort((a, b) =>
                a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
            );
            setCantos(sortedData);
            setFiltered(sortedData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!search) {
            setFiltered(cantos);
        } else {
            const normalizeText = (text: string) => {
                if (!text) return '';
                return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            };
            const lowerQuery = normalizeText(search);

            const results = cantos.filter(c =>
                normalizeText(c.title).includes(lowerQuery) ||
                normalizeText(c.category).includes(lowerQuery) ||
                (c.content && normalizeText(c.content).includes(lowerQuery))
            );

            // Ordenar por relevancia: Match en Título va primero
            results.sort((a, b) => {
                const aTitleMatch = normalizeText(a.title).includes(lowerQuery);
                const bTitleMatch = normalizeText(b.title).includes(lowerQuery);
                if (aTitleMatch && !bTitleMatch) return -1;
                if (!aTitleMatch && bTitleMatch) return 1;
                return 0; // Maintain natural sort for ties
            });

            setFiltered(results);
        }
    }, [search, cantos]);

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

            <div style={{ marginBottom: '24px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por título o categoría..."
                    className="input-field"
                    style={{ paddingLeft: '48px', maxWidth: '500px' }}
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
