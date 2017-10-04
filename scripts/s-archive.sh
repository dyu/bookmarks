#!/bin/sh

[ -e scripts ] || { echo 'Execute this script from root dir.'; exit 1; }

OUT_DIR=target/bin

[ -e $OUT_DIR ] || mkdir -p $OUT_DIR

TAR_FILE=$OUT_DIR/bookmarks-linux-standalone-x64.tar.gz

DIST="bookmarks-ts/dist/build.js bookmarks-ts/dist/bookmarklet.js bookmarks-ts/dist/app.css bookmarks-ts/dist/bookmarklet.css"

echo "========== tar.gz"
rm -f $TAR_FILE
echo '#!/bin/sh' > start.sh && tail --lines=+4 scripts/s-start.sh >> start.sh && chmod +x start.sh && \
    head --lines=-4 scripts/files.txt | tar -cvzf $TAR_FILE start.sh target/hprotostuffdb-rjre target/jre/*/ $DIST -T -
rm start.sh
