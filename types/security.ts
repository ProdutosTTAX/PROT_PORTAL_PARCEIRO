// Definições de tipos e dados fictícios para o módulo de Segurança, Identidades e Controle de Acesso Multiempresa

export type AuthMethodType =
  | "entra_id"
  | "saml"
  | "oidc"
  | "ttax_account"
  | "invite_temp";

export type AdminSecurityRole =
  | "TTAX Master"
  | "TTAX Segurança"
  | "Administrador do parceiro";

export type SecurityAlertSeverity = "crítico" | "alto" | "médio" | "informativo";

export type UserSecurityStatus =
  | "ativo"
  | "pendente_aprovacao"
  | "convite_enviado"
  | "aguardando_mfa"
  | "suspenso"
  | "expirado"
  | "revogado"
  | "falha_provisionamento";

export type InternalProfile =
  | "ADMIN_PARCEIRO"
  | "GESTOR_FISCAL"
  | "OPERADOR_FISCAL"
  | "FINANCEIRO"
  | "AUDITOR"
  | "CONSULTA"
  | "INTEGRACAO_SAP";

export interface ClientSecurityConfig {
  id: string;
  name: string;
  cnpjMasked: string;
  logoUrl?: string;
  authMethod: AuthMethodType;
  providerName: string;
  domains: { domain: string; status: "verificado" | "pendente" | "rejeitado" | "suspenso"; verifiedAt?: string }[];
  scimEnabled: boolean;
  scimStatus?: "sincronizado" | "falha" | "desativado";
  mfaEnforced: boolean;
  passkeyAdminEnforced: boolean;
  sessionTimeoutMin: number;
  maxSessionHours: number;
  defaultValidityDays: number;
  maxInactivityDays: number;
  activeUsersCount: number;
  pendingReviewsCount: number;
  configStatus: "completa" | "incompleta" | "em_homologacao" | "atencao";
  lastModified: string;
  groupMappings: { externalGroup: string; internalProfile: InternalProfile; branches: string[] }[];
  // Detalhes técnicos mascarados
  technicalDetails?: {
    issuer: string;
    tenantId?: string;
    clientId: string;
    clientSecretMasked?: string;
    metadataUrl?: string;
    redirectUri: string;
    certExpiry?: string;
    scimEndpoint?: string;
    scimTokenMasked?: string;
  };
}

export interface SecuritySession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  clientName: string;
  browser: string;
  os: string;
  location: string;
  ipMasked: string;
  authMethod: string;
  startedAt: string;
  lastActivity: string;
  risk: "baixo" | "médio" | "alto" | "crítico";
  isCurrent: boolean;
  trusted: boolean;
  status: "ativa" | "encerrada" | "bloqueada";
}

export interface SecurityUserRecord {
  id: string;
  name: string;
  email: string;
  companyId: string;
  companyName: string;
  profile: InternalProfile;
  authMethod: AuthMethodType;
  mfaConfigured: boolean;
  passkeyCount: number;
  responsibleName: string;
  responsibleEmail: string;
  branches: string[];
  allowedDocuments: string[];
  allowedActions: string[];
  lastLogin: string;
  validUntil: string;
  status: UserSecurityStatus;
  alerts?: string[];
  department?: string;
  phone?: string;
  externalId?: string;
}

export interface SecurityRuleRecord {
  id: string;
  code: string;
  name: string;
  clientId: string;
  clientName: string;
  scope: "Global (TTAX)" | "Cliente" | "Perfil" | "Exceção Usuário";
  condition: string;
  action: string;
  priority: "Crítica" | "Alta" | "Média" | "Baixa";
  version: string;
  validity: string;
  status: "ativa" | "em_teste" | "desativada";
  author: string;
  description: string;
}

export interface TechnicalIdentityRecord {
  id: string;
  name: string;
  clientName: string;
  system: "SAP S/4HANA" | "SAP ECC" | "EASY4 Gateway" | "Conector Fiscal";
  environment: "Produção" | "Homologação" | "Desenvolvimento";
  authMethod: "mTLS + Client Credentials" | "OAuth 2.0 JWT" | "Certificado Vinculado";
  scopes: string[];
  certThumbprintMasked: string;
  certExpiry: string;
  lastUsed: string;
  lastRotated: string;
  nextRotation: string;
  status: "operacional" | "vencendo" | "expirada" | "suspensa";
}

