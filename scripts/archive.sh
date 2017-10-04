#!/bin/sh

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

TAR_FILE=target/bookmarks-linux-x64.tar.gz
ZIP_FILE=target/bookmarks-win-x64.zip

LBIN=target/protostuffdb
WBIN=target/protostuffdb.exe

if [ "$1" = "r" ]; then
    LBIN=target/hprotostuffdb-rmaster
    WBIN=target/protostuffdb-rslave.exe
fi

echo "========== tar.gz"
rm -f $TAR_FILE
tar -cvzf $TAR_FILE $LBIN bookmarks-ts/opt-nw -T scripts/files.txt

echo "\n========== zip"
rm -f $ZIP_FILE
zip -r $ZIP_FILE $WBIN bookmarks-ts/opt-nw.exe -@ < scripts/files.txt
