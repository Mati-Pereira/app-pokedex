const maxPokemonSlugLength = 64;

export function isPokemonSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= maxPokemonSlugLength &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}
