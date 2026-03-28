import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Music, Library, Settings, LogOut, AlertTriangle } from 'lucide-react';
import { AuthService } from '../../core/auth/auth.service';
import { useState } from 'react';

export const Sidebar = () => {
    const navigate = useNavigate();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const confirmLogout = async () => {
        setIsLogoutModalOpen(false);
        await AuthService.signOut();
        navigate('/login');
    };

    return (
        <aside className="app-sidebar">
            <div style={{ padding: '0 12px', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/vite.svg" alt="Cantus Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0px 2px 4px rgba(59, 130, 246, 0.3))' }} />
                    <span className="sidebar-logo-text">Cantus</span>
                </h1>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <SidebarLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
                <SidebarLink to="/cantos" icon={<Music size={20} />} label="Cantos" />
                <SidebarLink to="/repertoires" icon={<Library size={20} />} label="Repertorios" />
            </nav>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SidebarLink to="/settings" icon={<Settings size={20} />} label="Ajustes" />
                <button
                    onClick={() => setIsLogoutModalOpen(true)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                        borderRadius: 'var(--radius-md)', color: '#ef4444', fontWeight: 500,
                        transition: 'var(--transition)', border: 'none', backgroundColor: 'transparent',
                        cursor: 'pointer', textAlign: 'left'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    <LogOut size={20} />
                    <span className="nav-label">Cerrar Sesión</span>
                </button>
            </div>

            {isLogoutModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'var(--bg-surface)', padding: '32px', borderRadius: 'var(--radius-lg)',
                        width: '100%', maxWidth: '400px', border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                            <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '50%' }}>
                                <AlertTriangle size={32} color="#ef4444" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Cerrar Sesión</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: 1.5 }}>
                            ¿Estás seguro que deseas salir de Cantus? Tendrás que volver a iniciar sesión para acceder a tus repertorios y cantos.
                        </p>

                        <div style={{ display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setIsLogoutModalOpen(false)}
                                style={{
                                    padding: '12px 24px', borderRadius: 'var(--radius-md)',
                                    fontWeight: 600, color: 'var(--text-secondary)',
                                    backgroundColor: 'var(--bg-surface-hover)', transition: 'var(--transition)'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmLogout}
                                style={{
                                    padding: '12px 24px', borderRadius: 'var(--radius-md)',
                                    fontWeight: 600, color: 'white',
                                    backgroundColor: '#ef4444', transition: 'var(--transition)'
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#dc2626'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ef4444'}
                            >
                                Sí, salir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};

const SidebarLink = ({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) => {
    return (
        <NavLink
            to={to}
            end={to === "/"}
            style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--bg-surface-hover)' : 'transparent',
                fontWeight: isActive ? 600 : 500,
                transition: 'var(--transition)',
                textDecoration: 'none'
            })}
        >
            {icon}
            <span className="nav-label">{label}</span>
        </NavLink>
    );
};
