
import React, { useState, useEffect, useMemo } from 'react';
import { QuoteService } from './services/quoteService';
import { Quote, AppMode } from './types';
import { QuoteForm } from './components/QuoteForm';
import { USDPreview } from './components/USDPreview'; 
import { MixedPreview } from './components/MixedPreview'; 
import { ProductManager } from './components/ProductManager';
import { SettingsManager } from './components/SettingsManager';
import { ConfirmModal } from './components/ConfirmModal';
import { getAppConfig } from './lib/moduleState';
import { checkConnection, isSupabaseConfigured } from './lib/supabaseClient';
import { 
  Plus, LayoutDashboard, Package, Loader2, Building2, Eye, Edit, 
  Trash2, Search, CheckCircle2, DollarSign, Coins, ShieldCheck, 
  Tag, BarChart3, ChevronLeft, ArrowRight, Shield, FileText, Settings, 
  Wifi, WifiOff, AlertCircle, RefreshCw, Wrench, Terminal
} from 'lucide-react';

type ViewState = 'portal' | 'list' | 'create' | 'edit' | 'preview' | 'settings' | 'products';
type FilterType = 'all' | 'usd' | 'mixed';

function App() {
  const [appMode, setAppMode] = useState<AppMode | null>(null);
  const [view, setView] = useState<ViewState>('portal');
  const [activeTab, setActiveTab] = useState<FilterType>('all');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [dbStatus, setDbStatus] = useState<{online: boolean, message: string}>({ online: true, message: 'جاري فحص الاتصال السحابي...' });
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
  });

  const config = useMemo(() => appMode ? getAppConfig(appMode) : null, [appMode]);

  useEffect(() => {
    const savedMode = sessionStorage.getItem('app_mode') as AppMode;
    if (savedMode) {
      setAppMode(savedMode);
      setView('list');
    }
    verifyConnection();
  }, []);

  useEffect(() => {
    if (appMode) loadQuotes();
  }, [appMode]);

  const verifyConnection = async () => {
    setIsCheckingDb(true);
    const status = await checkConnection();
    setDbStatus({ online: status.success, message: status.message });
    setIsCheckingDb(false);
  };

  const loadQuotes = async () => {
    const data = await QuoteService.getAll();
    setQuotes(data || []);
  };

  const handleSelectMode = (mode: AppMode) => {
    setAppMode(mode);
    sessionStorage.setItem('app_mode', mode);
    setView('list');
  };

  const handleExit = () => {
    sessionStorage.removeItem('app_mode');
    setAppMode(null);
    setView('portal');
  };

  const handleSaveQuote = async (q: Quote) => {
    await QuoteService.save(q);
    await loadQuotes();
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setView('list');
    }, 800);
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(q => {
      const clientName = q.clientName || '';
      const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTab = activeTab === 'all' || q.quoteType === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [quotes, searchTerm, activeTab]);

  const stats = useMemo(() => {
    return {
      usdCount: quotes.filter(q => q.quoteType === 'usd').length,
      mixedCount: quotes.filter(q => q.quoteType === 'mixed').length,
      totalCount: quotes.length
    };
  }, [quotes]);

  // واجهة اختيار النظام الرئيسية
  if (view === 'portal' || !appMode || !config) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative overflow-hidden" dir="rtl">
        <div className="max-w-4xl w-full text-center relative z-10">
          <div className="mb-12">
            <h1 className="text-5xl font-black text-white mb-4 tracking-tight">نظام إدارة عروض الأسعار</h1>
            <p className="text-slate-400 font-bold text-lg">يرجى اختيار النظام المراد الدخول عليه للبدء</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <button onClick={() => handleSelectMode('alafdl')} className="group bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] hover:bg-white/10 hover:border-blue-500/50 transition-all text-right flex flex-col items-start gap-6 shadow-2xl">
              <div className="bg-blue-600 p-5 rounded-3xl text-white shadow-2xl shadow-blue-900/40 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">الأفضل المحاسبي</h2>
                <p className="text-slate-400 font-medium">إدارة عروض أسعار التراخيص المحاسبية.</p>
              </div>
            </button>
            <button onClick={() => handleSelectMode('almoawen')} className="group bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] hover:bg-white/10 hover:border-orange-500/50 transition-all text-right flex flex-col items-start gap-6 shadow-2xl">
              <div className="bg-orange-600 p-5 rounded-3xl text-white shadow-2xl shadow-orange-900/40 group-hover:scale-110 transition-transform">
                <Shield size={40} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tight">نظام المعاون</h2>
                <p className="text-slate-400 font-medium">إدارة العروض الفنية والمالية للمعاون.</p>
              </div>
            </button>
          </div>

          {/* شريط تشخيص الاتصال */}
          <div className="flex flex-col items-center gap-4">
             <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border backdrop-blur-md transition-all ${dbStatus.online ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {isCheckingDb ? <RefreshCw size={16} className="animate-spin" /> : (dbStatus.online ? <Wifi size={16} /> : <WifiOff size={16} />)}
                <span className="text-sm font-black">{dbStatus.message}</span>
                <button onClick={verifyConnection} className="mr-4 p-1 hover:bg-white/10 rounded-lg transition" title="إعادة فحص الاتصال">
                  <RefreshCw size={14} />
                </button>
             </div>
             
             {!dbStatus.online && (
               <button 
                 onClick={() => setShowDebug(!showDebug)} 
                 className="text-slate-500 text-xs font-bold flex items-center gap-1 hover:text-white transition"
               >
                 <Terminal size={12} /> {showDebug ? 'إخفاء تفاصيل الخطأ' : 'لماذا لا يتصل النظام بالسحابة؟'}
               </button>
             )}

             {showDebug && !dbStatus.online && (
               <div className="bg-black/50 border border-white/10 p-6 rounded-2xl max-w-lg text-right animate-in fade-in slide-in-from-bottom-2">
                  <h4 className="text-red-400 font-black mb-2 text-sm flex items-center gap-2">⚠️ تشخيص فني للمشكلة:</h4>
                  <ul className="text-slate-400 text-xs space-y-2 leading-relaxed">
                    <li>1. تأكد من أنك قمت بإضافة مفتاح <b>API_KEY</b> في إعدادات المنصة.</li>
                    <li>2. إذا كنت تستخدم Supabase، تأكد من إضافة <b>رابط التطبيق الحالي</b> في قائمة الـ <b>CORS</b> داخل إعدادات Supabase API.</li>
                    <li>3. النظام حالياً يعمل بـ <b>الوضع المحلي</b>، مما يعني أن بياناتك تحفظ في متصفحك فقط ولن تظهر للآخرين حتى يتم حل مشكلة الاتصال.</li>
                  </ul>
               </div>
             )}
          </div>
        </div>
      </div>
    );
  }

  // التنقل داخل التطبيق
  if (view === 'settings') return <div className="min-h-screen bg-gray-100 py-10 px-4" dir="rtl"><SettingsManager onBack={() => setView('list')} /></div>;
  if (view === 'products') return <div className="min-h-screen bg-gray-100 py-10 px-4" dir="rtl"><ProductManager onBack={() => { setView('list'); loadQuotes(); }} /></div>;
  if (view === 'preview') return selectedQuote?.quoteType === 'usd' ? <USDPreview quote={selectedQuote} onBack={() => setView('list')} /> : <MixedPreview quote={selectedQuote!} onBack={() => setView('list')} />;
  if (view === 'create' || view === 'edit') return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex flex-col items-center" dir="rtl">
        {showSuccess && (
          <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-black"><CheckCircle2 /> تم حفظ العرض بنجاح</div>
        )}
        <QuoteForm initialData={selectedQuote} onSave={handleSaveQuote} onCancel={() => setView('list')} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-right font-sans" dir="rtl">
      {/* شريط التنبيه العلوي في حال عدم الاتصال */}
      {!dbStatus.online && (
        <div className="bg-amber-600 text-white py-2 px-6 flex justify-between items-center text-xs font-black shadow-lg">
           <div className="flex items-center gap-2">
             <AlertCircle size={14}/> 
             تنبيه: أنت تعمل حالياً في "الوضع المحلي" - لن يتم مزامنة البيانات مع السحابة.
           </div>
           <button onClick={verifyConnection} className="bg-white/20 px-3 py-1 rounded-lg hover:bg-white/30 transition flex items-center gap-1">
             <RefreshCw size={12} /> محاولة ربط السحابة
           </button>
        </div>
      )}
      
      <nav className="bg-white shadow-md border-b-2 sticky top-0 z-40 h-18 flex items-center" style={{ borderColor: `${config.primaryColor}20` }}>
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center py-3">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('list')}>
              <div className="p-2.5 rounded-xl text-white shadow-lg" style={{ backgroundColor: config.primaryColor }}>
                {appMode === 'almoawen' ? <Shield size={24} /> : <LayoutDashboard size={24} />}
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900 tracking-tight">{config.label}</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">إدارة عروض الأسعار</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
               <button onClick={handleExit} className="px-4 py-2 text-xs font-black text-gray-400 hover:text-red-600 transition flex items-center gap-2">تغيير النظام <ArrowRight size={14}/></button>
            </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-10 px-6">
        {/* Quick Access Dashboard */}
        <div className="mb-12">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Wrench size={16}/> لوحة التحكم السريع
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button 
                  onClick={() => { setSelectedQuote(null); setView('create'); }}
                  className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-blue-200 rounded-[35px] hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
                >
                    <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-xl mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <span className="text-lg font-black text-gray-800">إنشاء عرض سعر جديد</span>
                    <span className="text-[10px] text-blue-500 font-bold mt-1">ابدأ فوراً بتصميم عرض سعر لعميلك</span>
                </button>

                <button 
                  onClick={() => setView('products')}
                  className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-purple-200 rounded-[35px] hover:border-purple-500 hover:bg-purple-50/50 transition-all group"
                >
                    <div className="bg-purple-600 text-white p-5 rounded-3xl shadow-xl mb-4 group-hover:scale-110 transition-transform">
                        <Package size={32} />
                    </div>
                    <span className="text-lg font-black text-gray-800">إدارة المخزن والمنتجات</span>
                    <span className="text-[10px] text-purple-500 font-bold mt-1">تعديل الأسعار وإضافة منتجات جديدة</span>
                </button>

                <button 
                  onClick={() => setView('settings')}
                  className="flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-gray-200 rounded-[35px] hover:border-gray-500 hover:bg-gray-50 transition-all group"
                >
                    <div className="bg-gray-800 text-white p-5 rounded-3xl shadow-xl mb-4 group-hover:scale-110 transition-transform">
                        <Settings size={32} />
                    </div>
                    <span className="text-lg font-black text-gray-800">إعدادات النظام والشركة</span>
                    <span className="text-[10px] text-gray-500 font-bold mt-1">تعديل اللوجو وسعر الصرف</span>
                </button>
            </div>
        </div>

        {/* السجلات */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8 border-t pt-10 border-gray-100">
          <div className="w-full lg:w-auto">
            <h2 className="text-3xl font-black text-gray-900">سجل عروض الأسعار السابقة</h2>
            <div className="flex mt-6 bg-gray-200/50 p-1 rounded-2xl w-fit">
                <button onClick={() => setActiveTab('all')} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all ${activeTab === 'all' ? 'bg-white text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}>الكل</button>
                <button onClick={() => setActiveTab('usd')} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'usd' ? 'bg-slate-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}><DollarSign size={14}/> دولاري</button>
                <button onClick={() => setActiveTab('mixed')} className={`px-8 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'mixed' ? 'bg-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`} style={{ color: activeTab === 'mixed' ? config.primaryColor : undefined }}><Coins size={14}/> مختلط</button>
            </div>
          </div>
          <div className="relative group w-full lg:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              <input type="text" placeholder="بحث باسم العميل..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white border-2 border-gray-100 rounded-xl py-3 pr-10 pl-4 w-full outline-none focus:border-primary transition-all font-bold text-sm shadow-sm force-light-input" />
          </div>
        </div>

        {quotes.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-100 text-center flex flex-col items-center gap-4">
             <div className="bg-gray-50 p-6 rounded-full text-gray-300"><FileText size={60} /></div>
             <div><h3 className="text-xl font-black text-gray-900">لا يوجد عروض محفوظة</h3><p className="text-gray-400 font-bold mt-1">ابدأ بإنشاء أول عرض سعر عبر لوحة التحكم السريع</p></div>
          </div>
        ) : (
          <div className="bg-white shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">العميل</th>
                  <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">النوع</th>
                  <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">الدعم ($)</th>
                  <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">الخصم</th>
                  <th className="px-6 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">التاريخ</th>
                  <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">تحكم</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {filteredQuotes.map((quote) => (
                    <tr key={quote.id} className={`hover:bg-gray-50/50 transition-colors group border-r-8 ${quote.quoteType === 'usd' ? 'border-r-slate-900' : ''}`} style={{ borderRightColor: quote.quoteType === 'mixed' ? config.primaryColor : undefined }}>
                      <td className="px-8 py-6">
                        <div className="font-black text-gray-900 text-lg cursor-pointer group-hover:text-blue-600 transition-colors" onClick={() => { setSelectedQuote(quote); setView('preview'); }}>{quote.clientName}</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black border ${quote.quoteType === 'usd' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-700 border-gray-100'}`}>
                            {quote.quoteType === 'usd' ? 'دولاري' : 'مختلط'}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-center text-xs font-black text-blue-700">${quote.supportFeesAmount?.toLocaleString() || 0}</td>
                      <td className="px-6 py-6 text-center text-xs font-black text-green-700">
                        {quote.quoteType === 'usd' ? `$${quote.discountAmount?.toLocaleString()}` : `${Math.round(quote.discountAmount * (quote.currencyRate || 50)).toLocaleString()} ج.م`}
                      </td>
                      <td className="px-6 py-6 text-sm text-gray-500 font-mono font-bold">{quote.offerDate}</td>
                      <td className="px-6 py-6">
                          <div className="flex justify-center gap-2">
                              <button onClick={() => { setSelectedQuote(quote); setView('preview'); }} className="p-2.5 text-gray-400 hover:text-blue-600 transition-all"><Eye size={20} /></button>
                              <button onClick={() => { setSelectedQuote(quote); setView('edit'); }} className="p-2.5 text-gray-400 hover:text-blue-600 transition-all"><Edit size={20} /></button>
                              <button onClick={() => setConfirmDelete({ isOpen: true, id: quote.id })} className="p-2.5 text-gray-400 hover:text-red-600 transition-all"><Trash2 size={20} /></button>
                          </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <ConfirmModal isOpen={confirmDelete.isOpen} title="تأكيد الحذف" message="هل أنت متأكد من حذف هذا العرض؟" confirmLabel="حذف" cancelLabel="إلغاء" onConfirm={async () => { if(confirmDelete.id) { await QuoteService.delete(confirmDelete.id); loadQuotes(); setConfirmDelete({isOpen: false, id: null}); } }} onCancel={() => setConfirmDelete({isOpen: false, id: null})} />
    </div>
  );
}

export default App;
