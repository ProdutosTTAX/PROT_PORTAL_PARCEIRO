import React, { useState } from "react";
import { DocTypeDefinition, DocTypeCategory } from "../types/documents";

export function ManageDocTypesModal({
  docTypes,
  onClose,
  onSaveNewType,
  onToggleActive,
}: {
  docTypes: DocTypeDefinition[];
  onClose: () => void;
  onSaveNewType: (newType: DocTypeDefinition) => void;
  onToggleActive: (id: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocTypeCategory>("Fiscal Mercantil");
  const [hasSchedule, setHasSchedule] = useState(false);
  const [hasOrderLinking, setHasOrderLinking] = useState(true);
  const [hasFinancialFlow, setHasFinancialFlow] = useState(true);
  const [error, setError] = useState("");

  const handleSave = () => {
    if (!id.trim() || !name.trim()) {
      setError("Código e descrição são obrigatórios.");
      return;
    }
    if (docTypes.some((t) => t.id.toLowerCase() === id.trim().toLowerCase())) {
      setError("Já existe um tipo cadastrado com esta sigla.");
      return;
    }

    onSaveNewType({
      id: id.trim().toUpperCase(),
      name: name.trim(),
      category,
      shortLabel: id.trim().toUpperCase(),
      badgeTone: category === "Transporte & Logística" ? "purple" : category === "Fiscal de Serviços" ? "green" : "blue",
      hasSchedule,
      hasOrderLinking,
      hasFinancialFlow,
      active: true,
    });
    setIsAdding(false);
    setId("");
    setName("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[85%] md:max-w-[840px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">ADMINISTRAÇÃO · FISCAL</span>
            <h2>Tipos de Documento</h2>
            <p className="muted">Configure os tipos aceitos, fluxos operacionais e validações dinâmicas.</p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {!isAdding ? (
            <>
              <div className="manage-top-actions">
                <span>{docTypes.length} tipos cadastrados no motor fiscal</span>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsAdding(true)}
                >
                  + Cadastrar novo tipo
                </button>
              </div>

              <div className="doc-type-table-wrap">
                <table className="mini-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Sigla</th>
                      <th>Nome / Descrição</th>
                      <th>Categoria</th>
                      <th>Agendamento</th>
                      <th>Vínculo Pedido</th>
                      <th>Financeiro</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docTypes.map((t) => (
                      <tr key={t.id}>
                        <td>
                          <span className={`status ${t.active ? "status-green" : "status-gray"}`}>
                            {t.active ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td>
                          <span className={`doc-chip-badge tone-${t.badgeTone}`}>
                            {t.shortLabel}
                          </span>
                        </td>
                        <td><strong>{t.name}</strong></td>
                        <td><small>{t.category}</small></td>
                        <td>{t.hasSchedule ? "✓ Habilitado" : "—"}</td>
                        <td>{t.hasOrderLinking ? "✓ Sim" : "—"}</td>
                        <td>{t.hasFinancialFlow ? "✓ Sim" : "—"}</td>
                        <td>
                          <button
                            className="link-sm"
                            onClick={() => onToggleActive(t.id)}
                          >
                            {t.active ? "Desativar" : "Ativar"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="add-doc-type-form">
              <h3>Cadastrar novo tipo de documento</h3>
              <p className="muted">Defina as características operacionais e o comportamento de validação.</p>

              <div className="schedule-form-grid" style={{ marginTop: 14 }}>
                <label className="field-group">
                  <span>Sigla / Código (Ex: NFCom, GTV-e) *</span>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="NFCom"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                  />
                </label>

                <label className="field-group">
                  <span>Categoria fiscal / operacional *</span>
                  <select
                    className="input-custom"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as DocTypeCategory)}
                  >
                    <option value="Fiscal Mercantil">Fiscal Mercantil</option>
                    <option value="Fiscal de Serviços">Fiscal de Serviços</option>
                    <option value="Transporte & Logística">Transporte & Logística</option>
                    <option value="Financeiro & Outros">Financeiro & Outros</option>
                  </select>
                </label>

                <label className="field-group full-width">
                  <span>Nome completo / Descrição do documento *</span>
                  <input
                    type="text"
                    className="input-custom"
                    placeholder="Nota Fiscal de Comunicação Eletrônica"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              </div>

              <div className="checkbox-features-group">
                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={hasSchedule}
                    onChange={(e) => setHasSchedule(e.target.checked)}
                  />
                  <div>
                    <strong>Permitir agendamento logístico</strong>
                    <small>Habilita controle de janelas, docas e motorista para este documento.</small>
                  </div>
                </label>

                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={hasOrderLinking}
                    onChange={(e) => setHasOrderLinking(e.target.checked)}
                  />
                  <div>
                    <strong>Exigir / Permitir vínculo com Pedido e Folha (SAP)</strong>
                    <small>Habilita etapa de conferência de saldo com pedido de compras.</small>
                  </div>
                </label>

                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={hasFinancialFlow}
                    onChange={(e) => setHasFinancialFlow(e.target.checked)}
                  />
                  <div>
                    <strong>Possui fluxo financeiro / previsão de pagamento</strong>
                    <small>Exibe vencimentos e integração de partidas abertas na aba Pagamentos.</small>
                  </div>
                </label>
              </div>

              {error && <div className="alert-box error">{error}</div>}

              <div className="form-sub-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsAdding(false)}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSave}
                >
                  Salvar novo tipo
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </aside>
    </div>
  );
}
