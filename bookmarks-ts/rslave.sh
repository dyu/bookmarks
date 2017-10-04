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

head --lines=-7 rslave.html > dist/rslave.html
printf '    uri_w_map = ' >> dist/rslave.html
tr -d ' \t\n\r\f' < g/user/w/UserServices.json >> dist/rslave.html
printf '\n    appendEl("script", "src", "dist/build.js")\n    })();</script>\n  </body>\n</html>\n' >> dist/rslave.html
