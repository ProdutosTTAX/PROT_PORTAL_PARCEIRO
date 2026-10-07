import React, { useEffect, useRef, useState } from "react";
import logoImg from "./assets/logo.png";
import {
  DocumentRecord,
  DocTypeDefinition,
  INITIAL_DOC_TYPES,
  INITIAL_DOCUMENTS,
} from "./types/documents";
import {
  ClientSecurityConfig,
  SecurityUserRecord,
  SecurityRuleRecord,
  TechnicalIdentityRecord,
  SecuritySession,
  SecurityAuditEvent,
  AccessReviewCampaign,
  AdminSecurityRole,
  INITIAL_CLIENTS_SECURITY,
  INITIAL_SECURITY_USERS,
  INITIAL_SECURITY_RULES,
  INITIAL_TECHNICAL_IDENTITIES,
  INITIAL_SECURITY_SESSIONS,
  INITIAL_SECURITY_EVENTS,
  INITIAL_ACCESS_REVIEWS,
} from "./types/security";

import { DynamicLoginPage } from "./components/DynamicLoginPage";
import { MySecurityModal } from "./components/MySecurityModal";
import { ClientAuthConfigWizard } from "./components/ClientAuthConfigWizard";
import { UserSecurityDrawer } from "./components/UserSecurityDrawer";
import { InviteUserModal } from "./components/InviteUserModal";
import { RevokeUserModal } from "./components/RevokeUserModal";
import { PolicySimulatorModal } from "./components/PolicySimulatorModal";
import { SecurityAdminSection } from "./components/SecurityAdminSection";

import { DocumentsModule } from "./components/DocumentsModule";
import { ScreenToolButtons } from "./components/ScreenToolButtons";
import { UniversalDetailDrawer } from "./components/UniversalDetailDrawer";
import { AddDocumentDrawer } from "./components/AddDocumentDrawer";
import { OperationScreen } from "./components/OperationScreen";
import { PaymentsScreen } from "./components/PaymentsScreen";
import { IntegrationsPanel } from "./components/IntegrationsPanel";
import { ColumnConfigDrawer, FilterDrawer, FilterField } from "./components/ScreenDrawers";
import { RescheduleModal } from "./components/RescheduleModal";
import { ManageDocTypesModal } from "./components/ManageDocTypesModal";
import { DocTypeConfigDrawer } from "./components/DocTypeConfigDrawer";
import { DashboardView } from "./components/DashboardView";
import {
  INITIAL_DOC_TYPES_ENTRY_PROFILES,
  DocTypeEntryProfile,
  INITIAL_ENTRY_RULES,
  ConditionalEntryRule,
} from "./types/docMethods";

export type View = "dashboard" | "documents" | "operation" | "payments" | "admin";
export type Drawer =
  | "new"
  | "detail"
  | "exception"
  | "payment"
  | "sap"
  | "config"
  | "reschedule"
  | "new-doc-type"
  | "my-security"
  | "client-wizard"
  | "user-drawer"
  | "invite-user"
  | "revoke-user"
  | "policy-simulator"
  | null;

type IconName =
  | "grid" | "file" | "activity" | "wallet" | "settings" | "search" | "bell"
  | "plus" | "filter" | "download" | "more" | "close" | "chevron" | "check"
  | "clock" | "alert" | "building" | "user" | "paperclip" | "refresh" | "eye"
  | "shield" | "logout" | "menu" | "arrow" | "upload" | "lock" | "mail"
  | "arrow-up" | "arrow-down" | "grip" | "truck";

const iconPaths: Record<IconName, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h6"/></>,
  truck: <><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>,
  activity: <><path d="M3 12h4l2.5-7 5 14 2.5-7h4"/><path d="M4 3v3M20 18v3"/></>,
  wallet: <><path d="M3 6h16a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V6z"/><path d="M3 6l13-3v3M16 12h5"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  filter: <path d="M4 5h16M7 12h10M10 19h4"/>,
  download: <><path d="M12 3v12m0 0 5-5m-5 5-5-5M5 21h14"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  alert: <><path d="M12 3 2.8 20h18.4L12 3z"/><path d="M12 9v4M12 17h.01"/></>,
  building: <><path d="M4 21V5l8-3v19M12 8h8v13M7 8h2M7 12h2M7 16h2M15 12h2M15 16h2"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  paperclip: <path d="m21 11-8.7 8.7a6 6 0 0 1-8.5-8.5l9-9a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 0 1-2.8-2.8L15 5.8"/>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 9a7 7 0 0 1 11.5-2L20 12M4 12l2.4 5a7 7 0 0 0 11.5-2"/></>,
  eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>,
  shield: <><path d="M12 2 4 5v6c0 5 3.4 9 8 11 4.6-2 8-6 8-11V5l-8-3z"/><path d="m8.5 12 2.3 2.3 4.7-5"/></>,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10"/></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16"/>,
  arrow: <path d="m5 12 14 0m-6-6 6 6-6 6"/>,
  upload: <><path d="M12 16V4m0 0-5 5m5-5 5 5M4 20h16"/></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  "arrow-up": <path d="m18 15-6-6-6 6"/>,
  "arrow-down": <path d="m6 9 6 6 6-6"/>,
  grip: <><circle cx="8" cy="6" r="1.5"/><circle cx="16" cy="6" r="1.5"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><circle cx="8" cy="18" r="1.5"/><circle cx="16" cy="18" r="1.5"/></>,
};

function Icon({ name, size = 20, color = "#1769e0" }: { name: IconName; size?: number; color?: string }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`logo ${dark ? "logo-dark" : ""}`}>
      <img src={logoImg} alt="ttax tecnologia fiscal" className="logo-img" />
      <span className="logo-sub">Portal do Parceiro</span>
    </div>
  );
}

