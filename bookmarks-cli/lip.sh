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

MODULE="user"
[ -n "$2" ] && MODULE=$2

[ "$3" = "1" ] && N="-n"

cd $SCRIPT_DIR
./dstool load $N -sev -i target/data/$DIR/dump -o target/data/$DIR/load $MODULE || { echo "load failed."; exit 1; }
# -de for new fields to be indexed
./dstool index -i target/data/$DIR/load -o target/data/$DIR/index $MODULE || { echo "index failed."; exit 1; }
./dstool pipe -i target/data/$DIR/index -o target/data/$DIR/pipe $MODULE || { echo "pipe failed."; exit 1; }

# only the pipe dir is retained
rm -r target/data/$DIR/load && rm -r target/data/$DIR/index && echo "Successful."
