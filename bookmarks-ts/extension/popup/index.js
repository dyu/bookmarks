(function() {

function checkStatus(res) {
    var status = res.status;
    if (status < 200 || status > 299)
        throw status;
    return res.text();
}
function handler(raw) {
    var first = raw.charAt(0), len = raw.length, end = raw.charAt(len - 1) === '\n' ? len - 2 : len, data;
    if (first === '+') {
        data = JSON.parse(raw.substring(1, end));
        if (data[0])
            throw data;
        return data.length === 2 ? data[1] : data;
    }
    if (first !== '-')
        throw new Error('Malformed response.');
    if (raw.charAt(1) !== '[')
        throw new Error(raw.substring(1, end));
    throw JSON.parse(raw.substring(1, end));
}
function $get(location, opts) {
    return fetch(location, opts).then(checkStatus).then(handler);
}
function $post(location, data) {
    return fetch(location, { method: 'POST', body: data }).then(checkStatus).then(handler);
}
function noop() {}
function extractMsg(data) {
    return Array.isArray(data) ? data[1]['1'] : String(data);
}

function debounce(cb, interval, immediate) {
  var timeout;

  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) cb.apply(context, args);
    };          

    var callNow = immediate && !timeout;

    clearTimeout(timeout);
    timeout = setTimeout(later, interval);

    if (callNow) cb.apply(context, args);
  };
};

function mapId(tag) {
    return tag['5']
}

var SUGGEST_TAGS_LIMIT = 10

/* initialise variables */
var hash = window.location.hash
var accessToken, loading = false
var currentTitle, currentPojo, currentTags, currentTagTextAdd = '' ,currentTagIdAdd = 0, currentTagIdRemove = 0
var newUrl = false, newTags = []
var inputToken = document.querySelector('input.accesstoken')
var inputUrl = document.querySelector('.new-bkm input.url')
var inputTitle = document.querySelector('.new-bkm input.title')
var inputBody = document.querySelector('.new-bkm textarea')
var inputTag = document.querySelector('.new-bkm input.tag')
var suggestTagContainer = document.querySelector('.new-bkm .suggest-tags')
var addBtn = document.querySelector('.add')
var tagContainer = document.querySelector('.tags')
var msgDiv = document.querySelector('.msg')
var msgClose = msgDiv.firstElementChild
var msgBody = msgDiv.lastElementChild

/*  add event listeners to buttons */

addBtn.addEventListener('click', addBookmark)
tagContainer.addEventListener('click', rmTag)
msgClose.addEventListener('click', hideError)
inputTitle.addEventListener('change', changeTitle)
inputBody.addEventListener('change', changeNotes)
inputToken.addEventListener('change', function(e) {
    browser.storage.local.set({
        access_token: { value: e.target.value }
    }).then(reinitialize)
})
inputTag.addEventListener('keypress', debounce(suggestTag, 500))
suggestTagContainer.addEventListener('click', selectTag)

/* generic error handler */
function onError(error) {
    console.log(error);
}

function hideError() {
    msgDiv.className = 'msg hide'
    msgBody.textContent = ''
}

function showError(msg) {
    msgBody.textContent = msg
    msgDiv.className = 'msg error'
}

function showSuccess(msg) {
    msgBody.textContent = msg
    msgDiv.className = 'msg'
}

function onFailure(err) {
    loading = false
    showError(extractMsg(err))
}

function newPS(url) {
    return {
        "1": url,
        "4": {"1": false, "2": 1}
    }
}

function createEl(tag, key, val) {
    var el = document.createElement(tag)
    el[key] = val
    return el
}

function createTagA(id, text) {
    return '<a><button type="button" class="b" data-id="' + id + '">x</button>' + text + '</a>'
}

function insertBeforeTagTo(el, idx, id, text) {
    el.insertBefore(createEl('li', 'innerHTML', createTagA(id, text)), el.children[idx])
}

function appendTagTo(el, id, text) {
    el.appendChild(createEl('li', 'innerHTML', createTagA(id, text)))
}

