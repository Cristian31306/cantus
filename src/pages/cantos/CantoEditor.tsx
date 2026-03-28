import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { CantosRepository } from '../../core/cantos/cantos.repository';
import { useRef } from 'react';

const CATEGORIES = [
    'Entrada', 'Piedad', 'Gloria', 'Entre lecturas', 'Aleluya',
    'Profesión de fe', 'Ofertorio', 'Santo', 'Padre nuestro',
    'Cordero', 'Comunión', 'Despedida', 'Ambientación', 'Alabanza',
    'Adoración', 'Adviento', 'Navidad', 'Cuaresma', 'Semana Santa',
    'Pascua', 'Espíritu Santo', 'Virgen Maria', 'Vocación', 'Misión',
    'Para Niños', 'Difuntos', 'Varios', 'Mensaje', 'Populares', 'Cancionero'
];

const BASE_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Distancias en semitonos para escala mayor: W-W-H-W-W-W-H (2, 2, 1, 2, 2, 2, 1)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11];
// Cualidades de acordes en escala mayor: I, ii, iii, IV, V, vi, vii°
const MAJOR_SCALE_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim'];

// Distancias para escala menor natural: W-H-W-W-H-W-W (2, 1, 2, 2, 1, 2, 2)
const MINOR_SCALE_INTERVALS = [0, 2, 3, 5, 7, 8, 10];
// Cualidades en escala menor: i, ii°, III, iv, v, VI, VII
const MINOR_SCALE_QUALITIES = ['m', 'dim', '', 'm', 'm', '', ''];

