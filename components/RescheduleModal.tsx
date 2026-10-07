import React, { useState } from "react";
import { DocumentRecord, DocTypeDefinition } from "../types/documents";

export function RescheduleModal({
  documents,
  docTypes,
  onClose,
  onSaveSchedule,
}: {
  documents: DocumentRecord[];
  docTypes: DocTypeDefinition[];
  onClose: () => void;
  onSaveSchedule: (
    docIds: string[],
    newDate: string,
    newWindow: string,
    bay: string,
    reason: string,
    perDocument?: { id: string; date: string; window: string; bay: string }[]
  ) => void;
}) {
  const [date, setDate] = useState("2026-10-21");
  const [windowSlot, setWindowSlot] = useState("08:00 - 10:00");
  const [bay, setBay] = useState("Doca 02 (Recepção Sul)");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const compatible =
    documents.length > 0 &&
    documents.every((doc) => doc.company === documents[0].company && doc.branch === documents[0].branch);
  const [applyAll, setApplyAll] = useState(compatible && documents.length > 1);
  const [rows, setRows] = useState(() =>
    documents.map((doc) => ({
      id: doc.id,
      date: "",
      window: doc.cteSchedule?.scheduleWindow || "08:00 - 10:00",
      bay: doc.cteSchedule?.bayOrDock || "Doca 02 (Recepção Sul)",
    }))
  );

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Por favor, informe a justificativa operacional da alteração.");
      return;
    }
    setError("");
    const individual = !applyAll && documents.length > 1;
    onSaveSchedule(
      documents.map((d) => d.id),
      date,
      windowSlot,
      bay,
      reason,
      individual ? rows : undefined
    );
  };

  const isBatch = documents.length > 1;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[70%] md:max-w-[620px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">OPERAÇÃO DE TRANSPORTE · CT-E</span>
            <h2>{isBatch ? `Alterar agenda (${documents.length} CT-es)` : "Alterar agenda"}</h2>
            <p className="muted">
              {isBatch
                ? compatible
                  ? "Estes CT-es são da mesma empresa e filial. A agenda pode ser aplicada em lote ou ajustada um a um."
                  : "Empresa ou filial diferentes. Ajuste a agenda de cada CT-e."
                : `Documento ${documents[0]?.number} · ${documents[0]?.partnerName}`}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="fiscal-safety-alert">
            <span className="safety-badge">Aviso Fiscal</span>
            <p>
              O agendamento operacional <strong>não altera dados fiscais nem a chave de acesso</strong> autorizada na SEFAZ. Os dados servem exclusivamente para controle de pátio, portaria e recebimento físico.
            </p>
          </div>

          <div className="selected-docs-summary">
            <strong>Documentos incluídos:</strong>
            <div className="mini-chips-list">
              {documents.map((d) => (
                <span key={d.id} className="mini-doc-chip">
                  <b>{d.type} {d.number}</b> · {d.company} ({d.cteSchedule?.scheduleDate || "Sem data"})
                </span>
              ))}
            </div>
          </div>

          {isBatch && compatible && (
            <label className="flex items-center gap-2 text-sm text-slate-700 mb-3">
              <input type="checkbox" checked={applyAll} onChange={(event) => setApplyAll(event.target.checked)} />
              Aplicar a mesma agenda em todos os CT-es selecionados
            </label>
          )}

          {!applyAll && documents.length > 1 ? (
            <div className="space-y-3">
              {documents.map((doc) => {
                const row = rows.find((item) => item.id === doc.id);
                const update = (key: "date" | "window" | "bay", value: string) =>
                  setRows((current) => current.map((item) => (item.id === doc.id ? { ...item, [key]: value } : item)));
                return (
                  <div key={doc.id} className="rounded-xl border border-slate-200 p-3 space-y-2">
                    <strong className="block text-sm text-slate-800">
                      CT-e {doc.number} · {doc.company} / {doc.branch}
                    </strong>
                    <p className="text-xs text-slate-500">
                      Agenda atual: {doc.cteSchedule?.scheduleDate || "Sem data"} · {doc.cteSchedule?.scheduleWindow || "Sem janela"} · {doc.cteSchedule?.bayOrDock || "Sem doca"}
                    </p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <label className="field-group">
                        <span>Nova data *</span>
                        <input type="date" className="input-custom" value={row?.date || ""} onChange={(event) => update("date", event.target.value)} />
                      </label>
                      <label className="field-group">
                        <span>Janela *</span>
                        <select className="input-custom" value={row?.window || ""} onChange={(event) => update("window", event.target.value)}>
                          <option>08:00 - 10:00</option>
                          <option>10:00 - 12:00</option>
                          <option>13:00 - 15:00</option>
                          <option>15:00 - 17:00</option>
                        </select>
                      </label>
                      <label className="field-group">
                        <span>Doca *</span>
                        <input className="input-custom" value={row?.bay || ""} onChange={(event) => update("bay", event.target.value)} />
                      </label>
                    </div>
                  </div>
                );
              })}
              <label className="field-group full-width">
                <span>Motivo da alteração *</span>
                <textarea
                  rows={3}
                  className="input-custom textarea"
                  placeholder="Informe o motivo operacional da alteração."
                  value={reason}
                  onChange={(event) => {
                    setReason(event.target.value);
                    setError("");
                  }}
                />
              </label>
            </div>
          ) : (
          <div className="schedule-form-grid">
            <label className="field-group">
              <span>Nova data de agendamento *</span>
              <input
                type="date"
                className="input-custom"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </label>

            <label className="field-group">
              <span>Janela de horário *</span>
              <select
                className="input-custom"
                value={windowSlot}
                onChange={(e) => setWindowSlot(e.target.value)}
              >
                <option value="06:00 - 08:00">06:00 - 08:00 (Manhã cedo)</option>
                <option value="08:00 - 10:00">08:00 - 10:00 (Padrão 1)</option>
                <option value="10:00 - 12:00">10:00 - 12:00 (Padrão 2)</option>
                <option value="13:00 - 15:00">13:00 - 15:00 (Tarde 1)</option>
                <option value="15:00 - 17:00">15:00 - 17:00 (Tarde 2)</option>
                <option value="18:00 - 22:00">18:00 - 22:00 (Turno noturno)</option>
              </select>
            </label>

            <label className="field-group full-width">
              <span>Doca / Pátio de destino *</span>
              <select
                className="input-custom"
                value={bay}
                onChange={(e) => setBay(e.target.value)}
              >
                <option value="Doca 01 (Entrada Geral)">Doca 01 (Entrada Geral)</option>
                <option value="Doca 02 (Recepção Sul)">Doca 02 (Recepção Sul)</option>
                <option value="Doca 03 (Descarga Pesada)">Doca 03 (Descarga Pesada)</option>
                <option value="Doca 04 (Insumos Químicos)">Doca 04 (Insumos Químicos)</option>
                <option value="Pátio Externo (Buffer)">Pátio Externo (Buffer)</option>
              </select>
            </label>

            <label className="field-group full-width">
              <span>Motivo do reagendamento (obrigatório para auditoria) *</span>
              <textarea
                rows={3}
                className="input-custom textarea"
                placeholder="Ex: Atraso no trajeto interestadual / Liberação de vaga na doca 02 solicitada pela expedição..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  setError("");
                }}
              />
            </label>
          </div>

          )}

          {error && (
            <div className="alert-box error" style={{ marginTop: 12 }}>
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleConfirm}>
            Confirmar alteração de agenda
          </button>
        </div>
      </aside>
    </div>
  );
}
