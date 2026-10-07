import React, { useMemo, useState } from "react";
import { ScreenToolButtons } from "./ScreenToolButtons";
import { ColumnConfigDrawer, FilterDrawer, FilterField } from "./ScreenDrawers";

interface PaymentRow {
  id: string;
  number: string;
  protocol: string;
  company: string;
  partner: string;
  gross: string;
  retention: string;
  net: string;
  netTone: string;
  due: string;
  forecast: string;
  sap: string;
  status: "Programado" | "Pago";
}

const PAY_COLUMNS = [
  { key: "number", label: "NFS-e", required: true },
  { key: "company", label: "Empresa pagadora" },
  { key: "partner", label: "Prestador" },
  { key: "gross", label: "Valor bruto" },
  { key: "retention", label: "Retenções" },
  { key: "net", label: "Valor líquido" },
  { key: "due", label: "Vencimento" },
  { key: "forecast", label: "Previsão / efetiva" },
  { key: "sap", label: "Documento SAP" },
  { key: "status", label: "Status", required: true },
];

const EMPTY_PAY_FILTERS = { status: "all", company: "all" };

const ROWS: PaymentRow[] = [
  { id: "1", number: "2025000001812", protocol: "TTX-2025-04876", company: "TTAX Industrial", partner: "ProEng Engenharia", gross: "R$ 126.400,00", retention: "R$ 2.480,00", net: "R$ 126.400,00", netTone: "text-[#1769e0]", due: "25/06/2025", forecast: "25/06/2025", sap: "51000842", status: "Programado" },
  { id: "2", number: "2025000001755", protocol: "TTX-2025-04822", company: "TTAX Energia", partner: "Almeida Serviços Ltda.", gross: "R$ 32.180,90", retention: "R$ 3.480,00", net: "R$ 32.180,90", netTone: "text-emerald-600", due: "26/06/2025", forecast: "Em programação", sap: "51000843", status: "Programado" },
  { id: "3", number: "2025000001701", protocol: "TTX-2025-04798", company: "TTAX Logística", partner: "ViaSul Manutenção", gross: "R$ 18.920,00", retention: "R$ 4.480,00", net: "R$ 18.920,00", netTone: "text-[#1769e0]", due: "27/06/2025", forecast: "—", sap: "51000844", status: "Programado" },
  { id: "4", number: "2025000001639", protocol: "TTX-2025-04760", company: "TTAX Industrial", partner: "TechClima Sistemas", gross: "R$ 8.445,70", retention: "R$ 5.480,00", net: "R$ 8.445,70", netTone: "text-[#1769e0]", due: "28/06/2025", forecast: "17/06/2025", sap: "51000845", status: "Pago" },
];

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

