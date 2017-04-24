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

DIR=$1
[ -n "$DIR" ] || { echo "The first arg (dir) is required."; exit 1; }

shift

MODULE="user"
[ -n "$1" ] && MODULE=$1 && shift

cd $SCRIPT_DIR
./dstool dump $@ -i ../target/data/main -o target/data/$DIR/dump $MODULE && echo "Successful."
