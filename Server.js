var trim = require('trim'),
    child_process = require('child_process'),
    _ = require('underscore'),
    pj = require('prettyjson'),
    Client = require('ssh2').Client,
    c = require('chalk'),
    C = console.log;

var LocalPort = '9092';
var destFS = 'tank/sRick/1';


module.exports = function(program) {
    C(c.green.bgWhite('launching server'));
    var mbufferRecv = child_process.spawn('mbuffer', ['-s', '128k', '-m', '512M', '-I', LocalPort]);
    var zfsRecv = child_process.spawn('zfs', ['recv', '-vF', destFS]);
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



};
