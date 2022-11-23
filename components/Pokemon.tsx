/* eslint-disable @next/next/no-img-element */

import { Type } from "../types/pokemonDetails";
import Types from "./Types";

interface PokemonProps {
  image: string;
  text: string;
  types: Type[];
}

function Pokemon({ image, text, types }: PokemonProps) {
  return (
    <div className="rounded bg-gray-200 overflow-hidden shadow-lg dark:bg-sky-900">
      <img className="w-full" src={image} alt="Mountain" />
      <div className="px-6 py-4 ">
        <div className="font-bold text-xl mb-2">{text}</div>
        <div className="flex">
          {types.map(type => (
            <Types key={type.type.name} pokemonType={type.type.name} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Pokemon;