export interface AccessReviewCampaign {
  id: string;
  title: string;
  clientName: string;
  period: string;
  responsible: string;
  totalUsers: number;
  pendingUsers: number;
  deadline: string;
  daysRemaining: number;
  status: "em_andamento" | "atrasada" | "concluida";
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType:
    | "login_sucesso"
    | "login_negado"
    | "falha_mfa"
    | "recuperacao_acesso"
    | "convite_criado"
    | "convite_utilizado"
    | "usuario_aprovado"
    | "perfil_alterado"
    | "acesso_renovado"
    | "usuario_suspenso"
    | "usuario_revogado"
    | "sessao_encerrada"
    | "sso_configurado"
    | "scim_sincronizado"
    | "regra_criada"
    | "identidade_sap_utilizada"
    | "credencial_rotacionada";
  eventLabel: string;
  targetUser: string;
  executor: string;
  companyName: string;
  ipMasked: string;
  device: string;
  origin: string;
  result: "sucesso" | "alerta" | "falha" | "bloqueado";
  reason?: string;
  details?: Record<string, any>;
  beforeAfter?: { before: string; after: string };
}

// CLIENTES FICTÍCIOS OBRIGATÓRIOS CONFORME ESPECIFICAÇÃO
export const INITIAL_CLIENTS_SECURITY: ClientSecurityConfig[] = [
  {
    id: "cli-1",
    name: "TTAX Industrial",
    cnpjMasked: "98.765.432/0001-**",
    authMethod: "entra_id",
    providerName: "Microsoft Entra ID (OIDC)",
    domains: [
      { domain: "empresa.com", status: "verificado", verifiedAt: "12/01/2025" },
      { domain: "ttaxholding.com.br", status: "verificado", verifiedAt: "18/02/2025" },
    ],
    scimEnabled: true,
    scimStatus: "sincronizado",
    mfaEnforced: true,
    passkeyAdminEnforced: true,
    sessionTimeoutMin: 15,
    maxSessionHours: 8,
    defaultValidityDays: 180,
    maxInactivityDays: 45,
    activeUsersCount: 142,
    pendingReviewsCount: 0,
    configStatus: "completa",
    lastModified: "Hoje, 09:20 por Carlos Silveira (TTAX Master)",
    groupMappings: [
      { externalGroup: "Fiscal-Gestores-Entra", internalProfile: "GESTOR_FISCAL", branches: ["SP01", "RJ02", "MG01"] },
      { externalGroup: "Fiscal-Operadores-Entra", internalProfile: "OPERADOR_FISCAL", branches: ["SP01"] },
      { externalGroup: "TI-Admins-Entra", internalProfile: "ADMIN_PARCEIRO", branches: ["Todas"] },
    ],
    technicalDetails: {
      issuer: "https://login.microsoftonline.com/9b23-ttax-entra/v2.0",
      tenantId: "89a1c24e-****-****-****-a14890123ef1",
      clientId: "ttax-portal-client-prd",
      clientSecretMasked: "••••••••••••••••••••",
      metadataUrl: "https://login.microsoftonline.com/common/.well-known/openid-configuration",
      redirectUri: "https://parceiro.ttax.com.br/auth/callback",
      certExpiry: "14/11/2026",
      scimEndpoint: "https://api.ttax.corp/scim/v2/TTAX_IND",
      scimTokenMasked: "scim_tok_••••••••••••",
    },
  },
  {
    id: "cli-2",
    name: "Transportadora Horizonte",
    cnpjMasked: "23.456.789/0001-**",
    authMethod: "saml",
    providerName: "Okta / SAML 2.0 Corporativo",
    domains: [
      { domain: "transphorizonte.com.br", status: "verificado", verifiedAt: "04/03/2025" },
      { domain: "horizonte-log.com.br", status: "pendente" },
    ],
    scimEnabled: false,
    scimStatus: "desativado",
    mfaEnforced: true,
    passkeyAdminEnforced: false,
    sessionTimeoutMin: 30,
    maxSessionHours: 12,
    defaultValidityDays: 90,
    maxInactivityDays: 30,
    activeUsersCount: 48,
    pendingReviewsCount: 3,
    configStatus: "atencao",
    lastModified: "12/06/2025 por Rafael Lima",
    groupMappings: [
      { externalGroup: "Horizonte-Transporte-SAML", internalProfile: "OPERADOR_FISCAL", branches: ["PR01", "SP01"] },
      { externalGroup: "Horizonte-Diretoria", internalProfile: "GESTOR_FISCAL", branches: ["Todas"] },
    ],
    technicalDetails: {
      issuer: "https://horizonte.okta.com/app/ttax_saml/sso/saml",
      clientId: "horizonte-okta-sp",
      clientSecretMasked: "••••••••••••••••",
      redirectUri: "https://parceiro.ttax.com.br/auth/saml/consume",
      certExpiry: "28/07/2025 (vence em 22 dias)",
    },
  },
  {
    id: "cli-3",
    name: "Logística Vale",
    cnpjMasked: "34.567.890/0001-**",
    authMethod: "ttax_account",
    providerName: "Conta TTAX com MFA Obrigatório",
    domains: [
      { domain: "logisticavale.com.br", status: "verificado", verifiedAt: "19/04/2025" },
    ],
    scimEnabled: false,
    mfaEnforced: true,
    passkeyAdminEnforced: true,
    sessionTimeoutMin: 20,
    maxSessionHours: 8,
    defaultValidityDays: 120,
    maxInactivityDays: 60,
    activeUsersCount: 29,
    pendingReviewsCount: 0,
    configStatus: "completa",
    lastModified: "15/06/2025 por Carla Mendes",
    groupMappings: [],
  },
  {
    id: "cli-4",
    name: "Auditoria Delta",
    cnpjMasked: "45.678.901/0001-**",
    authMethod: "invite_temp",
    providerName: "Acesso Temporário por Convite (30 dias)",
    domains: [
      { domain: "auditoriadelta.com.br", status: "verificado", verifiedAt: "01/06/2025" },
    ],
    scimEnabled: false,
    mfaEnforced: true,
    passkeyAdminEnforced: false,
    sessionTimeoutMin: 15,
    maxSessionHours: 4,
    defaultValidityDays: 30,
    maxInactivityDays: 15,
    activeUsersCount: 6,
    pendingReviewsCount: 1,
    configStatus: "em_homologacao",
    lastModified: "Ontem por Carlos Silveira",
    groupMappings: [
      { externalGroup: "Auditores-Externos", internalProfile: "AUDITOR", branches: ["Todas"] },
    ],
  },
];

