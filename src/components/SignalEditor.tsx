import { useState } from 'react';
import type { DbcSignal } from '../types/dbc';

interface Props {
  value: number;
  signal: DbcSignal;
  isMultiplexer?: boolean;

  onChange: (value: number) => void;
}

function formatValue(val: number, unit: string): string {
  const rounded = Math.round(val * 1000) / 1000;
  return unit ? `${rounded} ${unit}` : String(rounded);
}

export default function SignalEditor({
  signal,
  value,
  onChange,
  isMultiplexer,
}: Readonly<Props>) {
  const [editing, setEditing] = useState(false);

  const range = signal.max - signal.min;
  const hasRange = range > 0;

  const commit = (raw: string) => {
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      const clamped = Math.max(signal.min, Math.min(signal.max, num));
      onChange(clamped);
    }
    setEditing(false);
  };

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const bitInfo = `bit ${signal.startBit}, len ${signal.length}, ${signal.byteOrder === 'intel' ? 'LE' : 'BE'}, ${signal.isSigned ? 'signed' : 'unsigned'}`;
  const muxLabel = signal.isMultiplexer
    ? ' (multiplexer)'
    : signal.multiplexId !== undefined && signal.multiplexId !== -1
      ? ` [M${signal.multiplexId}]`
      : '';

  return (
    <div
      className={`group px-4 py-3 border rounded-xl transition-colors ${
        isMultiplexer
          ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60'
          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
      }`}
    >
      <div className='flex items-start justify-between gap-4 mb-2'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-semibold text-white truncate'>
              {signal.name}
              {muxLabel}
            </span>
            {signal.unit && (
              <span className='text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono shrink-0'>
                {signal.unit}
              </span>
            )}
          </div>
          <p className='text-xs text-zinc-600 mt-0.5 font-mono'>{bitInfo}</p>
        </div>
        <div className='shrink-0'>
          {editing ? (
            <input
              autoFocus
              type='number'
              className='w-28 text-right bg-zinc-800 border border-sky-500 rounded-lg px-2 py-1 text-sm font-mono text-white focus:outline-none'
              onBlur={e => commit(e.target.value)}
              defaultValue={String(Math.round(value * 1000) / 1000)}
              onKeyDown={e => {
                if (e.key === 'Enter')
                  commit((e.target as HTMLInputElement).value);
                if (e.key === 'Escape') setEditing(false);
              }}
            />
          ) : (
            <button
              onClick={() => setEditing(true)}
              className='text-sm font-mono text-sky-400 hover:text-sky-300 transition-colors text-right min-w-[6rem] block'
            >
              {formatValue(value, '')}
            </button>
          )}
        </div>
      </div>

      {hasRange && (
        <div className='relative mt-1'>
          <input
            type='range'
            value={value}
            min={signal.min}
            max={signal.max}
            step={signal.factor}
            onChange={handleSlider}
            className='signal-slider w-full'
          />
          <div className='flex justify-between mt-1'>
            <span className='text-xs text-zinc-600 font-mono'>
              {signal.min}
              {signal.unit ? ` ${signal.unit}` : ''}
            </span>
            <span className='text-xs text-zinc-600 font-mono'>
              {signal.max}
              {signal.unit ? ` ${signal.unit}` : ''}
            </span>
          </div>
        </div>
      )}

      {signal.comment && (
        <p className='text-xs text-zinc-500 mt-1.5 italic'>{signal.comment}</p>
      )}
    </div>
  );
}
