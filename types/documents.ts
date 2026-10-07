import React, { useState, useMemo } from "react";
import logoImg from "./assets/logo.png";

export type View = "dashboard" | "documents" | "operation" | "payments" | "admin";
export type Drawer =
  | "new"
  | "detail"
  | "exception"
  | "payment"
  | "sap"
  | "config"
  | "reschedule"
  | "new-doc-type"
  | null;

export type UserRole =
  | "Prestador"
  | "Requisitante"
  | "Operação"
  | "Autorizador"
  | "Financeiro"
  | "Administrador";

export type DocDirection = "inbound" | "outbound";

export type DocTypeCategory = "Fiscal de Serviços" | "Fiscal Mercantil" | "Transporte & Logística" | "Financeiro & Outros";

export interface DocTypeDefinition {
  id: string;
  name: string;
  category: DocTypeCategory;
  shortLabel: string;
  badgeTone: "blue" | "green" | "purple" | "orange" | "gray";
  hasSchedule: boolean;
  hasOrderLinking: boolean;
  hasFinancialFlow: boolean;
  active: boolean;
}

export interface RelatedDoc {
  id: string;
  protocol: string;
  type: string;
  number: string;
  value: string;
  status: string;
  relationship: string;
}

export interface CteScheduleData {
  scheduleDate: string;
  scheduleWindow: string; // Ex: "08:00 - 12:00"
  bayOrDock: string;      // Ex: "Doca 04"
  driverName?: string;
  driverCpf?: string;
  plate?: string;
  transportStatus: "Não agendado" | "Agendado" | "Em trânsito" | "No pátio" | "Concluído" | "Reagendamento solicitado";
  rescheduleReason?: string;
  history: {
    date: string;
    action: string;
    user: string;
    note?: string;
  }[];
}

export interface DocumentRecord {
  id: string;
  protocol: string;
  type: string;
  direction: DocDirection;
  number: string;
  series: string;
  accessKey?: string;
  company: string;
  branch: string;
  partnerName: string;
  partnerCnpj: string;
  orderNumber?: string;
  orderSheet?: string;
  issueDate: string;
  dueDate?: string;
  valueGross: string;
  valueNet: string;
  currency: string;
  status: string;
  statusTone: "blue" | "green" | "orange" | "red" | "purple" | "gray";
  paymentStatus: "Não aplicável" | "Em validação" | "Em programação" | "Programado" | "Pago" | "Bloqueado";
  paymentDate?: string;
  lastUpdated: string;
  // Campos operacionais para CT-e e logística
  cteSchedule?: CteScheduleData;
  // Campos de MDF-e
  mdfeData?: {
    damdfe: string;
    totalWeight: string;
    unitsCount: number;
    cteCount: number;
    originUf: string;
    destUf: string;
  };
  // Relacionamentos entre documentos
  relatedDocs?: RelatedDoc[];
  // Divergência / pendência
  pendingIssue?: {
    title: string;
    description: string;
    difference?: string;
    severity: "Crítica" | "Alta" | "Média";
  };
}

export const INITIAL_DOC_TYPES: DocTypeDefinition[] = [
  { id: "NF-e", name: "Nota Fiscal Eletrônica de Mercadorias", category: "Fiscal Mercantil", shortLabel: "NF-e", badgeTone: "blue", hasSchedule: false, hasOrderLinking: true, hasFinancialFlow: true, active: true },
  { id: "NFS-e", name: "Nota Fiscal de Serviços Eletrônica", category: "Fiscal de Serviços", shortLabel: "NFS-e", badgeTone: "green", hasSchedule: false, hasOrderLinking: true, hasFinancialFlow: true, active: true },
  { id: "NFC-e", name: "Nota Fiscal de Consumidor Eletrônica", category: "Fiscal Mercantil", shortLabel: "NFC-e", badgeTone: "blue", hasSchedule: false, hasOrderLinking: false, hasFinancialFlow: true, active: true },
  { id: "CT-e", name: "Conhecimento de Transporte Eletrônico", category: "Transporte & Logística", shortLabel: "CT-e", badgeTone: "purple", hasSchedule: true, hasOrderLinking: true, hasFinancialFlow: true, active: true },
  { id: "CT-e OS", name: "CT-e Outros Serviços", category: "Transporte & Logística", shortLabel: "CT-e OS", badgeTone: "purple", hasSchedule: true, hasOrderLinking: true, hasFinancialFlow: true, active: true },
  { id: "MDF-e", name: "Manifesto Eletrônico de Documentos Fiscais", category: "Transporte & Logística", shortLabel: "MDF-e", badgeTone: "purple", hasSchedule: true, hasOrderLinking: false, hasFinancialFlow: false, active: true },
  { id: "CIOT", name: "Código Identificador da Operação de Transporte", category: "Transporte & Logística", shortLabel: "CIOT", badgeTone: "orange", hasSchedule: false, hasOrderLinking: false, hasFinancialFlow: true, active: true },
  { id: "ND", name: "Nota de Débito / Despesas", category: "Financeiro & Outros", shortLabel: "ND", badgeTone: "gray", hasSchedule: false, hasOrderLinking: true, hasFinancialFlow: true, active: true },
  { id: "FAT", name: "Fatura Comercial / Recibo", category: "Financeiro & Outros", shortLabel: "FAT", badgeTone: "gray", hasSchedule: false, hasOrderLinking: false, hasFinancialFlow: true, active: true },
];

