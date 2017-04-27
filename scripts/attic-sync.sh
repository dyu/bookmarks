#!/bin/sh

# the user data dir should be /data/deploy/bookmarks/main/user and symlinked from target/data/main
# the remote attic repo dir should be /home/deploy/backups/bookmarks/main/user

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

[ $# -lt 3 ] && echo "1st arg (backup_name), 2nd arg (passphrase) and 3rd arg (deploy@example.com) are required." && exit 1
# ./scripts/attic-sync.sh 2017-04-27_11-40-16 your_passphrase! deploy@bookmarks.example.com

BACKUP_NAME=$1
PASSPHRASE=$2
shift
shift

ATTIC=/opt/attic/bin/attic
MODULE=user
MAIN_DIR=bookmarks/main
BACKUP_LIVE=/data/deploy/$MAIN_DIR/$MODULE/backup-live

for SSH_HOST in "$@"; do
ATTIC_PASSPHRASE=$PASSPHRASE $ATTIC create ssh://$SSH_HOST//home/deploy/backups/$MAIN_DIR/$MODULE::$BACKUP_NAME $BACKUP_LIVE && echo "Successfully synced to $SSH_HOST"
done 

