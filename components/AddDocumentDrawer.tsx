import React, { useEffect, useMemo, useRef, useState } from "react";
import { DocumentRecord, DocTypeDefinition } from "../types/documents";
import { ConditionalEntryRule, DocTypeEntryProfile } from "../types/docMethods";

type InclusionMethod = "manual" | "xml" | "batch" | "link";
type Phase = "choose" | "form" | "import" | "link";
type ImportStatus = "ready" | "invalid" | "duplicate" | "unknown" | "incomplete";

interface AddDocumentDrawerProps {
  docTypes: DocTypeDefinition[];
  onClose: () => void;
  onDone: (newDoc: DocumentRecord | DocumentRecord[]) => void;
  currentClientName?: string;
  currentBranch?: string;
  currentUserProfile?: string;
  docEntryProfiles?: Record<string, DocTypeEntryProfile>;
  conditionalRules?: ConditionalEntryRule[];
  isSapDown?: boolean;
  existingDocuments?: DocumentRecord[];
}

const ADD_TYPES = [
  { id: "NFS-e", name: "Nota Fiscal de Serviço" },
  { id: "NF-e", name: "Nota Fiscal Eletrônica" },
  { id: "CT-e", name: "Conhecimento de Transporte" },
  { id: "MDF-e", name: "Manifesto Eletrônico" },
  { id: "CIOT", name: "Código Identificador da Operação" },
] as const;

const STEPS: Record<string, string[]> = {
  "NFS-e": ["Dados da NFS-e", "Pedido e folha", "Valores e tributos", "Anexos", "Revisão"],
  "NF-e": ["Dados da NF-e", "Pedido e itens", "Valores e tributos", "Anexos", "Revisão"],
  "CT-e": ["Dados do CT-e", "Agenda e vínculos", "Valores e tributos", "Anexos", "Revisão"],
  "MDF-e": ["Dados do MDF-e", "Veículo e documentos", "Totais da carga", "Anexos", "Revisão"],
  CIOT: ["Dados do CIOT", "Viagem e contrato", "Valores", "Anexos", "Revisão"],
};

const METHODS: Record<string, { id: InclusionMethod; title: string; description: string }[]> = {
  "NFS-e": [
    { id: "manual", title: "Preencher manualmente", description: "Informe os dados da nota no formulário." },
    { id: "xml", title: "Importar XML", description: "Envie um XML para criar o documento." },
    { id: "batch", title: "Importar vários documentos", description: "Valide e importe um lote de arquivos." },
  ],
  "NF-e": [
    { id: "xml", title: "Importar XML", description: "Envie o XML autorizado da NF-e." },
    { id: "batch", title: "Importar vários documentos", description: "Valide e importe um lote de XMLs." },
    { id: "manual", title: "Preencher manualmente", description: "Informe os dados da nota no formulário." },
    { id: "link", title: "Vincular documento existente", description: "Associe uma NF-e que já está no portal." },
  ],
  "CT-e": [
    { id: "xml", title: "Importar XML", description: "Envie o XML autorizado do CT-e." },
    { id: "batch", title: "Importar vários documentos", description: "Valide e importe um lote de CT-es." },
    { id: "manual", title: "Preencher manualmente", description: "Informe os dados do conhecimento." },
    { id: "link", title: "Vincular documento existente", description: "Associe um CT-e que já está no portal." },
  ],
  "MDF-e": [
    { id: "xml", title: "Importar XML", description: "Envie o XML autorizado do manifesto." },
    { id: "batch", title: "Importar vários documentos", description: "Valide e importe um lote de manifestos." },
  ],
  CIOT: [{ id: "manual", title: "Preencher manualmente", description: "O CIOT é incluído pelo formulário." }],
};

const STATUS_LABEL: Record<ImportStatus, string> = {
  ready: "Pronto para importar",
  invalid: "Arquivo inválido",
  duplicate: "Documento duplicado",
  unknown: "Tipo não reconhecido",
  incomplete: "Dados incompletos",
};

const inputClass =
  "h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 text-sm text-slate-800 outline-none focus:border-[#1769e0] focus:ring-1 focus:ring-[#1769e0]";
const lockedClass = "h-11 w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 text-sm text-slate-700";

