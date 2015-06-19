var trim = require('trim'),
    trim = require('trim'),
    express = require('express'),
    child_process = require('child_process'),
    _ = require('underscore'),
    pj = require('prettyjson'),
    Client = require('ssh2').Client,
    c = require('chalk'),
    bodyParser = require('body-parser'),
    C = console.log;
LocalPort = '9092',
    destFS = 'tank/sRick/1',
    dFSp = 'tank/Snapshots/';

var stringParser = function(str) {
    return trim(str.toString('utf8'));
};

var server = require('http').createServer();
var io = require('socket.io')(server);
io.on('connection', function(socket) {
    socket.on('disconnect', function() {
        C(c.red.bgWhite('disconnection'));
    });
    socket.on('connect', function() {
        C(c.red.bgBlack('Connected!'));
    });
    socket.on('Snapshot', function(req, cb) {
        C(c.red.bgBlack('Snapshot Request!'));
        var dFS = dFSp + req.Node + '/' + req.Filesystem;
        var msg = 'Receiving filesystem from ' + req.Node + ' to ' + dFS + ' on port ' + req.Port;
        var resp = {
            Request: req,
            destinationFS: dFS,
            Port: req.Port,
            msg: msg,
        };
        C(pj.render(resp));
        cb(null, resp);

        resp.mbufferRecv = {
            stdout: [],
            stderr: [],
            exitCode: null,
            error: null
        };
        resp.zfsRecv = {
            stdout: [],
            stderr: [],
            exitCode: null,
            error: null
        };
        var mbufferRecv = child_process.spawn('mbuffer', ['-s', '128k', '-m', '512M', '-I', req.Port]);
        var zfsRecv = child_process.spawn('zfs', ['recv', '-vF', dFS]);
        mbufferRecv.stdout.pipe(zfsRecv.stdin);
        zfsRecv.stderr.on('data', function(data) {
            resp.zfsRecv.stderr.push(stringParser(data));
            socket.emit('update', resp);
            console.log(c.red.bgWhite(stringParser(data)));
        });
        zfsRecv.stdout.on('data', function(data) {
            resp.zfsRecv.stdout.push(stringParser(data));
            socket.emit('update', resp);
            console.log(c.green.bgWhite(stringParser(data)));
        });
        mbufferRecv.stderr.on('data', function(data) {
            resp.mbufferRecv.stderr.push(stringParser(data));
            socket.emit('update', resp);
            console.log(c.red.bgWhite(stringParser(data)));
        });
        zfsRecv.on('close', function(e) {
            resp.zfsRecv.exitCode = e;
            socket.emit('update', resp);
            console.log('zfs recv process exited with code', c.green(e));
        });
        zfsRecv.on('error', function(e) {
            resp.zfsRecv.error = e;
            socket.emit('update', resp);
            console.log(c.red('zfs recv err', e));
        });

        mbufferRecv.on('error', function(e) {
            resp.mbufferRecv.error = e;
            socket.emit('update', resp);
            console.log('mbuf recv error', e);
        });
        mbufferRecv.on('close', function(e) {
            resp.mbufferRecv.exitCode = e;
            socket.emit('update', resp);
            console.log('mbuf recv close', e);
        });
    });
});
server.listen(process.env.PORT || 29992, process.env.HOST || '127.0.0.1', function() {
    C(c.blue.bgWhite('Listening!'));

});
//});
/*
app.listen(process.env.PORT || 29992, process.env.HOST || '127.0.0.1', function() {
    C(c.green.bgWhite('launching server'));
});*/