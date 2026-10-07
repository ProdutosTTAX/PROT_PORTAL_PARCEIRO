import React, { useState } from "react";
import {
  SecurityUserRecord,
  InternalProfile,
  ClientSecurityConfig,
} from "../types/security";

export function InviteUserModal({
  clients,
  onClose,
  onSendInvite,
}: {
  clients: ClientSecurityConfig[];
  onClose: () => void;
  onSendInvite: (newUser: SecurityUserRecord) => void;
}) {
  const [step, setStep] = useState(1);

  // Etapa 1: Dados do usuário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("Controladoria Fiscal");

  // Etapa 2: Empresa e filiais
  const [selectedClient, setSelectedClient] = useState(clients[0]?.name || "TTAX Industrial");
  const [branches, setBranches] = useState<string[]>(["SP01", "RJ02"]);

  // Etapa 3: Perfil
  const [profile, setProfile] = useState<InternalProfile>("OPERADOR_FISCAL");

  // Etapa 4: Documentos
  const [allowedDocs, setAllowedDocs] = useState<string[]>(["NF-e", "NFS-e", "CT-e"]);

  // Etapa 5: Ações permitidas
  const [allowedActions, setAllowedActions] = useState<string[]>([
    "Visualizar",
    "Adicionar Documento",
    "Agendar CT-e",
  ]);

  // Etapa 6: Responsável
  const [responsibleName, setResponsibleName] = useState("Carlos Silveira (Admin)");
  const [responsibleEmail, setResponsibleEmail] = useState("carlos.silveira@ttax.com.br");

  // Etapa 7: Validade
  const [validityDays, setValidityDays] = useState(90);

  const steps = [
    "1. Dados",
    "2. Empresa/Filiais",
    "3. Perfil",
    "4. Documentos",
    "5. Ações",
    "6. Responsável",
    "7. Validade",
    "8. Revisão & Envio",
  ];

  const handleToggleBranch = (b: string) => {
    setBranches((prev) => (prev.includes(b) ? prev.filter((item) => item !== b) : [...prev, b]));
  };

  const handleToggleDoc = (d: string) => {
    setAllowedDocs((prev) => (prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d]));
  };

  const handleSend = () => {
    const newUser: SecurityUserRecord = {
      id: `usr-${Date.now()}`,
      name: name || "Novo Parceiro",
      email: email || "usuario@parceiro.com.br",
      companyId: "cli-1",
      companyName: selectedClient,
      profile,
      authMethod: "invite_temp",
      mfaConfigured: false,
      passkeyCount: 0,
      responsibleName,
      responsibleEmail,
      branches,
      allowedDocuments: allowedDocs,
      allowedActions,
      lastLogin: "Nunca acessou",
      validUntil: `Em ${validityDays} dias`,
      status: "convite_enviado",
      alerts: ["Convite pendente de ativação", "Link expira em 48h"],
      department,
    };

    onSendInvite(newUser);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex justify-end animate-fadeIn" onMouseDown={onClose}>
      <aside
        className="w-full sm:w-[75%] md:max-w-[760px] h-full bg-white shadow-2xl flex flex-col justify-between overflow-hidden relative"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <div>
            <span className="eyebrow">ADMINISTRAÇÃO · CONVITE SEGURO</span>
            <h2>Convidar Novo Usuário ao Portal</h2>
            <p className="muted">
              Criação de link de acesso temporário, individual e com escopo limitado por perfil e filial.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
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
          {/* PASSO 1: DADOS DO USUÁRIO */}
          {step === 1 && (
            <div className="form-step">
              <h3>1. Dados Pessoais e Corporativos Mínimos</h3>
              <p className="muted">Informe os dados cadastrais da pessoa que receberá o convite.</p>
              <div className="form-grid">
                <label className="field-label">
                  Nome completo *
                  <input
                    type="text"
                    placeholder="Ex: João da Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  E-mail corporativo *
                  <input
                    type="email"
                    placeholder="joao.silva@parceiro.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  Área / Departamento
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* PASSO 2: EMPRESA E FILIAIS */}
          {step === 2 && (
            <div className="form-step">
              <h3>2. Empresa e Filiais Vinculadas</h3>
              <p className="muted">Selecione para qual cliente da TTAX o usuário prestará serviços.</p>
              <label className="field-label">
                Empresa Contratante / Parceira *
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

              <div style={{ marginTop: 14 }}>
                <span className="field-label">Filiais Autorizadas:</span>
                <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
                  {["SP01 (Matriz)", "SP03 (Fábrica)", "RJ02 (CD)", "MG01 (Log)", "PR01 (Sul)"].map((b) => (
                    <label key={b} className="check">
                      <input
                        type="checkbox"
                        checked={branches.some((x) => b.includes(x))}
                        onChange={() => handleToggleBranch(b.split(" ")[0])}
                      />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3: PERFIL DE ACESSO */}
          {step === 3 && (
            <div className="form-step">
              <h3>3. Perfil de Acesso Interno</h3>
              <p className="muted">Escolha a função e alçada atribuída ao usuário.</p>
              <div className="auth-method-cards-grid">
                {[
                  { id: "ADMIN_PARCEIRO", name: "ADMIN_PARCEIRO", desc: "Gestão de usuários da própria empresa, emissão e aprovação local" },
                  { id: "GESTOR_FISCAL", name: "GESTOR_FISCAL", desc: "Aprovação de alçadas, conciliação e tratamento de exceções" },
                  { id: "OPERADOR_FISCAL", name: "OPERADOR_FISCAL", desc: "Adição de documentos, agendamento de CT-e e acompanhamento" },
                  { id: "FINANCEIRO", name: "FINANCEIRO", desc: "Visualização de pagamentos, retenções e partidas abertas" },
                  { id: "AUDITOR", name: "AUDITOR", desc: "Consulta a relatórios, conformidade fiscal e trilha de logs" },
                  { id: "CONSULTA", name: "CONSULTA", desc: "Apenas leitura sem permissão para alterações" },
                ].map((p) => (
                  <div
                    key={p.id}
                    className={`method-select-card ${profile === p.id ? "selected" : ""}`}
                    onClick={() => setProfile(p.id as InternalProfile)}
                  >
                    <strong>{p.name}</strong>
                    <small>{p.desc}</small>
                  </div>
                ))}
              </div>

              <div className="alert-box warning" style={{ marginTop: 14 }}>
                <p>
                  Nota de Segurança: O perfil <code>INTEGRACAO_SAP</code> é restrito a identidades técnicas e nunca deve ser concedido a uma pessoa física.
                </p>
              </div>
            </div>
          )}

          {/* PASSO 4: DOCUMENTOS PERMITIDOS */}
          {step === 4 && (
            <div className="form-step">
              <h3>4. Documentos Permitidos</h3>
              <p className="muted">Marque quais modelos fiscais e logísticos o usuário poderá visualizar.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {["NF-e (Mercantil)", "NFS-e (Serviços)", "CT-e (Transporte)", "MDF-e (Manifesto)", "CIOT", "ND (Despesas)"].map((doc) => {
                  const tag = doc.split(" ")[0];
                  return (
                    <label key={doc} className="check-feature" style={{ background: "#f8fafc", padding: 10, borderRadius: 8 }}>
                      <input
                        type="checkbox"
                        checked={allowedDocs.includes(tag)}
                        onChange={() => handleToggleDoc(tag)}
                      />
                      <span><strong>{doc}</strong></span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* PASSO 5: AÇÕES PERMITIDAS */}
          {step === 5 && (
            <div className="form-step">
              <h3>5. Ações Autorizadas</h3>
              <p className="muted">Defina as operações que o usuário poderá executar.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {["Visualizar documentos", "Adicionar novo documento", "Agendar e reagendar CT-e", "Aprovar divergências fiscais", "Exportar relatórios CSV", "Gerenciar usuários da empresa"].map((act) => (
                  <label key={act} className="check">
                    <input
                      type="checkbox"
                      checked={allowedActions.includes(act.split(" ")[0]) || allowedActions.some((x) => act.includes(x))}
                      onChange={() => {
                        const word = act.split(" ")[0];
                        setAllowedActions((prev) => prev.includes(word) ? prev.filter((a) => a !== word) : [...prev, word]);
                      }}
                    />
                    <span>{act}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 6: RESPONSÁVEL PELO ACESSO */}
          {step === 6 && (
            <div className="form-step">
              <h3>6. Responsável Formal pelo Acesso</h3>
              <p className="muted">
                Todo acesso concedido a terceiros exige um padrinho/gestor interno responsável pela auditoria.
              </p>
              <div className="form-grid">
                <label className="field-label">
                  Nome do Gestor Responsável *
                  <input
                    type="text"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  E-mail corporativo do responsável *
                  <input
                    type="email"
                    value={responsibleEmail}
                    onChange={(e) => setResponsibleEmail(e.target.value)}
                  />
                </label>
              </div>
            </div>
          )}

          {/* PASSO 7: VALIDADE E EXPIRAÇÃO */}
          {step === 7 && (
            <div className="form-step">
              <h3>7. Validade do Acesso</h3>
              <p className="muted">
                Conforme a política SEC-EXP-003, nenhum acesso é permanente sem revisão periódica.
              </p>
              <div className="radio-pills">
                {[30, 60, 90, 180].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`pill ${validityDays === d ? "active" : ""}`}
                    onClick={() => setValidityDays(d)}
                  >
                    {d} dias
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASSO 8: REVISÃO E ENVIO */}
          {step === 8 && (
            <div className="form-step">
              <h3>8. Revisão do Convite antes do Envio</h3>
              <p className="muted">Confira os dados do convite. O link será gerado com uso único e validade de 48h.</p>
              <div className="review-cards">
                <div>
                  <h4>Usuário & Empresa</h4>
                  <div className="info"><span>Nome:</span><strong>{name || "Novo Usuário"}</strong></div>
                  <div className="info"><span>E-mail:</span><strong>{email || "usuario@empresa.com.br"}</strong></div>
                  <div className="info"><span>Empresa:</span><strong>{selectedClient}</strong></div>
                  <div className="info"><span>Perfil:</span><strong>{profile}</strong></div>
                </div>
                <div>
                  <h4>Governança</h4>
                  <div className="info"><span>Responsável:</span><strong>{responsibleName}</strong></div>
                  <div className="info"><span>Validade:</span><strong>{validityDays} dias</strong></div>
                  <div className="info"><span>Filiais:</span><strong>{branches.join(", ")}</strong></div>
                </div>
              </div>
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
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSend}
            >
              Enviar convite seguro por e-mail ➔
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
