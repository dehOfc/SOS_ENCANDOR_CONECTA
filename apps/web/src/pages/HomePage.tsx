import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';

const serviceTypes = [
  'Vazamento',
  'Entupimento',
  'Instalação',
  'Reparo',
  'Hidráulica residencial',
  'Limpeza de caixa d’água'
];

const features = [
  {
    title: 'Encaminhamento rápido',
    description: 'Encanadores verificados disponíveis para atendimento urgente ou agendado.'
  },
  {
    title: 'Orçamento transparente',
    description: 'Envio de proposta digital com itens detalhados para cada serviço.'
  },
  {
    title: 'Garantia e qualidade',
    description: 'Acompanhamento completo do serviço até a conclusão e avaliação.'
  }
];

const testimonials = [
  {
    name: 'Ana Silva',
    message: 'O atendimento foi rápido e o encanador resolveu o vazamento com profissionalismo.'
  },
  {
    name: 'Carlos Souza',
    message: 'A plataforma facilitou o agendamento e a equipe chegou no horário combinado.'
  }
];

export default function HomePage() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    serviceType: serviceTypes[0],
    preferredDate: '',
    preferredTime: '',
    details: ''
  });
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('Enviando solicitação...');

    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    if (response.ok) {
      setStatus('Solicitação enviada com sucesso. Em breve um encanador fará contato.');
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        serviceType: serviceTypes[0],
        preferredDate: '',
        preferredTime: '',
        details: ''
      });
    } else {
      setStatus('Ocorreu um erro ao enviar a solicitação. Tente novamente.');
    }
  };

  const quickStats = useMemo(
    () => [
      { label: 'Atendimentos em até 24h', value: 'Sim' },
      { label: 'Serviços 24h', value: 'Disponível' },
      { label: 'Encanadores verificados', value: 'Parceiros confiáveis' }
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 sticky top-0 z-40 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <strong className="text-xl text-brand-700">SOS Encanador Conecta</strong>
            <p className="text-sm text-slate-500">Serviços hidráulicos rápidos e confiáveis</p>
          </div>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link to="/" className="hover:text-brand-700">Início</Link>
            <Link to="/login/partner" className="hover:text-brand-700">Login Parceiro</Link>
            <Link to="/login/admin" className="hover:text-brand-700">Login Admin</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-gradient-to-r from-brand-500 to-cyan-600 text-white">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-100">Atendimento 24 horas</p>
              <h1 className="mt-6 text-4xl font-semibold sm:text-5xl">Solicite seu encanador agora e resolva vazamentos com rapidez.</h1>
              <p className="mt-6 max-w-xl text-lg text-cyan-100">
                Conectamos você a encanadores parceiros verificados para atendimento residencial e comercial com garantia.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a href="#solicitacao" className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg shadow-cyan-500/20 transition hover:bg-slate-100">
                  Solicite agora
                </a>
                <Link to="/login/partner" className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm text-white transition hover:bg-white/20">
                  Login Parceiro
                </Link>
              </div>
            </div>
            <div className="mt-10 flex justify-center lg:mt-0">
              <div className="relative w-full max-w-xl overflow-hidden rounded-[2rem] bg-white/10 p-6 shadow-2xl shadow-slate-900/20">
                <div className="rounded-3xl border border-white/10 bg-white/20 p-6 backdrop-blur-sm">
                  <h2 className="text-xl font-semibold text-white">Fale conosco em minutos</h2>
                  <p className="mt-3 text-sm text-cyan-100">Envie seu pedido com foto e agende o melhor horário para você.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white">
                      <strong>Vazamentos</strong>
                      <p className="mt-2 text-slate-200">Incluso urgência e reparo.</p>
                    </div>
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white">
                      <strong>Entupimentos</strong>
                      <p className="mt-2 text-slate-200">Solução eficiente para ralos e tubulações.</p>
                    </div>
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white">
                      <strong>Instalações</strong>
                      <p className="mt-2 text-slate-200">Louças, chuveiros e sistemas hidráulicos.</p>
                    </div>
                    <div className="rounded-3xl bg-white/15 p-4 text-sm text-white">
                      <strong>Reparos</strong>
                      <p className="mt-2 text-slate-200">Garantia de serviço realizado por profissionais.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16" id="solicitacao">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Novo serviço</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Solicite seu atendimento com informações completas.</h2>
              <p className="mt-4 text-slate-600">Use o formulário ao lado para descrever o problema e indicar o melhor momento para atendimento.</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {quickStats.map((item) => (
                  <div key={item.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
                    <p className="mt-3 text-2xl font-semibold text-slate-900">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <form className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-lg" onSubmit={handleSubmit}>
              <h3 className="text-xl font-semibold text-slate-900">Formulário de solicitação</h3>
              <p className="mt-2 text-sm text-slate-500">Preencha os dados e anexos serão solicitados na etapa seguinte.</p>

              <div className="mt-6 grid gap-4">
                <label className="block">
                  <span className="text-sm text-slate-700">Nome completo</span>
                  <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-700">Telefone</span>
                  <input value={form.phone} onChange={(event) => handleChange('phone', event.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-700">E-mail</span>
                  <input type="email" value={form.email} onChange={(event) => handleChange('email', event.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-700">Endereço completo</span>
                  <input value={form.address} onChange={(event) => handleChange('address', event.target.value)} required className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-700">Tipo de serviço</span>
                  <select value={form.serviceType} onChange={(event) => handleChange('serviceType', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600">
                    {serviceTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm text-slate-700">Descrição do problema</span>
                  <textarea value={form.details} onChange={(event) => handleChange('details', event.target.value)} rows={4} required className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm text-slate-700">Data preferencial</span>
                    <input type="date" value={form.preferredDate} onChange={(event) => handleChange('preferredDate', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                  </label>
                  <label className="block">
                    <span className="text-sm text-slate-700">Hora preferencial</span>
                    <input type="time" value={form.preferredTime} onChange={(event) => handleChange('preferredTime', event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-brand-600" />
                  </label>
                </div>
              </div>

              {status && <p className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">{status}</p>}

              <button type="submit" className="mt-6 inline-flex w-full justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800">
                Enviar solicitação
              </button>
            </form>
          </div>
        </section>

        <section className="bg-white py-16" id="servicos">
          <div className="mx-auto max-w-7xl px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Serviços</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Atendemos todos os tipos de serviço hidráulico.</h2>
              <p className="mt-4 text-slate-600">Do vazamento emergencial à instalação planejada, nossa rede de parceiros atua com rapidez e qualidade.</p>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {serviceTypes.map((service) => (
                <div key={service} className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900">{service}</h3>
                  <p className="mt-3 text-slate-600">Profissionais preparados para resolver o problema sem complicação.</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16" id="como-funciona">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Como funciona</p>
              <h2 className="mt-4 text-3xl font-semibold text-slate-900">Processo simples para cliente e parceiro.</h2>
              <p className="mt-4 text-slate-600">Desde a solicitação até a avaliação final, controlamos cada etapa para garantir confiança.</p>
            </div>
            <div className="space-y-4">
              {['Solicita', 'Orça', 'Executa', 'Avalia'].map((step, index) => (
                <div key={step} className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-700 text-white">{index + 1}</span>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{step}</h3>
                  <p className="mt-2 text-slate-600">{step === 'Solicita' ? 'Cliente descreve problema, anexa fotos e escolhe o horário.' : step === 'Orça' ? 'Encanador envia proposta clara e detalhada.' : step === 'Executa' ? 'Serviço acontece com acompanhamento até a conclusão.' : 'Cliente avalia e fortalece a reputação do parceiro.'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-16 text-white" id="parceiros">
          <div className="mx-auto max-w-7xl px-6 text-center">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Seja um parceiro</p>
            <h2 className="mt-4 text-3xl font-semibold">Cadastre-se como encanador parceiro e receba pedidos na sua área.</h2>
            <p className="mt-4 mx-auto max-w-2xl text-slate-300">Perfil com especialidade, histórico, avaliações e propostas. Trabalhe com flexibilidade e suporte.</p>
            <div className="mt-8 inline-flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link to="/login/partner" className="rounded-full bg-cyan-400 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-300">Quero ser parceiro</Link>
              <a href="#contato" className="rounded-full border border-white/20 px-8 py-3 text-sm transition hover:bg-white/10">Saiba mais</a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-16" id="depoimentos">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-700">Depoimentos</p>
            <h2 className="mt-4 text-3xl font-semibold text-slate-900">Clientes satisfeitos com agendamentos rápidos e limpeza na comunicação.</h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
                <p className="text-slate-600">“{item.message}”</p>
                <p className="mt-6 font-semibold text-slate-900">{item.name}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-slate-950 py-16 text-white" id="contato">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Contato</p>
                <h2 className="mt-4 text-3xl font-semibold">Fale com nossa equipe agora.</h2>
                <p className="mt-4 max-w-xl text-slate-300">Telefone, WhatsApp e e-mail para suporte e parceiros. Estamos disponíveis para ajudar na sua emergência hidráulica.</p>
              </div>
              <div className="space-y-4 rounded-[2rem] bg-slate-900/90 p-8 shadow-lg">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Telefone</p>
                  <p className="mt-2 text-lg font-semibold">(11) 4000-1234</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">WhatsApp</p>
                  <p className="mt-2 text-lg font-semibold">(11) 9 9999-9999</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">E-mail</p>
                  <p className="mt-2 text-lg font-semibold">contato@sosencanadorconecta.com.br</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 SOS Encanador Conecta. Todos os direitos reservados.</p>
          <p>Política de Privacidade • Termos de Uso</p>
        </div>
      </footer>
    </div>
  );
}
