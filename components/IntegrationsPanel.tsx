import React, { useEffect, useState } from "react";

interface Connection {
  id: string;
  mark: string;
  name: string;
  subtitle: string;
  tone: "ok" | "warn";
  badge: string;
  leftLabel: string;
  leftValue: string;
  rightLabel: string;
  rightValue: string;
  services: string;
  health: string;
  environment: string;
  version: string;
  protocol: string;
  url: string;
  user: string;
  certificate: string;
}

const CONNECTIONS: Connection[] = [
  {
    id: "s4",
    mark: "SAP",
    name: "SAP S/4HANA · Produção",
    subtitle: "TTAX Energia · Cliente 100",
    tone: "ok",
    badge: "Operacional",
    leftLabel: "Último teste",
    leftValue: "Hoje, 10:32",
    rightLabel: "Tempo de resposta",
    rightValue: "248 ms",
    services: "8 serviços ativos",
    health: "100% disponível",
    environment: "Produção",
    version: "SAP S/4HANA 2023",
    protocol: "OData + REST",
    url: "https://sap-api.ttax.corp",
    user: "TTAX_PORTAL_API",
    certificate: "ttax-sap-prod-2026.p12",
  },
  {
    id: "ecc",
    mark: "SAP",
    name: "SAP ECC · Homologação",
    subtitle: "TTAX Industrial · Cliente 200",
    tone: "warn",
    badge: "Atenção",
    leftLabel: "Último teste",
    leftValue: "Ontem, 17:45",
    rightLabel: "Tempo de resposta",
    rightValue: "1,8 s",
    services: "6 serviços ativos",
    health: "1 alerta",
    environment: "Homologação",
    version: "SAP ECC 6.0",
    protocol: "RFC + REST",
    url: "https://sap-ecc-hom.ttax.corp",
    user: "TTAX_PORTAL_HOM",
    certificate: "ttax-sap-ecc-hom.p12",
  },
  {
    id: "easy",
    mark: "E4",
    name: "EASY4 · Produção",
    subtitle: "Processamento fiscal centralizado",
    tone: "ok",
    badge: "Operacional",
    leftLabel: "Última sincronização",
    leftValue: "Há 3 min",
    rightLabel: "Fila atual",
    rightValue: "12 documentos",
    services: "4 serviços ativos",
    health: "100% disponível",
    environment: "Produção",
    version: "EASY4 Hub",
    protocol: "REST",
    url: "https://easy4.ttax.corp",
    user: "TTAX_EASY4",
    certificate: "ttax-easy4-prod.p12",
  },
];

const SERVICES = ["Pedido de compras", "Folha de serviço", "Parceiro de negócios", "Partidas em aberto", "Documento contábil", "Estoque"];
const TESTS = [
  { when: "Hoje, 10:32", result: "Conexão aceita · 248 ms" },
  { when: "Hoje, 08:05", result: "Autenticação mTLS válida" },
  { when: "Ontem, 18:40", result: "Timeout no serviço de estoque" },
];