export const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: "doc-1",
    protocol: "TTX-2025-04891",
    type: "NFS-e",
    direction: "inbound",
    number: "2025000001847",
    series: "NF",
    accessKey: "35250612345678000190550010000018471000184201",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500098214",
    orderSheet: "10001842",
    issueDate: "18/06/2025",
    dueDate: "28/06/2025",
    valueGross: "R$ 48.750,00",
    valueNet: "R$ 45.463,48",
    currency: "BRL",
    status: "Com pendência",
    statusTone: "orange",
    paymentStatus: "Bloqueado",
    lastUpdated: "Hoje, 10:42",
    pendingIssue: {
      title: "Divergência de valor com pedido",
      description: "O valor informado excede o saldo disponível da folha no SAP em R$ 2.350,00.",
      difference: "R$ 2.350,00",
      severity: "Alta",
    },
    relatedDocs: [
      { id: "rel-1", protocol: "TTX-2025-04822", type: "NF-e", number: "000.198.441", value: "R$ 32.180,90", status: "Processada", relationship: "Materiais vinculados ao serviço" },
    ],
  },
  {
    id: "doc-2",
    protocol: "TTX-2025-04876",
    type: "CT-e",
    direction: "inbound",
    number: "000008412",
    series: "1",
    accessKey: "35250698765432000110570010000084121000084129",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500097741",
    issueDate: "17/06/2025",
    dueDate: "25/06/2025",
    valueGross: "R$ 14.850,00",
    valueNet: "R$ 14.850,00",
    currency: "BRL",
    status: "Agendado",
    statusTone: "purple",
    paymentStatus: "Programado",
    paymentDate: "25/06/2025",
    lastUpdated: "Hoje, 09:18",
    cteSchedule: {
      scheduleDate: "20/06/2025",
      scheduleWindow: "08:00 - 10:00",
      bayOrDock: "Doca 02 (Recepção Sul)",
      driverName: "Motorista exemplo",
      driverCpf: "000.***.***-00",
      plate: "BRA4E21",
      transportStatus: "Agendado",
      history: [
        { date: "17/06 14:10", action: "Agendamento criado", user: "Portal do Prestador", note: "Janela inicial solicitada" },
        { date: "18/06 09:18", action: "Aprovação de janela", user: "Operação (Usuário exemplo)", note: "Confirmado na Doca 02" },
      ],
    },
    relatedDocs: [
      { id: "rel-mdf1", protocol: "TTX-2025-04800", type: "MDF-e", number: "000001244", value: "R$ 285.000,00", status: "Em trânsito", relationship: "Manifesto consolidado" },
      { id: "rel-nfe1", protocol: "TTX-2025-04801", type: "NF-e", number: "000.512.981", value: "R$ 126.400,00", status: "Processada", relationship: "Carga transportada" },
    ],
  },
  {
    id: "doc-3",
    protocol: "TTX-2025-04870",
    type: "CT-e",
    direction: "inbound",
    number: "000008413",
    series: "1",
    accessKey: "35250698765432000110570010000084131000084135",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500097788",
    issueDate: "17/06/2025",
    dueDate: "26/06/2025",
    valueGross: "R$ 8.920,00",
    valueNet: "R$ 8.920,00",
    currency: "BRL",
    status: "Aguardando agendamento",
    statusTone: "orange",
    paymentStatus: "Em programação",
    lastUpdated: "Hoje, 08:30",
    cteSchedule: {
      scheduleDate: "",
      scheduleWindow: "",
      bayOrDock: "",
      driverName: "Motorista exemplo",
      plate: "QPR9J88",
      transportStatus: "Não agendado",
      history: [
        { date: "17/06 18:00", action: "CT-e Autorizado SEFAZ", user: "SEFAZ SP" },
      ],
    },
  },
  {
    id: "doc-4",
    protocol: "TTX-2025-04865",
    type: "MDF-e",
    direction: "outbound",
    number: "000001244",
    series: "1",
    accessKey: "35250645678901000123580010000012441000012442",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    issueDate: "16/06/2025",
    valueGross: "R$ 285.000,00",
    valueNet: "R$ 285.000,00",
    currency: "BRL",
    status: "Em trânsito",
    statusTone: "blue",
    paymentStatus: "Não aplicável",
    lastUpdated: "Hoje, 07:15",
    mdfeData: {
      damdfe: "DAMDFE 1244/SP",
      totalWeight: "18.450 kg",
      unitsCount: 420,
      cteCount: 3,
      originUf: "SP",
      destUf: "PR",
    },
    cteSchedule: {
      scheduleDate: "20/06/2025",
      scheduleWindow: "14:00 - 18:00",
      bayOrDock: "Pátio Geral",
      driverName: "Motorista exemplo",
      driverCpf: "000.***.***-00",
      plate: "CUR4A99",
      transportStatus: "Em trânsito",
      history: [
        { date: "16/06 10:00", action: "MDF-e emitido", user: "Filial 01" },
        { date: "16/06 15:30", action: "Viagem iniciada", user: "Check-in Filial 01" },
      ],
    },
    relatedDocs: [
      { id: "rel-cte1", protocol: "TTX-2025-04876", type: "CT-e", number: "000008412", value: "R$ 14.850,00", status: "Agendado", relationship: "CT-e do manifesto" },
      { id: "rel-cte2", protocol: "TTX-2025-04870", type: "CT-e", number: "000008413", value: "R$ 8.920,00", status: "Aguardando agendamento", relationship: "CT-e do manifesto" },
    ],
  },
  {
    id: "doc-5",
    protocol: "TTX-2025-04822",
    type: "NF-e",
    direction: "inbound",
    number: "000.198.441",
    series: "2",
    accessKey: "35250612345678000190550020001984411000198441",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500096932",
    issueDate: "14/06/2025",
    dueDate: "24/06/2025",
    valueGross: "R$ 32.180,90",
    valueNet: "R$ 32.180,90",
    currency: "BRL",
    status: "Processada",
    statusTone: "green",
    paymentStatus: "Em programação",
    lastUpdated: "Ontem, 16:32",
  },
  {
    id: "doc-6",
    protocol: "TTX-2025-04798",
    type: "CIOT",
    direction: "inbound",
    number: "9812440182",
    series: "U",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500096511",
    issueDate: "12/06/2025",
    valueGross: "R$ 18.920,00",
    valueNet: "R$ 18.920,00",
    currency: "BRL",
    status: "Em validação",
    statusTone: "blue",
    paymentStatus: "Em validação",
    lastUpdated: "Ontem, 14:05",
  },
  {
    id: "doc-7",
    protocol: "TTX-2025-04751",
    type: "NF-e",
    direction: "outbound",
    number: "000.512.981",
    series: "1",
    accessKey: "35250698765432000110550010005129811000512981",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500095827",
    issueDate: "10/06/2025",
    dueDate: "17/06/2025",
    valueGross: "R$ 8.445,70",
    valueNet: "R$ 8.445,70",
    currency: "BRL",
    status: "Paga",
    statusTone: "green",
    paymentStatus: "Pago",
    paymentDate: "17/06/2025",
    lastUpdated: "17/06, 08:47",
  },
  {
    id: "doc-8",
    protocol: "TTX-2025-04740",
    type: "CT-e",
    direction: "inbound",
    number: "000008401",
    series: "1",
    company: "Empresa exemplo",
    branch: "Filial 01",
    partnerName: "Prestador exemplo Ltda.",
    partnerCnpj: "00.000.000/0001-00",
    orderNumber: "4500095111",
    issueDate: "09/06/2025",
    dueDate: "19/06/2025",
    valueGross: "R$ 22.340,00",
    valueNet: "R$ 22.340,00",
    currency: "BRL",
    status: "No pátio",
    statusTone: "blue",
    paymentStatus: "Programado",
    paymentDate: "20/06/2025",
    lastUpdated: "Hoje, 11:00",
    cteSchedule: {
      scheduleDate: "18/06/2025",
      scheduleWindow: "10:00 - 12:00",
      bayOrDock: "Doca 01",
      driverName: "Motorista exemplo",
      plate: "GHY5T12",
      transportStatus: "No pátio",
      history: [
        { date: "09/06 11:20", action: "Agendamento criado", user: "Portal do Prestador" },
        { date: "18/06 09:50", action: "Check-in na portaria", user: "Portaria Filial 01" },
      ],
    },
  },
];
