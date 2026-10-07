import React, { useState, type ReactNode } from "react";

function LineIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#1769e0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const securityIcons: Record<string, ReactNode> = {
  matriz: (
    <LineIcon>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M21 20a4.5 4.5 0 0 0-5-4.4" />
    </LineIcon>
  ),
  autenticacao: (
    <LineIcon>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </LineIcon>
  ),
  dominios: (
    <LineIcon>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </LineIcon>
  ),
  politicas: (
    <LineIcon>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </LineIcon>
  ),
  provisionamento: (
    <LineIcon>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0M19 8v6M16 11h6" />
    </LineIcon>
  ),
  revisoes: (
    <LineIcon>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M6.1 9a7 7 0 0 1 11.5-2L20 12M4 12l2.4 5a7 7 0 0 0 11.5-2" />
    </LineIcon>
  ),
  sessoes: (
    <LineIcon>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </LineIcon>
  ),
  identidades: (
    <LineIcon>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
    </LineIcon>
  ),
  eventos: (
    <LineIcon>
      <path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3z" />
      <path d="m8.5 12 2.3 2.3 4.7-5" />
    </LineIcon>
  ),
  search: (
    <LineIcon>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </LineIcon>
  ),
  filter: (
    <LineIcon>
      <path d="M4 5h16M7 12h10M10 19h4" />
    </LineIcon>
  ),
};
import {
  ClientSecurityConfig,
  SecurityUserRecord,
  SecurityRuleRecord,
  TechnicalIdentityRecord,
  SecuritySession,
  SecurityAuditEvent,
  AccessReviewCampaign,
  AdminSecurityRole,
} from "../types/security";

type SecurityMenuId =
  | "matriz"
  | "autenticacao"
  | "dominios"
  | "politicas"
  | "provisionamento"
  | "revisoes"
  | "sessoes"
  | "identidades"
  | "eventos";

