
import React, { useState, useEffect } from 'react';
import { Quote, OrganizationSettings, INITIAL_SETTINGS } from '../types';
import { SettingsService } from '../services/settingsService';
import { Printer, ArrowLeft, Loader2, Phone, MapPin, Mail, ShieldCheck, Globe, UserCircle, FileCode, ScrollText, FileDown } from 'lucide-react';

interface Props {
  quote: Quote;
  onBack: () => void;
}

declare var html2pdf: any;

// وظيفة لتحويل الروابط داخل النص إلى وسوم HTML قابلة للنقر
const renderTextWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      const href = part.startsWith('http') ? part : `https://${part}`;
      return (
        <a 
          key={index} 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 underline hover:text-blue-800"
          style={{ textDecoration: 'underline' }}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const USDPreview: React.FC<Props> = ({ quote, onBack }) => {
  const [settings, setSettings] = useState<OrganizationSettings>(INITIAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    SettingsService.getSettings().then(data => {
      setSettings(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-slate-900" size={50} /></div>;

  const groupedItemsMap = new Map<string, any>();
  let totalUSD = 0;
  let totalDiscountUSD = 0;
  let totalSupportUSD = 0;

  quote.items.forEach(item => {
      const offerPrice = item.customPrice !== undefined ? item.customPrice : item.unitPrice;
      const discountVal = (offerPrice * item.discountValue) / 100;
      const finalPrice = offerPrice - discountVal;
      const rowTotal = finalPrice * item.count;
      
      totalUSD += rowTotal;
      totalDiscountUSD += (discountVal * item.count);
      totalSupportUSD += (item.supportPricePerUnit * item.count);
      
      const key = item.description.trim();
      if (groupedItemsMap.has(key)) {
        const existing = groupedItemsMap.get(key);
        existing.count += item.count;
        existing.rowTotal += rowTotal;
      } else {
        groupedItemsMap.set(key, {
          description: item.description,
          offerPrice,
          finalPrice,
          count: item.count,
          rowTotal
        });
      }
  });

  const displayItems = Array.from(groupedItemsMap.values());

  const handlePrint = () => { window.focus(); window.print(); };

  const handleDownloadPDF = () => {
    const element = document.getElementById('quote-to-print');
    if (!element) return;
    setIsExporting(true);
    const opt = {
      margin: [0, 0, 0, 0],
      filename: `عرض_سعر_دولاري_${quote.clientName}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 4, 
        useCORS: true, 
        logging: false,
        letterRendering: false,
        allowTaint: true,
        fontStyle: 'normal'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };
    html2pdf().set(opt).from(element).save().then(() => setIsExporting(false)).catch(() => setIsExporting(false));
  };

  const Header = () => (
    <div className="flex justify-between items-center pb-6 mb-8 border-b-4 relative" style={{ borderColor: '#0f172a' }}>
        <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-black text-slate-900" style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: '0' }}>{settings.companyName}</h1>
            <p className="text-[11px] text-slate-500 font-bold leading-normal" style={{ fontFamily: "'Cairo', sans-serif", letterSpacing: '0', wordSpacing: '1px' }}>
                {settings.companyDescription}
            </p>
        </div>
        {settings.logoUrl && !logoError && (
            <img src={settings.logoUrl} className="h-16 object-contain grayscale" alt="Logo" crossOrigin="anonymous" onError={() => setLogoError(true)} />
        )}
        <div className="absolute -bottom-1 right-0 w-1/4 h-1 bg-slate-200"></div>
    </div>
  );

  const Footer = () => (
    <div className="mt-auto pt-6 border-t-2 text-[10px] text-slate-400 font-bold flex justify-between items-center" style={{ borderColor: '#f8fafc' }}>
        <div className="flex gap-4">
            <span className="flex items-center gap-1.5"><MapPin size={12}/> {settings.address}</span>
            <span className="flex items-center gap-1.5"><Phone size={12}/> {settings.phone}</span>
            <span className="flex items-center gap-1.5"><Mail size={12}/> {settings.email}</span>
        </div>
        <div className="flex items-center gap-2">
            <Globe size={12}/>
            <span className="font-mono tracking-widest uppercase">{settings.website}</span>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 print:p-0 print:bg-white" dir="rtl">
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center no-print bg-white p-4 rounded-2xl shadow-xl border border-slate-200 control-bar">
        <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-black transition font-black">
          <ArrowLeft size={18} /> العودة للسجل
        </button>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                <Globe size={12}/> نظام دولاري (USD)
            </div>
            <button onClick={handleDownloadPDF} disabled={isExporting} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg disabled:opacity-50">
              {isExporting ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />} حفظ PDF
            </button>
            <button onClick={handlePrint} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black flex items-center gap-2 hover:bg-black transition shadow-lg">
              <Printer size={18} /> طباعة العرض
            </button>
        </div>
      </div>

      <div id="quote-to-print" className="mx-auto bg-white print:shadow-none print:border-none" style={{ width: '210mm', fontFamily: "'Cairo', sans-serif" }}>
        
        <div className="page-container p-12 flex flex-col min-h-[297mm] overflow-hidden">
            <Header />
            
            <div className="flex justify-between items-end mb-10">
                <div className="flex-1">
                    <div className="mb-2 text-[10px] font-black text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border-r-4 border-slate-900 w-fit flex items-center gap-2">
                        <UserCircle size={14}/> عرض سعر موجه لسيادتكم /
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 mr-1">{quote.clientName}</h2>
                </div>
                <div className="text-left text-[11px] font-bold space-y-1 bg-gray-50 p-4 rounded-2xl border border-slate-100 shadow-sm min-w-[180px]">
                    <div className="text-slate-400 font-mono text-[9px]">REF: QT-{quote.id.split('-')[0].toUpperCase()}</div>
                    <div className="flex justify-between"><span>التاريخ:</span> <span className="font-mono text-slate-900">{quote.offerDate}</span></div>
                    <div className="flex justify-between text-slate-900 font-black"><span>الصلاحية:</span> <span className="font-mono">{quote.expiryDate}</span></div>
                </div>
            </div>

            <div className="flex-1">
                <table className="w-full text-[12px] border-collapse mb-10 overflow-hidden rounded-xl shadow-sm border border-slate-100">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="p-4 text-center w-8">#</th>
                            <th className="p-4 text-right">البيان والوصف</th>
                            <th className="p-4 text-center w-32">الوحدة ($)</th>
                            <th className="p-4 text-center w-32 text-emerald-400">سعر العرض</th>
                            <th className="p-4 text-center w-12">الكمية</th>
                            <th className="p-4 text-center w-36">الإجمالي ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {displayItems.map((item, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}>
                                <td className="p-4 text-center border-slate-100 text-slate-400 font-bold">{idx + 1}</td>
                                <td className="p-4 font-bold leading-relaxed text-slate-800 whitespace-pre-line" style={{ letterSpacing: '0' }}>{item.description}</td>
                                <td className="p-4 text-center font-mono font-bold text-slate-400">${Math.round(item.offerPrice).toLocaleString()}</td>
                                <td className="p-4 text-center font-mono font-black text-emerald-700">${Math.round(item.finalPrice).toLocaleString()}</td>
                                <td className="p-4 text-center font-mono font-bold">{item.count}</td>
                                <td className="p-4 text-center font-mono font-black text-slate-900 bg-slate-50/50">
                                    ${Math.round(item.rowTotal).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="flex justify-end mb-8 page-break-avoid">
                    <div className="bg-[#0f172a] text-white px-10 py-6 rounded-[30px] shadow-xl flex items-center divide-x divide-x-reverse divide-white/10 gap-8 min-w-[500px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none bg-gradient-to-br from-white to-transparent"></div>
                        <div className="text-center px-4">
                            <p className="text-[9px] font-black opacity-50 mb-1 uppercase">إجمالي الخصموات</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-black font-mono text-emerald-400">
                                  {totalDiscountUSD > 0 ? Math.round(totalDiscountUSD).toLocaleString() : 0}
                                </span>
                                <span className="text-[9px] font-bold opacity-60">$</span>
                            </div>
                        </div>
                        <div className="text-center pr-8 flex flex-col items-center flex-1">
                            <p className="text-[10px] font-black opacity-70 mb-1 uppercase tracking-wide">الصافي المطلوب سداده</p>
                            <div className="flex items-center gap-3">
                                <span className="text-4xl font-black font-mono tracking-tighter">${Math.round(totalUSD).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {totalSupportUSD > 0 && (
                    <div className="mb-10 page-break-avoid">
                        <h3 className="font-black mb-3 border-r-4 pr-3 py-1 bg-slate-50 text-[12px] flex items-center gap-2 border-slate-900">
                            <ShieldCheck size={16} className="text-slate-900"/> الدعم الفني والتحديثات السنوية المقترحة
                        </h3>
                        <div className="p-5 border-2 border-slate-50 rounded-2xl flex justify-between items-center bg-slate-50/10">
                            <p className="text-[11px] font-bold text-slate-700">دعم فني وتحديثات سنوية شاملة لكافة تراخيص النظام المذكورة أعلاه</p>
                            <div className="text-slate-900 font-black font-mono text-lg bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
                                ${totalSupportUSD.toLocaleString()} / سنوياً
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </div>

        <div className="page-container p-12 flex flex-col min-h-[297mm] overflow-hidden" style={{ pageBreakBefore: 'always' }}>
            <Header />
            <div className="flex-1 space-y-10">
                <div className="page-break-avoid">
                    <h3 className="font-black mb-5 border-r-8 pr-4 py-3 bg-slate-50 text-[16px] flex items-center gap-3 border-slate-900">
                        <FileCode size={22} className="text-slate-900"/> العرض الفني للبرنامج
                    </h3>
                    <div className="p-8 border-2 border-slate-100 rounded-[35px] text-[12px] leading-[1.8] text-gray-800 whitespace-pre-line font-bold bg-white shadow-sm min-h-[300px]" style={{ letterSpacing: '0' }}>
                        {renderTextWithLinks(quote.technicalOfferContent || settings.technicalOfferTemplate || 'يتم مراجعة العرض الفني الملحق.')}
                    </div>
                </div>

                <div className="page-break-avoid">
                    <h3 className="font-black mb-5 border-r-8 pr-4 py-3 bg-emerald-50 text-[16px] flex items-center gap-3 border-emerald-500">
                        <ScrollText size={22} className="text-emerald-600"/> اتفاقية الاستخدام والشروط العامة
                    </h3>
                    <div className="p-8 border-2 border-emerald-50 rounded-[35px] text-[12px] leading-[1.8] text-emerald-950 whitespace-pre-line font-black bg-emerald-50/5" style={{ letterSpacing: '0' }}>
                        {renderTextWithLinks(quote.termsContent || settings.termsAndConditions || 'تطبق الشروط والأحكام القياسية للشركة.')}
                    </div>
                </div>

                <div className="flex justify-end pt-10 page-break-avoid">
                    <div className="text-center">
                        <p className="mb-4 text-xs font-black text-slate-400 uppercase tracking-widest">ختم وتوقيع الشركة</p>
                        <div className="w-64 h-36 border-2 border-dashed border-slate-200 rounded-[30px] flex items-center justify-center relative bg-slate-50/20 overflow-hidden">
                            {settings.logoUrl && !logoError && (
                              <div className="relative">
                                  <img 
                                    src={settings.logoUrl} 
                                    className="h-24 object-contain opacity-70 transform -rotate-6 mix-blend-multiply" 
                                    style={{ 
                                        filter: 'brightness(0) saturate(100%) invert(24%) sepia(91%) saturate(2258%) hue-rotate(205deg) brightness(92%) contrast(101%) blur(0.2px)',
                                        WebkitFilter: 'brightness(0) saturate(100%) invert(24%) sepia(91%) saturate(2258%) hue-rotate(205deg) brightness(92%) contrast(101%) blur(0.2px)'
                                    }} 
                                    alt="Stamp" 
                                    crossOrigin="anonymous" 
                                  />
                                  <div className="absolute inset-0 border-[5px] border-blue-900/10 rounded-full scale-110 rotate-12 pointer-events-none"></div>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>

      </div>
    </div>
  );
};
