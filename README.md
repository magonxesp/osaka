# Osaka

Escrapeador de links de descarga de animes en AnimeFLV

Requisitos:

- NodeJS 22 o posterior
- jq

## Ejecutar

```sh
npx @magonxesp/osaka https://www4.animeflv.net/anime/sousou-no-frieren
```

### Clonando el repositorio

Instalar dependencias

```sh
npm install
```

Ejecutar script con un link de animeflv por ejemplo:

```sh
npm run start -- https://www4.animeflv.net/anime/sousou-no-frieren
```

## Extraer links de un server y formato

```sh
cat links.json | jq '.MEGA.SUB'
```

## Publicar en NPM

Primero hacer login en NPM si no se ha hecho:

```sh
npm login
```

Luego hacer la build y publicar:

```sh
npm run build && npm publish --access public
```