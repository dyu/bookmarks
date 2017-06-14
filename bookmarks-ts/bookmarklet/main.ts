declare function require(path: string): any;

function resolveRpcHost(host: string) {
    let colon = host.lastIndexOf(':'),
        rpc_port = parseInt(host.substring(colon + 1), 10) - 1
    
    return 'http://' + host.substring(0, colon + 1) + rpc_port
}

let rpc_host = window['rpc_host']
if (!rpc_host)
    window['rpc_host'] = resolveRpcHost(window.location.host)

import * as Vue from 'vue'

let app = require('./App.vue')

let run
window['run'] = run = function(config) {
    app.config(config)
    new Vue(app).$mount('#app')
}

let config = window['run_config']
config && run(config)
