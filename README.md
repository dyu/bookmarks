# bookmarks app

a simple self-hosted bookmarking app that can import bookmarks from delicious or chrome

![screenshot](https://github.com/dyu/bookmarks/raw/master/screenshot-browser.png)

## Server runtime dependencies
- jdk7

## Desktop runtime dependencies
- jdk7
- [nwjs](https://nwjs.io/) [0.19.5](https://dl.nwjs.io/v0.19.5/) or higher

## Dev requirements
- [protostuffdb](https://gitlab.com/dyu/protostuffdb)
  * download the [binaries](https://1drv.ms/f/s!Ah8UGrNGpqlzeAVPYtkNffvNZBo) (protostuffdb and protostuffdb.exe) into the ```target/``` dir
- [node](https://nodejs.org/en/download/) 6.9.0 or higher
- yarn (npm install -g yarn)
- jdk7 (at /usr/lib/jvm/java-7-oracle)
- [maven](https://maven.apache.org/download.cgi)

## Setup
```sh
mkdir -p target/data/main
echo "Your data lives in user/ dir.  Feel free to back it up." > target/data/main/README.txt
wget -O target/fbsgen-ds.jar https://repo1.maven.org/maven2/com/dyuproject/fbsgen/ds/fbsgen-ds-fatjar/1.0.5/fbsgen-ds-fatjar-1.0.5.jar
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
```

### To setup the bookmarklet
```sh
nw . b
```

## Packaging for desktop (nwjs)
Exec
```sh
./scripts/archive.sh
```

That script generates:
- target/bookmarks-linux-x64.tar.gz
- target/bookmarks-win-x64.zip

