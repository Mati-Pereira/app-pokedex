/* eslint-disable @next/next/no-img-element */
import { Type } from "../types/pokemonDetails";

interface PokemonProps {
  image: string;
  text: string;
  description: any;
}

function Pokemon({ image, text, description }: PokemonProps) {
  return (
    <div className="cursor-pointer">
      <figure>
        <img src={image} className="rounded-t h-72 w-full object-cover" alt="pokemon" />
        <figcaption className="p-4">
          <p className="text-lg mb-4 font-bold leading-relaxed text-gray-800 dark:text-gray-300" >
            {text}
          </p>
          <small className="leading-5 text-gray-500 dark:text-gray-400">
            {description}
          </small>
        </figcaption>
      </figure>
    </div>
  );
}

export default Pokemon;