import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { apiUrl } from './apiClient';

type AdminTab = 'dashboard' | 'requests' | 'partners' | 'settings';

type RequestStatus = 'pendente' | 'em andamento' | 'concluída' | 'cancelada';

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
  status: RequestStatus;
  receivedAt: string;
  partner_id: string | null;
}

interface AdminStats {
  partnersCount: number;
  requestsCount: number;
  pendingRequests: number;
  assignedRequests: number;
  availableRequests: number;
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
  const { fetchWithAuth, login, auth } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});
  const [assigning, setAssigning] = useState<Record<string, boolean>>({});
  const [selectedPartner, setSelectedPartner] = useState<Record<string, string>>({});
  const [settingsForm, setSettingsForm] = useState({ email: '', password: '' });
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);

    try {
      const [partnersRes, requestsRes, statsRes] = await Promise.all([
        fetchWithAuth('/api/partners'),
        fetchWithAuth('/api/requests'),
        fetchWithAuth('/api/admin/stats')
      ]);

      const responses = [partnersRes, requestsRes, statsRes];
      const hasError = responses.some((response) => !response.ok);
      if (hasError) {
        const errorBody = await responses.find((response) => !response.ok)?.json();
        throw new Error(errorBody?.error || 'Falha ao carregar dados do painel administrativo.');
      }

      const partnersData: Partner[] = await partnersRes.json();
      const requestsData: ServiceRequest[] = await requestsRes.json();
      const statsData: AdminStats = await statsRes.json();

      setPartners(partnersData);
      setRequests(requestsData);
      setStats(statsData);
      setStatusUpdates(requestsData.reduce((acc, request) => ({ ...acc, [request.id]: request.status }), {}));
      setSelectedPartner(
        requestsData.reduce((acc, request) => ({ ...acc, [request.id]: request.partner_id ?? '' }), {})
      );
    } catch (err) {
      console.error(err);
      setError(
        'Não foi possível carregar os dados do painel administrativo. ' +
          (err instanceof Error ? err.message : '')
      );
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = ['pendente', 'em andamento', 'concluída', 'cancelada'];

  const availableRequestsCount = useMemo(
    () => requests.filter((request) => !request.partner_id && request.status === 'pendente').length,
    [requests]
  );

  async function handleSaveStatus(id: string) {
    const newStatus = statusUpdates[id];
    if (!newStatus) return;

    setSavingStatus((current) => ({ ...current, [id]: true }));
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Falha ao atualizar status.');
      }

      const data = await response.json();
      setRequests((current) => current.map((request) => (request.id === id ? data.request : request)));
    } catch (err) {
      console.error(err);
      setError(
        'Não foi possível atualizar o status da solicitação. ' +
          (err instanceof Error ? err.message : '')
      );
    } finally {
      setSavingStatus((current) => ({ ...current, [id]: false }));
    }
  }

  function handleStatusChange(id: string, value: string) {
    setStatusUpdates((current) => ({ ...current, [id]: value }));
  }

  function handlePartnerSelection(id: string, partnerId: string) {
    setSelectedPartner((current) => ({ ...current, [id]: partnerId }));
  }

  async function handleAssignPartner(id: string) {
    const partnerId = selectedPartner[id];
    if (!partnerId) {
      setError('Selecione um parceiro para atribuir a solicitação.');
      return;
    }

    setAssigning((current) => ({ ...current, [id]: true }));
    setError(null);

    try {
      const response = await fetchWithAuth(`/api/requests/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Falha ao atribuir parceiro.');
      }

      const data = await response.json();
      setRequests((current) => current.map((request) => (request.id === id ? data.request : request)));
      setStats((current) =>
        current
          ? {
              ...current,
              assignedRequests: current.assignedRequests + 1,
              availableRequests: Math.max(current.availableRequests - 1, 0)
            }
          : current
      );
    } catch (err) {
      console.error(err);
      setError(
        'Não foi possível atribuir esta solicitação. ' +
          (err instanceof Error ? err.message : '')
      );
    } finally {
      setAssigning((current) => ({ ...current, [id]: false }));
    }
  }

  function handleSettingsFormChange(field: 'email' | 'password', value: string) {
    setSettingsForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSettingsSave() {
    setError(null);
    setSettingsMessage(null);

    const { email, password } = settingsForm;
    if (!email || !password) {
      setError('Informe e-mail e senha para atualizar as configurações.');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Falha ao salvar as configurações.');
      }

      await response.json();
      if (auth.token) {
        login(auth.token, 'admin', undefined, email);
      }
      setSettingsMessage('Configurações atualizadas com sucesso.');
    } catch (err) {
      console.error(err);
      setError(
        'Não foi possível atualizar as configurações. ' +
          (err instanceof Error ? err.message : '')
      );
    }
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
            onClick={() => setActiveTab('dashboard')}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'dashboard'
                ? 'bg-brand-700 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Visão geral
          </button>
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
            onClick={() => setActiveTab('settings')}
            className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-brand-700 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Configurações
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
          {activeTab === 'dashboard' && (
            <div className="grid gap-6 xl:grid-cols-4">
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Parceiros ativos</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{stats?.partnersCount ?? '—'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Solicitações recebidas</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{stats?.requestsCount ?? '—'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Pendentes</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{stats?.pendingRequests ?? '—'}</p>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm text-slate-500">Disponíveis para atribuição</p>
                <p className="mt-4 text-3xl font-semibold text-slate-900">{stats?.availableRequests ?? availableRequestsCount}</p>
              </div>
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Total de solicitações</p>
                  <p className="text-3xl font-semibold text-slate-900">{requests.length}</p>
                </div>
                <p className="text-sm text-slate-500">Última atualização em {new Date().toLocaleTimeString('pt-BR')}</p>
              </div>
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-white text-slate-700">
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Serviço</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Recebida</th>
                    <th className="px-4 py-3">Parceiro</th>
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
                      <td className="px-4 py-4 text-slate-700">{request.partner_id ?? 'Não atribuída'}</td>
                      <td className="px-4 py-4 text-slate-700">
                        <div className="flex flex-col gap-3">
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
                          {!request.partner_id && (
                            <div className="flex flex-wrap gap-2">
                              <select
                                value={selectedPartner[request.id] ?? ''}
                                onChange={(event) => handlePartnerSelection(request.id, event.target.value)}
                                className="min-w-[160px] rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                              >
                                <option value="">Selecionar parceiro</option>
                                {partners.map((partner) => (
                                  <option key={partner.id} value={partner.id}>
                                    {partner.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => handleAssignPartner(request.id)}
                                disabled={assigning[request.id]}
                                className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                              >
                                {assigning[request.id] ? 'Atribuindo...' : 'Atribuir'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'partners' && (
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

          {activeTab === 'settings' && (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-6">
              <div className="mb-5">
                <p className="text-sm text-slate-500">Ajustes de credenciais</p>
                <h3 className="mt-2 text-xl font-semibold text-slate-900">Atualizar e-mail e senha</h3>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">E-mail do administrador</label>
                  <input
                    type="email"
                    value={settingsForm.email}
                    onChange={(event) => handleSettingsFormChange('email', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                    placeholder="admin@dominio.com"
                  />
                </div>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-700">Senha nova</label>
                  <input
                    type="password"
                    value={settingsForm.password}
                    onChange={(event) => handleSettingsFormChange('password', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-600"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <button
                  type="button"
                  onClick={handleSettingsSave}
                  className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Salvar alterações
                </button>
                {settingsMessage && <p className="text-sm text-emerald-700">{settingsMessage}</p>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
