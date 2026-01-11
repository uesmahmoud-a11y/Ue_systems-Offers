
import { OrganizationSettings, INITIAL_SETTINGS, AppMode } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const getSystemKey = () => {
  const mode = sessionStorage.getItem('app_mode') as AppMode;
  return mode === 'almoawen' ? 'INTERNAL_SYSTEM_MOAWEN_V1' : 'INTERNAL_SYSTEM_AFDL_V1';
};

export const SettingsService = {
  getSettings: async (): Promise<OrganizationSettings> => {
    const systemKey = getSystemKey();
    const mode = sessionStorage.getItem('app_mode') as AppMode;

    // محاولة جلب الإعدادات من السحابة
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('company_name', systemKey)
          .maybeSingle();
        
        if (!error && data) {
          let displayAddress = data.address || '';
          let displayCompanyName = '';
          
          if (displayAddress.includes('||')) {
            const parts = displayAddress.split('||');
            displayAddress = parts[0];
            displayCompanyName = parts[1];
          }

          const settings = {
             id: data.id,
             companyName: displayCompanyName || '',
             companyDescription: data.company_description || '',
             logoUrl: data.logo_url || '',
             address: displayAddress,
             phone: data.phone || '',
             email: data.email || '',
             website: data.website || '',
             taxNumber: data.tax_number || '',
             commercialRecord: data.commercial_record || '',
             primaryColor: data.primary_color || (mode === 'almoawen' ? '#ea580c' : '#1e40af'),
             defaultCurrencyRate: data.default_currency_rate || 50,
             technicalOfferTemplate: data.technical_offer_template || '',
             termsAndConditions: data.terms_and_conditions || ''
          };

          // حفظ نسخة محلية للتأمين
          localStorage.setItem(systemKey, JSON.stringify(settings));
          return settings;
        }
      } catch (e) {}
    }

    // العودة للنسخة المحلية إذا فشل المفتاح
    try {
      const localData = localStorage.getItem(systemKey);
      if (localData) return JSON.parse(localData);
      return { 
        ...INITIAL_SETTINGS, 
        primaryColor: mode === 'almoawen' ? '#ea580c' : '#1e40af' 
      };
    } catch (e) { return INITIAL_SETTINGS; }
  },

  saveSettings: async (settings: OrganizationSettings): Promise<void> => {
    const systemKey = getSystemKey();
    
    // حفظ محلي أولاً
    localStorage.setItem(systemKey, JSON.stringify(settings));

    if (isSupabaseConfigured()) {
        try {
          const dbPayload: any = {
              company_name: systemKey,
              company_description: settings.companyDescription,
              logo_url: settings.logoUrl,
              address: `${settings.address}||${settings.companyName}`,
              phone: settings.phone,
              email: settings.email,
              website: settings.website,
              tax_number: settings.taxNumber,
              commercial_record: settings.commercialRecord,
              primary_color: settings.primaryColor,
              default_currency_rate: Number(settings.defaultCurrencyRate),
              technical_offer_template: settings.technicalOfferTemplate,
              terms_and_conditions: settings.termsAndConditions
          };

          const { data: existing } = await supabase
            .from('organization_settings')
            .select('id')
            .eq('company_name', systemKey)
            .maybeSingle();

          if (existing?.id) {
            await supabase.from('organization_settings').update(dbPayload).eq('id', existing.id);
          } else {
            await supabase.from('organization_settings').insert([dbPayload]);
          }
        } catch (err) {}
    }
  }
};
