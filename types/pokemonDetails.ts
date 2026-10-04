export interface PokemonDetails {
  abilities: Ability2[];
  base_experience: number;
  forms: NamedAPIResource[];
  game_indices: Gameindex[];
  height: number;
  held_items: Helditem[];
  id: number;
  is_default: boolean;
  location_area_encounters: string;
  moves: Move[];
  name: string;
  order: number;
  past_types: PastType[];
  species: NamedAPIResource;
  sprites: Sprites;
  stats: Stat[];
  types: Type[];
  weight: number;
}

export interface Type {
  slot: number;
  type: NamedAPIResource;
}

interface Stat {
  base_stat: number;
  effort: number;
  stat: NamedAPIResource;
}

interface Sprites {
  back_default: string;
  back_female?: string | null;
  back_shiny: string;
  back_shiny_female?: string | null;
  front_default: string;
  front_female?: string | null;
  front_shiny: string;
  front_shiny_female?: string | null;
  other: Other;
  versions: Versions;
}

interface Versions {
  "generation-i": Generationi;
  "generation-ii": Generationii;
  "generation-iii": Generationiii;
  "generation-iv": Generationiv;
  "generation-v": Generationv;
  "generation-vi": Generationvi;
  "generation-vii": Generationvii;
  "generation-viii": Generationviii;
}

interface Generationviii {
  icons: Dreamworld;
}

interface Generationvii {
  icons: Dreamworld;
  "ultra-sun-ultra-moon": Home;
}

interface Generationvi {
  "omegaruby-alphasapphire": Home;
  "x-y": Home;
}

interface Generationv {
  "black-white": Blackwhite;
}

interface Blackwhite {
  animated: Diamondpearl;
  back_default: string;
  back_female?: string | null;
  back_shiny: string;
  back_shiny_female?: string | null;
  front_default: string;
  front_female?: string | null;
  front_shiny: string;
  front_shiny_female?: string | null;
}

interface Generationiv {
  "diamond-pearl": Diamondpearl;
  "heartgold-soulsilver": Diamondpearl;
  platinum: Diamondpearl;
}

interface Diamondpearl {
  back_default: string;
  back_female?: string | null;
  back_shiny: string;
  back_shiny_female?: string | null;
  front_default: string;
  front_female?: string | null;
  front_shiny: string;
  front_shiny_female?: string | null;
}

interface Generationiii {
  emerald: Emerald;
  "firered-leafgreen": Fireredleafgreen;
  "ruby-sapphire": Fireredleafgreen;
}

interface Fireredleafgreen {
  back_default: string;
  back_shiny: string;
  front_default: string;
  front_shiny: string;
}

interface Emerald {
  front_default: string;
  front_shiny: string;
}

interface Generationii {
  crystal: Crystal;
  gold: Gold;
  silver: Gold;
}

interface Gold {
  back_default: string;
  back_shiny: string;
  front_default: string;
  front_shiny: string;
  front_transparent: string;
}

interface Crystal {
  back_default: string;
  back_shiny: string;
  back_shiny_transparent: string;
  back_transparent: string;
  front_default: string;
  front_shiny: string;
  front_shiny_transparent: string;
  front_transparent: string;
}

interface Generationi {
  "red-blue": Redblue;
  yellow: Redblue;
}

interface Redblue {
  back_default: string;
  back_gray: string;
  back_transparent: string;
  front_default: string;
  front_gray: string;
  front_transparent: string;
}

interface Other {
  dream_world: Dreamworld;
  home: Home;
  "official-artwork": Officialartwork;
}

interface Officialartwork {
  front_default: string;
}

interface Home {
  front_default: string;
  front_female?: string | null;
  front_shiny: string;
  front_shiny_female?: string | null;
}

interface Dreamworld {
  front_default: string;
  front_female?: string | null;
}

interface Move {
  move: NamedAPIResource;
  version_group_details: Versiongroupdetail[];
}

interface Versiongroupdetail {
  level_learned_at: number;
  move_learn_method: NamedAPIResource;
  version_group: NamedAPIResource;
}

interface Helditem {
  item: NamedAPIResource;
  version_details: Versiondetail[];
}

interface Versiondetail {
  rarity: number;
  version: NamedAPIResource;
}

interface Gameindex {
  game_index: number;
  version: NamedAPIResource;
}

interface Ability2 {
  ability: NamedAPIResource;
  is_hidden: boolean;
  slot: number;
}

interface NamedAPIResource {
  name: string;
  url: string;
}

interface PastType {
  generation: NamedAPIResource;
  types: Type[];
}
