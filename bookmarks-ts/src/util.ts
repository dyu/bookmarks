import { ToProgress } from 'coreds-ui/lib/progress'
import { utcToLocal } from 'coreds/lib/util'
import { prettyDate, toYMD } from 'coreds/lib/datetime_util'

export const CONFIG = window['app_config'] || {},
    TARGET = CONFIG['target'] || 'app'

export const filters = {
    prettydate: value => !value ? '' : prettyDate(value),
    ymd: value => !value ? '' : toYMD(new Date(utcToLocal(value)), '/')
}

export function getUserAlias(): string {
    var access_info = CONFIG['access_info']
    return access_info && access_info['2']['3'] || ''
}

export function getUserName(): string {
    var auth_data = CONFIG['auth_data']
    return auth_data && auth_data['info']['name'] || '' 
}

// ================================================== 
// override

const tp = new ToProgress({
    color: '#0080FF'
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
    return host === 'localhost' || host === '127.0.0.1' || 0 === host.indexOf('192.168.1.')
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
if (!rpc_host && 0 === window.location.port.indexOf('80') && isLocal(window.location.hostname))
    window['rpc_host'] = 'http://127.0.0.1:5010'
