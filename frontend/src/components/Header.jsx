import { useRef } from 'react';
import useStore from '../store';

export default function Header() {
  const filter = useStore(s => s.filter);
  const setFilter = useStore(s => s.setFilter);
  const timerRef = useRef(null);

  const onSearch = (e) => {
    clearTimeout(timerRef.current);
    const val = e.target.value;
    timerRef.current = setTimeout(() => setFilter({ search: val }), 200);
  };

  const sorts = [
    { key: 'title', label: 'Title' },
    { key: 'year', label: 'Year' },
    { key: 'publisher', label: 'Publisher' },
  ];

  return (
    <header className="flex items-center gap-4 px-6 py-3 bg-shelf-panel border-b-2 border-shelf-accent sticky top-0 z-50">
      <h1 className="text-xl font-bold text-shelf-accent tracking-widest uppercase whitespace-nowrap">
        GameShelf
      </h1>

      <div className="flex-1 max-w-md relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">&#128269;</span>
        <input
          type="text"
          placeholder="Search games..."
          onChange={onSearch}
          className="w-full pl-9 pr-4 py-2 bg-shelf-bg border border-shelf-card rounded-lg text-shelf-text text-sm outline-none focus:border-shelf-accent transition-colors"
        />
      </div>

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
    </header>
  );
}
