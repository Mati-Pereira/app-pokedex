
# App Pokedex

An app to look at the attributes of your favorite pokemon, such as its color in shiny mode

## Authors

- [@Mati-Pereira](https://www.github.com/Mati-Pereira)

## Badges

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)

## Demo

<https://app-pokedex-ashy.vercel.app/>

## Features

- Light/dark mode toggle
- Search bar
- Details Page

## Feedback

If you have any feedback, please reach out to me at matheus-rodrigues37@live.com

## 🚀 About Me

Programming has always been a passion of mine, since college, I always thought of connecting my knowledge with new technologies, it was and is something very instinctive to me. I dedicate myself heart and soul to achieve my dream of being a FullStack Web Developer.

## 🔗 Links

[![portfolio](https://img.shields.io/badge/my_portfolio-000?style=for-the-badge&logo=ko-fi&logoColor=white)](https://portifolio-new-4q6j.vercel.app/)
[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/matheus-rodrigues-pereira/)

## Lessons Learned

I learned a lot about handling files that came from an external API, and how to display them to the end audience.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Run Locally

Clone the project

```bash
  git clone https://github.com/Mati-Pereira/app-pokedex
```

Go to the project directory

```bash
  cd app-pokedex
```

Install dependencies

```bash
  npm ci
```

Run in dev mode

```bash
  npm run dev
```

## Validation and production

Use npm 10.9.4 and commit changes to `package-lock.json`. The lockfile is the source of dependency versions; use `npm ci` for clean installations.

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

The production server runs at http://localhost:3000. The build currently fetches the Pokemon catalog and pre-renders all detail pages using PokeAPI, so it requires network access and may take several minutes or fail if the API is unavailable. Client-side search and lists also require PokeAPI access.

## Tech Stack

**Client:** React, Next.js, TailwindCSS, Typescript

**Server:** Node
