export interface PokemonDetails {
  id: number;
  name: string;
  abilities: { ability: { name: string } }[];
  sprites: {
    front_default: string | null;
    back_default: string | null;
    front_shiny: string | null;
    back_shiny: string | null;
  };
  stats: { base_stat: number; stat: { name: string } }[];
  types: Type[];
}

export interface Type {
  type: { name: string };
}