// REGRAS DE SEGURANÇA SEPARADAS DAS REGRAS FISCAIS
export const INITIAL_SECURITY_RULES: SecurityRuleRecord[] = [
  {
    id: "sec-1",
    code: "SEC-MFA-001",
    name: "Exigir MFA para todos os usuários",
    clientId: "global",
    clientName: "Todas as organizações (TTAX Global)",
    scope: "Global (TTAX)",
    condition: "Autenticação por Conta Local ou Convite",
    action: "Bloquear acesso sem TOTP ou Passkey configurado",
    priority: "Crítica",
    version: "2.4",
    validity: "Permanente",
    status: "ativa",
    author: "Carlos Silveira (TTAX Master)",
    description: "Nenhum usuário externo pode acessar dados fiscais ou logísticos sem segundo fator ativo.",
  },
  {
    id: "sec-2",
    code: "SEC-ADM-002",
    name: "Exigir passkey (FIDO2) para administradores",
    clientId: "global",
    clientName: "Todas as organizações (TTAX Global)",
    scope: "Perfil",
    condition: "Perfil in ['ADMIN_PARCEIRO', 'GESTOR_FISCAL']",
    action: "Exigir chave física ou biometria FIDO2/WebAuthn",
    priority: "Crítica",
    version: "1.8",
    validity: "Permanente",
    status: "ativa",
    author: "TTAX Segurança",
    description: "Alçadas privilegiadas exigem credencial resistente a phishing.",
  },
  {
    id: "sec-3",
    code: "SEC-EXP-003",
    name: "Suspender automaticamente acesso expirado",
    clientId: "global",
    clientName: "Todas as organizações (TTAX Global)",
    scope: "Global (TTAX)",
    condition: "DataAtual > DataValidadeAcesso",
    action: "Revogar sessões ativas e mudar status para 'Expirado'",
    priority: "Alta",
    version: "1.0",
    validity: "Permanente",
    status: "ativa",
    author: "Sistema Automático",
    description: "Vínculos não renovados na campanha de revisão perdem acesso imediatamente.",
  },
  {
    id: "sec-4",
    code: "SEC-CTE-005",
    name: "Exigir nova autenticação (Step-up) para alterar agenda de CT-e",
    clientId: "cli-1",
    clientName: "TTAX Industrial",
    scope: "Cliente",
    condition: "Ação == 'AlterarAgendamentoCte' ou 'AgendamentoLote'",
    action: "Solicitar revalidação biométrica ou senha antes de persistir",
    priority: "Alta",
    version: "1.2",
    validity: "Permanente",
    status: "ativa",
    author: "Carla Mendes",
    description: "Proteção contra alteração indevida de janelas de descarga e docas.",
  },
  {
    id: "sec-5",
    code: "SEC-PAG-006",
    name: "Exigir dupla aprovação para conciliação financeira",
    clientId: "cli-1",
    clientName: "TTAX Industrial",
    scope: "Cliente",
    condition: "ValorDivergencia > R$ 5.000,00",
    action: "Bloquear pagamento e encaminhar para segundo autorizador",
    priority: "Crítica",
    version: "2.1",
    validity: "Permanente",
    status: "ativa",
    author: "Diretoria Financeira",
    description: "Evita desvios e erros em baixas manuais.",
  },
  {
    id: "sec-6",
    code: "SEC-EXP-007",
    name: "Exigir MFA para exportação de dados em massa (CSV)",
    clientId: "global",
    clientName: "Todas as organizações (TTAX Global)",
    scope: "Global (TTAX)",
    condition: "Ação == 'ExportarRelatorio' && Linhas > 50",
    action: "Verificar se sessão possui MFA ativo nas últimas 2 horas",
    priority: "Média",
    version: "1.0",
    validity: "Permanente",
    status: "ativa",
    author: "TTAX Segurança",
    description: "Conformidade LGPD contra exfiltração desautorizada.",
  },
  {
    id: "sec-7",
    code: "SEC-SAP-008",
    name: "Bloquear identidade técnica com certificado vencido",
    clientId: "global",
    clientName: "Todas as organizações (TTAX Global)",
    scope: "Global (TTAX)",
    condition: "CertificadoVencido == true || CRL == revogado",
    action: "Rejeitar handshake mTLS e abrir incidente com severidade Crítica",
    priority: "Crítica",
    version: "3.0",
    validity: "Permanente",
    status: "ativa",
    author: "Sistema Conector",
    description: "Garante integridade de endpoints de integração SAP S/4HANA e ECC.",
  },
];

