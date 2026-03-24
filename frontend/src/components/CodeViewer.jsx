import { useEffect, useState } from 'react';
import useStore from '../store';
import Modal from './Modal';
import CodeWheel from './CodeWheel';
import LookupTable from './LookupTable';
import { fetchCodes } from '../api';

export default function CodeViewer({ game }) {
  const closeCodes = useStore(s => s.closeCodes);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCodes(game.id).then(data => {
      if (data) setConfig(data);
      else setError(true);
    });
  }, [game.id]);

  // Document type — open manual viewer instead
  useEffect(() => {
    if (config?.type === 'document') {
      closeCodes();
      useStore.getState().openManual();
    }
  }, [config, closeCodes]);

  return (
    <Modal onClose={closeCodes} className="w-[90%] max-w-[600px]">
      <div className="bg-shelf-panel rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-shelf-bg border-b-2 border-shelf-accent">
          <h3 className="text-shelf-accent font-semibold">Copy Protection</h3>
          <button onClick={closeCodes}
            className="w-7 h-7 rounded-full bg-transparent text-shelf-text-dim hover:bg-shelf-accent hover:text-white flex items-center justify-center transition">
            &#10005;
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {error && <p className="text-shelf-text-dim text-center">No codes configuration found.</p>}
          {config?.type === 'wheel' && <CodeWheel config={config} gameId={game.id} />}
          {config?.type === 'lookup' && <LookupTable config={config} />}
        </div>
      </div>
    </Modal>
  );
}
