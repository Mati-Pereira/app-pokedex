export const languages = ['pt-BR', 'en'] as const;
export type Language = (typeof languages)[number];

const ptBr = {
  language: 'Idioma',
  portuguese: 'Português (Brasil)',
  english: 'English',
  navigation: 'Navegação principal',
  homeLink: 'Pokédex: voltar ao catálogo',
  viewDetails: 'Ver detalhes de {name}',
  cardSprite: 'Sprite de {name}',
  nameField: 'nome do Pokémon',
  typeField: 'tipo do Pokémon',
  namePlaceholder: 'Buscar por nome...',
  typePlaceholder: 'Buscar por tipo...',
  search: 'Buscar',
  namesError: 'Não foi possível carregar os nomes dos Pokémon. Tente novamente.',
  searchError: 'Não foi possível abrir os resultados. Tente novamente.',
  retry: 'Tentar novamente',
  theme: 'Alternar tema de cores',
  loadingOptions: 'Carregando opções...',
  noOptions: 'Nenhum resultado encontrado',
  optionsAvailable: '{count} opções disponíveis',
  keyboardGuidance: 'Digite para filtrar. Use as setas para navegar e Enter para selecionar. Backspace limpa a seleção.',
  selectionCleared: 'Seleção limpa',
  selected: 'Selecionado: {label}',
  loadingPage: 'Carregando página...',
  loadingCatalog: 'Carregando Pokédex...',
  catalogError: 'Não foi possível carregar os Pokémon. Tente novamente.',
  catalogTitle: 'Pokédex: catálogo de Pokémon',
  showing: 'Exibindo {start}–{end} de {total} Pokémon',
  emptyCatalog: 'Nenhum Pokémon encontrado no catálogo.',
  catalogPagination: 'Paginação do catálogo',
  previousPage: 'Página anterior',
  nextPage: 'Próxima página',
  currentPage: 'Página atual, {page}',
  goToPage: 'Ir para a página {page}',
  pageOf: 'Página {current} de {total}',
  typeError: 'Não foi possível carregar os Pokémon desse tipo. Tente novamente.',
  loadingPokemons: 'Carregando Pokémon...',
  emptyTitle: 'Nenhum Pokémon encontrado',
  emptyType: 'Não encontramos Pokémon desse tipo.',
  allPokemons: 'Ver todos os Pokémon',
  typeHeading: 'Pokémon do tipo {type}',
  resultsPagination: 'Paginação dos resultados',
  detailsBack: 'Voltar ao catálogo',
  gallery: 'Galeria de {name}',
  chooseImage: 'Escolher imagem do Pokémon',
  frontSprite: 'Ver sprite frontal',
  backSprite: 'Ver sprite traseiro',
  shinyFrontSprite: 'Ver sprite frontal brilhante',
  shinyBackSprite: 'Ver sprite traseiro brilhante',
  frontAlt: '{name}, sprite frontal',
  backAlt: '{name}, sprite traseiro',
  shinyFrontAlt: '{name}, sprite frontal brilhante',
  shinyBackAlt: '{name}, sprite traseiro brilhante',
  types: 'Tipos',
  abilities: 'Habilidades',
  stats: 'Atributos base',
  statHp: 'Pontos de vida',
  statAttack: 'Ataque',
  statDefense: 'Defesa',
  statSpecialAttack: 'Ataque especial',
  statSpecialDefense: 'Defesa especial',
  statSpeed: 'Velocidade',
  notFound: 'Não encontramos essa página',
  notFoundHint: 'O Pokémon ou endereço pode ter mudado.',
  serverError: 'Não foi possível carregar esta página',
  serverErrorHint: 'Tente novamente em instantes ou volte ao catálogo.',
} as const;

type TranslationKey = keyof typeof ptBr;
type TranslationTable = Record<TranslationKey, string>;

