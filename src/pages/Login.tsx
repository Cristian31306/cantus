import { useState } from 'react';
import { Music } from 'lucide-react';
import { AuthService } from '../core/auth/auth.service';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await AuthService.signIn(email, password);
        } catch (err: any) {
            setError(err.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', width: '100vw', height: '100vh',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--bg-color)',
            backgroundImage: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.1), transparent 40%)'
        }}>
            <form className="glass-panel" onSubmit={handleLogin} style={{
                padding: '40px',
                borderRadius: 'var(--radius-lg)',
                width: '100%',
                maxWidth: '400px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                boxShadow: 'var(--shadow-lg)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <div style={{
                        display: 'inline-flex', padding: '16px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: 'var(--radius-full)',
                        color: 'var(--accent-color)',
                        marginBottom: '16px'
                    }}>
                        <Music size={32} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Bienvenido a Cantus</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Inicia sesión para continuar</p>
                </div>

                {error && (
                    <div style={{
                        padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444', borderRadius: 'var(--radius-md)', fontSize: '0.875rem'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Correo electrónico</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="input-field"
                        placeholder="tu@correo.com"
                        required
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="input-field"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                    {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>
            </form>
        </div>
    );
};