// USUÁRIOS E PERMISSÕES DETALHADOS
export const INITIAL_SECURITY_USERS: SecurityUserRecord[] = [
  {
    id: "usr-1",
    name: "Carlos Silveira",
    email: "carlos.silveira@ttax.com.br",
    companyId: "cli-1",
    companyName: "TTAX Industrial",
    profile: "ADMIN_PARCEIRO",
    authMethod: "entra_id",
    mfaConfigured: true,
    passkeyCount: 2,
    responsibleName: "Diretoria Corporativa TTAX",
    responsibleEmail: "diretoria@ttax.com.br",
    branches: ["Todas (Global)"],
    allowedDocuments: ["NF-e", "NFS-e", "CT-e", "MDF-e", "CIOT"],
    allowedActions: ["Visualizar", "Editar", "Aprovar", "Convidar", "Revogar", "Configurar SSO"],
    lastLogin: "Hoje, 11:10 (Chrome / macOS)",
    validUntil: "31/12/2026",
    status: "ativo",
    alerts: [],
    department: "Tecnologia & Segurança",
    phone: "+55 11 98765-4321",
    externalId: "entra-usr-048912",
  },
  {
    id: "usr-2",
    name: "Carla Mendes",
    email: "carla.mendes@ttax.com.br",
    companyId: "cli-1",
    companyName: "TTAX Industrial",
    profile: "GESTOR_FISCAL",
    authMethod: "entra_id",
    mfaConfigured: true,
    passkeyCount: 1,
    responsibleName: "Carlos Silveira",
    responsibleEmail: "carlos.silveira@ttax.com.br",
    branches: ["SP01", "RJ02"],
    allowedDocuments: ["NFS-e", "NF-e", "CT-e"],
    allowedActions: ["Visualizar", "Aprovar Alçada 2", "Conciliar", "Exportar"],
    lastLogin: "Hoje, 10:45 (Edge / Windows)",
    validUntil: "18/10/2025",
    status: "ativo",
    alerts: [],
    department: "Controladoria Fiscal",
    phone: "+55 11 97112-3344",
  },
  {
    id: "usr-3",
    name: "Roberto Silveira Santos",
    email: "roberto.santos@transphorizonte.com.br",
    companyId: "cli-2",
    companyName: "Transportadora Horizonte",
    profile: "OPERADOR_FISCAL",
    authMethod: "saml",
    mfaConfigured: true,
    passkeyCount: 0,
    responsibleName: "Gerência Horizonte (SAML)",
    responsibleEmail: "gestao@transphorizonte.com.br",
    branches: ["PR01", "SP01"],
    allowedDocuments: ["CT-e", "MDF-e", "CIOT"],
    allowedActions: ["Visualizar", "Agendar Carga", "Reagendar", "Emitir"],
    lastLogin: "Hoje, 09:18 (Safari / iOS)",
    validUntil: "15/07/2025 (vence em 9 dias)",
    status: "ativo",
    alerts: ["Revisão de acesso pendente", "Certificado SAML da empresa vencendo"],
    department: "Logística & Cargas",
  },
  {
    id: "usr-4",
    name: "Usuário exemplo",
    email: "usuario@empresa.com",
    companyId: "cli-3",
    companyName: "Logística Vale",
    profile: "ADMIN_PARCEIRO",
    authMethod: "ttax_account",
    mfaConfigured: true,
    passkeyCount: 1,
    responsibleName: "Responsável exemplo (TTAX)",
    responsibleEmail: "usuario@empresa.com",
    branches: ["SP01"],
    allowedDocuments: ["NFS-e", "NF-e"],
    allowedActions: ["Emitir", "Adicionar Documento", "Gerenciar Usuários Parceiro"],
    lastLogin: "Hoje, 10:42 (Chrome / macOS)",
    validUntil: "24/11/2025",
    status: "ativo",
    alerts: [],
    department: "Operações Externas",
  },
  {
    id: "usr-5",
    name: "Auditor exemplo",
    email: "auditor@empresa.com",
    companyId: "cli-4",
    companyName: "Auditoria Delta",
    profile: "AUDITOR",
    authMethod: "invite_temp",
    mfaConfigured: false,
    passkeyCount: 0,
    responsibleName: "Gestor exemplo",
    responsibleEmail: "usuario@empresa.com",
    branches: ["Todas (Somente leitura)"],
    allowedDocuments: ["Todos os modelos"],
    allowedActions: ["Visualizar", "Consultar Logs", "Exportar Relatório Auditoria"],
    lastLogin: "Nunca acessou",
    validUntil: "01/07/2025 (Expira em 25 dias)",
    status: "aguardando_mfa",
    alerts: ["MFA pendente de ativação", "Acesso temporário de 30 dias"],
    department: "Auditoria Externa 2025",
  },
  {
    id: "usr-6",
    name: "Lucas Mendonça",
    email: "lucas.mendonca@fornecedorexterno.com.br",
    companyId: "cli-1",
    companyName: "TTAX Industrial",
    profile: "CONSULTA",
    authMethod: "ttax_account",
    mfaConfigured: false,
    passkeyCount: 0,
    responsibleName: "Carla Mendes",
    responsibleEmail: "carla.mendes@ttax.com.br",
    branches: ["SP03"],
    allowedDocuments: ["NF-e"],
    allowedActions: ["Visualizar apenas"],
    lastLogin: "Há 48 dias",
    validUntil: "10/06/2025 (Vencido)",
    status: "suspenso",
    alerts: ["Inativo há mais de 45 dias", "Acesso suspenso por SEC-IDL-004"],
    department: "Manutenção Tercerizada",
  },
];

