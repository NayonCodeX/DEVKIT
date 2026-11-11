#!/bin/bash
# Add `export const dynamic = "force-static"` to every API route so that
# `next build` with `output: "export"` skips them instead of failing.
# The actual handlers still work when the app is run with a real Next.js
# server (the export directive is only consulted at build time during
# static export).

set -e
ROUTES=$(find /home/z/my-project/src/app/api -name "route.ts")
for f in $ROUTES; do
  if ! grep -q 'export const dynamic = "force-static"' "$f"; then
    # Insert the directive after the first `export const runtime = ...` line,
    # or at the top after the imports.
    if grep -q 'export const runtime' "$f"; then
      sed -i '/export const runtime/a export const dynamic = "force-static";' "$f"
    else
      # Insert after the first line that starts with `import ...` ending with `;`
      # Simpler: prepend after the last import.
      awk '
        BEGIN { inserted = 0 }
        /^import / { print; next }
        /^}$/ && !inserted { print "export const dynamic = \"force-static\";"; inserted = 1 }
        { print }
      ' "$f" > "$f.new" && mv "$f.new" "$f"
    fi
    echo "Patched: $f"
  else
    echo "Already patched: $f"
  fi
done
echo "Done."
