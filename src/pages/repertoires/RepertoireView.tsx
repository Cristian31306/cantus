import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Music, Plus, X, Share2, Globe } from 'lucide-react';
import { RepertoiresRepository, type Repertoire } from '../../core/repertoires/repertoires.repository';
import { CantosRepository, type Canto } from '../../core/cantos/cantos.repository';

// Extender el tipo del ítem interno para tener toda la data visual
interface RepertoireItemPopulated {
    id: string; // Para identificarlo en el reordenamiento
    cantoId: string;
    title: string;
    type: string;
    targetNotation: string;
    transposeOffset: number;
    note?: string;
};

export const RepertoireView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [repertoire, setRepertoire] = useState<Repertoire | null>(null);
    const [populatedItems, setPopulatedItems] = useState<RepertoireItemPopulated[]>([]);
    const [loading, setLoading] = useState(true);
    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
    const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
    const [allKnownCantos, setAllKnownCantos] = useState<Canto[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (!id) return;

        setLoading(true);
        // Suscribirse a los cambios del documento del Repertorio
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

    useEffect(() => {
        if (isSearchModalOpen && allKnownCantos.length === 0) {
            // Lazy load the dictionary
            CantosRepository.getAll().then(data => {
                setAllKnownCantos(data);
            });
        }
    }, [isSearchModalOpen]);

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const normalizeText = (text: string) => {
        if (!text) return '';
        return text
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
    };

    const copySetlist = () => {
        if (!repertoire) return;
        const textToCopy = `🎵 *${repertoire.title}*\n\n` +
            populatedItems.map((item, index) => {
                let offsetText = '';
                if (item.transposeOffset !== 0) {
                    offsetText = ` (Tono ajustado: ${item.transposeOffset > 0 ? '+' : ''}${item.transposeOffset})`;
                }
                const noteText = item.note ? `\n   ↳ ${item.note}` : '';
                return `${index + 1}. ${item.title}${offsetText}${noteText}`;
            }).join('\n');

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('¡Setlist copiado al portapapeles!');
        }).catch(err => {
            console.error('Error al copiar al portapapeles', err);
        });
    };

    const copyPublicLink = () => {
        if (!id) return;
        const link = `${window.location.origin}/share/repertoires/${id}`;
        navigator.clipboard.writeText(link).then(() => {
            alert('¡Enlace público copiado al portapapeles!');
        }).catch(err => {
            console.error('Error copiando link', err);
        });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIdx(index);
        e.dataTransfer.effectAllowed = 'move';
        // Hack for Firefox
        e.dataTransfer.setData('text/html', '');
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedItemIdx === null || draggedItemIdx === index) return;

        const itemsCopy = [...populatedItems];
        const dragged = itemsCopy[draggedItemIdx];
        itemsCopy.splice(draggedItemIdx, 1);
        itemsCopy.splice(index, 0, dragged);

        setDraggedItemIdx(index);
        setPopulatedItems(itemsCopy);
    };

    const handleDragEnd = async () => {
        setDraggedItemIdx(null);
        if (!id) return;

        // Convertir la lista visible a una estructura entendida por firebase con posiciones
        const newOrderIds = populatedItems.map((item) => ({ id: item.id }));
        try {
            await RepertoiresRepository.reorderItems(id, newOrderIds);

            // Refrescar el elemento en firestore re-ordenando también el array interno,
            // (el repository web ya actualiza position, pero para que al refrescar mantenga el mismo orden hay que ordenar array items)
            // (Se modificó repository web / ó fetch anterior para confiar en position)
        } catch (e) {
            console.error("Error guardando el nuevo orden", e);
        }
    };

    if (loading) return <div style={{ padding: '40px' }}>Cargando repertorio...</div>;
    if (!repertoire) return <div style={{ padding: '40px' }}>Repertorio no encontrado.</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '900px', margin: '0 auto' }}>
            <button
                onClick={() => navigate('/repertoires')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px' }}
            >
                <ArrowLeft size={20} /> Volver a Repertorios
            </button>

            <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '16px' }}>{repertoire.title}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px', color: 'var(--text-secondary)' }}>
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

                <div style={{ display: 'flex', gap: '16px' }}>
                    <button
                        onClick={copyPublicLink}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            padding: '12px 24px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            fontWeight: 600, transition: 'var(--transition)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Copiar Enlace Público para Invitados"
                    >
                        <Globe size={20} /> Link Público
                    </button>

                    <button
                        onClick={copySetlist}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: 'transparent', color: 'var(--text-primary)',
                            padding: '12px 24px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            fontWeight: 600, transition: 'var(--transition)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <Share2 size={20} /> Compartir
                    </button>

                    <button
                        onClick={() => setIsSearchModalOpen(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: 'var(--accent-color)', color: 'white',
                            padding: '12px 24px', borderRadius: 'var(--radius-md)',
                            border: 'none',
                            fontWeight: 600, transition: 'var(--transition)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        <Plus size={20} /> Añadir Canto
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {populatedItems.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)' }}>Este repertorio aún no tiene cantos asignados.</p>
                ) : (
                    populatedItems.map((item, index) => (
                        <div
                            key={item.id || `fallback-${item.cantoId}`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => navigate(`/cantos/${item.cantoId}`, {
                                state: { 
                                    repertoireId: id, 
                                    itemId: item.id, 
                                    initialOffset: item.transposeOffset,
                                    songList: populatedItems.map(i => ({ 
                                        id: i.cantoId, 
                                        title: i.title, 
                                        itemId: i.id, 
                                        offset: i.transposeOffset 
                                    }))
                                }
                            })}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '20px 24px',
                                backgroundColor: draggedItemIdx === index ? 'var(--bg-surface-hover)' : 'var(--bg-surface)',
                                border: '1px solid',
                                borderColor: draggedItemIdx === index ? 'var(--accent-color)' : 'var(--border-color)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'grab',
                                opacity: draggedItemIdx === index ? 0.6 : 1,
                                transition: 'var(--transition)',
                                position: 'relative' // Para el boton de borrar absoluto a la derecha
                            }}
                            onMouseEnter={e => {
                                if (draggedItemIdx !== index) {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                }
                                const delBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                if (delBtn) delBtn.style.opacity = '1';
                            }}
                            onMouseLeave={e => {
                                if (draggedItemIdx !== index) {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                }
                                const delBtn = e.currentTarget.querySelector('.delete-btn') as HTMLElement;
                                if (delBtn) delBtn.style.opacity = '0';
                            }}
                        >
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--accent-color)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                marginRight: '16px',
                                flexShrink: 0
                            }}>
                                {index + 1}
                            </div>

                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>{item.title}</h4>
                                {item.transposeOffset !== 0 && (
                                    <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                        <span>Tono Ajustado: {item.transposeOffset > 0 ? `+${item.transposeOffset}` : item.transposeOffset}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                className="delete-btn"
                                onClick={async (e) => {
                                    e.stopPropagation(); // Evitar navegar hacia el canto
                                    if (window.confirm('¿Seguro que deseas quitar este canto del repertorio?')) {
                                        await RepertoiresRepository.removeItem(item.id, id!);
                                        setPopulatedItems(p => p.filter(i => i.id !== item.id));
                                    }
                                }}
                                style={{
                                    opacity: 0,
                                    transition: 'opacity 0.2s',
                                    padding: '8px',
                                    color: 'var(--error-color, #ef4444)',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    borderRadius: 'var(--radius-sm)'
                                }}
                                title="Quitar del Repertorio"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de Búsqueda */}
            {isSearchModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-surface)', width: '100%', maxWidth: '600px',
                        borderRadius: 'var(--radius-lg)', padding: '32px',
                        maxHeight: '90vh', display: 'flex', flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Añadir al Repertorio</h2>
                            <button onClick={() => setIsSearchModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>✕</button>
                        </div>

                        <input
                            type="text"
                            placeholder="Buscar por título o letra..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%', padding: '16px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)', marginBottom: '24px', fontSize: '1.125rem'
                            }}
                        />

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {allKnownCantos
                                .filter(c => {
                                    const q = normalizeText(searchQuery);
                                    if (!q) return true;
                                    const titleMatch = normalizeText(c.title).includes(q);
                                    const categoryMatch = c.category ? normalizeText(c.category).includes(q) : false;
                                    const contentMatch = c.content ? normalizeText(c.content).includes(q) : false;
                                    return titleMatch || categoryMatch || contentMatch;
                                })
                                .sort((a, b) => {
                                    const q = normalizeText(searchQuery);
                                    if (!q) return 0;
                                    const aTitleMatch = normalizeText(a.title).includes(q);
                                    const bTitleMatch = normalizeText(b.title).includes(q);
                                    if (aTitleMatch && !bTitleMatch) return -1;
                                    if (!aTitleMatch && bTitleMatch) return 1;
                                    return a.title.localeCompare(b.title);
                                })
                                .slice(0, 15) // Limit pagination
                                .map(canto => (
                                    <div
                                        key={canto.id}
                                        style={{
                                            padding: '16px', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--border-color)', display: 'flex',
                                            justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{canto.title}</p>
                                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{canto.category}</p>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                if (!id) return;
                                                try {
                                                    const newId = await RepertoiresRepository.addItem(id, canto.id!, populatedItems.length);

                                                    // Add to local state using newly created ID
                                                    setPopulatedItems(prev => [...prev, {
                                                        id: newId,
                                                        cantoId: canto.id!,
                                                        title: canto.title,
                                                        type: canto.category || "General",
                                                        targetNotation: "latina",
                                                        transposeOffset: 0
                                                    }]);

                                                    setIsSearchModalOpen(false);
                                                } catch (err) {
                                                    console.error("Error adding canto to repertoire", err);
                                                }
                                            }}
                                            style={{
                                                padding: '8px 16px', backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                                color: 'var(--accent-color)', borderRadius: 'var(--radius-sm)',
                                                fontWeight: 600
                                            }}
                                        >
                                            <Plus size={16} style={{ display: 'inline', marginRight: '4px' }} /> Añadir
                                        </button>
                                    </div>
                                ))}

                            {allKnownCantos.length > 0 &&
                                allKnownCantos.filter(c => {
                                    const q = normalizeText(searchQuery);
                                    const titleMatch = normalizeText(c.title).includes(q);
                                    const contentMatch = c.content ? normalizeText(c.content).includes(q) : false;
                                    return titleMatch || contentMatch;
                                }).length === 0 && (
                                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No se encontraron cantos para "{searchQuery}"</p>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
