import { usePreferencesStore } from '../store/preferences';
import { Moon, Sun, Monitor, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { CantosRepository, type Canto } from '../core/cantos/cantos.repository';
import { useState, useRef } from 'react';

export const SettingsPage = () => {
    const { theme, setTheme } = usePreferencesStore();
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const exportToExcel = async () => {
        setIsExporting(true);
        try {
            const allCantos = await CantosRepository.getAll();
            if (allCantos.length === 0) {
                alert('No hay cantos en la base de datos para exportar.');
                setIsExporting(false);
                return;
            }

            // Excluir metadatos innecesarios como id o created_at / _deleted
            const dataToExport = allCantos.map(c => ({
                title: c.title,
                content: c.content,
                key: c.key,
                category: c.category || '',
                note: c.note || '',
                transpose_offset: c.transpose_offset || 0
            }));

            // Excel export usando xlsx
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Cantos");

            // Escribir el archivo
            XLSX.writeFile(workbook, `respaldo_cantus_${new Date().toISOString().slice(0, 10)}.xlsx`);

            // Toast feedback
            alert('¡Respaldo Excel exportado exitosamente!');
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Hubo un error al exportar la base de datos.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const rows = XLSX.utils.sheet_to_json(worksheet) as any[];
            let importedCount = 0;

            if (rows.length === 0) {
                alert('El archivo Excel está vacío o el formato es inválido.');
                setIsImporting(false);
                return;
            }

            for (const row of rows) {
                if (!row.title || !row.content) continue; // Título y contenido son obligatorios

                const newCanto: Omit<Canto, 'id' | 'created_at' | 'updated_at' | '_deleted'> = {
                    title: String(row.title).trim(),
                    content: String(row.content).trim(),
                    key: String(row.key || 'C').trim() || 'C',
                    category: String(row.category || '').trim(),
                    note: String(row.note || '').trim(),
                    transpose_offset: Number(row.transpose_offset) || 0
                };

                await CantosRepository.create(newCanto);
                importedCount++;
            }

            alert(`¡Éxito! Se importaron ${importedCount} cantos a tu biblioteca.`);
        } catch (error) {
            console.error('Error importando Excel:', error);
            alert('Hubo un error procesando el archivo Excel.');
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div style={{ padding: '40px', maxWidth: '800px' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '40px' }}>Ajustes</h1>

            <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Aspecto visual</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Personaliza cómo se ve Cantus en tu dispositivo.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setTheme('light')}
                        style={{
                            flex: 1, minWidth: '150px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                            padding: '24px', borderRadius: 'var(--radius-md)',
                            backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                            border: `2px solid ${theme === 'light' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                            color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition)'
                        }}
                    >
                        <Sun size={32} color={theme === 'light' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                        <span style={{ fontWeight: 600 }}>Claro</span>
                    </button>

                    <button
                        onClick={() => setTheme('dark')}
                        style={{
                            flex: 1, minWidth: '150px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                            padding: '24px', borderRadius: 'var(--radius-md)',
                            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                            border: `2px solid ${theme === 'dark' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                            color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition)'
                        }}
                    >
                        <Moon size={32} color={theme === 'dark' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                        <span style={{ fontWeight: 600 }}>Oscuro</span>
                    </button>

                    <button
                        onClick={() => setTheme('system')}
                        style={{
                            flex: 1, minWidth: '150px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
                            padding: '24px', borderRadius: 'var(--radius-md)',
                            backgroundColor: theme === 'system' ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface)',
                            border: `2px solid ${theme === 'system' ? 'var(--accent-color)' : 'var(--border-color)'}`,
                            color: 'var(--text-primary)', cursor: 'pointer', transition: 'var(--transition)'
                        }}
                    >
                        <Monitor size={32} color={theme === 'system' ? 'var(--accent-color)' : 'var(--text-secondary)'} />
                        <span style={{ fontWeight: 600 }}>Sistema</span>
                    </button>
                </div>
            </div>

            <div style={{
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                padding: '24px',
                marginBottom: '24px'
            }}>
                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>Gestión de Datos</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Respaldos en formato Excel (.xlsx). Crea una copia de seguridad local de todos tus cantos para usar en Excel, o sube tu propia base de datos externa.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <button
                        onClick={exportToExcel}
                        disabled={isExporting}
                        style={{
                            flex: 1, minWidth: '150px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '16px 24px', borderRadius: 'var(--radius-md)',
                            backgroundColor: 'transparent',
                            border: `2px solid var(--border-color)`,
                            color: 'var(--text-primary)', cursor: isExporting ? 'not-allowed' : 'pointer',
                            transition: 'var(--transition)', opacity: isExporting ? 0.7 : 1
                        }}
                        onMouseEnter={e => !isExporting && (e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)')}
                        onMouseLeave={e => !isExporting && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                        <Download size={20} />
                        <span style={{ fontWeight: 600 }}>{isExporting ? 'Exportando...' : 'Exportar Cantos a Excel'}</span>
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        style={{
                            flex: 1, minWidth: '150px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
                            padding: '16px 24px', borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--accent-color)',
                            border: `2px solid var(--accent-color)`,
                            color: 'white', cursor: isImporting ? 'not-allowed' : 'pointer',
                            transition: 'var(--transition)', opacity: isImporting ? 0.7 : 1
                        }}
                        onMouseEnter={e => !isImporting && (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={e => !isImporting && (e.currentTarget.style.opacity = '1')}
                    >
                        <Upload size={20} />
                        <span style={{ fontWeight: 600 }}>{isImporting ? 'Importando...' : 'Importar Excel'}</span>
                    </button>

                    {/* Input invisible encargado de abrir el explorador de archivos */}
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleImportExcel}
                    />
                </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'center', marginTop: '40px' }}>
                Cantus V1.2.0
            </p>
        </div>
    );
};
