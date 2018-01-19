var alphabet = '0123456789abcdefghijklmnopqrstuv'

function encodeB32(str, padding) {
    var bits = 0
    var value = 0
    var output = ''

    for (var i = 0, l = str.length; i < l; i++) {
        value = (value << 8) | str.charCodeAt(i)
        bits += 8

        while (bits >= 5) {
            output += alphabet[(value >>> (bits - 5)) & 31]
            bits -= 5
        }
    }

    if (bits > 0) {
        output += alphabet[(value << (5 - bits)) & 31]
    }

    if (padding) {
        while (0 !== (output.length % 8)) output += '='
    }
    
    return output
}

function createTab(tabs) {
    var t = tabs[0]
    browser.tabs.create({ url: '/popup/index.html#' + encodeB32(t.url) + '~' + encodeB32(t.title) })
}

function queryTab() {
    browser.tabs.query({ active: true, currentWindow: true }, createTab)
}

// browser_action (can not be set in manifest due to fennec incompatibility)
if (-1 !== navigator.userAgent.toLowerCase().indexOf('android')) {
    browser.browserAction.onClicked.addListener(queryTab)
} else {
    browser.browserAction.setPopup({ popup: '/popup/index.html' })
}
