import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronUp, ChevronDown, Plus, Minus } from 'lucide-react';
import { CantosRepository, type Canto } from '../../core/cantos/cantos.repository';
import { ChordProParser } from '../../core/music/chordpro';
import { usePreferencesStore } from '../../store/preferences';

export const SharedCantoView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { state } = useLocation();
    const { repertoireId, initialOffset } = state || {};

    const [canto, setCanto] = useState<Canto | null>(null);
    const [loading, setLoading] = useState(true);
    // Para la vista pública, el offset es 100% volátil/en memoria, no lo guardamos en BD
    const [offsets, setOffsets] = useState(initialOffset || 0);
    const { notation, fontSize, setFontSize } = usePreferencesStore();

    useEffect(() => {
        if (!id) return;
        const fetchCanto = async () => {
            const data = await CantosRepository.getById(id);
            if (data) {
                setCanto(data);
                if (!repertoireId && data.transpose_offset !== undefined && initialOffset === undefined) {
                    setOffsets(data.transpose_offset);
                }
            }
            setLoading(false);
        };
        fetchCanto();
    }, [id, repertoireId, initialOffset]);

    const changeOffset = (delta: number) => {
        setOffsets((prev: number) => prev + delta);
    };

    useEffect(() => {
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
    }, []);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Cargando canto...</div>;
    if (!canto) return <div style={{ padding: '40px', textAlign: 'center' }}>Canto no encontrado o privado.</div>;

    const contentToRender = ChordProParser.transpose(canto.content, offsets, notation);

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
        <div className="canto-layout" style={{ backgroundColor: 'var(--bg-default)' }}>
            {/* Contenido Principal */}
            <div className="canto-main">
                <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}
                    >
                        <ArrowLeft size={20} /> Volver
                    </button>
                </div>

                <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.1 }}>{canto.title}</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem', marginTop: '12px' }}>
                    {canto.category}
                </p>

                <div style={{ marginTop: '40px', lineHeight: 1.8 }}>
                    {renderVerses(contentToRender)}
                </div>
            </div>

            {/* Sidebar de Herramientas Read-Only */}
            <div className="canto-sidebar">
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '8px' }}>Herramientas (Visual)</h3>

                {/* Panel de Transposición */}
                <div style={{ padding: '20px', backgroundColor: 'var(--bg-default)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Transponer Acordes</p>
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
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px', textAlign: 'center' }}>Cambios solo aplican para ti</p>
                </div>

                {/* Panel de Tamaño de Letra */}
                <div style={{ padding: '20px', backgroundColor: 'var(--bg-default)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
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
            </div>
        </div>
    );
};
