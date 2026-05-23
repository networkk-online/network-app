import { maskEmail } from '@/lib/utils';

export function MaskedEmail({ email, className }: { email: string; className?: string }) {
  return (
    <span
      className={`inline-block font-mono text-emerald-400 tracking-wider ${className || ''}`}
      style={{
        textShadow: '0 1px 6px rgba(16,185,129, 0.5)',
        direction: 'ltr',
      }}
    >
      {maskEmail(email)}
    </span>
  );
}
