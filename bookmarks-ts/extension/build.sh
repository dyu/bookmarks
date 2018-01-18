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

YUI_VERSION=2.4.8
JAR_FILE=target/yuicompressor-$YUI_VERSION.jar

rm -rf target/popup target/web-ext-artifacts
mkdir -p target/popup
[ -e $JAR_FILE ] || wget -O $JAR_FILE https://github.com/yui/yuicompressor/releases/download/v2.4.8/yuicompressor-$YUI_VERSION.jar

cp -r assets target/
cp manifest.json target/
cp popup/index.html target/popup/
java -jar $JAR_FILE -o target/popup/index.js popup/index.js && \
cleancss -O2 popup/style.css > target/popup/style.css && \
cd target && web-ext build