function checkUnique$$S(data) {
    loading = false
    
    var array = data['1']
    if (!array || !array.length) {
        addBtn.className = 'add'
        newUrl = true
        inputTitle.value = currentTitle
        inputTag.focus()
        return
    }
    
    var pojo = array[0]
    var tags = pojo['28']
    currentPojo = pojo
    currentTags = tags
    inputTitle.value = pojo['6']
    inputBody.value = pojo['7']
    
    if (!tags || !tags.length) return
    
    var buf = '', tag
    for (var i = 0; i < tags.length; i++) {
        tag = tags[i]
        buf += '<li>' + createTagA(tag['5'], tag['3']) + '</li>'
    }
    
    tagContainer.innerHTML = buf
    tags.length !== 4 && inputTag.focus()
}

function checkUnique(url, title) {
    currentTitle = title
    inputUrl.value = url
    // show
    inputUrl.parentElement.className = 'new-bkm'
    
    loading = true
    $post('https://api.dyuproject.com/bookmarks/user/qBookmarkEntry0Url?access_token=' + accessToken,
        JSON.stringify(newPS(url)))
        .then(checkUnique$$S).then(undefined, onFailure)
}

function recvTabs(tabs) {
    var tab = tabs[0]
    checkUnique(tab.url, tab.title)
}

function queryTab() {
    browser.tabs.query({ active: true, currentWindow: true }, recvTabs)
}

function focusToken() {
    inputToken.focus()
}

function tokenFound(result) {
    //inputBody.value = JSON.stringify(token)
    if (!result || !result.access_token) {
        window.setTimeout(focusToken, 500)
        return
    }
    
    inputToken.title = 'Access Token'
    inputToken.value = accessToken = result.access_token.value
    
    if (!hash) {
        queryTab()
        return
    }
    
    var parts = hash.split('~')
    checkUnique(decodeB32(parts[0]), decodeB32(parts[1]))
}

function initialize() {
    browser.storage.local.get('access_token').then(tokenFound).then(undefined, noop)
}

function reinitialize() {
    hideError()
    initialize()
}

function disable(el, disabled) {
    el.disabled = disabled
}

function updateField(fk, val) {
    loading = true
    $post('https://api.dyuproject.com/bookmarks/user/BookmarkEntry/update?access_token=' + accessToken,
        JSON.stringify({"1": currentPojo['1'], "2":{"3": [{"1":parseInt(fk, 10), 2:currentPojo[fk], 3:val}]}}))
        .then(function(data) {
            loading = false
            currentPojo[fk] = val
            showSuccess('Updated.')
        }).then(undefined, onFailure)
}

function changeField(e, fk) {
    var val = e.target.value.trim()
    val !== currentPojo[fk] && updateField(fk, val)
}

function changeTitle(e) {
    !newUrl && !loading && changeField(e, '6')
}

function changeNotes(e) {
    !newUrl && !loading && changeField(e, '7')
}

function rmTagId$$S(data) {
    loading = false
    
    var tags = currentTags, id = currentTagIdRemove
    for (var i = 0; i < tags.length; i++) {
        if (id === tags[i]['5']) {
            tags.splice(i, 1)
            tagContainer.removeChild(tagContainer.children[i])
            disable(inputTag, false)
            break
        }
    }
}

function rmTagId(id) {
    loading = true
    currentTagIdRemove = id
    
    $post('https://api.dyuproject.com/bookmarks/user/BookmarkEntry/updateTag?access_token=' + accessToken,
        JSON.stringify({"1": currentPojo['1'], "2": id, "3": true}))
        .then(rmTagId$$S).then(undefined, onFailure)
}

function rmTag(e) {
    var el = e.target
    if (el.tagName !== 'BUTTON') return
    
    var id = parseInt(el.dataset.id, 10)
    if (!newUrl) {
        !loading && rmTagId(id)
        return
    }
    
    var tags = newTags
    for (var i = 0; i < tags.length; i++) {
        if (id === tags[i]['5']) {
            tags.splice(i, 1)
            tagContainer.removeChild(tagContainer.children[i])
            disable(inputTag, false)
            break
        }
    }
}

function insertTagId$$S(data) {
    loading = false
    
    insertTagTo(currentTags, currentTagIdAdd, currentTagTextAdd)
}

function insertTagId(id, text) {
    loading = true
    currentTagIdAdd = id
    currentTagTextAdd = text
    $post('https://api.dyuproject.com/bookmarks/user/BookmarkEntry/updateTag?access_token=' + accessToken,
        JSON.stringify({"1": currentPojo['1'], "2": id, "3": false}))
        .then(insertTagId$$S).then(undefined, onFailure)
}

