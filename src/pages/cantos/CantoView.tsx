import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronUp, ChevronDown, Plus, Minus, Edit, Settings, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CantosRepository, type Canto } from '../../core/cantos/cantos.repository';
import { RepertoiresRepository } from '../../core/repertoires/repertoires.repository';
import { ChordProParser } from '../../core/music/chordpro';
import { usePreferencesStore } from '../../store/preferences';

export const CantoView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { repertoireId, itemId, initialOffset, songList } = state || {};

    const [canto, setCanto] = useState<Canto | null>(null);
    const [loading, setLoading] = useState(true);
    const [offsets, setOffsets] = useState(initialOffset || 0);
    const [showTools, setShowTools] = useState(false);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const { notation, fontSize, setFontSize } = usePreferencesStore();

    useEffect(() => {
        if (!id) return;
        const fetchCanto = async () => {
            const data = await CantosRepository.getById(id);
            if (data) {
                setCanto(data);
                if (!repertoireId && data.transpose_offset !== undefined) {
                    setOffsets(data.transpose_offset);
                }
            }
            setLoading(false);
        };
        fetchCanto();
    }, [id]);

    // Lógica de Navegación Lateral
    const currentSongIndex = songList?.findIndex((s: any) => s.id === id);
    const hasNext = songList && currentSongIndex < songList.length - 1;
    const hasPrev = songList && currentSongIndex > 0;

    const navigateToSong = (index: number) => {
        const nextSong = songList[index];
        navigate(`/cantos/${nextSong.id}`, {
            state: { 
                repertoireId, 
                itemId: nextSong.itemId, 
                initialOffset: nextSong.offset,
                songList 
            },
            replace: true
        });
        window.scrollTo(0, 0);
    };

    const handleNext = () => hasNext && navigateToSong(currentSongIndex + 1);
    const handlePrev = () => hasPrev && navigateToSong(currentSongIndex - 1);

    // Swipe detection
    const minSwipeDistance = 50;
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };
    const onTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) handleNext();
        if (isRightSwipe) handlePrev();
    };

    const changeOffset = async (delta: number) => {
        const newOffset = offsets + delta;
        setOffsets(newOffset);
        if (repertoireId && itemId) {
            await RepertoiresRepository.updateItem(itemId, repertoireId, { transpose_offset: newOffset });
        } else if (canto?.id) {
            await CantosRepository.update(canto.id, { transpose_offset: newOffset });
        }
    };

    useEffect(() => {
        // Atajos de Teclado
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                changeOffset(1);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                changeOffset(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [offsets, repertoireId, itemId, canto]);

    if (loading) return <div style={{ padding: '40px' }}>Cargando detalles...</div>;
    if (!canto) return <div style={{ padding: '40px' }}>Canto no encontrado.</div>;

    // Transponer el contenido HTML usando la notación preferida del usuario
    const contentToRender = ChordProParser.transpose(canto.content, offsets, notation);

    // Parse to simple HTML form where chords are above lyrics
    const renderVerses = (text: string) => {
        const blocks = text.split(/\n\s*\n/);

        return blocks.map((block, blockIdx) => {
            if (!block.trim()) return null;

            const isChorus = /^(?:"|Coro:|Estribillo:)/i.test(block.trim());
            let cleanBlock = block.trim();
            if (cleanBlock.startsWith('"') && cleanBlock.endsWith('"')) {
                cleanBlock = cleanBlock.substring(1, cleanBlock.length - 1).trim();
            } else if (cleanBlock.startsWith('"')) {
                cleanBlock = cleanBlock.substring(1).trim();
            }

            const lines = cleanBlock.split(/\r?\n|\\n/);

            return (
                <div
                    key={blockIdx}
                    style={{
                        marginBottom: '24px',
                        padding: isChorus ? '16px 24px' : '0',
                        backgroundColor: isChorus ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                        borderRadius: isChorus ? 'var(--radius-md)' : '0',
                        borderLeft: isChorus ? '4px solid var(--accent-color)' : 'none',
                        lineHeight: '1.8'
                    }}
                >
                    {lines.map((line, lineIdx) => {
                        const parts = line.split(/(\[[^\]]+\])/g);
                        const hasChords = parts.some(p => p.startsWith('[') && p.endsWith(']'));

                        if (!hasChords) {
                            return (
                                <div key={lineIdx} style={{
                                    whiteSpace: 'pre',
                                    fontSize: `${fontSize / 16}rem`,
                                    marginBottom: '4px',
                                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
                                }}>
                                    {line}
                                </div>
                            );
                        }

                        const segments: { chord: string | null; text: string }[] = [];
                        let currentChord: string | null = null;
                        let currentText = '';

                        parts.forEach(p => {
                            if (p.startsWith('[') && p.endsWith(']')) {
                                if (currentText || currentChord) {
                                    segments.push({ chord: currentChord, text: currentText });
                                }
                                currentChord = p.slice(1, -1);
                                currentText = '';
                            } else {
                                currentText += p;
                            }
                        });
                        if (currentText || currentChord) {
                            segments.push({ chord: currentChord, text: currentText });
                        }

                        return (
                            <div key={lineIdx} style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'flex-end',
                                fontSize: `${fontSize / 16}rem`,
                                marginBottom: '14px',
                                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif'
                            }}>
                                {segments.map((seg, i) => (
                                    <div key={i} style={{
                                        display: 'inline-flex',
                                        flexDirection: 'column',
                                        lineHeight: '1.2',
                                        minWidth: seg.chord ? '1ch' : 'auto'
                                    }}>
                                        <span style={{
                                            color: 'var(--accent-color)',
                                            fontWeight: 700,
                                            fontSize: '0.85em',
                                            minHeight: '1.1em',
                                            paddingRight: '4px'
                                        }}>
                                            {seg.chord || ''}
                                        </span>
                                        <span style={{ whiteSpace: 'pre' }}>
                                            {seg.text || (seg.chord ? ' ' : '')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            );
        });
    };

    return (
        <div className="canto-layout">
            {/* Contenido Principal */}
            <div className="canto-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => navigate(repertoireId ? `/repertoires/${repertoireId}` : '/cantos')}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-hover)' }}
                        >
                            <ArrowLeft size={20} /> <span className="desktop-only">{repertoireId ? 'Repertorio' : 'Volver'}</span>
                        </button>
                        
                        {songList && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
                                <button 
                                    onClick={handlePrev} 
                                    disabled={!hasPrev}
                                    style={{ padding: '6px', color: hasPrev ? 'var(--text-primary)' : 'var(--text-tertiary)', opacity: hasPrev ? 1 : 0.4 }}
                                >
                                    <ChevronLeft size={22} />
                                </button>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, padding: '0 8px', color: 'var(--text-secondary)' }}>
                                    {currentSongIndex + 1} / {songList.length}
                                </span>
                                <button 
                                    onClick={handleNext} 
                                    disabled={!hasNext}
                                    style={{ padding: '6px', color: hasNext ? 'var(--text-primary)' : 'var(--text-tertiary)', opacity: hasNext ? 1 : 0.4 }}
                                >
                                    <ChevronRight size={22} />
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => navigate(`/cantos/${canto.id}/edit`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', fontWeight: 600, padding: '8px 12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface-hover)' }}
                    >
                        <Edit size={20} /> <span className="desktop-only">Editar</span>
                    </button>
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1 }}>{canto.title}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginTop: '12px' }}>
                    {canto.category}
                </p>

                <div 
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    style={{
                        marginTop: '40px',
                        lineHeight: 1.8,
                        minHeight: '60vh'
                    }}
                >
                    {renderVerses(contentToRender)}
                </div>
            </div>

            {/* Sidebar de Herramientas (Escritorio) */}
            <div className="canto-sidebar">
                <ToolsContent 
                    canto={canto} 
                    offsets={offsets} 
                    changeOffset={changeOffset} 
                    fontSize={fontSize} 
                    setFontSize={setFontSize} 
                />
            </div>

            {/* Floating Action Button (Móvil) */}
            <button className="fab" onClick={() => setShowTools(true)}>
                <Settings size={28} />
            </button>

            {/* Bottom Sheet (Móvil) */}
            {showTools && (
                <>
                    <div className="bottom-sheet-overlay" onClick={() => setShowTools(false)} />
                    <div className="bottom-sheet open">
                        <div className="bottom-sheet-handle" onClick={() => setShowTools(false)} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Herramientas</h3>
                            <button onClick={() => setShowTools(false)} style={{ color: 'var(--text-secondary)' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <ToolsContent 
                            canto={canto} 
                            offsets={offsets} 
                            changeOffset={changeOffset} 
                            fontSize={fontSize} 
                            setFontSize={setFontSize} 
                        />
                    </div>
                </>
            )}
        </div>
    );
};

// Componente interno para reutilizar el contenido de herramientas
const ToolsContent = ({ canto, offsets, changeOffset, fontSize, setFontSize }: any) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Tono Original */}
            <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Tono Original</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-color)' }}>{canto.key || 'N/A'}</p>
            </div>

            {/* Panel de Transposición */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Transposición</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => changeOffset(-1)}
                        style={{ padding: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}
                    >
                        <ChevronDown size={24} />
                    </button>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, width: '40px', textAlign: 'center' }}>
                        {offsets > 0 ? `+${offsets}` : offsets}
                    </div>
                    <button
                        onClick={() => changeOffset(1)}
                        style={{ padding: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}
                    >
                        <ChevronUp size={24} />
                    </button>
                </div>
            </div>

            {/* Panel de Tamaño de Letra */}
            <div className="glass-panel" style={{ padding: '20px', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Tamaño de Letra</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <button
                        onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                        style={{ padding: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}
                    >
                        <Minus size={20} />
                    </button>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600, width: '40px', textAlign: 'center' }}>
                        {fontSize}
                    </div>
                    <button
                        onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                        style={{ padding: '8px', backgroundColor: 'var(--bg-surface-hover)', borderRadius: 'var(--radius-sm)' }}
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Utilidades Adicionales (Ej: Notas) */}
            {canto.note && (
                <div style={{ marginTop: '8px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', backgroundColor: 'rgba(234, 179, 8, 0.05)' }}>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Notas Privadas:</strong>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--text-primary)' }}>
                        {canto.note}
                    </p>
                </div>
            )}
        </div>
    );
};
