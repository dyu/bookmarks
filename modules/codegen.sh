#!/bin/sh

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

execjar() {
java -Dtemplate_path=.. \
    -Dproto_path=.. \
    -Dproto_search_strategy=4 \
    -Dfbsgen.print_stack_trace=false \
    -Dfbsgen.sequential_field_numbers=true \
    -Dfbsgen.enum_allow_negative=false \
    -jar ../../target/fbsgen-ds.jar _.properties $@
}

EXEC=execjar
command -v fbsgen-ds >/dev/null 2>&1 && EXEC=fbsgen-ds

if [ -n "$1" ] && [ -d "$1" ]; then
    cd $1
    shift
    $EXEC $@ || exit 1
    exit 0
fi

MODULES="user"
for i in $MODULES; do
    echo "==================== $i"
    cd $i
    $EXEC $@ || exit 1
    cd ..
done

