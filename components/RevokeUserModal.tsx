import React, { useState } from "react";
import { SecurityUserRecord } from "../types/security";

export function RevokeUserModal({
  user,
  onClose,
  onConfirmRevoke,
}: {
  user: SecurityUserRecord;
  onClose: () => void;
  onConfirmRevoke: (reason: string, transferTo: string) => void;
}) {
  const [reason, setReason] = useState("Desligamento da empresa prestadora");
  const [transferTo, setTransferTo] = useState("Carla Mendes (carla.mendes@ttax.com.br)");
  const [revokeImmediate, setRevokeImmediate] = useState(true);
  const [terminateSessions, setTerminateSessions] = useState(true);
  const [cancelInvites, setCancelInvites] = useState(true);
  const [confirmed, setConfirmed] = useState(false);

  const handleExecute = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirmRevoke(reason, transferTo);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[70%] md:max-w-[620px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">GOVERNANÇA · DESLIGAMENTO</span>
            <h2>Revogar Acesso do Usuário</h2>
            <p className="muted">
              {user.name} ({user.email}) · {user.companyName}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {!confirmed ? (
            <>
              <div className="alert-box error" style={{ marginBottom: 16 }}>
                <div>
                  <strong>Aviso de Impacto da Revogação</strong>
                  <p>
                    O usuário perderá o acesso imediatamente. Conforme as regras da TTAX, <b>o registro nunca é excluído</b> para manter a integridade dos logs de auditoria e conformidade fiscal.
                  </p>
                </div>
              </div>

              <div className="form-grid" style={{ marginBottom: 14 }}>
                <div className="info">
                  <span>Sessões abertas</span>
                  <strong>2 sessões ativas serão invalidadas</strong>
                </div>
                <div className="info">
                  <span>Aprovações pendentes</span>
                  <strong>1 aprovação será transferida</strong>
                </div>
              </div>

              <label className="field-label">
                Motivo da revogação / desligamento *
                <select
                  className="input-select"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                >
                  <option value="Desligamento da empresa prestadora">Desligamento da empresa prestadora</option>
                  <option value="Fim do contrato de prestação de serviços">Fim do contrato de prestação de serviços</option>
                  <option value="Troca de função / área interna">Troca de função / área interna</option>
                  <option value="Violação de política de segurança">Violação de política de segurança</option>
                </select>
              </label>

              <label className="field-label" style={{ marginTop: 12 }}>
                Transferir pendências e alçadas para novo responsável *
                <input
                  type="text"
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                />
              </label>

              <div className="checkbox-features-group" style={{ marginTop: 14 }}>
                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={revokeImmediate}
                    onChange={(e) => setRevokeImmediate(e.target.checked)}
                  />
                  <span>Revogar vínculo imediatamente</span>
                </label>
                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={terminateSessions}
                    onChange={(e) => setTerminateSessions(e.target.checked)}
                  />
                  <span>Derrubar todas as sessões e tokens ativos</span>
                </label>
                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={cancelInvites}
                    onChange={(e) => setCancelInvites(e.target.checked)}
                  />
                  <span>Invalidar chaves pessoais e convites pendentes</span>
                </label>
              </div>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div className="success-icon-big">✓</div>
              <h3>Revogação Processada com Sucesso</h3>
              <div className="checklist-box" style={{ textAlign: "left", maxWidth: 420, margin: "16px auto" }}>
                <div>✓ Vínculo com a empresa revogado</div>
                <div>✓ Sessões ativas encerradas no IdP</div>
                <div>✓ Tokens OAuth invalidados</div>
                <div>✓ Pendências transferidas para {transferTo}</div>
                <div>✓ Evento registrado na trilha de auditoria</div>
              </div>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          {!confirmed && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleExecute}
            >
              Confirmar revogação de acesso
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