// IDENTIDADES TÉCNICAS E SAP SEPARADAS DE USUÁRIOS HUMANOS
export const INITIAL_TECHNICAL_IDENTITIES: TechnicalIdentityRecord[] = [
  {
    id: "tec-1",
    name: "SAP_S4HANA_PRD_RFC",
    clientName: "TTAX Industrial",
    system: "SAP S/4HANA",
    environment: "Produção",
    authMethod: "mTLS + Client Credentials",
    scopes: ["documents:create", "documents:read", "schedules:update", "financial:post"],
    certThumbprintMasked: "4A:9B:••:••:••:E2:10",
    certExpiry: "18/12/2025 (Válido)",
    lastUsed: "Hoje, 11:32:01",
    lastRotated: "18/12/2024",
    nextRotation: "18/11/2025",
    status: "operacional",
  },
  {
    id: "tec-2",
    name: "SAP_ECC_HOM_CONNECTOR",
    clientName: "TTAX Industrial",
    system: "SAP ECC",
    environment: "Homologação",
    authMethod: "mTLS + Client Credentials",
    scopes: ["documents:read", "events:read"],
    certThumbprintMasked: "88:1C:••:••:••:09:44",
    certExpiry: "15/07/2025 (Vence em 18 dias)",
    lastUsed: "Ontem, 17:45:20",
    lastRotated: "15/07/2024",
    nextRotation: "01/07/2025",
    status: "vencendo",
  },
  {
    id: "tec-3",
    name: "EASY4_TAX_GATEWAY_WEBHOOK",
    clientName: "TTAX Global",
    system: "EASY4 Gateway",
    environment: "Produção",
    authMethod: "OAuth 2.0 JWT",
    scopes: ["webhooks:manage", "events:read", "documents:create"],
    certThumbprintMasked: "F1:2A:••:••:••:77:88",
    certExpiry: "30/09/2026",
    lastUsed: "Hoje, 11:28:15",
    lastRotated: "30/09/2024",
    nextRotation: "30/08/2026",
    status: "operacional",
  },
];

