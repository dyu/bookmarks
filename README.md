# bookmarks app

a simple self-hosted bookmarking app that can import bookmarks from delicious and chrome

### Quickstart
```sh
mkdir -p target/standalone && cd target/standalone
wget https://unpkg.com/dyu-bookmarks@0.4.1/bin/bookmarks-linux-standalone-x64.tar.gz
tar -xzf bookmarks-linux-standalone-x64.tar.gz
./start.sh
```

![screenshot](https://github.com/dyu/bookmarks/raw/master/screenshot-browser.png)

Here's the [demo](https://dyuproject.com/bookmarks/) with a matching [bookmarklet](https://dyuproject.com/bookmarklet/)

To import from delicious and/or chrome, see [bookmarks-importer/README.md](bookmarks-importer/README.md)

## Server runtime dependencies
- jdk7

## Desktop runtime dependencies
- jdk7
- [nwjs](https://nwjs.io/) [0.19.5](https://dl.nwjs.io/v0.19.5/) or higher
  > (optional, you can launch the app via ```node bookmarks-ts/chrome-app.js```)

## Dev requirements
- [node](https://nodejs.org/en/download/) 6.9.0 or higher
- yarn (npm install -g yarn)
- jdk7 (at /usr/lib/jvm/java-7-oracle)
- [maven](https://maven.apache.org/download.cgi)
- [protostuffdb](https://gitlab.com/dyu/protostuffdb) (downloaded below)

## Setup
```sh
mkdir -p target/data/main
echo "Your data lives in user/ dir.  Feel free to back it up." > target/data/main/README.txt

# download protostuffdb
yarn add protostuffdb@0.19.0 && mv node_modules/protostuffdb/dist/* target/ && rm -f package.json yarn.lock && rm -r node_modules

wget -O target/fbsgen-ds.jar https://repo1.maven.org/maven2/com/dyuproject/fbsgen/ds/fbsgen-ds-fatjar/1.0.12/fbsgen-ds-fatjar-1.0.12.jar
./modules/codegen.sh
mvn install

cd bookmarks-ts
yarn install
```

## Dev mode
```sh
# produces a single jar the first time (bookmarks-all/target/bookmarks-all-jarjar.jar)
./run.sh

# on another terminal
cd bookmarks-ts
# serves the ui via http://localhost:8080/
yarn run dev
```

## Production mode
If ```run.sh``` is still running, stop that process (ctrl+c)
```sh
cd bookmarks-ts
# produces js/assets in bookmarks-ts/dist/
./build.sh
# finally, run your production app
nw .
# or
node chrome-app.js
```

### To setup the bookmarklet
```sh
# close the nw window if you ran 'nw .' prior to this
nw . b
# or
node chrome-app.js b
```

## Packaging for desktop (nwjs)
Exec
```sh
./scripts/archive.sh
```

That script generates:
- target/bookmarks-linux-x64.tar.gz
- target/bookmarks-win-x64.zip

