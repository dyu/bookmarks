#!/bin/sh

[ $# -lt 3 ] && echo "1st arg (passphrase), 2nd arg (deploy@example.com) and 3rd arg (backup_name) are required." && exit 1

MODULE=user
MAIN_DIR=bookmarks/main

PASSPHRASE=$1
SSH_HOST=$2
BACKUP_NAME=$3

ATTIC_PASSPHRASE=$PASSPHRASE /opt/attic/bin/attic info ssh://$SSH_HOST//home/deploy/backups/$MAIN_DIR/$MODULE::$BACKUP_NAME

