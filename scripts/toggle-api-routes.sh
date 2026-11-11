#!/bin/bash
# Temporarily move API routes out of the way so `next build` with
# `output: export` succeeds. Restore them after the build is done.
# The API routes still work in dev mode and in a real Next.js deployment.

set -e

API_DIR=/home/z/my-project/src/app/api
BACKUP_DIR=/home/z/my-project/.api-backup

case "$1" in
  hide)
    if [ -d "$BACKUP_DIR" ]; then
      echo "Backup already exists — assuming routes are already hidden."
      exit 0
    fi
    mkdir -p "$BACKUP_DIR"
    mv "$API_DIR" "$BACKUP_DIR/api"
    echo "Hid $API_DIR → $BACKUP_DIR/api"
    # Create a minimal api folder with a health endpoint so any client
    # fetch to /api/health returns 200 (other endpoints will 404, which
    # the UI handles gracefully).
    mkdir -p "$API_DIR/health"
    cat > "$API_DIR/health/route.ts" << 'EOF'
export const dynamic = "force-static";
export async function GET() {
  return Response.json({ ok: true, service: "devkit-static", version: "1.0.0", aiConfigured: false, githubConfigured: false });
}
EOF
    echo "Created minimal /api/health route for static export"
    ;;
  restore)
    if [ ! -d "$BACKUP_DIR/api" ]; then
      echo "No backup to restore from."
      exit 0
    fi
    rm -rf "$API_DIR"
    mv "$BACKUP_DIR/api" "$API_DIR"
    rmdir "$BACKUP_DIR" 2>/dev/null || true
    echo "Restored $API_DIR ← $BACKUP_DIR/api"
    ;;
  *)
    echo "Usage: $0 {hide|restore}"
    exit 1
    ;;
esac
