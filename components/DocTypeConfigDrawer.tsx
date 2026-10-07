import React, { useState } from "react";
import {
  ALL_AVAILABLE_ENTRY_METHODS,
  DocTypeEntryProfile,
  EntryMethodConfig,
  EntryMethodId,
} from "../types/docMethods";

interface DocTypeConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  docType: {
    id: string;
    code: string;
    name: string;
    category: string;
    layout: string;
    active: boolean;
    appliesToScheduling: boolean;
    description?: string;
  } | null;
  entryProfile: DocTypeEntryProfile;
  selectedClient: string;
  onSaveProfile: (docTypeId: string, profile: DocTypeEntryProfile) => void;
}

export const DocTypeConfigDrawer: React.FC<DocTypeConfigDrawerProps> = ({
  isOpen,
  onClose,
  docType,
  entryProfile,
  selectedClient,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<
    | "geral"
    | "entrada"
    | "campos"
    | "vinculacoes"
    | "integracoes"
    | "fluxos"
    | "agendamento"
    | "historico"
  >("entrada");

  // Configuração por Cliente e Herança
  const [inheritDefault, setInheritDefault] = useState<boolean>(true);
  const [scopeClient, setScopeClient] = useState<string>(selectedClient || "Geral (Modelo Padrão)");
  
  // Lista de métodos configurados para este tipo
  const [configuredMethods, setConfiguredMethods] = useState<EntryMethodConfig[]>(
    entryProfile?.methods || []
  );
  const [defaultMethodId, setDefaultMethodId] = useState<EntryMethodId>(
    entryProfile?.defaultMethodId || "upload_xml"
  );
  const [fallbackMethodId, setFallbackMethodId] = useState<EntryMethodId | undefined>(
    entryProfile?.fallbackMethodId
  );
  const [fallbackActive, setFallbackActive] = useState<boolean>(Boolean(entryProfile?.fallbackMethodId));

  // Edição detalhada de um método específico
  const [editingMethod, setEditingMethod] = useState<EntryMethodConfig | null>(null);

  if (!isOpen || !docType) return null;

  // Alternar ativação de um método
  const handleToggleMethod = (methodId: EntryMethodId) => {
    setConfiguredMethods((prev) => {
      const exists = prev.find((m) => m.id === methodId);
      if (exists) {
        // Se for o padrão e for desativado, trocar padrão para outro ativo se houver
        const next = prev.map((m) => (m.id === methodId ? { ...m, active: !m.active } : m));
        return next;
      } else {
        // Adiciona do catálogo global
        const base = ALL_AVAILABLE_ENTRY_METHODS.find((m) => m.id === methodId);
        if (!base) return prev;
        return [...prev, { ...base, active: true, isDefault: false }];
      }
    });
  };

  const handleSetDefault = (methodId: EntryMethodId) => {
    setDefaultMethodId(methodId);
    setConfiguredMethods((prev) =>
      prev.map((m) => ({
        ...m,
        isDefault: m.id === methodId,
      }))
    );
  };

  const handleSave = () => {
    // Computar summary label
    const activeMethods = configuredMethods.filter((m) => m.active);
    let summaryLabel = "Não configurado";
    if (activeMethods.length === 1) {
      if (activeMethods[0].id === "upload_xml") summaryLabel = "XML";
      else if (activeMethods[0].id === "upload_pdf") summaryLabel = "PDF";
      else if (activeMethods[0].id === "manual_entry") summaryLabel = "Manual";
      else if (activeMethods[0].id === "sap_integration") summaryLabel = "SAP";
      else summaryLabel = activeMethods[0].name;
    } else if (activeMethods.length === 2) {
      const names = activeMethods.map((m) => {
        if (m.id === "upload_xml") return "XML";
        if (m.id === "upload_pdf") return "PDF";
        if (m.id === "manual_entry") return "Manual";
        if (m.id === "sap_integration") return "SAP";
        return m.name.split(" ")[0];
      });
      summaryLabel = names.join(" + ");
    } else if (activeMethods.length > 2) {
      summaryLabel = `${activeMethods.length} métodos`;
    }

    const updatedProfile: DocTypeEntryProfile = {
      docTypeId: docType.id,
      summaryLabel,
      methods: configuredMethods,
      defaultMethodId,
      fallbackMethodId: fallbackActive ? fallbackMethodId : undefined,
    };

    onSaveProfile(docType.id, updatedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="bg-[#0b1f3a] text-white p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-white/10 rounded-lg text-xl font-bold font-mono text-[#4da3ff]">
              {docType.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{docType.name}</h2>
                <span className="text-xs px-2 py-0.5 bg-[#1769e0] text-white rounded-full font-medium">
                  {docType.category}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    docType.active ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {docType.active ? "Ativo" : "Inativo"}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">
                Configuração modular de captura, regras fiscais e parametrização operacional.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Fechar"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation (8 abas obrigatórias) */}
        <div className="bg-slate-100 border-b border-slate-200 px-4 flex gap-1 overflow-x-auto text-xs font-medium scrollbar-thin">
          {[
            { id: "geral", label: "Geral" },
            { id: "entrada", label: "Entrada e captura", badge: `${configuredMethods.filter((m) => m.active).length}` },
            { id: "campos", label: "Campos e validações" },
            { id: "vinculacoes", label: "Vinculações" },
            { id: "integracoes", label: "Integrações" },
            { id: "fluxos", label: "Fluxos e permissões" },
            ...(docType.appliesToScheduling ? [{ id: "agendamento", label: "Agendamento" }] : []),
            { id: "historico", label: "Histórico" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3.5 border-b-2 font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-[#1769e0] text-[#0b1f3a] bg-white rounded-t"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 bg-[#1769e0]/10 text-[#1769e0] font-bold rounded-full text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {/* ABA 2: ENTRADA E CAPTURA (FOCO PRINCIPAL) */}
          {activeTab === "entrada" && (
            <div className="space-y-6">
              {/* Seção de Escopo e Herança */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold">
                    🏢
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-800">
                      Escopo de aplicação da política de entrada
                    </h4>
                    <p className="text-xs text-slate-500">
                      Defina se este tipo segue o padrão da rede ou possui exceções para este cliente/filial.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-200">
                    <input
                      type="checkbox"
                      checked={inheritDefault}
                      onChange={(e) => setInheritDefault(e.target.checked)}
                      className="rounded text-[#1769e0] focus:ring-0"
                    />
                    <span>Herdar configuração padrão</span>
                  </label>

                  <select
                    value={scopeClient}
                    onChange={(e) => setScopeClient(e.target.value)}
                    disabled={inheritDefault}
                    className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-xs disabled:opacity-50 disabled:bg-slate-100"
                  >
                    <option value="Geral (Modelo Padrão)">Geral (Modelo Padrão)</option>
                    <option value="TTAX Industrial">Cliente: TTAX Industrial</option>
                    <option value="Transportadora Horizonte">Cliente: Transportadora Horizonte</option>
                    <option value="Logística Vale">Cliente: Logística Vale</option>
                  </select>
                </div>
              </div>

              {/* Informação da Hierarquia Ativa */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2.5">
                <span className="text-sm">ℹ️</span>
                <div>
                  <strong className="font-semibold">Hierarquia ativa: </strong>
                  {inheritDefault ? (
                    <span>
                      Modelo Padrão Global da plataforma TTAX. Qualquer alteração aqui é herdada pelos clientes que
                      não possuem sobrescritas personalizadas.
                    </span>
                  ) : (
                    <span>
                      Exceção aplicada exclusivamente para <strong className="underline">{scopeClient}</strong>.
                      Sobrescreve a configuração padrão global.
                    </span>
                  )}
                </div>
              </div>

              {/* Métodos Disponíveis para o Tipo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Métodos de entrada habilitados ({configuredMethods.filter((m) => m.active).length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ative os canais autorizados para emissão ou envio de {docType.name}.
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">
                    * Apenas 1 método padrão por contexto
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ALL_AVAILABLE_ENTRY_METHODS.map((method) => {
                    const current = configuredMethods.find((m) => m.id === method.id);
                    const isActive = current ? current.active : false;
                    const isDefault = current ? defaultMethodId === current.id : false;

                    return (
                      <div
                        key={method.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isActive
                            ? "bg-white border-blue-300 shadow-xs ring-1 ring-blue-100"
                            : "bg-slate-50/70 border-slate-200 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl p-1.5 bg-slate-100 rounded-md border border-slate-200">
                              {method.icon}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-900">{method.name}</h4>
                                {isDefault && (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full border border-emerald-300">
                                    ★ Método Padrão
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{method.description}</p>
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={isActive}
                            onChange={() => handleToggleMethod(method.id)}
                            className="w-4 h-4 rounded text-[#1769e0] focus:ring-0 cursor-pointer"
                          />
                        </div>

                        {isActive && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                              <span>Perfis: {method.allowedProfiles.slice(0, 2).join(", ")}...</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {!isDefault && (
                                <button
                                  type="button"
                                  onClick={() => handleSetDefault(method.id)}
                                  className="text-[11px] text-[#1769e0] hover:underline font-medium cursor-pointer"
                                >
                                  Tornar Padrão
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setEditingMethod(current || method)}
                                className="text-[11px] text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded cursor-pointer"
                              >
                                Configurar
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seção 9: Fallback de Importação / Método Alternativo */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🛡️</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-900">
                        Fallback de Importação (Método Alternativo de Contingência)
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        Quando uma integração principal estiver temporariamente indisponível ou offline.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                    <input
                      type="checkbox"
                      checked={fallbackActive}
                      onChange={(e) => setFallbackActive(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-0"
                    />
                    <span>Habilitar Fallback</span>
                  </label>
                </div>

                {fallbackActive && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Método Principal Monitorado:
                      </label>
                      <select
                        disabled
                        className="w-full bg-slate-100 border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-700"
                      >
                        <option>
                          {configuredMethods.find((m) => m.id === defaultMethodId)?.name || "Integração SAP ERP"}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Método Alternativo Automático:
                      </label>
                      <select
                        value={fallbackMethodId || "upload_xml"}
                        onChange={(e) => setFallbackMethodId(e.target.value as EntryMethodId)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800"
                      >
                        <option value="upload_xml">Upload de XML (Recomendado)</option>
                        <option value="upload_pdf">Upload de PDF / Espelho</option>
                        <option value="manual_entry">Digitação manual autorizada</option>
                        <option value="access_key">Informar chave de acesso</option>
                      </select>
                    </div>

                    <div className="col-span-full bg-white p-2.5 rounded-lg border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>
                        Se a integração SAP estiver indisponível, a tela de inclusão exibirá:{" "}
                        <em>"A integração SAP está temporariamente indisponível. Utilize o envio de XML."</em>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEMAIS ABAS OBRIGATÓRIAS */}
          {activeTab === "geral" && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Informações Cadastrais</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Código do Tipo</label>
                  <input
                    type="text"
                    readOnly
                    value={docType.code}
                    className="w-full bg-slate-100 border border-slate-200 p-2 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Nome Completo</label>
                  <input
                    type="text"
                    defaultValue={docType.name}
                    className="w-full border border-slate-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Categoria de Documento</label>
                  <input
                    type="text"
                    defaultValue={docType.category}
                    className="w-full border border-slate-300 p-2 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Layout Padrão</label>
                  <input
                    type="text"
                    defaultValue={docType.layout}
                    className="w-full border border-slate-300 p-2 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "campos" && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">
                Campos Obrigatórios e Validações Fiscais
              </h3>
              <p className="text-slate-500">
                Regras estruturais de preenchimento para garantir consistência antes da transmissão.
              </p>
              <div className="space-y-2">
                {[
                  { field: "Chave de Acesso (44 dígitos)", req: true, validator: "Checksum Módulo 11" },
                  { field: "Data de Emissão", req: true, validator: "Dentro do período fiscal aberto" },
                  { field: "CNPJ Emitente e Tomador", req: true, validator: "Cadastro ativo na RFB" },
                  { field: "Valor Total da Operação", req: true, validator: "Soma das rubricas tributárias" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{item.field}</span>
                      <span className="text-[11px] text-slate-500 block">Validador: {item.validator}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-medium text-[10px]">
                      Obrigatório
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "vinculacoes" && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">
                Vinculações a Clientes, Empresas e Filiais
              </h3>
              <p className="text-slate-500">
                Determina onde este tipo de documento é legalmente emitido ou recebido.
              </p>
              <div className="p-3 bg-slate-50 rounded-lg border space-y-2">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-medium">TTAX Industrial (Matriz SP01, Filial PR01)</span>
                  <span className="text-emerald-600 font-semibold">Habilitado</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="font-medium">Transportadora Horizonte (Todas as filiais)</span>
                  <span className="text-emerald-600 font-semibold">Habilitado</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="font-medium">Auditoria Delta (Apenas leitura/consulta)</span>
                  <span className="text-slate-500 font-semibold">Restrito</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "integracoes" && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Conectores e Barramentos</h3>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">SAP ERP Conector RFC / WebService</h4>
                    <p className="text-slate-500 text-[11px]">
                      Sincronização bidirecional de pré-notas e faturas de frete.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">
                    Conectado (Latência: 45ms)
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800">Ambiente Nacional SEFAZ (SVRS / SP)</h4>
                    <p className="text-slate-500 text-[11px]">Consulta de manifestação e DFe de terceiros.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[10px]">
                    Operacional
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "fluxos" && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Alçadas e Permissões de Perfis</h3>
              <div className="space-y-2">
                {[
                  { profile: "TTAX Master", perm: "Controle Total + Override Fiscal" },
                  { profile: "Administrador do Parceiro", perm: "Configuração + Emissão + Aprovação" },
                  { profile: "Gestor Fiscal", perm: "Validação Tributária + Reprovação" },
                  { profile: "Operador Fiscal", perm: "Inclusão e Conferência" },
                  { profile: "Prestador Externo", perm: "Upload Exclusivo de Anexos" },
                ].map((row, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg border"
                  >
                    <span className="font-semibold text-slate-800">{row.profile}</span>
                    <span className="text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                      {row.perm}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "agendamento" && docType.appliesToScheduling && (
            <div className="space-y-4 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">
                Vínculo Logístico e Janelas de Agendamento
              </h3>
              <p className="text-slate-500">
                Parâmetros para amarração de doc de transporte ao agendamento de docas de recebimento.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="font-semibold block mb-1">Exige Agendamento Prévio</span>
                  <span className="text-emerald-700 font-bold">Sim (Obrigatório para cargas secas)</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border">
                  <span className="font-semibold block mb-1">Tolerância de Janela</span>
                  <span className="text-slate-800 font-bold">± 45 minutos da grade</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "historico" && (
            <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 text-xs text-slate-700">
              <h3 className="font-bold text-sm text-slate-800 border-b pb-2">
                Trilha de Auditoria das Alterações deste Tipo
              </h3>
              <div className="space-y-2">
                <div className="p-2.5 bg-slate-50 rounded-lg border text-[11px] text-slate-600">
                  <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                    <span>Configuração de métodos de entrada atualizada</span>
                    <span>Hoje às 14:12</span>
                  </div>
                  <span>Usuário: admin.ttax@ttax.com.br • Habilitado fallback automático para XML.</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border text-[11px] text-slate-600">
                  <div className="flex justify-between font-semibold text-slate-800 mb-0.5">
                    <span>Criação do modelo de layout v3.1</span>
                    <span>12/03/2026</span>
                  </div>
                  <span>Usuário: carlos.seguranca@ttax.com.br • Validação de schema SEFAZ.</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Configuração de um Método Específico */}
        {editingMethod && (
          <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{editingMethod.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Configurar {editingMethod.name}</h3>
                    <p className="text-[11px] text-slate-500">Parâmetros técnicos para este tipo de documento</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingMethod(null)}
                  className="text-slate-400 hover:text-slate-700 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Descrição Apresentada ao Usuário:</label>
                  <input
                    type="text"
                    value={editingMethod.description}
                    onChange={(e) =>
                      setEditingMethod({ ...editingMethod, description: e.target.value })
                    }
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Formatos Permitidos:</label>
                    <input
                      type="text"
                      value={editingMethod.fileFormats?.join(", ") || "Qualquer / Não se aplica"}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Tamanho Máximo:</label>
                    <input
                      type="text"
                      value={editingMethod.maxSizeMb ? `${editingMethod.maxSizeMb} MB` : "Sem limite de arquivo"}
                      readOnly
                      className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Perfis com Acesso:</label>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap gap-1">
                    {editingMethod.allowedProfiles.map((p, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-medium">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Campos Obrigatórios:</label>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600">
                    {editingMethod.requiredFields?.join(", ") || "Conforme schema base"}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingMethod(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfiguredMethods((prev) =>
                      prev.map((m) => (m.id === editingMethod.id ? editingMethod : m))
                    );
                    setEditingMethod(null);
                  }}
                  className="px-4 py-1.5 bg-[#1769e0] text-white text-xs font-semibold rounded-lg hover:bg-blue-700"
                >
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Alterações refletem imediatamente na tela de inclusão para os usuários autorizados.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#1769e0] text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
            >
              Salvar Configuração do Tipo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
