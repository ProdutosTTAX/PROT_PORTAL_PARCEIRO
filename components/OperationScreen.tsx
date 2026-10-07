import React, { useMemo, useState } from "react";
import { ScreenToolButtons } from "./ScreenToolButtons";
import { ColumnConfigDrawer, FilterDrawer, FilterField } from "./ScreenDrawers";

type QueueStatus = "Sucesso" | "Processando" | "Fila SAP";

interface QueueRow {
  id: string;
  status: QueueStatus;
  lot: string;
  doc: string;
  origin: string;
  destination: string;
  partner: string;
  company: string;
  wait: string;
  sync: string;
  stage: string;
  stageTone: "green" | "blue";
  bucket: "ok" | "pending" | "running";
}

const ROWS: QueueRow[] = [
  { id: "1", status: "Sucesso", lot: "Lote #48921", doc: "2025000001899", origin: "EASY4 Hub", destination: "SAP S/4HANA (PRD)", partner: "TechClima Sistemas", company: "TTAX Industrial", wait: "4 seg", sync: "Hoje, 11:28", stage: "Integrado no ERP", stageTone: "green", bucket: "ok" },
  { id: "2", status: "Processando", lot: "Lote #48920", doc: "2025000001898", origin: "SEFAZ SP", destination: "SAP S/4HANA (PRD)", partner: "Almeida Serviços", company: "TTAX Energia", wait: "14 seg", sync: "Hoje, 11:27", stage: "Validação mTLS", stageTone: "blue", bucket: "running" },
  { id: "3", status: "Sucesso", lot: "Lote #48919", doc: "2025000001897", origin: "Prefeitura RJ", destination: "SAP ECC (HOM)", partner: "ProEng Engenharia", company: "TTAX Energia", wait: "8 seg", sync: "Hoje, 11:25", stage: "Integrado no ERP", stageTone: "green", bucket: "ok" },
  { id: "4", status: "Fila SAP", lot: "Lote #48918", doc: "2025000001896", origin: "EASY4 Hub", destination: "SAP ECC (HOM)", partner: "ViaSul Manutenção", company: "TTAX Logística", wait: "52 seg", sync: "Hoje, 11:22", stage: "Aguardando Job RFC", stageTone: "blue", bucket: "pending" },
  { id: "5", status: "Sucesso", lot: "Lote #48917", doc: "2025000001895", origin: "EASY4 Hub", destination: "SAP S/4HANA (PRD)", partner: "Consultores Associados", company: "TTAX Industrial", wait: "6 seg", sync: "Hoje, 11:19", stage: "Integrado no ERP", stageTone: "green", bucket: "ok" },
  { id: "6", status: "Sucesso", lot: "Lote #48916", doc: "2025000001894", origin: "Prefeitura BH", destination: "SAP S/4HANA (PRD)", partner: "SegurPro Vigilância", company: "TTAX Logística", wait: "5 seg", sync: "Hoje, 11:15", stage: "Integrado no ERP", stageTone: "green", bucket: "ok" },
];

const OP_COLUMNS = [
  { key: "status", label: "Status", required: true },
  { key: "doc", label: "NFS-e / lote", required: true },
  { key: "origin", label: "Origem" },
  { key: "destination", label: "Destino (SAP)" },
  { key: "partner", label: "Prestador" },
  { key: "company", label: "Empresa" },
  { key: "wait", label: "Tempo fila" },
  { key: "sync", label: "Sincronização" },
  { key: "stage", label: "Etapa" },
];

const EMPTY_OP_FILTERS = { status: "all", company: "all", origin: "all" };

const APPROVALS = [
  { id: "a1", doc: "CT-e 55102", reason: "Agenda fora da janela padrão", owner: "Operação SP01", since: "há 18 min" },
  { id: "a2", doc: "NFS-e 2025000001755", reason: "Retenção divergente do pedido", owner: "Fiscal Energia", since: "há 42 min" },
  { id: "a3", doc: "NF-e 2025000001701", reason: "Item sem saldo no pedido SAP", owner: "Compras Industrial", since: "há 1 h" },
];

const MATCHES = [
  { id: "c1", doc: "51000842", portal: "R$ 126.400,00", sap: "R$ 126.400,00", state: "Conciliado" },
  { id: "c2", doc: "51000843", portal: "R$ 32.180,90", sap: "R$ 32.180,90", state: "Conciliado" },
  { id: "c3", doc: "51000844", portal: "R$ 18.920,00", sap: "—", state: "Sem partida" },
];

