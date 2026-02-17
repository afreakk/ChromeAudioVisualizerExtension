#!/usr/bin/env bash
set -euo pipefail

SCENE_NAMES_FILE="src/scene/sceneNames.ts"
REGISTRY_FILE="src/scene/sceneRegistry.ts"

if [[ ! -f "$SCENE_NAMES_FILE" ]]; then
  echo "ERROR: $SCENE_NAMES_FILE not found"
  exit 1
fi

if [[ ! -f "$REGISTRY_FILE" ]]; then
  echo "ERROR: $REGISTRY_FILE not found"
  exit 1
fi

# Extract enum member names (left side of = inside the enum block)
enum_names=()
in_enum=false
while IFS= read -r line; do
  if [[ "$line" =~ \{ ]]; then
    in_enum=true
    continue
  fi
  if [[ "$line" =~ \} ]]; then
    break
  fi
  if $in_enum; then
    # Match lines like "    Butterchurn = 'Butterchurn',"
    if [[ "$line" =~ ^[[:space:]]*([A-Za-z0-9_]+)[[:space:]]*= ]]; then
      enum_names+=("${BASH_REMATCH[1]}")
    fi
  fi
done < "$SCENE_NAMES_FILE"

if [[ ${#enum_names[@]} -eq 0 ]]; then
  echo "ERROR: No enum values found in $SCENE_NAMES_FILE"
  exit 1
fi

registry_content=$(<"$REGISTRY_FILE")

missing=()
for name in "${enum_names[@]}"; do
  if ! grep -q "sceneNames\\.${name}" <<< "$registry_content"; then
    missing+=("$name")
  fi
done

if [[ ${#missing[@]} -eq 0 ]]; then
  echo "OK: All scenes registered (${#enum_names[@]} scenes)"
  exit 0
else
  echo "MISSING scene registrations:"
  for name in "${missing[@]}"; do
    echo "  - sceneNames.$name"
  done
  exit 1
fi
