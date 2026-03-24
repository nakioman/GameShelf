import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import useStore from '../store';
import Modal from './Modal';

// Use bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export default function ManualViewer({ gameId }) {
  const closeManual = useStore(s => s.closeManual);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [scale, setScale] = useState(1.5);

  useEffect(() => {
    let cancelled = false;
    pdfjsLib.getDocument(`/api/games/${gameId}/manual`).promise.then(doc => {
      if (cancelled) return;
      setPdfDoc(doc);
      setTotal(doc.numPages);
      setPage(1);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [gameId]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    let cancelled = false;
    pdfDoc.getPage(page).then(pg => {
      if (cancelled) return;
      const viewport = pg.getViewport({ scale });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      pg.render({ canvasContext: canvas.getContext('2d'), viewport });
    });
    return () => { cancelled = true; };
  }, [pdfDoc, page, scale]);

  return (
    <Modal onClose={closeManual} className="w-[95%] max-w-[900px] h-[90vh] flex flex-col">
      <div className="bg-shelf-panel rounded-xl overflow-hidden flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 bg-shelf-bg border-b-2 border-shelf-accent">
          <h3 className="text-shelf-accent font-semibold">Manual</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="px-2 py-1 bg-shelf-card text-shelf-text rounded text-sm hover:bg-shelf-accent hover:text-white transition">-</button>
            <button onClick={() => setScale(s => Math.min(3, s + 0.25))}
              className="px-2 py-1 bg-shelf-card text-shelf-text rounded text-sm hover:bg-shelf-accent hover:text-white transition">+</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-shelf-card text-shelf-text rounded text-sm hover:bg-shelf-accent hover:text-white transition">Prev</button>
            <span className="text-sm text-shelf-text-dim">{page} / {total}</span>
            <button onClick={() => setPage(p => Math.min(total, p + 1))}
              className="px-3 py-1 bg-shelf-card text-shelf-text rounded text-sm hover:bg-shelf-accent hover:text-white transition">Next</button>
          </div>
          <button onClick={closeManual}
            className="w-7 h-7 rounded-full bg-transparent text-shelf-text-dim hover:bg-shelf-accent hover:text-white flex items-center justify-center transition">
            &#10005;
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-5">
          {pdfDoc ? (
            <canvas ref={canvasRef} className="shadow-xl max-w-full" />
          ) : (
            <p className="text-shelf-text-dim">Loading manual...</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