interface ImportFile {
  id: string;
  name: string;
  detectedType: string;
  number: string;
  company: string;
  status: ImportStatus;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function AddDocumentDrawer({
  onClose,
  onDone,
  currentClientName = "Empresa exemplo",
  currentBranch = "Filial 01",
  currentUserProfile = "Usuário exemplo",
  existingDocuments = [],
}: AddDocumentDrawerProps) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [returnPhase, setReturnPhase] = useState<Phase | null>(null);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<InclusionMethod | "">("");
  const [step, setStep] = useState(1);
  const [partnerLocked, setPartnerLocked] = useState(true);
  const [xmlNotice, setXmlNotice] = useState("");
  const [confirmed, setConfirmed] = useState(true);
  const [draftLabel, setDraftLabel] = useState("Rascunho salvo há poucos segundos");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<"xml" | "batch">("xml");
  const [importFiles, setImportFiles] = useState<ImportFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [linkedId, setLinkedId] = useState("");
  const [linkQuery, setLinkQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formXmlRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    company: currentClientName,
    branch: currentBranch,
    partner: "Prestador exemplo Ltda.",
    cnpj: "00.000.000/0001-00",
    legalName: "Prestador exemplo Ltda.",
    site: "Matriz · São Paulo/SP",
    requester: currentUserProfile,
    center: "CC-4021 · Operações",
    description: "",
    balance: "",
    linkedValue: "",
    discount: "",
    deduction: "",
    ir: "",
    pis: "",
    cofins: "",
    csll: "",
    otherRetention: "",
    retentionTotal: "",
    notes: "",
    number: "",
    series: "",
    issueDate: "",
    accessKey: "",
    order: "",
    sheet: "",
    item: "",
    qty: "",
    gross: "",
    net: "",
    iss: "",
    inss: "",
    scheduleDate: "",
    scheduleWindow: "08:00 - 10:00",
    dock: "Doca 02 (Recepção Sul)",
    plate: "",
    driver: "",
    origin: "",
    destination: "",
    contract: "",
    weight: "",
    volumes: "",
    freight: "",
    advance: "",
  });

  const methods = selectedType ? METHODS[selectedType] || [] : [];
  const singleMethod = methods.length === 1;
  const steps = STEPS[selectedType] || STEPS["NFS-e"];

  useEffect(() => {
    const available = selectedType ? METHODS[selectedType] || [] : [];
    if (available.length === 1) {
      setSelectedMethod(available[0].id);
      return;
    }
    setSelectedMethod((current) => (available.some((method) => method.id === current) ? current : ""));
  }, [selectedType]);

  const setField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setDraftLabel("Alterações ainda não salvas");
  };

  const openChooser = () => {
    setReturnPhase(phase === "choose" ? null : phase);
    setPhase("choose");
  };

  const closeChooser = () => {
    if (returnPhase && returnPhase !== "choose") {
      setPhase(returnPhase);
      setReturnPhase(null);
      return;
    }
    onClose();
  };

  const continueFromChooser = () => {
    if (!selectedType || !selectedMethod) return;
    setReturnPhase(null);
    setStep(1);
    if (selectedMethod === "manual") {
      setPhase("form");
      return;
    }
    if (selectedMethod === "link") {
      setPhase("link");
      return;
    }
    setImportMode(selectedMethod === "batch" ? "batch" : "xml");
    setImportFiles([]);
    setPhase("import");
  };

  const buildDocument = (partial: Partial<DocumentRecord>): DocumentRecord => ({
    id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    protocol: `TTX-2026-0${Math.floor(1000 + Math.random() * 9000)}`,
    type: selectedType,
    direction: "inbound",
    number: form.number || "S/N",
    series: form.series || "1",
    company: form.company,
    branch: form.branch,
    partnerName: form.legalName || form.partner,
    partnerCnpj: form.cnpj,
    orderNumber: form.order || undefined,
    issueDate: form.issueDate || "Hoje",
    valueGross: form.gross || form.freight || "R$ 0,00",
    valueNet: form.net || form.freight || "R$ 0,00",
    currency: "BRL",
    status: "Em validação",
    statusTone: "blue",
    paymentStatus: "Em validação",
    lastUpdated: "Agora mesmo",
    ...partial,
  });

  const finishForm = () => {
    onDone(
      buildDocument({
        number: form.number || "S/N",
        series: form.series || "1",
        cteSchedule:
          selectedType === "CT-e"
            ? {
                scheduleDate: form.scheduleDate,
                scheduleWindow: form.scheduleWindow,
                bayOrDock: form.dock,
                driverName: form.driver,
                plate: form.plate,
                transportStatus: form.scheduleDate ? "Agendado" : "Não agendado",
                history: [],
              }
            : undefined,
      })
    );
  };

  const applyImportedDocument = () => {
    if (selectedType === "NFS-e") {
      setForm((current) => ({
        ...current,
        company: "TTAX Energia S.A.",
        branch: "SP01 · São Paulo",
        cnpj: "12.345.678/0001-90",
        partner: "Almeida Serviços Ltda.",
        legalName: "Almeida Serviços Ltda.",
        site: "Matriz · São Paulo/SP",
        requester: "Juliana Costa",
        center: "CC-4021 · Operações",
        number: "2025000001847",
        accessKey: "9K7M-2P4X",
        order: "45000098214",
        item: "10",
        sheet: "10001842",
        description: "Serviços de manutenção preventiva",
        balance: "R$ 46.400,00",
        linkedValue: "R$ 46.400,00",
        gross: "R$ 48.750,00",
        net: "R$ 44.776,87",
        discount: "R$ 0,00",
        deduction: "R$ 0,00",
        iss: "R$ 975,00",
        inss: "R$ 0,00",
        ir: "R$ 731,25",
        pis: "R$ 316,88",
        cofins: "R$ 1.462,50",
        csll: "R$ 487,50",
        otherRetention: "R$ 0,00",
        retentionTotal: "R$ 3.973,13",
        notes: "Serviços prestados conforme medição aprovada em junho de 2025.",
      }));
      setAttachments(["nfse_2025000001847.pdf", "nfse_2025000001847.xml"]);
    } else if (selectedType === "NF-e") {
      setForm((current) => ({
        ...current,
        company: "TTAX Industrial",
        branch: "Filial 01",
        cnpj: "45.210.330/0001-20",
        partner: "TechClima Sistemas",
        legalName: "TechClima Sistemas",
        site: "Matriz · São Paulo/SP",
        requester: "Juliana Costa",
        center: "CC-1104 · Compras",
        number: "2025000001895",
        series: "1",
        accessKey: "35250600018950000000000000000000000000000000",
        order: "45000098220",
        item: "20",
        qty: "4",
        sheet: "8415.10.11",
        description: "Equipamentos de climatização",
        gross: "R$ 126.400,00",
        net: "R$ 112.180,00",
        discount: "R$ 0,00",
        deduction: "R$ 0,00",
        iss: "R$ 8.848,00",
        inss: "R$ 0,00",
        ir: "R$ 1.896,00",
        pis: "R$ 821,60",
        cofins: "R$ 3.792,00",
        csll: "R$ 1.264,00",
        otherRetention: "R$ 0,00",
        retentionTotal: "R$ 14.220,00",
        notes: "NF-e autorizada. Itens conferidos com o pedido de compras.",
      }));
      setAttachments(["nfe_2025000001895.pdf", "nfe_2025000001895.xml"]);
    } else if (selectedType === "CT-e") {
      setForm((current) => ({
        ...current,
        company: "TTAX Industrial",
        branch: "Filial 01",
        cnpj: "00.000.000/0001-00",
        partner: "Prestador exemplo Ltda.",
        legalName: "Prestador exemplo Ltda.",
        site: "Matriz · São Paulo/SP",
        requester: "Juliana Costa",
        number: "55102",
        series: "1",
        accessKey: "35250600055102000000000000000000000000000000",
        order: "4500099120",
        scheduleDate: "2025-06-25",
        scheduleWindow: "08:00 - 10:00",
        dock: "Doca 02 (Recepção Sul)",
        plate: "BRA2E19",
        driver: "Carlos Eduardo Silveira",
        origin: "São Paulo/SP",
        destination: "Rio de Janeiro/RJ",
        gross: "R$ 18.920,00",
        net: "R$ 16.640,00",
        iss: "R$ 2.270,40",
        pis: "R$ 123,00",
        cofins: "R$ 567,60",
        ir: "R$ 283,80",
        inss: "R$ 0,00",
        discount: "R$ 0,00",
        otherRetention: "R$ 0,00",
        retentionTotal: "R$ 2.280,00",
        notes: "CT-e de transferência com agenda na doca 02.",
      }));
      setAttachments(["cte_55102.pdf", "cte_55102.xml"]);
    } else if (selectedType === "MDF-e") {
      setForm((current) => ({
        ...current,
        company: "TTAX Logística",
        branch: "Filial 01",
        cnpj: "00.000.000/0001-00",
        partner: "Prestador exemplo Ltda.",
        legalName: "Prestador exemplo Ltda.",
        number: "3525060001847",
        series: "1",
        plate: "BRA2E19",
        driver: "Carlos Eduardo Silveira",
        contract: "12345678",
        origin: "SP",
        destination: "RJ",
        item: "CT-e 55102 · CT-e 55108",
        weight: "12.400 kg",
        volumes: "86",
        gross: "R$ 186.200,00",
        notes: "Manifesto com dois CT-es vinculados e veículo autorizado.",
      }));
      setAttachments(["mdfe_3525060001847.xml"]);
    } else {
      setForm((current) => ({
        ...current,
        company: "TTAX Logística",
        branch: "Filial 01",
        cnpj: "00.000.000/0001-00",
        partner: "Prestador exemplo Ltda.",
        legalName: "Prestador exemplo Ltda.",
        number: "352506000441",
        origin: "São Paulo/SP",
        destination: "Campinas/SP",
        contract: "CIOT-2025-441",
        plate: "BRA2E19",
        driver: "Carlos Eduardo Silveira",
        freight: "R$ 4.850,00",
        advance: "R$ 1.500,00",
        gross: "R$ 4.850,00",
        net: "R$ 3.350,00",
        inss: "R$ 0,00",
        ir: "R$ 0,00",
        notes: "Contrato de frete com adiantamento já registrado.",
      }));
      setAttachments(["ciot_352506000441.pdf"]);
    }
    setPartnerLocked(true);
    setXmlNotice("Dados preenchidos a partir do XML. Você ainda pode editar os campos.");
    setDraftLabel("Rascunho salvo há poucos segundos");
  };

  const classifyFile = (name: string): ImportFile => {
    const lower = name.toLowerCase();
    const digits = name.replace(/\D/g, "");
    const number = digits ? digits.slice(0, 9) : "—";
    let detected = selectedType;
    if (lower.includes("nfse")) detected = "NFS-e";
    else if (lower.includes("mdfe")) detected = "MDF-e";
    else if (lower.includes("cte")) detected = "CT-e";
    else if (lower.includes("nfe")) detected = "NF-e";
    else if (lower.includes("ciot")) detected = "CIOT";
    else if (!lower.endsWith(".xml")) detected = "—";

    let status: ImportStatus = "ready";
    if (lower.includes("inval") || lower.includes("corromp")) status = "invalid";
    else if (lower.includes("incomp") || lower.includes("sem-chave") || lower.includes("sem_chave")) status = "incomplete";
    else if (!lower.endsWith(".xml")) status = "unknown";
    else if (detected !== selectedType) status = "unknown";
    else if (
      lower.includes("dup") ||
      existingDocuments.some((doc) => doc.number.replace(/\D/g, "") === number && doc.type === selectedType)
    ) {
      status = "duplicate";
    }

    return {
      id: `${name}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      detectedType: detected,
      number,
      company: `${currentClientName} / ${currentBranch}`,
      status,
    };
  };

  const addImportNames = (names: string[]) => {
    const next = names.map(classifyFile);
    if (importMode === "xml") {
      const file = next[0];
      if (!file) return;
      if (file.status === "ready") {
        applyImportedDocument();
        setStep(1);
        setPhase("form");
        return;
      }
      setImportFiles([file]);
      return;
    }
    setImportFiles((current) => [...current, ...next]);
  };

  const loadSampleBatch = () => {
    const prefix = selectedType.toLowerCase().replace("-", "");
    addImportNames([
      `${prefix}_48291.xml`,
      `${prefix}_55102.xml`,
      `${prefix}_duplicado.xml`,
      `${prefix}_sem_chave.xml`,
      "arquivo_corrompido.xml",
      "canhoto_entrega.jpg",
      "nfe_198441.xml",
      `${prefix}_77021.xml`,
    ]);
  };

  const validImports = importFiles.filter((file) => file.status === "ready");
  const errorImports = importFiles.filter((file) => file.status === "invalid" || file.status === "unknown" || file.status === "incomplete");
  const duplicateImports = importFiles.filter((file) => file.status === "duplicate");

  const confirmImport = () => {
    if (validImports.length === 0) return;
    onDone(
      validImports.map((file) =>
        buildDocument({
          number: file.number,
          series: "1",
          valueGross: "R$ 0,00",
          valueNet: "R$ 0,00",
          status: "Em validação",
        })
      )
    );
  };

  const linkableDocs = useMemo(() => {
    const query = linkQuery.trim().toLowerCase();
    return existingDocuments.filter((doc) => {
      if (doc.type !== selectedType) return false;
      if (!query) return true;
      return (
        doc.number.toLowerCase().includes(query) ||
        doc.protocol.toLowerCase().includes(query) ||
        doc.partnerName.toLowerCase().includes(query)
      );
    });
  }, [existingDocuments, selectedType, linkQuery]);

  const confirmLink = () => {
    const source = existingDocuments.find((doc) => doc.id === linkedId);
    if (!source) return;
    onDone(
      buildDocument({
        number: source.number,
        series: source.series,
        company: source.company,
        branch: source.branch,
        partnerName: source.partnerName,
        partnerCnpj: source.partnerCnpj,
        valueGross: source.valueGross,
        valueNet: source.valueNet,
        orderNumber: source.orderNumber,
        status: "Em validação",
      })
    );
  };

  const saveDraft = () => setDraftLabel("Rascunho salvo agora");

  if (phase === "choose" || phase === "link") {
    return (
      <div className="overlay" onMouseDown={closeChooser}>
        <aside
          className="drawer w-full"
          style={{ width: "min(760px, 100%)" }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="drawer-head" style={{ minHeight: 64, padding: "14px 18px" }}>
            <div>
              <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>
                {phase === "link" ? "Vincular documento existente" : "Adicionar documento"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {phase === "link" ? `Escolha um ${selectedType} que já está no portal.` : "Selecione o tipo e a forma de inclusão."}
              </p>
            </div>
            <button type="button" className="icon-btn" onClick={closeChooser} aria-label="Fechar">
              <CloseIcon />
            </button>
          </div>

          <div className="drawer-body space-y-5" style={{ paddingTop: 16 }}>
            {phase === "choose" && (
              <>
                <section>
                  <h3 className="mb-2 text-sm font-semibold text-slate-800">Tipo de documento</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {ADD_TYPES.map((type) => {
                      const active = selectedType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setSelectedType(type.id)}
                          className={`rounded-lg border px-3 py-2.5 text-left ${
                            active ? "border-[#1769e0] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                          }`}
                        >
                          <span className={`block text-sm font-semibold ${active ? "text-[#1769e0]" : "text-slate-800"}`}>{type.id}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{type.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {selectedType && (
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Como deseja adicionar?</h3>
                    {singleMethod ? (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-sm font-semibold text-slate-800">{methods[0].title}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Este tipo possui somente esta forma de inclusão. {methods[0].description}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {methods.map((method) => {
                          const active = selectedMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedMethod(method.id)}
                              className={`block w-full rounded-lg border px-3 py-2.5 text-left ${
                                active ? "border-[#1769e0] bg-blue-50" : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <span className={`block text-sm font-semibold ${active ? "text-[#1769e0]" : "text-slate-800"}`}>
                                {method.title}
                              </span>
                              <span className="mt-0.5 block text-xs text-slate-500">{method.description}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {phase === "link" && (
              <div className="space-y-3">
                <input
                  value={linkQuery}
                  onChange={(event) => setLinkQuery(event.target.value)}
                  placeholder="Buscar número, protocolo ou parceiro"
                  className={inputClass}
                />
                <div className="space-y-2">
                  {linkableDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setLinkedId(doc.id)}
                      className={`block w-full rounded-lg border px-3 py-2.5 text-left ${
                        linkedId === doc.id ? "border-[#1769e0] bg-blue-50" : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-slate-800">
                        {doc.type} {doc.number}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {doc.protocol} · {doc.company} / {doc.branch}
                      </span>
                    </button>
                  ))}
                  {linkableDocs.length === 0 && <p className="text-sm text-slate-500">Nenhum documento deste tipo para vincular.</p>}
                </div>
              </div>
            )}
          </div>

          <div className="drawer-footer">
            <button type="button" className="text-sm font-semibold text-slate-600" onClick={phase === "link" ? () => setPhase("choose") : closeChooser}>
              {phase === "link" ? "Voltar" : "Cancelar"}
            </button>
            {phase === "choose" ? (
              <button
                type="button"
                disabled={!selectedType || !selectedMethod}
                onClick={continueFromChooser}
                className="h-10 rounded-lg bg-[#1769e0] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                disabled={!linkedId}
                onClick={confirmLink}
                className="h-10 rounded-lg bg-[#1769e0] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Vincular documento
              </button>
            )}
          </div>
        </aside>
      </div>
    );
  }

  if (phase === "import") {
    return (
      <div className="overlay" onMouseDown={onClose}>
        <aside className="drawer w-full" style={{ width: "min(760px, 100%)" }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head" style={{ minHeight: 72, padding: "14px 18px" }}>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>
              {importMode === "batch" ? "Importar vários documentos" : "Importar XML"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">Arraste os arquivos ou selecione no computador. Só os válidos entram no portal.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <button type="button" className="text-sm font-semibold text-[#1769e0]" onClick={openChooser}>
              Trocar tipo
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="drawer-body space-y-4" style={{ paddingTop: 16 }}>
            <div
              className={`flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed px-4 py-4 sm:flex-row sm:items-center ${
                dragOver ? "border-[#1769e0] bg-blue-50" : "border-[#8ec0ff] bg-[#f5f9ff]"
              }`}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                addImportNames([...event.dataTransfer.files].map((file) => file.name));
              }}
            >
              <div>
                <strong className="block text-sm font-semibold text-[#1769e0]">
                  {importMode === "batch" ? "Selecionar vários arquivos" : "Selecionar XML"}
                </strong>
                <span className="text-xs text-slate-500">XML autorizado de {selectedType}. Arraste aqui ou escolha no dispositivo.</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Selecionar {importMode === "batch" ? "arquivos" : "XML"}
                </button>
                {importMode === "batch" && (
                  <button type="button" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-[#1769e0]" onClick={loadSampleBatch}>
                    Carregar lote de exemplo
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={importMode === "xml" ? ".xml" : undefined}
                multiple={importMode === "batch"}
                className="hidden"
                onChange={(event) => {
                  addImportNames([...(event.target.files || [])].map((file) => file.name));
                  event.target.value = "";
                }}
              />
            </div>

            {importFiles.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    ["Arquivos selecionados", importFiles.length],
                    ["Válidos", validImports.length],
                    ["Com erro", errorImports.length],
                    ["Duplicados", duplicateImports.length],
                  ].map(([label, count]) => (
                    <div key={String(label)} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                      <span className="block text-[11px] text-slate-500">{label}</span>
                      <strong className="text-lg text-slate-900">{count}</strong>
                    </div>
                  ))}
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {importFiles.map((file) => (
                    <div key={file.id} className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-3 text-sm last:border-b-0">
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-slate-800">{file.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">
                          {file.detectedType} · {file.number} · {file.company}
                        </span>
                        <span className={`mt-1 block text-xs font-semibold ${file.status === "ready" ? "text-emerald-700" : "text-amber-700"}`}>
                          {STATUS_LABEL[file.status]}
                        </span>
                      </div>
                      <span className="flex shrink-0 gap-3">
                        {file.status !== "ready" && (
                          <button
                            type="button"
                            className="text-xs font-semibold text-[#1769e0]"
                            onClick={() =>
                              setImportFiles((current) =>
                                current.map((item) => (item.id === file.id ? { ...item, status: "ready", detectedType: selectedType } : item))
                              )
                            }
                          >
                            Tentar novamente
                          </button>
                        )}
                        <button
                          type="button"
                          className="text-xs font-semibold text-slate-500"
                          onClick={() => setImportFiles((current) => current.filter((item) => item.id !== file.id))}
                        >
                          Remover
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>

        <div className="drawer-footer">
          <button type="button" className="text-sm font-semibold text-slate-600" onClick={() => setPhase("choose")}>
            Voltar
          </button>
          <button
            type="button"
            disabled={validImports.length === 0}
            onClick={confirmImport}
            className="h-10 rounded-lg bg-[#1769e0] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            Importar {validImports.length} {validImports.length === 1 ? "documento" : "documentos"}
          </button>
        </div>
        </aside>
      </div>
    );
  }

  const partiesLocked = partnerLocked;

  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside
        className="drawer flex h-full w-full flex-col overflow-hidden bg-white"
        style={{ width: "min(980px, 100%)" }}
        onMouseDown={(event) => event.stopPropagation()}
      >
      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Portal TTAX · Inclusão de {selectedType}</span>
          <div className="flex items-center gap-3">
            <button type="button" className="text-sm font-semibold text-[#1769e0]" onClick={openChooser}>
              Trocar tipo de documento
            </button>
            <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
              <CloseIcon />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1 text-xs">
          {steps.map((label, index) => {
            const number = index + 1;
            const current = step === number;
            const past = step > number;
            return (
              <React.Fragment key={label}>
                <button type="button" className="flex items-center gap-2 whitespace-nowrap" onClick={() => setStep(number)}>
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                      current ? "bg-[#1769e0] text-white" : past ? "bg-emerald-600 text-white" : "border border-slate-300 text-slate-500"
                    }`}
                  >
                    {past ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                        <path d="m5 12 5 5L20 7" />
                      </svg>
                    ) : (
                      number
                    )}
                  </span>
                  <span className={current ? "font-bold text-[#1769e0]" : "text-slate-500"}>{label}</span>
                </button>
                {number < steps.length && <span className="h-px w-6 shrink-0 bg-slate-200" />}
              </React.Fragment>
            );
          })}
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6">
        <div className="space-y-6 pb-4">
          {step === 1 && (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{steps[0]}</h1>
                <p className="mt-1 text-sm text-slate-500">Preencha os dados ou use o XML apenas para adiantar o preenchimento.</p>
              </div>
              <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-dashed border-[#8ec0ff] bg-[#f5f9ff] px-4 py-4 sm:flex-row sm:items-center">
                <div>
                  <strong className="block text-sm font-semibold text-[#1769e0]">Importar dados da {selectedType}</strong>
                  <span className="text-xs text-slate-500">Envie o XML para preencher automaticamente os dados do documento.</span>
                </div>
                <button type="button" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700" onClick={() => formXmlRef.current?.click()}>
                  Selecionar XML
                </button>
                <input
                  ref={formXmlRef}
                  type="file"
                  accept=".xml"
                  className="hidden"
                  onChange={(event) => {
                    if (event.target.files?.length) applyImportedDocument();
                    event.target.value = "";
                  }}
                />
              </div>
              {xmlNotice && <p className="text-sm text-emerald-700">{xmlNotice}</p>}

              <section className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Partes envolvidas</h2>
                    <p className="text-xs text-slate-500">Empresa contratante e os dados do prestador.</p>
                  </div>
                  {partnerLocked ? (
                    <button type="button" className="text-sm font-semibold text-[#1769e0]" onClick={() => setPartnerLocked(false)}>
                      Alterar prestador
                    </button>
                  ) : (
                    <button type="button" className="text-sm font-semibold text-slate-600" onClick={() => setPartnerLocked(true)}>
                      Usar parceiro conectado
                    </button>
                  )}
                </div>
                {partnerLocked && <p className="text-xs font-semibold text-[#1769e0]">Dados do parceiro conectado</p>}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Empresa contratante/tomadora *">
                    <select className={inputClass} value={form.company} onChange={setField("company")}>
                      <option>Empresa exemplo</option>
                      <option>TTAX Energia S.A.</option>
                      <option>Transportadora Horizonte S.A.</option>
                    </select>
                  </Field>
                  <Field label="Filial *">
                    <select className={inputClass} value={form.branch} onChange={setField("branch")}>
                      <option>Filial 01</option>
                      <option>SP01 · São Paulo</option>
                      <option>Filial 02</option>
                      <option>Filial 03</option>
                    </select>
                  </Field>
                  <Field label="Prestador/Parceiro *">
                    <input className={partiesLocked ? lockedClass : inputClass} value={form.partner} readOnly={partiesLocked} onChange={setField("partner")} />
                  </Field>
                  <Field label="CNPJ do prestador *">
                    <input className={partiesLocked ? lockedClass : inputClass} value={form.cnpj} readOnly={partiesLocked} onChange={setField("cnpj")} />
                  </Field>
                  <Field label="Razão social">
                    <input className={partiesLocked ? lockedClass : inputClass} value={form.legalName} readOnly={partiesLocked} onChange={setField("legalName")} />
                  </Field>
                  <Field label="Estabelecimento">
                    <select className={inputClass} value={form.site} onChange={setField("site")}>
                      <option>Matriz · São Paulo/SP</option>
                      <option>Unidade Industrial · Betim/MG</option>
                      <option>Terminal Logístico · Santos/SP</option>
                    </select>
                  </Field>
                  <Field label="Requisitante *">
                    <select className={inputClass} value={form.requester} onChange={setField("requester")}>
                      <option>{currentUserProfile}</option>
                      <option>Juliana Costa</option>
                      <option>Analista Fiscal</option>
                      <option>Gestor de Suprimentos</option>
                    </select>
                  </Field>
                  <Field label="Centro / unidade responsável">
                    <select className={inputClass} value={form.center} onChange={setField("center")}>
                      <option>CC-4021 · Operações</option>
                      <option>CC-1020 · Logística e Frota</option>
                      <option>CC-9010 · Controladoria e Fiscal</option>
                    </select>
                  </Field>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                  Cadastro do prestador ativo e autorizado para esta empresa.
                </div>
              </section>

              <section className="space-y-4 border-t border-slate-200 pt-4">
                <h2 className="text-base font-bold text-slate-900">Informações da {selectedType}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Field label="Número do documento *">
                    <input className={inputClass} value={form.number} onChange={setField("number")} />
                  </Field>
                  <Field label="Série">
                    <input className={inputClass} value={form.series} onChange={setField("series")} />
                  </Field>
                  <Field label="Data de emissão *">
                    <input type="date" className={inputClass} value={form.issueDate} onChange={setField("issueDate")} />
                  </Field>
                  <Field label="Código de verificação / Chave">
                    <input className={inputClass} value={form.accessKey} onChange={setField("accessKey")} />
                  </Field>
                </div>
              </section>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{steps[1]}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedType === "NFS-e"
                    ? "Vincule um ou mais pedidos e valide as informações diretamente no SAP."
                    : selectedType === "NF-e"
                      ? "Confira os itens e o pedido de compras encontrado no SAP."
                      : selectedType === "CT-e"
                        ? "Confirme a janela, a doca e o pedido vinculado a este CT-e."
                        : selectedType === "MDF-e"
                          ? "Confirme o veículo e os documentos que compõem o manifesto."
                          : "Confirme a viagem, o contrato e o veículo do CIOT."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {selectedType === "CT-e" && (
                  <div className="space-y-3 md:col-span-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <strong className="text-sm text-slate-800">Agenda de recebimento</strong>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Janela disponível</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Field label="Data da agenda *">
                          <input type="date" className={inputClass} value={form.scheduleDate} onChange={setField("scheduleDate")} />
                        </Field>
                        <Field label="Janela *">
                          <select className={inputClass} value={form.scheduleWindow} onChange={setField("scheduleWindow")}>
                            <option>08:00 - 10:00</option>
                            <option>10:00 - 12:00</option>
                            <option>13:00 - 15:00</option>
                          </select>
                        </Field>
                        <Field label="Doca *">
                          <input className={inputClass} value={form.dock} onChange={setField("dock")} />
                        </Field>
                        <Field label="Placa">
                          <input className={inputClass} value={form.plate} onChange={setField("plate")} />
                        </Field>
                        <Field label="Motorista">
                          <input className={inputClass} value={form.driver} onChange={setField("driver")} />
                        </Field>
                        <Field label="Pedido vinculado *">
                          <input className={inputClass} value={form.order} onChange={setField("order")} />
                        </Field>
                        <Field label="Origem">
                          <input className={inputClass} value={form.origin} onChange={setField("origin")} />
                        </Field>
                        <Field label="Destino">
                          <input className={inputClass} value={form.destination} onChange={setField("destination")} />
                        </Field>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        <span className="text-emerald-700">Doca livre</span>
                        <span className="text-emerald-700">Pedido vinculado</span>
                        <span className="text-emerald-700">Motorista informado</span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedType === "NF-e" && (
                  <div className="space-y-3 md:col-span-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <strong className="text-sm text-slate-800">Item 1</strong>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Pedido encontrado</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Field label="Pedido SAP *">
                          <input className={inputClass} value={form.order} onChange={setField("order")} />
                        </Field>
                        <Field label="Item *">
                          <input className={inputClass} value={form.item} onChange={setField("item")} />
                        </Field>
                        <Field label="Quantidade *">
                          <input className={inputClass} value={form.qty} onChange={setField("qty")} />
                        </Field>
                        <Field label="NCM">
                          <input className={inputClass} value={form.sheet} onChange={setField("sheet")} />
                        </Field>
                        <Field label="Descrição">
                          <input className={inputClass} value={form.description} onChange={setField("description")} />
                        </Field>
                        <Field label="Valor do item *">
                          <input className={inputClass} value={form.gross} onChange={setField("gross")} />
                        </Field>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        <span className="text-emerald-700">Fornecedor compatível</span>
                        <span className="text-emerald-700">Item encontrado</span>
                        <span className="text-amber-600">Conferir quantidade</span>
                      </div>
                    </div>
                    <button type="button" className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700" onClick={() => setXmlNotice("Outro item pode ser incluído nesta mesma NF-e.")}>
                      + Adicionar item
                    </button>
                  </div>
                )}
                {selectedType === "MDF-e" && (
                  <div className="space-y-3 md:col-span-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <strong className="text-sm text-slate-800">Veículo e documentos</strong>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Veículo autorizado</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Field label="Placa do veículo *">
                          <input className={inputClass} value={form.plate} onChange={setField("plate")} />
                        </Field>
                        <Field label="RNTRC">
                          <input className={inputClass} value={form.contract} onChange={setField("contract")} />
                        </Field>
                        <Field label="Motorista">
                          <input className={inputClass} value={form.driver} onChange={setField("driver")} />
                        </Field>
                        <Field label="UF de origem *">
                          <input className={inputClass} value={form.origin} onChange={setField("origin")} />
                        </Field>
                        <Field label="UF de destino *">
                          <input className={inputClass} value={form.destination} onChange={setField("destination")} />
                        </Field>
                        <Field label="CT-es vinculados *">
                          <input className={inputClass} value={form.item} onChange={setField("item")} />
                        </Field>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        <span className="text-emerald-700">Documentos vinculados</span>
                        <span className="text-emerald-700">Percurso válido</span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedType === "CIOT" && (
                  <div className="space-y-3 md:col-span-2">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <strong className="text-sm text-slate-800">Contrato de viagem</strong>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Contrato ativo</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Field label="Origem *">
                          <input className={inputClass} value={form.origin} onChange={setField("origin")} />
                        </Field>
                        <Field label="Destino *">
                          <input className={inputClass} value={form.destination} onChange={setField("destination")} />
                        </Field>
                        <Field label="Contrato *">
                          <input className={inputClass} value={form.contract} onChange={setField("contract")} />
                        </Field>
                        <Field label="Placa *">
                          <input className={inputClass} value={form.plate} onChange={setField("plate")} />
                        </Field>
                        <Field label="Motorista">
                          <input className={inputClass} value={form.driver} onChange={setField("driver")} />
                        </Field>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        <span className="text-emerald-700">Placa compatível</span>
                        <span className="text-emerald-700">Viagem informada</span>
                      </div>
                    </div>
                  </div>
                )}
                {selectedType === "NFS-e" && (
                  <div className="md:col-span-2 space-y-3">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <strong className="text-sm text-slate-800">Vínculo 1</strong>
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Pedido encontrado</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Field label="Pedido *">
                          <input className={inputClass} value={form.order} onChange={setField("order")} />
                        </Field>
                        <Field label="Item *">
                          <input className={inputClass} value={form.item} onChange={setField("item")} />
                        </Field>
                        <Field label="Folha de serviço *">
                          <input className={inputClass} value={form.sheet} onChange={setField("sheet")} />
                        </Field>
                        <Field label="Descrição">
                          <input className={inputClass} value={form.description} onChange={setField("description")} />
                        </Field>
                        <Field label="Saldo disponível">
                          <input className={lockedClass} value={form.balance} readOnly />
                        </Field>
                        <Field label="Valor vinculado *">
                          <input className={inputClass} value={form.linkedValue} onChange={setField("linkedValue")} />
                        </Field>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        <span className="text-emerald-700">Fornecedor compatível</span>
                        <span className="text-emerald-700">Folha liberada</span>
                        <span className="text-amber-600">Saldo insuficiente</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                      onClick={() => setXmlNotice("Outro vínculo pode ser incluído nesta mesma nota.")}
                    >
                      + Adicionar pedido ou folha
                    </button>
                    <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm md:grid-cols-4">
                      <div><span className="block text-xs text-slate-500">Valor da NFS-e</span><strong>{form.gross || "—"}</strong></div>
                      <div><span className="block text-xs text-slate-500">Valor distribuído</span><strong>{form.linkedValue || "—"}</strong></div>
                      <div><span className="block text-xs text-slate-500">Valor restante</span><strong className="text-red-600">R$ 2.350,00</strong></div>
                      <div><span className="block text-xs text-slate-500">Diferença</span><strong className="text-red-600">R$ 2.350,00</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">{steps[2]}</h1>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedType === "NFS-e"
                    ? "Confira os valores extraídos e as retenções calculadas."
                    : "Confira os totais desta etapa antes de anexar os comprovantes."}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {selectedType === "MDF-e" ? (
                  <>
                    <Field label="Peso total">
                      <input className={inputClass} value={form.weight} onChange={setField("weight")} />
                    </Field>
                    <Field label="Volumes">
                      <input className={inputClass} value={form.volumes} onChange={setField("volumes")} />
                    </Field>
                    <Field label="Valor da carga">
                      <input className={inputClass} value={form.gross} onChange={setField("gross")} />
                    </Field>
                  </>
                ) : selectedType === "CIOT" ? (
                  <>
                    <Field label="Valor do frete *">
                      <input className={inputClass} value={form.freight} onChange={setField("freight")} />
                    </Field>
                    <Field label="Adiantamento">
                      <input className={inputClass} value={form.advance} onChange={setField("advance")} />
                    </Field>
                    <Field label="Saldo">
                      <input className={inputClass} value={form.net} onChange={setField("net")} />
                    </Field>
                  </>
                ) : selectedType === "NFS-e" ? (
                  <>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 md:col-span-3">
                      <span>Extraído do XML</span>
                      <span>Calculado</span>
                      <span>Consultado no SAP</span>
                    </div>
                    {(
                      [
                        ["Valor bruto", "gross"],
                        ["Descontos", "discount"],
                        ["Deduções", "deduction"],
                        ["ISS (2%)", "iss"],
                        ["INSS", "inss"],
                        ["IR (1,5%)", "ir"],
                        ["PIS (0,65%)", "pis"],
                        ["COFINS (3%)", "cofins"],
                        ["CSLL (1%)", "csll"],
                        ["Outras retenções", "otherRetention"],
                        ["Total de retenções", "retentionTotal"],
                        ["Valor líquido", "net"],
                      ] as const
                    ).map(([label, key]) => (
                      <Field key={key} label={label}>
                        <input className={lockedClass} value={form[key]} readOnly />
                      </Field>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-4 text-xs text-slate-500 md:col-span-3">
                      <span>Extraído do XML</span>
                      <span>Calculado</span>
                    </div>
                    {(selectedType === "CT-e"
                      ? ([
                          ["Valor do frete", "gross"],
                          ["Pedágio", "otherRetention"],
                          ["ICMS", "iss"],
                          ["PIS", "pis"],
                          ["COFINS", "cofins"],
                          ["IR", "ir"],
                          ["Total de tributos", "retentionTotal"],
                          ["Valor líquido", "net"],
                        ] as const)
                      : ([
                          ["Valor dos produtos", "gross"],
                          ["Descontos", "discount"],
                          ["ICMS", "iss"],
                          ["IPI", "inss"],
                          ["PIS", "pis"],
                          ["COFINS", "cofins"],
                          ["IR", "ir"],
                          ["CSLL", "csll"],
                          ["Total de tributos", "retentionTotal"],
                          ["Valor líquido", "net"],
                        ] as const)
                    ).map(([label, key]) => (
                      <Field key={key} label={label}>
                        <input className={inputClass} value={form[key]} onChange={setField(key)} />
                      </Field>
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Anexos e evidências</h1>
                <p className="mt-1 text-sm text-slate-500">Adicione os documentos necessários para comprovar este {selectedType}.</p>
              </div>
              <div className="rounded-xl border border-dashed border-[#8ec0ff] bg-[#f5f9ff] px-4 py-8 text-center">
                  <strong className="block text-sm text-[#1769e0]">Arraste os arquivos para cá</strong>
                  <p className="mt-1 text-xs text-slate-500">ou selecione da câmera, galeria ou dispositivo</p>
                  <button
                    type="button"
                    className="mt-3 h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700"
                    onClick={() => setAttachments((current) => [...current, `anexo_${current.length + 1}.pdf`])}
                  >
                    Selecionar arquivos
                  </button>
                  <p className="mt-2 text-[11px] text-slate-400">PDF, XML, PNG ou JPG · Máximo de 20 MB por arquivo</p>
                </div>
              <div className="space-y-2">
                {attachments.map((file) => (
                  <div key={file} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                    <span>{file}</span>
                    <button type="button" className="text-xs font-semibold text-slate-500" onClick={() => setAttachments((current) => current.filter((item) => item !== file))}>
                      Remover
                    </button>
                  </div>
                ))}
                {attachments.length === 0 && <p className="text-sm text-slate-500">Nenhum anexo incluído.</p>}
              </div>
              <Field label="Observações">
                <input className={inputClass} value={form.notes} onChange={setField("notes")} />
              </Field>
            </>
          )}

          {step === 5 && (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Revise antes de enviar</h1>
                <p className="mt-1 text-sm text-slate-500">Confira os dados e as validações realizadas.</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <strong className="block">Documento pronto para envio</strong>
                <span>As informações obrigatórias foram preenchidas. Uma divergência será encaminhada para análise.</span>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-4 text-sm">
                  <strong className="mb-2 block text-slate-800">Empresa e documento</strong>
                  <div className="text-xs text-slate-500">Empresa</div>
                  <div className="font-semibold">{form.company} · {form.branch}</div>
                  <div className="mt-2 text-xs text-slate-500">{selectedType}</div>
                  <div className="font-semibold">{form.number || "—"}</div>
                  <div className="mt-2 text-xs text-slate-500">Valor</div>
                  <div className="font-semibold text-[#1769e0]">{form.net || form.freight || form.gross || "—"}</div>
                  <button type="button" className="mt-3 text-sm font-semibold text-[#1769e0]" onClick={() => setStep(1)}>Editar dados</button>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm">
                  <strong className="mb-2 block text-slate-800">{selectedType === "CT-e" ? "Agenda e vínculos" : selectedType === "MDF-e" ? "Veículo e carga" : selectedType === "CIOT" ? "Viagem e contrato" : "Pedido e validações"}</strong>
                  <div className="text-xs text-slate-500">{selectedType === "CT-e" ? "Agenda" : selectedType === "MDF-e" || selectedType === "CIOT" ? "Percurso" : "Pedido / item"}</div>
                  <div className="font-semibold">
                    {selectedType === "CT-e"
                      ? `${form.scheduleDate || "Sem data"} · ${form.scheduleWindow}`
                      : selectedType === "MDF-e"
                        ? `${form.plate || "—"} · ${form.origin || "—"} → ${form.destination || "—"}`
                        : selectedType === "CIOT"
                          ? `${form.contract || "—"} · ${form.origin || "—"} → ${form.destination || "—"}`
                          : `${form.order || "—"} / ${form.item || "—"}`}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{selectedType === "NFS-e" ? "Folha" : "Referência"}</div>
                  <div className="font-semibold">{selectedType === "NFS-e" ? `${form.sheet || "—"} · Liberada` : form.order || form.item || form.plate || "—"}</div>
                  <div className="mt-2 text-xs text-slate-500">Validação SAP</div>
                  <div className="font-semibold">1 atenção encontrada</div>
                  <button type="button" className="mt-3 text-sm font-semibold text-[#1769e0]" onClick={() => setStep(2)}>Revisar vínculo</button>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm">
                  <strong className="mb-2 block text-slate-800">Anexos</strong>
                  <div className="text-xs text-slate-500">PDF</div>
                  <div className="font-semibold">{attachments.some((file) => file.endsWith(".pdf")) ? "Anexado" : "Nenhum"}</div>
                  <div className="mt-2 text-xs text-slate-500">Arquivo XML</div>
                  <div className="font-semibold">{attachments.some((file) => file.endsWith(".xml")) ? "Anexado" : "Nenhum"}</div>
                  <button type="button" className="mt-3 text-sm font-semibold text-[#1769e0]" onClick={() => setStep(4)}>Gerenciar anexos</button>
                </div>
              </div>
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
                <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="accent-[#1769e0]" />
                Confirmo que os dados informados e os documentos anexados são verdadeiros.
              </label>
            </>
          )}

        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <button type="button" className="text-sm font-semibold text-slate-600" onClick={onClose}>
            Cancelar
          </button>
          <span className="text-xs font-medium text-emerald-700">{draftLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          {step > 1 && (
            <button type="button" className="h-10 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700" onClick={() => setStep((current) => current - 1)}>
              Voltar
            </button>
          )}
          <button type="button" className="text-sm font-semibold text-[#1769e0]" onClick={saveDraft}>
            Salvar rascunho
          </button>
          <button
            type="button"
            disabled={step === 5 && !confirmed}
            onClick={() => (step < 5 ? setStep((current) => current + 1) : finishForm())}
            className="h-10 rounded-lg bg-[#1769e0] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {step === 5 ? `Confirmar e enviar ${selectedType}` : "Continuar"}
          </button>
        </div>
      </footer>
      </aside>
    </div>
  );
}
