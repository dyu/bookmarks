#!/bin/sh

[ $# -lt 1 ] && echo '1st arg (in file) and 2nd arg (out dir) is required.' && exit 0

JAR=target/bookmarks-importer-jarjar.jar
CLI_DIR=../bookmarks-cli
CLI_JAR=target/bookmarks-cli-jarjar.jar
CLI_EXEC="java -Dcli.separator=! -Ddump.with_seq_key=true -jar $CLI_DIR/$CLI_JAR"

jarjar() {
  rm -f target/*.jar
  mvn -o -Pjwd -Djwd=compile -Dmaven.javadoc.skip=true compile
}

CURRENT_DIR=$PWD
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

IN_FILE=$1
OUT_DIR=$2
shift
shift

mkdir -p $OUT_DIR
STATUS_FILE=$OUT_DIR/status.txt

[ -e $JAR ] || jarjar
[ -e $CLI_DIR/$CLI_JAR ] || { cd $CLI_DIR; jarjar; cd - > /dev/null; }

java -jar $JAR $IN_FILE $OUT_DIR $@ 2> $STATUS_FILE && \
    $CLI_EXEC dump -i $OUT_DIR -o $OUT_DIR/dump user && \
    $CLI_EXEC load -sev -i $OUT_DIR/dump -o $OUT_DIR/load user && \
    $CLI_EXEC index -i $OUT_DIR/load -o $OUT_DIR/index user && \
    $CLI_EXEC pipe -i $OUT_DIR/index -o $OUT_DIR/pipe user && \
    rm -r $OUT_DIR/load && rm -r $OUT_DIR/index && \
    echo "Successful.  Your data is in $OUT_DIR/pipe/user.  [$STATUS_FILE]"

