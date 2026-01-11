
export type AppMode = 'alafdl' | 'almoawen';

export interface Product {
  id: string;
  name: string;
  unitPriceUSD: number;
  unitPriceLocal: number; // السعر المحلي بالجنيه المصري
  description: string;
  technicalOffer: string;
  supportPriceMain: number;
  supportPriceSub: number;
  appMode?: AppMode | 'all'; 
}

export interface QuoteItem {
  id: string;
  productId?: string;
  description: string;
  unitPrice: number; 
  customPrice?: number; // سعر العرض اليدوي (بالجنيه في المختلط وبـ $ في الدولاري)
  discountType: 'amount' | 'percentage';
  discountValue: number;
  discountPerUnit: number;
  count: number;
  isMainLicense: boolean; 
  supportPricePerUnit: number;
}

export type QuoteType = 'usd' | 'mixed';

export interface Quote {
  id: string;
  app_mode?: AppMode; 
  clientName: string;
  offerDate: string;
  expiryDate: string;
  items: QuoteItem[];
  discountAmount: number;
  currencyRate: number;
  currencyNameMain: string;
  currencyNameLocal: string;
  supportFeesDescription: string;
  supportFeesAmount: number;
  supportFeesCurrency: string;
  quoteType: QuoteType;
  technicalOfferContent?: string; 
  termsContent?: string; 
}

export interface OrganizationSettings {
  id?: string;
  companyName: string;
  companyDescription: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxNumber: string;
  commercialRecord: string;
  primaryColor: string;
  defaultCurrencyRate: number; 
  technicalOfferTemplate: string; 
  termsAndConditions: string; 
}

export const INITIAL_SETTINGS: OrganizationSettings = {
  companyName: 'اسم شركتك هنا',
  companyDescription: 'للحلول التقنية والبرمجيات',
  logoUrl: '',
  address: 'القاهرة، مصر',
  phone: '+20 100 000 0000',
  email: 'info@company.com',
  website: 'www.company.com',
  taxNumber: '',
  commercialRecord: '',
  primaryColor: '#b91c1c',
  defaultCurrencyRate: 50,
  technicalOfferTemplate: '',
  termsAndConditions: ''
};

export const INITIAL_QUOTE: Omit<Quote, 'id'> = {
  clientName: "",
  offerDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  items: [],
  discountAmount: 0,
  currencyRate: 50,
  currencyNameMain: 'دولار أمريكي',
  currencyNameLocal: 'جنيهاً مصرياً',
  supportFeesDescription: 'المصاريف السنوية للدعم الفني وتشمل التحديثات وخدمة الأونلاين.',
  supportFeesAmount: 0,
  supportFeesCurrency: 'دولار أمريكي سنوياً',
  quoteType: 'mixed',
  technicalOfferContent: '',
  termsContent: ''
};
