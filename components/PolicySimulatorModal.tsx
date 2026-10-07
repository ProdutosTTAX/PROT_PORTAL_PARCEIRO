import React, { useState } from "react";
import {
  ClientSecurityConfig,
  SecurityRuleRecord,
  InternalProfile,
} from "../types/security";

export function PolicySimulatorModal({
  clients,
  rules,
  onClose,
}: {
  clients: ClientSecurityConfig[];
  rules: SecurityRuleRecord[];
  onClose: () => void;
}) {
  const [selectedClient, setSelectedClient] = useState(clients[0]?.name || "TTAX Industrial");
  const [profile, setProfile] = useState<InternalProfile>("OPERADOR_FISCAL");
  const [action, setAction] = useState("AlterarAgendamentoCte");
  const [docType, setDocType] = useState("CT-e");
  const [device, setDevice] = useState("Dispositivo Confiável (macOS)");
  const [authMethod, setAuthMethod] = useState("Conta TTAX com MFA");
  const [timeHour, setTimeHour] = useState("14:30 (Horário Comercial)");

  const [result, setResult] = useState<{
    decision: "permitido" | "negado" | "exige_mfa" | "exige_nova_autenticacao" | "dupla_aprovacao";
    matchedRule: string;
    ruleSource: string;
    priority: string;
    reason: string;
    nextStep: string;
  } | null>(null);

  const handleSimulate = () => {
    // Avaliação simulada baseada na hierarquia e regras
    if (action === "AlterarAgendamentoCte") {
      setResult({
        decision: "exige_nova_autenticacao",
        matchedRule: "SEC-CTE-005 — Exigir nova autenticação (Step-up) para alterar agenda de CT-e",
        ruleSource: "Política Específica do Cliente (TTAX Industrial)",
        priority: "Alta",
        reason: "Alterações operacionais de janela de pátio exigem revalidação biométrica ou senha antes de persistir.",
        nextStep: "Exibir modal de Step-up Authentication no aplicativo antes de salvar.",
      });
      return;
    }

    if (action === "ExportarMassa") {
      setResult({
        decision: "exige_mfa",
        matchedRule: "SEC-EXP-007 — Exigir MFA para exportação em massa",
        ruleSource: "Política Mínima Global TTAX",
        priority: "Média",
        reason: "Exportação de dados pessoais ou fiscais em volume exige verificação de segundo fator recente.",
        nextStep: "Validar se sessão autenticou com TOTP/Passkey nas últimas 2 horas.",
      });
      return;
    }

    if (profile === "CONSULTA" && (action === "Editar" || action === "Adicionar")) {
      setResult({
        decision: "negado",
        matchedRule: "POL-RBAC-001 — Restrição de Perfil Somente Leitura",
        ruleSource: "Política do Perfil (CONSULTA)",
        priority: "Crítica",
        reason: "Usuários com perfil de Consulta não possuem permissão de escrita em documentos fiscais.",
        nextStep: "Bloquear ação no front-end e rejeitar chamada na API Gateway.",
      });
      return;
    }

    // Padrão permitido
    setResult({
      decision: "permitido",
      matchedRule: "POL-DEF-000 — Política Padrão Autoritativa",
      ruleSource: "Governança Multiempresa TTAX",
      priority: "Baixa",
      reason: "Nenhuma regra de bloqueio foi acionada para o contexto e atributos informados.",
      nextStep: "Permitir requisição e registrar evento informativo na trilha de auditoria.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[75%] md:max-w-[760px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">FERRAMENTAS DE SEGURANÇA</span>
            <h2>Simulador de Políticas de Acesso (ABAC / RBAC)</h2>
            <p className="muted">
              Teste o impacto das regras de segurança antes de publicá-las em produção.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          <div className="fiscal-safety-alert" style={{ marginBottom: 16 }}>
            <span className="safety-badge">Hierarquia de Políticas</span>
            <p>
              1. Política Mínima Global TTAX ➔ 2. Política do Cliente ➔ 3. Política do Perfil ➔ 4. Exceção do Usuário. A política do cliente nunca pode reduzir a segurança mínima global.
            </p>
          </div>

          <div className="form-grid">
            <label className="field-label">
              Cliente / Organização
              <select
                className="input-select"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </label>

            <label className="field-label">
              Perfil do Usuário
              <select
                className="input-select"
                value={profile}
                onChange={(e) => setProfile(e.target.value as InternalProfile)}
              >
                <option value="OPERADOR_FISCAL">OPERADOR_FISCAL</option>
                <option value="GESTOR_FISCAL">GESTOR_FISCAL</option>
                <option value="ADMIN_PARCEIRO">ADMIN_PARCEIRO</option>
                <option value="FINANCEIRO">FINANCEIRO</option>
                <option value="CONSULTA">CONSULTA</option>
                <option value="AUDITOR">AUDITOR</option>
              </select>
            </label>

            <label className="field-label">
              Ação Pretendida
              <select
                className="input-select"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                <option value="AlterarAgendamentoCte">Alterar Agendamento de CT-e (Pátio)</option>
                <option value="ExportarMassa">Exportar Documentos em Massa (CSV)</option>
                <option value="Visualizar">Visualizar Documento</option>
                <option value="Adicionar">Adicionar Novo Documento</option>
                <option value="ConciliarFinanceiro">Aprovar Conciliação Financeira</option>
              </select>
            </label>

            <label className="field-label">
              Tipo de Documento
              <select
                className="input-select"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                <option value="CT-e">CT-e (Transporte)</option>
                <option value="NF-e">NF-e (Mercantil)</option>
                <option value="NFS-e">NFS-e (Serviços)</option>
                <option value="MDF-e">MDF-e (Manifesto)</option>
              </select>
            </label>

            <label className="field-label">
              Dispositivo / Contexto
              <select
                className="input-select"
                value={device}
                onChange={(e) => setDevice(e.target.value)}
              >
                <option value="Dispositivo Confiável (macOS)">Dispositivo Confiável (macOS)</option>
                <option value="Dispositivo Não Reconhecido (Windows)">Dispositivo Não Reconhecido (Windows)</option>
                <option value="Mobile Safari (iOS)">Mobile Safari (iOS)</option>
              </select>
            </label>

            <label className="field-label">
              Método de Autenticação Utilizado
              <select
                className="input-select"
                value={authMethod}
                onChange={(e) => setAuthMethod(e.target.value)}
              >
                <option value="Microsoft Entra ID (OIDC)">Microsoft Entra ID (OIDC)</option>
                <option value="SAML 2.0 Corporativo">SAML 2.0 Corporativo</option>
                <option value="Conta TTAX com MFA">Conta TTAX com MFA</option>
                <option value="Passkey FIDO2">Passkey FIDO2</option>
              </select>
            </label>
          </div>

          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSimulate}
            >
              ▶ Simular Decisão de Acesso
            </button>
          </div>

          {/* RESULTADO VISUAL DA SIMULAÇÃO */}
          {result && (
            <div className="sim-result-box" style={{ marginTop: 18 }}>
              <div className="sim-result-header">
                <div>
                  <span className="eyebrow">DECISÃO DO MOTOR DE POLÍTICAS</span>
                  <h3 style={{ textTransform: "uppercase" }}>
                    {result.decision === "permitido" && <span style={{ color: "var(--green)" }}>✓ Acesso Permitido</span>}
                    {result.decision === "negado" && <span style={{ color: "var(--red)" }}>⛔ Acesso Negado</span>}
                    {result.decision === "exige_mfa" && <span style={{ color: "var(--blue)" }}>🛡️ Exige Segundo Fator (MFA)</span>}
                    {result.decision === "exige_nova_autenticacao" && <span style={{ color: "var(--orange)" }}>⚠️ Exige Nova Autenticação (Step-up)</span>}
                  </h3>
                </div>
                <span className={`status status-${result.decision === "permitido" ? "green" : result.decision === "negado" ? "red" : "orange"}`}>
                  Prioridade: {result.priority}
                </span>
              </div>

              <div className="summary-grid" style={{ marginTop: 12 }}>
                <div className="info">
                  <span>Regra Aplicada</span>
                  <strong>{result.matchedRule}</strong>
                </div>
                <div className="info">
                  <span>Origem da Regra</span>
                  <strong>{result.ruleSource}</strong>
                </div>
                <div className="info" style={{ gridColumn: "1 / 3" }}>
                  <span>Motivação / Condição</span>
                  <p style={{ margin: 0, fontSize: 13, color: "#334155" }}>{result.reason}</p>
                </div>
                <div className="info" style={{ gridColumn: "1 / 3" }}>
                  <span>Ação de Aplicação do Sistema</span>
                  <strong>{result.nextStep}</strong>
                </div>
              </div>
            </div>
          )}
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