function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  wide = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  onClick?: () => void;
  wide?: boolean;
}) {
  return (
    <button
      className={`btn btn-${variant} ${wide ? "btn-wide" : ""}`}
      onClick={onClick}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
    </button>
  );
}

function Status({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "blue" | "green" | "orange" | "red" | "gray" | "purple";
}) {
  return (
    <span className={`status status-${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}

const navItems: { id: View; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Visão geral", icon: "grid" },
  { id: "documents", label: "Documentos", icon: "file" },
  { id: "operation", label: "Operação", icon: "activity" },
  { id: "payments", label: "Pagamentos", icon: "wallet" },
  { id: "admin", label: "Administração", icon: "settings" },
];

type PortalNotice = {
  id: string;
  title: string;
  description: string;
  module: string;
  when: string;
  read: boolean;
  docId?: string;
};

function buildPortalNotices(docs: DocumentRecord[]): PortalNotice[] {
  const pending = docs
    .filter((doc) => doc.pendingIssue)
    .map((doc) => ({
      id: `pend-${doc.id}`,
      title: doc.pendingIssue!.title,
      description: `${doc.type} ${doc.number} · ${doc.pendingIssue!.description}`,
      module: "Documentos",
      when: doc.lastUpdated,
      read: false,
      docId: doc.id,
    }));
  const scheduled = docs
    .filter((doc) => doc.cteSchedule)
    .slice(0, 2)
    .map((doc) => ({
      id: `sch-${doc.id}`,
      title: `Agendamento de ${doc.type}`,
      description: `${doc.number} · ${doc.cteSchedule!.scheduleWindow} · ${doc.cteSchedule!.bayOrDock}`,
      module: "Operação",
      when: doc.cteSchedule!.scheduleDate,
      read: false,
      docId: doc.id,
    }));
  return [...pending, ...scheduled].slice(0, 6);
}

export default function App() {
  const [logged, setLogged] = useState(false);
  const [view, setView] = useState<View>("dashboard");
  const [drawer, setDrawer] = useState<Drawer>(null);
  const [pageTool, setPageTool] = useState<null | "config" | "filters">(null);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window === "undefined" ? true : window.innerWidth > 700
  );
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [notices, setNotices] = useState<PortalNotice[]>(() => buildPortalNotices(INITIAL_DOCUMENTS));
  const noticesRef = useRef<HTMLDivElement>(null);
  const unreadNotices = notices.filter((notice) => !notice.read).length;

  useEffect(() => {
    setPageTool(null);
  }, [view]);

  useEffect(() => {
    if (!drawer) return;
    const previousBody = document.body.style.overflow;
    const previousHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.classList.add("drawer-open");
    return () => {
      document.body.style.overflow = previousBody;
      document.documentElement.style.overflow = previousHtml;
      document.body.classList.remove("drawer-open");
    };
  }, [drawer]);

  useEffect(() => {
    if (!noticesOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!noticesRef.current?.contains(event.target as Node)) setNoticesOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [noticesOpen]);

  // Informações do Usuário Autenticado
  const [currentUser, setCurrentUser] = useState({
    name: "Usuário exemplo",
    email: "usuario@empresa.com",
    company: "Empresa exemplo",
    role: "Administrador do parceiro",
  });

  // Papel Administrativo selecionável no topo (TTAX Master, TTAX Segurança, Administrador do parceiro)
  const [adminRole, setAdminRole] = useState<AdminSecurityRole>("TTAX Master");

  // Dados de Documentos
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);
  const [docTypes, setDocTypes] = useState<DocTypeDefinition[]>(INITIAL_DOC_TYPES);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [selectedDocInitialTab, setSelectedDocInitialTab] = useState<string>("Resumo");
  const [batchDocsToReschedule, setBatchDocsToReschedule] = useState<DocumentRecord[]>([]);

  // Dados de Segurança e Gestão de Identidades
  const [clients, setClients] = useState<ClientSecurityConfig[]>(INITIAL_CLIENTS_SECURITY);
  const [securityUsers, setSecurityUsers] = useState<SecurityUserRecord[]>(INITIAL_SECURITY_USERS);
  const [securityRules, setSecurityRules] = useState<SecurityRuleRecord[]>(INITIAL_SECURITY_RULES);
  const [technicalIdentities, setTechnicalIdentities] = useState<TechnicalIdentityRecord[]>(INITIAL_TECHNICAL_IDENTITIES);
  const [sessions, setSessions] = useState<SecuritySession[]>(INITIAL_SECURITY_SESSIONS);
  const [securityEvents, setSecurityEvents] = useState<SecurityAuditEvent[]>(INITIAL_SECURITY_EVENTS);
  const [accessReviews, setAccessReviews] = useState<AccessReviewCampaign[]>(INITIAL_ACCESS_REVIEWS);

  // Itens em edição nos drawers/modais
  const [editingClient, setEditingClient] = useState<ClientSecurityConfig | null>(null);
  const [selectedSecurityUser, setSelectedSecurityUser] = useState<SecurityUserRecord | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<SecurityUserRecord | null>(null);

  // Aba selecionada na tela de Administração (5 áreas principais conforme imagem)
  const [adminTab, setAdminTab] = useState("Acesso e segurança");
  const [integrationNonce, setIntegrationNonce] = useState(0);
  const [hiddenAdminTabs, setHiddenAdminTabs] = useState<string[]>([]);
  const [adminQuery, setAdminQuery] = useState("");
  const [adminQueryDraft, setAdminQueryDraft] = useState("");
  const adminTabs = [
    "Visão geral",
    "Empresas e filiais",
    "Usuários e permissões",
    "Acesso e segurança",
    "Regras",
    "Integrações",
    "Certificados",
    "Logs",
    "Auditoria",
  ];
  const visibleAdminTabs = adminTabs.filter((tab) => !hiddenAdminTabs.includes(tab));
  const matchAdmin = (value: string) => !adminQuery || value.toLowerCase().includes(adminQuery.toLowerCase());

  // Configurações de métodos de entrada por tipo de documento e regras condicionais
  const [docEntryProfiles, setDocEntryProfiles] = useState<Record<string, DocTypeEntryProfile>>(
    INITIAL_DOC_TYPES_ENTRY_PROFILES
  );
  const [selectedDocTypeForConfig, setSelectedDocTypeForConfig] = useState<any | null>(null);
  const [conditionalEntryRules, setConditionalEntryRules] = useState<ConditionalEntryRule[]>(
    INITIAL_ENTRY_RULES
  );
  const [isSapDownMock, setIsSapDownMock] = useState<boolean>(false);

  // SE NÃO ESTIVER AUTENTICADO: RENDERIZA LOGIN DINÂMICO
  if (!logged) {
    return (
      <DynamicLoginPage
        clients={clients}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          setLogged(true);
        }}
      />
    );
  }

  // Handlers de Documentos
  const handleAddNewDoc = (newDoc: DocumentRecord | DocumentRecord[]) => {
    const created = Array.isArray(newDoc) ? newDoc : [newDoc];
    setDocuments([...created, ...documents]);
    setDrawer(null);
    setView("documents");
  };

  const handleSaveSchedule = (
    docIds: string[],
    newDate: string,
    newWindow: string,
    bay: string,
    reason: string,
    perDocument?: { id: string; date: string; window: string; bay: string }[]
  ) => {
    setDocuments(
      documents.map((doc) => {
        if (docIds.includes(doc.id)) {
          const own = perDocument?.find((item) => item.id === doc.id);
          return {
            ...doc,
            status: "Agendado",
            statusTone: "purple",
            cteSchedule: {
              ...(doc.cteSchedule || { history: [], transportStatus: "Não agendado" as const }),
              scheduleDate: own?.date || newDate,
              scheduleWindow: own?.window || newWindow,
              bayOrDock: own?.bay || bay,
              transportStatus: "Agendado",
              rescheduleReason: reason,
              history: [
                ...(doc.cteSchedule?.history || []),
                {
                  date: "Hoje, agora",
                  action: "Reagendamento operacional",
                  user: `${currentUser.name} (${adminRole})`,
                  note: reason,
                },
              ],
            },
          };
        }
        return doc;
      })
    );
    setDrawer(null);
    setBatchDocsToReschedule([]);
  };

  // Handlers de Segurança
  const handleSaveClientConfig = (updated: ClientSecurityConfig) => {
    setClients(clients.map((c) => (c.id === updated.id ? updated : c)));
    // Registrar evento de auditoria
    const evt: SecurityAuditEvent = {
      id: `evt-${Date.now()}`,
      timestamp: "Hoje, agora",
      eventType: "sso_configurado",
      eventLabel: `Configuração de autenticação atualizada para ${updated.name}`,
      targetUser: updated.name,
      executor: `${currentUser.name} (${adminRole})`,
      companyName: updated.name,
      ipMasked: "177.18.90.***",
      device: "Painel Administrativo",
      origin: "Wizard de Autenticação",
      result: "sucesso",
      beforeAfter: { before: "Configuração anterior", after: `Método: ${updated.authMethod} · SCIM: ${updated.scimEnabled ? "Sim" : "Não"}` },
    };
    setSecurityEvents([evt, ...securityEvents]);
  };

  const handleSendInviteUser = (newUser: SecurityUserRecord) => {
    setSecurityUsers([newUser, ...securityUsers]);
    const evt: SecurityAuditEvent = {
      id: `evt-${Date.now()}`,
      timestamp: "Hoje, agora",
      eventType: "convite_criado",
      eventLabel: `Convite de acesso enviado para ${newUser.email}`,
      targetUser: newUser.email,
      executor: `${currentUser.name} (${adminRole})`,
      companyName: newUser.companyName,
      ipMasked: "177.18.90.***",
      device: "Painel de Administração",
      origin: "Wizard de Convite",
      result: "sucesso",
    };
    setSecurityEvents([evt, ...securityEvents]);
    setDrawer(null);
  };

  const handleConfirmRevoke = (reason: string, transferTo: string) => {
    if (!userToRevoke) return;
    setSecurityUsers(
      securityUsers.map((u) =>
        u.id === userToRevoke.id
          ? {
              ...u,
              status: "revogado",
              alerts: [`Acesso revogado: ${reason}`, `Pendências transferidas para ${transferTo}`],
            }
          : u
      )
    );
    // Invalidar sessões desse usuário
    setSessions(sessions.filter((s) => s.userId !== userToRevoke.id));

    const evt: SecurityAuditEvent = {
      id: `evt-${Date.now()}`,
      timestamp: "Hoje, agora",
      eventType: "usuario_revogado",
      eventLabel: `Vínculo e acesso revogados para ${userToRevoke.email}`,
      targetUser: userToRevoke.email,
      executor: `${currentUser.name} (${adminRole})`,
      companyName: userToRevoke.companyName,
      ipMasked: "177.18.90.***",
      device: "Painel de Governança",
      origin: "Módulo de Desligamento",
      result: "alerta",
      reason: `${reason} · Transferido para ${transferTo}`,
    };
    setSecurityEvents([evt, ...securityEvents]);
    setDrawer(null);
    setUserToRevoke(null);
  };

  const handleRenewUserAccess = (u: SecurityUserRecord) => {
    setSecurityUsers(
      securityUsers.map((item) =>
        item.id === u.id
          ? { ...item, validUntil: "Em 180 dias (Renovado)", status: "ativo", alerts: [] }
          : item
      )
    );
    const evt: SecurityAuditEvent = {
      id: `evt-${Date.now()}`,
      timestamp: "Hoje, agora",
      eventType: "acesso_renovado",
      eventLabel: `Acesso renovado para ${u.email}`,
      targetUser: u.email,
      executor: `${currentUser.name} (${adminRole})`,
      companyName: u.companyName,
      ipMasked: "177.18.90.***",
      device: "Drawer de Usuário",
      origin: "Governança",
      result: "sucesso",
    };
    setSecurityEvents([evt, ...securityEvents]);
  };

  const handleResetUserMfa = (u: SecurityUserRecord) => {
    setSecurityUsers(
      securityUsers.map((item) =>
        item.id === u.id ? { ...item, mfaConfigured: false, status: "aguardando_mfa" } : item
      )
    );
    const evt: SecurityAuditEvent = {
      id: `evt-${Date.now()}`,
      timestamp: "Hoje, agora",
      eventType: "recuperacao_acesso",
      eventLabel: `Reset de MFA solicitado para ${u.email}`,
      targetUser: u.email,
      executor: `${currentUser.name} (${adminRole})`,
      companyName: u.companyName,
      ipMasked: "177.18.90.***",
      device: "Drawer de Usuário",
      origin: "Central de Segurança",
      result: "alerta",
    };
    setSecurityEvents([evt, ...securityEvents]);
  };

  const handleTerminateUserSessions = (u: SecurityUserRecord) => {
    setSessions(sessions.filter((s) => s.userId !== u.id));
    const evt: SecurityAuditEvent = {
      id: `evt-${Date.now()}`,
      timestamp: "Hoje, agora",
      eventType: "sessao_encerrada",
      eventLabel: `Todas as sessões ativas foram encerradas para ${u.email}`,
      targetUser: u.email,
      executor: `${currentUser.name} (${adminRole})`,
      companyName: u.companyName,
      ipMasked: "177.18.90.***",
      device: "Administração de Sessões",
      origin: "Central de Acesso",
      result: "sucesso",
    };
    setSecurityEvents([evt, ...securityEvents]);
  };

  return (
    <div className="app">
      {/* SIDEBAR CORPORATIVA AZUL-MARINHO */}
      <aside className={sidebarOpen ? "sidebar is-open" : "sidebar is-closed"}>
        <div className="side-logo">
          <Logo dark />
        </div>
        <nav>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id);
                if (window.innerWidth <= 700) setSidebarOpen(false);
              }}
              className={view === item.id ? "active" : ""}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.id === "operation" && <b>7</b>}
            </button>
          ))}
        </nav>
      </aside>

      {/* SHELL PRINCIPAL */}
      <div className={sidebarOpen ? "main-shell" : "main-shell is-closed"}>
        <header className="topbar">
          <button
            type="button"
            className="mobile-menu"
            aria-label={sidebarOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <Icon name="menu" />
          </button>
          <div />

          {/* BARRA SUPERIOR LIMPA */}
          <div className="top-actions flex items-center gap-3">
            <div className="relative" ref={noticesRef}>
              <button
                type="button"
                className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center relative cursor-pointer text-slate-600 transition-colors shadow-2xs"
                title="Notificações"
                aria-label="Notificações"
                aria-expanded={noticesOpen}
                onClick={() => setNoticesOpen((open) => !open)}
              >
                <Icon name="bell" size={20} color="#1769e0" />
                {unreadNotices > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {unreadNotices > 99 ? "99+" : unreadNotices}
                  </span>
                )}
              </button>
              {noticesOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[min(360px,calc(100vw-24px))] max-h-[420px] flex flex-col bg-white rounded-[10px] shadow-[0_8px_24px_rgba(15,23,42,0.12)] overflow-hidden border border-slate-200">
                  <div className="flex items-center justify-between gap-2 px-3.5 py-3 border-b border-slate-200">
                    <strong className="text-sm text-slate-900">Notificações</strong>
                    {notices.length > 0 && unreadNotices > 0 && (
                      <button
                        type="button"
                        className="border-0 bg-transparent text-[#1769e0] text-xs font-semibold cursor-pointer"
                        onClick={() => setNotices((list) => list.map((notice) => ({ ...notice, read: true })))}
                      >
                        Marcar todas como lidas
                      </button>
                    )}
                  </div>
                  {notices.length === 0 ? (
                    <p className="px-3.5 py-5 text-[13px] text-slate-500">Nenhuma notificação</p>
                  ) : (
                    <div className="overflow-auto">
                      {notices.map((notice) => (
                        <button
                          key={notice.id}
                          type="button"
                          className={`w-full text-left px-3.5 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                            notice.read ? "bg-white" : "bg-blue-50"
                          }`}
                          onClick={() => {
                            setNotices((list) =>
                              list.map((item) => (item.id === notice.id ? { ...item, read: true } : item))
                            );
                            const doc = documents.find((item) => item.id === notice.docId);
                            if (doc) {
                              setSelectedDoc(doc);
                              setSelectedDocInitialTab("Resumo");
                              setView("documents");
                              setDrawer("detail");
                            }
                            setNoticesOpen(false);
                          }}
                        >
                          <span className="block text-[13px] font-semibold text-slate-900">{notice.title}</span>
                          <span className="block mt-1 text-xs text-slate-500 leading-snug">{notice.description}</span>
                          <span className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                            <span>{notice.when}</span>
                            <span className="px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-600">{notice.module}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
              onClick={() => setDrawer("my-security")}
              title="Central de Segurança"
              aria-label="Central de Segurança"
            >
              <Icon name="user" size={20} color="#1769e0" />
            </button>
          </div>
        </header>

        {/* CONTEÚDO PRINCIPAL DAS TELAS */}
        <main className="content">
          {/* TELA 1: DASHBOARD */}
          {view === "dashboard" && (
            <DashboardView
              currentRole="Prestador"
              onSelectRole={() => {}}
              documents={documents}
              onNavigateToDocuments={() => setView("documents")}
              onOpenDocDetail={(doc, initialTab = "Resumo") => {
                setSelectedDoc(doc);
                setSelectedDocInitialTab(initialTab);
                setDrawer("detail");
              }}
              onOpenNewDoc={() => setDrawer("new")}
              onOpenException={() => {
                const pendDoc = documents.find((d) => d.pendingIssue) || documents[0];
                setSelectedDoc(pendDoc);
                setSelectedDocInitialTab("Resumo");
                setDrawer("detail");
              }}
              onOpenPayment={() => setView("payments")}
            />
          )}

          {/* TELA 2: DOCUMENTOS */}
          {view === "documents" && (
            <DocumentsModule
              documents={documents}
              docTypes={docTypes}
              onOpenDetail={(doc) => {
                setSelectedDoc(doc);
                setSelectedDocInitialTab("Resumo");
                setDrawer("detail");
              }}
              onOpenNew={() => setDrawer("new")}
              onOpenRescheduleBatch={(docs) => {
                setBatchDocsToReschedule(docs);
                setDrawer("reschedule");
              }}
              onOpenManageTypes={() => setDrawer("new-doc-type")}
            />
          )}

          {/* TELA 3: OPERAÇÃO */}
          {view === "operation" && (
            <div className="-mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
              <OperationScreen />
            </div>
          )}

          {/* TELA 4: PAGAMENTOS */}
          {view === "payments" && (
            <div className="-mt-3 flex min-h-0 flex-1 flex-col overflow-hidden">
              <PaymentsScreen />
            </div>
          )}

          {/* TELA 5: ADMINISTRAÇÃO COM NOVA ABA 'SEGURANÇA E ACESSO' */}
          {view === "admin" && (
            <div className="screen-scroll -mt-3 space-y-3">
              <div className="screen-header">
                <div className="screen-header-copy flex flex-col gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1769e0]">
                    PORTAL DO PARCEIRO · ADMINISTRAÇÃO
                  </span>
                  <h1 className="font-bold leading-tight text-slate-900" style={{ fontSize: 20, lineHeight: 1.25 }}>Gerencie acesso, organizações e integrações.</h1>
                  <span className="text-sm text-slate-500">Governança e segurança de cada organização do portal.</span>
                </div>
                <div className="header-action-stack">
                  <div className="nfse-actions">
                    <ScreenToolButtons
                      configureActive={pageTool === "config"}
                      filterActive={pageTool === "filters"}
                      onConfigure={() => setPageTool("config")}
                      onFilter={() => setPageTool("filters")}
                    />
                    <Button
                      variant="secondary"
                      icon="shield"
                      onClick={() => setDrawer("policy-simulator")}
                    >
                      Simulador de políticas
                    </Button>
                    <Button
                      icon="plus"
                      onClick={() => {
                        if (adminTab === "Usuários e permissões") {
                          setDrawer("invite-user");
                        } else if (adminTab === "Integrações") {
                          setIntegrationNonce((current) => current + 1);
                        } else {
                          setEditingClient(null);
                          setDrawer("client-wizard");
                        }
                      }}
                    >
                      {adminTab === "Usuários e permissões" ? "Convidar usuário" : adminTab === "Integrações" ? "Nova integração" : "Configurar organização"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* 5 ÁREAS PRINCIPAIS NO TOPO (EXATAMENTE CONFORME IMAGEM) */}
              <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-slate-200 px-1">
                {visibleAdminTabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAdminTab(t)}
                    className={`py-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
                      adminTab === t
                        ? "text-[#1769e0] font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <span>{t}</span>
                    {adminTab === t && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1769e0] rounded-t-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* CONTEÚDO DA ÁREA: ACESSO E SEGURANÇA (COM MENU VERTICAL POR GRUPOS) */}
              {adminTab === "Acesso e segurança" && (
                <SecurityAdminSection
                  adminRole={adminRole}
                  clients={clients}
                  users={securityUsers.filter((u) => matchAdmin(u.name) || matchAdmin(u.email) || matchAdmin(u.companyName))}
                  rules={securityRules}
                  technicalIdentities={technicalIdentities}
                  sessions={sessions}
                  events={securityEvents}
                  reviews={accessReviews}
                  onOpenClientWizard={(c) => {
                    setEditingClient(c || null);
                    setDrawer("client-wizard");
                  }}
                  onOpenInviteUser={() => setDrawer("invite-user")}
                  onOpenSimulator={() => setDrawer("policy-simulator")}
                  onOpenUserDrawer={(u) => {
                    setSelectedSecurityUser(u);
                    setDrawer("user-drawer");
                  }}
                  onOpenRevokeModal={(u) => {
                    setUserToRevoke(u);
                    setDrawer("revoke-user");
                  }}
                  onTerminateSession={(sid) => {
                    setSessions(sessions.filter((s) => s.id !== sid));
                  }}
                />
              )}

              {/* CONTEÚDO DA ÁREA: VISÃO GERAL */}
              {adminTab === "Visão geral" && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-base font-bold text-slate-900">Visão Geral de Governança</h3>
                  <p className="text-xs text-slate-500">
                    Métricas e status consolidado dos módulos administrativos do portal.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500">Organizações Cadastradas</span>
                      <strong className="text-2xl font-bold text-slate-900 block mt-1">{clients.length}</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500">Usuários com Acesso Ativo</span>
                      <strong className="text-2xl font-bold text-emerald-700 block mt-1">{securityUsers.length}</strong>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500">Conexões ERP / SAP</span>
                      <strong className="text-2xl font-bold text-[#1769e0] block mt-1">4 ativas</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* CONTEÚDO DA ÁREA: ORGANIZAÇÕES */}
              {adminTab === "Organizações" && (
                <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Organizações, Empresas e Filiais</h3>
                      <p className="text-xs text-slate-500">Estrutura societária e cadastros corporativos autorizados.</p>
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 bg-[#1769e0] text-white text-xs font-semibold rounded-xl hover:bg-blue-700"
                      onClick={() => {
                        setEditingClient(null);
                        setDrawer("client-wizard");
                      }}
                    >
                      + Nova Organização
                    </button>
                  </div>
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Status</th><th>CNPJ</th><th>Razão Social</th><th>Filiais</th><th>Inscrição</th><th>ERP</th></tr></thead>
                      <tbody>
                        {clients.filter((c) => matchAdmin(c.name) || matchAdmin(c.cnpjMasked)).map((c) => (
                          <tr key={c.id}>
                            <td><Status tone="green">Ativa</Status></td>
                            <td><strong>{c.cnpjMasked}</strong></td>
                            <td>{c.name}</td>
                            <td>14 filiais</td>
                            <td>3.489.120-1</td>
                            <td>SAP S/4HANA (PRD)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}


              {/* CONTEÚDO DA ABA ATUALIZADA: TIPOS DE DOCUMENTO (COM COLUNA ENTRADA RESUMIDA E DRAWER) */}
              {adminTab === "Tipos de documento" && (
                <section className="table-panel">
                  <div className="toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
                    <div className="search" style={{ minWidth: 260 }}>
                      <span>🔍</span>
                      <input placeholder="Buscar tipo por sigla, nome ou categoria..." />
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setIsSapDownMock(!isSapDownMock)}
                        title="Simular indisponibilidade temporária do SAP ERP para testar fallback"
                      >
                        {isSapDownMock ? "🟢 Restaurar SAP (Online)" : "🔴 Simular SAP Indisponível (Offline)"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setDrawer("new-doc-type")}
                      >
                        + Cadastrar novo tipo
                      </button>
                    </div>
                  </div>

                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Status</th>
                          <th>Sigla</th>
                          <th>Nome / Descrição</th>
                          <th>Categoria</th>
                          <th>Entrada</th>
                          <th>Agendamento</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {docTypes.map((t) => {
                          const profile = docEntryProfiles[t.id] || {
                            summaryLabel: "Padrão",
                            methods: [],
                            defaultMethodId: "upload_xml",
                          };
                          const activeMethodsNames = (profile.methods || [])
                            .filter((m) => m.active)
                            .map((m) => m.name)
                            .join(" • ") || "Padrão do sistema";

                          return (
                            <tr
                              key={t.id}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedDocTypeForConfig(t)}
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td>
                                <span className={`status ${t.active ? "status-green" : "status-gray"}`}>
                                  {t.active ? "Ativo" : "Inativo"}
                                </span>
                              </td>
                              <td>
                                <span className={`doc-chip-badge tone-${t.badgeTone || "blue"}`}>
                                  {t.shortLabel || t.id}
                                </span>
                              </td>
                              <td>
                                <strong className="text-slate-800">{t.name}</strong>
                                <small style={{ display: "block", color: "#64748b" }}>
                                  Clique para abrir configuração completa
                                </small>
                              </td>
                              <td>
                                <small className="text-slate-600">{t.category}</small>
                              </td>
                              <td>
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200"
                                  title={`Métodos de entrada ativos: ${activeMethodsNames}`}
                                >
                                  📥 {profile.summaryLabel}
                                  {profile.fallbackMethodId && (
                                    <span
                                      className="text-[10px] text-amber-600 font-bold ml-1"
                                      title="Possui fallback automático configurado"
                                    >
                                      🛡️
                                    </span>
                                  )}
                                </span>
                              </td>
                              <td>{t.hasSchedule ? "✓ Habilitado" : "—"}</td>
                              <td>
                                <button
                                  type="button"
                                  className="link-sm font-semibold text-[#1769e0]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDocTypeForConfig(t);
                                  }}
                                >
                                  Configurar ⚙️
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* CONTEÚDO DA ABA ATUALIZADA: USUÁRIOS E PERMISSÕES (SEÇÃO 12) */}
              {adminTab === "Usuários e permissões" && (
                <section className="table-panel">
                  <div className="toolbar" style={{ flexWrap: "wrap", gap: 10 }}>
                    <div className="search" style={{ minWidth: 260 }}>
                      <span>🔍</span>
                      <input placeholder="Buscar por usuário, e-mail ou filial..." />
                    </div>
                    <div style={{ marginLeft: "auto" }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setDrawer("invite-user")}
                      >
                        + Convidar novo usuário
                      </button>
                    </div>
                  </div>

                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Usuário</th>
                          <th>Empresa</th>
                          <th>Perfil</th>
                          <th>Método Login</th>
                          <th>MFA</th>
                          <th>Responsável</th>
                          <th>Filiais</th>
                          <th>Último Acesso</th>
                          <th>Validade</th>
                          <th>Situação</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityUsers.filter((u) => matchAdmin(u.name) || matchAdmin(u.email) || matchAdmin(u.companyName)).map((u) => (
                          <tr
                            key={u.id}
                            onClick={() => {
                              setSelectedSecurityUser(u);
                              setDrawer("user-drawer");
                            }}
                          >
                            <td>
                              <strong>{u.name}</strong>
                              <small>{u.email}</small>
                            </td>
                            <td>{u.companyName}</td>
                            <td>
                              <span className="doc-chip-badge tone-purple">{u.profile}</span>
                            </td>
                            <td><small>{u.authMethod}</small></td>
                            <td>
                              <span className={`status status-${u.mfaConfigured ? "green" : "orange"}`}>
                                {u.mfaConfigured ? "✓ Ativo" : "Pendente"}
                              </span>
                            </td>
                            <td><small>{u.responsibleName}</small></td>
                            <td>{u.branches.join(", ")}</td>
                            <td><small>{u.lastLogin}</small></td>
                            <td><strong>{u.validUntil}</strong></td>
                            <td>
                              <span className={`status status-${u.status === "ativo" ? "green" : u.status === "suspenso" ? "red" : "orange"}`}>
                                {u.status}
                              </span>
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button
                                  type="button"
                                  className="link-sm"
                                  onClick={() => {
                                    setSelectedSecurityUser(u);
                                    setDrawer("user-drawer");
                                  }}
                                >
                                  Ver
                                </button>
                                <button
                                  type="button"
                                  className="link-sm"
                                  style={{ color: "var(--red)" }}
                                  onClick={() => {
                                    setUserToRevoke(u);
                                    setDrawer("revoke-user");
                                  }}
                                >
                                  Revogar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {/* DEMAIS ABAS EXISTENTES PRESERVADAS */}
              {adminTab === "Empresas e filiais" && (
                <section className="table-panel">
                  <div className="table-scroll">
                    <table>
                      <thead><tr><th>Status</th><th>CNPJ</th><th>Razão Social</th><th>Filiais</th><th>Inscrição</th><th>ERP</th></tr></thead>
                      <tbody>
                        {clients.filter((c) => matchAdmin(c.name) || matchAdmin(c.cnpjMasked)).map((c) => (
                          <tr key={c.id}>
                            <td><Status tone="green">Ativa</Status></td>
                            <td><strong>{c.cnpjMasked}</strong></td>
                            <td>{c.name}</td>
                            <td>14 filiais</td>
                            <td>3.489.120-1</td>
                            <td>SAP S/4HANA (PRD)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              {adminTab === "Regras" && (
                <div className="space-y-6">
                  {/* Card Explicativo: SE -> ENTÃO */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#1769e0] bg-blue-50 px-2 py-0.5 rounded">
                          Motor de Políticas Operacionais & Entrada
                        </span>
                        <h3 className="text-base font-bold text-slate-800 mt-1">
                          Regras Condicionais de Entrada e Captura de Documentos
                        </h3>
                        <p className="text-xs text-slate-500">
                          Configure comportamentos dinâmicos (SE contexto ENTÃO método autorizado, padrão ou fallback).
                        </p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                        {conditionalEntryRules.filter((r) => r.active).length} Regras Ativas
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                            <th className="p-3">Código</th>
                            <th className="p-3">SE (Condição de Entrada)</th>
                            <th className="p-3">ENTÃO (Ação / Comportamento)</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {conditionalEntryRules.filter((rule) => matchAdmin(rule.name) || matchAdmin(rule.code)).map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-3 font-mono font-bold text-slate-700">{rule.code}</td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  <strong className="text-slate-800 block text-xs">{rule.name}</strong>
                                  <div className="flex flex-wrap gap-1">
                                    {rule.condition.client && (
                                      <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium border border-blue-200">
                                        Cliente: {rule.condition.client}
                                      </span>
                                    )}
                                    {rule.condition.docType && (
                                      <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-medium border border-purple-200">
                                        Tipo: {rule.condition.docType}
                                      </span>
                                    )}
                                    {rule.condition.profile && (
                                      <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-medium border border-amber-200">
                                        Perfil: {rule.condition.profile}
                                      </span>
                                    )}
                                    {rule.condition.branch && (
                                      <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[10px] font-medium border border-teal-200">
                                        Filial: {rule.condition.branch}
                                      </span>
                                    )}
                                    {rule.condition.integrationDown && (
                                      <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-medium border border-red-200 animate-pulse">
                                        Integração Indisponível
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="space-y-1">
                                  {rule.action.enableMethods && (
                                    <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-semibold border border-emerald-200 mr-1">
                                      Habilita: {rule.action.enableMethods.join(", ")}
                                    </span>
                                  )}
                                  {rule.action.disableMethods && (
                                    <span className="inline-block px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-semibold border border-rose-200 mr-1">
                                      Desabilita: {rule.action.disableMethods.join(", ")}
                                    </span>
                                  )}
                                  {rule.action.setDefaultMethod && (
                                    <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-semibold border border-indigo-200">
                                      Padrão: {rule.action.setDefaultMethod}
                                    </span>
                                  )}
                                  {rule.action.useFallback && (
                                    <span className="inline-block px-1.5 py-0.5 bg-amber-50 text-amber-800 rounded text-[10px] font-semibold border border-amber-200 ml-1">
                                      🛡️ Ativa Fallback
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">{rule.description}</p>
                              </td>
                              <td className="p-3">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    rule.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                                  }`}
                                >
                                  {rule.active ? "Ativa" : "Inativa"}
                                </span>
                              </td>
                              <td className="p-3">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConditionalEntryRules((prev) =>
                                      prev.map((r) => (r.id === rule.id ? { ...r, active: !r.active } : r))
                                    )
                                  }
                                  className="text-xs font-semibold text-[#1769e0] hover:underline"
                                >
                                  {rule.active ? "Desativar" : "Ativar"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="summary-card">
                    <h3>Regras Fiscais e Tributárias (Legislação)</h3>
                    <p className="muted">
                      As regras de retenção na fonte, CFOP e alíquotas municipais são mantidas estritamente separadas
                      das regras operacionais de entrada.
                    </p>
                  </div>
                </div>
              )}

              {adminTab === "Integrações" && <IntegrationsPanel openRequest={integrationNonce} query={adminQuery} />}

              {adminTab === "Certificados" && (
                <div className="summary-card">
                  <h3>Certificados Digitais ICP-Brasil</h3>
                  <p className="muted">Certificados A1 e tokens mTLS para emissão de NF-e, CT-e e MDF-e.</p>
                </div>
              )}

              {adminTab === "Logs" && (
                <div className="summary-card">
                  <h3>Logs do Sistema</h3>
                  <p className="muted">Registros técnicos de processamento HTTP e worker jobs.</p>
                </div>
              )}

              {adminTab === "Auditoria" && (
                <div className="summary-card">
                  <h3>Auditoria Geral de Operações Fiscais</h3>
                  <p className="muted">Eventos fiscais e operacionais.</p>
                </div>
              )}
            </div>
          )}
        </main>
        {pageTool === "config" && view === "admin" && (
          <ColumnConfigDrawer
            hint="Escolha as áreas visíveis na administração."
            items={adminTabs.map((tab) => ({ key: tab, label: tab, required: tab === "Acesso e segurança" }))}
            hidden={hiddenAdminTabs}
            onClose={() => setPageTool(null)}
            onSave={(next) => {
              setHiddenAdminTabs(next);
              if (next.includes(adminTab)) setAdminTab(adminTabs.find((tab) => !next.includes(tab)) || "Acesso e segurança");
              setPageTool(null);
            }}
          />
        )}
        {pageTool === "filters" && view === "admin" && (
          <FilterDrawer
            title="Filtrar administração"
            onClose={() => setPageTool(null)}
            onClear={() => {
              setAdminQueryDraft("");
              setAdminQuery("");
            }}
            onApply={() => {
              setAdminQuery(adminQueryDraft.trim());
              setPageTool(null);
            }}
          >
            <label className="block text-xs font-semibold text-slate-600">
              Busca
              <input className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-800" value={adminQueryDraft} placeholder="Empresa, usuário ou regra" onChange={(event) => setAdminQueryDraft(event.target.value)} />
            </label>
            <FilterField label="Área" value={visibleAdminTabs.includes(adminTab) ? adminTab : "all"} onChange={(value) => { if (value !== "all") setAdminTab(value); }} options={[{ value: "all", label: "Área atual" }, ...visibleAdminTabs.map((tab) => ({ value: tab, label: tab }))]} />
          </FilterDrawer>
        )}
      </div>

      {/* DRAWERS E MODAIS DE SEGURANÇA E IDENTIDADES */}

      {/* 1. Modal 'Minha Segurança' do Usuário */}
      {drawer === "my-security" && (
        <MySecurityModal
          user={currentUser}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* 2. Wizard de Configuração de Autenticação do Cliente */}
      {drawer === "client-wizard" && (
        <ClientAuthConfigWizard
          client={editingClient}
          onClose={() => {
            setDrawer(null);
            setEditingClient(null);
          }}
          onSaveConfig={handleSaveClientConfig}
        />
      )}

      {/* 3. Drawer Completo do Usuário (Seção 13) */}
      {drawer === "user-drawer" && selectedSecurityUser && (
        <UserSecurityDrawer
          user={selectedSecurityUser}
          onClose={() => {
            setDrawer(null);
            setSelectedSecurityUser(null);
          }}
          onRevokeAccess={(u) => {
            setDrawer(null);
            setUserToRevoke(u);
            setDrawer("revoke-user");
          }}
          onRenewAccess={handleRenewUserAccess}
          onResetMfa={handleResetUserMfa}
          onTerminateSessions={handleTerminateUserSessions}
        />
      )}

      {/* 4. Wizard de Convite de Usuário (Seção 14) */}
      {drawer === "invite-user" && (
        <InviteUserModal
          clients={clients}
          onClose={() => setDrawer(null)}
          onSendInvite={handleSendInviteUser}
        />
      )}

      {/* 5. Modal de Desligamento e Revogação (Seção 15) */}
      {drawer === "revoke-user" && userToRevoke && (
        <RevokeUserModal
          user={userToRevoke}
          onClose={() => {
            setDrawer(null);
            setUserToRevoke(null);
          }}
          onConfirmRevoke={handleConfirmRevoke}
        />
      )}

      {/* 6. Simulador de Políticas de Segurança (Seção 18) */}
      {drawer === "policy-simulator" && (
        <PolicySimulatorModal
          clients={clients}
          rules={securityRules}
          onClose={() => setDrawer(null)}
        />
      )}

      {/* Modais de Documentos Fiscais Existentes */}
      {drawer === "detail" && selectedDoc && (
        <UniversalDetailDrawer
          document={selectedDoc}
          docTypes={docTypes}
          initialTab={selectedDocInitialTab}
          onClose={() => {
            setDrawer(null);
            setSelectedDoc(null);
          }}
          onOpenReschedule={() => {
            setBatchDocsToReschedule([selectedDoc]);
            setDrawer("reschedule");
          }}
        />
      )}

      {drawer === "new" && (
        <AddDocumentDrawer
          docTypes={docTypes}
          onClose={() => setDrawer(null)}
          onDone={handleAddNewDoc}
          currentClientName={currentUser.company || "Empresa exemplo"}
          currentBranch="Filial 01"
          currentUserProfile={currentUser.name}
          existingDocuments={documents}
          docEntryProfiles={docEntryProfiles}
          conditionalRules={conditionalEntryRules}
          isSapDown={isSapDownMock}
        />
      )}

      {drawer === "reschedule" && batchDocsToReschedule.length > 0 && (
        <RescheduleModal
          documents={batchDocsToReschedule}
          docTypes={docTypes}
          onClose={() => {
            setDrawer(null);
            setBatchDocsToReschedule([]);
          }}
          onSaveSchedule={handleSaveSchedule}
        />
      )}

      {/* Drawer Modular de Configuração do Tipo de Documento (8 Abas com Entrada e Captura) */}
      {selectedDocTypeForConfig && (
        <DocTypeConfigDrawer
          isOpen={Boolean(selectedDocTypeForConfig)}
          onClose={() => setSelectedDocTypeForConfig(null)}
          docType={selectedDocTypeForConfig}
          entryProfile={
            docEntryProfiles[selectedDocTypeForConfig.id] || {
              docTypeId: selectedDocTypeForConfig.id,
              summaryLabel: "Padrão",
              methods: [],
              defaultMethodId: "upload_xml",
            }
          }
          selectedClient={currentUser.company || "Empresa exemplo"}
          onSaveProfile={(docTypeId, updatedProfile) => {
            setDocEntryProfiles((prev) => ({
              ...prev,
              [docTypeId]: updatedProfile,
            }));
          }}
        />
      )}
    </div>
  );
}
