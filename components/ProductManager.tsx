
import React, { useState, useEffect } from 'react';
import { Product, AppMode } from '../types';
import { ProductService } from '../services/productService';
import { ConfirmModal } from './ConfirmModal';
import { Plus, Save, Trash2, Edit2, ArrowLeft, Package, Loader2, ShieldCheck, Share2, Coins } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const INITIAL_PRODUCT: Product = {
  id: '',
  name: '',
  unitPriceUSD: 0,
  unitPriceLocal: 0,
  description: '',
  technicalOffer: '',
  supportPriceMain: 0,
  supportPriceSub: 0,
  appMode: 'all'
};

export const ProductManager: React.FC<Props> = ({ onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [confirmDelete, setConfirmDelete] = useState<{isOpen: boolean, id: string | null}>({
    isOpen: false,
    id: null
  });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const data = await ProductService.getAll();
      setProducts(data || []);
    } catch (err) {
      console.error("Error loading products", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      setIsLoading(true);
      await ProductService.save(editingProduct);
      setEditingProduct(null);
      await loadProducts();
      setIsLoading(false);
    }
  };

  const inputBaseClass = "w-full border-2 border-gray-100 rounded-xl p-3 font-bold bg-white text-black focus:border-primary outline-none transition-all shadow-sm force-light-input";

  if (editingProduct) {
    return (
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-3xl overflow-hidden border-t-8 border-gray-800" dir="rtl">
        <div className="bg-gray-50 p-6 flex justify-between items-center border-b border-gray-100">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Package className="text-primary" /> {editingProduct.name ? 'تعديل بيانات المنتج' : 'إضافة منتج تقني جديد'}
          </h2>
          <button onClick={() => setEditingProduct(null)} className="text-gray-500 hover:text-gray-700 transition font-bold flex items-center gap-1">
            <ArrowLeft size={18} /> إلغاء
          </button>
        </div>

        <form onSubmit={handleSave} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">اسم المنتج</label>
              <input required type="text" className={inputBaseClass} value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} placeholder="مثال: نظام الأفضل المحاسبي V5" />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest flex items-center gap-2">
                <Share2 size={14} className="text-blue-600"/> يظهر في نظام:
              </label>
              <select 
                className={inputBaseClass}
                value={editingProduct.appMode}
                onChange={e => setEditingProduct({...editingProduct, appMode: e.target.value as any})}
              >
                <option value="all">الكل (منتج مشترك)</option>
                <option value="alafdl">نظام الأفضل فقط</option>
                <option value="almoawen">نظام المعاون فقط</option>
              </select>
            </div>
            
            <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100">
              <label className="block text-xs font-black text-gray-500 mb-2 flex items-center gap-2">
                سعر الترخيص المرجعي ($USD)
              </label>
              <input required type="number" className={inputBaseClass} value={editingProduct.unitPriceUSD} onChange={e => setEditingProduct({...editingProduct, unitPriceUSD: Number(e.target.value)})} />
            </div>

            <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100">
              <label className="block text-xs font-black text-emerald-700 mb-2 flex items-center gap-2">
                <Coins size={14}/> سعر البيع المحلي (ج.م)
              </label>
              <input required type="number" className={inputBaseClass} value={editingProduct.unitPriceLocal} onChange={e => setEditingProduct({...editingProduct, unitPriceLocal: Number(e.target.value)})} />
            </div>

            <div className="md:col-span-2 border-t border-gray-100 pt-6">
               <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-sm">
                 <ShieldCheck size={18} className="text-primary"/> إعدادات الدعم الفني السنوي المقترح ($)
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                    <label className="block text-[10px] font-black text-blue-800 mb-2">دعم الترخيص الرئيسي (دولار سنوياً)</label>
                    <input required type="number" className={inputBaseClass} value={editingProduct.supportPriceMain} onChange={e => setEditingProduct({...editingProduct, supportPriceMain: Number(e.target.value)})} />
                  </div>
                  <div className="bg-orange-50/30 p-5 rounded-2xl border border-orange-100">
                    <label className="block text-[10px] font-black text-orange-800 mb-2">دعم الترخيص الفرعي (دولار سنوياً)</label>
                    <input required type="number" className={inputBaseClass} value={editingProduct.supportPriceSub} onChange={e => setEditingProduct({...editingProduct, supportPriceSub: Number(e.target.value)})} />
                  </div>
               </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-gray-400 mb-2 uppercase tracking-widest">الوصف الفني المختصر (يظهر في بنود العرض)</label>
              <textarea required rows={3} className={inputBaseClass} value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} placeholder="اكتب وصفاً دقيقاً للمنتج..." />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
             <button type="button" onClick={() => setEditingProduct(null)} className="px-8 py-3 text-gray-500 font-bold hover:text-gray-800 transition">إلغاء</button>
             <button disabled={isLoading} type="submit" className="px-16 py-4 bg-gray-900 text-white rounded-2xl font-black flex items-center gap-3 shadow-2xl hover:bg-black transition active:scale-95 disabled:opacity-50">
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                {isLoading ? 'جاري الحفظ...' : 'حفظ المنتج في المخزن'}
             </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto" dir="rtl">
      <div className="flex justify-between items-center mb-8">
        <div>
           <button onClick={onBack} className="text-gray-400 hover:text-gray-700 mb-2 flex items-center gap-1 text-sm font-bold transition-colors">
             <ArrowLeft size={16} /> العودة للرئيسية
           </button>
           <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3">
             <div className="bg-gray-800 p-2.5 rounded-2xl text-white shadow-lg"><Package size={24}/></div>
             مخزن المنتجات والخدمات
           </h2>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setEditingProduct({ ...INITIAL_PRODUCT, id: crypto.randomUUID() })} className="bg-gray-900 text-white px-10 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-black transition shadow-xl font-black active:scale-95">
            <Plus size={22} /> إضافة منتج جديد
          </button>
        </div>
      </div>

      <div className="bg-white shadow-2xl shadow-gray-200/50 rounded-3xl overflow-hidden border border-gray-100">
        {isLoading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-gray-500 font-black">جاري مزامنة المخزن...</p>
            </div>
        ) : products.length === 0 ? (
          <div className="p-20 text-center flex flex-col items-center gap-6">
            <div className="bg-gray-50 p-10 rounded-full text-gray-300">
              <Package size={80} className="opacity-20" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">المخزن فارغ تماماً</h3>
              <p className="text-gray-500 font-bold max-w-md mx-auto">
                ابدأ بإضافة منتجاتك التقنية عبر الزر الموجود بالأعلى لتظهر في عروض الأسعار.
              </p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest">المنتج التقني</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">النظام المستهدف</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">السعر المرجعي ($)</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">السعر المحلي (ج.م)</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-400 uppercase tracking-widest">إجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-gray-900 text-lg">{product.name}</div>
                    <div className="text-[10px] text-gray-400 font-bold mt-1 truncate max-w-xs">{product.description}</div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-sm ${
                      product.appMode === 'almoawen' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                      product.appMode === 'alafdl' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      'bg-white text-gray-500 border-gray-200'
                    }`}>
                      {product.appMode === 'almoawen' ? 'نظام المعاون' : 
                       product.appMode === 'alafdl' ? 'نظام الأفضل' : 'متاح للكل'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-center font-mono font-black text-gray-600">${product.unitPriceUSD.toLocaleString()}</td>
                  <td className="px-6 py-6 text-center font-mono font-black text-emerald-600 bg-emerald-50/20">{product.unitPriceLocal?.toLocaleString()} ج.م</td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex justify-center gap-2">
                        <button onClick={() => setEditingProduct({ ...product })} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-blue-100" title="تعديل"><Edit2 size={18}/></button>
                        <button onClick={() => setConfirmDelete({ isOpen: true, id: product.id })} className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100" title="حذف"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="تأكيد حذف منتج"
        message="هل أنت متأكد من حذف هذا المنتج نهائياً من المخزن؟ لن يتأثر أي عرض سعر قمت بإنشائه مسبقاً بهذا الإجراء."
        confirmLabel="نعم، احذف المنتج"
        cancelLabel="إلغاء"
        onConfirm={async () => {
          if (confirmDelete.id) {
            await ProductService.delete(confirmDelete.id);
            loadProducts();
            setConfirmDelete({isOpen: false, id: null});
          }
        }}
        onCancel={() => setConfirmDelete({isOpen: false, id: null})}
      />
    </div>
  );
};
