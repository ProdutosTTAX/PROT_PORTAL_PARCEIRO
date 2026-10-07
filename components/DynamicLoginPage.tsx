import React, { useState } from "react";
import logoImg from "../assets/logo.png";
import {
  ClientSecurityConfig,
  INITIAL_CLIENTS_SECURITY,
  SecurityUserRecord,
} from "../types/security";
import { LoginInputField } from "./LoginInputField";

function LineIcon({ children, size = 18 }: { children: React.ReactNode; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export type LoginStep =
  | "identify"
  | "dynamic_auth"
  | "multi_org_select"
  | "mfa_challenge"
  | "passkey_prompt"
  | "onboarding_admin"
  | "request_access"
  | "access_state_view";

export type AccessStateType =
  | "pending_approval"
  | "invite_expired"
  | "suspended"
  | "access_expired"
  | "revoked"
  | "company_disabled"
  | "rule_blocked"
  | "unrecognized_device"
  | "session_expired"
  | "step_up_needed"
  | "insufficient_permission"
  | "idp_maintenance";

export function DynamicLoginPage({
  onLoginSuccess,
  clients = INITIAL_CLIENTS_SECURITY,
}: {
  onLoginSuccess: (user: { name: string; email: string; company: string; role: string }) => void;
  clients?: ClientSecurityConfig[];
}) {
  const [step, setStep] = useState<LoginStep>("identify");
  const [email, setEmail] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [showCompanyCodeField, setShowCompanyCodeField] = useState(false);
  const [identifiedClient, setIdentifiedClient] = useState<ClientSecurityConfig | null>(null);

  // Estados da Etapa 2 (Conta local / senha)
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Estados de MFA
  const [mfaCode, setMfaCode] = useState("");
  const [mfaAttempts, setMfaAttempts] = useState(0);
  const [mfaError, setMfaError] = useState("");

  // Estados de Solicitação sem convite
  const [reqName, setReqName] = useState("");
  const [reqCompany, setReqCompany] = useState("");
  const [reqArea, setReqArea] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);

  // Estados de Primeiro Acesso Admin (Stepper)
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardTotpCode, setOnboardTotpCode] = useState("");

  // Estado de acesso bloqueado / informativo
  const [accessState, setAccessState] = useState<AccessStateType>("pending_approval");

  // ETAPA 1: Identificação e Descoberta de Domínio
  const handleIdentify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setLoginError("Informe um e-mail corporativo válido.");
      return;
    }
    setLoginError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const emailDomain = email.split("@")[1].toLowerCase();

      // Procura cliente associado ao domínio ou código
      let found = clients.find((c) =>
        c.domains.some((d) => d.domain.toLowerCase() === emailDomain)
      );

      // Se passou código da empresa ou atalho
      if (!found && companyCode.trim()) {
        const q = companyCode.toLowerCase();
        found = clients.find((c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
      }

      // Se usuário simulou multiempresa (ex: marcos@ ou consultor@)
      if (email.startsWith("consultor") || email.startsWith("multi")) {
        setIdentifiedClient(clients[0]);
        setStep("multi_org_select");
        return;
      }

      // Se simulou estado de bloqueio
      if (email.includes("bloqueado")) {
        setAccessState("rule_blocked");
        setStep("access_state_view");
        return;
      }
      if (email.includes("expirado")) {
        setAccessState("access_expired");
        setStep("access_state_view");
        return;
      }
      if (email.includes("suspenso")) {
        setAccessState("suspended");
        setStep("access_state_view");
        return;
      }

      if (found) {
        setIdentifiedClient(found);
        setStep("dynamic_auth");
      } else {
        // Mensagem genérica para impedir enumeração e descoberta de contas
        // e fallback inteligente para conta local TTAX se configurado
        const defaultClient = clients.find((c) => c.authMethod === "ttax_account") || clients[0];
        setIdentifiedClient(defaultClient);
        setStep("dynamic_auth");
      }
    }, 450);
  };

  // ETAPA 2: Autenticação Dinâmica
  const handleAuthSubmit = () => {
    if (!identifiedClient) return;

    // Se for Microsoft Entra ID ou SAML
    if (identifiedClient.authMethod === "entra_id" || identifiedClient.authMethod === "saml" || identifiedClient.authMethod === "oidc") {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // Sucesso via SSO
        onLoginSuccess({
          name: email.split("@")[0].replace(".", " "),
          email,
          company: identifiedClient.name,
          role: "Administrador / Gestor Fiscal",
        });
      }, 700);
      return;
    }

    // Se for Conta TTAX com senha
    if (!password) {
      setLoginError("Informe sua senha de acesso.");
      return;
    }

    setLoading(true);
    setLoginError("");

    setTimeout(() => {
      setLoading(false);
      // Exigir MFA se a política exigir
      if (identifiedClient.mfaEnforced) {
        setStep("mfa_challenge");
      } else {
        onLoginSuccess({
          name: email.split("@")[0].replace(".", " "),
          email,
          company: identifiedClient.name,
          role: "Parceiro Autorizado",
        });
      }
    }, 550);
  };

  // ETAPA 3: Desafio de MFA (TOTP 6 dígitos)
  const handleMfaVerify = () => {
    if (mfaCode.length !== 6) {
      setMfaError("O código deve possuir 6 dígitos numéricos.");
      return;
    }

    if (mfaCode === "000000") {
      setMfaError("Código incorreto ou expirado. Tente novamente.");
      setMfaAttempts(mfaAttempts + 1);
      if (mfaAttempts >= 2) {
        setAccessState("step_up_needed");
        setStep("access_state_view");
      }
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: email.split("@")[0].replace(".", " "),
        email,
        company: identifiedClient?.name || "TTAX Parceiro",
        role: "Administrador do parceiro",
      });
    }, 500);
  };

  // Autenticação com Passkey
  const handlePasskeyLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess({
        name: "Carlos Silveira (Passkey FIDO2)",
        email: email || "carlos.silveira@ttax.com.br",
        company: identifiedClient?.name || "TTAX Industrial",
        role: "TTAX Master",
      });
    }, 600);
  };

  return (
    <div className="login-page">
      {/* PAINEL INSTITUCIONAL TTAX À ESQUERDA */}
      <section className="login-brand">
        <div className="logo logo-dark">
          <img src={logoImg} alt="ttax tecnologia fiscal" className="logo-img" />
          <span className="logo-sub">Portal do Parceiro</span>
        </div>
        <div className="login-copy">
          <span className="eyebrow light">GESTÃO DE IDENTIDADES & ACESSO MULTIEMPRESA</span>
          <h1>Segurança centralizada.<br />Autonomia para cada cliente.</h1>
          <p>
            Acesse seus documentos fiscais e operações logísticas com federação de identidade corporativa (Microsoft Entra ID, SAML, OIDC) ou credenciais gerenciadas com MFA obrigatório.
          </p>
          <div className="brand-points">
            <span>🛡️ Criptografia de ponta a ponta</span>
            <span>⚡ Federação SSO em tempo real</span>
          </div>
          <div className="brand-points" style={{ marginTop: 12 }}>
            <span>🔑 Suporte a Passkey FIDO2</span>
            <span>👥 Provisionamento automático SCIM</span>
          </div>
        </div>
        <div className="login-art"><div /><div /><div /></div>
        <small>© 2025 TTAX Tecnologia Fiscal. Todos os direitos reservados.</small>
      </section>

      {/* FORMULÁRIO DINÂMICO À DIREITA */}
      <main className="login-form-wrap">
        <div className="login-form dynamic-login-box !max-w-[500px]">
          <div className="mobile-logo">
            <div className="logo">
              <img src={logoImg} alt="ttax" className="logo-img" />
              <span className="logo-sub">Portal do Parceiro</span>
            </div>
          </div>

          {/* ======================================================== */}
          {/* ETAPA 1: IDENTIFICAÇÃO E DESCOBERTA                      */}
          {/* ======================================================== */}
          {step === "identify" && (
            <form onSubmit={handleIdentify} className="w-full">
              <span className="eyebrow block">PORTAL DO PARCEIRO TTAX</span>
              <h2 className="text-2xl font-bold text-slate-900 mt-1 mb-2">Acesse sua conta</h2>
              <p className="text-xs text-slate-500 leading-relaxed pb-5 whitespace-nowrap">
                Informe seu e-mail corporativo para identificar o acesso.
              </p>

              {/* GRUPO DE CAMPOS COM ESPAÇAMENTOS CORRETOS (REQUISITOS 1, 2, 3, 4, 5, 6, 7, 8) */}
              <div className="space-y-5">
                {/* Campo 1: E-mail Corporativo */}
                <LoginInputField
                  id="email-input"
                  label="E-mail corporativo"
                  required
                  type="email"
                  placeholder="seu.nome@suaempresa.com.br"
                  value={email}
                  onChange={(val) => {
                    setEmail(val);
                    setLoginError("");
                  }}
                  error={loginError}
                  iconType="mail"
                  autoFocus
                />

                {/* Link para expandir/recolher o campo opcional Código da Empresa (Requisito 8) */}
                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => setShowCompanyCodeField(!showCompanyCodeField)}
                    className="text-xs font-semibold text-[#1769e0] hover:text-blue-700 hover:underline transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showCompanyCodeField ? "Ocultar código da empresa" : "Tenho um código da empresa"}</span>
                    <span className="text-[10px]">{showCompanyCodeField ? "▴" : "▾"}</span>
                  </button>

                  {!showCompanyCodeField && companyCode.trim() && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      Código salvo: {companyCode}
                    </span>
                  )}
                </div>

                {/* Campo 2: Código da Empresa (Inicia recolhido ou visível ao clicar) */}
                {showCompanyCodeField && (
                  <div className="animate-fadeIn">
                    <LoginInputField
                      id="company-code-input"
                      label="Código da empresa"
                      badge="Opcional"
                      type="text"
                      placeholder="Ex.: TTAX-IND ou CNPJ"
                      value={companyCode}
                      onChange={(val) => setCompanyCode(val)}
                      iconType="building"
                    />
                  </div>
                )}
              </div>

              {/* BOTÃO CONTINUAR PADRONIZADO (REQUISITO 9: 52px, 24px de margem superior, Lucide ArrowRight, spinner) */}
              <div className="mt-6 w-full">
                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className={`w-full h-[52px] rounded-[10px] text-white text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-150 shadow-sm ${
                    loading || !email.trim()
                      ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                      : "bg-[#1769e0] hover:bg-[#1357bd] active:bg-[#0f4699] shadow-blue-500/20 cursor-pointer"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>Identificando organização...</span>
                    </div>
                  ) : (
                    <>
                      <span>Continuar</span>
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* ATALHOS DE SIMULAÇÃO RÁPIDA */}
              <div className="login-sim-hints mt-6 pt-4 border-t border-slate-200">
                <small className="text-slate-400 block mb-2 font-medium">Simular cenários corporativos:</small>
                <div className="grid grid-cols-[1.35fr_1fr_1fr] gap-2 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("usuario@empresa.com");
                      setLoginError("");
                    }}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors text-center whitespace-nowrap overflow-visible"
                  >
                    Microsoft Entra (SSO)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("operador@transphorizonte.com.br");
                      setLoginError("");
                    }}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors text-center whitespace-nowrap overflow-visible"
                  >
                    Okta SAML 2.0
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("parceiro@logisticavale.com.br");
                      setLoginError("");
                    }}
                    className="px-2 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 transition-colors text-center whitespace-nowrap overflow-visible"
                  >
                    Conta TTAX + MFA
                  </button>
                </div>
              </div>

              <div className="login-bottom-links mt-5 space-y-2 text-center">
                <button
                  type="button"
                  className="text-xs font-semibold text-[#1769e0] hover:underline block w-full"
                  onClick={() => setStep("onboarding_admin")}
                >
                  Recebi um convite de primeiro acesso
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline block w-full"
                  onClick={() => setStep("request_access")}
                >
                  Solicitar acesso à minha empresa
                </button>
                <button
                  type="button"
                  className="text-[11px] text-slate-400 hover:text-slate-600 block w-full"
                  onClick={() => {
                    setAccessState("idp_maintenance");
                    setStep("access_state_view");
                  }}
                >
                  Não consigo acessar
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* ETAPA 2: LOGIN DINÂMICO CONFORME POLÍTICA DO CLIENTE     */}
          {/* ======================================================== */}
          {step === "dynamic_auth" && identifiedClient && (
            <div>
              {/* Cabeçalho da Organização Identificada */}
              <div className="client-identified-banner">
                <div className="client-banner-header">
                  <div className="client-badge-icon text-[#1769e0]">
                    <LineIcon>
                      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
                      <path d="M6 12H4a2 2 0 0 0-2 2v8" />
                      <path d="M18 9h2a2 2 0 0 1 2 2v11" />
                      <path d="M10 6h4" />
                      <path d="M10 10h4" />
                      <path d="M10 14h4" />
                      <path d="M10 18h4" />
                    </LineIcon>
                  </div>
                  <div>
                    <strong>{identifiedClient.name}</strong>
                    <small>Ambiente de Produção Seguro · {identifiedClient.cnpjMasked}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-change-client inline-flex items-center justify-center w-9 h-9 rounded-lg text-[#1769e0] hover:bg-blue-50"
                  onClick={() => {
                    setStep("identify");
                    setPassword("");
                    setLoginError("");
                  }}
                  aria-label="Trocar empresa"
                  title="Trocar empresa"
                >
                  <LineIcon>
                    <path d="M8 3 4 7l4 4" />
                    <path d="M4 7h16" />
                    <path d="m16 21 4-4-4-4" />
                    <path d="M20 17H4" />
                  </LineIcon>
                </button>
              </div>

              <div className="auth-policy-indicator">
                <span className="policy-badge">
                  Política: {identifiedClient.authMethod === "entra_id" ? "Microsoft Entra ID (OIDC)" : identifiedClient.authMethod === "saml" ? "SSO SAML 2.0" : "Conta TTAX + MFA"}
                </span>
                <span className="user-email-chip">{email}</span>
              </div>

              {/* VARIANTE 1: CLIENTE COM MICROSOFT SSO */}
              {identifiedClient.authMethod === "entra_id" && (
                <div className="sso-variant-panel">
                  <div className="sso-explain-card">
                    <span className="sso-icon-seal">🛡️</span>
                    <div>
                      <strong>SSO Corporativo Microsoft Entra ID</strong>
                      <p>
                        A política de segurança da <b>{identifiedClient.name}</b> exige que sua identidade seja validada pelo provedor corporativo Microsoft.
                      </p>
                    </div>
                  </div>

                  <p className="sso-redirect-note">
                    Ao continuar, você será direcionado ao ambiente seguro da Microsoft com mTLS e regras de Acesso Condicional. Não é necessário digitar senha local aqui.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary btn-wide btn-microsoft"
                    onClick={handleAuthSubmit}
                    disabled={loading}
                  >
                    <span>⊞</span>
                    <span>{loading ? "Redirecionando para Entra ID..." : "Entrar com Microsoft corporativo"}</span>
                  </button>
                </div>
              )}

              {/* VARIANTE 2: CLIENTE COM SAML OU OIDC GENÉRICO */}
              {identifiedClient.authMethod === "saml" && (
                <div className="sso-variant-panel">
                  <div className="sso-explain-card">
                    <span className="sso-icon-seal">🔒</span>
                    <div>
                      <strong>Federação SAML 2.0 ({identifiedClient.providerName})</strong>
                      <p>
                        A autenticação será realizada diretamente pela infraestrutura da <b>{identifiedClient.name}</b>.
                      </p>
                    </div>
                  </div>

                  <p className="sso-redirect-note">
                    Suas credenciais nunca trafegam nos servidores da TTAX. A sessão é emitida pela federação com asserção assinada digitalmente.
                  </p>

                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    onClick={handleAuthSubmit}
                    disabled={loading}
                  >
                    <span>{loading ? "Conectando ao IdP..." : `Entrar com SSO (${identifiedClient.providerName})`}</span>
                  </button>
                </div>
              )}

              {/* VARIANTE 3: CLIENTE COM CONTA TTAX (SENHA + PASSKEY) */}
              {(identifiedClient.authMethod === "ttax_account" || identifiedClient.authMethod === "invite_temp") && (
                <div className="local-auth-panel">
                  <label>
                    E-mail
                    <div className="field">
                      <span className="inline-flex text-[#1769e0]">
                        <LineIcon>
                          <rect width="20" height="16" x="2" y="4" rx="2" />
                          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                        </LineIcon>
                      </span>
                      <input type="email" value={email} readOnly />
                    </div>
                  </label>

                  <label style={{ marginTop: 14 }}>
                    Senha *
                    <div className={`field ${loginError ? "field-error" : ""}`}>
                      <span className="inline-flex text-[#1769e0]">
                        <LineIcon>
                          <rect x="4" y="10" width="16" height="11" rx="2" />
                          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                        </LineIcon>
                      </span>
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Digite sua senha cadastrada"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setLoginError("");
                        }}
                        autoFocus
                      />
                      <button
                        type="button"
                        className="field-action"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </label>

                  {loginError && (
                    <div
                      className="fixed top-5 right-5 z-[80] flex items-center gap-2.5 pl-4 pr-2 py-2.5 bg-white border border-rose-200 text-rose-700 rounded-xl shadow-lg text-sm"
                      role="alert"
                    >
                      <span className="inline-flex text-rose-600">
                        <LineIcon>
                          <path d="M12 3 2.8 20h18.4L12 3z" />
                          <path d="M12 9v4M12 17h.01" />
                        </LineIcon>
                      </span>
                      <span>{loginError}</span>
                      <button
                        type="button"
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-rose-500 hover:bg-rose-50"
                        aria-label="Fechar aviso"
                        onClick={() => setLoginError("")}
                      >
                        <LineIcon size={16}>
                          <path d="m6 6 12 12M18 6 6 18" />
                        </LineIcon>
                      </button>
                    </div>
                  )}

                  <div className="form-meta" style={{ marginTop: 14 }}>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={keepConnected}
                        onChange={(e) => setKeepConnected(e.target.checked)}
                      />
                      <span>Manter-me conectado</span>
                    </label>
                    <button
                      type="button"
                      className="link-sm"
                      onClick={() => alert("Link de recuperação enviado caso o e-mail exista.")}
                    >
                      Esqueci minha senha
                    </button>
                  </div>

                  {keepConnected && (
                    <div className="shared-pc-warning">
                      ⚠️ <b>Atenção:</b> Não use esta opção em computadores compartilhados ou de uso público.
                    </div>
                  )}

                  <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-wide"
                      onClick={handleAuthSubmit}
                      disabled={loading}
                    >
                      {loading ? "Validando credencial..." : "Entrar ➔"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-wide"
                      onClick={handlePasskeyLogin}
                    >
                      <span className="inline-flex text-[#1769e0]">
                        <LineIcon>
                          <circle cx="8" cy="15" r="4" />
                          <path d="m11.5 12.5 8.5-8.5" />
                          <path d="m16 8 2 2" />
                          <path d="m18 6 2 2" />
                        </LineIcon>
                      </span>
                      <span>Entrar com Passkey (FIDO2 / Biometria)</span>
                    </button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 24, textAlign: "center" }}>
                <button
                  type="button"
                  className="link-sm muted"
                  onClick={() => setStep("identify")}
                >
                  ← Voltar para identificação
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA: SELEÇÃO DE ORGANIZAÇÃO (USUÁRIO COM VÁRIAS EMPRESAS)*/}
          {/* ======================================================== */}
          {step === "multi_org_select" && (
            <div>
              <span className="eyebrow">CONTROLE DE ACESSO MULTIEMPRESA</span>
              <h2>Selecione a organização</h2>
              <p className="muted" style={{ marginBottom: 18 }}>
                Sua credencial possui vínculos ativos com múltiplos clientes da TTAX. Escolha o contexto de trabalho desejado.
              </p>

              <div className="multi-org-cards-list">
                {clients.map((c) => (
                  <div
                    key={c.id}
                    className="org-select-card"
                    onClick={() => {
                      setIdentifiedClient(c);
                      // Se a empresa exigir política mais forte (ex: passkey ou entra_id), exigir step-up
                      if (c.authMethod === "entra_id") {
                        setStep("dynamic_auth");
                      } else {
                        onLoginSuccess({
                          name: email.split("@")[0],
                          email,
                          company: c.name,
                          role: "Operador Fiscal Multiempresa",
                        });
                      }
                    }}
                  >
                    <div className="org-card-top">
                      <strong>{c.name}</strong>
                      <span className="status status-green">Vínculo Ativo</span>
                    </div>
                    <div className="org-card-details">
                      <span>CNPJ: {c.cnpjMasked}</span>
                      <span>Método: {c.providerName}</span>
                      <span>Perfil vinculado: Operador Fiscal</span>
                      <span>Último acesso: Ontem, 16:32</span>
                    </div>
                    <div className="org-card-footer">
                      <span className="link-sm">Acessar esta empresa ➔</span>
                      {c.authMethod === "entra_id" && (
                        <small className="badge-stepup">Exige autenticação Entra ID</small>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 18, textAlign: "center" }}>
                <button
                  type="button"
                  className="link-sm muted"
                  onClick={() => setStep("identify")}
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA: DESAFIO DE SEGUNDO FATOR (MFA)                    */}
          {/* ======================================================== */}
          {step === "mfa_challenge" && (
            <div>
              <span className="eyebrow">VERIFICAÇÃO EM DUAS ETAPAS</span>
              <h2>Confirme sua identidade</h2>
              <p className="muted" style={{ marginBottom: 20 }}>
                Digite o código de 6 dígitos gerado pelo seu aplicativo autenticador (Google Authenticator, Microsoft Authenticator ou 1Password).
              </p>

              <div className="mfa-challenge-box">
                <div className="mfa-totp-input-wrap">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="000 000"
                    className="mfa-code-input"
                    value={mfaCode}
                    onChange={(e) => {
                      setMfaCode(e.target.value.replace(/\D/g, ""));
                      setMfaError("");
                    }}
                    autoFocus
                  />
                </div>
                <small className="muted">Dica de demonstração: digite qualquer 6 dígitos exceto 000000.</small>

                {mfaError && (
                  <div className="login-error" role="alert" style={{ marginTop: 12 }}>
                    <span>⚠️ {mfaError}</span>
                  </div>
                )}

                <div style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    onClick={handleMfaVerify}
                    disabled={loading}
                  >
                    {loading ? "Validando segundo fator..." : "Verificar e acessar ➔"}
                  </button>
                </div>

                <div className="mfa-recovery-options">
                  <button
                    type="button"
                    className="link-sm"
                    onClick={() => alert("Código de recuperação emergencial solicitado.")}
                  >
                    Usar código de recuperação emergencial
                  </button>
                </div>
              </div>

              <div style={{ marginTop: 20, textAlign: "center" }}>
                <button
                  type="button"
                  className="link-sm muted"
                  onClick={() => setStep("dynamic_auth")}
                >
                  ← Voltar
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FLUXO DE PRIMEIRO ACESSO / ONBOARDING ADMINISTRADOR      */}
          {/* ======================================================== */}
          {step === "onboarding_admin" && (
            <div>
              <span className="eyebrow">PRIMEIRO ACESSO · ATIVAÇÃO</span>
              <h2>Ativação de conta autorizada</h2>
              <p className="muted" style={{ marginBottom: 16 }}>
                Seu cadastro precisa ter sido previamente autorizado e homologado pela TTAX.
              </p>

              {/* Stepper visual do primeiro acesso */}
              <div className="onboard-stepper">
                {[
                  "1. Convite TTAX",
                  "2. E-mail",
                  "3. 2º Canal",
                  "4. MFA / Passkey",
                  "5. Termos",
                  "6. Concluído",
                ].map((st, i) => (
                  <React.Fragment key={st}>
                    {i > 0 && (
                      <span className="onboard-step-arrow" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 6 15 12 9 18" />
                        </svg>
                      </span>
                    )}
                    <div
                      className={`onboard-step-item ${onboardStep === i + 1 ? "active" : onboardStep > i + 1 ? "done" : ""}`}
                    >
                      <span className="step-num">{onboardStep > i + 1 ? "✓" : i + 1}</span>
                      <small>{st.split(". ")[1]}</small>
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {onboardStep === 1 && (
                <div className="onboard-card-body">
                  <div className="alert-box success">
                    <div>
                      <strong>Convite prévio identificado</strong>
                      <p>Token de uso único válido por 48 horas emitido por TTAX Master para a empresa <b>TTAX Industrial</b>.</p>
                    </div>
                  </div>
                  <label>
                    Código de ativação do convite
                    <div className="field">
                      <span>🔑</span>
                      <input type="text" defaultValue="TTX-INV-99214-X8A" readOnly />
                    </div>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    style={{ marginTop: 16 }}
                    onClick={() => setOnboardStep(2)}
                  >
                    Avançar para validação de e-mail ➔
                  </button>
                </div>
              )}

              {onboardStep === 2 && (
                <div className="onboard-card-body">
                  <p>Código de confirmação de 6 dígitos enviado para <b>{email || "seu e-mail corporativo"}</b>.</p>
                  <div className="field">
                    <span>✉️</span>
                    <input type="text" placeholder="Digite o código recebido no e-mail" defaultValue="841920" />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    style={{ marginTop: 16 }}
                    onClick={() => setOnboardStep(3)}
                  >
                    Confirmar e avançar ➔
                  </button>
                </div>
              )}

              {onboardStep === 3 && (
                <div className="onboard-card-body">
                  <h4>Confirmação por segundo canal seguro</h4>
                  <p className="muted">Para o primeiro administrador, a TTAX exige validação telefônica ou link corporativo assinado.</p>
                  <div className="alert-box warning">
                    <div>
                      <strong>Canal secundário homologado</strong>
                      <p>SMS / WhatsApp corporativo validado pelo NOC TTAX.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    onClick={() => setOnboardStep(4)}
                  >
                    Avançar para cadastro de MFA ➔
                  </button>
                </div>
              )}

              {onboardStep === 4 && (
                <div className="onboard-card-body">
                  <h4>Configuração obrigatória de MFA / Passkey</h4>
                  <div className="qr-code-mock">
                    <div className="mock-qr-graphic">QR CODE SIMULADO</div>
                    <div className="qr-info">
                      <strong>Escaneie com seu app autenticador</strong>
                      <small>Chave manual: <code>TTX2 9A4K 88PL 11ZM</code></small>
                    </div>
                  </div>
                  <label style={{ marginTop: 12 }}>
                    Digite o código de 6 dígitos gerado:
                    <input
                      type="text"
                      className="input-custom"
                      placeholder="Ex: 123456"
                      value={onboardTotpCode}
                      onChange={(e) => setOnboardTotpCode(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    style={{ marginTop: 14 }}
                    onClick={() => setOnboardStep(5)}
                  >
                    Validar MFA e prosseguir ➔
                  </button>
                </div>
              )}

              {onboardStep === 5 && (
                <div className="onboard-card-body">
                  <h4>Aceite de Termos e Responsabilidade</h4>
                  <div className="terms-scroll-box">
                    <p>Ao ativar sua credencial como administrador do parceiro, você concorda em cumprir a política de segurança da informação TTAX, garantir que apenas operadores autorizados acessem os dados fiscais e zelar pela confidencialidade das chaves e certificados corporativos.</p>
                  </div>
                  <label className="check" style={{ marginTop: 12 }}>
                    <input type="checkbox" defaultChecked />
                    <span>Li e aceito os termos de governança e segurança de dados.</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    style={{ marginTop: 16 }}
                    onClick={() => setOnboardStep(6)}
                  >
                    Ativar conta agora ➔
                  </button>
                </div>
              )}

              {onboardStep === 6 && (
                <div className="onboard-card-body" style={{ textAlign: "center" }}>
                  <div className="success-icon-big">✓</div>
                  <h3>Conta ativada com sucesso!</h3>
                  <p className="muted">Você já pode acessar o Portal do Parceiro com seu perfil de Administrador do parceiro.</p>
                  <button
                    type="button"
                    className="btn btn-primary btn-wide"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      onLoginSuccess({
                        name: "Novo Administrador",
                        email: email || "admin.parceiro@empresa.com.br",
                        company: "TTAX Industrial",
                        role: "Administrador do parceiro",
                      });
                    }}
                  >
                    Entrar no Portal do Parceiro ➔
                  </button>
                </div>
              )}

              <div style={{ marginTop: 18, textAlign: "center" }}>
                <button
                  type="button"
                  className="link-sm muted"
                  onClick={() => setStep("identify")}
                >
                  ← Cancelar e voltar ao login
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* FLUXO: SOLICITAÇÃO DE ACESSO SEM CONVITE                 */}
          {/* ======================================================== */}
          {step === "request_access" && (
            <div>
              <span className="eyebrow">SOLICITAÇÃO DE ACESSO</span>
              <h2>Solicitar acesso à empresa</h2>

              {!reqSubmitted ? (
                <>
                  <div className="alert-box warning" style={{ marginBottom: 16 }}>
                    <div>
                      <strong>Não encontramos um convite ativo</strong>
                      <p>
                        Encontramos sua empresa, mas não existe um convite ativo. Envie uma solicitação ao administrador responsável.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setReqSubmitted(true);
                    }}
                  >
                    <label>
                      Nome completo *
                      <input
                        type="text"
                        className="input-custom"
                        placeholder="Seu nome completo"
                        required
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                      />
                    </label>

                    <label style={{ marginTop: 10 }}>
                      E-mail corporativo *
                      <input
                        type="email"
                        className="input-custom"
                        placeholder="seu.email@empresa.com.br"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>

                    <label style={{ marginTop: 10 }}>
                      Empresa *
                      <input
                        type="text"
                        className="input-custom"
                        placeholder="Nome da sua empresa ou CNPJ"
                        required
                        value={reqCompany}
                        onChange={(e) => setReqCompany(e.target.value)}
                      />
                    </label>

                    <label style={{ marginTop: 10 }}>
                      Área / Departamento *
                      <input
                        type="text"
                        className="input-custom"
                        placeholder="Ex: Fiscal, Logística, Contabilidade"
                        required
                        value={reqArea}
                        onChange={(e) => setReqArea(e.target.value)}
                      />
                    </label>

                    <label style={{ marginTop: 10 }}>
                      Motivo da solicitação *
                      <textarea
                        className="input-custom textarea"
                        rows={3}
                        placeholder="Descreva por que você necessita acessar este portal..."
                        required
                        value={reqReason}
                        onChange={(e) => setReqReason(e.target.value)}
                      />
                    </label>

                    <label style={{ marginTop: 10 }}>
                      Telefone corporativo (opcional)
                      <input
                        type="tel"
                        className="input-custom"
                        placeholder="+55 (11) 99999-9999"
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                      />
                    </label>

                    <button
                      type="submit"
                      className="btn btn-primary btn-wide"
                      style={{ marginTop: 18 }}
                    >
                      Enviar solicitação ao administrador
                    </button>
                  </form>
                </>
              ) : (
                <div className="request-success-box">
                  <div className="success-icon-big">✓</div>
                  <h3>Solicitação enviada com sucesso</h3>
                  <div className="status-pill-big">Aguardando aprovação do administrador</div>
                  <p className="muted" style={{ marginTop: 12 }}>
                    Um e-mail foi encaminhado para os administradores autorizados da sua empresa. Assim que aprovado, você receberá um link seguro de primeiro acesso.
                  </p>
                  <button
                    type="button"
                    className="btn btn-secondary btn-wide"
                    style={{ marginTop: 16 }}
                    onClick={() => {
                      setReqSubmitted(false);
                      setStep("identify");
                    }}
                  >
                    Voltar para o início
                  </button>
                </div>
              )}

              <div style={{ marginTop: 18, textAlign: "center" }}>
                <button
                  type="button"
                  className="link-sm muted"
                  onClick={() => setStep("identify")}
                >
                  ← Voltar para identificação
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TELAS E ESTADOS DE ACESSO ESPECÍFICOS (SEÇÃO 6)           */}
          {/* ======================================================== */}
          {step === "access_state_view" && (
            <div className="access-state-container">
              <div className="state-icon-large">
                {accessState === "rule_blocked" && "⛔"}
                {accessState === "suspended" && "⏸️"}
                {accessState === "access_expired" && "⌛"}
                {accessState === "pending_approval" && "⏳"}
                {accessState === "step_up_needed" && "🛡️"}
                {accessState === "idp_maintenance" && "🛠️"}
                {accessState === "unrecognized_device" && "📱"}
              </div>

              <h2>
                {accessState === "rule_blocked" && "Acesso bloqueado por política de segurança"}
                {accessState === "suspended" && "Conta temporariamente suspensa"}
                {accessState === "access_expired" && "Validade do acesso expirada"}
                {accessState === "pending_approval" && "Acesso pendente de aprovação"}
                {accessState === "step_up_needed" && "Necessidade de nova autenticação"}
                {accessState === "idp_maintenance" && "Manutenção do provedor de identidade"}
                {accessState === "unrecognized_device" && "Dispositivo não reconhecido"}
              </h2>

              <p className="muted" style={{ marginTop: 8, marginBottom: 18 }}>
                {accessState === "rule_blocked" && "Sua conexão não atendeu a uma regra corporativa mínima (Regra SEC-EXP-003 ou restrição de IP da organização)."}
                {accessState === "suspended" && "Seu vínculo foi suspenso por inatividade superior a 45 dias conforme política SEC-IDL-004."}
                {accessState === "access_expired" && "O período contratual ou a campanha de revisão de acesso atingiu a data limite."}
                {accessState === "pending_approval" && "Sua conta aguarda homologação formal pelo Administrador do parceiro ou TTAX Master."}
                {accessState === "step_up_needed" && "Ação crítica detectada ou excesso de tentativas incorretas. Exige nova validação com MFA ou biometria."}
                {accessState === "idp_maintenance" && "O provedor de identidade federado está momentaneamente indisponível para sincronização."}
                {accessState === "unrecognized_device" && "Detectamos um login originado de um dispositivo ou navegador não cadastrado anteriormente."}
              </p>

              <div className="state-action-box">
                <strong>O que você pode fazer:</strong>
                <ul>
                  <li>Entre em contato com o gestor responsável da sua empresa.</li>
                  <li>Solicite a renovação ou homologação do seu acesso na Central de Segurança.</li>
                  <li>Verifique se você está conectado à rede corporativa autorizada.</li>
                </ul>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-wide"
                  onClick={() => setStep("identify")}
                >
                  Tentar com outro usuário
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-wide"
                  onClick={() => setStep("request_access")}
                >
                  Solicitar reativação
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
