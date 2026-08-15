# Osaka

Escrapeador de links de descarga de animes

![](docs/sataandagi.jpeg)

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

Los links se veran en la salida del comando.

En caso de querer escribir los links en un fichero puedes usar la opcion `-o`

```sh
npm run start -- https://www4.animeflv.net/anime/sousou-no-frieren -o links.json
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

## Variables de entorno

> ℹ️ Todas las variables de entorno son opcionales.

- **OSAKA_LOG_FILE**: Ruta al fichero de logs.
- **OSAKA_LOG_LEVEL**: Nivel maximo de los logs, puede ser: `debug`, `info`, `warn`.
- **OSAKA_HEADLESS_BROWSER**: Por defecto `true`, `false` para ver la ventana del navegador.
- **OSAKA_HTTP_PORT**: Permite cambiar el puerto en el que se escucha cuando arranca en modo HTTP server.
