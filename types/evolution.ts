export interface EvolutionResource {
  name: string;
  url: string;
}

export interface EvolutionDetails {
  trigger: EvolutionResource;
  item: EvolutionResource | null;
  gender: number | null;
  held_item: EvolutionResource | null;
  known_move: EvolutionResource | null;
  known_move_type: EvolutionResource | null;
  location: EvolutionResource | null;
  min_level: number | null;
  min_happiness: number | null;
  min_beauty: number | null;
  min_affection: number | null;
  needs_overworld_rain: boolean;
  party_species: EvolutionResource | null;
  party_type: EvolutionResource | null;
  relative_physical_stats: number | null;
  time_of_day: string;
  trade_species: EvolutionResource | null;
  turn_upside_down: boolean;
}

export interface EvolutionNode {
  species: EvolutionResource;
  evolves_to: EvolutionNode[];
  evolution_details: EvolutionDetails[];
}
