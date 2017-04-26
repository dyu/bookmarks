#!/bin/sh

[ $# -lt 1 ] && echo '1st arg (in file) and 2nd arg (out dir) is required.' && exit 0

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

java -jar target/bookmarks-importer-jarjar.jar $IN_FILE $OUT_DIR $@ 2> $STATUS_FILE && echo "Successful. [$STATUS_FILE]"

