/* eslint-disable @next/next/no-img-element */

import { Type } from "../types/pokemonDetails";
import Types from "./Types";
import { useLanguage } from "../context/LanguageContext";
import { t } from "../lib/i18n";

interface PokemonProps {
  image: string;
  text: string;
  types: Type[];
  priority?: boolean;
}

function Pokemon({ image, text, types, priority = false }: PokemonProps) {
  const { language } = useLanguage();
  return (
    <article className="h-full overflow-hidden rounded-xl border border-paper-border bg-paper-card shadow-md transition duration-200 hover:-translate-y-1 hover:shadow-xl dark:border-slate-600 dark:bg-sky-950">
      <div className="aspect-square bg-[#f2eadd] p-3 sm:p-5 dark:bg-sky-900">
        <img className="h-full w-full object-contain [image-rendering:pixelated]" src={image} alt={t(language, 'cardSprite', { name: text })} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} />
      </div>
      <div className="px-4 py-4 sm:px-5">
        <h2 className="mb-3 text-lg font-extrabold tracking-wide text-slate-900 dark:text-white sm:text-xl">{text}</h2>
        <div className="flex flex-wrap gap-1">
          {types.map(type => (
            <Types key={type.type.name} pokemonType={type.type.name} />
          ))}
        </div>
      </div>
    </article>
  );
}

export default Pokemon;
