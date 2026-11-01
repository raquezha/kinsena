#!/bin/sh
set -eu
umask 077
cd "$(dirname "$0")"
if [ ! -f data/kinsena.db ]; then
    echo "No database to back up" >&2
    exit 1
fi
mkdir -p backups
backup="backups/kinsena-$(date -u +%Y%m%dT%H%M%SZ).db"
if [ -e "$backup" ]; then
    echo "Backup already exists: $backup" >&2
    exit 1
fi
pending="$backup.pending"
sqlite3 -readonly data/kinsena.db ".backup '$pending'"
[ "$(sqlite3 "$pending" 'PRAGMA quick_check;')" = ok ]
mv "$pending" "$backup"
