import { useTranslation } from 'react-i18next';
import useStore from '../store';

export default function DriveBar() {
  const driveStatus = useStore(s => s.driveStatus);
  const ejectDisk = useStore(s => s.ejectDisk);

  const { t } = useTranslation();
  const drives = [0, 1];

  return (
    <div className="flex gap-4 px-6 py-2 bg-shelf-panel border-b border-white/5 text-sm">
      {drives.map(drive => {
        const info = driveStatus[drive];
        return (
          <div key={drive} className="flex items-center gap-2 px-3 py-1 bg-shelf-bg rounded-lg min-w-[200px]">
            <span className="text-shelf-accent font-semibold whitespace-nowrap">
              {drive === 0 ? 'A:' : 'B:'}
            </span>
            {info ? (
              <>
                <span className="text-shelf-text-dim truncate flex-1" title={`${info.gameTitle} — ${info.label}`}>
                  {info.label}
                </span>
                <button
                  onClick={() => ejectDisk(drive)}
                  className="px-2 py-0.5 bg-shelf-accent text-white rounded text-xs hover:brightness-110 transition"
                >
                  {t('driveBar.eject')}
                </button>
              </>
            ) : (
              <span className="text-shelf-text-dim/50 italic flex-1">{t('driveBar.empty')}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
