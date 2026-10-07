import React, { useEffect, useRef, useState } from "react";
import logoImg from "../assets/logo.png";
import { UserRole, DocumentRecord } from "../types/documents";
import { ScreenToolButtons } from "./ScreenToolButtons";
import { ColumnConfigDrawer } from "./ScreenDrawers";

function FilterSelect({
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
  const selected = options.find((option) => option.value === value) ?? options[0];
  const visible = options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef}>
      <span className="block text-[11px] font-medium text-slate-500">{label}</span>
      <button
        type="button"
        className="mt-1 flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-xs font-medium text-slate-700"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {selected?.label}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" aria-hidden="true">
          {open ? <path d="m6 15 6-6 6 6" /> : <path d="m6 9 6 6 6-6" />}
        </svg>
      </button>
      {open && (
        <div className="mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="p-2">
            <input
              type="text"
              value={query}
              placeholder={searchPlaceholder}
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-700 outline-none placeholder:text-slate-400"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="max-h-36 overflow-auto pb-1">
            {visible.map((option) => (
              <button
                key={option.value}
                type="button"
                className="block w-full px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => {
                  onChange(option.value);
                  setQuery("");
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function pdfString(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const channel = (value: number) => (value / 255).toFixed(3);
  return `${channel((n >> 16) & 255)} ${channel((n >> 8) & 255)} ${channel(n & 255)}`;
}

function roundRect(x: number, y: number, w: number, h: number, r: number) {
  const k = 0.5522847498 * r;
  const n = (value: number) => value.toFixed(2);
  return [
    `${n(x + r)} ${n(y)} m`,
    `${n(x + w - r)} ${n(y)} l`,
    `${n(x + w - r + k)} ${n(y)} ${n(x + w)} ${n(y + r - k)} ${n(x + w)} ${n(y + r)} c`,
    `${n(x + w)} ${n(y + h - r)} l`,
    `${n(x + w)} ${n(y + h - r + k)} ${n(x + w - r + k)} ${n(y + h)} ${n(x + w - r)} ${n(y + h)} c`,
    `${n(x + r)} ${n(y + h)} l`,
    `${n(x + r - k)} ${n(y + h)} ${n(x)} ${n(y + h - r + k)} ${n(x)} ${n(y + h - r)} c`,
    `${n(x)} ${n(y + r)} l`,
    `${n(x)} ${n(y + r - k)} ${n(x + r - k)} ${n(y)} ${n(x + r)} ${n(y)} c`,
    "h",
  ].join("\n");
}

function fitText(value: string, size: number, maxWidth: number) {
  const width = (text: string) => text.length * size * 0.48;
  if (width(value) <= maxWidth) return value;
  let text = value;
  while (text.length > 1 && width(`${text}...`) > maxWidth) text = text.slice(0, -1);
  return `${text}...`;
}

type ReportCard = { title: string; value: string; sub: string; warn?: boolean };
type ReportRow = { title: string; detail: string; extra?: string; badge?: string; meta?: string; tone?: "amber" | "purple" };

type PdfLogo = { rgb: Uint8Array; alpha: Uint8Array; width: number; height: number };

async function deflateBytes(data: Uint8Array) {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function loadPdfLogo(src: string): Promise<PdfLogo> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("logo"));
    el.src = src;
  });
  const height = 128;
  const width = Math.max(1, Math.round(height * (img.naturalWidth / img.naturalHeight)));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("logo");
  ctx.drawImage(img, 0, 0, width, height);
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const rgb = new Uint8Array(width * height * 3);
  const alpha = new Uint8Array(width * height);
  for (let i = 0, pixel = 0; i < pixels.length; i += 4, pixel += 1) {
    rgb[pixel * 3] = pixels[i];
    rgb[pixel * 3 + 1] = pixels[i + 1];
    rgb[pixel * 3 + 2] = pixels[i + 2];
    alpha[pixel] = pixels[i + 3];
  }
  return { rgb: await deflateBytes(rgb), alpha: await deflateBytes(alpha), width, height };
}

function latin1(text: string) {
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i += 1) bytes[i] = text.charCodeAt(i) & 255;
  return bytes;
}

function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    out.set(part, offset);
    offset += part.length;
  });
  return out;
}

