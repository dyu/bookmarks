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
var config_default = {
    get$$: get$$,
    post$$: post$$
};
window['rpc_config_d'] = config_default;
var config = window['rpc_config'] || config_default;
var prefix = window['rpc_host'] || '';
function get$$(location, opts) {
    return $get(!prefix ? location : prefix + location, opts);
}
function post$$(location, data) {
    return $post(!prefix ? location : prefix + location, data);
}
function post(location, data) {
    return config.post$$(location, data);
}
function get(location, opts) {
    return config.get$$(location, opts);
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
var accessToken, currentTab, currentPojo, currentTags, currentTagIdRemove = 0
var newUrl = false
var newTags = []
var inputToken = document.querySelector('input.accesstoken')
var inputUrl = document.querySelector('.new-bkm input.url')
var inputTitle = document.querySelector('.new-bkm input.title')
var inputBody = document.querySelector('.new-bkm textarea')
var inputTag = document.querySelector('.new-bkm input.tag')
var suggestTags = document.querySelector('.new-bkm .suggest-tags')
var noteContainer = document.querySelector('.note-container')
var addBtn = document.querySelector('.add')
var tagsContainer = document.querySelector('.tags')
var msgDiv = document.querySelector('.msg')
var msgClose = msgDiv.firstElementChild
var msgBody = msgDiv.lastElementChild

/*  add event listeners to buttons */

addBtn.addEventListener('click', addBookmark)
tagsContainer.addEventListener('click', rmTag)
msgClose.addEventListener('click', hideError)
inputTitle.addEventListener('change', changeTitle)
inputBody.addEventListener('change', changeNotes)
inputToken.addEventListener('change', function(e) {
    browser.storage.local.set({
        access_token: { value: e.target.value }
    }).then(reinitialize)
})
inputTag.addEventListener('keypress', debounce(addTag, 500))
suggestTags.addEventListener('click', selectTag)

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

initialize();

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
    var array = data['1']
    if (!array || !array.length) {
        newUrl = true
        inputTitle.value = currentTab.title
        return
    }
    
    var pojo = array[0]
    var tags = pojo['28']
    currentPojo = pojo
    currentTags = tags
    inputTitle.value = pojo['6']
    
    if (!tags || !tags.length) return
    
    var buf = '', tag
    for (var i = 0; i < tags.length; i++) {
        tag = tags[i]
        buf += '<li>' + createTagA(tag['5'], tag['3']) + '</li>'
    }
    
    tagsContainer.innerHTML = buf
}

function checkUnique$$F(err) {
    showError(extractMsg(err))
}

function checkUnique(tabs) {
    var tab = tabs[0]
    currentTab = tab
    inputUrl.value = tab.url
    // show
    inputUrl.parentElement.className = 'new-bkm'
    
    $post('https://api.dyuproject.com/bookmarks/user/qBookmarkEntry0Url?access_token=' + accessToken,
        JSON.stringify(newPS(tab.url)))
        .then(checkUnique$$S).then(undefined, checkUnique$$F)
}

function queryTab() {
    browser.tabs.query({ active: true, currentWindow: true }, checkUnique)
}

function tokenFound(result) {
    //inputBody.value = JSON.stringify(token)
    if (!result || !result.access_token) return
    
    inputToken.title = 'Access Token'
    inputToken.value = accessToken = result.access_token.value
    queryTab()
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

function changeTitle(e) {
    if (newUrl) return
    
}

function changeNotes(e) {
    if (newUrl) return
}

function rmTag(e) {
    var el = e.target
    if (el.tagName !== 'BUTTON') return
    
    var id = parseInt(el.dataset.id, 10)
    if (!newUrl) {
        // TODO
        currentTagIdRemove = id
        return
    }
    
    var tags = newTags
    for (var i = 0; i < tags.length; i++) {
        if (id === tags[i]['5']) {
            tags.splice(i, 1)
            tagsContainer.removeChild(tagsContainer.children[i])
            disable(inputTag, false)
            break
        }
    }
}

function insertTagTo(tags, id, text) {
    var i = 0, tag, tid
    for (; i < tags.length; i++) {
        tag = tags[i]
        tid = tag['5']
        if (tid === id) return
        if (tid > id) {
            tags.splice(i, 0, {"3": text, "5": id})
            insertBeforeTagTo(tagsContainer, i, id, text)
            return
        }
    }
    
    tags.push({"3": text, "5": id})
    appendTagTo(tagsContainer, id, text)
}

function selectTag(e) {
    if (newUrl && newTags.length === 4) return
    
    inputTag.value = ''
    
    var el = e.target
    if (el.tagName !== 'B') {
        if (el.tagName === 'BUTTON') {
            suggestTags.innerHTML = ''
            inputTag.focus()
        }
        return
    }
    
    var id = parseInt(el.dataset.id, 10)
    var text = el.textContent
    
    if (!newUrl) {
        // TODO
    } else if (newTags.length) {
        insertTagTo(newTags, id, text)
        newTags.length === 4 && disable(inputTag, true)
    } else {
        newTags.push({"3": text, "5": id})
        appendTagTo(tagsContainer, id, text)
        newTags.length === 4 && disable(inputTag, true)
    }
    
    inputTag.focus()
}

function suggest$$S(data) {
    var array = data['1']
    if (!array || !array.length) {
        suggestTags.innerHTML = ''
        return
    }
    
    var buf = ''
    for (var i = 0; i < array.length; i++) {
        var tag = array[i]
        buf += '<b data-id="' + tag['5'] + '">'
        buf += tag['3']
        buf += '</b>'
    }
    
    buf += '<button type="button" class="b" data-id="0">x</button>'
    suggestTags.innerHTML = buf
}

function suggest$$F(err) {
    showError(extractMsg(err))
}

function addTag(e) {
    var val = e.target.value
    if (!val) {
        suggestTags.innerHTML = ''
        return
    }
    
    $post('https://api.dyuproject.com/bookmarks/user/fBookmarkTag0Name?access_token=' + accessToken,
        JSON.stringify({"1": val, "4": {"1": false, "2": SUGGEST_TAGS_LIMIT}}))
        .then(suggest$$S).then(undefined, suggest$$F)
}

function addBookmark$$S(data) {
    newUrl = false
    showSuccess('Successful.')
}

function addBookmark$$F(err) {
    showError(extractMsg(err))
}

function addBookmark() {
    var notes = inputBody.value || null
    var tags = newTags
    if (tags.length) {
        tags = tags.map(mapId)
    } else {
        tags = null
    }
    $post('https://api.dyuproject.com/bookmarks/user/BookmarkEntry/create?access_token=' + accessToken,
        JSON.stringify({"1": { "3": inputUrl.value, "6": inputTitle.value, "7": notes }, "2": tags }))
        .then(addBookmark$$S).then(undefined, addBookmark$$F)
}

