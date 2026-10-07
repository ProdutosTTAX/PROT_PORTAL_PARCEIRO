import React, { useEffect, useState } from "react";

export interface ConfigItem {
  key: string;
  label: string;
  required?: boolean;
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    </button>
  );
}

export function ColumnConfigDrawer({
  title = "Configuração",
  hint = "Escolha o que fica visível nesta tela.",
  items,
  hidden,
  onClose,
  onSave,
}: {
  title?: string;
  hint?: string;
  items: ConfigItem[];
  hidden: string[];
  onClose: () => void;
  onSave: (hidden: string[]) => void;
}) {
  const [draft, setDraft] = useState(hidden);
  useEffect(() => setDraft(hidden), [hidden]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer" style={{ width: 420 }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head" style={{ minHeight: 48, padding: "12px 18px" }}>
          <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>{title}</h2>
          <CloseButton onClose={onClose} />
        </div>
        <div className="drawer-body space-y-2" style={{ paddingTop: 16 }}>
          <p className="mb-3 text-sm text-slate-500">{hint}</p>
          {items.map((item) => {
            const visible = item.required || !draft.includes(item.key);
            return (
              <label
                key={item.key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                onClick={(event) => {
                  event.preventDefault();
                  if (item.required) return;
                  setDraft((current) => (visible ? [...current, item.key] : current.filter((key) => key !== item.key)));
                }}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#1769e0]"
                  checked={visible}
                  readOnly
                  disabled={item.required}
                />
                <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800">{item.label}</span>
                {item.required && <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Obrigatória</span>}
              </label>
            );
          })}
        </div>
        <div className="drawer-footer">
          <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={() => setDraft([])}>
            Restaurar padrão
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700" onClick={onClose}>
              Fechar
            </button>
            <button type="button" className="inline-flex h-9 items-center rounded-lg bg-[#1769e0] px-4 text-xs font-semibold text-white" onClick={() => onSave(draft)}>
              Salvar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export function FilterDrawer({
  title = "Filtros",
  children,
  onClose,
  onClear,
  onApply,
}: {
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer" style={{ width: 420 }} onMouseDown={(event) => event.stopPropagation()}>
        <div className="drawer-head" style={{ minHeight: 48, padding: "12px 18px" }}>
          <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>{title}</h2>
          <CloseButton onClose={onClose} />
        </div>
        <div className="drawer-body space-y-4" style={{ paddingTop: 16 }}>
          <div className="flex items-center gap-2.5">
            <span className="h-5 w-1 shrink-0 rounded-full bg-[#1769e0]" aria-hidden="true" />
            <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>{title}</h2>
          </div>
          {children}
        </div>
        <div className="drawer-footer">
          <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-800" onClick={onClear}>
            Limpar tudo
          </button>
          <button type="button" className="inline-flex h-9 items-center rounded-lg bg-[#1769e0] px-4 text-xs font-semibold text-white" onClick={onApply}>
            Aplicar filtros
          </button>
        </div>
      </aside>
    </div>
  );
}

export function FilterField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  return (
    <label className="block text-xs font-semibold text-slate-600">
      {label}
      <select className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
