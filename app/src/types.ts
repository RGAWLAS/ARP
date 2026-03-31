export interface Project {
  id: string;
  name: string;
  inquiryNumber: string;
  deadline: string;
  scope: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  mode: 'standard' | 'urgent';
  status: 'new' | 'estimating' | 'offer_sent' | 'accepted' | 'rejected' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
  estimate: CostEstimate;
  offerNotes: string;
  offerValidDays: number;
  revisionsIncluded: number;
  assumptions: string;
  discountPercent: number;
  materialsFromClient: string;
  acceptanceMethod: string;
}

export interface LaborRow {
  role: string;
  rateNet: number;
  hours: number;
}

export interface ExternalCostRow {
  name: string;
  costNet: number;
  marginPercent: number;
}

export interface CostEstimate {
  labor: LaborRow[];
  externalCosts: ExternalCostRow[];
}

export interface AgencyPricing {
  name: string;
  coordinatorRate: number;
  graphicRate: number;
  copywriterRate: number;
  margin: number;
}

export const DEFAULT_LABOR: LaborRow[] = [
  { role: 'Koordynator', rateNet: 90, hours: 0 },
  { role: 'Grafik', rateNet: 110, hours: 0 },
  { role: 'Copywriter', rateNet: 80, hours: 0 },
];

export const AGENCIES: AgencyPricing[] = [
  { name: 'PromoAgency (My)', coordinatorRate: 90, graphicRate: 110, copywriterRate: 80, margin: 4.5 },
  { name: 'CreativeHarder', coordinatorRate: 81.30, graphicRate: 81.30, copywriterRate: 81.30, margin: 3.0 },
  { name: 'Brand New Heaven', coordinatorRate: 89, graphicRate: 99, copywriterRate: 84, margin: 3.0 },
];

export const VAT_RATE = 0.23;

export function createEmptyProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: '',
    inquiryNumber: '',
    deadline: '',
    scope: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    mode: 'standard',
    status: 'new',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    estimate: {
      labor: DEFAULT_LABOR.map(l => ({ ...l })),
      externalCosts: [],
    },
    offerNotes: '',
    offerValidDays: 14,
    revisionsIncluded: 2,
    assumptions: '2 rundy poprawek, 1 wersja językowa',
    discountPercent: 0,
    materialsFromClient: 'Logotypy, księga znaku, treści, wymiary',
    acceptanceMethod: 'Akceptacja mailowa',
  };
}
