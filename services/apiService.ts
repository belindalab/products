import { APP_URL, ApiResponse, ProductData, HistoryItem, ProductSummary, AnalyticsData } from '../types';

export const apiService = {
  getProducts: async (): Promise<ProductSummary[]> => {
    try {
      const res = await fetch(`${APP_URL}?action=products`);
      const json: ApiResponse<any[]> = await res.json();
      if (!json.ok || !json.data) return [];
      
      return json.data.map((item: any): ProductSummary => {
        if (typeof item === 'string') {
          return { name: item, group: 'Общее', image: '' };
        }

        let name: any, group: any, image: any = '';

        if (Array.isArray(item)) {
          name  = item[0];
          group = item[1];
          image = item[2] || '';
        } else if (typeof item === 'object' && item !== null) {
          const values = Object.values(item);
          name  = item['Торговое название'] || item['Частное название'] || item.name || values[0];
          group = item['Группа'] || item.group || item.category || values[1];
          image = item['Фото'] || item['photo'] || '';
        }

        return {
          name:  String(name  || 'Без названия'),
          group: String(group || 'Общее'),
          image: String(image || ''),
        };
      });
    } catch (e) {
      console.error("Failed to fetch products", e);
      return [];
    }
  },

  getProductDetails: async (name: string): Promise<ProductData | null> => {
    try {
      const res = await fetch(`${APP_URL}?action=product&name=${encodeURIComponent(name)}`);
      const json: ApiResponse<ProductData> = await res.json();
      return json.ok && json.data ? json.data : null;
    } catch (e) {
      console.error("Failed to fetch details", e);
      return null;
    }
  },

  getHistory: async (name: string): Promise<HistoryItem[]> => {
    try {
      const res = await fetch(`${APP_URL}?action=history&name=${encodeURIComponent(name)}`);
      const json: ApiResponse<HistoryItem[]> = await res.json();
      return json.ok && json.data ? json.data : [];
    } catch (e) {
      console.error("Failed to fetch history", e);
      return [];
    }
  },

  getAnalytics: async (group?: string): Promise<AnalyticsData | null> => {
    try {
      const params = new URLSearchParams({ action: 'analytics' });
      if (group && group !== 'Все') params.set('group', group);
      const res = await fetch(`${APP_URL}?${params.toString()}`);
      const json: ApiResponse<AnalyticsData> = await res.json();
      return json.ok && json.data ? json.data : null;
    } catch (e) {
      console.error('Failed to fetch analytics', e);
      return null;
    }
  },

  askAI: async (name: string, question: string): Promise<string | null> => {
    try {
      const form = new URLSearchParams();
      form.append('action', 'ask');
      form.append('name', name);
      form.append('question', question);

      const res = await fetch(APP_URL, {
        method: "POST",
        body: form
      });
      const json: ApiResponse<null> = await res.json();
      return json.ok && json.answer ? json.answer : null;
    } catch (e) {
      console.error("AI Request failed", e);
      return null;
    }
  }
};