const en: TranslationTable = {
  language: 'Language',
  portuguese: 'Português (Brasil)',
  english: 'English',
  navigation: 'Main navigation',
  homeLink: 'Pokédex: return to catalog',
  viewDetails: 'View {name} details',
  cardSprite: '{name} sprite',
  nameField: 'Pokémon name',
  typeField: 'Pokémon type',
  namePlaceholder: 'Search by name...',
  typePlaceholder: 'Search by type...',
  search: 'Search',
  namesError: 'Could not load Pokémon names. Please try again.',
  searchError: 'Could not open the search results. Please try again.',
  retry: 'Try again',
  theme: 'Toggle color theme',
  loadingOptions: 'Loading options...',
  noOptions: 'No results found',
  optionsAvailable: '{count} options available',
  keyboardGuidance: 'Type to filter. Use the arrow keys to navigate and Enter to select. Backspace clears the selection.',
  selectionCleared: 'Selection cleared',
  selected: 'Selected: {label}',
  loadingPage: 'Loading page...',
  loadingCatalog: 'Loading Pokédex...',
  catalogError: 'Could not load Pokémon. Please try again.',
  catalogTitle: 'Pokédex: Pokémon catalog',
  showing: 'Showing {start}–{end} of {total} Pokémon',
  emptyCatalog: 'No Pokémon found in the catalog.',
  catalogPagination: 'Catalog pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  currentPage: 'Current page, {page}',
  goToPage: 'Go to page {page}',
  pageOf: 'Page {current} of {total}',
  typeError: 'Could not load Pokémon of this type. Please try again.',
  loadingPokemons: 'Loading Pokémon...',
  emptyTitle: 'No Pokémon found',
  emptyType: 'We could not find Pokémon of this type.',
  allPokemons: 'View all Pokémon',
  typeHeading: 'Pokémon of type {type}',
  resultsPagination: 'Results pagination',
  detailsBack: 'Back to catalog',
  gallery: '{name} gallery',
  chooseImage: 'Choose a Pokémon image',
  frontSprite: 'View front sprite',
  backSprite: 'View back sprite',
  shinyFrontSprite: 'View shiny front sprite',
  shinyBackSprite: 'View shiny back sprite',
  frontAlt: '{name}, front sprite',
  backAlt: '{name}, back sprite',
  shinyFrontAlt: '{name}, shiny front sprite',
  shinyBackAlt: '{name}, shiny back sprite',
  types: 'Types',
  abilities: 'Abilities',
  stats: 'Base stats',
  statHp: 'HP',
  statAttack: 'Attack',
  statDefense: 'Defense',
  statSpecialAttack: 'Special attack',
  statSpecialDefense: 'Special defense',
  statSpeed: 'Speed',
  notFound: 'We could not find this page',
  notFoundHint: 'The Pokémon or address may have changed.',
  serverError: 'This page could not be loaded',
  serverErrorHint: 'Please try again shortly or return to the catalog.',
};

const translations: Record<Language, TranslationTable> = { 'pt-BR': ptBr, en };

const typeNames: Record<Language, Record<string, string>> = {
  'pt-BR': {
    normal: 'Normal', fighting: 'Lutador', flying: 'Voador', poison: 'Veneno',
    ground: 'Terrestre', rock: 'Pedra', bug: 'Inseto', ghost: 'Fantasma', steel: 'Aço',
    fire: 'Fogo', water: 'Água', grass: 'Grama', electric: 'Elétrico', psychic: 'Psíquico',
    ice: 'Gelo', dragon: 'Dragão', dark: 'Sombrio', fairy: 'Fada',
  },
  en: {
    normal: 'Normal', fighting: 'Fighting', flying: 'Flying', poison: 'Poison',
    ground: 'Ground', rock: 'Rock', bug: 'Bug', ghost: 'Ghost', steel: 'Steel',
    fire: 'Fire', water: 'Water', grass: 'Grass', electric: 'Electric', psychic: 'Psychic',
    ice: 'Ice', dragon: 'Dragon', dark: 'Dark', fairy: 'Fairy',
  },
};

const statKeys: Record<string, TranslationKey> = {
  hp: 'statHp',
  attack: 'statAttack',
  defense: 'statDefense',
  'special-attack': 'statSpecialAttack',
  'special-defense': 'statSpecialDefense',
  speed: 'statSpeed',
};

export function isLanguage(value: string | null): value is Language {
  return value === 'pt-BR' || value === 'en';
}

export function t(language: Language, key: TranslationKey, values: Record<string, string | number> = {}): string {
  return translations[language][key].replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.hasOwn(values, name) ? String(values[name]) : match
  );
}

export function localizedType(language: Language, value: string): string {
  return typeNames[language][value] ?? value;
}

export function localizedStat(language: Language, value: string): string {
  const key = statKeys[value];
  return key ? t(language, key) : value;
}
