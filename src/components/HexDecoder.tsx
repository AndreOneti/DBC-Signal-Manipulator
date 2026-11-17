import { useState } from 'react';
import { Copy, Check, AlertTriangle } from 'lucide-react';

interface Props {
  dlc: number;
  onDecode: (bytes: Uint8Array) => void;
}

function parseHexInput(input: string): Uint8Array | null {
  const cleaned = input.replace(/0x/gi, '').replace(/[^0-9a-fA-F]/g, '');
  if (cleaned.length === 0 || cleaned.length % 2 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const val = parseInt(cleaned.substr(i * 2, 2), 16);
    if (isNaN(val)) return null;
    bytes[i] = val;
  }
  return bytes;
}

export default function HexDecoder({ dlc, onDecode }: Props) {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [appliedBytes, setAppliedBytes] = useState<number | null>(null);

  const parsed = input.trim() === '' ? null : parseHexInput(input);
  const hasError = parsed === null;

  const short =
    parsed !== null && parsed.bytes ? parsed.bytes.length < dlc : false;

  const apply = (value: string) => {
    setInput(value);
    const bytes = parseHexInput(value);
    if (bytes) {
      onDecode(bytes);
      setAppliedBytes(bytes.length);
    } else {
      setAppliedBytes(null);
    }
  };

  const copy = () => {
    if (!parsed) return;
    navigator.clipboard.writeText(
      Array.from(parsed.bytes)
        .map(b => b.toString(16).padStart(2, '0').toUpperCase())
        .join(''),
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden'>
      <div className='flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900'>
        <div className='flex items-center gap-2'>
          <ArrowDownUpIcon />
          <span className='text-xs font-medium text-zinc-300'>Hex Decoder</span>
          <span className='text-xs text-zinc-600'>
            paste a payload to fill the signal sliders
          </span>
        </div>
        {parsed && (
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
        )}
      </div>

      <div className='p-4'>
        <input
          type='text'
          value={input}
          onChange={e => apply(e.target.value)}
          placeholder='e.g. 1A 2B 00 00 C0 3D 00 00'
          spellCheck={false}
          className={`w-full bg-zinc-950 border rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:outline-none transition-colors ${
            hasError
              ? 'border-red-500/60 focus:border-red-500'
              : 'border-zinc-800 focus:border-violet-500'
          }`}
        />

        {hasError && (
          <p className='mt-2 text-xs text-red-400 flex items-center gap-1.5'>
            <AlertTriangle size={12} />
            Invalid hex — use pairs of 0-9 / A-F, separated by spaces or not
          </p>
        )}

        {!hasError && appliedBytes !== null && (
          <p className='mt-2 text-xs text-zinc-600'>
            Applied to signal values
            {short
              ? ` — ${appliedBytes} byte${appliedBytes !== 1 ? 's' : ''} given, message expects ${dlc}; missing bytes read as 0`
              : ` (${appliedBytes} bytes)`}
          </p>
        )}
      </div>
    </div>
  );
}

function ArrowDownUpIcon() {
  return (
    <svg
      width='13'
      height='13'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className='text-violet-400'
    >
      <path d='m3 16 4 4 4-4' />
      <path d='M7 20V4' />
      <path d='m21 8-4-4-4 4' />
      <path d='M17 4v16' />
    </svg>
  );
}
