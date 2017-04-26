declare function require(path: string): any;
declare var global

let rpc_host: string = global['rpc_host'],
    port = rpc_host.substring(rpc_host.lastIndexOf(':') + 1),
    ns = require('node-static'),
    fileServer = new ns.Server('.')

require('http').createServer((req, res) => fileServer.serve(req, res)).listen(parseInt(port, 10) + 1)
