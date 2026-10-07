// Tipos e dados para métodos de entrada e captura, regras condicionais e herança por cliente

export type EntryMethodId =
  | "upload_xml"
  | "upload_pdf"
  | "upload_img"
  | "manual_entry"
  | "access_key"
  | "number_id"
  | "sefaz_capture"
  | "national_env"
  | "city_hall"
  | "sap_integration"
  | "easy4_integration"
  | "ttax_cloud"
  | "api_import"
  | "email_receive"
  | "ocr_scan"
  | "custom_method";

export interface EntryMethodConfig {
  id: EntryMethodId;
  name: string;
  icon: string;
  description: string;
  active: boolean;
  isDefault: boolean;
  allowedProfiles: string[];
  allowedBranches: string[];
  allowedClients: string[]; // Se vazio, aplica-se a todos
  fileFormats?: string[];
  maxSizeMb?: number;
  requiredFields?: string[];
  relatedIntegration?: string;
  displayOrder: number;
  fallbackMethodId?: EntryMethodId;
  fallbackAvailable?: boolean;
}

export interface ClientDocOverride {
  clientId: string;
  docTypeId: string;
  inheritDefault: boolean;
  enabledMethods: EntryMethodId[];
  defaultMethod: EntryMethodId;
  fallbackMethod?: EntryMethodId;
}

export interface ConditionalEntryRule {
  id: string;
  code: string;
  name: string;
  active: boolean;
  // SE (Condições)
  condition: {
    client?: string;
    branch?: string;
    docType?: string;
    profile?: string;
    municipality?: string;
    integrationDown?: boolean;
  };
  // ENTÃO (Ações)
  action: {
    enableMethods?: EntryMethodId[];
    disableMethods?: EntryMethodId[];
    setDefaultMethod?: EntryMethodId;
    requireAttachment?: boolean;
    allowManual?: boolean;
    requireApproval?: boolean;
    blockInclusion?: boolean;
    useFallback?: boolean;
  };
  description: string;
}

// Catálogo base de métodos disponíveis
export const ALL_AVAILABLE_ENTRY_METHODS: EntryMethodConfig[] = [
  {
    id: "upload_xml",
    name: "Upload de XML",
    icon: "📄",
    description: "Leitura automática de chave, tributos e itens a partir do XML autorizado.",
    active: true,
    isDefault: true,
    allowedProfiles: ["Prestador", "Operação", "ADMIN_PARCEIRO", "GESTOR_FISCAL", "OPERADOR_FISCAL"],
    allowedBranches: ["Todas"],
    allowedClients: [],
    fileFormats: [".xml"],
    maxSizeMb: 25,
    requiredFields: ["Arquivo XML"],
    displayOrder: 1,
  },
  {
    id: "upload_pdf",
    name: "Upload de PDF / Espelho",
    icon: "📑",
    description: "Envio de representação impressa (DANFE, DACTE ou Espelho de NFS-e).",
    active: true,
    isDefault: false,
    allowedProfiles: ["Prestador", "Operação", "ADMIN_PARCEIRO", "GESTOR_FISCAL", "OPERADOR_FISCAL"],
    allowedBranches: ["Todas"],
    allowedClients: [],
    fileFormats: [".pdf"],
    maxSizeMb: 20,
    requiredFields: ["Arquivo PDF"],
    displayOrder: 2,
  },
  {
    id: "manual_entry",
    name: "Digitação manual",
    icon: "⌨️",
    description: "Preenchimento dos campos cadastrais e valores diretamente na tela.",
    active: true,
    isDefault: false,
    allowedProfiles: ["Operação", "ADMIN_PARCEIRO", "GESTOR_FISCAL"],
    allowedBranches: ["Todas"],
    allowedClients: [],
    requiredFields: ["Número", "Série", "Valor", "Tomador"],
    displayOrder: 3,
  },
  {
    id: "access_key",
    name: "Informar chave de acesso",
    icon: "🔑",
    description: "Consulta rápida pela chave de 44 dígitos com busca automatizada.",
    active: true,
    isDefault: false,
    allowedProfiles: ["Prestador", "Operação", "OPERADOR_FISCAL", "GESTOR_FISCAL"],
    allowedBranches: ["Todas"],
    allowedClients: [],
    requiredFields: ["Chave de acesso (44 dígitos)"],
    displayOrder: 4,
  },
  {
    id: "sefaz_capture",
    name: "Captura automática na SEFAZ",
    icon: "🏛️",
    description: "Download automático pelo WebService de distribuição com certificado digital A1.",
    active: true,
    isDefault: false,
    allowedProfiles: ["Operação", "GESTOR_FISCAL", "ADMIN_PARCEIRO"],
    allowedBranches: ["Todas"],
    allowedClients: [],
    relatedIntegration: "Conector SEFAZ SP / Nacional",
    displayOrder: 5,
  },
  {
    id: "sap_integration",
    name: "Integração SAP ERP",
    icon: "💼",
    description: "Importação e conferência direta dos dados gerados no módulo MM/FI.",
    active: true,
    isDefault: false,
    allowedProfiles: ["Operação", "ADMIN_PARCEIRO", "GESTOR_FISCAL"],
    allowedBranches: ["SP01", "PR01", "RJ02"],
    allowedClients: ["Empresa exemplo", "Transportadora Horizonte"],
    relatedIntegration: "SAP S/4HANA (PRD)",
    displayOrder: 6,
    fallbackMethodId: "upload_xml",
    fallbackAvailable: true,
  },
  {
    id: "easy4_integration",
    name: "Integração EASY4 Tax",
    icon: "⚡",
    description: "Sincronização via mensageria fiscal centralizada EASY4.",
    active: true,
    isDefault: false,
    allowedProfiles: ["Operação", "ADMIN_PARCEIRO"],
    allowedBranches: ["RJ02", "MG01"],
    allowedClients: [],
    relatedIntegration: "EASY4 Gateway Cloud",
    displayOrder: 7,
  },
  {
    id: "ocr_scan",
    name: "Leitura por OCR inteligente",
    icon: "👁️",
    description: "Extração de texto e valores de imagens e digitalizações escaneadas.",
    active: false,
    isDefault: false,
    allowedProfiles: ["Operação", "GESTOR_FISCAL"],
    allowedBranches: ["Todas"],
    allowedClients: [],
    fileFormats: [".png", ".jpg", ".jpeg"],
    maxSizeMb: 15,
    displayOrder: 8,
  },
];

