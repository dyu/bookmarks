#!/bin/sh

[ $# -lt 2 ] && echo "1st arg (passphrase) and 2nd arg (deploy@example.com) are required." && exit 1

MODULE=user
MAIN_DIR=bookmarks/main

PASSPHRASE=$1
SSH_HOST=$2

ATTIC_PASSPHRASE=$PASSPHRASE /opt/attic/bin/attic list ssh://$SSH_HOST//home/deploy/backups/$MAIN_DIR/$MODULE

