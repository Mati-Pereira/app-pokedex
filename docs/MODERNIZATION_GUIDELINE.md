# Guia de atualização do App Pokedex

Este guia registra o plano acordado para modernizar o projeto preservando sua estrutura visual. Cada passo deve produzir um commit e ser apresentado ao usuário antes de iniciar o próximo.

## Objetivo e limites

- Manter o header no topo com as buscas por nome e tipo.
- Manter os cards com a imagem acima e informações simples abaixo.
- Preservar a página de detalhes, a paginação e os modos claro e escuro.
- Manter inicialmente o Pages Router e a pasta `pages/`.
- Tratar mudanças de cores e acabamento como uma etapa posterior, discutida separadamente.
- Não adicionar funcionalidades ou migrar para o App Router como parte implícita da atualização.

## Forma de trabalho

1. Explicar o objetivo e o escopo do passo atual.
2. Fazer uma alteração pequena, com um objetivo específico.
3. Executar as verificações pertinentes e corrigir regressões introduzidas pelo passo.
4. Inspecionar o diff e incluir apenas arquivos relacionados ao passo.
5. Criar um commit em inglês no formato `type: short description`.
6. Voltar ao chat com o hash do commit, os arquivos e trechos relevantes, o motivo da mudança, os resultados das verificações e qualquer limitação.
7. Apresentar o próximo passo e aguardar o usuário antes de executá-lo.

Não juntar atualização de framework, mudança de estilos e novas funcionalidades no mesmo commit. Uma unidade de atualização pode incluir pacotes que obrigatoriamente precisem mudar juntos para manter a compatibilidade. Se um passo se mostrar grande, dividi-lo em passos menores e explicar a divisão antes de prosseguir.

Os próximos commits serão locais na branch `chore/continue-modernization`. Push, publicação e merge ficam fora deste plano até serem solicitados. Não reescrever os commits já existentes.

## Referência inicial

Versões declaradas no `package.json` durante a elaboração deste guia:

| Tecnologia                  | Versão atual    |
| --------------------------- | --------------- |
| Next.js                     | 13.0.4          |
| React / React DOM           | 18.2.0          |
| TypeScript                  | 4.9.3           |
| ESLint / eslint-config-next | 8.28.0 / 13.0.4 |
| Tailwind CSS                | ^3.2.4          |
| daisyUI                     | ^2.43.0         |

O ambiente usado na execução inicial tinha Node.js 24.19.0. Isso não equivale a uma versão de Node documentada ou exigida pelo projeto.

TypeScript e lint passaram na verificação inicial. Lista, paginação e detalhes foram verificados no navegador. O build de produção ainda não foi validado. Esses resultados não garantem todos os fluxos.

Correções já registradas:

- `196fbcf` — tratamento de nomes inexistentes e respostas inválidas nos detalhes, com seis testes de regressão.
- `9c9daaa` — estrutura HTML válida da tabela de atributos; corrigiu o erro de hidratação reproduzido ao abrir os detalhes diretamente.

## Sequência de passos

As versões exatas de destino serão confirmadas na documentação oficial e nas dependências dos pacotes antes de cada atualização. As linhas de versões abaixo são objetivos de planejamento, não uma garantia de compatibilidade.

### 0. Registrar o plano

- [x] Criar este guia sem atualizar dependências ou alterar funcionalidades.
- Commit: `docs: add incremental modernization guideline`.
- Verificação: revisar o conteúdo e conferir o diff.

### 1. Corrigir os problemas atuais, um por vez

- [x] Corrigir a busca por teclado: digitar e navegar pelas opções não deve disparar a navegação inadvertidamente; definir e verificar o comportamento de Enter e do botão de busca.
- [x] Validar buscas sem seleção e acompanhar o carregamento pela conclusão da navegação, em vez de temporizadores fixos.
- [x] Persistir o filtro por tipo na URL para permitir atualização e acesso direto; reiniciar a paginação ao mudar o tipo.
- [x] Tratar falhas de requisição com estados de erro e recuperação, finalizando o carregamento e evitando resultados de requisições antigas.
- [x] Obter o total da paginação da API, em vez de usar um número fixo.
- [x] Investigar o aviso de renderização no servidor da biblioteca de paginação e corrigir sua causa sem atualizar todo o framework.

Cada item é um passo próprio, com um commit `fix:`. Melhorias adicionais, como buscar apenas os detalhes dos Pokémon da página filtrada, devem ter um passo separado quando necessário.

### 2. Estabelecer a referência de produção e instalação

- [x] Padronizar em npm 10.9.4, usar `package-lock.json` e remover `yarn.lock`; documentar instalação e verificações.
- [x] Validar o build de produção e a execução desse build. Se houver defeitos, resolvê-los em passos específicos antes de concluir esta etapa.
- [x] Registrar limitações da geração das páginas de detalhes, que atualmente depende de requisições à PokéAPI durante o build.

Critério de conclusão: instalação reproduzível, verificações de tipos e lint aprovadas, build aprovado e fluxos essenciais verificados na execução de produção. Falhas de rede devem ser identificadas como tal, sem afirmar que o build passou.

### 3. Atualizar TypeScript e preparar o ambiente