export function PaymentsScreen() {
  const [bucket, setBucket] = useState<"Todos" | "Pendentes" | "Em processamento">("Todos");
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [tool, setTool] = useState<null | "config" | "filters">(null);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
  const [draftFilters, setDraftFilters] = useState(EMPTY_PAY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_PAY_FILTERS);
  const show = (key: string) => !hiddenColumns.includes(key);
  const companies = [...new Set(ROWS.map((row) => row.company))];
  const chips = [
    appliedFilters.company !== "all" ? { key: "company" as const, label: appliedFilters.company } : null,
    appliedFilters.status !== "all" ? { key: "status" as const, label: appliedFilters.status } : null,
  ].filter((chip): chip is { key: "company" | "status"; label: string } => Boolean(chip));

  const rows = useMemo(() => {
    return ROWS.filter((row) => {
      if (appliedFilters.status !== "all" && row.status !== appliedFilters.status) return false;
      if (appliedFilters.company !== "all" && row.company !== appliedFilters.company) return false;
      if (bucket === "Pendentes" && row.status !== "Programado") return false;
      if (bucket === "Em processamento" && row.forecast !== "Em programação") return false;
      const blob = `${row.number} ${row.protocol} ${row.partner} ${row.sap}`.toLowerCase();
      return blob.includes(query.trim().toLowerCase());
    }).slice(0, pageSize);
  }, [appliedFilters, bucket, query, pageSize]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="screen-header shrink-0">
        <div className="screen-header-copy">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1769e0]">Financeiro</span>
          <h1 className="font-bold leading-tight text-slate-900" style={{ fontSize: 22, lineHeight: 1.2 }}>Pagamentos</h1>
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
            <button type="button" className="font-semibold text-[#1769e0]" onClick={() => setAppliedFilters(EMPTY_PAY_FILTERS)}>Limpar todos</button>
          </div>}
        </div>
      </div>

      <div className="grid shrink-0 items-center gap-6 rounded-2xl bg-[#0b1f3a] px-6 py-5 text-white md:grid-cols-[1fr_1fr_1.1fr]">
        <div>
          <span className="text-xs text-slate-300">Valor líquido a receber</span>
          <strong className="mt-1 block text-[28px] leading-none">R$ 182.400,00</strong>
          <span className="mt-2 block text-[11px] text-slate-400">4 pagamentos programados</span>
        </div>
        <div>
          <span className="text-xs text-slate-300">Recebido neste mês</span>
          <strong className="mt-1 block text-[28px] leading-none">R$ 641.280,70</strong>
          <span className="mt-2 block text-[11px] text-emerald-300">8,4% acima do mês</span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-[#163154] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3d66] text-slate-200">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
          </span>
          <div>
            <span className="text-xs text-slate-300">Próximo pagamento</span>
            <strong className="mt-1 block text-sm">25 de junho · R$ 126.400,00</strong>
          </div>
        </div>
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
              ["Pendentes", ROWS.filter((row) => row.status === "Programado").length],
              ["Em processamento", ROWS.filter((row) => row.forecast === "Em programação").length],
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
                {PAY_COLUMNS.filter((column) => show(column.key)).map((column) => (
                  <th key={column.key} className="px-3 py-2 font-semibold">{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  {show("number") && <td className="px-3 py-3">
                    <strong className="block text-slate-800">{row.number}</strong>
                    <span className="text-[11px] text-slate-400">{row.protocol}</span>
                  </td>}
                  {show("company") && <td className="px-3 py-3 text-slate-700">{row.company}</td>}
                  {show("partner") && <td className="px-3 py-3 text-slate-700">{row.partner}</td>}
                  {show("gross") && <td className="px-3 py-3 text-slate-700">{row.gross}</td>}
                  {show("retention") && <td className="px-3 py-3 text-slate-600">{row.retention}</td>}
                  {show("net") && <td className={`px-3 py-3 font-semibold ${row.netTone}`}>{row.net}</td>}
                  {show("due") && <td className="px-3 py-3 text-slate-600">{row.due}</td>}
                  {show("forecast") && <td className="px-3 py-3 text-slate-600">{row.forecast}</td>}
                  {show("sap") && <td className="px-3 py-3 font-mono text-slate-600">{row.sap}</td>}
                  {show("status") && <td className="px-3 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.status === "Pago" ? "bg-emerald-50 text-emerald-700" : "bg-violet-50 text-violet-700"}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {row.status}
                    </span>
                  </td>}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-3 py-8 text-center text-sm text-slate-500">Nenhum pagamento encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {tool === "config" && (
        <ColumnConfigDrawer
          hint="Escolha as colunas visíveis na lista de pagamentos."
          items={PAY_COLUMNS}
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
          title="Filtrar pagamentos"
          onClose={() => setTool(null)}
          onClear={() => {
            setDraftFilters(EMPTY_PAY_FILTERS);
            setAppliedFilters(EMPTY_PAY_FILTERS);
          }}
          onApply={() => {
            setAppliedFilters(draftFilters);
            setTool(null);
          }}
        >
          <FilterField label="Status" value={draftFilters.status} onChange={(status) => setDraftFilters((current) => ({ ...current, status }))} options={[{ value: "all", label: "Todos os status" }, { value: "Programado", label: "Programado" }, { value: "Pago", label: "Pago" }]} />
          <FilterField label="Empresa pagadora" value={draftFilters.company} onChange={(company) => setDraftFilters((current) => ({ ...current, company }))} options={[{ value: "all", label: "Todas as empresas" }, ...companies.map((company) => ({ value: company, label: company }))]} />
        </FilterDrawer>
      )}
    </div>
  );
}
