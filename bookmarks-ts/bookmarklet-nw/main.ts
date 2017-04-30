declare function require(path: string): any;
declare var global

let rpc_host: string = global['rpc_host'],
    port = rpc_host.substring(rpc_host.lastIndexOf(':') + 1),
    ns = require('node-static'),
    www_redirect = global['www_redirect'],
    fileServer = new ns.Server(global['www_dir'])

function handleRedirect(req, res) {
    if (req.url === '/') {
        res.writeHead(302, { 'Location': www_redirect })
        res.end()
    } else {
        fileServer.serve(req, res)
    }
}

require('http').createServer(www_redirect ? handleRedirect : fileServer.serve.bind(fileServer)).listen(parseInt(port, 10) + 1)
