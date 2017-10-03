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

jarjar() {
  cd ../bookmarks-all
  rm -f target/*.jar
  mvn -o -Pjwd -Djwd=compile -Dmaven.javadoc.skip=true compile
  cd - > /dev/null
}

MASTER_PORT=$1
[ "$MASTER_PORT" = "" ] && MASTER_PORT=$(cat ../PORT.txt)

ARGS_TXT=$(cat ../ARGS.txt)

BIN=/opt/protostuffdb/bin/hprotostuffdb-rslave
ARGS="$ARGS_TXT -Dprotostuffdb.with_backup=true -Dprotostuffdb.master=ws://127.0.0.1:$MASTER_PORT"

DATA_DIR=target/data/main
JAR=../bookmarks-all/target/bookmarks-all-jarjar.jar
PORT=$(cat PORT.txt)

[ -e $JAR ] || jarjar

mkdir -p $DATA_DIR

$BIN $PORT ../bookmarks-ts/g/user/UserServices.json $ARGS -Djava.class.path=$JAR bookmarks.all.Main