- [x] Definir Node 24.x LTS para desenvolvimento e produção, registrar em `engines.node` e `.nvmrc` e conferir o suporte documentado da Vercel. A versão efetiva da hospedagem ainda deve ser confirmada antes do deploy.
- [x] Atualizar TypeScript para 5.9.3; tipos, lint, 48 testes e build de produção passaram sem alterações no código funcional.
- [x] Alinhar `@types/node` com Node 24 usando a versão 24.19.1.
- [ ] Ajustar os tipos de React junto às futuras etapas de atualização de React.

Usar commits `chore:` para versões/configuração e `fix:` quando houver uma correção funcional separável. Não adicionar regras de lint ou refatorações amplas ao passo de TypeScript.

### 4. Atualizar Next.js e React gradualmente

- [x] Mapear a compatibilidade declarada das bibliotecas com React 18 e registrar pendências para React 19 em `docs/DEPENDENCY_COMPATIBILITY.md`. A execução com as futuras versões ainda deve ser validada.
- [x] Revisar pacotes instalados mas não usados: React Query sem uso encontrado no app; remoção fica para um passo separado.
- [x] Avançar para Next.js 14.2.35 e eslint-config-next 14.2.35; alinhar ESLint 8.57.1 aos requisitos transitivos. Instalação limpa, árvore de dependências, tipos, lint, 48 testes, build e verificações de produção passaram, mantendo React 18.2 e Pages Router.
- [x] Avançar para Next.js 15.5.27 e eslint-config-next 15.5.27, mantendo React 18.2 e Pages Router. Instalação limpa, dependências, tipos, lint, 48 testes, build e verificações de produção passaram. Removido swcMinify e limitada a geração estática a duas páginas simultâneas após timeouts da PokéAPI; revisar opções experimentais no passo 16.
- [ ] Avançar para o Next.js 16 ou outra linha com suporte confirmada no momento da execução.
- [ ] Adaptar o lint e a configuração do ESLint no ponto exigido pela atualização. No Next.js 16, `next lint` foi removido e o lint precisa ser executado separadamente do build.
- [ ] Revisar as opções de `next.config.js` e mudanças da ferramenta de compilação em cada versão.

Next.js 14 é uma ponte de migração, não o destino de produção pretendido. Manter o Pages Router durante esta sequência. Atualizações de bibliotecas auxiliares devem ser feitas em passos separados quando puderem ser verificadas independentemente.

Critério por passo: tipos, lint, testes pertinentes, build e verificação dos fluxos essenciais aprovados. A adoção do App Router será uma proposta futura, com escopo próprio.

### 5. Atualizar Tailwind CSS e daisyUI

- [ ] Atualizar primeiro a base compatível de Tailwind 3, se isso facilitar a migração.
- [ ] Planejar Tailwind 4 e daisyUI 5 como uma unidade compatível, conferindo o suporte aos navegadores desejados.
- [ ] Adaptar a configuração do PostCSS, as importações de CSS, o tema e a ativação do modo escuro conforme os guias de migração.
- [ ] Comparar header, grid, cards, botões, detalhes e carrossel com a referência anterior em tela estreita e larga.

A migração deve preservar a composição visual. Mudanças nos estilos padrão devem ser compensadas quando alterarem a aparência acordada. Novas cores ou acabamento serão discutidos em outro passo.

### 6. Revisão final

- [ ] Validar a instalação a partir do lockfile escolhido.
- [ ] Executar tipos, lint, testes e build de produção.
- [ ] Verificar todos os fluxos essenciais na execução de produção.
- [ ] Atualizar o README com versões, requisitos e comandos reais.
- [ ] Apresentar os commits e eventuais limitações antes de discutir publicação ou merge.

## Fluxos essenciais para comparação

- Página inicial com imagens, nomes, tipos e paginação.
- Busca por nome usando teclado e botão, inclusive sem seleção.
- Filtro por tipo, troca de tipo, paginação e atualização da página.
- Acesso direto aos detalhes de um Pokémon válido e a um endereço inexistente.
- Imagens normais e shiny e tabela de atributos.
- Modo claro/escuro e persistência da preferência.
- Header e cards em tela estreita e larga.
- Falha de API: mensagem adequada e término do carregamento; dados antigos não devem substituir uma seleção mais recente.

Executar testes relevantes ao objetivo do passo; não afirmar cobertura de fluxos que não foram verificados. Criar testes de regressão quando houver comportamento com risco real de voltar a quebrar.

## Modelo do retorno ao chat

- Passo concluído e motivo.
- Hash e mensagem do commit.
- Links dos arquivos e trechos antes/depois quando ajudarem a acompanhar.
- Verificações executadas e respectivos resultados.
- Limitações ou problemas ainda pendentes.
- Próximo passo proposto; parar antes de iniciá-lo.

## Referências oficiais

Consultadas em 3 de outubro de 2026; verificar novamente as versões ao executar cada migração.

- Next.js — política de suporte: https://nextjs.org/support-policy
- Next.js — Pages Router: https://nextjs.org/docs/pages
- Next.js — atualização para a versão 16: https://nextjs.org/docs/app/guides/upgrading/version-16
- Tailwind CSS — guia de atualização: https://tailwindcss.com/docs/upgrade-guide
- daisyUI — guia de atualização: https://daisyui.com/docs/upgrade/
