import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { apiUrl } from '../apiClient';

async function parseResponseBody(response: Response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return response.json();
  }
  const text = await response.text();
  return { error: text || response.statusText };
}

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    coverage: ''
  });

  const title = isRegister ? 'Cadastro de prestador' : 'Login';
  const description = isRegister
    ? 'Cadastre-se como prestador e comece a receber solicitações.'
    : 'Faça login como prestador ou administrador. Use admin/admin para acessar o painel administrativo.';

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const response = await fetch(apiUrl('/api/partners'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name,
            email: form.email,
            phone: form.phone,
            coverage: form.coverage,
            password: form.password
          })
        });

        if (!response.ok) {
          const body = await parseResponseBody(response);
          throw new Error(body.error || body.message || 'Falha no cadastro do parceiro.');
        }

        await loginPartner();
        return;
      }

      const normalizedEmail = form.email.trim().toLowerCase();
      if (normalizedEmail === 'admin' && form.password === 'admin') {
        const response = await fetch(apiUrl('/api/auth/admin/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizedEmail, password: form.password })
        });

        if (!response.ok) {
          const body = await parseResponseBody(response);
          throw new Error(body.error || body.message || 'Falha no login do administrador.');
        }

        const data = await response.json();
        login(data.token, 'admin', undefined, data.email);
        navigate('/admin');
        return;
      }

      await loginPartner();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao processar a solicitação.');
    } finally {
      setLoading(false);
    }
  };

  async function loginPartner() {
    const response = await fetch(apiUrl('/api/auth/partner/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password })
    });

    if (!response.ok) {
      const body = await parseResponseBody(response);
      throw new Error(body.error || body.message || 'Falha no login do parceiro.');
    }

    const data = await response.json();
    login(data.token, 'partner', data.partner.id, data.partner.email);
    navigate('/partner');
  }

  const fields = isRegister
    ? [
        { key: 'name', label: 'Nome completo', type: 'text' },
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'phone', label: 'Telefone', type: 'text' },
        { key: 'coverage', label: 'Área de cobertura', type: 'text' },
        { key: 'password', label: 'Senha', type: 'password' }
      ]
    : [
        { key: 'email', label: 'E-mail', type: 'email' },
        { key: 'password', label: 'Senha', type: 'password' }
      ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-10 shadow-lg">
          <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-3 text-slate-600">{description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsRegister(false)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                !isRegister ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(true)}
              className={`rounded-full px-5 py-3 text-sm font-semibold transition ${
                isRegister ? 'bg-brand-700 text-white' : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Cadastro Prestador
            </button>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="text-sm text-slate-700">{field.label}</span>
                <input
                  type={field.type}
                  value={(form as any)[field.key] ?? ''}
                  onChange={(event) => handleChange(field.key, event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600"
                />
              </label>
            ))}

            {error && <p className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'Carregando...' : isRegister ? 'Cadastrar parceiro' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
