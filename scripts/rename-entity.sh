#!/usr/bin/env bash
# =============================================================================
# rename-entity.sh
# Renames the "Article" entity and "Accelerator" project name throughout
# the AI Fullstack Accelerator codebase.
#
# Usage:
#   ./scripts/rename-entity.sh \
#     --entity-name "Product" \
#     --entity-name-plural "Products" \
#     --project-name "MyProject" \
#     [--dry-run] \
#     [--force]
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Defaults
# ---------------------------------------------------------------------------
ENTITY_NAME=""
ENTITY_NAME_PLURAL=""
PROJECT_NAME=""
DRY_RUN=false
FORCE=false

# ---------------------------------------------------------------------------
# Argument parsing
# ---------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --entity-name)
      ENTITY_NAME="$2"; shift 2 ;;
    --entity-name-plural)
      ENTITY_NAME_PLURAL="$2"; shift 2 ;;
    --project-name)
      PROJECT_NAME="$2"; shift 2 ;;
    --dry-run)
      DRY_RUN=true; shift ;;
    --force)
      FORCE=true; shift ;;
    *)
      echo "Unknown option: $1" >&2
      echo "Usage: $0 --entity-name <Name> [--entity-name-plural <Names>] --project-name <ProjectName> [--dry-run] [--force]" >&2
      exit 1 ;;
  esac
done

# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------
if [[ -z "$ENTITY_NAME" ]]; then
  echo "Error: --entity-name is required." >&2
  exit 1
fi
if [[ -z "$PROJECT_NAME" ]]; then
  echo "Error: --project-name is required." >&2
  exit 1
fi

# Derive plural if not supplied
if [[ -z "$ENTITY_NAME_PLURAL" ]]; then
  ENTITY_NAME_PLURAL="${ENTITY_NAME}s"
fi

# Derive lowercase / camelCase variants
ENTITY_LOWER=$(echo "$ENTITY_NAME" | tr '[:upper:]' '[:lower:]')
ENTITY_PLURAL_LOWER=$(echo "$ENTITY_NAME_PLURAL" | tr '[:upper:]' '[:lower:]')
PROJECT_LOWER=$(echo "$PROJECT_NAME" | tr '[:upper:]' '[:lower:]')

# Source strings (what we replace FROM)
SRC_ENTITY_PASCAL="Article"
SRC_ENTITY_PLURAL_PASCAL="Articles"
SRC_ENTITY_LOWER="article"
SRC_ENTITY_PLURAL_LOWER="articles"
SRC_PROJECT_PASCAL="Accelerator"
SRC_PROJECT_LOWER="accelerator"

# ---------------------------------------------------------------------------
# Print plan
# ---------------------------------------------------------------------------
echo "======================================================"
echo " Entity Rename Plan"
echo "======================================================"
echo "  Article       -> $ENTITY_NAME"
echo "  Articles      -> $ENTITY_NAME_PLURAL"
echo "  article       -> $ENTITY_LOWER"
echo "  articles      -> $ENTITY_PLURAL_LOWER"
echo "  Accelerator   -> $PROJECT_NAME"
echo "  accelerator   -> $PROJECT_LOWER"
echo ""
if $DRY_RUN; then
  echo "  [DRY RUN] No files will be modified."
fi
echo "======================================================"
echo ""

# ---------------------------------------------------------------------------
# Safety: uncommitted git changes
# ---------------------------------------------------------------------------
if ! $FORCE; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
  if ! git -C "$REPO_ROOT" diff --quiet HEAD 2>/dev/null || \
     [[ -n "$(git -C "$REPO_ROOT" status --porcelain 2>/dev/null)" ]]; then
    echo "Error: You have uncommitted git changes." >&2
    echo "       Commit or stash them first, or pass --force to skip this check." >&2
    exit 1
  fi
fi

# ---------------------------------------------------------------------------
# Detect sed in-place syntax (macOS requires '' argument, Linux does not)
# ---------------------------------------------------------------------------
SED_INPLACE=(-i)
if [[ "$(uname)" == "Darwin" ]]; then
  SED_INPLACE=(-i '')
fi

# ---------------------------------------------------------------------------
# Resolve repo root
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ---------------------------------------------------------------------------
# Directories / extensions to process
# ---------------------------------------------------------------------------
# Directories to skip
SKIP_DIRS=(
  "node_modules"
  ".next"
  "bin"
  "obj"
  ".git"
  "storybook-static"
  "coverage"
)

# File extensions for content replacement
CONTENT_EXTS=(
  "ts" "tsx" "cs" "json" "yml" "yaml" "md" "sh" "ps1" "csproj" "sln" "env"
)

# ---------------------------------------------------------------------------
# Helper: build find -prune args for skipped dirs
# ---------------------------------------------------------------------------
build_prune_args() {
  local args=()
  for d in "${SKIP_DIRS[@]}"; do
    args+=(-o -name "$d" -prune)
  done
  # Emit: \( -name skip1 -prune -o -name skip2 -prune ... \) -o
  echo "\\(" "${args[@]:2}" "\\) -o"
}

