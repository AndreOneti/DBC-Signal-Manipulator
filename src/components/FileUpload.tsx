import { Upload, FileCode2, Cpu } from 'lucide-react';
import { generateSampleDbc } from '../utils/dbcParser';

interface Props {
  onLoad: (content: string, filename: string) => void;
}

export default function FileUpload({ onLoad }: Readonly<Props>) {
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      onLoad(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className='flex flex-col items-center justify-center h-full p-8'>
      <div className='mb-8 flex flex-col items-center gap-3'>
        <div className='p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20'>
          <Cpu size={40} className='text-sky-400' />
        </div>
        <h1 className='text-2xl font-bold text-white tracking-tight'>
          DBC Signal Editor
        </h1>
        <p className='text-zinc-400 text-sm text-center max-w-xs'>
          Load a CAN database file to inspect, edit signals and see the hex
          payload update in real time.
        </p>
      </div>

      <label
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className='group relative w-full max-w-md border-2 border-dashed border-zinc-700 hover:border-sky-500/60 rounded-2xl p-10 flex flex-col items-center gap-4 cursor-pointer transition-all duration-200 hover:bg-sky-500/5'
      >
        <input
          type='file'
          accept='.dbc'
          className='sr-only'
          onChange={handleInput}
        />
        <div className='p-3 rounded-xl bg-zinc-800 group-hover:bg-sky-500/10 transition-colors'>
          <Upload
            size={24}
            className='text-zinc-400 group-hover:text-sky-400 transition-colors'
          />
        </div>
        <div className='text-center'>
          <p className='text-sm font-medium text-zinc-300'>
            Drop a .dbc file here
          </p>
          <p className='text-xs text-zinc-500 mt-1'>or click to browse</p>
        </div>
      </label>

      <div className='mt-4 flex items-center gap-3 w-full max-w-md'>
        <div className='flex-1 h-px bg-zinc-800' />
        <span className='text-xs text-zinc-600'>or</span>
        <div className='flex-1 h-px bg-zinc-800' />
      </div>

      <button
        onClick={() => onLoad(generateSampleDbc(), 'sample.dbc')}
        className='mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors'
      >
        <FileCode2 size={16} />
        Load sample DBC
      </button>
    </div>
  );
}
