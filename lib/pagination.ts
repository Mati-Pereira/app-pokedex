/** Number of Pokemon shown per catalog page, shared by the catalog and type pages. */
export const pokemonsPerPage = 9;

export function getPageOffset(page: number): number {
  return (page - 1) * pokemonsPerPage;
}

export function getPageCount(total: number): number {
  return Math.ceil(total / pokemonsPerPage);
}
