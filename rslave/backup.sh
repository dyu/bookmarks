#!/bin/sh

# locate
if [ ! -n "$BASH_SOURCE" ]; then
    SCRIPT_DIR=`dirname "$(readlink -f "$0")"`
else
    F=$BASH_SOURCE
    while [ -h "$F" ]; do
        F="$(readlink "$F")"
    done
    SCRIPT_DIR=`dirname "$F"`
fi

cd $SCRIPT_DIR

BIN=/opt/protostuffdb/bin/ws-cli-backup

[ -n "$MASTER_PORT" ] || MASTER_PORT=$(cat ../PORT.txt)

CONNECT_URL="ws://127.0.0.1:$MASTER_PORT/bookmark123456781234567812345678"

DATE=$(date)
BACKUP_NAME=$(date -d "$DATE" +%Y-%m-%d_%H-%M-%S)

$BIN $CONNECT_URL $BACKUP_NAME $@
