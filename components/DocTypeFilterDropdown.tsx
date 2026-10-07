import React, { useEffect, useRef, useState } from "react";
import { DocTypeDefinition, DocTypeCategory } from "./types/documents";

export function DocTypeFilterDropdown({
  docTypes,
  selectedTypes,
  onToggleType,
  onClearAll,
  onSelectAll,
}: {
  docTypes: DocTypeDefinition[];
  selectedTypes: string[];
  onToggleType: (id: string) => void;
  onClearAll: () => void;
  onSelectAll: () => void;
  onOpenManage?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const categories: DocTypeCategory[] = [
    "Fiscal Mercantil",
    "Fiscal de Serviços",
    "Transporte & Logística",
    "Financeiro & Outros",
  ];

  const filteredTypes = docTypes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.shortLabel.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className={`inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border bg-white px-3 text-sm ${
          open || selectedTypes.length > 0 ? "border-[#1769e0] text-[#1769e0]" : "border-slate-200 text-slate-700"
        }`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="text-slate-500">Tipo de documento:</span>
        <strong className="font-semibold">
          {selectedTypes.length === 0
            ? "Todos os tipos"
            : selectedTypes.length === 1
            ? selectedTypes[0]
            : `${selectedTypes.length} selecionados`}
        </strong>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d={open ? "m6 14 6-6 6 6" : "m6 10 6 6 6-6"} />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-[360px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="relative border-b border-slate-200">
            <input
              type="text"
              placeholder="Pesquisar tipo (ex: CT-e, NF-e, NFS-e)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="h-10 w-full bg-slate-50 px-3 pr-8 text-sm outline-none"
            />
            {search && (
              <button className="clear-search-btn" onClick={() => setSearch("")}>
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-2 text-xs">
            <button type="button" onClick={onSelectAll} className="font-semibold text-[#1769e0]">
              Selecionar todos
            </button>
            <span className="text-slate-300">·</span>
            <button type="button" onClick={onClearAll} className="font-semibold text-[#1769e0]">
              Limpar seleção
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto border-t border-slate-100">
            {categories.map((cat) => {
              const typesInCat = filteredTypes.filter((t) => t.category === cat);
              if (typesInCat.length === 0) return null;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    <span>{cat}</span>
                    <small>{typesInCat.length}</small>
                  </div>
                  <div>
                    {typesInCat.map((t) => {
                      const isSelected = selectedTypes.includes(t.id);
                      return (
                        <label
                          key={t.id}
                          className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 ${isSelected ? "bg-blue-50" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleType(t.id)}
                          />
                          <span className={`doc-chip-badge tone-${t.badgeTone}`}>
                            {t.shortLabel}
                          </span>
                          <span className="truncate text-slate-700">{t.name}</span>
                          {t.hasSchedule && (
                            <span className="doc-tag-schedule" title="Suporta agendamento de transporte">
                              Agendável
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
