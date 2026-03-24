import { useTranslation } from 'react-i18next';

const FIELDS = [
  { key: 'cpu', icon: '🖥️' },
  { key: 'ram', icon: '🧠' },
  { key: 'disk', icon: '💾' },
  { key: 'video', icon: '🖼️' },
  { key: 'sound', icon: '🔊' },
  { key: 'os', icon: '⚙️' },
  { key: 'other', icon: '📋' },
];

export default function Requirements({ requirements }) {
  const { t } = useTranslation();

  const hasAny = requirements && FIELDS.some(f => requirements[f.key]);
  if (!hasAny) {
    return (
      <p className="text-shelf-text-dim text-center italic py-8">
        {t('requirements.none')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs uppercase tracking-widest text-shelf-accent font-semibold mb-3">
        {t('requirements.title')}
      </h3>
      <div className="grid gap-2">
        {FIELDS.map(({ key, icon }) => {
          const value = requirements[key];
          if (!value) return null;
          return (
            <div key={key} className="flex items-start gap-3 px-3 py-2.5 bg-shelf-bg rounded-lg">
              <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-wider text-shelf-accent font-semibold">
                  {t(`requirements.${key}`)}
                </div>
                <div className="text-sm text-shelf-text mt-0.5">{value}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
