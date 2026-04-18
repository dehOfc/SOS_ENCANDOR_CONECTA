import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface ServiceRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  serviceType: string;
  preferredDate: string | null;
  preferredTime: string | null;
  details: string;
  status: string;
  receivedAt: string;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function PartnerPanel() {
  const { auth, logout, fetchWithAuth } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.partnerId) {
      setError('Parceiro não identificado. Faça login novamente.');
      setLoading(false);
      return;
    }

    async function loadRequests() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchWithAuth('/api/partner/requests');
        if (!response.ok) {
          throw new Error('Falha ao carregar atendimentos.');
        }

        const data: ServiceRequest[] = await response.json();
        setRequests(data);
      } catch (err) {
        console.error(err);
        setError('Não foi possível carregar as solicitações do parceiro.');
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, [auth.partnerId, auth, fetchWithAuth]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <strong className="text-xl text-brand-700">Painel do Parceiro</strong>
            <p className="text-sm text-slate-500">Encaminhamentos para {auth.email}</p>
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
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-700">Atendimentos</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Seus serviços atribuídos</h1>
              <p className="mt-2 text-slate-600">Veja as solicitações de serviço que foram associadas ao seu perfil.</p>
            </div>
            <div className="rounded-full bg-slate-50 px-5 py-3 text-sm text-slate-600">Total: {requests.length}</div>
          </div>

          {loading && <p className="text-slate-600">Carregando solicitações...</p>}
          {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              {requests.length === 0 ? (
                <p className="text-slate-600">Nenhum atendimento atribuído no momento.</p>
              ) : (
                <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-white text-slate-700">
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Serviço</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Recebida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request.id} className="border-b border-slate-200 bg-white hover:bg-slate-100">
                        <td className="px-4 py-4 text-slate-700">{request.id}</td>
                        <td className="px-4 py-4 text-slate-700">{request.name}</td>
                        <td className="px-4 py-4 text-slate-700">{request.serviceType}</td>
                        <td className="px-4 py-4 text-slate-700">{request.status}</td>
                        <td className="px-4 py-4 text-slate-700">{formatDate(request.receivedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
