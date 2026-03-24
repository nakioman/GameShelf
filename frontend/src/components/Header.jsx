import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '../store';
import { CPU_TIERS } from '../store';

export default function Header() {
  const filter = useStore(s => s.filter);
  const setFilter = useStore(s => s.setFilter);
  const timerRef = useRef(null);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useTranslation();

  const onSearch = (e) => {
    clearTimeout(timerRef.current);
    const val = e.target.value;
    timerRef.current = setTimeout(() => setFilter({ search: val }), 200);
  };

  const sorts = [
    { key: 'title', label: t('header.sortTitle') },
    { key: 'year', label: t('header.sortYear') },
    { key: 'publisher', label: t('header.sortPublisher') },
  ];

  const hasActiveFilters = filter.filterYear || filter.filterPublisher || filter.filterCpu;

  return (
    <header className="bg-shelf-panel border-b-2 border-shelf-accent sticky top-0 z-50">
      <div className="flex items-center gap-4 px-6 py-3">
        <h1 className="text-xl font-bold text-shelf-accent tracking-widest uppercase whitespace-nowrap">
          {t('header.title')}
        </h1>

        <div className="flex-1 max-w-md relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">&#128269;</span>
          <input
            type="text"
            placeholder={t('header.search')}
            onChange={onSearch}
            className="w-full pl-9 pr-4 py-2 bg-shelf-bg border border-shelf-card rounded-lg text-shelf-text text-sm outline-none focus:border-shelf-accent transition-colors"
          />
        </div>

        <button
          onClick={() => setShowFilters(f => !f)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
            showFilters || hasActiveFilters
              ? 'bg-shelf-accent text-white'
              : 'bg-shelf-bg text-shelf-text-dim hover:bg-shelf-accent hover:text-white'
          }`}
        >
          &#9776; {t('header.filters')}
          {hasActiveFilters && ' ●'}
        </button>

        <div className="flex gap-2 ml-auto">
          {sorts.map(s => (
            <button
              key={s.key}
              onClick={() => setFilter({ sort: s.key })}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                filter.sort === s.key
                  ? 'bg-shelf-accent text-white'
                  : 'bg-shelf-bg text-shelf-text-dim hover:bg-shelf-accent hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced filters row */}
      {showFilters && (
        <div className="flex items-center gap-4 px-6 py-2 bg-shelf-bg/50 border-t border-white/5">
          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-wider text-shelf-text-dim">{t('header.filterYear')}</label>
            <input
              type="number"
              placeholder={t('header.filterYearPlaceholder')}
              value={filter.filterYear || ''}
              onChange={(e) => setFilter({ filterYear: e.target.value ? parseInt(e.target.value) : null })}
              className="w-20 px-2 py-1 bg-shelf-bg border border-shelf-card rounded text-shelf-text text-xs outline-none focus:border-shelf-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-wider text-shelf-text-dim">{t('header.filterPublisher')}</label>
            <input
              type="text"
              placeholder={t('header.filterPublisherPlaceholder')}
              value={filter.filterPublisher || ''}
              onChange={(e) => setFilter({ filterPublisher: e.target.value || null })}
              className="w-32 px-2 py-1 bg-shelf-bg border border-shelf-card rounded text-shelf-text text-xs outline-none focus:border-shelf-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] uppercase tracking-wider text-shelf-text-dim">{t('header.filterCpu')}</label>
            <select
              value={filter.filterCpu || ''}
              onChange={(e) => setFilter({ filterCpu: e.target.value || null })}
              className="w-36 px-2 py-1 bg-shelf-bg border border-shelf-card rounded text-shelf-text text-xs outline-none focus:border-shelf-accent"
            >
              <option value="">{t('header.filterCpuAll')}</option>
              {CPU_TIERS.map(cpu => (
                <option key={cpu} value={cpu}>{cpu.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={() => setFilter({ filterYear: null, filterPublisher: null, filterCpu: null })}
              className="px-2 py-1 text-xs text-shelf-accent hover:text-white transition"
            >
              {t('header.clearFilters')}
            </button>
          )}
        </div>
      )}
    </header>
  );
}
