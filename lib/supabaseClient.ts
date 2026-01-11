
import { createClient } from '@supabase/supabase-js';

// --- إعدادات الاتصال (قم بتعديلها هنا مباشرة إذا واجهت مشكلة) ---
const SUPABASE_URL: string = 'https://vhzuvsttifuwvfrftzeu.supabase.co';
// يمكنك وضع المفتاح هنا مباشرة بين العلامتين إذا لم يعمل الـ env
const MANUAL_API_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZoenV2c3R0aWZ1d3ZmcmZ0emV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODEyNzYsImV4cCI6MjA4MTA1NzI3Nn0.jC6fD9zbH6K4nWIsDi9gQElQqYqfWoKHyHsfOE9Pkgk'; 

const getApiKey = () => {
  // الأولوية لـ MANUAL_API_KEY ثم لـ process.env ثم لـ window
  return MANUAL_API_KEY || process.env.API_KEY || (window as any).SUPABASE_KEY || '';
};

/**
 * فحص حالة التكوين وصلاحية المفتاح
 */
export const isSupabaseConfigured = () => {
  const key = getApiKey();
  return typeof key === 'string' && key.length > 20; // فحص بسيط للطول
};

/**
 * أداة تشخيص الاتصال الجذري
 */
export const checkConnection = async () => {
  const key = getApiKey();
  
  if (!key) {
    return { success: false, message: 'المفتاح (API KEY) مفقود تماماً من الإعدادات.' };
  }
  
  if (key.length < 50) {
    return { success: false, message: 'المفتاح الموجود غير مكتمل أو قصير جداً.' };
  }

  try {
    // محاولة جلب عدد المنتجات كفحص بسيط للاتصال
    const { error, status } = await supabase.from('products').select('count', { count: 'exact', head: true });
    
    if (error) {
      if (status === 401 || status === 403) {
        return { success: false, message: 'المفتاح غير صالح (Unauthorized) - تأكد من الـ Anon Key.' };
      }
      if (error.message.includes('fetch')) {
        return { success: false, message: 'مشكلة في الشبكة أو الـ CORS (تأكد من إضافة رابط التطبيق في Supabase).' };
      }
      throw error;
    }
    
    return { success: true, message: 'متصل بنجاح بسحابة Supabase' };
  } catch (err: any) {
    return { 
      success: false, 
      message: `خطأ اتصال: ${err.message || 'غير معروف'}` 
    };
  }
};

export const supabase = createClient(
  SUPABASE_URL, 
  getApiKey() || 'placeholder-key',
  {
    auth: { persistSession: false },
    db: { schema: 'public' }
  }
);