export function IntegrationsPanel({ openRequest = 0, query = "" }: { openRequest?: number; query?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerTab, setDrawerTab] = useState<"Conexão" | "Autenticação" | "Serviços" | "Histórico de testes">("Conexão");
  const [authMode, setAuthMode] = useState("Usuário/senha + mTLS");
  const [notice, setNotice] = useState("");
  const [saved, setSaved] = useState("");

  const selected = CONNECTIONS.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    if (!openRequest) return;
    setSelectedId("s4");
    setDrawerTab("Conexão");
    setNotice("");
  }, [openRequest]);

  const open = (id: string, tab: typeof drawerTab = "Conexão") => {
    setSelectedId(id);
    setDrawerTab(tab);
    setNotice("");
    setSaved("");
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-3">
        {CONNECTIONS.filter((item) => !query || `${item.name} ${item.subtitle}`.toLowerCase().includes(query.toLowerCase())).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => open(item.id)}
            className="rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-[#1769e0]"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1769e0] text-[11px] font-bold text-white">{item.mark}</span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${item.tone === "ok" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                {item.badge}
              </span>
            </div>
            <strong className="block text-sm text-slate-900">{item.name}</strong>
            <span className="mt-0.5 block text-xs text-slate-500">{item.subtitle}</span>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-slate-400">{item.leftLabel}</span>
                <strong className="text-slate-700">{item.leftValue}</strong>
              </div>
              <div>
                <span className="block text-slate-400">{item.rightLabel}</span>
                <strong className="text-slate-700">{item.rightValue}</strong>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>{item.services}</span>
              <span className={item.tone === "ok" ? "font-semibold text-emerald-700" : "font-semibold text-amber-700"}>{item.health}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <div>
          <strong className="block">Certificado próximo do vencimento</strong>
          <span className="text-xs">O certificado mTLS da conexão SAP ECC · Homologação vence em 18 dias.</span>
        </div>
        <button type="button" className="h-9 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-slate-700" onClick={() => open("ecc", "Autenticação")}>
          Revisar certificado
        </button>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onMouseDown={() => setSelectedId(null)}>
          <aside className="flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Integração SAP</span>
                <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                <p className="text-xs text-slate-500">{selected.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">{selected.badge}</span>
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" onClick={() => setSelectedId(null)} aria-label="Fechar">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18" /></svg>
                </button>
              </div>
            </div>
            <div className="flex gap-4 border-b border-slate-200 px-5">
              {(["Conexão", "Autenticação", "Serviços", "Histórico de testes"] as const).map((tab) => (
                <button key={tab} type="button" onClick={() => setDrawerTab(tab)} className={`py-3 text-sm font-semibold ${drawerTab === tab ? "border-b-2 border-[#1769e0] text-[#1769e0]" : "text-slate-500"}`}>
                  {tab}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-auto px-5 py-4">
              {drawerTab === "Conexão" && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-600">Nome da conexão
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={selected.name} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Ambiente
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={selected.environment} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Tipo / versão
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={selected.version} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Protocolo
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={selected.protocol} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">URL base
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={selected.url} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Timeout
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue="30 segundos" />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Adapter
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm" defaultValue="TTAX SAP Adapter v2.4" readOnly />
                  </label>
                </div>
              )}
              {drawerTab === "Autenticação" && (
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">As credenciais salvas nunca são exibidas novamente.</p>
                  <div className="flex flex-wrap gap-2">
                    {["Usuário e senha", "Usuário/senha + mTLS", "Certificado mTLS"].map((mode) => (
                      <button key={mode} type="button" onClick={() => setAuthMode(mode)} className={`h-9 rounded-lg border px-3 text-xs font-semibold ${authMode === mode ? "border-[#1769e0] bg-blue-50 text-[#1769e0]" : "border-slate-200 text-slate-600"}`}>
                        {mode}
                      </button>
                    ))}
                  </div>
                  <label className="block text-xs font-semibold text-slate-600">Usuário técnico
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" defaultValue={selected.user} />
                  </label>
                  <label className="block text-xs font-semibold text-slate-600">Senha
                    <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" type="password" defaultValue="********" />
                  </label>
                  <button type="button" className="text-xs font-semibold text-[#1769e0]" onClick={() => setNotice("A senha salva permanece. Informe uma nova somente se for substituí-la.")}>
                    Substituir senha salva
                  </button>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                    <span>{selected.certificate}</span>
                    <span className="font-semibold text-emerald-700">Válido</span>
                  </div>
                  {notice && <p className="text-xs text-slate-500">{notice}</p>}
                </div>
              )}
              {drawerTab === "Serviços" && (
                <div className="space-y-2">
                  {SERVICES.map((service) => (
                    <div key={service} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span>{service}</span>
                      <span className="text-xs font-semibold text-emerald-700">Ativo</span>
                    </div>
                  ))}
                </div>
              )}
              {drawerTab === "Histórico de testes" && (
                <div className="space-y-2">
                  {TESTS.map((test) => (
                    <div key={test.when} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <strong className="block text-slate-800">{test.result}</strong>
                      <span className="text-xs text-slate-500">{test.when}</span>
                    </div>
                  ))}
                  {notice && <p className="text-xs font-semibold text-emerald-700">{notice}</p>}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
              <span className="text-[11px] text-slate-400">{saved || "Última alteração por Ana Souza · 12/06/2025"}</span>
              <div className="flex gap-2">
                <button type="button" className="h-9 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700" onClick={() => setNotice("Teste concluído. A conexão respondeu dentro do tempo.")}>
                  Testar conexão
                </button>
                <button type="button" className="h-9 rounded-lg bg-[#1769e0] px-3 text-xs font-semibold text-white" onClick={() => setSaved("Alterações salvas agora")}>
                  Salvar alterações
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
