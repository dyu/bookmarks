#!/bin/sh

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

[ -n "$1" ] && [ "$1" -eq "$1" ] 2>/dev/null || { echo "Not a whole number: $1"; exit 1; }

CWV="$1"
NWV=`expr "$1" + 1`

TAG="0.$CWV.0"
SNAPSHOT="0.$NWV.0-SNAPSHOT"

ROOT_DIR=$PWD

setVersion() {
mvn versions:set -DnewVersion=$1 -DgenerateBackupPoms=false
}

setVersion $TAG && \
git add -u . && git commit -m $TAG && git tag $TAG && \
setVersion $SNAPSHOT && \
git add -u . && git commit -m $SNAPSHOT && \
git push origin tag $TAG && git push origin master

