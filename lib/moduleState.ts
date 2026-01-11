
import { AppMode } from '../types';

export const getAppConfig = (mode: AppMode) => {
  if (mode === 'almoawen') {
    return {
      id: 'almoawen',
      label: 'نظام المعاون',
      storagePrefix: 'almoawen_',
      primaryColor: '#ea580c', // برتقالي داكن
      secondaryColor: '#c2410c',
      icon: 'Shield'
    };
  }
  return {
    id: 'alafdl',
    label: 'الأفضل المحاسبي',
    storagePrefix: 'alafdl_',
    primaryColor: '#1e40af', // أزرق ملكي
    secondaryColor: '#1e3a8a',
    icon: 'LayoutDashboard'
  };
};
