declare function require(path: string): any;

function isLocal(host: string) {
    return host === 'localhost' || host === '127.0.0.1' || 0 === host.indexOf('192.168.1.')
}

let rpc_host = window['rpc_host']
if (!rpc_host && 0 === window.location.port.indexOf('80') && isLocal(window.location.hostname))
    window['rpc_host'] = 'http://127.0.0.1:5010'

import { setNextTick } from 'coreds/lib/util'
import * as Vue from 'vue'

setNextTick(Vue.nextTick)

let app = require('./App.vue')

let run
window['run'] = run = function(config) {
    app.config(config)
    new Vue(app).$mount('#app')
}

let config = window['run_config']
config && run(config)