export function SecurityAdminSection({
  adminRole,
  clients,
  users,
  rules,
  technicalIdentities,
  sessions,
  events,
  reviews,
  onOpenClientWizard,
  onOpenInviteUser,
  onOpenSimulator,
  onOpenUserDrawer,
  onOpenRevokeModal,
  onTerminateSession,
}: {
  adminRole: AdminSecurityRole;
  clients: ClientSecurityConfig[];
  users: SecurityUserRecord[];
  rules: SecurityRuleRecord[];
  technicalIdentities: TechnicalIdentityRecord[];
  sessions: SecuritySession[];
  events: SecurityAuditEvent[];
  reviews: AccessReviewCampaign[];
  onOpenClientWizard: (client?: ClientSecurityConfig) => void;
  onOpenInviteUser: () => void;
  onOpenSimulator: () => void;
  onOpenUserDrawer: (user: SecurityUserRecord) => void;
  onOpenRevokeModal: (user: SecurityUserRecord) => void;
  onTerminateSession: (sessionId: string) => void;
}) {
  const [activeItem, setActiveItem] = useState<SecurityMenuId>("matriz");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const [actionMenuClientId, setActionMenuClientId] = useState<string | null>(null);

  // Filtragem na matriz de clientes
  const filteredClients = clients.filter((c) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.cnpjMasked.toLowerCase().includes(q) ||
      c.authMethod.toLowerCase().includes(q) ||
      c.providerName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start">
      {/* ======================================================== */}
      {/* MENU VERTICAL LATERAL ORGANIZADO POR GRUPOS (IMAGEM)     */}
      {/* ======================================================== */}
      <aside className="w-full md:w-64 min-w-[250px] bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs shrink-0 overflow-visible">
        <h3 className="text-base font-bold text-slate-900 px-3 py-2">
          Acesso e segurança
        </h3>

        {/* Grupo 1: Configuração */}
        <div className="mt-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-normal px-3 block mb-1 whitespace-nowrap overflow-visible">
            Configuração
          </span>
          <div className="space-y-0.5">
            {[
              { id: "matriz", label: "Matriz por cliente", icon: securityIcons.matriz },
              { id: "autenticacao", label: "Autenticação", icon: securityIcons.autenticacao },
              { id: "dominios", label: "Domínios", icon: securityIcons.dominios },
              { id: "politicas", label: "Políticas de acesso", icon: securityIcons.politicas },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item.id as SecurityMenuId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all relative ${
                  activeItem === item.id
                    ? "bg-blue-50 text-[#1769e0] font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {activeItem === item.id && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#1769e0] rounded-r-full" />
                )}
                <span className="shrink-0 inline-flex">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grupo 2: Ciclo de acesso */}
        <div className="mt-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-normal px-3 block mb-1 whitespace-nowrap overflow-visible">
            Ciclo de acesso
          </span>
          <div className="space-y-0.5">
            {[
              { id: "provisionamento", label: "Provisionamento", icon: securityIcons.provisionamento },
              { id: "revisoes", label: "Revisões de acesso", icon: securityIcons.revisoes },
              { id: "sessoes", label: "Sessões", icon: securityIcons.sessoes },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item.id as SecurityMenuId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all relative ${
                  activeItem === item.id
                    ? "bg-blue-50 text-[#1769e0] font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {activeItem === item.id && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#1769e0] rounded-r-full" />
                )}
                <span className="shrink-0 inline-flex">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grupo 3: Avançado */}
        <div className="mt-5">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-normal px-3 block mb-1 whitespace-nowrap overflow-visible">
            Avançado
          </span>
          <div className="space-y-0.5">
            {[
              { id: "identidades", label: "Identidades técnicas", icon: securityIcons.identidades },
              { id: "eventos", label: "Eventos de segurança", icon: securityIcons.eventos },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveItem(item.id as SecurityMenuId)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all relative ${
                  activeItem === item.id
                    ? "bg-blue-50 text-[#1769e0] font-bold"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {activeItem === item.id && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#1769e0] rounded-r-full" />
                )}
                <span className="shrink-0 inline-flex">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* ÁREA DE CONTEÚDO PRINCIPAL (EXATAMENTE COMO NA IMAGEM)   */}
      {/* ======================================================== */}
      <main className="flex-1 w-full bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs overflow-hidden">
        {/* TELA: MATRIZ POR CLIENTE (PADRÃO DA IMAGEM ANEXADA) */}
        {activeItem === "matriz" && (
          <div className="space-y-5">
            {/* Cabeçalho da Matriz */}
            <div>
              <h2 className="text-xl font-bold text-slate-900">Matriz por cliente</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina autenticação, MFA e ciclo de acesso de cada organização.
              </p>
            </div>

            {/* Barra de Ações: Busca + Filtros + Botão Configurar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 max-w-lg">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar organização"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-[#1769e0]"
                  />
                  <span className="absolute left-3 top-2 inline-flex">{securityIcons.search}</span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                    className="px-3.5 py-2 border border-slate-200 bg-white rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="inline-flex">{securityIcons.filter}</span>
                    <span>Filtros</span>
                  </button>

                  {filterDropdownOpen && (
                    <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 text-xs">
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        Todas as organizações
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("Entra");
                          setFilterDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        Apenas SSO (Entra ID)
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("SCIM");
                          setFilterDropdownOpen(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        Apenas com SCIM
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenClientWizard()}
                className="px-4 py-2 bg-[#1769e0] hover:bg-blue-700 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors shrink-0"
              >
                <span>+</span>
                <span>Configurar organização</span>
              </button>
            </div>

            {/* Contador de organizações */}
            <div className="text-xs text-slate-500 font-medium">
              {filteredClients.length} organização{filteredClients.length === 1 ? "" : "s"} configuradas
            </div>

            {/* TABELA COM EXATAMENTE 6 COLUNAS (SEM SCROLL HORIZONTAL) */}
            <div className="w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2 w-[28%]">CLIENTE</th>
                    <th className="py-3 px-2 w-[24%]">AUTENTICAÇÃO</th>
                    <th className="py-3 px-2 w-[18%]">PROVISIONAMENTO</th>
                    <th className="py-3 px-2 w-[14%]">MFA</th>
                    <th className="py-3 px-2 w-[12%]">VALIDADE</th>
                    <th className="py-3 px-2 w-[4%] text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    // Mapeamento visual das 4 organizações da imagem
                    const isTtaxInd = client.name.includes("Industrial");
                    const isTranspHmz = client.name.includes("Horizonte");
                    const isLogVale = client.name.includes("Vale");
                    const isAuditoria = client.name.includes("Auditoria") || client.name.includes("Delta");

                    // 1. Cliente + CNPJ unificados
                    const clientName = isTtaxInd
                      ? "Empresa exemplo"
                      : isTranspHmz
                      ? "Transportadora exemplo"
                      : isLogVale
                      ? "Logística exemplo"
                      : client.name.includes("Auditoria") || client.name.includes("Delta")
                      ? "Auditoria exemplo"
                      : client.name;
                    const cnpjMasked = isTtaxInd
                      ? "98.765.432/0001-**"
                      : isTranspHmz
                      ? "23.456.789/0001-**"
                      : isLogVale
                      ? "34.567.890/0001-**"
                      : client.cnpjMasked;

                    // 2. Autenticação: Método + Provedor unificados
                    const authText = isTtaxInd
                      ? "Microsoft Entra ID"
                      : isTranspHmz
                      ? "Okta"
                      : isLogVale
                      ? "Conta local"
                      : "Convite temporário";
                    const authBadge = isTtaxInd
                      ? "OIDC"
                      : isTranspHmz
                      ? "SAML 2.0"
                      : isLogVale
                      ? "MFA"
                      : "30 dias";

                    // 3. Provisionamento
                    const provText = isTtaxInd
                      ? "✓ SCIM ativo"
                      : isAuditoria
                      ? "— Não aplicável"
                      : "— Manual";
                    const isScimActive = isTtaxInd;

                    // 4. MFA
                    const mfaText = "✓ Obrigatório";

                    // 5. Validade
                    const validityText = isTtaxInd
                      ? "180 dias"
                      : isTranspHmz
                      ? "90 dias"
                      : isLogVale
                      ? "120 dias"
                      : `${client.defaultValidityDays} dias`;

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-slate-50/70 transition-colors h-16 group"
                      >
                        {/* Coluna 1: Cliente + CNPJ */}
                        <td className="py-3 px-2">
                          <strong className="text-slate-900 block text-xs font-bold">
                            {clientName}
                          </strong>
                          <span className="text-slate-400 text-[11px] font-mono block mt-0.5">
                            {cnpjMasked}
                          </span>
                        </td>

                        {/* Coluna 2: Autenticação com Provedor */}
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-800 font-medium text-xs">
                              {authText}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                              {authBadge}
                            </span>
                          </div>
                        </td>

                        {/* Coluna 3: Provisionamento */}
                        <td className="py-3 px-2">
                          {isScimActive ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                              {provText}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600">
                              {provText}
                            </span>
                          )}
                        </td>

                        {/* Coluna 4: MFA */}
                        <td className="py-3 px-2">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700">
                            {mfaText}
                          </span>
                        </td>

                        {/* Coluna 5: Validade */}
                        <td className="py-3 px-2 text-slate-600 font-medium text-xs">
                          {validityText}
                        </td>

                        {/* Coluna 6: Ações Secundárias (Três Pontos) */}
                        <td className="py-3 px-2 text-right relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuClientId(
                                actionMenuClientId === client.id ? null : client.id
                              );
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 inline-flex items-center justify-center text-sm font-bold transition-colors cursor-pointer"
                            title="Opções da organização"
                          >
                            ⋮
                          </button>

                          {/* Menu suspenso de 3 pontos */}
                          {actionMenuClientId === client.id && (
                            <div
                              className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-xs text-left animate-fadeIn"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuClientId(null);
                                  onOpenClientWizard(client);
                                }}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#1769e0] font-medium flex items-center gap-2"
                              >
                                <span className="inline-flex">{securityIcons.identidades}</span>
                                <span>Editar configurações IdP</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuClientId(null);
                                  onOpenSimulator();
                                }}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-[#1769e0] font-medium flex items-center gap-2"
                              >
                                <span className="inline-flex">{securityIcons.eventos}</span>
                                <span>Simular políticas</span>
                              </button>
                              <div className="my-1 border-t border-slate-100" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuClientId(null);
                                  onOpenClientWizard(client);
                                }}
                                className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                              >
                                <span>📋</span>
                                <span>Ver detalhes da organização</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* DEMAIS TELAS DO MENU VERTICAL DE SEGURANÇA */}
        {activeItem === "autenticacao" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Métodos de Autenticação Homologados</h3>
                <p className="text-xs text-slate-500">Conectores SAML 2.0, OpenID Connect e federação corporativa.</p>
              </div>
              <button
                type="button"
                onClick={() => onOpenClientWizard()}
                className="px-3.5 py-1.5 bg-[#1769e0] text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                + Nova Conexão
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {clients.map((c) => (
                <div key={c.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <strong className="text-slate-800">{c.name}</strong>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                      Operacional
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px]">Provedor: {c.providerName} ({c.authMethod})</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeItem === "dominios" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Domínios Corporativos Gerenciados</h3>
            <p className="text-xs text-slate-500">Utilizados para direcionamento automático de e-mail na tela de login.</p>
            <div className="space-y-2 text-xs">
              {[
                { domain: "empresa.com", client: "Empresa exemplo", status: "Verificado (TXT DNS)" },
                { domain: "horizonte-log.com.br", client: "Transportadora Horizonte", status: "Verificado (TXT DNS)" },
                { domain: "logisticavale.com.br", client: "Logística Vale", status: "Verificado (TXT DNS)" },
              ].map((d, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                  <div>
                    <strong className="text-slate-900 block font-mono">{d.domain}</strong>
                    <span className="text-slate-500 text-[11px]">{d.client}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold">
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeItem === "politicas" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-bold text-slate-900">Políticas de Acesso Zero Trust (ABAC)</h3>
              <button
                type="button"
                onClick={onOpenSimulator}
                className="px-3 py-1.5 bg-blue-50 text-[#1769e0] border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100"
              >
                Abrir Simulador
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {rules.map((r) => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <strong className="text-slate-800 block">{r.name}</strong>
                    <span className="text-slate-500 text-[11px]">{r.description}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                    Ativa
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeItem === "provisionamento" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Provisionamento SCIM 2.0</h3>
            <p className="text-xs text-slate-500">Sincronização contínua de usuários e grupos pelo IdP corporativo.</p>
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <strong className="font-bold">Conector SCIM Microsoft Entra ID ativo</strong>
              <p className="text-[11px]">Última sincronização: hoje às 14:22 · 142 identidades sincronizadas com sucesso.</p>
            </div>
          </div>
        )}

        {activeItem === "revisoes" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Campanhas de Revisão de Acesso</h3>
            <div className="space-y-2 text-xs">
              {reviews.map((rev) => (
                <div key={rev.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <strong className="text-slate-800 block">{rev.title}</strong>
                    <span className="text-slate-500 text-[11px]">Prazo: {rev.dueDate} · {rev.pendingUsers} pendentes</span>
                  </div>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                    {rev.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeItem === "sessoes" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Monitoramento de Sessões Ativas</h3>
            <div className="space-y-2 text-xs">
              {sessions.map((s) => (
                <div key={s.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <strong className="text-slate-800 block">{s.userName} ({s.clientName})</strong>
                    <span className="text-slate-500 text-[11px]">{s.browser} · IP {s.ipMasked} · {s.location}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTerminateSession(s.id)}
                    className="px-2.5 py-1 text-rose-600 border border-rose-200 hover:bg-rose-50 rounded font-semibold text-[11px]"
                  >
                    Encerrar sessão
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeItem === "identidades" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Identidades Técnicas e Conectores SAP</h3>
            <div className="space-y-2 text-xs">
              {technicalIdentities.map((tech) => (
                <div key={tech.id} className="p-3 bg-slate-50 rounded-lg border flex justify-between items-center">
                  <div>
                    <strong className="text-slate-800 font-mono block">{tech.systemId}</strong>
                    <span className="text-slate-500 text-[11px]">{tech.description} · Tipo: {tech.authType}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                    Ativo
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeItem === "eventos" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b pb-2">Trilha de Auditoria e Eventos de Segurança</h3>
            <div className="space-y-2 text-xs">
              {events.map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-50 rounded-lg border text-slate-700">
                  <div className="flex justify-between font-semibold text-slate-900">
                    <span>{evt.event}</span>
                    <span className="text-[11px] text-slate-400 font-normal">{evt.timestamp}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Executor: {evt.executor} · IP: {evt.ipMasked}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