export function buildSummaryPdf(
  report: { cards: ReportCard[]; pending: ReportRow[]; movements: ReportRow[]; generatedAt: string },
  logo?: PdfLogo,
) {
  const pageW = 842;
  const pageH = 595;
  const cmds: string[] = [];
  const fill = (hex: string) => cmds.push(`${rgb(hex)} rg`);
  const paint = (path: string, fillHex: string, strokeHex?: string) => {
    cmds.push(path);
    fill(fillHex);
    if (strokeHex) {
      cmds.push(`${rgb(strokeHex)} RG`);
      cmds.push("0.8 w");
      cmds.push("B");
    } else {
      cmds.push("f");
    }
  };
  const text = (value: string, x: number, y: number, size: number, font: "F1" | "F2", hex: string) => {
    fill(hex);
    cmds.push("BT");
    cmds.push(`/${font} ${size} Tf`);
    cmds.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
    cmds.push(`(${pdfString(value)}) Tj`);
    cmds.push("ET");
  };

  paint(`0 0 ${pageW} ${pageH} re`, "#f4f7fb");
  paint(`0 528 ${pageW} 67 re`, "#0b1f3a");
  paint(`0 525 ${pageW} 3 re`, "#1769e0");
  let titleX = 32;
  if (logo) {
    const drawH = 34;
    const drawW = drawH * (logo.width / logo.height);
    const drawY = 528 + (67 - drawH) / 2;
    cmds.push("q");
    cmds.push(`${drawW.toFixed(2)} 0 0 ${drawH.toFixed(2)} 28 ${drawY.toFixed(2)} cm`);
    cmds.push("/Im1 Do");
    cmds.push("Q");
    titleX = 28 + drawW + 14;
  } else {
    text("PORTAL DO PARCEIRO", 32, 574, 9, "F2", "#8eb7ea");
  }
  text("Visão geral", titleX, logo ? 562 : 552, logo ? 18 : 22, "F2", "#ffffff");
  text("Resumo dos documentos fiscais e de transporte", titleX, logo ? 546 : 536, 10, "F1", "#c5d4e6");
  text(report.generatedAt, 668, 552, 10, "F1", "#d6e4f5");

  const margin = 24;
  const gap = 8;
  const cardW = (pageW - margin * 2 - gap * 5) / 6;
  const cardY = 424;
  const cardH = 88;
  report.cards.forEach((card, index) => {
    const x = margin + index * (cardW + gap);
    paint(roundRect(x, cardY, cardW, cardH, 8), "#ffffff", "#e2e8f0");
    text(fitText(card.title, 8, cardW - 22), x + 12, cardY + 68, 8, "F1", "#64748b");
    text(fitText(card.value, 16, cardW - 22), x + 12, cardY + 42, 16, "F2", "#0f172a");
    paint(`${(x + 12).toFixed(2)} ${(cardY + 30).toFixed(2)} ${(cardW - 24).toFixed(2)} 0.6 re`, "#e2e8f0");
    text(fitText(card.sub, 7.5, cardW - 22), x + 12, cardY + 14, 7.5, "F1", card.warn ? "#d97706" : "#94a3b8");
  });

  const panelY = 148;
  const panelH = 262;
  const panelW = (pageW - margin * 2 - 12) / 2;
  const panels: { title: string; sub: string; rows: ReportRow[]; x: number }[] = [
    { title: "Pendências prioritárias", sub: "Itens que precisam de resolução", rows: report.pending, x: margin },
    { title: "Últimas movimentações", sub: "Atualizações do motor de integração", rows: report.movements, x: margin + panelW + 12 },
  ];
  panels.forEach((panel) => {
    paint(roundRect(panel.x, panelY, panelW, panelH, 10), "#ffffff", "#e2e8f0");
    text(panel.title, panel.x + 16, panelY + panelH - 24, 12, "F2", "#0f172a");
    text(panel.sub, panel.x + 16, panelY + panelH - 40, 8, "F1", "#64748b");
    paint(`${(panel.x + 16).toFixed(2)} ${(panelY + panelH - 50).toFixed(2)} ${(panelW - 32).toFixed(2)} 0.6 re`, "#e2e8f0");
    panel.rows.forEach((row, index) => {
      const rowH = panel.rows.length > 2 ? 40 : 82;
      const rowY = panelY + panelH - 64 - (index + 1) * (rowH + 8);
      const tone = row.tone === "amber" ? ["#fffbeb", "#fde68a"] : row.tone === "purple" ? ["#f5f3ff", "#ddd6fe"] : ["#f8fafc", "#e2e8f0"];
      paint(roundRect(panel.x + 16, rowY, panelW - 32, rowH, 8), tone[0], tone[1]);
      text(fitText(row.title, 9, panelW - 150), panel.x + 28, rowY + rowH - 18, 9, "F2", "#0f172a");
      text(fitText(row.detail, 8, panelW - 150), panel.x + 28, rowY + rowH - 32, 8, "F1", "#475569");
      if (row.extra) text(fitText(row.extra, 8, panelW - (row.meta ? 168 : 56)), panel.x + 28, rowY + 14, 8, "F1", "#64748b");
      if (row.badge) text(row.badge, panel.x + panelW - 132, rowY + rowH - 18, 8, "F2", row.tone === "amber" ? "#b45309" : "#6d28d9");
      if (row.meta) text(row.meta, panel.x + panelW - 132, rowY + (row.extra ? 14 : rowH - 32), 8, "F1", "#64748b");
    });
  });

  const barY = 52;
  paint(roundRect(margin, barY, pageW - margin * 2, 80, 10), "#ffffff", "#e2e8f0");
  text("Distribuição por modelo de documento", margin + 16, barY + 52, 11, "F2", "#0f172a");
  const segments = [
    { label: "NF-e 35%", color: "#1769e0", share: 0.35 },
    { label: "CT-e 25%", color: "#6354c7", share: 0.25 },
    { label: "NFS-e 20%", color: "#16845b", share: 0.2 },
    { label: "MDF-e 12%", color: "#8b5cf6", share: 0.12 },
    { label: "Outros 8%", color: "#d46b16", share: 0.08 },
  ];
  const barX = margin + 16;
  const barW = pageW - margin * 2 - 32;
  let cursor = barX;
  let labelX = barX;
  segments.forEach((segment) => {
    const width = barW * segment.share;
    paint(`${cursor.toFixed(2)} ${(barY + 32).toFixed(2)} ${width.toFixed(2)} 8 re`, segment.color);
    paint(`${labelX.toFixed(2)} ${(barY + 12).toFixed(2)} 8 8 re`, segment.color);
    text(segment.label, labelX + 12, barY + 13, 8, "F1", "#475569");
    cursor += width;
    labelX += 128;
  });
  text("Portal do Parceiro  ·  Resumo para consulta", margin, 28, 8, "F1", "#94a3b8");

  const stream = latin1(cmds.join("\n"));
  const objects: Uint8Array[] = [
    latin1("<< /Type /Catalog /Pages 2 0 R >>"),
    latin1("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    latin1(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >>${
        logo ? " /XObject << /Im1 7 0 R >>" : ""
      } >> >>`,
    ),
    concatBytes([latin1(`<< /Length ${stream.length} >>\nstream\n`), stream, latin1("\nendstream")]),
    latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"),
    latin1("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"),
  ];
  if (logo) {
    objects.push(
      concatBytes([
        latin1(
          `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.rgb.length} /SMask 8 0 R >>\nstream\n`,
        ),
        logo.rgb,
        latin1("\nendstream"),
      ]),
    );
    objects.push(
      concatBytes([
        latin1(
          `<< /Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceGray /BitsPerComponent 8 /Filter /FlateDecode /Length ${logo.alpha.length} >>\nstream\n`,
        ),
        logo.alpha,
        latin1("\nendstream"),
      ]),
    );
  }
  const parts: Uint8Array[] = [latin1("%PDF-1.4\n")];
  let fileCursor = parts[0].length;
  const xref = [0];
  objects.forEach((obj, index) => {
    xref.push(fileCursor);
    const head = latin1(`${index + 1} 0 obj\n`);
    const tail = latin1("\nendobj\n");
    parts.push(head, obj, tail);
    fileCursor += head.length + obj.length + tail.length;
  });
  let xrefText = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  xref.slice(1).forEach((pos) => {
    xrefText += `${String(pos).padStart(10, "0")} 00000 n \n`;
  });
  xrefText += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${fileCursor}\n%%EOF`;
  parts.push(latin1(xrefText));
  return concatBytes(parts);
}

