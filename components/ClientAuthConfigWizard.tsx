import React, { useState } from "react";
import {
  ClientSecurityConfig,
  AuthMethodType,
  InternalProfile,
} from "../types/security";

export function ClientAuthConfigWizard({
  client,
  onClose,
  onSaveConfig,
}: {
  client?: ClientSecurityConfig | null;
  onClose: () => void;
  onSaveConfig: (updated: ClientSecurityConfig) => void;
}) {
  const [step, setStep] = useState(1);

  // Etapa 1: Identificação
  const [orgName, setOrgName] = useState(client?.name || "Nova Organização");
  const [environment, setEnvironment] = useState<"Produção" | "Homologação">("Produção");
  const [techLead, setTechLead] = useState("Carlos Silveira (carlos.silveira@ttax.com.br)");
  const [bizLead, setBizLead] = useState("Carla Mendes (carla.mendes@ttax.com.br)");

  // Etapa 2: Método
  const [authMethod, setAuthMethod] = useState<AuthMethodType>(client?.authMethod || "entra_id");

  // Etapa 3: Técnica
  const [issuer, setIssuer] = useState(client?.technicalDetails?.issuer || "https://login.microsoftonline.com/9b23-entra/v2.0");
  const [clientId, setClientId] = useState(client?.technicalDetails?.clientId || "ttax-portal-client-prd");
  const [tenantId, setTenantId] = useState(client?.technicalDetails?.tenantId || "89a1c24e-****-****-****-a14890123ef1");
  const [metadataUrl, setMetadataUrl] = useState(client?.technicalDetails?.metadataUrl || "https://login.microsoftonline.com/common/.well-known/openid-configuration");
  const [redirectUri, setRedirectUri] = useState(client?.technicalDetails?.redirectUri || "https://parceiro.ttax.com.br/auth/callback");
  const [testResult, setTestResult] = useState<"none" | "testing" | "success" | "cert_expired" | "metadata_invalid">("none");

  // Etapa 4: Domínios
  const [domains, setDomains] = useState(
    client?.domains || [
      { domain: "empresa.com.br", status: "verificado", verifiedAt: "01/03/2025" },
    ]
  );
  const [newDomain, setNewDomain] = useState("");

  // Etapa 5: Provisionamento SCIM
  const [scimEnabled, setScimEnabled] = useState(client?.scimEnabled ?? true);
  const [scimEndpoint, setScimEndpoint] = useState("https://api.ttax.corp/scim/v2/CLIENT_ORG");

  // Etapa 6: Políticas
  const [mfaEnforced, setMfaEnforced] = useState(client?.mfaEnforced ?? true);
  const [passkeyAdminEnforced, setPasskeyAdminEnforced] = useState(client?.passkeyAdminEnforced ?? true);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(client?.sessionTimeoutMin || 15);
  const [maxInactivityDays, setMaxInactivityDays] = useState(client?.maxInactivityDays || 45);

  // Etapa 7: Mapeamento de grupos
  const [groupMappings, setGroupMappings] = useState(
    client?.groupMappings || [
      { externalGroup: "Fiscal-Admins", internalProfile: "ADMIN_PARCEIRO" as InternalProfile, branches: ["Todas"] },
      { externalGroup: "Fiscal-Operadores", internalProfile: "OPERADOR_FISCAL" as InternalProfile, branches: ["SP01"] },
    ]
  );

  // Etapa 8: Publicação / Motivo
  const [changeReason, setChangeReason] = useState("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const steps = [
    "1. Identificação",
    "2. Método",
    "3. Técnica",
    "4. Domínios",
    "5. Provisionamento",
    "6. Políticas",
    "7. Mapeamento",
    "8. Revisão & Ativação",
  ];

  const handleTestConnection = () => {
    setTestResult("testing");
    setTimeout(() => {
      if (issuer.includes("expirado")) {
        setTestResult("cert_expired");
      } else if (metadataUrl.includes("invalido")) {
        setTestResult("metadata_invalid");
      } else {
        setTestResult("success");
      }
    }, 700);
  };

  const handleAddDomain = () => {
    if (!newDomain.trim() || !newDomain.includes(".")) return;
    setDomains([...domains, { domain: newDomain.trim().toLowerCase(), status: "pendente" }]);
    setNewDomain("");
  };

  const handleSaveFinal = (publishProd = false) => {
    const updated: ClientSecurityConfig = {
      id: client?.id || `cli-${Date.now()}`,
      name: orgName,
      cnpjMasked: client?.cnpjMasked || "12.345.678/0001-**",
      authMethod,
      providerName: authMethod === "entra_id" ? "Microsoft Entra ID" : authMethod === "saml" ? "SAML 2.0 Corporativo" : "Conta TTAX + MFA",
      domains: domains as any,
      scimEnabled,
      scimStatus: scimEnabled ? "sincronizado" : "desativado",
      mfaEnforced,
      passkeyAdminEnforced,
      sessionTimeoutMin,
      maxSessionHours: 8,
      defaultValidityDays: 180,
      maxInactivityDays,
      activeUsersCount: client?.activeUsersCount || 1,
      pendingReviewsCount: 0,
      configStatus: publishProd ? "completa" : "em_homologacao",
      lastModified: `Hoje por Carlos Silveira (${changeReason || "Configuração atualizada"})`,
      groupMappings,
      technicalDetails: {
        issuer,
        clientId,
        tenantId,
        metadataUrl,
        redirectUri,
        certExpiry: "18/12/2026",
        scimEndpoint,
        scimTokenMasked: "scim_tok_••••••••••••",
      },
    };

    onSaveConfig(updated);
    setSavedSuccess(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[80%] md:max-w-[820px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">ADMINISTRAÇÃO · SEGURANÇA E ACESSO</span>
            <h2>Assistente de Configuração de Autenticação</h2>
            <p className="muted">
              Configure provedores de identidade corporativos, domínios, SCIM e políticas de acesso para a organização.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose} title="Fechar">✕</button>
        </div>

        {/* Stepper das 8 etapas */}
        <div className="stepper">
          {steps.map((st, i) => (
            <button
              key={st}
              type="button"
              className={`${i + 1 === step ? "active" : ""} ${i + 1 < step ? "done" : ""}`}
              onClick={() => setStep(i + 1)}
            >
              <i>{i + 1 < step ? "✓" : i + 1}</i>
              <span>{st.split(". ")[1]}</span>
            </button>
          ))}
        </div>

        <div className="drawer-body">
          {/* ======================================================== */}
          {/* ETAPA 1: IDENTIFICAÇÃO                                   */}
          {/* ======================================================== */}
          {step === 1 && (
            <div className="form-step">
              <h3>Identificação da Organização</h3>
              <p className="muted">Defina a organização e os responsáveis pela governança de acesso.</p>
              <div className="form-grid">
                <label className="field-label">
                  Nome da Organização / Cliente *
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Ambiente de Implantação *
                  <select
                    className="input-select"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                  >
                    <option value="Produção">Produção (Live)</option>
                    <option value="Homologação">Homologação / Testes</option>
                  </select>
                </label>
                <label className="field-label">
                  Responsável Técnico *
                  <input
                    type="text"
                    value={techLead}
                    onChange={(e) => setTechLead(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Responsável de Negócio / Gestor Parceiro *
                  <input
                    type="text"
                    value={bizLead}
                    onChange={(e) => setBizLead(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 2: MÉTODO DE AUTENTICAÇÃO                          */}
          {/* ======================================================== */}
          {step === 2 && (
            <div className="form-step">
              <h3>Método de Autenticação</h3>
              <p className="muted">Escolha o modelo de validação exigido pela política de segurança.</p>
              <div className="auth-method-cards-grid">
                {[
                  { id: "entra_id", title: "Microsoft Entra ID", sub: "OIDC corporativo com suporte a MFA condicional", icon: "⊞" },
                  { id: "saml", title: "SAML 2.0 Corporativo", sub: "Federação padrão com Okta, Ping ou AD FS", icon: "🔒" },
                  { id: "oidc", title: "OIDC Genérico", sub: "Provedor OpenID Connect corporativo", icon: "⚡" },
                  { id: "ttax_account", title: "Conta TTAX com MFA", sub: "Gestão local segura pela TTAX com TOTP obrigatório", icon: "🛡️" },
                  { id: "invite_temp", title: "Acesso Temporário por Convite", sub: "Validade limitada para auditorias e terceiros", icon: "⌛" },
                ].map((m) => (
                  <div
                    key={m.id}
                    className={`method-select-card ${authMethod === m.id ? "selected" : ""}`}
                    onClick={() => setAuthMethod(m.id as AuthMethodType)}
                  >
                    <span className="method-icon">{m.icon}</span>
                    <strong>{m.title}</strong>
                    <small>{m.sub}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 3: CONFIGURAÇÃO TÉCNICA E TESTE                    */}
          {/* ======================================================== */}
          {step === 3 && (
            <div className="form-step">
              <h3>Parâmetros Técnicos da Federação</h3>
              <p className="muted">Informe os endpoints e credenciais do provedor. Segredos aparecem mascarados.</p>

              <div className="form-grid">
                <label className="field-label">
                  Issuer / Entity ID *
                  <input
                    type="text"
                    value={issuer}
                    onChange={(e) => setIssuer(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Client ID *
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                  />
                </label>
                {authMethod === "entra_id" && (
                  <label className="field-label">
                    Tenant ID
                    <input
                      type="text"
                      value={tenantId}
                      onChange={(e) => setTenantId(e.target.value)}
                    />
                  </label>
                )}
                <label className="field-label">
                  Client Secret
                  <input
                    type="text"
                    defaultValue="••••••••••••••••••••••••••••••••"
                    readOnly
                  />
                </label>
                <label className="field-label" style={{ gridColumn: "1 / 3" }}>
                  URL de Metadados OIDC / SAML
                  <input
                    type="text"
                    value={metadataUrl}
                    onChange={(e) => setMetadataUrl(e.target.value)}
                  />
                </label>
                <label className="field-label" style={{ gridColumn: "1 / 3" }}>
                  Redirect URI homologada (Callback)
                  <input type="text" value={redirectUri} readOnly />
                </label>
              </div>

              {/* Botão de teste e resultados */}
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleTestConnection}
                >
                  ⚡ Testar conexão com IdP
                </button>

                {testResult === "testing" && <p className="muted" style={{ marginTop: 8 }}>Validando handshake e certificado mTLS...</p>}
                {testResult === "success" && (
                  <div className="alert-box success" style={{ marginTop: 12 }}>
                    <div>
                      <strong>Conexão válida e testada com sucesso!</strong>
                      <p>Certificado digital válido até 18/12/2026. Claims de e-mail e identificador confirmadas.</p>
                    </div>
                  </div>
                )}
                {testResult === "cert_expired" && (
                  <div className="alert-box error" style={{ marginTop: 12 }}>
                    <div>
                      <strong>Certificado SAML expirado</strong>
                      <p>O IdP retornou assinatura inválida. Atualize a chave no provedor corporativo.</p>
                    </div>
                  </div>
                )}
                {testResult === "metadata_invalid" && (
                  <div className="alert-box error" style={{ marginTop: 12 }}>
                    <div>
                      <strong>Metadados inacessíveis ou malformados</strong>
                      <p>Não foi possível carregar a configuração .well-known no endpoint fornecido.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 4: DOMÍNIOS CORPORATIVOS                           */}
          {/* ======================================================== */}
          {step === 4 && (
            <div className="form-step">
              <h3>Domínios Corporativos Autorizados</h3>
              <p className="muted">
                Cadastre os domínios de e-mail associados à organização. Possuir um domínio válido direciona o usuário para o SSO, mas não concede acesso automaticamente.
              </p>

              <div className="add-domain-bar">
                <input
                  type="text"
                  placeholder="ex: filial-log.com.br"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                />
                <button type="button" className="btn btn-primary" onClick={handleAddDomain}>
                  + Adicionar domínio
                </button>
              </div>

              <div className="table-scroll" style={{ marginTop: 14 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Domínio</th>
                      <th>Situação</th>
                      <th>Método de verificação</th>
                      <th>Verificado em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domains.map((d) => (
                      <tr key={d.domain}>
                        <td><strong>{d.domain}</strong></td>
                        <td>
                          <span className={`status status-${d.status === "verificado" ? "green" : d.status === "pendente" ? "orange" : "red"}`}>
                            {d.status}
                          </span>
                        </td>
                        <td>TXT DNS (_ttax-verify)</td>
                        <td>{d.verifiedAt || "Aguardando verificação"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 5: PROVISIONAMENTO SCIM                             */}
          {/* ======================================================== */}
          {step === 5 && (
            <div className="form-step">
              <h3>Provisionamento Automático de Usuários (SCIM 2.0)</h3>
              <p className="muted">
                Sincronize ciclo de vida de contas diretamente pelo Microsoft Entra ou Okta. Desativações no RH refletem instantaneamente no Portal do Parceiro.
              </p>

              <label className="check" style={{ marginBottom: 14 }}>
                <input
                  type="checkbox"
                  checked={scimEnabled}
                  onChange={(e) => setScimEnabled(e.target.checked)}
                />
                <strong>Habilitar provisionamento automatizado via SCIM v2</strong>
              </label>

              {scimEnabled && (
                <div className="form-grid">
                  <label className="field-label" style={{ gridColumn: "1 / 3" }}>
                    SCIM Base URL
                    <input type="text" value={scimEndpoint} readOnly />
                  </label>
                  <label className="field-label" style={{ gridColumn: "1 / 3" }}>
                    Bearer Token de Autenticação SCIM
                    <input type="text" defaultValue="scim_tok_••••••••••••••••••••••••••••" readOnly />
                  </label>
                  <div className="info">
                    <span>Sincronização de usuários</span>
                    <strong>Ativa (Criação, Atualização, Desativação)</strong>
                  </div>
                  <div className="info">
                    <span>Sincronização de grupos</span>
                    <strong>Ativa para mapeamento de papéis</strong>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 6: POLÍTICAS DE ACESSO E SESSÃO                     */}
          {/* ======================================================== */}
          {step === 6 && (
            <div className="form-step">
              <h3>Políticas de Segurança e Sessão</h3>
              <p className="muted">
                Configurações da organização. Nota: a política do cliente não pode reduzir a segurança mínima obrigatória da TTAX.
              </p>

              <div className="checkbox-features-group">
                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={mfaEnforced}
                    onChange={(e) => setMfaEnforced(e.target.checked)}
                  />
                  <div>
                    <strong>MFA Obrigatório para todos os usuários</strong>
                    <small>Exigir segundo fator para contas locais ou federação sem MFA atestado.</small>
                  </div>
                </label>
                <label className="check-feature">
                  <input
                    type="checkbox"
                    checked={passkeyAdminEnforced}
                    onChange={(e) => setPasskeyAdminEnforced(e.target.checked)}
                  />
                  <div>
                    <strong>Passkey (FIDO2) obrigatória para Administradores</strong>
                    <small>Garante proteção biométrica / chave física contra phishing.</small>
                  </div>
                </label>
              </div>

              <div className="form-grid" style={{ marginTop: 16 }}>
                <label className="field-label">
                  Tempo limite de inatividade da sessão (minutos)
                  <input
                    type="number"
                    value={sessionTimeoutMin}
                    onChange={(e) => setSessionTimeoutMin(Number(e.target.value))}
                  />
                </label>
                <label className="field-label">
                  Dias máximos de inatividade antes de suspensão
                  <input
                    type="number"
                    value={maxInactivityDays}
                    onChange={(e) => setMaxInactivityDays(Number(e.target.value))}
                  />
                </label>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 7: MAPEAMENTO DE GRUPOS EXTERNOS                    */}
          {/* ======================================================== */}
          {step === 7 && (
            <div className="form-step">
              <h3>Mapeamento de Grupos Externos para Perfis Internos</h3>
              <p className="muted">
                Mapeie grupos de segurança do Entra ID/SAML para os perfis e filiais do Portal do Parceiro.
              </p>

              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Grupo no Provedor Externo</th>
                      <th>Perfil Interno TTAX</th>
                      <th>Filiais Permitidas</th>
                      <th>Prioridade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupMappings.map((gm, i) => (
                      <tr key={i}>
                        <td><code>{gm.externalGroup}</code></td>
                        <td><span className="status status-purple">{gm.internalProfile}</span></td>
                        <td>{gm.branches.join(", ")}</td>
                        <td>Alta ({i + 1})</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* ETAPA 8: REVISÃO E ATIVAÇÃO                               */}
          {/* ======================================================== */}
          {step === 8 && (
            <div className="form-step">
              <h3>Revisão e Publicação da Configuração</h3>
              <p className="muted">Confira o resumo antes de aplicar as mudanças na política de autenticação.</p>

              <div className="review-cards">
                <div>
                  <h4>Organização & Provedor</h4>
                  <div className="info"><span>Cliente:</span><strong>{orgName}</strong></div>
                  <div className="info"><span>Método:</span><strong>{authMethod}</strong></div>
                  <div className="info"><span>Ambiente:</span><strong>{environment}</strong></div>
                </div>
                <div>
                  <h4>Segurança & SCIM</h4>
                  <div className="info"><span>MFA:</span><strong>{mfaEnforced ? "Obrigatório" : "Opcional"}</strong></div>
                  <div className="info"><span>Passkey Admin:</span><strong>{passkeyAdminEnforced ? "Exigida" : "Opcional"}</strong></div>
                  <div className="info"><span>SCIM:</span><strong>{scimEnabled ? "Ativo" : "Desativado"}</strong></div>
                </div>
              </div>

              <label className="field-label" style={{ marginTop: 14 }}>
                Justificativa / Motivo da alteração (obrigatório para auditoria) *
                <input
                  type="text"
                  placeholder="Ex: Atualização anual de certificados corporativos e ajuste de timeout..."
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                />
              </label>

              {savedSuccess && (
                <div className="alert-box success" style={{ marginTop: 12 }}>
                  <span>✓ Configuração de autenticação aplicada com sucesso!</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
          >
            {step === 1 ? "Cancelar" : "← Voltar"}
          </button>

          {step < 8 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep(step + 1)}
            >
              Avançar ➔
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => handleSaveFinal(false)}
              >
                Salvar rascunho em Homologação
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSaveFinal(true)}
              >
                Publicar em Produção ➔
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
