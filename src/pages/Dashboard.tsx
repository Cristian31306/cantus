import { useEffect, useState } from 'react';
import { Music, Library, Hash, TrendingUp } from 'lucide-react';
import { CantosRepository, type Canto } from '../core/cantos/cantos.repository';
import { RepertoiresRepository, type Repertoire } from '../core/repertoires/repertoires.repository';

export const Dashboard = () => {
    const [cantos, setCantos] = useState<Canto[]>([]);
    const [repertoires, setRepertoires] = useState<Repertoire[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isCantosLoaded = false;
        let isRepertoiresLoaded = false;

        const checkLoading = () => {
            if (isCantosLoaded && isRepertoiresLoaded) setLoading(false);
        };

        const unsubCantos = CantosRepository.subscribeAll((data) => {
            setCantos(data);
            isCantosLoaded = true;
            checkLoading();
        });

        const unsubRepertoires = RepertoiresRepository.subscribeAll((data) => {
            setRepertoires(data);
            isRepertoiresLoaded = true;
            checkLoading();
        });

        return () => {
            unsubCantos();
            unsubRepertoires();
        };
    }, []);

    const uniqueCategories = new Set(cantos.map(c => c.category).filter(Boolean)).size;

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '8px' }}>Hola, bienvenido a Cantus</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '40px' }}>
                Aquí tienes un resumen general de tu biblioteca musical.
            </p>

            {loading ? (
                <p>Cargando tus estadísticas...</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>

                    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Total de Cantos</h3>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <Music color="var(--accent-color)" size={24} />
                            </div>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{cantos.length}</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Repertorios</h3>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <Library color="#10b981" size={24} />
                            </div>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{repertoires.length}</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Categorías Usadas</h3>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <Hash color="#f59e0b" size={24} />
                            </div>
                        </div>
                        <p style={{ fontSize: '2.5rem', fontWeight: 800 }}>{uniqueCategories}</p>
                    </div>

                    <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Estado Sync</h3>
                            <div style={{ padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <TrendingUp color="#8b5cf6" size={24} />
                            </div>
                        </div>
                        <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>En Línea</p>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Conectado a Firebase</p>
                    </div>

                </div>
            )}
        </div>
    );
};
