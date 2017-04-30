var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    os = require('os'),
    win32 = os.platform() === 'win32',
    //argv = argv = process.argv.slice(2),
    //bookmarkletOnly = argv.length > 0 && argv[0] === 'b',
    start_str = 'jni rpc: ',
    pdb_started = false,
    hide_backup = false,
    linux_bins = [
        '/opt/chromium/chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome'
    ],
    chromium_bin,
    pdb,
    //wnd,
    rpc_port,
    rpc_host

function println(str) {
    process.stdout.write(str + '\n')
}

function getChildArgs(initial_args, extra_args, child_cwd) {
    return initial_args.concat(extra_args, [
        '-Djava.class.path=' + path.join(child_cwd, 'bookmarks-all/target/bookmarks-all-jarjar.jar'),
        'bookmarks.all.Main',
        child_cwd
    ])
}

function isDir(dir) {
    return fs.statSync(dir).isDirectory()
}

function findSubDir(baseDir, subDirPrefix) {
    var dirs = fs.readdirSync(baseDir), dir, f
    for (var i = 0, len = dirs.length; i < len; i++) {
        if (isDir(dir=path.join(baseDir, f=dirs[i])) && 0 === f.indexOf(subDirPrefix))
            return dir
    }
    return null
}

function startProtostuffdb() {
    var child_cwd = path.join(__dirname, '..'),
        bin = path.join(child_cwd, 'target/protostuffdb'),
        port = fs.readFileSync(path.join(child_cwd, 'PORT.txt'), 'utf8').trim(),
        raw_args = fs.readFileSync(path.join(child_cwd, 'ARGS.txt'), 'utf8').trim(),
        extra_args = raw_args.split(' '),
        child_args = getChildArgs([port, path.join(__dirname, 'g/user/UserServices.json')], extra_args, child_cwd),
        target_cwd,
        p

    hide_backup = raw_args.indexOf('-Dprotostuffdb.with_backup=true') === -1
    if (!win32) {
        target_cwd = child_cwd
    } else if (isDir(target_cwd = 'C:/Program Files/Java/jdk1.7.0_79/jre/bin/server')) {
        bin += '.exe'
    } else if (fs.existsSync(p = path.join(child_cwd, 'JDK_DIR.txt'))) {
        if (!isDir(target_cwd = path.join(fs.readFileSync(p, 'utf8').trim(), 'jre/bin/server'))) {
            println('JDK_DIR.txt did not contain a valid jdk path.')
            process.exit(1)
            return
        }
        bin += '.exe'
    } else if (!isDir('C:/Program Files/Java') ||
            !(p = findSubDir('C:/Program Files/Java', 'jdk1.7')) ||
            !isDir(target_cwd = path.join(p, 'jre/bin/server'))) {
        println('Please create JDK_DIR.txt in the root dir of the project that contains the full path to your jdk.')
        println('E.g.\nC:/path/to/jdk1.7.0_79')
        process.exit(1)
        return
    } else {
        bin += '.exe'
    }

    pdb = spawn(bin, child_args, { cwd: target_cwd })
    pdb.stdout.on('data', onChildOut)
    pdb.on('close', onChildClose)
    rpc_port = parseInt(port, 10)
    rpc_host = 'http://127.0.0.1:' + port
}

function isStart(data) {
    return data.length > start_str.length && start_str === String(data.slice(0, start_str.length))
}

function onChildOut(data) {
    if (pdb_started || !isStart(data))
        return
    pdb_started = true
    openWindow()
}

function onChildClose(code) {
    if (code)
        println('child process exited with code ' + code)
    
    process.exit(0)
    pdb = undefined
}

function onChromiumExit() {
    if (pdb)
        pdb.kill()
    
    process.exit(0)
}

function resolveBin(p, c) {
    return p ? p : (fs.existsSync(c) && c)
}

function openWindow() {
    global.rpc_host = rpc_host
    global.hide_backup = hide_backup

    require('./dist/bookmarklet-nw')
    
    spawn(chromium_bin, ['--app=http://127.0.0.1:' + (rpc_port + 1), '--disk-cache-size 0', '--no-proxy-server'])
        .on('exit', onChromiumExit)
        .stderr.pipe(process.stderr)
}

if (win32) {
    chromium_bin = 'google-chrome'
} else if (!(chromium_bin = linux_bins.reduce(resolveBin, null))) {
    println('chromium bin not found.')
    return
}

startProtostuffdb()

