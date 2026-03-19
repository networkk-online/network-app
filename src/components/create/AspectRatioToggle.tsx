import { motion } from 'framer-motion';

export type AspectRatio = '1:1' | '4:5' | '16:9';

interface AspectRatioToggleProps {
  value: AspectRatio;
  onChange: (ratio: AspectRatio) => void;
}

const ratios: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1' },
  { value: '4:5', label: '4:5' },
  { value: '16:9', label: '16:9' },
];

const AspectRatioToggle = ({ value, onChange }: AspectRatioToggleProps) => {
  return (
    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
      {ratios.map((r) => (
        <motion.button
          key={r.value}
          type="button"
          whileTap={{ scale: 0.93 }}
          onClick={() => onChange(r.value)}
          className={`relative px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === r.value ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {value === r.value && (
            <motion.div
              layoutId="aspect-active"
              className="absolute inset-0 rounded-md bg-primary"
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          )}
          <span className="relative z-10">{r.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export const getAspectClass = (ratio: AspectRatio) => {
  switch (ratio) {
    case '1:1': return 'aspect-square';
    case '4:5': return 'aspect-[4/5]';
    case '16:9': return 'aspect-video';
  }
};

export default AspectRatioToggle;
