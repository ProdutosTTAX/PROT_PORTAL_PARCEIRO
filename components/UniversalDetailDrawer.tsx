import React, { useState } from "react";
import { DocumentRecord, DocTypeDefinition } from "../types/documents";

export function UniversalDetailDrawer({
  document,
  docTypes,
  onClose,
  initialTab = "Resumo",
  onOpenReschedule,
  onOpenOrderException,
  onOpenPayment,
  onNavigateToDoc,
}: {
  document: DocumentRecord;
  docTypes: DocTypeDefinition[];
  onClose: () => void;
  initialTab?: string;
  onOpenReschedule?: () => void;
  onOpenOrderException?: () => void;
  onOpenPayment?: () => void;
  onNavigateToDoc?: (docId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<string>(
    (
      {
        Participantes: "Documento",
        "Dados do documento": "Documento",
        Pagamento: "Valores",
        Vinculações: "Vínculos",
        Agendamento: "Vínculos",
        Integrações: "Sistema",
        Histórico: "Sistema",
        Validações: "Resumo",
        Processamento: "Sistema",
      } as Record<string, string>
    )[initialTab] || initialTab
  );
  const [isEditingScheduleInline, setIsEditingScheduleInline] = useState(false);

  // Estados locais para edição inline de agendamento (segundo nível do mesmo drawer)
  const [newScheduleDate, setNewScheduleDate] = useState(
    document.cteSchedule?.scheduleDate || "2026-10-15"
  );
  const [newScheduleWindow, setNewScheduleWindow] = useState(
    document.cteSchedule?.scheduleWindow || "08:00 - 10:00"
  );
  const [newBay, setNewBay] = useState(document.cteSchedule?.bayOrDock || "Doca 02 (Recepção Sul)");
  const [newDriver, setNewDriver] = useState(document.cteSchedule?.driverName || "Carlos Eduardo Silveira");
  const [newPlate, setNewPlate] = useState(document.cteSchedule?.plate || "BRA2E19");
  const [scheduleSavedMsg, setScheduleSavedMsg] = useState(false);

  const isCte = document.type === "CT-e" || document.type === "CT-e OS" || document.type === "MDF-e";

  const typeDef = docTypes.find((t) => t.id === document.type) || {
    hasSchedule: isCte,
    hasOrderLinking: !!document.orderNumber,
    hasFinancialFlow: document.paymentStatus !== "Não aplicável",
  };

  const showLinks = Boolean(typeDef.hasOrderLinking || document.orderNumber || isCte || document.cteSchedule);
  const tabs = ["Resumo", "Documento", "Valores", ...(showLinks ? ["Vínculos"] : []), "Arquivos", "Sistema"];

  // Fechar com tecla Esc
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSaveInlineSchedule = () => {
    if (document.cteSchedule) {
      document.cteSchedule.scheduleDate = newScheduleDate;
      document.cteSchedule.scheduleWindow = newScheduleWindow;
      document.cteSchedule.bayOrDock = newBay;
      document.cteSchedule.driverName = newDriver;
      document.cteSchedule.plate = newPlate;
      document.cteSchedule.history = [
        {
          date: "Hoje, agora",
          action: "Reagendamento confirmado",
          user: "Portal do Parceiro",
          note: `Janela ajustada para ${newScheduleWindow} na ${newBay}`,
        },
        ...(document.cteSchedule.history || []),
      ];
    }
    setScheduleSavedMsg(true);
    setTimeout(() => {
      setScheduleSavedMsg(false);
      setIsEditingScheduleInline(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn">
      {/* Drawer com largura: Desktop 680-800px, Tablet 75%, Mobile 100% (Requisito 3) */}
      <aside
        className="w-full sm:w-[75%] md:max-w-[760px] h-full bg-white shadow-2xl flex flex-col overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO FIXO (REQUISITO 3) */}
        <div className="p-5 border-b border-slate-200 bg-white flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="doc-chip-badge tone-purple text-xs font-bold">
                {document.type}
              </span>
              <span className={`status status-${document.statusTone}`}>
                <span className="status-dot" />
                {document.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {document.protocol}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 truncate">
              {document.type} {document.number}
            </h2>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {document.company} · Filial <strong>{document.branch}</strong> · {document.partnerName}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={onClose}
              title="Fechar (Esc)"
            >
              ✕
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO POR ABAS EM LINHA ÚNICA LIMPA SEM QUEBRA OU SCROLLBAR GROSSA */}
        {!isEditingScheduleInline && (
          <div className="no-scrollbar flex items-center border-b border-slate-200 px-5 bg-slate-50/70 shrink-0 gap-1">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`py-2.5 px-2.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
                  activeTab === t
                    ? "border-[#1769e0] text-[#1769e0] bg-white rounded-t"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <span>{t}</span>
                {t === "Vínculos" && document.cteSchedule?.scheduleDate && (
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                )}
                {t === "Vínculos" && document.orderNumber && (
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 rounded-full font-bold">
                    SAP
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* CONTEÚDO COM ROLAGEM PRÓPRIA (REQUISITOS 3, 4, 5) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 bg-slate-50/40">
          {/* SEGUNDO NÍVEL: ALTERAR AGENDAMENTO (REQUISITO 5) */}
          {isEditingScheduleInline ? (
            <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-xs space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <button
                    type="button"
                    onClick={() => setIsEditingScheduleInline(false)}
                    className="text-xs text-[#1769e0] font-semibold hover:underline flex items-center gap-1 mb-1"
                  >
                    <span>← Voltar para detalhes</span>
                  </button>
                  <h3 className="text-sm font-bold text-slate-900">
                    Alterar Janela e Agendamento do CT-e {document.number}
                  </h3>
                </div>
                <span className="text-xs px-2.5 py-1 bg-purple-100 text-purple-800 font-bold rounded-full">
                  Nível Operacional
                </span>
              </div>

              {scheduleSavedMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <span>✓</span>
                  <span>Agendamento atualizado com sucesso! Retornando...</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data da Entrega / Descarga *</label>
                  <input
                    type="date"
                    value={newScheduleDate}
                    onChange={(e) => setNewScheduleDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Janela de Horário *</label>
                  <select
                    value={newScheduleWindow}
                    onChange={(e) => setNewScheduleWindow(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  >
                    <option value="08:00 - 10:00">08:00 - 10:00 (Manhã)</option>
                    <option value="10:00 - 12:00">10:00 - 12:00 (Manhã)</option>
                    <option value="14:00 - 16:00">14:00 - 16:00 (Tarde)</option>
                    <option value="16:00 - 18:00">16:00 - 18:00 (Tarde)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doca de Descarga *</label>
                  <input
                    type="text"
                    value={newBay}
                    onChange={(e) => setNewBay(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Motorista</label>
                  <input
                    type="text"
                    value={newDriver}
                    onChange={(e) => setNewDriver(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Placa do Cavalo / Carreta</label>
                  <input
                    type="text"
                    value={newPlate}
                    onChange={(e) => setNewPlate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditingScheduleInline(false)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveInlineSchedule}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 shadow-2xs"
                >
                  Salvar novo horário
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* ALERTA DE DIVERGÊNCIA SE HOUVER */}
              {document.pendingIssue && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-base">⚠️</span>
                    <div>
                      <strong className="font-bold block">{document.pendingIssue.title}</strong>
                      <p className="text-amber-800 mt-0.5">{document.pendingIssue.description}</p>
                    </div>
                  </div>
                  {onOpenOrderException && (
                    <button
                      type="button"
                      className="px-3 py-1 bg-white border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold hover:bg-amber-100 shrink-0"
                      onClick={onOpenOrderException}
                    >
                      Tratar
                    </button>
                  )}
                </div>
              )}

              {/* ABA 1: RESUMO (BLOCOS ORGANIZADOS CONFORME REQUISITO 4) */}
              {activeTab === "Resumo" && (
                <div className="space-y-4">
                  {/* Bloco 1: Identificação */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Identificação
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Tipo</span>
                        <strong className="text-slate-800 font-semibold">{document.type}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Protocolo</span>
                        <strong className="text-slate-800 font-mono">{document.protocol}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Número</span>
                        <strong className="text-slate-800 font-semibold">{document.number}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Série</span>
                        <strong className="text-slate-800 font-semibold">{document.series || "1"}</strong>
                      </div>
                    </div>
                    {document.accessKey && (
                      <div className="pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-400 text-[11px] block mb-0.5">Chave de acesso:</span>
                        <code className="text-[11px] font-mono text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200 block truncate">
                          {document.accessKey}
                        </code>
                      </div>
                    )}
                  </div>

                  {/* Bloco 2: Empresa e Participantes */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Empresa e Participantes
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 text-[11px] block">Empresa Tomadora / Destinatário:</span>
                        <strong className="text-slate-800 block text-xs">{document.company}</strong>
                        <span className="text-[11px] text-slate-500">Filial {document.branch}</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="text-slate-400 text-[11px] block">Emissor / Prestador:</span>
                        <strong className="text-slate-800 block text-xs">{document.partnerName}</strong>
                        <span className="text-[11px] text-slate-500">{document.partnerCnpj}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Valores */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Valores & Cobrança
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Valor Total Bruto</span>
                        <strong className="text-slate-900 font-bold text-sm">{document.valueGross}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Valor Líquido</span>
                        <strong className="text-emerald-700 font-bold text-sm">{document.valueNet}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Tributos Totais</span>
                        <span className="text-slate-700 font-semibold">R$ 1.840,00</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Pagamento</span>
                        <strong className="text-slate-800">{document.paymentStatus}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 4: Situações */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Situações
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Status do Fluxo</span>
                        <span className={`status status-${document.statusTone} mt-1`}>
                          {document.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Status Fiscal</span>
                        <span className="text-emerald-700 font-semibold block mt-1">✓ Autorizado na SEFAZ</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Status de Integração</span>
                        <span className="text-slate-700 font-semibold block mt-1">Conectado SAP (S/4HANA)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: AGENDAMENTO (ESPECÍFICA DO CT-e - REQUISITO 5) */}
              {activeTab === "Vínculos" && (isCte || document.cteSchedule) && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-xl border border-purple-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold text-purple-700 uppercase bg-purple-50 px-2 py-0.5 rounded">
                          Janela Operacional
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 mt-1">
                          Agendamento de Recebimento de Carga
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => onOpenReschedule?.()}
                        className="px-3 py-1.5 bg-[#1769e0] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                      >
                        Alterar agenda
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Data Agendada</span>
                        <strong className="text-slate-800 text-sm font-bold">
                          {document.cteSchedule?.scheduleDate || "Pendente"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Janela de Horário</span>
                        <strong className="text-slate-800 font-semibold">
                          {document.cteSchedule?.scheduleWindow || "A definir"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Doca / Pátio</span>
                        <strong className="text-slate-800 font-semibold">
                          {document.cteSchedule?.bayOrDock || "Não atribuída"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Status do Transporte</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-full text-[10px]">
                          {document.cteSchedule?.transportStatus || "Agendado"}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Motorista</span>
                        <strong className="text-slate-800 font-semibold">
                          {document.cteSchedule?.driverName || "Carlos Eduardo Silveira"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[11px] block">Placa</span>
                        <strong className="text-slate-800 font-mono font-semibold">
                          {document.cteSchedule?.plate || "BRA2E19"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Histórico do Agendamento */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                    <h4 className="text-xs font-bold text-slate-800">
                      Histórico e Modificações de Agendamento
                    </h4>
                    <div className="space-y-2">
                      {(document.cteSchedule?.history || [
                        {
                          date: "Hoje, 09:18",
                          action: "Confirmação de janela operacional",
                          user: "Operação Logística CD",
                          note: "Doca 02 liberada para carga paletizada",
                        },
                      ]).map((h, i) => (
                        <div key={i} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                          <div className="flex justify-between font-semibold text-slate-800">
                            <span>{h.action}</span>
                            <span className="text-slate-400 text-[11px]">{h.date}</span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Responsável: {h.user}
                          </span>
                          {h.note && (
                            <p className="text-[11px] text-slate-600 mt-1 italic">"{h.note}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: DADOS DO DOCUMENTO */}
              {activeTab === "Documento" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Dados cadastrais e fiscais</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Data de Emissão</span>
                      <strong className="text-slate-800">{document.issueDate}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Previsão de Vencimento</span>
                      <strong className="text-slate-800">{document.dueDate || "30/10/2026"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Natureza da Operação</span>
                      <strong className="text-slate-800">Prestação de Serviço de Transporte</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Modalidade de Frete</span>
                      <strong className="text-slate-800">CIF (Por conta do Remetente)</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: PARTICIPANTES */}
              {activeTab === "Documento" && (
                <div className="space-y-3 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-slate-400 text-[11px] block font-bold uppercase">Emitente</span>
                    <strong className="text-slate-900 block">{document.partnerName}</strong>
                    <span className="text-slate-600 block">CNPJ: {document.partnerCnpj}</span>
                    <span className="text-slate-500 text-[11px] block">Inscrição Estadual: 114.892.401.119</span>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                    <span className="text-slate-400 text-[11px] block font-bold uppercase">Tomador</span>
                    <strong className="text-slate-900 block">{document.company}</strong>
                    <span className="text-slate-600 block">Filial: {document.branch}</span>
                  </div>
                </div>
              )}

              {/* ABA: VALORES */}
              {activeTab === "Valores" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Composição Tributária e Valores</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Valor do Frete / Serviço</span>
                      <strong className="text-slate-900">{document.valueGross}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Valor Líquido</span>
                      <strong className="text-emerald-700">{document.valueNet}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">ICMS / ISS</span>
                      <strong className="text-slate-800">R$ 1.782,00 (12%)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Retenções Federais</span>
                      <strong className="text-slate-800">R$ 930,00 (PIS/COFINS/CSLL)</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: VINCULAÇÕES */}
              {activeTab === "Vínculos" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Vínculo com Pedido SAP ERP</h3>
                  <div className="p-3 bg-slate-50 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Número do Pedido (SAP PO):</span>
                      <strong className="font-mono text-slate-800">{document.orderNumber || "4500099120"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Folha de Registro (MIGO):</span>
                      <strong className="font-mono text-slate-800">{document.orderSheet || "100293"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Saldo Disponível:</span>
                      <strong className="text-emerald-700 font-semibold">R$ 48.000,00</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: ARQUIVOS */}
              {activeTab === "Arquivos" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Documentos e Arquivos Eletrônicos</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1769e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                          <path d="M14 3v5h5" />
                          <path d="M8 13h8M8 17h5" />
                        </svg>
                        <div>
                          <strong className="block text-slate-800">{document.type.toLowerCase()}_{document.number}.xml</strong>
                          <span className="text-[11px] text-slate-500">XML assinado digitalmente (48 KB)</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-medium text-[10px]">
                        Autorizado SEFAZ
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1769e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                          <path d="M14 3v5h5" />
                          <path d="M9 13h6M9 17h6" />
                        </svg>
                        <div>
                          <strong className="block text-slate-800">DACTE_{document.number}.pdf</strong>
                          <span className="text-[11px] text-slate-500">Documento auxiliar de transporte (120 KB)</span>
                        </div>
                      </div>
                      <span className="text-xs text-[#1769e0] hover:underline cursor-pointer font-semibold">
                        Baixar PDF
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: INTEGRAÇÕES */}
              {activeTab === "Sistema" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Status dos Conectores</h3>
                  <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                    <div>
                      <strong className="text-slate-800 block">SAP S/4HANA (PRD)</strong>
                      <span className="text-slate-500 text-[11px]">Sincronização de fatura e partidas</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                      Conectado
                    </span>
                  </div>
                </div>
              )}

              {/* ABA: PAGAMENTO */}
              {activeTab === "Valores" && document.paymentStatus !== "Não aplicável" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Liquidação Financeira</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Status de Pagamento</span>
                      <strong className="text-slate-800">{document.paymentStatus}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Vencimento</span>
                      <strong className="text-slate-800">{document.dueDate || "30/10/2026"}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ABA: HISTÓRICO */}
              {activeTab === "Sistema" && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 text-xs">
                  <h3 className="font-bold text-slate-800">Trilha de Auditoria Geral</h3>
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-50 rounded-lg text-[11px]">
                      <div className="flex justify-between font-semibold text-slate-800">
                        <span>Documento recebido via Portal</span>
                        <span>{document.issueDate} 09:14</span>
                      </div>
                      <span className="text-slate-500">Autorizado na SEFAZ</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RODAPÉ FIXO COM LARGURA UNIFORME E BOTÕES ALINHADOS */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => alert(`Iniciando download dos documentos da ${document.type} ${document.number}...`)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Baixar documentos
            </button>
            <button
              type="button"
              onClick={() => alert(`Chamado de suporte aberto para o protocolo ${document.protocol}. Equipe acionada.`)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Solicitar ajuda
            </button>
          </div>

          <div className="flex items-center gap-2">
            {document.pendingIssue && (
              <button
                type="button"
                onClick={onOpenOrderException || (() => alert("Abrindo tela de correção e reenvio..."))}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
              >
                Corrigir e reenviar
              </button>
            )}
            {document.type === "CT-e" && (
              <button
                type="button"
                onClick={() => onOpenReschedule?.()}
                className="px-3.5 py-2 border border-[#1769e0] text-[#1769e0] rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
              >
                Alterar agenda
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1769e0] text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs"
            >
              Concluir visualização
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
