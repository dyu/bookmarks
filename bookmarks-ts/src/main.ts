declare function require(path: string): any;

// ================================================== 
// override

const ToProgress = require('toprogress')
const tp = new ToProgress({
    color: '#0080FF',
    position: 'top'
})
function finish() {
    tp.finish()
}
let ts = 0
// only show progress bar after first successful request
function passThrough(data) {
    if (ts === 0)
        ts = Date.now()
    else
        window.setTimeout(finish, 150)
    return data
}

function isLocal(host: string) {
    let colon = host.lastIndexOf(':')
    if (colon !== -1)
        host = host.substring(0, colon)
    return host === '127.0.0.1' || host === 'localhost'
}

let rpc_config = window['rpc_config'],
    rpc_host = window['rpc_host'],
    delegate
function beforeSend() {
    if (!delegate)
        delegate = rpc_config || window['rpc_config_d']

    if (ts !== 0) {
        ts = Date.now()
        tp.show()
    }
}
let override = {
    auth$$: null,
    get$$(location, opts) {
        beforeSend()
        return delegate.get$$(location, opts).then(passThrough)
    },
    post$$(location, opts) {
        beforeSend()
        return delegate.post$$(location, opts).then(passThrough)
    }
}
window['rpc_config'] = override
if (!rpc_host && isLocal(window.location.host))
    window['rpc_host'] = 'http://127.0.0.1:5000'

// ==================================================

import * as Vue from 'vue'

import { registerDefaults } from 'vueds-ui/lib/screen_util'
import * as filters from 'vueds-ui/lib/filters'
import { new_pi } from 'vueds-ui/lib/tpl/legacy/list'

registerDefaults()

for (var i in filters) {
    Vue.filter(i, filters[i])
}

// directives
Vue.directive('append', require('vueds-ui/lib/d2/append'))
Vue.directive('appendto', require('vueds-ui/lib/d2/appendto'))
Vue.directive('defp', require('vueds-ui/lib/d2/defp'))
Vue.directive('disable', require('vueds-ui/lib/d2/disable'))
Vue.directive('pager', require('vueds-ui/lib/d2/pager'))
Vue.directive('pclass', require('vueds-ui/lib/d2/pclass'))
Vue.directive('sclass', require('vueds-ui/lib/d2/sclass'))
Vue.directive('sval', require('vueds-ui/lib/d2/sval'))
Vue.directive('itoggle', require('vueds-ui/lib/d2/itoggle'))
Vue.directive('toggle', require('vueds-ui/lib/d2/toggle'))
Vue.directive('close', require('vueds-ui/lib/d2/close'))
Vue.directive('clear', require('vueds-ui/lib/d2/clear'))
Vue.directive('suggest', require('vueds-ui/lib/d2/suggest'))
Vue.directive('dpicker', require('vueds-ui/lib/d2/dpicker'))
Vue.directive('rappendto', require('vueds-ui/lib/d2/rappendto'))
Vue.directive('rclass', require('vueds-ui/lib/d2/rclass'))
Vue.directive('lsearch', require('vueds-ui/lib/d2/lsearch'))

// components
Vue.component('pi', new_pi({}))

let app = require('./App.vue')
new Vue(app).$mount('#app')
