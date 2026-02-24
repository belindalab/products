export interface ProductSummary {
  name: string;
  group: string;
  image?: string;
}

export interface ProductData {
  [key: string]: string;
}

export interface HistoryItem {
  question: string;
  answer: string;
  date?: string;      // returned by Google Apps Script
  timestamp?: string; // alias kept for compatibility
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  answer?: string; // For AI response
  error?: string;
}

export type TabType = 'info' | 'chat' | 'history' | 'analytics';

export interface AnalyticsItem {
  label: string;
  count: number;
}

export interface AnalyticsCountryItem extends AnalyticsItem {
  products: { name: string; group: string }[];
}

export interface AnalyticsData {
  total: number;
  newProducts: { name: string; group: string }[];
  byGroup: AnalyticsItem[];
  byCountry: AnalyticsCountryItem[];
  byConditions: AnalyticsItem[];
}

export const APP_URL = "https://script.google.com/macros/s/AKfycbx1ds_G9Yo68L8lylmIw70mM9stdcdWzVdePFoqW6F2QxDphi_aWAOHXLGULSi7HH2sPg/exec";