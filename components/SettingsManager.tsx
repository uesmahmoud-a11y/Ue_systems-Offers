
import React, { useState, useEffect } from 'react';
import { OrganizationSettings, INITIAL_SETTINGS, AppMode } from '../types';
import { SettingsService } from '../services/settingsService';
import { Save, ArrowLeft, Building2, Palette, Loader2, DollarSign, FileText, ShieldCheck, CheckCircle2, Globe, Phone, MapPin, Mail, Settings } from 'lucide-react';

interface Props {
  onBack: () => void;
}

type SettingsTab = 'company' | 'finance' | 'templates';

export const SettingsManager: React.FC<Props> = ({ onBack }) => {
  const mode = (sessionStorage.getItem('app_mode') as AppMode) || 'alafdl';
  const [settings, setSettings] = useState<OrganizationSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const data = await SettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await SettingsService.saveSettings(settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      alert('حدث خطأ أثناء الحفظ في السحابة. يرجى التحقق من الاتصال.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setSettings(prev => ({ 
        ...prev, 
        [name]: name === 'defaultCurrencyRate' ? (value === '' ? 0 : Number(value)) : value 
      }));
  };

  const inputClass = "w-full border-2 border-gray-100 rounded-xl p-3 font-bold bg-white text-black focus:border-primary outline-none transition-all force-light-input shadow-sm";

  if (isLoading) return (
    <div className="p-20 text-center flex flex-col items-center gap-4">
      <Loader2 className="animate-spin text-primary" size={40} />
      <p className="font-bold text-gray-500">جاري جلب إعدادات نظام {mode === 'almoawen' ? 'المعاون' : 'الأفضل'}...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border-t-8 border-gray-800 relative mb-10" dir="rtl">
        {showSuccess && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-black">
            <CheckCircle2 size={24} /> تم تحديث إعدادات {mode === 'almoawen' ? 'المعاون' : 'الأفضل'} بنجاح
          </div>
        )}

        <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-100">
            <h2 className="text-xl font-black flex items-center gap-2 text-gray-800">
                <Settings className="text-primary"/> إعدادات نظام {mode === 'almoawen' ? 'المعاون الأمني' : 'الأفضل المحاسبي'}
            </h2>
            <button onClick={onBack} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-bold transition-colors">
                <ArrowLeft size={16}/> العودة للرئيسية
            </button>
        </div>

        <div className="flex border-b bg-gray-50/50 px-8 gap-6">
            <button type="button" onClick={() => setActiveTab('company')} className={`py-4 px-2 text-sm font-black transition-all border-b-4 ${activeTab === 'company' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>بيانات الشركة</button>
            <button type="button" onClick={() => setActiveTab('finance')} className={`py-4 px-2 text-sm font-black transition-all border-b-4 ${activeTab === 'finance' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>الإعدادات المالية</button>
            <button type="button" onClick={() => setActiveTab('templates')} className={`py-4 px-2 text-sm font-black transition-all border-b-4 ${activeTab === 'templates' ? 'border-primary text-primary' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>قوالب العروض</button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-10 min-h-[500px]">
            {activeTab === 'company' && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg">
                        <Building2 className="text-primary" size={20}/> المعلومات الأساسية واللوجو
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/30 p-8 rounded-3xl border border-gray-100">
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">اسم الشركة الرسمي</label>
                            <input required type="text" name="companyName" value={settings.companyName || ''} onChange={handleChange} className={inputClass} placeholder="مثال: شركة الأفضل للحلول التقنية" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">وصف نشاط الشركة</label>
                            <input type="text" name="companyDescription" value={settings.companyDescription || ''} onChange={handleChange} className={inputClass} placeholder="مثال: رائدة في أنظمة البرمجة المحاسبية" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">العنوان بالتفصيل</label>
                            <input type="text" name="address" value={settings.address || ''} onChange={handleChange} className={inputClass} placeholder="مثال: القاهرة، مدينة نصر، شارع الطيران" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">رقم الهاتف الرسمي</label>
                            <input type="text" name="phone" value={settings.phone || ''} onChange={handleChange} className={inputClass} placeholder="010XXXXXXXX" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">البريد الإلكتروني للشركة</label>
                            <input type="email" name="email" value={settings.email || ''} onChange={handleChange} className={inputClass} placeholder="info@company.com" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">الموقع الإلكتروني</label>
                            <input type="text" name="website" value={settings.website || ''} onChange={handleChange} className={inputClass} placeholder="www.company.com" />
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">رابط شعار الشركة (URL)</label>
                             <input type="text" name="logoUrl" value={settings.logoUrl || ''} onChange={handleChange} className={inputClass} placeholder="ضع رابط الصورة هنا (لتحميله في ملفات PDF)" />
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'finance' && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg">
                        <DollarSign className="text-blue-600" size={20}/> إعدادات العملات والضرائب
                    </h3>
                    <div className="bg-blue-50/50 p-8 rounded-3xl border border-blue-100">
                        <div className="flex flex-col md:flex-row md:items-center gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-bold text-blue-800 mb-2">سعر الصرف الافتراضي (1$ = ? ج.م):</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="defaultCurrencyRate"
                                    value={settings.defaultCurrencyRate}
                                    onChange={handleChange}
                                    className="w-full md:w-48 border-2 border-blue-200 rounded-xl p-4 font-black text-2xl text-center text-blue-900 focus:border-blue-500 outline-none transition-all shadow-sm bg-white force-light-input"
                                />
                            </div>
                            <div className="bg-white/60 p-6 rounded-2xl flex-1 border border-blue-100">
                                <p className="text-xs font-bold text-blue-500 leading-relaxed italic">
                                    هذا السعر هو "سعر الصرف الداخلي" الذي تستخدمه الشركة لتقييم خدماتها. سيُقترح تلقائياً عند إنشاء أي عرض سعر "مختلط" جديد لضمان توحيد التسعير بين جميع الموظفين.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {activeTab === 'templates' && (
                <section className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg">
                        <FileText className="text-emerald-600" size={20}/> قوالب النصوص الثابتة
                    </h3>
                    <div className="grid grid-cols-1 gap-8">
                        <div className="space-y-3">
                             <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                                <FileText className="text-primary" size={18}/> القالب الافتراضي للعرض الفني
                             </label>
                             <textarea
                                name="technicalOfferTemplate"
                                rows={8}
                                value={settings.technicalOfferTemplate || ''}
                                onChange={handleChange}
                                placeholder="اكتب هنا التفاصيل الفنية المشتركة التي تظهر في كل عرض..."
                                className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-primary outline-none transition-all leading-relaxed bg-white text-black force-light-input"
                             />
                        </div>

                        <div className="space-y-3">
                             <label className="text-sm font-black text-gray-700 flex items-center gap-2">
                                <ShieldCheck className="text-emerald-600" size={18}/> اتفاقية الاستخدام والشروط العامة
                             </label>
                             <textarea
                                name="termsAndConditions"
                                rows={8}
                                value={settings.termsAndConditions || ''}
                                onChange={handleChange}
                                placeholder="اكتب هنا الشروط والأحكام الافتراضية للشركة..."
                                className="w-full border-2 border-gray-100 rounded-2xl p-4 text-sm font-bold focus:border-emerald-500 outline-none transition-all leading-relaxed bg-white text-black force-light-input"
                             />
                        </div>
                    </div>
                </section>
            )}

            <div className="pt-8 flex justify-end gap-4 border-t sticky bottom-0 bg-white/95 backdrop-blur-md pb-4 px-2 z-10">
                <button type="button" onClick={onBack} className="px-6 py-2 text-gray-500 font-bold hover:text-gray-800 transition-colors">إلغاء</button>
                <button
                    disabled={isSaving}
                    type="submit"
                    className="px-16 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black flex items-center gap-3 font-black shadow-2xl transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                    {isSaving ? 'جاري المزامنة...' : 'حفظ الإعدادات للنظام الحالي'}
                </button>
            </div>
        </form>
    </div>
  );
};
