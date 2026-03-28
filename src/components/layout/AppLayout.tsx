import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { usePreferencesStore } from '../../store/preferences';
import { useEffect } from 'react';

export const AppLayout = () => {
    const { theme } = usePreferencesStore();

    useEffect(() => {
        let activeTheme = theme;
        if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        document.documentElement.setAttribute('data-theme', activeTheme);

        // Listener para cambios de sistema
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="app-main" style={{ backgroundColor: 'var(--bg-color)' }}>
                <Outlet />
            </main>
        </div>
    );
};
