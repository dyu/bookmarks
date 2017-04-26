## Usage

```sh
./import.sh target/delicious.html target/delicious delicious
# or
./import.sh target/bookmarks_from_chrome.html target/chrome chrome
```

### Multi Import (merge)
```sh
./import.sh delicious,chrome target/both target/delicious.html target/bookmarks_from_chrome.html
```

## Chrome export to file
1. Press ```Ctrl+Shift+O``` to go to Bookmarks Manager
2. Click the Organize menu > Export bookmarks to HTML file
