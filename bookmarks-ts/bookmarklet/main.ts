declare function require(path: string): any;

let host = window.location.host,
    colon = host.lastIndexOf(':'),
    rpc_port = parseInt(host.substring(colon + 1), 10) - 1

window['rpc_host'] = 'http://' + host.substring(0, colon + 1) + rpc_port

import * as Vue from 'vue'

let app = require('./App.vue')

window['run'] = function(config) {
    app.config(config)
    new Vue(app).$mount('#app')
}
