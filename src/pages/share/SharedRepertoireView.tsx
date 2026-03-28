import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Music } from 'lucide-react';
import { RepertoiresRepository, type Repertoire } from '../../core/repertoires/repertoires.repository';
import { CantosRepository, type Canto } from '../../core/cantos/cantos.repository';

interface RepertoireItemPopulated {
    id?: string;
    cantoId: string;
    title: string;
    type: string;
    targetNotation: string;
    transposeOffset: number;
    note?: string;
}

export const SharedRepertoireView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [repertoire, setRepertoire] = useState<Repertoire | null>(null);
    const [populatedItems, setPopulatedItems] = useState<RepertoireItemPopulated[]>([]);
    const [loading, setLoading] = useState(true);

    const formatDate = (ts: number | undefined) => {
        if (!ts) return '';
        const date = new Date(ts);
        return new Intl.DateTimeFormat('es-CO', {
            day: '2-digit', month: 'short', year: 'numeric'
        }).format(date);
    };

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        const unsubscribe = RepertoiresRepository.subscribeToRepertoire(id, async (repData: Repertoire | undefined) => {
            if (!repData) {
                setLoading(false);
                return;
            }
            setRepertoire(repData);

            if (repData.items && repData.items.length > 0) {
                const sortedItems = [...repData.items].sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
                const cacheCantoData = new Map<string, Canto>();
                const hydratedItems: RepertoireItemPopulated[] = [];

                for (const item of sortedItems) {
                    const cantoId = (item as any).canto_id || (item as any).cantoId;
                    if (!cantoId) continue;

                    if (!cacheCantoData.has(cantoId)) {
                        try {
                            const canto = await CantosRepository.getById(cantoId);
                            if (canto) cacheCantoData.set(cantoId, canto);
                        } catch (err) {
                            console.error(`Error obteniendo el canto ${cantoId}`, err);
                        }
                    }

                    const cantoInfo = cacheCantoData.get(cantoId);
                    hydratedItems.push({
                        id: item.id || (item as any)._id,
                        cantoId: cantoId,
                        title: cantoInfo?.title || 'Canto Eliminado / Desconocido',
                        type: (item as any).type || 'Entrada',
                        targetNotation: (item as any).target_notation || (item as any).targetNotation || 'latin',
                        transposeOffset: (item as any).transpose_offset || (item as any).transposeOffset || 0,
                        note: item.note || ''
                    });
                }
                setPopulatedItems(hydratedItems);
            } else {
                setPopulatedItems([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [id]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando repertorio compartido...</div>;
    if (!repertoire) return <div style={{ padding: '40px', textAlign: 'center' }}>Repertorio no encontrado o sin acceso.</div>;

    return (
        <div className="repertoire-container">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {/* Header Banner */}
                <div className="repertoire-banner">
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '16px' }}>{repertoire.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={18} />
                            {formatDate(repertoire.date)}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Music size={18} />
                            {populatedItems.length} cantos
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {populatedItems.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Este repertorio no tiene cantos asignados.</p>
                    ) : (
                        populatedItems.map((item, index) => (
                            <div
                                key={item.id || `fallback-${item.cantoId}`}
                                onClick={() => navigate(`/share/cantos/${item.cantoId}`, {
                                    state: { repertoireId: id, itemId: item.id, initialOffset: item.transposeOffset }
                                })}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '24px',
                                    backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    transition: 'var(--transition)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }}
                            >
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--accent-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '1.25rem',
                                    marginRight: '20px',
                                    flexShrink: 0
                                }}>
                                    {index + 1}
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>{item.title}</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        {item.transposeOffset !== 0 && (
                                            <span style={{ backgroundColor: 'var(--bg-default)', padding: '4px 10px', borderRadius: '16px' }}>
                                                Tono: {item.transposeOffset > 0 ? `+${item.transposeOffset}` : item.transposeOffset}
                                            </span>
                                        )}
                                        {item.note && (
                                            <span style={{ fontStyle: 'italic', opacity: 0.8 }}>
                                                "{item.note}"
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Visualizador Público de Cantus Web
                </div>
            </div>
        </div>
    );
};
