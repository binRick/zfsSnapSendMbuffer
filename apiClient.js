#!/usr/bin/env node

var child_process = require('child_process'),
    socket = require('socket.io-client')('http://localhost:29992');
c = require('chalk'),
    pj = require('prettyjson'),
    C = console.log;

var RemotePort = 9095,
    mBufHost = 'localhost',
    RemoteHost = 'intrepid',
    zfsFSSnap = 'tank/Rick@123123';



socket.on('connect', function() {

    C(c.red.bgWhite('Connected'));
    socket.emit('Snapshot', {
        Filesystem: 'tank/Rick',
        Node: RemoteHost,
        Port: RemotePort,
    }, function(e, r) {
        if (e) throw e;
        C(c.red.bgWhite(JSON.stringify(r)));
        C(c.yellow.bgBlack('launching'));
        setTimeout(function() {
            C(c.green.bgBlack('launching'));
            var mbufferSend = child_process.spawn('mbuffer', ['-s', '128k', '-m', '512M', '-O', mBufHost + ':' + RemotePort]);
            var zfsSend = child_process.spawn('zfs', ['send', zfsFSSnap]);
            zfsSend.stdout.pipe(mbufferSend.stdin);
            zfsSend.stderr.on('data', function(data) {
                console.log(c.red.bgBlack(data.toString("utf8")));
            });
            mbufferSend.stdout.on('data', function(data) {
                console.log(c.green.bgBlack(data.toString("utf8")));
            });
            mbufferSend.stderr.on('data', function(data) {
                console.log(c.red.bgBlack(data.toString("utf8")));
            });
            zfsSend.on('close', function(e) {
                console.log('zfs send process exited with code', c.green(e));
            });
            zfsSend.on('error', function(e) {
                console.log(c.red('zfs send err', e));
            });


            mbufferSend.on('error', function(e) {
                console.log('mbuf send error', e);
            });
            mbufferSend.on('close', function(e) {
                console.log('mbuf send close', e);
            });
        }, 6000);



    });
});
socket.on('update', function(data) {
    C(c.yellow.bgWhite('Update'));
    C(pj.render(data));
    if (data.zfsRecv.exitCode != null && data.mbufferRecv.exitCode != null) {
        C(c.red.bgBlack('process complete!'));
        process.exit();
    }
});
socket.on('disconnect', function() {
    C(c.blue.bgWhite('Discoonnected'));
});