// SESSÕES ATIVAS
export const INITIAL_SECURITY_SESSIONS: SecuritySession[] = [
  {
    id: "ses-1",
    userId: "usr-1",
    userName: "Carlos Silveira",
    userEmail: "carlos.silveira@ttax.com.br",
    clientName: "TTAX Industrial",
    browser: "Google Chrome 126.0",
    os: "macOS Sonoma 14.5",
    location: "São Paulo, SP · Brasil",
    ipMasked: "177.18.90.***",
    authMethod: "Microsoft Entra ID + FIDO2 Passkey",
    startedAt: "Hoje, 08:30",
    lastActivity: "Hoje, 11:34 (Ativa agora)",
    risk: "baixo",
    isCurrent: true,
    trusted: true,
    status: "ativa",
  },
  {
    id: "ses-2",
    userId: "usr-4",
    userName: "Usuário exemplo",
    userEmail: "usuario@empresa.com",
    clientName: "Logística Vale",
    browser: "Google Chrome 125.0",
    os: "Windows 11 Pro",
    location: "Curitiba, PR · Brasil",
    ipMasked: "189.44.120.***",
    authMethod: "Conta TTAX + TOTP 6 dígitos",
    startedAt: "Hoje, 09:12",
    lastActivity: "Hoje, 10:42",
    risk: "baixo",
    isCurrent: false,
    trusted: true,
    status: "ativa",
  },
  {
    id: "ses-3",
    userId: "usr-3",
    userName: "Roberto Silveira Santos",
    userEmail: "roberto.santos@transphorizonte.com.br",
    clientName: "Transportadora Horizonte",
    browser: "Mobile Safari 17.4",
    os: "iOS 17.5.1 (iPhone 15)",
    location: "São José dos Pinhais, PR",
    ipMasked: "201.88.14.***",
    authMethod: "SAML 2.0 Okta",
    startedAt: "Hoje, 09:15",
    lastActivity: "Hoje, 09:18",
    risk: "médio",
    isCurrent: false,
    trusted: false,
    status: "ativa",
  },
  {
    id: "ses-4",
    userId: "usr-2",
    userName: "Carla Mendes",
    userEmail: "carla.mendes@ttax.com.br",
    clientName: "TTAX Industrial",
    browser: "Firefox 127.0",
    os: "Linux Ubuntu 24.04",
    location: "Belo Horizonte, MG",
    ipMasked: "179.108.4.***",
    authMethod: "Microsoft Entra ID",
    startedAt: "Ontem, 16:20",
    lastActivity: "Ontem, 18:30",
    risk: "baixo",
    isCurrent: false,
    trusted: true,
    status: "ativa",
  },
];

