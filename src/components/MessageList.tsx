import { MessageSquare, ChevronRight } from 'lucide-react';
import type { DbcMessage } from '../types/dbc';
import { formatCanId } from '../utils/canEncoder';

interface Props {
  messages: DbcMessage[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}

export default function MessageList({
  messages,
  selectedId,
  onSelect,
}: Readonly<Props>) {
  return (
    <div className='flex flex-col h-full'>
      <div className='px-4 py-3 border-b border-zinc-800'>
        <p className='text-xs font-semibold text-zinc-500 uppercase tracking-wider'>
          Messages ({messages.length})
        </p>
      </div>
      <div className='flex-1 overflow-y-auto'>
        {messages.map(msg => (
          <button
            key={msg.id}
            onClick={() => onSelect(msg.id)}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-zinc-800/60 transition-colors group ${
              selectedId === msg.id
                ? 'bg-sky-500/10 border-l-2 border-l-sky-500'
                : 'hover:bg-zinc-800/60 border-l-2 border-l-transparent'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg shrink-0 ${
                selectedId === msg.id ? 'bg-sky-500/20' : 'bg-zinc-800'
              }`}
            >
              <MessageSquare
                size={14}
                className={
                  selectedId === msg.id ? 'text-sky-400' : 'text-zinc-500'
                }
              />
            </div>
            <div className='flex-1 min-w-0'>
              <p
                className={`text-sm font-medium truncate ${
                  selectedId === msg.id ? 'text-white' : 'text-zinc-300'
                }`}
              >
                {msg.name}
              </p>
              <div className='flex items-center gap-2 mt-0.5'>
                <span className='text-xs font-mono text-zinc-500'>
                  {formatCanId(msg.id)}
                </span>
                <span className='text-zinc-700'>·</span>
                <span className='text-xs text-zinc-500'>{msg.dlc}B</span>
                <span className='text-zinc-700'>·</span>
                <span className='text-xs text-zinc-500'>
                  {msg.signals.length} sig
                </span>
              </div>
            </div>
            <ChevronRight
              size={14}
              className={`shrink-0 transition-colors ${
                selectedId === msg.id
                  ? 'text-sky-400'
                  : 'text-zinc-700 group-hover:text-zinc-500'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
