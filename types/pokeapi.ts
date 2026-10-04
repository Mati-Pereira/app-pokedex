export interface NamedResource {
  name: string;
  url: string;
}

export interface PokemonListResponse {
  count: number;
  results: NamedResource[];
}

export interface TypeResponse {
  pokemon: { pokemon: NamedResource }[];
}
