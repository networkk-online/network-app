import { useState } from 'react';
import { MapPin, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const IRAQ_GOVERNORATES = [
  'بغداد', 'أربيل', 'البصرة', 'الموصل (نينوى)', 'كركوك',
  'النجف', 'كربلاء', 'الأنبار', 'ذي قار', 'ديالى',
  'واسط', 'ميسان', 'المثنى', 'القادسية', 'صلاح الدين',
  'بابل', 'دهوك', 'السليمانية',
];

interface IraqLocationPickerProps {
  onSelect: (location: { name: string } | null) => void;
  selected?: string | null;
}

const IraqLocationPicker = ({ onSelect, selected }: IraqLocationPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (selected) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08]">
        <MapPin className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground flex-1">{selected}</span>
        <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => onSelect(null)}>
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between p-3 h-auto rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] text-muted-foreground"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">إضافة موقع</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-hidden origin-top"
            style={{
              background: 'rgba(12,12,18,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {IRAQ_GOVERNORATES.map((gov) => (
              <button
                key={gov}
                type="button"
                onClick={() => { onSelect({ name: gov }); setIsOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-white/[0.06] transition-colors text-right"
              >
                <MapPin className="w-3.5 h-3.5 text-primary/60" />
                {gov}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IraqLocationPicker;
