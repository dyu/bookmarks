#!/bin/sh
[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }
[ -e target/jre ] || { echo 'The target/jre dir is missing.'; exit 1; }

BIN=target/hprotostuffdb-rjre
DATA_DIR=target/data/main
JAR=bookmarks-all/target/bookmarks-all-jarjar.jar
ASSETS=-Dprotostuffdb.assets_dir=bookmarks-ts
ARGS=$(cat ARGS.txt)
PORT=$(cat PORT.txt)

echo "The app is available at http://127.0.0.1:$PORT"
$BIN $PORT bookmarks-ts/g/user/UserServices.json $ARGS $ASSETS -Djava.class.path=$JAR bookmarks.all.Main

