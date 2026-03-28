import { NavLink } from 'react-router-dom';
import { Home, Music, BookOpen, Settings } from 'lucide-react';

export const BottomNav = () => {
    const navItems = [
        { icon: <Home size={22} />, label: 'Inicio', path: '/' },
        { icon: <Music size={22} />, label: 'Cantos', path: '/cantos' },
        { icon: <BookOpen size={22} />, label: 'Repertorios', path: '/repertoires' },
        { icon: <Settings size={22} />, label: 'Ajustes', path: '/settings' },
    ];

    return (
        <nav className="bottom-nav">
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => 
                        `bottom-nav-item ${isActive ? 'active' : ''}`
                    }
                >
                    {item.icon}
                    <span>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};