// AUDITORIA E EVENTOS DE SEGURANÇA
export const INITIAL_SECURITY_EVENTS: SecurityAuditEvent[] = [
  {
    id: "evt-101",
    timestamp: "Hoje, 11:32:01",
    eventType: "identidade_sap_utilizada",
    eventLabel: "Comunicação mTLS SAP autorizada",
    targetUser: "SAP_S4HANA_PRD_RFC",
    executor: "Serviço RFC S/4HANA",
    companyName: "TTAX Industrial",
    ipMasked: "10.240.12.***",
    device: "Servidor SAP PRD",
    origin: "Conector mTLS ERP",
    result: "sucesso",
    details: { lote: "48921", latenciaMs: 248, endpoint: "/sap/opu/odata/ttax/DOC_SYNC" },
  },
  {
    id: "evt-102",
    timestamp: "Hoje, 11:10:45",
    eventType: "regra_criada",
    eventLabel: "Regra de segurança atualizada",
    targetUser: "SEC-MFA-001",
    executor: "Carlos Silveira (TTAX Master)",
    companyName: "TTAX Global",
    ipMasked: "177.18.90.***",
    device: "Chrome / macOS",
    origin: "Painel de Administração",
    result: "sucesso",
    beforeAfter: { before: "Tolerância MFA 24h", after: "MFA Obrigatório a cada sessão" },
  },
  {
    id: "evt-103",
    timestamp: "Hoje, 10:42:09",
    eventType: "falha_mfa",
    eventLabel: "Código TOTP inválido digitado",
    targetUser: "lucas.mendonca@fornecedorexterno.com.br",
    executor: "Tentativa do usuário",
    companyName: "TTAX Industrial",
    ipMasked: "187.12.98.***",
    device: "Firefox / Windows",
    origin: "Página de Login",
    result: "alerta",
    reason: "Código TOTP de 6 dígitos não correspondeu à janela atual (Tentativa 2 de 3)",
  },
  {
    id: "evt-104",
    timestamp: "Hoje, 09:18:22",
    eventType: "login_sucesso",
    eventLabel: "Autenticação federada SAML bem-sucedida",
    targetUser: "roberto.santos@transphorizonte.com.br",
    executor: "Okta IdP Horizonte",
    companyName: "Transportadora Horizonte",
    ipMasked: "201.88.14.***",
    device: "Mobile Safari / iOS",
    origin: "Federação SAML 2.0",
    result: "sucesso",
  },
  {
    id: "evt-105",
    timestamp: "Ontem, 18:02:11",
    eventType: "scim_sincronizado",
    eventLabel: "Sincronização SCIM Entra ID processada",
    targetUser: "Lote SCIM #812",
    executor: "Microsoft Entra Provisioning Service",
    companyName: "TTAX Industrial",
    ipMasked: "20.190.150.***",
    device: "Azure SCIM Agent",
    origin: "API SCIM /Users",
    result: "sucesso",
    details: { criados: 2, atualizados: 5, desativados: 1 },
  },
  {
    id: "evt-106",
    timestamp: "Ontem, 16:45:00",
    eventType: "usuario_suspenso",
    eventLabel: "Usuário suspenso por inatividade",
    targetUser: "lucas.mendonca@fornecedorexterno.com.br",
    executor: "Job Automático SEC-IDL-004",
    companyName: "TTAX Industrial",
    ipMasked: "Internal Worker",
    device: "Batch Engine",
    origin: "Política de Acesso",
    result: "alerta",
    reason: "Sem atividade há 48 dias (limite configurado: 45 dias)",
  },
];

// CAMPANHAS DE REVISÃO PERIÓDICA DE ACESSO
export const INITIAL_ACCESS_REVIEWS: AccessReviewCampaign[] = [
  {
    id: "rev-1",
    title: "Revisão Semestral de Prestadores e Transportadores (Q2 2025)",
    clientName: "TTAX Industrial",
    period: "Junho / 2025",
    responsible: "Carla Mendes",
    totalUsers: 48,
    pendingUsers: 3,
    deadline: "30/06/2025",
    daysRemaining: 12,
    status: "em_andamento",
  },
  {
    id: "rev-2",
    title: "Revisão de Acessos Privilegiados e Administradores",
    clientName: "Transportadora Horizonte",
    period: "Trimestre Atual",
    responsible: "Rafael Lima",
    totalUsers: 14,
    pendingUsers: 4,
    deadline: "20/06/2025",
    daysRemaining: 2,
    status: "atrasada",
  },
  {
    id: "rev-3",
    title: "Auditoria de Contas Temporárias de Terceiros",
    clientName: "Auditoria Delta",
    period: "Mensal",
    responsible: "Carlos Silveira",
    totalUsers: 6,
    pendingUsers: 0,
    deadline: "15/06/2025",
    daysRemaining: 0,
    status: "concluida",
  },
];
