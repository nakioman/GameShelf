import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LookupTable({ config }) {
  const { t } = useTranslation();
  const [values, setValues] = useState({});
  const [result, setResult] = useState(null);

  const handleLookup = () => {
    const key = (config.fields || []).map(f => (values[f] || '').trim().toLowerCase()).join('-');
    const found = config.entries?.[key];
    setResult(found || false);
  };

  return (
    <div className="space-y-5">
      <p className="text-center text-shelf-text italic">
        {config.prompt || t('lookup.defaultPrompt')}
      </p>

      <div className="flex gap-3 flex-wrap justify-center">
        {(config.fields || []).map(field => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-xs uppercase tracking-wider text-shelf-text-dim">{field}</label>
            <input
              type="text"
              placeholder={`Enter ${field}...`}
              value={values[field] || ''}
              onChange={(e) => setValues(v => ({ ...v, [field]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
              className="px-3 py-2 bg-shelf-bg border border-shelf-card rounded-lg text-shelf-text text-sm outline-none focus:border-shelf-accent transition-colors min-w-[120px]"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleLookup}
        className="block mx-auto px-6 py-2 bg-shelf-accent text-white rounded-lg font-semibold hover:brightness-110 transition"
      >
        {t('lookup.lookUp')}
      </button>

      <div className={`text-center p-4 bg-shelf-bg rounded-lg min-h-[56px] flex items-center justify-center ${
        result === null ? 'text-shelf-text-dim text-sm' :
        result === false ? 'text-shelf-text-dim text-sm' :
        'text-shelf-success text-xl font-bold'
      }`}>
        {result === null && t('lookup.enterValues')}
        {result === false && t('lookup.noMatch')}
        {result && result}
      </div>
    </div>
  );
}
