#!/usr/bin/env node

var socket = require('socket.io-client')('http://localhost:29992');
c = require('chalk'),
    pj = require('prettyjson'),
    C = console.log;



socket.on('connect', function() {

    C(c.red.bgWhite('Connected'));
    socket.emit('Snapshot', {
        Filesystem: 'tank/Rick',
        Node: 'intrepid',
Port: 9095,
    }, function(e, r) {
        if (e) throw e;
        C(c.red.bgWhite(JSON.stringify(r)));
        //        C(pj.render(r));
 //       process.exit();
    });
});
socket.on('update', function(data) {
    C(c.yellow.bgWhite('Update'));
    C(data);
});
socket.on('disconnect', function() {
    C(c.blue.bgWhite('Discoonnected'));
});
