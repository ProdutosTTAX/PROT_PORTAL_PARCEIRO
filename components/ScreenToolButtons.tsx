import React from "react";

function toolClass(active: boolean) {
  return `inline-flex h-10 items-center gap-2 rounded-lg border bg-white px-3.5 text-sm font-semibold hover:bg-slate-50 ${
    active ? "border-[#1769e0] text-[#1769e0]" : "border-slate-200 text-slate-600"
  }`;
}

export function ScreenToolButtons({
  onConfigure,
  onFilter,
  configureActive = false,
  filterActive = false,
}: {
  onConfigure: () => void;
  onFilter: () => void;
  configureActive?: boolean;
  filterActive?: boolean;
}) {
  return (
    <>
      <button type="button" className={toolClass(configureActive)} onClick={onConfigure}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1769e0" strokeWidth="2" aria-hidden="true">
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.05.05a2.06 2.06 0 0 1-2.91 2.91l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 0 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.87.34l-.05.05a2.06 2.06 0 0 1-2.91-2.91l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.1.4H2.4a2 2 0 0 1 0-4h.09A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.87l-.05.05a2.06 2.06 0 0 1 2.91-2.91l.05.05A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 .6-1V3a2 2 0 0 1 4 0v.09A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.87-.34l.05-.05a2.06 2.06 0 0 1 2.91 2.91l-.05.05A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.1-.4h.1a2 2 0 0 1 0 4h-.09a1.7 1.7 0 0 0-2.11 1.8Z" />
        </svg>
        Configuração
      </button>
      <button type="button" className={toolClass(filterActive)} onClick={onFilter}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1769e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        Filtros
      </button>
    </>
  );
}