export const CantoEditor = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [loading, setLoading] = useState(isEditing);
    const [saving, setSaving] = useState(false);

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [baseNote, setBaseNote] = useState('C');
    const [accidental, setAccidental] = useState('');
    const [quality, setQuality] = useState('');
    const [content, setContent] = useState('');
    const [note, setNote] = useState('');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- Smart Chords Logic ---
    const getScaleChords = () => {
        // Encontrar índice de la nota base combinada con su alteración
        const fullBaseNote = `${baseNote}${accidental}`;

        // Normalizar a sostenidos temporalmente para cálculos matemáticos simples
        let noteIndex = BASE_NOTES.indexOf(fullBaseNote);
        if (noteIndex === -1) {
            // Manejar bemoles manuales
            const flats: Record<string, string> = { 'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B', 'Fb': 'E' };
            noteIndex = BASE_NOTES.indexOf(flats[fullBaseNote] || 'C');
        }

        if (noteIndex === -1) noteIndex = 0; // Fallback a C si algo falla

        const isMinor = quality === 'm';
        const intervals = isMinor ? MINOR_SCALE_INTERVALS : MAJOR_SCALE_INTERVALS;
        const qualities = isMinor ? MINOR_SCALE_QUALITIES : MAJOR_SCALE_QUALITIES;

        return intervals.map((interval, i) => {
            const chordRootIndex = (noteIndex + interval) % 12;
            const chordRoot = BASE_NOTES[chordRootIndex];
            const chordQuality = qualities[i];
            return `${chordRoot}${chordQuality}`;
        });
    };

    const insertChordAtCursor = (chord: string) => {
        if (!textareaRef.current) return;

        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        const currentContent = textarea.value;
        const textToInsert = `[${chord}]`;

        const newContent = currentContent.substring(0, start) + textToInsert + currentContent.substring(end);

        setContent(newContent);

        // Restaurar cursor después de la inserción de manera asíncrona para que React haga render primero
        setTimeout(() => {
            textarea.focus();
            const newCursorPos = start + textToInsert.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }, 0);
    };
    // -------------------------

    useEffect(() => {
        if (!isEditing || !id) return;
        const fetchCanto = async () => {
            const data = await CantosRepository.getById(id);
            if (data) {
                setTitle(data.title);
                setCategory(data.category || CATEGORIES[0]);
                if (data.key) {
                    const match = data.key.match(/^([CDEFGAB])([#b])?(m)?$/);
                    if (match) {
                        setBaseNote(match[1]);
                        setAccidental(match[2] || '');
                        setQuality(match[3] || '');
                    } else {
                        setBaseNote(data.key.charAt(0) || 'C');
                        setAccidental('');
                        setQuality('');
                    }
                } else {
                    setBaseNote('C');
                    setAccidental('');
                    setQuality('');
                }
                setContent(data.content);
                setNote(data.note || '');
            } else {
                navigate('/cantos');
            }
            setLoading(false);
        };
        fetchCanto();
    }, [id, isEditing, navigate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        setSaving(true);
        try {
            const key = `${baseNote}${accidental}${quality}`;
            const cantoData = { title, category, key, content, note, transpose_offset: 0 };

            if (isEditing && id) {
                await CantosRepository.update(id, cantoData);
                navigate(`/cantos/${id}`);
            } else {
                const newId = await CantosRepository.create(cantoData);
                navigate(`/cantos/${newId}`);
            }
        } catch (error) {
            console.error("Error guardando el canto:", error);
            alert("Ocurrió un error al guardar.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '40px' }}>Cargando editor...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <button
                type="button"
                onClick={() => navigate(-1)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', marginBottom: '24px' }}
            >
                <ArrowLeft size={20} /> Cancelar
            </button>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '32px' }}>
                {isEditing ? 'Editar Canto' : 'Nuevo Canto'}
            </h1>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600 }}>Título del Canto *</label>
                    <input
                        required
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Ej: Sumérgeme"
                        style={{
                            padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)', fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '350px' }}>
                        <label style={{ fontWeight: 600 }}>Tono Original</label>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <select
                                value={baseNote}
                                onChange={e => setBaseNote(e.target.value)}
                                style={{
                                    padding: '12px', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)',
                                    color: 'var(--text-primary)', fontSize: '1.25rem', cursor: 'pointer',
                                    fontWeight: 700, width: '70px', textAlign: 'center'
                                }}
                            >
                                {BASE_NOTES.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>

                            <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <button type="button" onClick={() => setAccidental('')} style={{ padding: '12px 16px', border: 'none', backgroundColor: accidental === '' ? 'var(--accent-color)' : 'var(--bg-surface)', color: accidental === '' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>♮</button>
                                <button type="button" onClick={() => setAccidental('#')} style={{ padding: '12px 16px', border: 'none', borderLeft: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', backgroundColor: accidental === '#' ? 'var(--accent-color)' : 'var(--bg-surface)', color: accidental === '#' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>#</button>
                            </div>

                            <div style={{ display: 'flex', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                                <button type="button" onClick={() => setQuality('')} style={{ padding: '12px 16px', border: 'none', backgroundColor: quality === '' ? 'var(--accent-color)' : 'var(--bg-surface)', color: quality === '' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>May</button>
                                <button type="button" onClick={() => setQuality('m')} style={{ padding: '12px 16px', border: 'none', borderLeft: '1px solid var(--border-color)', backgroundColor: quality === 'm' ? 'var(--accent-color)' : 'var(--bg-surface)', color: quality === 'm' ? 'white' : 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>min</button>
                            </div>
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            Tono Final Resultante: <strong style={{ color: 'var(--accent-color)', fontSize: '1rem' }}>{baseNote}{accidental}{quality}</strong>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minWidth: '350px' }}>
                        <label style={{ fontWeight: 600 }}>Categoría / Momento</label>
                        <select
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                            style={{
                                padding: '12px 16px', borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)',
                                color: 'var(--text-primary)', fontSize: '1rem', cursor: 'pointer',
                                height: '52px'
                            }}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600 }}>Notas Opcionales (Privadas)</label>
                    <textarea
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Ej: Empieza el bajo, arpegio de guitarra..."
                        style={{
                            padding: '12px 16px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)',
                            color: 'var(--text-primary)', fontSize: '1rem',
                            minHeight: '80px', resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            Letra y Acordes *
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: 400 }}>
                                (Coloca los acordes entre corchetes [Do] o [C] antes de la sílaba)
                            </span>
                        </div>
                    </label>

                    {/* Menú Inteligente de Acordes (Smart Chords) */}
                    <div style={{
                        display: 'flex', gap: '10px', flexWrap: 'wrap',
                        padding: '12px', backgroundColor: 'var(--bg-surface-hover)',
                        border: '1px solid var(--border-color)', borderBottom: 'none',
                        borderTopLeftRadius: 'var(--radius-md)', borderTopRightRadius: 'var(--radius-md)',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600, marginRight: '8px' }}>
                            Acordes ({baseNote}{accidental}{quality}):
                        </span>
                        {getScaleChords().map((chord, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => insertChordAtCursor(chord)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px',
                                    padding: '6px 12px', backgroundColor: 'var(--bg-surface)',
                                    border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer',
                                    transition: 'var(--transition)', fontSize: '0.875rem'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                    e.currentTarget.style.color = 'var(--accent-color)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'var(--border-color)';
                                    e.currentTarget.style.color = 'var(--text-primary)';
                                }}
                            >
                                <Plus size={14} /> {chord}
                            </button>
                        ))}
                    </div>

                    <textarea
                        required
                        ref={textareaRef}
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        placeholder={'[C]Cansado del cami[G]no, sediento de [Am]Ti...\n\nCoro:\n[C]Sumérgeme...'}
                        style={{
                            padding: '16px',
                            border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)',
                            borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)', fontSize: '1.125rem', fontFamily: 'monospace',
                            minHeight: '400px', resize: 'vertical', lineHeight: '1.5'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            backgroundColor: 'var(--accent-color)', color: 'white',
                            padding: '14px 28px', borderRadius: 'var(--radius-md)',
                            fontWeight: 600, fontSize: '1.125rem', transition: 'var(--transition)',
                            opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer',
                            border: 'none'
                        }}
                    >
                        <Save size={20} />
                        {saving ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Canto')}
                    </button>
                </div>
            </form>
        </div>
    );
};
