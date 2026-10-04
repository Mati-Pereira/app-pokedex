interface Props {
  pokemonType: string
}

import { useLanguage } from '../context/LanguageContext';
import { localizedType } from '../lib/i18n';

function Types({ pokemonType }: Props) {
  const { language } = useLanguage();
  return (
    <span className="rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-700 dark:text-slate-100">
      {localizedType(language, pokemonType)}
    </span>
  );
}

export default Types;
