
import { Product, AppMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const ProductService = {
  getAll: async (): Promise<Product[]> => {
    const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
    const STORAGE_KEY = `${mode}_products_db`;

    // 1. استرجاع محلي فوري
    let localData: Product[] = [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      localData = stored ? JSON.parse(stored) : [];
    } catch (e) {}

    if (!isSupabaseConfigured()) return localData || [];

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .or(`app_mode.eq.${mode},app_mode.eq.all,app_mode.is.null`)
        .order('name');
      
      if (!error && data) {
        const products = data.map((item: any) => ({
           id: item.id,
           name: item.name,
           unitPriceUSD: item.unit_price_usd,
           unitPriceLocal: item.unit_price_local || 0,
           description: item.description,
           technicalOffer: item.technical_offer,
           supportPriceMain: item.support_price_main,
           supportPriceSub: item.support_price_sub,
           appMode: item.app_mode
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
        return products;
      }
    } catch (e) {
      console.warn("Database empty or disconnected, using local data.");
    }

    return localData || [];
  },

  save: async (product: Product): Promise<void> => {
    const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
    const STORAGE_KEY = `${mode}_products_db`;

    const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const existingIndex = products.findIndex((p: Product) => p.id === product.id);
    if (existingIndex >= 0) products[existingIndex] = product; else products.push(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));

    if (isSupabaseConfigured()) {
      try {
        // Fix: Changed product.support_price_main to product.supportPriceMain
        // Fix: Changed product.support_price_sub to product.supportPriceSub
        await supabase.from('products').upsert({
            id: product.id,
            app_mode: product.appMode || mode,
            name: product.name,
            unit_price_usd: product.unitPriceUSD,
            unit_price_local: product.unitPriceLocal,
            description: product.description,
            technical_offer: product.technicalOffer,
            support_price_main: product.supportPriceMain,
            support_price_sub: product.supportPriceSub
        });
      } catch (err) {}
    }
  },

  delete: async (id: string): Promise<void> => {
    const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
    const STORAGE_KEY = `${mode}_products_db`;
    const products = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products.filter((p: Product) => p.id !== id)));

    if (isSupabaseConfigured()) {
      try { await supabase.from('products').delete().eq('id', id); } catch (err) {}
    }
  }
};