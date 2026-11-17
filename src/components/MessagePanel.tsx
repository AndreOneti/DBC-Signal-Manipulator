import { useMemo, useState } from 'react';
import { RotateCcw, ArrowUpDown, Zap } from 'lucide-react';
import type { DbcMessage, SignalState } from '../types/dbc';
import {
  encodePayload,
  decodePayload,
  getDefaultState,
  formatCanId,
  getMultiplexValues,
  getMultiplexerSignal,
  getVisibleSignals,
} from '../utils/canEncoder';
import SignalEditor from './SignalEditor';
import PayloadDisplay from './PayloadDisplay';
import HexDecoder from './HexDecoder';

interface Props {
  message: DbcMessage;
}

export default function MessagePanel({ message }: Readonly<Props>) {
  const [state, setState] = useState<SignalState>(() =>
    getDefaultState(message),
  );
  const [sortBy, setSortBy] = useState<'bit' | 'name'>('bit');

  const multiplexValues = useMemo(() => getMultiplexValues(message), [message]);
  const multiplexer = useMemo(() => getMultiplexerSignal(message), [message]);

  const muxValue = message.hasMultiplex
    ? Math.floor(state[multiplexer?.name || ''] ?? 0)
    : null;

  const visibleSignals = useMemo(
    () => getVisibleSignals(message, muxValue),
    [message, muxValue],
  );

  const sortedSignals = useMemo(() => {
    return [...visibleSignals].sort((a, b) =>
      sortBy === 'bit' ? a.startBit - b.startBit : a.name.localeCompare(b.name),
    );
  }, [visibleSignals, sortBy]);

  const payload = useMemo(
    () => encodePayload(message, state, muxValue),
    [message, state, muxValue],
  );

  const handleChange = (name: string, value: number) => {
    setState(prev => ({ ...prev, [name]: value }));
  };

  const reset = () => setState(getDefaultState(message));

  const handleDecode = (bytes: Uint8Array) => {
    const decoded = decodePayload(message, bytes);
    setState(prev => ({ ...prev, ...decoded }));
  };

  return (
    <div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
      {/* Header */}
      <div className='px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0'>
        <div>
          <div className='flex items-center gap-2'>
            <h2 className='text-lg font-bold text-white'>{message.name}</h2>
            <span className='text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 font-mono border border-sky-500/20'>
              {formatCanId(message.id)}
            </span>
            {message.hasMultiplex && (
              <span className='text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-mono border border-amber-500/20 flex items-center gap-1'>
                <Zap size={10} />
                Multiplexed
              </span>
            )}
          </div>
          <p className='text-xs text-zinc-500 mt-0.5'>
            {message.dlc} bytes · {message.signals.length} signals · tx:{' '}
            {message.transmitter}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <button
            onClick={() => setSortBy(s => (s === 'bit' ? 'name' : 'bit'))}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors'
            title='Toggle sort'
          >
            <ArrowUpDown size={12} />
            {sortBy === 'bit' ? 'by bit' : 'by name'}
          </button>
          <button
            onClick={reset}
            className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors'
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>
      </div>

      {/* Multiplex selector */}
      {message.hasMultiplex && multiplexer && (
        <div className='px-6 pt-4 pb-2 shrink-0 border-b border-zinc-800'>
          <div className='flex items-center gap-3'>
            <span className='text-xs font-semibold text-zinc-500 uppercase tracking-wider'>
              Multiplex: {multiplexer.name}
            </span>
            <div className='flex gap-1.5'>
              {multiplexValues.map(val => (
                <button
                  key={val}
                  onClick={() => {
                    setState(prev => ({
                      ...prev,
                      [multiplexer.name]: val,
                    }));
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    muxValue === val
                      ? 'bg-amber-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
          <p className='text-xs text-zinc-600 mt-1.5'>
            Showing {sortedSignals.length} signals for this multiplex value
          </p>
        </div>
      )}

      {/* Payload display */}
      <div className='px-6 pt-4 shrink-0 space-y-4'>
        <PayloadDisplay message={message} payload={payload} />
        <HexDecoder dlc={message.dlc} onDecode={handleDecode} />
      </div>

      {/* Signals */}
      <div className='flex-1 overflow-y-auto px-6 py-4'>
        <p className='text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3'>
          Signals
        </p>
        <div className='flex flex-col gap-3'>
          {sortedSignals.map(signal => (
            <SignalEditor
              key={signal.name}
              signal={signal}
              value={state[signal.name] ?? signal.min}
              onChange={v => handleChange(signal.name, v)}
              isMultiplexer={signal.isMultiplexer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
