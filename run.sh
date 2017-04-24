#!/bin/sh

if [ -e /opt/protostuffdb/bin/protostuffdb ]; then
    BIN=/opt/protostuffdb/bin/protostuffdb
elif [ -e target/protostuffdb ]; then
    BIN=./target/protostuffdb
else
    echo 'The target/protostuffdb binary must exist.  Download that file from https://1drv.ms/f/s!Ah8UGrNGpqlzeAVPYtkNffvNZBo'
    exit 1
fi

DATA_DIR=target/data/main
JAR=bookmarks-all/target/bookmarks-all-jarjar.jar
ARGS=$(cat ARGS.txt)
PORT=$(cat PORT.txt)

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

$BIN $PORT bookmarks-ts/g/user/UserServices.json $ARGS -Djava.class.path=$JAR bookmarks.all.Main

