import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import type { DbcMessage } from '../types/dbc';
import { toHexString, formatCanId } from '../utils/canEncoder';

interface Props {
  message: DbcMessage;
  payload: Uint8Array;
}

export default function PayloadDisplay({ message, payload }: Props) {
  const [copied, setCopied] = useState(false);
  const hex = toHexString(payload);

  const copy = () => {
    navigator.clipboard.writeText(hex.replace(/ /g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden'>
      <div className='flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-1.5'>
            <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
            <span className='text-xs font-medium text-zinc-400'>
              Live Payload
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs font-mono text-zinc-500'>
              {formatCanId(message.id)}
            </span>
            <span className='text-zinc-700'>·</span>
            <span className='text-xs font-mono text-zinc-500'>
              {message.name}
            </span>
            <span className='text-zinc-700'>·</span>
            <span className='text-xs font-mono text-zinc-500'>
              DLC: {message.dlc}
            </span>
          </div>
        </div>
        <button
          onClick={copy}
          className='flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors'
        >
          {copied ? (
            <Check size={12} className='text-emerald-400' />
          ) : (
            <Copy size={12} />
          )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className='p-4'>
        {/* Byte labels */}
        <div className='flex gap-2 mb-1.5'>
          {Array.from(payload).map((_, i) => (
            <div
              key={i}
              className='w-9 text-center text-xs text-zinc-600 font-mono'
            >
              B{i}
            </div>
          ))}
        </div>

        {/* Hex bytes */}
        <div className='flex gap-2 mb-3'>
          {Array.from(payload).map((byte, i) => (
            <div
              key={i}
              className='w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 text-sm font-mono font-bold text-sky-300 transition-all duration-150'
            >
              {byte.toString(16).padStart(2, '0').toUpperCase()}
            </div>
          ))}
        </div>

        {/* Binary row */}
        <div className='flex gap-2'>
          {Array.from(payload).map((byte, i) => (
            <div key={i} className='w-9 text-center'>
              <span className='text-xs font-mono text-zinc-600 tracking-tighter'>
                {byte.toString(2).padStart(8, '0')}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full hex string */}
      <div className='px-4 py-3 border-t border-zinc-800 bg-zinc-950/50'>
        <p className='text-xs text-zinc-500 mb-1'>Raw hex</p>
        <p className='font-mono text-sm text-emerald-400 tracking-widest break-all'>
          {hex}
        </p>
      </div>
    </div>
  );
}
