#!/bin/sh
# Vérifications BFR-Chantier :  node tests/run.sh
#   1. compilation de l'application (build.py)
#   2. tests du modèle (calculs, sans navigateur)
#   3. test de fumée de l'application (DOM simulé)
#   4. contrôle avant publication (aucune donnée nominative)
#   5. contrôle de l'application installable (identité PWA)
set -e
cd "$(dirname "$0")/.."
echo "=== 1/5  compilation de l'application ==="
python3 build.py
echo
echo "=== 2/5  tests du modèle (calculs) ==="
node tests/test-modele.js
echo "=== 3/5  test de fumée de l'application (DOM simulé) ==="
if [ -d node_modules ] || [ -n "$NODE_PATH" ]; then
  node tests/test-app.js
else
  echo "  (ignoré : jsdom absent — installer avec « npm i jsdom fake-indexeddb »)"
fi
echo "=== 4/5  contrôle avant publication ==="
python3 tests/verifier-publication.py
echo "=== 5/5  application installable (identité PWA) ==="
python3 tests/verifier-pwa.py
