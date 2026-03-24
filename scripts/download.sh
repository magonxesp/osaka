#!/usr/bin/env bash

links_file="$1"
download_dir="$2"

if [[ "$download_dir" == "" ]]; then
    download_dir="downloads"
fi

if [[ "$links_file" == "" ]]; then
    echo "la ruta al fichero de links es obligatoria"
    echo "Ej: ./downloads.sh sousou-no-frieren-links.json"
    exit 1
fi

if [[ -f "$download_dir" ]]; then
    echo "La ruta tiene que ser un directorio"
    exit 1
fi

if [[ ! -d "$download_dir" ]]; then
    mkdir -p "$download_dir"
fi

echo "Descargando episodios en: $(realpath "$download_dir")"
sw_links="$(cat "$links_file" | jq '.SW.SUB.[] | strings')"

cd "$download_dir"
for link in $sw_links
do
    url="$(echo "$link" | xargs)"
    echo "Descargando episodio desde: $url"
    curl -O "$url"
done