import React, { useState } from "react";
import {
  SecurityUserRecord,
  InternalProfile,
  ClientSecurityConfig,
} from "../types/security";

export function UserSecurityDrawer({
  user,
  onClose,
  onRevokeAccess,
  onRenewAccess,
  onResetMfa,
  onTerminateSessions,
}: {
  user: SecurityUserRecord;
  onClose: () => void;
  onRevokeAccess: (user: SecurityUserRecord) => void;
  onRenewAccess: (user: SecurityUserRecord) => void;
  onResetMfa: (user: SecurityUserRecord) => void;
  onTerminateSessions: (user: SecurityUserRecord) => void;
}) {
  const [tab, setTab] = useState("Resumo");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const tabs = ["Resumo", "Permissões", "Sessões", "Dispositivos", "Aprovações", "Auditoria"];

  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer drawer-wide" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <span className="eyebrow">{user.companyName} · {user.profile}</span>
            <h2>{user.name}</h2>
            <p className="muted">{user.email} · Responsável: {user.responsibleName}</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className={`status status-${user.status === "ativo" ? "green" : user.status === "suspenso" ? "red" : "orange"}`}>
              {user.status}
            </span>
            <button className="icon-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Abas internas */}
        <div className="drawer-tabs">
          {tabs.map((t) => (
            <button
              key={t}
              className={tab === t ? "active" : ""}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {toastMsg && (
            <div className="alert-box success" style={{ marginBottom: 16 }}>
              <span>✓ {toastMsg}</span>
            </div>
          )}

          {/* ABA: RESUMO */}
          {tab === "Resumo" && (
            <div>
              <div className="summary-card">
                <div className="summary-title">
                  <h3>Dados de Identidade e Segurança</h3>
                  <span className="badge-type-outline">{user.authMethod}</span>
                </div>
                <div className="summary-grid">
                  <div className="info"><span>Nome completo</span><strong>{user.name}</strong></div>
                  <div className="info"><span>E-mail corporativo</span><strong>{user.email}</strong></div>
                  <div className="info"><span>Empresa</span><strong>{user.companyName}</strong></div>
                  <div className="info"><span>Perfil interno</span><span className="status status-purple">{user.profile}</span></div>
                  <div className="info"><span>Filiais autorizadas</span><strong>{user.branches.join(", ")}</strong></div>
                  <div className="info"><span>MFA configurado</span><strong>{user.mfaConfigured ? "✓ Ativo (TOTP)" : "Pendente"}</strong></div>
                  <div className="info"><span>Passkeys FIDO2</span><strong>{user.passkeyCount} cadastradas</strong></div>
                  <div className="info"><span>Validade do acesso</span><strong>{user.validUntil}</strong></div>
                  <div className="info"><span>Último acesso</span><strong>{user.lastLogin}</strong></div>
                </div>
              </div>

              {user.alerts && user.alerts.length > 0 && (
                <div className="alert-box warning">
                  <div>
                    <strong>Avisos de conformidade de segurança</strong>
                    <ul>
                      {user.alerts.map((al, idx) => (
                        <li key={idx}>{al}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Botões de Ações Críticas */}
              <div className="summary-card" style={{ marginTop: 16 }}>
                <div className="summary-title">
                  <h3>Ações Administrativas no Usuário</h3>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onRenewAccess(user);
                      showToast("Acesso renovado por mais 90 dias.");
                    }}
                  >
                    📅 Renovar acesso
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onResetMfa(user);
                      showToast("MFA redefinido. Usuário deverá cadastrar novo QR Code.");
                    }}
                  >
                    🔄 Redefinir MFA
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      onTerminateSessions(user);
                      showToast("Todas as sessões ativas do usuário foram derrubadas.");
                    }}
                  >
                    🚪 Encerrar sessões ativas
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => onRevokeAccess(user)}
                  >
                    ⛔ Desligar / Revogar acesso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ABA: PERMISSÕES */}
          {tab === "Permissões" && (
            <div>
              <div className="summary-card">
                <div className="summary-title">
                  <h3>Documentos e Operações Concedidas</h3>
                </div>
                <div className="info">
                  <span>Documentos fiscais e logísticos</span>
                  <div className="mini-chips-list" style={{ marginTop: 6 }}>
                    {user.allowedDocuments.map((d) => (
                      <span key={d} className="mini-doc-chip">✓ {d}</span>
                    ))}
                  </div>
                </div>
                <div className="info" style={{ marginTop: 14 }}>
                  <span>Ações autorizadas</span>
                  <div className="mini-chips-list" style={{ marginTop: 6 }}>
                    {user.allowedActions.map((a) => (
                      <span key={a} className="mini-doc-chip" style={{ background: "#ecfdf5", color: "#047857" }}>
                        ✓ {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: SESSÕES E DISPOSITIVOS */}
          {(tab === "Sessões" || tab === "Dispositivos") && (
            <div>
              <div className="summary-card">
                <div className="summary-title">
                  <h3>Conexões registradas</h3>
                  <button
                    type="button"
                    className="link-sm"
                    style={{ color: "var(--red)" }}
                    onClick={() => onTerminateSessions(user)}
                  >
                    Derrubar todas as sessões
                  </button>
                </div>
                <div className="session-item-row">
                  <div className="session-icon">💻</div>
                  <div className="session-info">
                    <strong>Chrome 126 · macOS (Sessão recente)</strong>
                    <span className="session-meta">IP: 177.18.90.*** · São Paulo, SP</span>
                    <span className="session-time">Última requisição: {user.lastLogin}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: AUDITORIA */}
          {tab === "Auditoria" && (
            <div>
              <div className="summary-card">
                <div className="summary-title">
                  <h3>Trilha de Auditoria do Usuário</h3>
                </div>
                <div className="timeline">
                  <div className="timeline-item done">
                    <i>✓</i>
                    <div><strong>Acesso concedido e homologado</strong><span>Por {user.responsibleName}</span></div>
                    <small>01/01/2025</small>
                  </div>
                  <div className="timeline-item done">
                    <i>✓</i>
                    <div><strong>MFA verificado com sucesso</strong><span>App Authenticator</span></div>
                    <small>Hoje, 10:45</small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA: APROVAÇÕES */}
          {tab === "Aprovações" && (
            <div className="summary-card">
              <h3>Histórico de Alçadas</h3>
              <p className="muted">Usuário autorizado pelo responsável formal {user.responsibleName}.</p>
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Concluir
          </button>
        </div>
      </aside>
    </div>
  );
}
