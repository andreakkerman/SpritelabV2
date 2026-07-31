#!/usr/bin/env bash
# Fetch the authentic Sven walk inputs at the immutable Atlas revision used by SpriteLab.
set -euo pipefail

ATLAS_REPOSITORY="https://github.com/andreakkerman/atlas"
ATLAS_COMMIT="7be9f991aad0deda5b1b873c39bda3ba155ee01d"
ATLAS_PATH="assets/characters/sven/walk-right"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESTINATION="${ROOT}/inputs/sven/walk/atlas-original"
TEMP_DIRECTORY="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIRECTORY}"' EXIT

echo "Fetching Sven walk frames from ${ATLAS_REPOSITORY}@${ATLAS_COMMIT}"
for frame in {01..24}; do
  filename="frame-${frame}.png"
  curl --fail --location --silent --show-error \
    --retry 3 --retry-all-errors \
    "https://raw.githubusercontent.com/andreakkerman/atlas/${ATLAS_COMMIT}/${ATLAS_PATH}/${filename}" \
    --output "${TEMP_DIRECTORY}/${filename}"
  test -s "${TEMP_DIRECTORY}/${filename}"
done

mkdir -p "${DESTINATION}"
find "${DESTINATION}" -maxdepth 1 -type f -name 'frame-*.png' -delete
cp "${TEMP_DIRECTORY}"/frame-*.png "${DESTINATION}/"

count="$(find "${DESTINATION}" -maxdepth 1 -type f -name 'frame-*.png' | wc -l)"
test "${count}" -eq 24
echo "Installed ${count} pinned Atlas frames in ${DESTINATION}"
