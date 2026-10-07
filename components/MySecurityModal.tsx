import React, { useState } from "react";
import { SecuritySession, INITIAL_SECURITY_SESSIONS } from "../types/security";

export function MySecurityModal({
  user,
  onClose,
}: {
  user: { name: string; email: string; company: string; role: string };
  onClose: () => void;
}) {
  const [sessions, setSessions] = useState<SecuritySession[]>(INITIAL_SECURITY_SESSIONS);
  const [toastMsg, setToastMsg] = useState("");
  const [showPasskeys, setShowPasskeys] = useState(true);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleEndSession = (sessionId: string) => {
    setSessions(sessions.filter((s) => s.id !== sessionId));
    showToast("Sessão remota encerrada com sucesso.");
  };

  const handleEndAllOtherSessions = () => {
    setSessions(sessions.filter((s) => s.isCurrent));
    showToast("Todas as outras sessões foram invalidadas com sucesso.");
  };

  const handleUnrecognized = (s: SecuritySession) => {
    setSessions(sessions.filter((item) => item.id !== s.id));
    showToast(`Alerta de incidente gerado para ${s.ipMasked}. Dispositivo bloqueado.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[75%] md:max-w-[760px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <h2>Minha Segurança e Acessos</h2>
            <p className="muted">
              {user.name} ({user.email}) · {user.company} · {user.role}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Fechar">✕</button>
        </div>

        <div className="drawer-body">
          {toastMsg && (
            <div className="alert-box success" style={{ marginBottom: 16 }}>
              <span>✓ {toastMsg}</span>
            </div>
          )}

          {/* PAINEL DE MÉTODOS DE AUTENTICAÇÃO */}
          <div className="summary-card">
            <div className="summary-title">
              <h3>Método de login e credenciais ativas</h3>
              <span className="status status-green">Em conformidade</span>
            </div>
            <div className="summary-grid">
              <div className="info">
                <span>Método principal</span>
                <strong>Federação SSO / Conta Corporativa</strong>
              </div>
              <div className="info">
                <span>MFA Configurado</span>
                <span className="status status-green">✓ TOTP Ativo</span>
              </div>
              <div className="info">
                <span>Passkeys FIDO2</span>
                <strong>1 chave cadastrada (Touch ID / MacBook)</strong>
              </div>
              <div className="info">
                <span>Última troca de senha</span>
                <strong>Há 28 dias</strong>
              </div>
              <div className="info">
                <span>Dispositivos confiáveis</span>
                <strong>2 dispositivos homologados</strong>
              </div>
              <div className="info">
                <span>Política da empresa</span>
                <small>TTAX Industrial · Rotação 180 dias</small>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary link-sm"
                onClick={() => showToast("Solicitação de nova Passkey iniciada.")}
              >
                + Cadastrar nova Passkey (FIDO2)
              </button>
              <button
                type="button"
                className="btn btn-secondary link-sm"
                onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
              >
                {showRecoveryCodes ? "Ocultar códigos" : "Ver códigos de recuperação"}
              </button>
              <button
                type="button"
                className="btn btn-secondary link-sm"
                onClick={() => showToast("Redefinição de senha solicitada via e-mail corporativo.")}
              >
                Trocar senha corporativa
              </button>
            </div>

            {showRecoveryCodes && (
              <div className="recovery-codes-box" style={{ marginTop: 14 }}>
                <strong>Códigos de recuperação de emergência (uso único):</strong>
                <div className="codes-grid">
                  <code>9812-4410</code>
                  <code>8810-7712</code>
                  <code>1245-9981</code>
                  <code>3341-2810</code>
                </div>
                <small className="muted">Guarde estes códigos em local seguro fora deste dispositivo.</small>
              </div>
            )}
          </div>

          {/* SESSÕES ABERTAS E DISPOSITIVOS */}
          <div className="summary-card" style={{ marginTop: 18 }}>
            <div className="summary-title">
              <div>
                <h3>Sessões ativas ({sessions.length})</h3>
                <p className="muted" style={{ fontSize: 12 }}>
                  Dispositivos e navegadores atualmente conectados com sua credencial.
                </p>
              </div>
              {sessions.length > 1 && (
                <button
                  type="button"
                  className="btn btn-danger link-sm"
                  onClick={handleEndAllOtherSessions}
                >
                  Encerrar todas as outras sessões
                </button>
              )}
            </div>

            <div className="sessions-list">
              {sessions.map((s) => (
                <div key={s.id} className={`session-item-row ${s.isCurrent ? "current-session" : ""}`}>
                  <div className="session-icon">
                    {s.os.includes("iOS") ? "📱" : "💻"}
                  </div>
                  <div className="session-info">
                    <div className="session-title-line">
                      <strong>{s.browser} · {s.os}</strong>
                      {s.isCurrent && <span className="current-badge">Sessão Atual</span>}
                      {s.trusted && <span className="status status-blue">Confiável</span>}
                    </div>
                    <span className="session-meta">
                      📍 {s.location} · IP: <code>{s.ipMasked}</code> · Empresa: <b>{s.clientName}</b>
                    </span>
                    <span className="session-time">
                      Início: {s.startedAt} · Última atividade: <b>{s.lastActivity}</b>
                    </span>
                  </div>
                  <div className="session-actions">
                    {!s.isCurrent ? (
                      <>
                        <button
                          type="button"
                          className="link-sm"
                          style={{ color: "var(--red)" }}
                          onClick={() => handleEndSession(s.id)}
                        >
                          Encerrar
                        </button>
                        <button
                          type="button"
                          className="link-sm"
                          style={{ color: "var(--orange)" }}
                          onClick={() => handleUnrecognized(s)}
                        >
                          Não reconheço este acesso
                        </button>
                      </>
                    ) : (
                      <span className="status status-green">Conectado agora</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HISTÓRICO RECENTE DE EVENTOS DE ACESSO */}
          <div className="summary-card" style={{ marginTop: 18 }}>
            <div className="summary-title">
              <h3>Histórico recente de segurança da sua conta</h3>
            </div>
            <div className="timeline">
              <div className="timeline-item done">
                <i>✓</i>
                <div>
                  <strong>Login corporativo bem-sucedido com Entra ID</strong>
                  <span>Sessão atual iniciada via SSO Microsoft com mTLS</span>
                </div>
                <small>Hoje, 08:30</small>
              </div>
              <div className="timeline-item done">
                <i>✓</i>
                <div>
                  <strong>Segundo fator de autenticação validado (Passkey FIDO2)</strong>
                  <span>Biometria Touch ID confirmada no macOS</span>
                </div>
                <small>Hoje, 08:30</small>
              </div>
              <div className="timeline-item done">
                <i>✓</i>
                <div>
                  <strong>Acesso ao módulo Documentos registrado</strong>
                  <span>Visualização e conciliação de NF-e e CT-e</span>
                </div>
                <small>Hoje, 10:42</small>
              </div>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </aside>
    </div>
  );
}