function Pill({ status }: { status: QueueStatus }) {
  const tone =
    status === "Sucesso"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Processando"
        ? "bg-blue-50 text-[#1769e0]"
        : "bg-amber-50 text-amber-700";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function OperationScreen() {
  const [tab, setTab] = useState<"Monitor" | "Aprovações" | "Conciliação">("Monitor");
  const [bucket, setBucket] = useState<"Todos" | "Pendentes" | "Em processamento">("Todos");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [tool, setTool] = useState<null | "config" | "filters">(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [draftFilters, setDraftFilters] = useState(EMPTY_OP_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_OP_FILTERS);
  const show = (key: string) => !hiddenColumns.includes(key);
  const companies = [...new Set(ROWS.map((row) => row.company))];
  const origins = [...new Set(ROWS.map((row) => row.origin))];
  const chips = [
    appliedFilters.company !== "all" ? { key: "company" as const, label: appliedFilters.company } : null,
    appliedFilters.status !== "all" ? { key: "status" as const, label: appliedFilters.status } : null,
    appliedFilters.origin !== "all" ? { key: "origin" as const, label: appliedFilters.origin } : null,
  ].filter((chip): chip is { key: "company" | "status" | "origin"; label: string } => Boolean(chip));

  const rows = useMemo(() => {
    return ROWS.filter((row) => {
      if (appliedFilters.status !== "all" && row.status !== appliedFilters.status) return false;
      if (appliedFilters.company !== "all" && row.company !== appliedFilters.company) return false;
      if (appliedFilters.origin !== "all" && row.origin !== appliedFilters.origin) return false;
      if (bucket === "Pendentes" && row.bucket !== "pending") return false;
      if (bucket === "Em processamento" && row.bucket !== "running") return false;
      const blob = `${row.doc} ${row.lot} ${row.partner} ${row.company}`.toLowerCase();
      return blob.includes(query.trim().toLowerCase());
    }).slice(0, pageSize);
  }, [appliedFilters, bucket, query, pageSize]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="screen-header shrink-0">
        <div className="screen-header-copy">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1769e0]">Central operacional</span>
          <h1 className="font-bold leading-tight text-slate-900" style={{ fontSize: 22, lineHeight: 1.2 }}>Operação e exceções</h1>
        </div>
        <div className="flex max-w-full flex-col items-end gap-2">
          <div className="page-toolbar">
            <ScreenToolButtons configureActive={tool === "config"} filterActive={tool === "filters" || chips.length > 0} onConfigure={() => setTool("config")} onFilter={() => { setDraftFilters(appliedFilters); setTool("filters"); }} />
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1769e0] px-3.5 text-sm font-semibold text-white">
              <DownloadIcon />
              Exportar relatório
            </button>
          </div>
          {chips.length > 0 && <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-slate-500">
            <span>Filtros aplicados:</span>
            {chips.map((chip) => (
              <button key={chip.key} type="button" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600" onClick={() => setAppliedFilters((current) => ({ ...current, [chip.key]: "all" }))}>
                {chip.label}
                <span aria-hidden="true">×</span>
              </button>
            ))}
            <button type="button" className="font-semibold text-[#1769e0]" onClick={() => setAppliedFilters(EMPTY_OP_FILTERS)}>Limpar todos</button>
          </div>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-6 border-b border-slate-200">
        <button type="button" onClick={() => setTab("Monitor")} className={`relative py-2.5 text-sm font-semibold ${tab === "Monitor" ? "text-[#1769e0]" : "text-slate-500"}`}>
          Monitor
          {tab === "Monitor" && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1769e0]" />}
        </button>
        <button type="button" onClick={() => setTab("Aprovações")} className={`relative py-2.5 text-sm font-semibold ${tab === "Aprovações" ? "text-[#1769e0]" : "text-slate-500"}`}>
          Aprovações
          <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[10px] text-amber-700">3</span>
          {tab === "Aprovações" && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1769e0]" />}
        </button>
        <button type="button" onClick={() => setTab("Conciliação")} className={`relative inline-flex items-center gap-1 py-2.5 text-sm font-semibold ${tab === "Conciliação" ? "text-[#1769e0]" : "text-slate-500"}`}>
          Conciliação
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          {tab === "Conciliação" && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[#1769e0]" />}
        </button>
      </div>

      {tab === "Monitor" && (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              ["Documentos processados", "1.428", "99,2% taxa de sucesso", "text-[#1769e0]"],
              ["Dentro do SLA", "94,8%", "+2,1% nesta semana", "text-emerald-600"],
              ["Tempo médio na fila", "18 seg", "Meta até 60 seg", "text-[#1769e0]"],
              ["STP (Straight-Through)", "91,6%", "Sem toque manual", "text-[#1769e0]"],
            ].map(([label, value, hint, tone]) => (
              <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <span className="text-xs text-slate-500">{label}</span>
                <strong className={`mt-1 block text-[28px] leading-none ${tone}`}>{value}</strong>
                <span className="mt-1 block text-[11px] text-slate-400">{hint}</span>
              </div>
            ))}
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-100 px-3 py-2">
              <div className="flex h-9 min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></svg>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por número, protocolo, pedido" className="h-full w-full bg-transparent text-sm outline-none" />
              </div>
              {(
                [
                  ["Todos", ROWS.length],
                  ["Pendentes", ROWS.filter((row) => row.bucket === "pending").length],
                  ["Em processamento", ROWS.filter((row) => row.bucket === "running").length],
                ] as const
              ).map(([label, count]) => (
                <button key={label} type="button" onClick={() => setBucket(label)} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${bucket === label ? "bg-[#e8f1fc] text-[#1769e0]" : "text-slate-500"}`}>
                  {label} <span className="text-slate-400">{count}</span>
                </button>
              ))}
              <label className="ml-auto flex items-center gap-2 text-xs text-slate-500">
                Registros por página
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700">
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </label>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[1100px] text-left text-xs">
                <thead className="sticky top-0 bg-white text-[10px] uppercase tracking-wide text-slate-400">
                  <tr className="border-b border-slate-100">
                    {OP_COLUMNS.filter((column) => show(column.key)).map((column) => (
                      <th key={column.key} className="px-3 py-2 font-semibold">{column.label}</th>
                    ))}
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      {show("status") && <td className="px-3 py-3"><Pill status={row.status} /></td>}
                      {show("doc") && <td className="px-3 py-3">
                        <strong className="block text-slate-800">{row.doc}</strong>
                        <span className="text-[11px] text-slate-400">{row.lot}</span>
                      </td>}
                      {show("origin") && <td className="px-3 py-3 text-slate-600">{row.origin}</td>}
                      {show("destination") && <td className="px-3 py-3 font-semibold text-slate-700">{row.destination}</td>}
                      {show("partner") && <td className="px-3 py-3 text-slate-700">{row.partner}</td>}
                      {show("company") && <td className="px-3 py-3 text-slate-700">{row.company}</td>}
                      {show("wait") && <td className="px-3 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v6l4 2" /></svg>
                          {row.wait}
                        </span>
                      </td>}
                      {show("sync") && <td className="px-3 py-3 text-slate-600">{row.sync}</td>}
                      {show("stage") && <td className={`px-3 py-3 font-semibold ${row.stageTone === "green" ? "text-emerald-600" : "text-[#1769e0]"}`}>
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${row.stageTone === "green" ? "bg-emerald-500" : "bg-[#1769e0]"}`} />
                          {row.stage}
                        </span>
                      </td>}
                      <td className="px-3 py-3 text-slate-300">›</td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={OP_COLUMNS.length + 1} className="px-3 py-8 text-center text-sm text-slate-500">Nenhum documento nesta fila.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "Aprovações" && (
        <div className="min-h-0 flex-1 space-y-2 overflow-auto">
          {APPROVALS.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div>
                <strong className="text-sm text-slate-800">{item.doc}</strong>
                <p className="text-xs text-slate-500">{item.reason}</p>
                <span className="text-[11px] text-slate-400">{item.owner} · {item.since}</span>
              </div>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">Aguardando</span>
            </div>
          ))}
        </div>
      )}

      {tab === "Conciliação" && (
        <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-[10px] uppercase text-slate-400">
              <tr>
                {["Documento SAP", "Valor no portal", "Partida SAP", "Situação"].map((head) => (
                  <th key={head} className="px-3 py-2 font-semibold">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATCHES.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-3 py-3 font-semibold text-slate-800">{row.doc}</td>
                  <td className="px-3 py-3">{row.portal}</td>
                  <td className="px-3 py-3">{row.sap}</td>
                  <td className="px-3 py-3 font-semibold text-[#1769e0]">{row.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {tool === "config" && (
        <ColumnConfigDrawer
          hint="Escolha as colunas visíveis na fila de operação."
          items={OP_COLUMNS}
          hidden={hiddenColumns}
          onClose={() => setTool(null)}
          onSave={(next) => {
            setHiddenColumns(next);
            setTool(null);
          }}
        />
      )}
      {tool === "filters" && (
        <FilterDrawer
          title="Filtrar operação"
          onClose={() => setTool(null)}
          onClear={() => {
            setDraftFilters(EMPTY_OP_FILTERS);
            setAppliedFilters(EMPTY_OP_FILTERS);
          }}
          onApply={() => {
            setAppliedFilters(draftFilters);
            setTool(null);
          }}
        >
          <FilterField label="Status" value={draftFilters.status} onChange={(status) => setDraftFilters((current) => ({ ...current, status }))} options={[{ value: "all", label: "Todos os status" }, { value: "Sucesso", label: "Sucesso" }, { value: "Processando", label: "Processando" }, { value: "Fila SAP", label: "Fila SAP" }]} />
          <FilterField label="Empresa" value={draftFilters.company} onChange={(company) => setDraftFilters((current) => ({ ...current, company }))} options={[{ value: "all", label: "Todas as empresas" }, ...companies.map((company) => ({ value: company, label: company }))]} />
          <FilterField label="Origem" value={draftFilters.origin} onChange={(origin) => setDraftFilters((current) => ({ ...current, origin }))} options={[{ value: "all", label: "Todas as origens" }, ...origins.map((origin) => ({ value: origin, label: origin }))]} />
        </FilterDrawer>
      )}
    </div>
  );
}
