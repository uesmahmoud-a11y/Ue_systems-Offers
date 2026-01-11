
import { Quote, AppMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const QuoteService = {
  getAll: async (): Promise<Quote[]> => {
    const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
    const STORAGE_KEY = `${mode}_quotes_db`;
    
    // 1. جلب البيانات المحلية أولاً (دائماً متاحة وسريعة)
    let localQuotes: Quote[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      localQuotes = stored ? JSON.parse(stored) : [];
    } catch (e) {}

    if (!isSupabaseConfigured()) return localQuotes;

    try {
      // 2. محاولة جلب التحديثات من السحابة في الخلفية
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('offer_date', { ascending: false });

      if (!error && data) {
        const remoteQuotes = data
          .filter((row: any) => mode === 'almoawen' ? row.app_mode === 'almoawen' : (row.app_mode === 'alafdl' || !row.app_mode))
          .map((row: any) => ({
            id: row.id,
            clientName: row.client_name,
            offerDate: row.offer_date,
            expiryDate: row.expiry_date,
            items: row.items || [],
            discountAmount: row.discount_amount || 0,
            currencyRate: row.currency_rate || 50,
            quoteType: (row.currency_rate && row.currency_rate < 1.05) ? 'usd' : 'mixed' as any,
            app_mode: row.app_mode
          })) as Quote[];
        
        // تحديث المحلي بما جاء من السحابة
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteQuotes));
        return remoteQuotes;
      }
    } catch (err) {}
    
    return localQuotes;
  },

  save: async (quote: Quote): Promise<void> => {
    const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
    const STORAGE_KEY = `${mode}_quotes_db`;

    // --- الخطوة الأهم: الحفظ المحلي الفوري ---
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const idx = quotes.findIndex((q: any) => q.id === quote.id);
    if (idx >= 0) {
      quotes[idx] = quote;
    } else {
      quotes.unshift(quote); // إضافة في البداية
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));

    // محاولة الحفظ في السحابة "بصمت"
    if (isSupabaseConfigured()) {
      try {
        // Fix: Changed quote.discount_amount to quote.discountAmount to match Quote interface
        const { error } = await supabase.from('quotes').upsert({
          id: quote.id,
          app_mode: mode,
          client_name: quote.clientName,
          offer_date: quote.offerDate,
          expiry_date: quote.expiryDate,
          items: quote.items,
          discount_amount: quote.discountAmount,
          currency_rate: quote.quoteType === 'usd' ? 1.0 : quote.currencyRate
        });
        
        if (error) {
          console.warn("Cloud Sync Deferred (CORS or Network):", error.message);
        }
      } catch (err) {
        // لا نعطل المستخدم إذا فشل الاتصال بالسحابة
      }
    }
  },

  delete: async (id: string): Promise<void> => {
    const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
    const STORAGE_KEY = `${mode}_quotes_db`;
    const quotes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes.filter((q: any) => q.id !== id)));

    if (isSupabaseConfigured()) {
      try { await supabase.from('quotes').delete().eq('id', id); } catch (err) {}
    }
  }
};