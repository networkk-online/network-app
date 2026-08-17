import { memo } from 'react';
import { TV_ACCENT, TV_CATEGORIES } from '@/lib/networkTv';
import { cn } from '@/lib/utils';

interface Props {
  active: string;
  onChange: (id: string) => void;
  categories?: { id: string; ar: string }[];
}

const CategoryChips = ({ active, onChange, categories }: Props) => {
  const list = categories && categories.length ? categories : TV_CATEGORIES;
  return (
    <div
      className="sticky top-14 z-40 border-b border-white/[0.05] bg-black/80 backdrop-blur-xl"
      dir="rtl"
    >
      <div className="mx-auto flex max-w-[1800px] gap-2 overflow-x-auto px-3 py-3 sm:px-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {list.map((c) => {
          const on = active === c.id;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-1.5 text-[13px] transition-all duration-200 min-h-[36px]',
                on
                  ? 'border-transparent text-black font-semibold'
                  : 'border-white/[0.08] bg-white/[0.05] text-foreground/75 hover:bg-white/[0.1]'
              )}
              style={on ? { background: TV_ACCENT, boxShadow: `0 0 20px ${TV_ACCENT}55` } : undefined}
            >
              {c.ar}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(CategoryChips);
