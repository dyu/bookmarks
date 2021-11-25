#!/bin/sh

BASE_DIR=$PWD
UNAME=`uname`
WIN_SUFFIX=""
[ "$UNAME" != "Linux" ] && [ "$UNAME" != "Darwin" ] && WIN_SUFFIX='.exe'
TARGET_BIN="target/protostuffdb$WIN_SUFFIX"
ARGS=$(cat ARGS.txt)

if [ "$1" = "mt" ]; then
    BIN=/opt/protostuffdb/bin/hprotostuffdb-rmaster-mt
    ARGS="$ARGS -Dprotostuffdb.with_backup=true -Dprotostuffdb.readers=1"
elif [ "$1" = "m" ]; then
    BIN=/opt/protostuffdb/bin/hprotostuffdb-rmaster
    ARGS="$ARGS -Dprotostuffdb.with_backup=true"
elif [ -e target/protostuffdb-rjre ]; then
    BIN=$BASE_DIR/target/protostuffdb-rjre
elif [ -e "$TARGET_BIN" ]; then
    BIN=$BASE_DIR/$TARGET_BIN
elif [ -e /opt/protostuffdb/bin/hprotostuffdb ]; then
    BIN=/opt/protostuffdb/bin/hprotostuffdb
    ARGS="$ARGS -Dprotostuffdb.with_backup=true"
else
    echo "The $TARGET_BIN binary must exist" && exit 1
fi

DATA_DIR=target/data/main
JAR=bookmarks-all/target/bookmarks-all-jarjar.jar
PORT=$(cat PORT.txt)
BIND_IP='*'
[ "$UNAME" != "Linux" ] && BIND_IP='127.0.0.1'

jarjar() {
  cd bookmarks-all
  rm -f target/*.jar
  mvn -o -Pjwd -Djwd=compile -Dmaven.javadoc.skip=true compile
  cd - > /dev/null
}

case "$1" in
    0)
    # recompile and skip run
    rm -f $JAR
    jarjar
    exit 0
    ;;

    1)
    # recompile
    rm -f $JAR
    ;;

    *)
    # regenerate and recompile module
    [ "$1" != "" ] && [ -e "modules/$1" ] && \
        ./modules/codegen.sh $1 && \
        cd modules/$1 && \
        mvn -o -Dmaven.javadoc.skip=true install && \
        cd - > /dev/null && \
        rm -f $JAR
    ;;
esac

[ -e $JAR ] || jarjar

mkdir -p $DATA_DIR

if [ -n "$WIN_SUFFIX" ]; then
[ -e target/jre/bin/server ] || { echo 'Missing windows jre: target/jre'; exit 1; }
cd target/jre/bin/server
fi

$BIN $BIND_IP:$PORT $BASE_DIR/bookmarks-ts/g/user/UserServices.json $ARGS -Djava.class.path=$BASE_DIR/$JAR bookmarks.all.Main $BASE_DIR

