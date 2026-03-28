import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { AuthService } from './core/auth/auth.service';

import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { CantosList } from './pages/cantos/CantosList';
import { CantoView } from './pages/cantos/CantoView';
import { CantoEditor } from './pages/cantos/CantoEditor';
import { RepertoiresList } from './pages/repertoires/RepertoiresList';
import { RepertoireView } from './pages/repertoires/RepertoireView';
import { SettingsPage } from './pages/Settings';
import { SharedRepertoireView } from './pages/share/SharedRepertoireView';
import { SharedCantoView } from './pages/share/SharedCantoView';

function App() {
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = AuthService.subscribe();
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center' }}>
        <p>Cargando Cantus Web...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/share/repertoires/:id" element={<SharedRepertoireView />} />
        <Route path="/share/cantos/:id" element={<SharedCantoView />} />
        {!user ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cantos" element={<CantosList />} />
            <Route path="/cantos/new" element={<CantoEditor />} />
            <Route path="/cantos/:id" element={<CantoView />} />
            <Route path="/cantos/:id/edit" element={<CantoEditor />} />
            <Route path="/repertoires" element={<RepertoiresList />} />
            <Route path="/repertoires/:id" element={<RepertoireView />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
