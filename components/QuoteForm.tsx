
import React, { useState, useEffect } from 'react';
import { Quote, QuoteItem, INITIAL_QUOTE, Product, AppMode, OrganizationSettings } from '../types';
import { ProductService } from '../services/productService';
import { SettingsService } from '../services/settingsService';
import { Save, ArrowLeft, Calculator, Trash2, Loader2, Percent, Edit3, Info, FileCode, ScrollText } from 'lucide-react';

interface Props {
  initialData?: Quote | null;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
}

const QuoteItemRow: React.FC<{
  item: QuoteItem;
  quoteType: string;
  currencyRate: number;
  onUpdate: (id: string, updates: Partial<QuoteItem>) => void;
  onDelete: (id: string) => void;
  onToggleLicense: (id: string) => void;
}> = ({ item, quoteType, currencyRate, onUpdate, onDelete, onToggleLicense }) => {
    const isMixed = quoteType === 'mixed';
    const currencyLabel = isMixed ? 'ج.م' : '$';
    
    const refPriceUSD = item.unitPrice;
    const offerPriceBeforeDiscount = item.customPrice !== undefined 
        ? item.customPrice 
        : (isMixed ? refPriceUSD * currencyRate : refPriceUSD);
    
    const discountAmountPerUnit = (offerPriceBeforeDiscount * item.discountValue) / 100;
    const finalPricePerUnit = offerPriceBeforeDiscount - discountAmountPerUnit;
    const totalRow = finalPricePerUnit * item.count;

    return (
        <div className={`bg-white p-5 rounded-2xl border-2 transition-all space-y-4 relative border-r-8 ${isMixed ? 'border-gray-100 hover:border-primary/20 border-r-primary' : 'border-slate-100 hover:border-slate-900/20 border-r-slate-900'}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <textarea 
                        rows={1}
                        className="w-full border-none p-0 text-md font-bold focus:ring-0 text-black placeholder-gray-300 bg-white resize-none overflow-hidden force-light-input" 
                        value={item.description} 
                        onChange={e => onUpdate(item.id, { description: e.target.value })} 
                        placeholder="وصف الترخيص أو الخدمة..." 
                    />
                </div>
                <button type="button" onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18}/>
                </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <label className="block text-[9px] font-bold text-gray-400 mb-1">المرجع ($)</label>
                    <div className="text-sm font-mono font-bold text-gray-500">${refPriceUSD.toLocaleString()}</div>
                </div>

                <div className="bg-orange-50 p-2 rounded-xl border border-orange-200">
                    <label className="block text-[9px] font-bold text-orange-600 mb-1 flex items-center gap-1">
                        <Edit3 size={10}/> سعر العرض ({currencyLabel})
                    </label>
                    <input 
                        className="w-full bg-white border-none p-0 text-sm font-black text-orange-800 outline-none font-mono force-light-input" 
                        type="number" 
                        placeholder={offerPriceBeforeDiscount.toString()}
                        value={item.customPrice ?? ''} 
                        onChange={e => onUpdate(item.id, { customPrice: e.target.value ? Number(e.target.value) : undefined })} 
                    />
                </div>

                <div className="bg-blue-50 p-2 rounded-xl border border-blue-200">
                    <label className="block text-[9px] font-bold text-blue-600 mb-1 flex items-center gap-1">
                        <Percent size={10}/> الخصم (%)
                    </label>
                    <input 
                        className="w-full bg-white border-none p-0 text-sm font-black text-blue-800 outline-none font-mono force-light-input" 
                        type="number" 
                        value={item.discountValue} 
                        onChange={e => onUpdate(item.id, { discountValue: Number(e.target.value), discountType: 'percentage' })} 
                    />
                </div>

                <div className="bg-gray-50 p-2 rounded-xl border border-gray-100 text-center">
                    <label className="block text-[9px] font-bold text-gray-400 mb-1">الكمية</label>
                    <input className="w-full bg-white border-none p-0 text-sm font-black text-center outline-none font-mono force-light-input" type="number" value={item.count} onChange={e => onUpdate(item.id, { count: Number(e.target.value) })} />
                </div>

                <div className="p-1">
                    <label className="block text-[9px] font-bold text-gray-400 mb-1 text-center">الترخيص</label>
                    <button type="button" onClick={() => onToggleLicense(item.id)} className={`w-full py-2 rounded-xl text-[9px] font-black border transition-all ${item.isMainLicense ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-blue-200 text-blue-600'}`}>
                        {item.isMainLicense ? 'رئيسي' : 'إضافي'}
                    </button>
                </div>

                <div className="bg-gray-900 p-2 rounded-xl text-white text-left overflow-hidden">
                    <label className="block text-[8px] font-bold text-gray-400 mb-0.5 uppercase tracking-tighter">الإجمالي ({currencyLabel})</label>
                    <div className="font-mono font-black text-xs text-emerald-400 truncate">
                        {totalRow.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const QuoteForm: React.FC<Props> = ({ initialData, onSave, onCancel }) => {
  const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<OrganizationSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [formData, setFormData] = useState<Quote>(initialData || { 
      ...INITIAL_QUOTE, 
      id: crypto.randomUUID(), 
      app_mode: mode,
  });

  useEffect(() => {
    const fetchData = async () => {
        const [prods, sets] = await Promise.all([
            ProductService.getAll(),
            SettingsService.getSettings()
        ]);
        
        setProducts(prods);
        setSettings(sets);

        if (!initialData) {
            setFormData(prev => ({ 
                ...prev, 
                currencyRate: sets.defaultCurrencyRate || 50,
                technicalOfferContent: sets.technicalOfferTemplate || '',
                termsContent: sets.termsAndConditions || ''
            }));
        }
        setIsInitializing(false);
    };
    
    fetchData();
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addItem = (product?: Product) => {
    const isMixed = formData.quoteType === 'mixed';
    const customPrice = (isMixed && product && product.unitPriceLocal > 0) ? product.unitPriceLocal : undefined;

    const newItem: QuoteItem = {
      id: crypto.randomUUID(),
      productId: product?.id,
      description: product ? `${product.description || product.name}` : '',
      unitPrice: product ? product.unitPriceUSD : 0,
      customPrice: customPrice,
      discountType: 'percentage',
      discountValue: 0,
      discountPerUnit: 0,
      count: 1,
      isMainLicense: true, 
      supportPricePerUnit: product ? product.supportPriceMain : 0
    };
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const totals = (() => {
    let totalDiscountLocal = 0;
    let finalTotalLocal = 0;
    let totalSupportUSD = 0;
    const isMixed = formData.quoteType === 'mixed';

    formData.items.forEach(item => {
        const offerPriceBeforeDiscount = item.customPrice !== undefined 
            ? item.customPrice 
            : (isMixed ? item.unitPrice * formData.currencyRate : item.unitPrice);
        const discountAmt = (offerPriceBeforeDiscount * item.discountValue) / 100;
        totalDiscountLocal += (discountAmt * item.count);
        finalTotalLocal += (offerPriceBeforeDiscount - discountAmt) * item.count;
        totalSupportUSD += (item.supportPricePerUnit * item.count);
    });
    return { totalDiscountLocal, finalTotalLocal, totalSupportUSD };
  })();

  const isMixed = formData.quoteType === 'mixed';
  const inputClass = "w-full border-2 border-gray-100 p-3 rounded-xl focus:border-primary outline-none font-bold bg-white text-black force-light-input";

  if (isInitializing) {
      return (
        <div className="max-w-6xl mx-auto bg-white p-20 rounded-3xl shadow-xl text-center flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-gray-500 font-bold">جاري استدعاء الإعدادات والبيانات من السحابة...</p>
        </div>
      );
  }

  return (
    <div className={`max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border-t-8 ${isMixed ? 'border-primary' : 'border-slate-900'}`} dir="rtl">
      <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-100">
        <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
            <Calculator className={isMixed ? 'text-primary' : 'text-slate-900'} />
            {initialData ? 'تعديل عرض السعر' : 'إنشاء عرض سعر جديد'}
        </h3>
        <div className="flex bg-gray-200 p-1 rounded-xl gap-1">
            <button type="button" onClick={() => setFormData(prev => ({...prev, quoteType: 'mixed', currencyRate: settings?.defaultCurrencyRate || 50}))}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${isMixed ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}>
                مختلط (ج.م)
            </button>
            <button type="button" onClick={() => setFormData(prev => ({...prev, quoteType: 'usd', currencyRate: 1}))}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${formData.quoteType === 'usd' ? 'bg-white text-slate-900 shadow-sm' : 'text-gray-500'}`}>
                دولاري ($)
            </button>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors"><ArrowLeft /></button>
      </div>

      <form onSubmit={async (e) => { 
          e.preventDefault(); 
          setIsSaving(true); 
          try { 
            await onSave({ 
              ...formData, 
              supportFeesAmount: totals.totalSupportUSD, 
              discountAmount: isMixed ? totals.totalDiscountLocal / formData.currencyRate : totals.totalDiscountLocal
            }); 
          } finally { 
            setIsSaving(false); 
          } 
        }} className="p-8 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-gray-700 mb-1">اسم العميل</label>
            <input required type="text" name="clientName" value={formData.clientName} onChange={handleInputChange} className={inputClass} placeholder="أدخل اسم العميل..." />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">تاريخ العرض</label>
            <input type="date" name="offerDate" value={formData.offerDate} onChange={handleInputChange} className={inputClass} />
          </div>
        </div>

        {isMixed && (
          <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Info className="text-yellow-600" size={20}/>
                <span className="text-sm font-bold text-yellow-800">سعر الصرف المستخدم لهذا العرض (1 دولار = ? جنيهاً)</span>
            </div>
            <input type="number" step="0.1" value={formData.currencyRate} onChange={e => setFormData(prev => ({...prev, currencyRate: Number(e.target.value)}))} className="w-24 bg-white border border-yellow-200 rounded-lg p-2 font-black text-center text-primary force-light-input" />
          </div>
        )}

        <div className="space-y-4">
          <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
            <h4 className="font-black text-gray-700 text-sm">بنود عرض السعر</h4>
            <div className="flex gap-2">
                <select className="text-xs border rounded-lg px-3 py-1 bg-white font-bold outline-none border-gray-200 shadow-sm force-light-input text-black" onChange={(e) => { const p = products.find(prod => prod.id === e.target.value); if (p) addItem(p); e.target.value = ""; }}>
                    <option value="">+ اختيار منتج من المخزن</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button type="button" onClick={() => addItem()} className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors shadow-sm text-black">إضافة بند يدوي</button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {formData.items.map((item) => (
              <QuoteItemRow 
                key={item.id}
                item={item}
                quoteType={formData.quoteType}
                currencyRate={formData.currencyRate}
                onUpdate={(id, updates) => setFormData(prev => ({ ...prev, items: prev.items.map(i => i.id === id ? {...i, ...updates} : i)}))}
                onDelete={(id) => setFormData(prev => ({...prev, items: prev.items.filter(i => i.id !== id)}))}
                onToggleLicense={(id) => {
                    setFormData(prev => ({
                      ...prev,
                      items: prev.items.map(item => {
                        if (item.id !== id) return item;
                        const isNowMain = !item.isMainLicense;
                        const prod = products.find(p => p.id === item.productId);
                        return { 
                          ...item, 
                          isMainLicense: isNowMain,
                          supportPricePerUnit: prod ? (isNowMain ? prod.supportPriceMain : prod.supportPriceSub) : item.supportPricePerUnit
                        };
                      })
                    }));
                }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2"><FileCode size={16} className="text-primary"/> العرض الفني المخصص</label>
                <textarea name="technicalOfferContent" value={formData.technicalOfferContent} onChange={handleInputChange} rows={6} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-primary outline-none text-sm font-bold bg-white text-black force-light-input" placeholder="التفاصيل الفنية..." />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 flex items-center gap-2"><ScrollText size={16} className="text-emerald-600"/> الاتفاقية المخصصة</label>
                <textarea name="termsContent" value={formData.termsContent} onChange={handleInputChange} rows={6} className="w-full border-2 border-gray-100 p-4 rounded-2xl focus:border-emerald-600 outline-none text-sm font-bold bg-white text-black force-light-input" placeholder="شروط التعاقد..." />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div>
                    <p className="text-[10px] font-black text-blue-500 uppercase">الدعم السنوي المجمع</p>
                    <p className="text-xl font-black text-blue-900 font-mono">${totals.totalSupportUSD.toLocaleString()}</p>
                </div>
                <div className="text-blue-200"><Calculator size={40}/></div>
            </div>
            <div className={`p-5 rounded-2xl shadow-xl text-white flex justify-between items-center ${isMixed ? 'bg-primary' : 'bg-gray-900'}`}>
                <div>
                    <p className="text-[10px] font-black opacity-60 uppercase">إجمالي صافي العرض</p>
                    <p className="text-3xl font-black font-mono">
                        {isMixed ? `${Math.round(totals.finalTotalLocal).toLocaleString()} ج.م` : `$${totals.finalTotalLocal.toLocaleString(undefined, {minimumFractionDigits:2})}`}
                    </p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-800 transition-colors">إلغاء</button>
          <button disabled={isSaving} type="submit" className={`px-12 py-3 text-white rounded-2xl font-black shadow-lg flex items-center gap-2 transition-all active:scale-95 ${isMixed ? 'bg-primary hover:bg-primaryDark' : 'bg-gray-900 hover:bg-black'}`}>
            {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />} حفظ عرض السعر
          </button>
        </div>
      </form>
    </div>
  );
};
