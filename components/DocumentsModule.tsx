import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  DocumentRecord,
  DocTypeDefinition,
} from "../types/documents";
import { DocTypeFilterDropdown } from "./DocTypeFilterDropdown";
import { ScreenToolButtons } from "./ScreenToolButtons";

const documentColumns = [
  { key: "type", label: "Tipo", width: 96, required: false },
  { key: "protocol", label: "Protocolo", width: 150, required: true },
  { key: "number", label: "Número / Série", width: 150, required: false },
  { key: "company", label: "Empresa / Filial", width: 170, required: false },
  { key: "partner", label: "Emissor / Parceiro", width: 190, required: false },
  { key: "order", label: "Pedido SAP", width: 130, required: false },
  { key: "issue", label: "Emissão", width: 120, required: false },
  { key: "value", label: "Valor Bruto", width: 130, required: false },
  { key: "status", label: "Status", width: 140, required: false },
  { key: "schedule", label: "Agendamento", width: 210, required: false },
  { key: "payment", label: "Pagamento", width: 140, required: false },
] as const;

type DocumentColumnKey = (typeof documentColumns)[number]["key"];

const defaultColumnOrder = documentColumns.map((column) => column.key);
const defaultColumnWidths = Object.fromEntries(documentColumns.map((column) => [column.key, column.width])) as Record<DocumentColumnKey, number>;

