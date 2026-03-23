#!/usr/bin/env bash

links_file="$1"

if [[ "$links_file" == "" ]]; then
    echo "la ruta al fichero de links es obligatoria"
    echo "Ej: ./downloads.sh sousou-no-frieren-links.json"
    exit 1
fi

mkdir -p downloads
sw_links="$(cat "$links_file" | jq '.SW.SUB.[] | strings')"

cd downloads
for link in $sw_links
do
    url="$(echo "$link" | xargs)"
    curl -O "$url"
done