type DashIconName = "file" | "alert" | "truck" | "clock" | "check" | "card" | "files";

function DashIcon({ name, size = 14 }: { name: DashIconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "file" && (
        <>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M8 13h8M8 17h6" />
        </>
      )}
      {name === "alert" && (
        <>
          <path d="M12 3 2.8 20h18.4L12 3z" />
          <path d="M12 9v4M12 17h.01" />
        </>
      )}
      {name === "truck" && (
        <>
          <rect x="1" y="3" width="15" height="13" rx="2" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </>
      )}
      {name === "clock" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
      {name === "card" && (
        <>
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </>
      )}
      {name === "files" && (
        <>
          <path d="M8 4h10a2 2 0 0 1 2 2v12" />
          <path d="M6 8h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2z" />
        </>
      )}
    </svg>
  );
}

async function downloadDashboardPdf(report: { cards: ReportCard[]; pending: ReportRow[]; movements: ReportRow[] }) {
  const now = new Date();
  const date = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const logo = await loadPdfLogo(logoImg).catch(() => undefined);
  const bytes = buildSummaryPdf({ ...report, generatedAt: `Gerado em ${date}` }, logo);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `Report_Portal_Parceiro_${fileDate}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DashboardView({
  currentRole,
  onSelectRole,
  documents,
  onNavigateToDocuments,
  onOpenDocDetail,
  onOpenNewDoc,
  onOpenException,
  onOpenPayment,
}: {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  documents: DocumentRecord[];
  onNavigateToDocuments: (filterHint?: string) => void;
  onOpenDocDetail: (doc: DocumentRecord, initialTab?: string) => void;
  onOpenNewDoc: () => void;
  onOpenException: () => void;
  onOpenPayment: () => void;
}) {
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [hiddenBlocks, setHiddenBlocks] = useState<string[]>([]);
  const defaultFilters = {
    period: "Últimos 30 dias",
    client: "all",
    status: "all",
    branch: "all",
    carrier: "all",
  };
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [filtersApplied, setFiltersApplied] = useState(false);

  const visibleDocuments = documents.filter((doc) => {
    if (!filtersApplied) return true;
    if (appliedFilters.client !== "all" && doc.company !== appliedFilters.client) return false;
    if (appliedFilters.status !== "all" && doc.status !== appliedFilters.status) return false;
    if (appliedFilters.branch !== "all" && doc.branch !== appliedFilters.branch) return false;
    if (appliedFilters.carrier !== "all" && doc.partnerName !== appliedFilters.carrier) return false;
    return true;
  });

  // Estatísticas calculadas dinamicamente
  const totalCount = visibleDocuments.length;
  const pendingCount = visibleDocuments.filter((d) => d.status.toLowerCase().includes("pendência")).length;
  const scheduledCount = visibleDocuments.filter((d) => d.cteSchedule?.scheduleDate).length;
  const processedCount = visibleDocuments.filter((d) =>
    d.status.toLowerCase().includes("processada") || d.status.toLowerCase().includes("paga")
  ).length;
  const underValidation = visibleDocuments.filter((d) =>
    d.status.toLowerCase().includes("validação") || d.status.toLowerCase().includes("fila")
  ).length;
  const cteCount = visibleDocuments.filter((d) => d.type === "CT-e" || d.type === "MDF-e").length;
  const clientOptions = [...new Set(documents.map((doc) => doc.company))];
  const statusOptions = [...new Set(documents.map((doc) => doc.status))];
  const branchOptions = [...new Set(documents.map((doc) => doc.branch))];
  const carrierOptions = [...new Set(documents.map((doc) => doc.partnerName))];
  const appliedChips = filtersApplied
    ? [
        appliedFilters.period ? { key: "period", label: "Período", value: appliedFilters.period } : null,
        appliedFilters.client !== "all" ? { key: "client", label: "Cliente", value: appliedFilters.client } : null,
        appliedFilters.status !== "all" ? { key: "status", label: "Status", value: appliedFilters.status } : null,
        appliedFilters.branch !== "all" ? { key: "branch", label: "Filial", value: appliedFilters.branch } : null,
        appliedFilters.carrier !== "all" ? { key: "carrier", label: "Transportadora", value: appliedFilters.carrier } : null,
      ].filter((chip): chip is { key: string; label: string; value: string } => Boolean(chip))
    : [];

  const roles: UserRole[] = [
    "Prestador",
    "Requisitante",
    "Operação",
    "Autorizador",
    "Financeiro",
    "Administrador",
  ];

  // Documentos para atalhos de clique
  const pendingDoc =
    documents.find((d) => d.pendingIssue || d.status.toLowerCase().includes("pendência")) || documents[0];
  const cteDoc =
    documents.find((d) => d.type === "CT-e" || d.cteSchedule?.scheduleDate) || documents[1] || documents[0];

  return (
    <div className="dashboard-container -mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
      {/* CABEÇALHO DO DASHBOARD */}
      <div className="screen-header shrink-0">
        <div className="screen-header-copy flex flex-col gap-1">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#1769e0]">
            PORTAL DO PARCEIRO · VISÃO GERAL
          </span>
          <h1 className="font-bold leading-tight text-slate-900" style={{ fontSize: 20, lineHeight: 1.25 }}>Visão geral dos seus documentos.</h1>
          <span className="text-sm text-slate-500">Acompanhe pendências, agendamentos e pagamentos em tempo real.</span>
        </div>
        <div className="flex min-w-0 max-w-full flex-col items-end gap-2">
          <div className="page-toolbar">
          <ScreenToolButtons
            configureActive={configOpen}
            filterActive={filtersOpen}
            onConfigure={() => setConfigOpen(true)}
            onFilter={() => setFiltersOpen((open) => !open)}
          />
          <button
            type="button"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-[#1769e0] px-3.5 text-sm font-semibold text-white hover:bg-blue-700"
            onClick={() =>
              downloadDashboardPdf({
                cards: [
                  { title: "Documentos totais", value: String(totalCount), sub: "+14% no período" },
                  { title: "Com pendências", value: String(pendingCount), sub: "Requer atenção imediata", warn: true },
                  { title: "Agendados (CT-e)", value: String(scheduledCount), sub: `${cteCount} documentos logísticos` },
                  { title: "Em validação", value: String(underValidation), sub: "SLA médio: 18 seg" },
                  { title: "Processados", value: String(processedCount), sub: "Integrados com SAP" },
                  { title: "Programados para pgto", value: "R$ 182.400", sub: "4 títulos liberados" },
                ],
                pending: [
                  {
                    title: "Divergência de valor com pedido SAP",
                    detail: "NFS-e 2025000001847 · Empresa exemplo",
                    extra: "Valor da nota difere do saldo disponível em R$ 2.350,00.",
                    badge: "Ação necessária",
                    meta: "SLA: 1h 18min",
                    tone: "amber",
                  },
                  {
                    title: "CT-e aguardando agendamento de pátio",
                    detail: "CT-e 000008413 · Expresso Rápido Paulista",
                    extra: "Carga pronta na origem necessitando alocação de doca no CD.",
                    badge: "Sem agendamento",
                    meta: "Hoje",
                    tone: "purple",
                  },
                ],
                movements: [
                  { title: "Agendamento de transporte confirmado", detail: "CT-e 000008412 · Doca 02 · 20/06 às 08:00", meta: "Hoje, 09:18" },
                  { title: "Documento integrado no SAP ERP", detail: "NF-e 000.198.441 · Módulo MM / FI", meta: "Ontem, 16:32" },
                  { title: "Manifesto de carga emitido", detail: "MDF-e 000001244 · Trajeto SP para PR", meta: "Ontem, 15:30" },
                  { title: "Pagamento liquidado no banco", detail: "NF-e 000.512.981 · R$ 8.445,70", meta: "17/06, 08:47" },
                ],
              })
            }
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Baixar PDF
          </button>
          </div>
          {appliedChips.length > 0 && (
            <div className="flex items-center justify-end gap-2">
          {appliedChips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#1769e0]"
              onClick={() => {
                const next = {
                  ...appliedFilters,
                  [chip.key]: chip.key === "period" ? "" : "all",
                };
                setAppliedFilters(next);
                setDraftFilters(next);
                if (chip.key === "period" && next.client === "all" && next.status === "all" && next.branch === "all" && next.carrier === "all") {
                  setFiltersApplied(false);
                }
              }}
            >
              {chip.label}: {chip.value}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          <span className="text-[11px] text-slate-400">
            {appliedChips.length} {appliedChips.length === 1 ? "filtro aplicado" : "filtros aplicados"}
          </span>
            </div>
          )}
        </div>
      </div>
      {configOpen && (
        <ColumnConfigDrawer
          hint="Escolha os cartões e painéis visíveis na visão geral."
          items={[
            { key: "totais", label: "Documentos totais" },
            { key: "pendencias", label: "Com pendências" },
            { key: "agendados", label: "Agendados (CT-e)" },
            { key: "validacao", label: "Em validação" },
            { key: "processados", label: "Processados" },
            { key: "pagamentos", label: "Programados para pgto" },
            { key: "painelPendencias", label: "Pendências prioritárias" },
            { key: "painelMovimentos", label: "Últimas movimentações" },
          ]}
          hidden={hiddenBlocks}
          onClose={() => setConfigOpen(false)}
          onSave={(next) => {
            setHiddenBlocks(next);
            setConfigOpen(false);
          }}
        />
      )}
      {filtersOpen && (
        <div className="overlay" onMouseDown={() => setFiltersOpen(false)}>
          <aside className="drawer" style={{ width: 420 }} onMouseDown={(event) => event.stopPropagation()}>
            <div className="drawer-head" style={{ minHeight: 48, padding: "12px 18px" }}>
              <h2 className="font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>Filtrar dashboard</h2>
              <button type="button" className="icon-btn" onClick={() => setFiltersOpen(false)} title="Fechar" aria-label="Fechar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m6 6 12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <div className="drawer-body space-y-4" style={{ paddingTop: 16 }}>
              <div className="flex items-center gap-2.5">
                <span className="h-5 w-1 shrink-0 rounded-full bg-[#1769e0]" aria-hidden="true" />
                <h2 className="text-base font-semibold text-slate-800" style={{ fontSize: 16, lineHeight: 1.2 }}>Filtros do dashboard</h2>
              </div>
              <FilterSelect
                label="Período"
                value={draftFilters.period}
                searchPlaceholder="Buscar período..."
                options={["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias", "Este mês"].map((option) => ({ value: option, label: option }))}
                onChange={(period) => setDraftFilters((current) => ({ ...current, period }))}
              />
              <FilterSelect
                label="Cliente"
                value={draftFilters.client}
                searchPlaceholder="Buscar cliente..."
                options={[{ value: "all", label: "Todos os clientes" }, ...clientOptions.map((option) => ({ value: option, label: option }))]}
                onChange={(client) => setDraftFilters((current) => ({ ...current, client }))}
              />
              <FilterSelect
                label="Status"
                value={draftFilters.status}
                searchPlaceholder="Buscar status..."
                options={[{ value: "all", label: "Todos os status" }, ...statusOptions.map((option) => ({ value: option, label: option }))]}
                onChange={(status) => setDraftFilters((current) => ({ ...current, status }))}
              />
              <FilterSelect
                label="Filial"
                value={draftFilters.branch}
                searchPlaceholder="Buscar filial..."
                options={[{ value: "all", label: "Todas as filiais" }, ...branchOptions.map((option) => ({ value: option, label: option }))]}
                onChange={(branch) => setDraftFilters((current) => ({ ...current, branch }))}
              />
              <FilterSelect
                label="Transportadora"
                value={draftFilters.carrier}
                searchPlaceholder="Buscar transportadora..."
                options={[{ value: "all", label: "Todas as transportadoras" }, ...carrierOptions.map((option) => ({ value: option, label: option }))]}
                onChange={(carrier) => setDraftFilters((current) => ({ ...current, carrier }))}
              />
            </div>
            <div className="drawer-footer">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setDraftFilters(defaultFilters);
                  setAppliedFilters(defaultFilters);
                  setFiltersApplied(false);
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                </svg>
                Limpar tudo
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-[#1769e0] px-4 text-xs font-semibold text-white hover:bg-blue-700"
                onClick={() => {
                  setAppliedFilters(draftFilters);
                  setFiltersApplied(true);
                  setFiltersOpen(false);
                }}
              >
                Aplicar filtros
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="screen-scroll space-y-3">
      {/* CARDS DE INDICADORES (REQUISITO 11: GRID RESPONSIVO E ALTURA CONSISTENTE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          {
            id: "totais",
            title: "Documentos totais",
            value: totalCount,
            sub: "+14% no período",
            icon: "file" as DashIconName,
            tone: "blue",
            filter: "all",
          },
          {
            id: "pendencias",
            title: "Com pendências",
            value: pendingCount,
            sub: "Requer atenção imediata",
            icon: "alert" as DashIconName,
            tone: "orange",
            filter: "pending",
          },
          {
            id: "agendados",
            title: "Agendados (CT-e)",
            value: scheduledCount,
            sub: `${cteCount} documentos logísticos`,
            icon: "truck" as DashIconName,
            tone: "purple",
            filter: "scheduled",
          },
          {
            id: "validacao",
            title: "Em validação",
            value: underValidation,
            sub: "SLA médio: 18 seg",
            icon: "clock" as DashIconName,
            tone: "blue",
            filter: "validation",
          },
          {
            id: "processados",
            title: "Processados",
            value: processedCount,
            sub: "Integrados com SAP",
            icon: "check" as DashIconName,
            tone: "green",
            filter: "processed",
          },
          {
            id: "pagamentos",
            title: "Programados para pgto",
            value: "R$ 182.400",
            sub: "4 títulos liberados",
            icon: "card" as DashIconName,
            tone: "purple",
            action: onOpenPayment,
          },
        ].filter((card) => !hiddenBlocks.includes(card.id)).map((card, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => (card.action ? card.action() : onNavigateToDocuments(card.filter))}
            className="bg-white border border-slate-200 rounded-xl p-3.5 text-left flex flex-col justify-between hover:shadow-md hover:border-blue-300 transition-all cursor-pointer min-h-[110px]"
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] font-semibold text-slate-500 line-clamp-1">
                {card.title}
              </span>
              <span className="w-6 h-6 rounded-md flex items-center justify-center bg-blue-50 text-[#1769e0]">
                <DashIcon name={card.icon} />
              </span>
            </div>
            <div className="my-1">
              <strong className="text-xl font-bold text-slate-900 block truncate">
                {card.value}
              </strong>
            </div>
            <div className="flex items-center justify-between w-full pt-1 border-t border-slate-100 text-[10px]">
              <span className={`truncate ${card.tone === "orange" ? "text-amber-600 font-semibold" : "text-slate-400"}`}>
                {card.sub}
              </span>
              <span className="text-slate-400 text-xs">➔</span>
            </div>
          </button>
        ))}
      </div>

      {/* SEÇÃO PRINCIPAL: PENDÊNCIAS PRIORITÁRIAS E ÚLTIMAS MOVIMENTAÇÕES LADO A LADO (REQUISITOS 8, 9, 10, 14) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Painel 1: Pendências Prioritárias */}
        {!hiddenBlocks.includes("painelPendencias") && <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Pendências prioritárias</h2>
                <p className="text-xs text-slate-500">Itens fiscais e operacionais que precisam de resolução</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[#1769e0] hover:underline"
                onClick={() => onNavigateToDocuments("pending")}
              >
                Ver todas ➔
              </button>
            </div>

            <div className="space-y-3">
              {/* Item 1: Pendência com SLA (Requisito 9) */}
              <div
                onClick={() => pendingDoc && onOpenDocDetail(pendingDoc, "Validações")}
                className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769e0] flex items-center justify-center shrink-0">
                    <DashIcon name="alert" size={16} />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-slate-900 block truncate">
                      Divergência de valor com pedido SAP
                    </strong>
                    <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                      NFS-e 2025000001847 · Empresa exemplo
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      Valor da nota difere do saldo disponível em R$ 2.350,00.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5 pl-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full text-[10px] border border-amber-200">
                    Ação necessária
                  </span>
                  <span className="text-[11px] font-semibold text-rose-600">SLA: 1h 18min</span>
                  <span className="text-xs text-slate-400">➔</span>
                </div>
              </div>

              {/* Item 2: CT-e aguardando agendamento (Requisito 9) */}
              <div
                onClick={() => cteDoc && onOpenDocDetail(cteDoc, "Agendamento")}
                className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 hover:bg-purple-50 hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1769e0] flex items-center justify-center shrink-0">
                    <DashIcon name="truck" size={16} />
                  </div>
                  <div className="min-w-0">
                    <strong className="text-xs font-bold text-slate-900 block truncate">
                      CT-e aguardando agendamento de pátio
                    </strong>
                    <span className="text-[11px] text-slate-600 block mt-0.5 truncate">
                      CT-e 000008413 · Expresso Rápido Paulista
                    </span>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      Carga pronta na origem necessitando alocação de doca no CD.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-1.5 pl-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-bold rounded-full text-[10px] border border-purple-200">
                    Sem agendamento
                  </span>
                  <span className="text-[11px] font-medium text-slate-500">Hoje</span>
                  <span className="text-xs text-slate-400">➔</span>
                </div>
              </div>
            </div>
          </div>
        </section>}

        {/* Painel 2: Últimas Movimentações */}
        {!hiddenBlocks.includes("painelMovimentos") && <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Últimas movimentações</h2>
                <p className="text-xs text-slate-500">Atualizações em tempo real no motor de integração</p>
              </div>
              <button
                type="button"
                className="text-xs font-semibold text-[#1769e0] hover:underline"
                onClick={() => onNavigateToDocuments()}
              >
                Ver histórico ➔
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  title: "Agendamento de transporte confirmado",
                  sub: "CT-e 000008412 · Doca 02",
                  resumo: "Agendado para 20/06 às 08:00",
                  time: "Hoje, 09:18",
                  icon: "truck" as DashIconName,
                  tone: "purple",
                  tabTarget: "Agendamento",
                  doc: cteDoc,
                },
                {
                  title: "Documento integrado no SAP ERP",
                  sub: "NF-e 000.198.441 · Módulo MM / FI",
                  resumo: "Entrada registrada e partidas geradas",
                  time: "Ontem, 16:32",
                  icon: "check" as DashIconName,
                  tone: "green",
                  tabTarget: "Processamento",
                  doc: documents[2] || documents[0],
                },
                {
                  title: "Manifesto de carga emitido",
                  sub: "MDF-e 000001244 · Trajeto SP ➔ PR",
                  resumo: "DAMDFE autorizado com 3 CT-es vinculados",
                  time: "Ontem, 15:30",
                  icon: "files" as DashIconName,
                  tone: "blue",
                  tabTarget: "Resumo",
                  doc: documents[3] || documents[0],
                },
                {
                  title: "Pagamento liquidado no banco",
                  sub: "NF-e 000.512.981 · R$ 8.445,70",
                  resumo: "Arquivo de retorno CNAB processado",
                  time: "17/06, 08:47",
                  icon: "card" as DashIconName,
                  tone: "green",
                  tabTarget: "Pagamento",
                  doc: documents[4] || documents[0],
                },
              ].map((m, idx) => (
                <div
                  key={idx}
                  onClick={() => m.doc && onOpenDocDetail(m.doc, m.tabTarget)}
                  className="p-2.5 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-[#1769e0]">
                      <DashIcon name={m.icon} />
                    </span>
                    <div className="min-w-0">
                      <strong className="text-xs font-semibold text-slate-900 block truncate">
                        {m.title}
                      </strong>
                      <span className="text-[11px] text-slate-600 block truncate">
                        {m.sub} · <em className="not-italic text-slate-400">{m.resumo}</em>
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                    {m.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>}
      </div>

      {/* DISTRIBUIÇÃO POR MODELO DE DOCUMENTO */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Distribuição por modelo de documento</h2>
            <p className="text-xs text-slate-500">Controle unificado de documentos fiscais e de transporte</p>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-[#1769e0] hover:underline"
            onClick={() => onNavigateToDocuments()}
          >
            Acessar Documentos ➔
          </button>
        </div>

        <div className="h-3 rounded-full flex overflow-hidden bg-slate-100">
          <div style={{ width: "35%", background: "#1769e0" }} title="NF-e (Mercantil)" />
          <div style={{ width: "25%", background: "#6354c7" }} title="CT-e (Transporte)" />
          <div style={{ width: "20%", background: "#16845b" }} title="NFS-e (Serviços)" />
          <div style={{ width: "12%", background: "#8b5cf6" }} title="MDF-e (Manifesto)" />
          <div style={{ width: "8%", background: "#d46b16" }} title="CIOT / Outros" />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1769e0]" /> NF-e Mercantis: <strong>35%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6354c7]" /> CT-e Transporte: <strong>25%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#16845b]" /> NFS-e Serviços: <strong>20%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]" /> MDF-e Carga: <strong>12%</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d46b16]" /> CIOT / Outros: <strong>8%</strong>
          </span>
        </div>
      </section>
      </div>
    </div>
  );
}
