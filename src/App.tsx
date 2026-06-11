import { useState, useCallback } from 'react';
import { Cpu, FileCode2, X } from 'lucide-react';
import { parseDbc } from './utils/dbcParser';
import type { DbcFile } from './types/dbc';
import FileUpload from './components/FileUpload';
import MessageList from './components/MessageList';
import MessagePanel from './components/MessagePanel';

export default function App() {
  const [dbcFile, setDbcFile] = useState<DbcFile | null>(null);
  const [filename, setFilename] = useState('');
  const [selectedMsgId, setSelectedMsgId] = useState<number | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleLoad = useCallback((content: string, name: string) => {
    try {
      const parsed = parseDbc(content);
      if (parsed.messages.length === 0) {
        setParseError('No messages found in this DBC file.');
        return;
      }
      setParseError(null);
      setDbcFile(parsed);
      setFilename(name);
      setSelectedMsgId(parsed.messages[0].id);
    } catch (err) {
      setParseError('Failed to parse DBC file. Please check the format.');
    }
  }, []);

  const handleClose = () => {
    setDbcFile(null);
    setFilename('');
    setSelectedMsgId(null);
    setParseError(null);
  };

  const selectedMessage =
    dbcFile?.messages.find(m => m.id === selectedMsgId) ?? null;

  return (
    <div className='h-screen bg-zinc-950 text-white flex flex-col overflow-hidden'>
      {/* Top bar */}
      <header className='h-12 border-b border-zinc-800 flex items-center px-4 gap-3 shrink-0'>
        <div className='flex items-center gap-2'>
          <Cpu size={18} className='text-sky-400' />
          <span className='font-semibold text-sm tracking-tight text-white'>
            DBC Signal Editor
          </span>
        </div>
        {dbcFile && (
          <>
            <span className='text-zinc-700'>|</span>
            <div className='flex items-center gap-2'>
              <FileCode2 size={14} className='text-zinc-500' />
              <span className='text-sm text-zinc-400'>{filename}</span>
              <span className='text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500'>
                {dbcFile.messages.length} messages
              </span>
            </div>
            <button
              onClick={handleClose}
              className='ml-auto p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors'
              title='Close file'
            >
              <X size={14} />
            </button>
          </>
        )}
      </header>

      {parseError && (
        <div className='mx-4 mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400'>
          {parseError}
        </div>
      )}

      {!dbcFile ? (
        <div className='flex-1 flex items-center justify-center'>
          <FileUpload onLoad={handleLoad} />
        </div>
      ) : (
        <div className='flex-1 flex overflow-hidden min-h-0'>
          {/* Sidebar */}
          <aside className='w-64 shrink-0 border-r border-zinc-800 flex flex-col min-h-0 overflow-hidden'>
            <MessageList
              messages={dbcFile.messages}
              selectedId={selectedMsgId}
              onSelect={setSelectedMsgId}
            />
          </aside>

          {/* Main */}
          <main className='flex-1 overflow-hidden min-h-0 flex flex-col'>
            {selectedMessage ? (
              <MessagePanel
                key={selectedMessage.id}
                message={selectedMessage}
              />
            ) : (
              <div className='flex items-center justify-center h-full text-zinc-600 text-sm'>
                Select a message to edit signals
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
