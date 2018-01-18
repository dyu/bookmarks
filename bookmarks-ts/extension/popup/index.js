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

/* initialise variables */
var accessToken, currentTab, currentPojo, currentTags, currentTagIdRemove = 0
var inputToken = document.querySelector('input.accesstoken')
var inputUrl = document.querySelector('.new-bkm input.url')
var inputTitle = document.querySelector('.new-bkm input.title')
var inputBody = document.querySelector('.new-bkm textarea')
var noteContainer = document.querySelector('.note-container')
var addBtn = document.querySelector('.add')
var tagsContainer = document.querySelector('.tags')
var msgDiv = document.querySelector('.msg')
var msgClose = msgDiv.firstElementChild
var msgBody = msgDiv.lastElementChild

/*  add event listeners to buttons */

addBtn.addEventListener('click', addBookmark)
tagsContainer.addEventListener('click', rmTag)
msgClose.addEventListener('click', function() {
    msgDiv.className = 'msg hide'
})
inputToken.addEventListener('change', function(e) {
    browser.storage.local.set({
        access_token: { value: e.target.value }
    }).then(initialize)
})

/* generic error handler */
function onError(error) {
    console.log(error);
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

function checkUnique$$S(data) {
    var array = data['1']
    if (!array || !array.length) {
        inputTitle.value = currentTab.title
        return
    }
    
    var pojo = array[0]
    var tags = pojo['28']
    currentPojo = pojo
    currentTags = tags
    inputTitle.value = pojo['6']
    
    if (!tags || !tags.length) return
    
    for (var i = 0; i < tags.length; i++) {
        var tag = tags[i]
        var li = document.createElement('li')
        var a = createEl('a', 'innerHTML', 
                '<button type="button" class="b" data-id="' + tag['5'] + '">x</button>' + tag['3'])
        li.appendChild(a)
        tagsContainer.appendChild(li)
    }
}

function checkUnique$$F(err) {
    msgBody.innerText = extractMsg(err)
    msgDiv.className = 'msg error'
}

function checkUnique(tabs) {
    var tab = tabs[0]
    currentTab = tab
    inputUrl.value = tab.url
    // show
    inputUrl.parentElement.className = 'new-bkm'
    
    $post('https://api.dyuproject.com/bookmarks/user/qBookmarkEntry0Url?access_token=' + accessToken,
        JSON.stringify(newPS(tab.url))).then(checkUnique$$S).then(undefined, checkUnique$$F)
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

function addBookmark() {
    
}

function rmTag(e) {
    var el = e.target
    if (el.tagName !== 'BUTTON') return
    
    currentTagIdRemove = parseInt(el.dataset.id, 10)
    // TODO remove tag
    /*var tags = currentTags
    for (var i = 0; i < tags.length; i++) {
        if (id === tags[i]['5']) {
            tags.splice(i, 1)
            tagsContainer.removeChild(tagsContainer.children[i])
            break
        }
    }*/
}
