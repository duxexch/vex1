import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Bell, Save, CheckCircle2 } from 'lucide-react';
import { SportsCategory } from '../types';

interface SportsNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en' | 'es' | 'ru';
  categories: SportsCategory[];
}

export const SportsNotificationsModal: React.FC<SportsNotificationsModalProps> = ({
  isOpen,
  onClose,
  lang,
  categories
}) => {
  const isAr = lang === 'ar';
  
  const [selectedCats, setSelectedCats] = useState<string[]>(['cat-1']);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const toggleCat = (id: string) => {
    setSelectedCats(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {isAr ? 'إشعارات الرياضة' : 'Sports Notifications'}
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {isAr ? 'اختر الرياضات التي تهمك' : 'Select your favorite sports'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-3">
            {categories.map(cat => {
              const isSelected = selectedCats.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCat(cat.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                    isSelected 
                      ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                      : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div className="text-start">
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {isAr ? cat.nameAr : cat.name}
                      </h3>
                      <p className={`text-xs ${isSelected ? 'text-emerald-600/70' : 'text-slate-400'}`}>
                        {cat.leagues.join(' • ')}
                      </p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 border border-slate-200'
                  }`}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50/50">
            <button
              onClick={handleSave}
              className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm active:scale-95"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isAr ? 'تم الحفظ' : 'Saved'}</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{isAr ? 'حفظ التفضيلات' : 'Save Preferences'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
