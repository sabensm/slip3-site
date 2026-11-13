#!/bin/zsh
# Builds public/press/slip3-studios-press-kit.zip from raw/, public/ and rendered wordmarks.
# Wordmarks: render og-src/wordmark-{light,dark}.html at 1600x800 with scripts/render-og.swift first,
# into $WORDMARKS (default /tmp/slip3-wordmarks).
set -e
cd "${0:A:h}/.."
W=${WORDMARKS:-/tmp/slip3-wordmarks}
K=$(mktemp -d)/slip3-studios-press-kit
mkdir -p $K/{logos,app-icons,screenshots,founder}
cp $W/wordmark-light.png $K/logos/slip3-wordmark-on-light.png
cp $W/wordmark-dark.png $K/logos/slip3-wordmark-on-dark.png
cp public/favicon.svg $K/logos/slip3-mark.svg
cp public/icon-512.png $K/logos/slip3-mark-512.png
sips -s format png raw/fl-icon.jpg --out $K/app-icons/formation-lab.png >/dev/null
sips -s format png raw/s5-icon.jpg --out $K/app-icons/starting-5.png >/dev/null
sips -s format png raw/fold-icon.jpg --out $K/app-icons/the-fold.png >/dev/null
cp raw/plonk-icon.png $K/app-icons/plonk.png
for f in raw/fl-store-0{1,2,3}-*.jpg raw/s5-store-0{1,3,6}-*.jpg raw/plonk-0{1,3,8}-*.jpg; do
  sips -s format jpeg -s formatOptions 85 -Z 2348 $f --out $K/screenshots/$(basename $f) >/dev/null
done
cp raw/fold-shot1.jpg $K/screenshots/the-fold-library.jpg
cp raw/fold-shot2.jpg $K/screenshots/the-fold-recipe.jpg
cp public/img/mike-sabens.jpg $K/founder/mike-sabens.jpg
cp press/README.txt $K/README.txt
rm -f public/press/slip3-studios-press-kit.zip
(cd ${K:h} && zip -qrX - ${K:t}) > public/press/slip3-studios-press-kit.zip
ls -la public/press/slip3-studios-press-kit.zip
