import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../store';

export default function DiskList({ game }) {
  const { t } = useTranslation();
  const driveStatus = useStore(s => s.driveStatus);
  const mountDisk = useStore(s => s.mountDisk);

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-shelf-accent font-semibold">
        {t('boxDetail.floppyDisks', { count: game.disks.length })}
      </h3>
      {game.disks.map((disk, i) => (
        <DiskItem key={i} game={game} disk={disk} driveStatus={driveStatus} mountDisk={mountDisk} />
      ))}
    </div>
  );
}

function DiskItem({ game, disk, driveStatus, mountDisk }) {
  const [loading, setLoading] = useState(null); // drive number being loaded

  const isMountedA = driveStatus[0]?.gameId === game.id && driveStatus[0]?.diskFile === disk.file;
  const isMountedB = driveStatus[1]?.gameId === game.id && driveStatus[1]?.diskFile === disk.file;

  const handleMount = async (drive) => {
    setLoading(drive);
    await mountDisk(drive, game.id, disk.file);
    setLoading(null);
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-shelf-bg rounded-lg hover:bg-shelf-card transition-colors">
      {/* Floppy icon */}
      <div className="w-9 h-9 bg-shelf-floppy rounded relative flex-shrink-0">
        <div className="absolute top-1 left-2 right-2 h-2.5 bg-shelf-floppy-label rounded-sm" />
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-3.5 h-2.5 bg-neutral-700 rounded-t-sm" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{disk.label}</div>
        <div className="text-xs text-shelf-text-dim truncate">{disk.file}</div>
      </div>

      <div className="flex gap-1.5">
        <button
          onClick={() => handleMount(0)}
          disabled={loading !== null}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            isMountedA
              ? 'bg-shelf-success text-shelf-bg'
              : 'bg-shelf-card text-shelf-text hover:bg-shelf-accent hover:text-white'
          }`}
        >
          {loading === 0 ? '...' : isMountedA ? '✓ A:' : 'A:'}
        </button>
        <button
          onClick={() => handleMount(1)}
          disabled={loading !== null}
          className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
            isMountedB
              ? 'bg-shelf-success text-shelf-bg'
              : 'bg-shelf-card text-shelf-text hover:bg-shelf-accent hover:text-white'
          }`}
        >
          {loading === 1 ? '...' : isMountedB ? '✓ B:' : 'B:'}
        </button>
      </div>
    </div>
  );
}
