import { useEffect, useState } from 'react';

type AdminTab = 'requests' | 'partners';

interface Partner {
  id: string;
  name: string;
  email: string;
  phone: string;
  coverage: string;
  rating: number;
  created_at: string;
}

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
  partner_id: string | null;
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const [partnersRes, requestsRes] = await Promise.all([
        fetch('/api/partners'),
        fetch('/api/requests')
      ]);

      if (!partnersRes.ok || !requestsRes.ok) {
        throw new Error('Falha ao carregar dados do painel administrativo.');
      }

      const partnersData: Partner[] = await partnersRes.json();
      const requestsData: ServiceRequest[] = await requestsRes.json();

      setPartners(partnersData);
      setRequests(requestsData);
      setStatusUpdates(requestsData.reduce((acc, request) => ({ ...acc, [request.id]: request.status }), {}));
    } catch (err) {
      console.error(err);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = ['pendente', 'em andamento', 'concluída', 'cancelada'];

  async function handleSaveStatus(id: string) {
    const newStatus = statusUpdates[id];
    if (!newStatus) return;

    setSavingStatus((current) => ({ ...current, [id]: true }));
    setError(null);

    try {
      const response = await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Falha ao atualizar status.');
      }

      const data = await response.json();
      setRequests((current) => current.map((request) => (request.id === id ? data.request : request)));
    } catch (err) {
      console.error(err);
      setError('Não foi possível atualizar o status da solicitação.');
    } finally {
      setSavingStatus((current) => ({ ...current, [id]: false }));
    }
  }

  function handleStatusChange(id: string, value: string) {
    setStatusUpdates((current) => ({ ...current, [id]: value }));
  }

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-700">Administração</p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-900">Painel administrativo</h2>
          <p className="mt-3 text-slate-600">Acompanhe parceiros cadastrados e solicitações recebidas em tempo real.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'requests'
                ? 'bg-brand-700 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Solicitações
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('partners')}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'partners'
                ? 'bg-brand-700 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Parceiros
          </button>
          <button
            type="button"
            onClick={fetchData}
            className="rounded-full border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading && <p className="mt-6 text-slate-600">Carregando dados...</p>}
      {error && <p className="mt-6 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

      {!loading && !error && (
        <div className="mt-8 space-y-8">
          {activeTab === 'requests' ? (
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Total de solicitações</p>
                  <p className="text-3xl font-semibold text-slate-900">{requests.length}</p>
                </div>
                <p className="text-sm text-slate-500">Última atualização em {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
              <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-slate-700">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recebida</th>
                    <th className="px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b border-slate-200 bg-white hover:bg-slate-100">
                      <td className="px-4 py-4 text-slate-700">{request.id}</td>
                      <td className="px-4 py-4 text-slate-700">{request.name}</td>
                      <td className="px-4 py-4 text-slate-700">{request.email}</td>
                      <td className="px-4 py-4 text-slate-700">{request.serviceType}</td>
                      <td className="px-4 py-4 text-slate-700">{request.status}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(request.receivedAt)}</td>
                      <td className="px-4 py-4 text-slate-700">
                        <div className="flex flex-col gap-2">
                          <select
                            value={statusUpdates[request.id] ?? request.status}
                            onChange={(event) => handleStatusChange(request.id, event.target.value)}
                            className="rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                          >
                            {statusOptions.map((statusOption) => (
                              <option key={statusOption} value={statusOption}>
                                {statusOption}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSaveStatus(request.id)}
                            disabled={savingStatus[request.id]}
                            className="rounded-full bg-brand-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {savingStatus[request.id] ? 'Salvando...' : 'Atualizar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Parceiros cadastrados</p>
                  <p className="text-3xl font-semibold text-slate-900">{partners.length}</p>
                </div>
                <p className="text-sm text-slate-500">Última atualização em {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-slate-700">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">Cobertura</th>
                    <th className="px-4 py-3">Cadastro</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="border-b border-slate-200 bg-white hover:bg-slate-100">
                      <td className="px-4 py-4 text-slate-700">{partner.id}</td>
                      <td className="px-4 py-4 text-slate-700">{partner.name}</td>
                      <td className="px-4 py-4 text-slate-700">{partner.email}</td>
                      <td className="px-4 py-4 text-slate-700">{partner.phone}</td>
                      <td className="px-4 py-4 text-slate-700">{partner.coverage}</td>
                      <td className="px-4 py-4 text-slate-700">{formatDate(partner.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