# ---------------------------------------------------------------------------
# Helper: check if path is inside a skipped directory
# ---------------------------------------------------------------------------
is_skipped() {
  local path="$1"
  for d in "${SKIP_DIRS[@]}"; do
    if [[ "$path" == *"/$d/"* ]] || [[ "$path" == *"/$d" ]]; then
      return 0
    fi
  done
  return 1
}

# ---------------------------------------------------------------------------
# Build extension pattern for find
# ---------------------------------------------------------------------------
build_ext_pattern() {
  local pattern=""
  local first=true
  for ext in "${CONTENT_EXTS[@]}"; do
    if $first; then
      pattern="-name \"*.$ext\""
      first=false
    else
      pattern="$pattern -o -name \"*.$ext\""
    fi
  done
  echo "$pattern"
}

# ---------------------------------------------------------------------------
# PASS 1: Replace file contents
# ---------------------------------------------------------------------------
echo "--- Pass 1: Replacing file contents ---"
echo ""

# Collect files using find, excluding skipped dirs
while IFS= read -r -d '' file; do
  if is_skipped "$file"; then continue; fi

  # Check if file contains any of the source strings
  if grep -qE "(${SRC_ENTITY_PASCAL}|${SRC_ENTITY_PLURAL_PASCAL}|${SRC_ENTITY_LOWER}|${SRC_ENTITY_PLURAL_LOWER}|${SRC_PROJECT_PASCAL}|${SRC_PROJECT_LOWER})" "$file" 2>/dev/null; then
    echo "  Updating contents: $file"
    if ! $DRY_RUN; then
      # Order matters: replace plurals before singulars to avoid partial matches.
      # Also replace project name.
      sed "${SED_INPLACE[@]}" \
        -e "s/${SRC_ENTITY_PLURAL_PASCAL}/${ENTITY_NAME_PLURAL}/g" \
        -e "s/${SRC_ENTITY_PLURAL_LOWER}/${ENTITY_PLURAL_LOWER}/g" \
        -e "s/${SRC_ENTITY_PASCAL}/${ENTITY_NAME}/g" \
        -e "s/${SRC_ENTITY_LOWER}/${ENTITY_LOWER}/g" \
        -e "s/${SRC_PROJECT_PASCAL}/${PROJECT_NAME}/g" \
        -e "s/${SRC_PROJECT_LOWER}/${PROJECT_LOWER}/g" \
        "$file"
    fi
  fi
done < <(
  find "$REPO_ROOT" -type f \( \
    -name "*.ts"    -o -name "*.tsx"  -o -name "*.cs"   -o \
    -name "*.json"  -o -name "*.yml"  -o -name "*.yaml" -o \
    -name "*.md"    -o -name "*.sh"   -o -name "*.ps1"  -o \
    -name "*.csproj" -o -name "*.sln" -o -name "*.env"  \
  \) -print0
)

echo ""
echo "--- Pass 2: Renaming files and directories ---"
echo ""

# ---------------------------------------------------------------------------
# PASS 2: Rename files first (bottom-up via sort -r), then directories
# ---------------------------------------------------------------------------

# Collect files whose names contain any of the source strings
rename_path() {
  local path="$1"
  local base dir new_base new_path

  base="$(basename "$path")"
  dir="$(dirname "$path")"

  new_base="$base"
  # Apply renames in same order (plurals first)
  new_base="${new_base//${SRC_ENTITY_PLURAL_PASCAL}/${ENTITY_NAME_PLURAL}}"
  new_base="${new_base//${SRC_ENTITY_PLURAL_LOWER}/${ENTITY_PLURAL_LOWER}}"
  new_base="${new_base//${SRC_ENTITY_PASCAL}/${ENTITY_NAME}}"
  new_base="${new_base//${SRC_ENTITY_LOWER}/${ENTITY_LOWER}}"
  new_base="${new_base//${SRC_PROJECT_PASCAL}/${PROJECT_NAME}}"
  new_base="${new_base//${SRC_PROJECT_LOWER}/${PROJECT_LOWER}}"

  if [[ "$new_base" != "$base" ]]; then
    new_path="${dir}/${new_base}"
    echo "  Renaming: $path  ->  $new_path"
    if ! $DRY_RUN; then
      mv "$path" "$new_path"
    fi
  fi
}

# Rename files (deepest first to avoid conflicts)
while IFS= read -r -d '' file; do
  if is_skipped "$file"; then continue; fi
  rename_path "$file"
done < <(
  find "$REPO_ROOT" -type f -print0 | sort -rz
)

# Rename directories (deepest first)
while IFS= read -r -d '' dir; do
  if is_skipped "$dir"; then continue; fi
  rename_path "$dir"
done < <(
  find "$REPO_ROOT" -mindepth 1 -type d -print0 | sort -rz
)

echo ""
echo "======================================================"
if $DRY_RUN; then
  echo " Dry run complete. No files were modified."
else
  echo " Rename complete!"
  echo ""
  echo " Next steps:"
  echo "   1. Run: dotnet build (from backend/)"
  echo "   2. Run: npm run build"
  echo "   3. Review git diff to confirm changes"
fi
echo "======================================================"
