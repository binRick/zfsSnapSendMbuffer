var trim = require('trim'),
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
        setInterval(function() {
            socket.emit('update', resp);
        }, 1000);

        var mbufferRecv = child_process.spawn('mbuffer', ['-s', '128k', '-m', '512M', '-I', req.port]);
        var zfsRecv = child_process.spawn('zfs', ['recv', '-vF', dFS]);
        mbufferRecv.stdout.pipe(zfsRecv.stdin);
        zfsRecv.stderr.on('data', function(data) {
            console.log(c.red.bgWhite(data.toString("utf8")));
        });
        zfsRecv.stdout.on('data', function(data) {
            console.log(c.green.bgWhite(data.toString("utf8")));
        });
        mbufferRecv.stderr.on('data', function(data) {
            console.log(c.red.bgWhite(data.toString("utf8")));
        });
        zfsRecv.on('close', function(e) {
            console.log('zfs recv process exited with code', c.green(e));
        });
        zfsRecv.on('error', function(e) {
            console.log(c.red('zfs recv err', e));
        });

        mbufferRecv.on('error', function(e) {
            console.log('mbuf recv error', e);
        });
        mbufferRecv.on('close', function(e) {
            console.log('mbuf recv close', e);
        });
    });
});
server.listen(process.env.PORT || 29992, process.env.HOST || '127.0.0.1');
//});
/*
app.listen(process.env.PORT || 29992, process.env.HOST || '127.0.0.1', function() {
    C(c.green.bgWhite('launching server'));
});*/