// Configuração padrão dos tipos de documentos com seus métodos habilitados e fallback
export interface DocTypeEntryProfile {
  docTypeId: string;
  summaryLabel: string; // Ex: "XML", "XML + Manual", "SAP", "3 métodos"
  methods: EntryMethodConfig[];
  defaultMethodId: EntryMethodId;
  fallbackMethodId?: EntryMethodId;
}

export const INITIAL_DOC_TYPES_ENTRY_PROFILES: Record<string, DocTypeEntryProfile> = {
  "CT-e": {
    docTypeId: "CT-e",
    summaryLabel: "XML + SAP",
    defaultMethodId: "upload_xml",
    fallbackMethodId: "upload_xml",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[0], isDefault: true, active: true }, // upload_xml
      { ...ALL_AVAILABLE_ENTRY_METHODS[5], isDefault: false, active: true }, // sap_integration
    ],
  },
  "NFS-e": {
    docTypeId: "NFS-e",
    summaryLabel: "PDF + Manual",
    defaultMethodId: "upload_pdf",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[1], isDefault: true, active: true }, // upload_pdf
      { ...ALL_AVAILABLE_ENTRY_METHODS[2], isDefault: false, active: true }, // manual_entry
    ],
  },
  "NF-e": {
    docTypeId: "NF-e",
    summaryLabel: "XML",
    defaultMethodId: "upload_xml",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[0], isDefault: true, active: true }, // upload_xml
      { ...ALL_AVAILABLE_ENTRY_METHODS[3], isDefault: false, active: true }, // access_key
    ],
  },
  "MDF-e": {
    docTypeId: "MDF-e",
    summaryLabel: "SAP",
    defaultMethodId: "sap_integration",
    fallbackMethodId: "upload_xml",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[5], isDefault: true, active: true }, // sap_integration
      { ...ALL_AVAILABLE_ENTRY_METHODS[0], isDefault: false, active: true }, // upload_xml (fallback)
    ],
  },
  "CIOT": {
    docTypeId: "CIOT",
    summaryLabel: "Manual",
    defaultMethodId: "manual_entry",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[2], isDefault: true, active: true }, // manual_entry
      { ...ALL_AVAILABLE_ENTRY_METHODS[0], isDefault: false, active: true }, // upload_xml
    ],
  },
  "NFC-e": {
    docTypeId: "NFC-e",
    summaryLabel: "XML",
    defaultMethodId: "upload_xml",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[0], isDefault: true, active: true },
    ],
  },
  "CT-e OS": {
    docTypeId: "CT-e OS",
    summaryLabel: "XML + SAP",
    defaultMethodId: "upload_xml",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[0], isDefault: true, active: true },
      { ...ALL_AVAILABLE_ENTRY_METHODS[5], isDefault: false, active: true },
    ],
  },
  "ND": {
    docTypeId: "ND",
    summaryLabel: "PDF + Manual",
    defaultMethodId: "upload_pdf",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[1], isDefault: true, active: true },
      { ...ALL_AVAILABLE_ENTRY_METHODS[2], isDefault: false, active: true },
    ],
  },
  "FAT": {
    docTypeId: "FAT",
    summaryLabel: "Manual",
    defaultMethodId: "manual_entry",
    methods: [
      { ...ALL_AVAILABLE_ENTRY_METHODS[2], isDefault: true, active: true },
    ],
  },
};

