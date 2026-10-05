const test = require('node:test');
const assert = require('node:assert/strict');
const { isPokemonSlug } = require('../lib/pokemonSlug.ts');

test('accepts canonical PokeAPI slug names', () => {
  assert.equal(isPokemonSlug('bulbasaur'), true);
  assert.equal(isPokemonSlug('mr-mime'), true);
  assert.equal(isPokemonSlug('nidoran-f'), true);
});

test('rejects empty, oversized, or path-like slugs', () => {
  assert.equal(isPokemonSlug(''), false);
  assert.equal(isPokemonSlug('Mr-Mime'), false);
  assert.equal(isPokemonSlug('../bulbasaur'), false);
  assert.equal(isPokemonSlug('a'.repeat(65)), false);
  assert.equal(isPokemonSlug(null), false);
});