function moveColumn(list: DocumentColumnKey[], from: number, to: number) {
  if (to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function renderDocumentCell(key: DocumentColumnKey, row: DocumentRecord) {
  const isCte = row.type === "CT-e" || row.type === "CT-e OS" || row.type === "MDF-e";
  if (key === "type") {
    return (
      <span className={`doc-chip-badge tone-${row.type === "CT-e" || row.type === "MDF-e" ? "purple" : row.type === "NFS-e" ? "green" : "blue"}`}>
        {row.type}
      </span>
    );
  }
  if (key === "protocol") return <span className="font-mono font-semibold text-slate-700">{row.protocol}</span>;
  if (key === "number") {
    return (
      <>
        <strong className="block font-semibold text-slate-900">{row.number}</strong>
        <small className="text-[10px] text-slate-400">Série {row.series || "1"}</small>
      </>
    );
  }
  if (key === "company") {
    return (
      <>
        <span className="block truncate font-semibold text-slate-800">{row.company}</span>
        <small className="text-[10px] text-slate-500">Filial {row.branch}</small>
      </>
    );
  }
  if (key === "partner") {
    return (
      <>
        <span className="block truncate font-semibold text-slate-800">{row.partnerName}</span>
        <small className="text-[10px] text-slate-500">{row.partnerCnpj}</small>
      </>
    );
  }
  if (key === "order") {
    return row.orderNumber ? (
      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700">{row.orderNumber}</span>
    ) : (
      <span className="text-slate-300">—</span>
    );
  }
  if (key === "issue") return <span className="text-slate-600">{row.issueDate}</span>;
  if (key === "value") return <span className="font-bold text-slate-900">{row.valueGross}</span>;
  if (key === "status") {
    return (
      <span className={`status status-${row.statusTone}`}>
        <span className="status-dot" />
        {row.status}
      </span>
    );
  }
  if (key === "schedule") {
    if (isCte && row.cteSchedule?.scheduleDate) {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-purple-200 bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700">
          Confirmado — {row.cteSchedule.scheduleDate.split("-").slice(1).reverse().join("/")}, {row.cteSchedule.scheduleWindow.split(" ")[0]}
        </span>
      );
    }
    if (isCte) {
      return (
        <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
          Aguardando agendamento
        </span>
      );
    }
    return <span className="text-slate-300">—</span>;
  }
  return row.paymentStatus !== "Não aplicável" ? (
    <span className="font-medium text-slate-700">{row.paymentStatus}</span>
  ) : (
    <span className="text-slate-300">—</span>
  );
}

const defaultDocFilters = { status: "all", company: "all", branch: "all" };

function DocFilterSelect({
  label,
  value,
  options,
  searchPlaceholder,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  searchPlaceholder: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);
  const visibleOptions = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="space-y-1.5">
      <span className="block text-xs font-semibold text-slate-600">{label}</span>
      <button
        type="button"
        className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
        aria-expanded={open}
        onClick={() => {
          setQuery("");
          setOpen((current) => !current);
        }}
      >
        <span className="truncate">{selected?.label || "Selecionar"}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" aria-hidden="true">
          <path d={open ? "m6 14 6-6 6 6" : "m6 10 6 6 6-6"} />
        </svg>
      </button>
      {open && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full border-b border-slate-200 bg-slate-50 px-3 text-sm outline-none"
          />
          <div className="max-h-36 overflow-y-auto">
            {visibleOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-50 ${option.value === value ? "font-semibold text-[#1769e0]" : "text-slate-700"}`}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
            {visibleOptions.length === 0 && <div className="px-3 py-3 text-sm text-slate-400">Nenhum resultado.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export function DocumentsModule({
  documents,
  docTypes,
  onOpenDetail,
  onOpenNew,
  onOpenRescheduleBatch,
  onOpenManageTypes,
}: {
  documents: DocumentRecord[];
  docTypes: DocTypeDefinition[];
  onOpenDetail: (doc: DocumentRecord) => void;
  onOpenNew: () => void;
  onOpenRescheduleBatch: (docs: DocumentRecord[]) => void;
  onOpenManageTypes: () => void;
}) {
  const [directionFilter, setDirectionFilter] = useState<"all" | "inbound" | "outbound">("all");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState(defaultDocFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultDocFilters);
  const [hiddenColumns, setHiddenColumns] = useState<DocumentColumnKey[]>([]);
  const [draftHiddenColumns, setDraftHiddenColumns] = useState<DocumentColumnKey[]>([]);
  const [columnOrder, setColumnOrder] = useState<DocumentColumnKey[]>(defaultColumnOrder);
  const [draftOrder, setDraftOrder] = useState<DocumentColumnKey[]>(defaultColumnOrder);
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);
  const [draftWidths, setDraftWidths] = useState(defaultColumnWidths);
  const [draggingKey, setDraggingKey] = useState<DocumentColumnKey | null>(null);

  // Linha atualmente destacada com foco sutil
  const [focusedDocId, setFocusedDocId] = useState<string | null>(null);

  // Alternar seleção de tipos
  const handleToggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  // Filtragem dos documentos
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Sentido inbound / outbound
      if (directionFilter !== "all" && doc.direction !== directionFilter) return false;

      // Filtro de tipos selecionados
      if (selectedTypes.length > 0 && !selectedTypes.includes(doc.type)) return false;

      // Filtro de status
      if (appliedFilters.status !== "all") {
        if (appliedFilters.status === "pending" && !doc.status.toLowerCase().includes("pendência")) return false;
        if (appliedFilters.status === "scheduled" && !doc.status.toLowerCase().includes("agendad")) return false;
        if (
          appliedFilters.status === "processed" &&
          !doc.status.toLowerCase().includes("processad") &&
          !doc.status.toLowerCase().includes("paga")
        )
          return false;
      }
      if (appliedFilters.company !== "all" && doc.company !== appliedFilters.company) return false;
      if (appliedFilters.branch !== "all" && doc.branch !== appliedFilters.branch) return false;

      // Busca por múltiplos campos
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const match =
          doc.number.toLowerCase().includes(q) ||
          doc.protocol.toLowerCase().includes(q) ||
          doc.partnerName.toLowerCase().includes(q) ||
          doc.partnerCnpj.toLowerCase().includes(q) ||
          doc.company.toLowerCase().includes(q) ||
          (doc.orderNumber && doc.orderNumber.toLowerCase().includes(q)) ||
          (doc.accessKey && doc.accessKey.toLowerCase().includes(q)) ||
          (doc.cteSchedule?.plate && doc.cteSchedule.plate.toLowerCase().includes(q)) ||
          (doc.cteSchedule?.driverName && doc.cteSchedule.driverName.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [documents, directionFilter, selectedTypes, appliedFilters, searchTerm]);

  // Documentos selecionados via checkbox
  const selectedDocs = useMemo(() => {
    return documents.filter((d) => selectedDocIds.includes(d.id));
  }, [documents, selectedDocIds]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() ||
      selectedTypes.length > 0 ||
      directionFilter !== "all" ||
      appliedFilters.status !== "all" ||
      appliedFilters.company !== "all" ||
      appliedFilters.branch !== "all"
  );
  const showColumn = (key: DocumentColumnKey) => !hiddenColumns.includes(key);
  const visibleColumnCount = documentColumns.filter((column) => showColumn(column.key)).length;
  const companyOptions = [...new Set(documents.map((doc) => doc.company))];
  const branchOptions = [...new Set(documents.map((doc) => doc.branch))];

  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen && !columnsOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [filtersOpen, columnsOpen]);

  useEffect(() => {
    const topScroll = topScrollRef.current;
    const tableContainer = tableContainerRef.current;
    if (!topScroll || !tableContainer) return;

    let isSyncingTop = false;
    let isSyncingTable = false;

    const onTopScroll = () => {
      if (isSyncingTop) {
        isSyncingTop = false;
        return;
      }
      isSyncingTable = true;
      tableContainer.scrollLeft = topScroll.scrollLeft;
    };

    const onTableScroll = () => {
      if (isSyncingTable) {
        isSyncingTable = false;
        return;
      }
      isSyncingTop = true;
      topScroll.scrollLeft = tableContainer.scrollLeft;
    };

    const syncWidth = () => {
      const inner = topScroll.firstElementChild as HTMLElement | null;
      if (inner) inner.style.width = `${tableContainer.scrollWidth}px`;
    };
    syncWidth();

    topScroll.addEventListener("scroll", onTopScroll);
    tableContainer.addEventListener("scroll", onTableScroll);
    window.addEventListener("resize", syncWidth);

    return () => {
      topScroll.removeEventListener("scroll", onTopScroll);
      tableContainer.removeEventListener("scroll", onTableScroll);
      window.removeEventListener("resize", syncWidth);
    };
  }, [filteredDocs, hiddenColumns, pageSize]);

  const selectedCteCount = selectedDocs.filter((doc) => doc.type === "CT-e").length;
  const onlyCteSelected = selectedDocs.length > 0 && selectedCteCount === selectedDocs.length;
  const mixedCteSelection = selectedCteCount > 0 && selectedCteCount < selectedDocs.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocIds(filteredDocs.map((d) => d.id));
    } else {
      setSelectedDocIds([]);
    }
  };

  const handleToggleDoc = (docId: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleRowClick = (doc: DocumentRecord) => {
    setFocusedDocId(doc.id);
    onOpenDetail(doc);
  };

  return (
    <div className="documents-page -mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      <div className="screen-header shrink-0">
        <div className="screen-header-copy flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1769e0]">
            PORTAL DO PARCEIRO · DOCUMENTOS
          </span>
          <h1 className="font-bold leading-tight text-slate-900" style={{ fontSize: 20, lineHeight: 1.25 }}>Acompanhe os documentos fiscais e logísticos.</h1>
          <span className="text-sm text-slate-500">Recebidos, emitidos e o status de cada documento em um só lugar.</span>
        </div>
        <div className="page-toolbar">
          <ScreenToolButtons
            configureActive={columnsOpen}
            filterActive={filtersOpen || appliedFilters.status !== "all" || appliedFilters.company !== "all" || appliedFilters.branch !== "all"}
            onConfigure={() => {
              setDraftHiddenColumns(hiddenColumns);
              setDraftOrder(columnOrder);
              setDraftWidths(columnWidths);
              setColumnsOpen(true);
            }}
            onFilter={() => {
              setDraftFilters(appliedFilters);
              setFiltersOpen(true);
            }}
          />
          <button
            type="button"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#1769e0] px-4 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={onOpenNew}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" />
            </svg>
            Adicionar documento
          </button>
        </div>
      </div>

      {/* BARRA DE AÇÃO EM LOTE */}
      {selectedDocIds.length > 0 && (
        <div className="flex shrink-0 items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="font-bold bg-[#1769e0] text-white px-2 py-0.5 rounded-full text-[11px]">
              {selectedDocIds.length}
            </span>
            <span>documentos selecionados</span>
          </div>
          <div className="flex items-center gap-2">
            {onlyCteSelected && (
              <button
                type="button"
                className="rounded-lg bg-[#1769e0] px-3 py-1.5 font-semibold text-white hover:bg-blue-700"
                onClick={() => onOpenRescheduleBatch(selectedDocs)}
              >
                Alterar agenda
              </button>
            )}
            {mixedCteSelection && (
              <span className="flex items-center gap-2 text-slate-600">
                <button type="button" disabled className="cursor-not-allowed rounded-lg bg-slate-300 px-3 py-1.5 font-semibold text-white">
                  Alterar agenda
                </button>
                <span>Disponível somente quando a seleção tiver apenas CT-e.</span>
              </span>
            )}
            <button
              type="button"
              className="px-3 py-1.5 border border-slate-300 bg-white rounded-lg text-slate-700 font-medium hover:bg-slate-50"
              onClick={() => setSelectedDocIds([])}
            >
              Desmarcar todos
            </button>
          </div>
        </div>
      )}

      {/* PAINEL DA TABELA COM FILTROS */}
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
        <div className="shrink-0 rounded-t-xl border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative min-w-0 flex-1">
            <input
              placeholder="Número, chave, pedido, placa ou parceiro"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 w-full pl-9 pr-3 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#1769e0] bg-white"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 inline-flex text-slate-400">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
          </div>
          <DocTypeFilterDropdown
            docTypes={docTypes}
            selectedTypes={selectedTypes}
            onToggleType={handleToggleType}
            onClearAll={() => setSelectedTypes([])}
            onSelectAll={() => setSelectedTypes(docTypes.map((t) => t.id))}
            onOpenManage={onOpenManageTypes}
          />
        </div>

        <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {(
              [
                ["all", "Todos", documents.length],
                ["inbound", "Recebidos", documents.filter((d) => d.direction === "inbound").length],
                ["outbound", "Emitidos", documents.filter((d) => d.direction === "outbound").length],
              ] as const
            ).map(([key, label, count]) => (
              <button
                key={key}
                type="button"
                className={`filter ${directionFilter === key ? "active" : ""}`}
                onClick={() => setDirectionFilter(key)}
              >
                {label} ({count})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Registros por página</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-8 border border-slate-200 rounded-lg px-2 bg-white text-xs font-semibold text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>
          <div
            ref={topScrollRef}
            className="documents-top-scroll hidden overflow-x-scroll overflow-y-hidden border-t border-slate-200 md:block"
            style={{ height: 12 }}
          >
            <div style={{ width: 1450, height: 1 }} />
          </div>
        </div>

        {/* TABELA PRINCIPAL (APENAS DESKTOP/TABLET >= 768px - REQUISITO 6) */}
        {/* NUNCA RENDERIZAR DETALHES INLINE OU ABAIXO DA TABELA (REQUISITOS 1, 2) */}
        <div
          ref={tableContainerRef}
          className="documents-table-scroll hidden min-h-0 flex-1 overflow-x-hidden overflow-y-auto md:block"
        >
          <table className="w-full text-left text-xs border-collapse min-w-[1450px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredDocs.length > 0 &&
                      filteredDocs.every((d) => selectedDocIds.includes(d.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded text-[#1769e0]"
                  />
                </th>
                {columnOrder.filter(showColumn).map((key) => {
                  const column = documentColumns.find((item) => item.key === key);
                  return (
                    <th key={key} className="p-3" style={{ width: columnWidths[key], minWidth: columnWidths[key] }}>
                      {column?.label}
                    </th>
                  );
                })}
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumnCount + 2} className="text-center py-10 text-slate-400">
                    Nenhum documento encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredDocs.slice(0, pageSize).map((row) => {
                  const isChecked = selectedDocIds.includes(row.id);
                  const isFocused = focusedDocId === row.id;

                  return (
                    <tr
                      key={row.id}
                      onClick={() => handleRowClick(row)}
                      className={`h-14 transition-colors cursor-pointer ${
                        isFocused
                          ? "bg-blue-50/80 ring-1 ring-inset ring-blue-300"
                          : isChecked
                          ? "bg-slate-50"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Checkbox com stopPropagation (Requisito 2) */}
                      <td
                        className="p-3 text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleDoc(row.id)}
                          className="rounded text-[#1769e0]"
                        />
                      </td>

                      {columnOrder.filter(showColumn).map((key) => (
                        <td key={key} className="p-3 whitespace-nowrap" style={{ width: columnWidths[key], minWidth: columnWidths[key] }}>
                          {renderDocumentCell(key, row)}
                        </td>
                      ))}

                      {/* Botão Ver Detalhes (Requisito 2) */}
                      <td
                        className="p-3 text-right whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(row);
                        }}
                      >
                        <button
                          type="button"
                          className="px-2.5 py-1 text-[#1769e0] hover:bg-blue-50 rounded font-semibold text-xs transition-colors"
                        >
                          Ver detalhes ➔
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* VERSÃO EM CARDS EXCLUSIVA PARA MOBILE (< 768px - REQUISITOS 6, 7) */}
        <div className="block min-h-0 flex-1 space-y-4 overflow-y-auto p-4 md:hidden">
          {filteredDocs.map((row) => (
            <div
              key={row.id}
              onClick={() => handleRowClick(row)}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs hover:border-blue-300 transition-all cursor-pointer space-y-3"
            >
              {/* Linha Superior: Badges */}
              <div className="flex items-center justify-between">
                <span className={`doc-chip-badge tone-${row.type === "CT-e" ? "purple" : row.type === "NFS-e" ? "green" : "blue"}`}>
                  {row.type}
                </span>
                <span className={`status status-${row.statusTone}`}>
                  {row.status}
                </span>
              </div>

              {/* Conteúdo Central */}
              <div className="space-y-1">
                <div className="flex items-baseline justify-between">
                  <strong className="text-sm font-bold text-slate-900">{row.number}</strong>
                  <span className="text-xs font-bold text-slate-900">{row.valueGross}</span>
                </div>
                <p className="text-xs text-slate-600 font-medium">
                  {row.company} · {row.partnerName}
                </p>
                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Emissão: {row.issueDate}</span>
                  <span>Filial {row.branch}</span>
                </div>
              </div>

              {/* Agendamento no Card Mobile se aplicável */}
              {row.cteSchedule?.scheduleDate && (
                <div className="p-2 bg-purple-50 border border-purple-100 rounded-lg text-xs text-purple-800 flex items-center gap-1.5">
                  <span>🚚</span>
                  <span>
                    Agendado: {row.cteSchedule.scheduleDate} ({row.cteSchedule.scheduleWindow})
                  </span>
                </div>
              )}

              {/* Rodapé do Card Mobile */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[#1769e0] font-semibold flex items-center gap-1">
                  Ver detalhes ➔
                </span>
                <span className="text-slate-400 font-mono text-[10px]">
                  {row.protocol}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Paginação */}
        <div className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <span>
            Mostrando 1–{Math.min(filteredDocs.length, pageSize)} de {filteredDocs.length} documentos
          </span>
          <div className="flex items-center gap-1">
            <button
              disabled
              className="px-2.5 py-1 border rounded bg-white text-slate-400 cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-2.5 py-1 bg-[#1769e0] text-white rounded font-bold">1</span>
            <button
              disabled={filteredDocs.length <= pageSize}
              className="px-2.5 py-1 border rounded bg-white text-slate-600 hover:bg-slate-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>

      {columnsOpen && (
        <div className="overlay" onMouseDown={() => setColumnsOpen(false)}>
          <aside className="drawer" style={{ width: 720 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head" style={{ minHeight: 48, padding: "12px 18px" }}>
              <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>Configurar colunas</h2>
              <button type="button" className="icon-btn" onClick={() => setColumnsOpen(false)} aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body space-y-3" style={{ paddingTop: 16 }}>
              <p className="text-sm text-slate-500">Selecione as colunas visíveis e arraste para alterar a ordem.</p>
              <div className="space-y-2">
                {draftOrder.map((key, index) => {
                  const column = documentColumns.find((item) => item.key === key);
                  if (!column) return null;
                  const visible = column.required || !draftHiddenColumns.includes(key);
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={() => setDraggingKey(key)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => {
                        if (!draggingKey) return;
                        const from = draftOrder.indexOf(draggingKey);
                        setDraftOrder(moveColumn(draftOrder, from, index));
                        setDraggingKey(null);
                      }}
                      onDragEnd={() => setDraggingKey(null)}
                      className={`flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5 ${draggingKey === key ? "opacity-60" : ""}`}
                    >
                      <span className="cursor-grab text-slate-300" aria-hidden="true">⋮⋮</span>
                      <input
                        type="checkbox"
                        checked={visible}
                        disabled={column.required}
                        className="h-4 w-4 rounded accent-[#1769e0]"
                        onChange={() =>
                          setDraftHiddenColumns((current) =>
                            visible ? [...current, key] : current.filter((item) => item !== key)
                          )
                        }
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">{column.label}</span>
                      {column.required && (
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Obrigatória</span>
                      )}
                      <label className="flex items-center gap-2 text-xs text-slate-500">
                        Largura
                        <input
                          type="number"
                          min={60}
                          max={420}
                          step={10}
                          value={draftWidths[key]}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) =>
                            setDraftWidths((current) => ({ ...current, [key]: Number(event.target.value) || column.width }))
                          }
                          className="h-8 w-16 rounded-lg border border-slate-200 bg-white text-center text-sm text-slate-700 outline-none focus:border-[#1769e0]"
                        />
                      </label>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        aria-label="Mover para cima"
                        disabled={index === 0}
                        onClick={() => setDraftOrder((current) => moveColumn(current, index, index - 1))}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 14 6-6 6 6" /></svg>
                      </button>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                        aria-label="Mover para baixo"
                        disabled={index === draftOrder.length - 1}
                        onClick={() => setDraftOrder((current) => moveColumn(current, index, index + 1))}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 10 6 6 6-6" /></svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="drawer-footer">
              <button
                type="button"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setDraftHiddenColumns([]);
                  setDraftOrder(defaultColumnOrder);
                  setDraftWidths(defaultColumnWidths);
                }}
              >
                Restaurar padrão
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => setColumnsOpen(false)}
                >
                  Fechar
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1769e0] px-4 text-xs font-semibold text-white hover:bg-blue-700"
                  onClick={() => {
                    setHiddenColumns(draftHiddenColumns);
                    setColumnOrder(draftOrder);
                    setColumnWidths(draftWidths);
                    setColumnsOpen(false);
                  }}
                >
                  Salvar
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {filtersOpen && (
        <div className="overlay" onMouseDown={() => setFiltersOpen(false)}>
          <aside className="drawer" style={{ width: 420 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head" style={{ minHeight: 48, padding: "12px 18px" }}>
              <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>Filtrar documentos</h2>
              <button type="button" className="icon-btn" onClick={() => setFiltersOpen(false)} aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body space-y-4" style={{ paddingTop: 16 }}>
              <div className="flex items-center gap-2.5">
                <span className="h-5 w-1 shrink-0 rounded-full bg-[#1769e0]" aria-hidden="true" />
                <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>Filtros da lista</h2>
              </div>
              <DocFilterSelect
                label="Status"
                value={draftFilters.status}
                searchPlaceholder="Buscar status..."
                options={[
                  { value: "all", label: "Todos os status" },
                  { value: "pending", label: "Com pendência" },
                  { value: "scheduled", label: "Agendados" },
                  { value: "processed", label: "Processados" },
                ]}
                onChange={(status) => setDraftFilters((current) => ({ ...current, status }))}
              />
              <DocFilterSelect
                label="Empresa"
                value={draftFilters.company}
                searchPlaceholder="Buscar empresa..."
                options={[{ value: "all", label: "Todas as empresas" }, ...companyOptions.map((option) => ({ value: option, label: option }))]}
                onChange={(company) => setDraftFilters((current) => ({ ...current, company }))}
              />
              <DocFilterSelect
                label="Filial"
                value={draftFilters.branch}
                searchPlaceholder="Buscar filial..."
                options={[{ value: "all", label: "Todas as filiais" }, ...branchOptions.map((option) => ({ value: option, label: option }))]}
                onChange={(branch) => setDraftFilters((current) => ({ ...current, branch }))}
              />
            </div>
            <div className="drawer-footer">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setDraftFilters(defaultDocFilters);
                  setAppliedFilters(defaultDocFilters);
                }}
              >
                Limpar tudo
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1769e0] px-4 text-xs font-semibold text-white hover:bg-blue-700"
                onClick={() => {
                  setAppliedFilters(draftFilters);
                  setFiltersOpen(false);
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