// Sobrescritas específicas por cliente (Hierarquia)
export const INITIAL_CLIENT_OVERRIDES: ClientDocOverride[] = [
  {
    clientId: "cli-1", // TTAX Industrial
    docTypeId: "CT-e",
    inheritDefault: false,
    enabledMethods: ["upload_xml", "sap_integration"],
    defaultMethod: "sap_integration",
    fallbackMethod: "upload_xml",
  },
  {
    clientId: "cli-2", // Transportadora Horizonte
    docTypeId: "CT-e",
    inheritDefault: false,
    enabledMethods: ["upload_xml"],
    defaultMethod: "upload_xml",
  },
  {
    clientId: "cli-3", // Logística Vale
    docTypeId: "NFS-e",
    inheritDefault: false,
    enabledMethods: ["upload_pdf", "manual_entry"],
    defaultMethod: "upload_pdf",
  },
];

// Regras condicionais de entrada na aba "Regras"
export const INITIAL_ENTRY_RULES: ConditionalEntryRule[] = [
  {
    id: "crule-1",
    code: "RUL-ENT-001",
    name: "CT-e para Cliente A (TTAX Industrial) permite XML e SAP",
    active: true,
    condition: { client: "TTAX Industrial", docType: "CT-e" },
    action: { enableMethods: ["upload_xml", "sap_integration"], setDefaultMethod: "sap_integration", useFallback: true },
    description: "Se o cliente for TTAX Industrial e o tipo for CT-e, prioriza a integração SAP com fallback para XML.",
  },
  {
    id: "crule-2",
    code: "RUL-ENT-002",
    name: "CT-e para Transportadora Horizonte permite somente XML",
    active: true,
    condition: { client: "Transportadora Horizonte", docType: "CT-e" },
    action: { enableMethods: ["upload_xml"], setDefaultMethod: "upload_xml" },
    description: "Transportadora Horizonte não possui conector ERP direto, aceitando exclusivamente arquivo XML.",
  },
  {
    id: "crule-3",
    code: "RUL-ENT-003",
    name: "Perfil Prestador restrito a Upload",
    active: true,
    condition: { profile: "Prestador" },
    action: { disableMethods: ["manual_entry", "sefaz_capture"] },
    description: "Prestadores externos não podem digitar notas manualmente sem arquivo comprovatório.",
  },
  {
    id: "crule-4",
    code: "RUL-ENT-004",
    name: "Perfil Operação habilita Digitação Manual",
    active: true,
    condition: { profile: "Operação" },
    action: { enableMethods: ["manual_entry", "upload_xml", "upload_pdf"] },
    description: "Equipe de operação interna tem alçada para cadastrar contingências manualmente.",
  },
  {
    id: "crule-5",
    code: "RUL-ENT-005",
    name: "Filial SP01 prioriza Integração SAP",
    active: true,
    condition: { branch: "SP01" },
    action: { setDefaultMethod: "sap_integration" },
    description: "A matriz SP01 tem barramento SAP direto ativo.",
  },
  {
    id: "crule-6",
    code: "RUL-ENT-006",
    name: "Fallback automático quando Integração SAP estiver indisponível",
    active: true,
    condition: { integrationDown: true },
    action: { enableMethods: ["upload_xml"], setDefaultMethod: "upload_xml", useFallback: true },
    description: "Se o conector SAP estiver temporariamente fora do ar, exibe aviso e habilita envio manual de XML.",
  },
];