function insertTagTo(tags, id, text) {
    var i = 0, tag, tid
    for (; i < tags.length; i++) {
        tag = tags[i]
        tid = tag['5']
        if (tid === id) return
        if (tid > id) {
            tags.splice(i, 0, {"3": text, "5": id})
            insertBeforeTagTo(tagContainer, i, id, text)
            return
        }
    }
    
    tags.push({"3": text, "5": id})
    appendTagTo(tagContainer, id, text)
}

function selectTag(e) {
    var el = e.target
    if (el.tagName === 'BUTTON') {
        suggestTagContainer.innerHTML = ''
        inputTag.value = ''
        inputTag.focus()
        return
    }
    
    if (!newUrl) {
        if (loading || currentTags.length === 4) return
    } else if (newTags.length === 4) {
        return
    }
    
    if (el.tagName !== 'B') {
        return
    }
    
    var id = parseInt(el.dataset.id, 10)
    var text = el.textContent
    
    if (!newUrl) {
        insertTagId(id, text)
    } else if (newTags.length) {
        insertTagTo(newTags, id, text)
        newTags.length === 4 && disable(inputTag, true)
    } else {
        newTags.push({"3": text, "5": id})
        appendTagTo(tagContainer, id, text)
        newTags.length === 4 && disable(inputTag, true)
    }
    
    inputTag.value = ''
    !hash && inputTag.focus()
}

function suggest$$S(data) {
    loading = false
    
    var array = data['1']
    if (!array || !array.length) {
        suggestTagContainer.innerHTML = ''
        return
    }
    
    var buf = ''
    buf += '<button type="button" class="b" data-id="0">x</button>'
    
    for (var i = 0; i < array.length; i++) {
        var tag = array[i]
        buf += '<b data-id="' + tag['5'] + '">'
        buf += tag['3']
        buf += '</b>'
    }
    
    suggestTagContainer.innerHTML = buf
}

function suggestTag(e) {
    if (loading) return
    
    var val = e.target.value
    if (!val) {
        suggestTagContainer.innerHTML = ''
        return
    }
    
    loading = true
    $post('https://api.dyuproject.com/bookmarks/user/fBookmarkTag0Name?access_token=' + accessToken,
        JSON.stringify({"1": val, "4": {"1": false, "2": SUGGEST_TAGS_LIMIT}}))
        .then(suggest$$S).then(undefined, onFailure)
}

function addBookmark$$S(data) {
    loading = false
    newUrl = false
    showSuccess('Successful.')
}

function addBookmark() {
    if (loading) return
    
    var notes = inputBody.value || null
    var tags = newTags
    if (tags.length) {
        tags = tags.map(mapId)
    } else {
        tags = null
    }
    loading = true
    $post('https://api.dyuproject.com/bookmarks/user/BookmarkEntry/create?access_token=' + accessToken,
        JSON.stringify({"1": { "3": inputUrl.value, "6": inputTitle.value, "7": notes }, "2": tags }))
        .then(addBookmark$$S).then(undefined, onFailure)
}

/*document.body.addEventListener('keyup', function(e) {
    if (e.which === 27) {
        e.preventDefault()
        e.stopPropagation()
    }
})
*/

var alphabet = '0123456789abcdefghijklmnopqrstuv'
var table = {}

function decodeB32(str) {
    var skip = 0, byt = 0, buf = ''
    for (var i = 0; i < str.length; i++) {
        var val = table[str[i].toLowerCase()]
        if (val === undefined) continue
        
        val <<= 3 // move to the high bits
        byt |= val >>> skip
        skip += 5
        if (skip >= 8) {
            // we have enough to preduce output
            buf += String.fromCharCode(byt)
            skip -= 8
            if (skip > 0) byt = (val << (5 - skip)) & 255
            else byt = 0
        }
    }
    
    if (skip < 0) {
        buf += alphabet[bits >> 3]
    }
    
    return buf
}

// Invert 'alphabet'
for (var i = 0; i < alphabet.length; i++) {
    table[alphabet[i]] = i
}

if (hash) {
    document.documentElement.className = 'fennec'
}

/*if (hash) {
    var parts = hash.split('~')
    inputBody.value = decodeB32(parts[0]) + '\n' + decodeB32(parts[1])
}*/
initialize()

})();
