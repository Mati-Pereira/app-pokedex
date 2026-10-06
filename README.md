# App Pokedex

Uma aplicação web de Pokédex para navegar pelos Pokémon, filtrar por tipo e ver detalhes como sprites (incluindo shiny), habilidades, atributos base e linhas de evolução.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

Demo: <https://app-pokedex-ashy.vercel.app/>

## Funcionalidades

- Catálogo de Pokémon com paginação, servido com ISR (revalidado a cada 6 horas).
- Busca por nome com autocomplete virtualizado e navegável por teclado.
- Filtro por tipo, persistido na URL (`/types?type=fire`) para sobreviver a recarregamentos e poder ser compartilhado.
- Páginas de detalhes com carrossel de sprites (frente/costas/shiny), tipos, habilidades, atributos base e linha de evolução carregada sob demanda (ramos responsivos e painel de condições).
- Alternância entre tema claro e escuro, que segue a preferência do sistema e persiste entre recarregamentos.
- Interface bilíngue: português (padrão) e inglês, persistida entre recarregamentos.
- Acessibilidade: navegação por teclado, regiões ARIA live, estilos de foco visíveis e suporte a movimento reduzido.
- Headers de segurança e Content-Security-Policy restritiva; as requisições à PokeAPI são validadas e restritas à origem da API.

## Tecnologias

| Camada            | Tecnologia                                                                  |
| ----------------- | --------------------------------------------------------------------------- |
| Framework         | Next.js 16.3.8 (Pages Router)                                               |
| UI                | React 19.3.0, Tailwind CSS 4.3.3, daisyUI 5.7.47                            |
| Linguagem         | TypeScript 5.9.3 (strict)                                                   |
| Dados             | [PokeAPI](https://pokeapi.co/)                                              |
| Busca e paginação | react-select 5.10.2, react-window 2.3.3, react-responsive-pagination 2.14.0 |
| Testes            | Node.js test runner, jsdom, Testing Library                                 |

## Requisitos

- Node.js **24.x** (declarado em `package.json` e `.nvmrc`)
- npm **10.9.4** (fixado via `packageManager`)

## Como rodar

```bash
git clone https://github.com/Mati-Pereira/app-pokedex
cd app-pokedex
npm ci
npm run dev
```

O servidor de desenvolvimento roda em http://localhost:3000.

## Scripts disponíveis

| Comando                                   | Descrição                                    |
| ----------------------------------------- | -------------------------------------------- |
| `npm run dev`                             | Inicia o servidor de desenvolvimento         |
| `npm run build`                           | Gera o build de produção                     |
| `npm start`                               | Serve o build de produção                    |
| `npm test`                                | Executa os testes de regressão (`node:test`) |
| `npm run typecheck`                       | Verifica os tipos sem gerar arquivos         |
| `npm run lint`                            | Executa o ESLint                             |
| `npm run format` / `npm run format:check` | Aplica / verifica a formatação do Prettier   |

Para rodar um único arquivo de teste:

```bash
node --require ./tests/ts-register.cjs --test tests/pagination.test.cjs
```

## Estrutura do projeto

```
pages/        Rotas e carregamento de dados por página (catálogo, detalhes, filtro por tipo)
components/   UI reutilizável (Navbar, SearchField, Grid, Pokemon, EvolutionChain, ...)
context/      Estado React compartilhado (idioma)
lib/          Acesso à PokeAPI, caches, validação, i18n e helpers de paginação
types/        Modelos TypeScript compartilhados
data/         Valores dos tipos de Pokémon
tests/        Testes de regressão (node:test + jsdom + Testing Library)
docs/         Baseline de produção, guia de modernização e notas de dependências
```

## Dados e rede

- Todos os dados dos Pokémon vêm da [PokeAPI](https://pokeapi.co/); não há banco de dados local.
- `npm run build` busca o catálogo e pré-renderiza todas as páginas de detalhes (~1.355 páginas), então precisa de acesso à rede e pode demorar vários minutos. O catálogo usa ISR e revalida a cada 6 horas.
- A busca e as listas por tipo no cliente também exigem acesso à PokeAPI.
- As respostas são cacheadas em memória no cliente (TTL/LRU com deduplicação de requisições em andamento) e em disco em `.next/cache/pokeapi` durante o build. A concorrência da geração estática é limitada em `next.config.js` para não sobrecarregar a API.

## Validação

Rode a suíte completa antes de enviar mudanças:

```bash
npm test
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Status atual: 93 testes de regressão passam, junto com typecheck, lint e checagem de formatação, e o build gera todas as 1.355 páginas estáticas. Os resultados e as limitações conhecidas estão em [docs/PRODUCTION_BASELINE.md](docs/PRODUCTION_BASELINE.md).

## Deploy

A aplicação está publicada na Vercel (veja o link da demo acima) e lê a versão do Node em `engines.node`. As respostas de produção incluem uma Content-Security-Policy restritiva e outros headers de segurança configurados em `next.config.js`; o HSTS é adicionado apenas na produção da Vercel.

## Documentação

- [docs/PRODUCTION_BASELINE.md](docs/PRODUCTION_BASELINE.md) — comportamento validado em produção e limitações.
- [docs/MODERNIZATION_GUIDELINE.md](docs/MODERNIZATION_GUIDELINE.md) — plano de atualização incremental e convenções de trabalho.
- [docs/DEPENDENCY_COMPATIBILITY.md](docs/DEPENDENCY_COMPATIBILITY.md) — notas de compatibilidade de dependências.
- [AGENTS.md](AGENTS.md) — diretrizes do repositório para agentes de código com IA.

## Autor

- [@Mati-Pereira](https://www.github.com/Mati-Pereira)
- [Portfólio](https://portifolio-new-4q6j.vercel.app/) · [LinkedIn](https://www.linkedin.com/in/matheus-rodrigues-pereira/)

Feedback e dúvidas: matheus-rodrigues37@live.com

## Licença

[MIT](https://choosealicense.com/licenses/mit/)
