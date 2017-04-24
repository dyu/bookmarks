#!/bin/sh

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

TAR_FILE=target/bookmarks-linux-x64.tar.gz
ZIP_FILE=target/bookmarks-win-x64.zip

echo "========== tar.gz"
rm -f $TAR_FILE
tar -cvzf $TAR_FILE target/protostuffdb -T scripts/files.txt

echo "\n========== zip"
rm -f $ZIP_FILE
zip -r $ZIP_FILE target/protostuffdb.exe -@ < scripts/files.txt
