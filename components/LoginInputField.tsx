import React, { useState } from "react";

interface LoginInputFieldProps {
  id: string;
  label: string;
  badge?: string;
  required?: boolean;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  successMessage?: string;
  disabled?: boolean;
  iconType: "mail" | "building";
  autoFocus?: boolean;
}

export const LoginInputField: React.FC<LoginInputFieldProps> = ({
  id,
  label,
  badge,
  required,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  successMessage,
  disabled = false,
  iconType,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const isFilled = value.trim().length > 0;
  const hasError = Boolean(error);
  const hasSuccess = Boolean(successMessage);

  return (
    <div className="w-full flex flex-col text-left">
      {/* Label com 8px de espaçamento até o input */}
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-slate-800 flex items-center gap-1 select-none cursor-pointer"
        >
          <span>{label}</span>
          {required && (
            <span className="text-blue-600 font-bold" title="Campo obrigatório">
              *
            </span>
          )}
        </label>

        {badge && (
          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
            {badge}
          </span>
        )}
      </div>

      {/* Container do Input com altura exata de 52px, borda 1px sólida cinza-azulado, foco 2px sem alterar altura */}
      <div
        className={`relative w-full h-[52px] rounded-[10px] bg-white transition-all duration-150 flex items-center ${
          disabled
            ? "bg-slate-100/80 border border-slate-200 cursor-not-allowed opacity-75"
            : hasError
            ? "border border-rose-500 ring-2 ring-rose-500/20"
            : hasSuccess
            ? "border border-emerald-500 ring-2 ring-emerald-500/20"
            : isFocused
            ? "border-2 border-[#1769e0] ring-4 ring-blue-500/10 shadow-2xs"
            : isFilled
            ? "border border-slate-300 hover:border-slate-400"
            : "border border-[#cbd5e1] hover:border-slate-400"
        }`}
      >
        {/* Ícone Linear Lucide a 16px da esquerda, 18px de tamanho */}
        <div
          className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-colors duration-150 ${
            disabled
              ? "text-slate-300"
              : hasError
              ? "text-rose-500"
              : hasSuccess
              ? "text-emerald-600"
              : isFocused || isFilled
              ? "text-[#1769e0]"
              : "text-slate-400"
          }`}
        >
          {iconType === "mail" && (
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          )}

          {iconType === "building" && (
            <svg
              className="w-[18px] h-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
              <path d="M6 12H4a2 2 0 0 0-2 2v8" />
              <path d="M18 9h2a2 2 0 0 1 2 2v11" />
              <path d="M10 6h4" />
              <path d="M10 10h4" />
              <path d="M10 14h4" />
              <path d="M10 18h4" />
            </svg>
          )}
        </div>

        {/* Campo de Entrada (15px font, cor azul-marinho #0b1f3a, padding esquerdo 44px) */}
        <input
          id={id}
          type={type}
          disabled={disabled}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full h-full bg-transparent pl-[44px] pr-4 text-[15px] font-medium text-[#0b1f3a] placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
        />

        {/* Ícone de Sucesso no Lado Direito */}
        {hasSuccess && !hasError && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-600 flex items-center justify-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}

        {/* Ícone de Erro no Lado Direito */}
        {hasError && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500 flex items-center justify-center">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
        )}
      </div>

      {/* Mensagem de Erro ou Sucesso a 6px do input */}
      {hasError && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-medium animate-fadeIn">
          <span>{error}</span>
        </div>
      )}

      {hasSuccess && !hasError && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-medium animate-fadeIn">
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
