import { useNavigate } from 'react-router-dom';
import AdminPanel from '../AdminPanel';
import { useAuth } from '../AuthContext';

export default function AdminPage() {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login/admin');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <strong className="text-xl text-brand-700">Painel Admin</strong>
            <p className="text-sm text-slate-500">Bem-vindo, {auth.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <AdminPanel />
      </main>
    </div>
  );
}
