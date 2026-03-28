import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit2, X, Check } from 'lucide-react';
import { RepertoiresRepository, type Repertoire } from '../../core/repertoires/repertoires.repository';

const COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#64748b'  // slate
];

export const RepertoiresList = () => {
    const navigate = useNavigate();
    const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);

    // Edit/Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [editingRep, setEditingRep] = useState<Repertoire | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editColor, setEditColor] = useState('');

    useEffect(() => {
        const unsubscribe = RepertoiresRepository.subscribeAll((sortedData) => {
            setRepertoires(sortedData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const filtered = useMemo(() => {
        if (!search) return repertoires;
        
        const lower = search.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        return repertoires.filter(r =>
            r.title.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().includes(lower)
        );
    }, [search, repertoires]);

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, index: number) => {
        // Deshabilitar Drag en modo búsqueda para evitar corrupción de índices
        if (search) {
            e.preventDefault();
            return;
        }
        setDraggedItemIdx(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', '');
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (search || draggedItemIdx === null || draggedItemIdx === index) return;

        const itemsCopy = [...filtered];
        const dragged = itemsCopy[draggedItemIdx];
        itemsCopy.splice(draggedItemIdx, 1);
        itemsCopy.splice(index, 0, dragged);

        setDraggedItemIdx(index);
        // Note: In a real app, we'd update the state via a callback or context to keep source of truth
    };

    const handleDragEnd = async () => {
        setDraggedItemIdx(null);
        if (search) return;

        // Sync to firebase in background
        try {
            await Promise.all(
                filtered.map((r, i) => {
                    if (r.position !== i) {
                        return RepertoiresRepository.update(r.id!, { position: i });
                    }
                    return Promise.resolve();
                })
            );
        } catch (error) {
            console.error("Error sincronizando el orden:", error);
        }
    };

    const openCreateModal = () => {
        setIsCreating(true);
        setEditingRep(null);
        setEditTitle('');
        setEditColor(COLORS[0]);
        setIsModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, rep: Repertoire) => {
        e.stopPropagation();
        setIsCreating(false);
        setEditingRep(rep);
        setEditTitle(rep.title);
        setEditColor(rep.color || COLORS[0]);
        setIsModalOpen(true);
    };

    const saveModal = async () => {
        if (!editTitle.trim()) return;

        if (isCreating) {
            const newRep: Omit<Repertoire, 'id' | 'created_at' | 'updated_at' | '_deleted'> = {
                title: editTitle.trim(),
                color: editColor,
                date: Date.now(),
                team_id: 'default',
                position: repertoires.length,
                items: []
            };
            await RepertoiresRepository.create(newRep);
        } else if (editingRep) {
            const updated = { title: editTitle.trim(), color: editColor };
            await RepertoiresRepository.update(editingRep.id!, updated);
        }

        setIsModalOpen(false);
    };

    return (
        <div style={{ padding: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Repertorios</h1>
                <button
                    onClick={openCreateModal}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={20} /> Nuevo Repertorio
                </button>
            </div>

            <div style={{ marginBottom: '24px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar repertorio por nombre..."
                    className="input-field"
                    style={{ paddingLeft: '48px', maxWidth: '500px' }}
                />
            </div>

            {loading ? (
                <p>Cargando repertorios...</p>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '16px'
                }}>
                    {filtered.map((repertoire, index) => (
                        <div
                            key={repertoire.id}
                            draggable={!search}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            onClick={() => navigate(`/repertoires/${repertoire.id}`)}
                            style={{
                                padding: '24px',
                                backgroundColor: 'var(--bg-surface)',
                                border: '1px solid var(--border-color)',
                                borderLeft: `6px solid ${repertoire.color || 'var(--accent-color)'}`,
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                transition: 'var(--transition)',
                                opacity: draggedItemIdx === index ? 0.5 : 1
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '12px' }}>{repertoire.title}</h3>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        {repertoire.items?.length || 0} cantos configurados
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => openEditModal(e, repertoire)}
                                    style={{
                                        padding: '8px', borderRadius: 'var(--radius-sm)',
                                        backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-secondary)'
                                    }}
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No tienes repertorios guardados.</p>}
                </div>
            )}

            {/* Modal de Edición Básica */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '24px'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-surface)', width: '100%', maxWidth: '400px',
                        borderRadius: 'var(--radius-lg)', padding: '32px', border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                {isCreating ? 'Nuevo Repertorio' : 'Editar Repertorio'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>
                                    Nombre del Repertorio
                                </label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="input-field"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px' }}>
                                    Color Identificador
                                </label>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setEditColor(c)}
                                            style={{
                                                width: '40px', height: '40px', borderRadius: '50%',
                                                backgroundColor: c, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: editColor === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                                                transition: 'var(--transition)'
                                            }}
                                        >
                                            {editColor === c && <Check size={20} color="white" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={saveModal}
                                disabled={!editTitle.trim()}
                                className="btn-primary"
                                style={{
                                    width: '100%', padding: '14px', fontSize: '1.1rem',
                                    opacity: !editTitle.trim() ? 0.7 : 1
                                }}
                            >
                                {isCreating ? 'Crear Repertorio' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
