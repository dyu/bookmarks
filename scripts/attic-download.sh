#!/bin/sh

[ $# -lt 3 ] && echo "1st arg (passphrase), 2nd arg (deploy@example.com) and 3rd arg (backup_name) are required." && exit 1

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

ATTIC=/opt/attic/bin/attic
MODULE=user
MAIN_DIR=bookmarks/main

PASSPHRASE=$1
SSH_HOST=$2
BACKUP_NAME=$3

MOUNT_DIR=target/attic-download/mount/$MODULE/$BACKUP_NAME
[ -e $MOUNT_DIR ] && echo "Please delete this dir first: $MOUNT_DIR" && exit 1

OUTPUT_DIR=target/attic-download/out
mkdir -p $OUTPUT_DIR $MOUNT_DIR

ATTIC_PASSPHRASE=$PASSPHRASE $ATTIC mount ssh://$SSH_HOST//home/deploy/backups/$MAIN_DIR/$MODULE::$BACKUP_NAME $MOUNT_DIR && \
    cp -r $MOUNT_DIR/data/deploy/$MAIN_DIR/$MODULE/backup-live/$BACKUP_NAME $SCRIPT_DIR/$OUTPUT_DIR/ && \
    fusermount -u $MOUNT_DIR && \
    echo "Successfully downloaded to scripts/$OUTPUT_DIR/$BACKUP_NAME"

