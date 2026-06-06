import { C } from '@/constants/theme';

function scoreColor(value) {
  if (value <= 4) return C.red;
  if (value < 7) return C.orange;
  return C.green;
}

export function ScoreBar({ label, value, empty }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between mb-1">
        <span className="text-[13px] text-[#4A4A4A]">{label}</span>
        <span
          className="text-[13px] font-bold"
          style={{ color: empty ? C.textLight : scoreColor(value) }}
        >
          {empty ? '—' : `${value}/10`}
        </span>
      </div>
      <div
        className="relative h-[6px] rounded-[3px] overflow-hidden"
        style={{ background: 'linear-gradient(90deg, #e53e3e 0%, #f6ad55 50%, #38a169 100%)' }}
      >
        <div
          className="absolute top-0 right-0 h-full transition-[width] duration-400"
          style={{
            width: empty ? '100%' : `${100 - (value / 10) * 100}%`,
            background: C.borderLight,
          }}
        />
      </div>
    </div>
  );
}
