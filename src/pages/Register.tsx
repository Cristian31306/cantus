import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AuthService } from '../core/auth/auth.service';

export const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await AuthService.signUp(email, password);
        } catch (err: any) {
            console.error("Error al registrar: ", err);
            let userMessage = 'Error al crear la cuenta. Por favor, intenta de nuevo.';
            if (err.code === 'auth/email-already-in-use') {
                userMessage = 'Este correo electrónico ya está registrado.';
            } else if (err.code === 'auth/weak-password') {
                userMessage = 'La contraseña es muy débil (mínimo 6 caracteres).';
            } else if (err.code === 'auth/invalid-email') {
                userMessage = 'El formato del correo electrónico no es válido.';
            } else if (err.code === 'auth/operation-not-allowed') {
                userMessage = 'El registro con correo y contraseña no está habilitado en Firebase.';
            }
            
            setError(userMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', width: '100vw', height: '100vh',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'var(--bg-color)',
            backgroundImage: 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.1), transparent 40%)'
        }}>
            <form className="glass-panel" onSubmit={handleRegister} style={{
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
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 'var(--radius-full)',
                        marginBottom: '16px'
                    }}>
                        <img src="/vite.svg" alt="Cantus Logo" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
                    </div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Únete a Cantus</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Crea tu cuenta para empezar</p>
                </div>

                {error && (
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        padding: '12px 16px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: 'var(--error-color, #ef4444)', borderRadius: 'var(--radius-md)', 
                        fontSize: '0.875rem', fontWeight: 500, border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>{error}</span>
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
                    <div style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="input-field"
                            placeholder="••••••••"
                            style={{ paddingRight: '40px', width: '100%' }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--text-secondary)',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary" style={{ marginTop: '10px' }} disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Registrarse'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        ¿Ya tienes una cuenta? <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Inicia sesión</Link>
                    </p>
                </div>
            </form>
        </div>
    );
};
