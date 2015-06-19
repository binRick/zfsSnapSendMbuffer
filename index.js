#!/usr/bin/env node
 //var mv = require('multiview')();
var    os = require('os'),
    fs = require('fs'),
    trim = require('trim'),
    child_process = require('child_process'),
    _ = require('underscore'),
    pj = require('prettyjson'),
    Client = require('ssh2').Client,
    c = require('chalk'),
    program = require('commander');

program.version('0.0.1')
    .option('-d, --debug', 'Debug Mode')
    .option('-t, --table', 'Draw Result Table')
    .option('-l, --limit [limit]', 'Display Limit')
    .parse(process.argv);

var HandleMbufferStdErr = function(str) {
    str = trim(str.toString('utf8'));
    if (str.split('Address already in use') > 0) {
        console.log(c.green.bgWhite('Address is in use on remote'));
    }
    var aP = str.split(' ').filter(function(s) {
        return s.length > 0;
    });
    var updateObject = {
        inRate: aP[2] + ' ' + aP[3],
        outRate: aP[6] + ' ' + aP[7],
        total: aP[8] + ' ' + aP[9],
        bufferPercentageFull: aP[12],
    };
    //    console.log(c.green.bgWhite(str));
    //    console.log(pj.render(updateObject));
};

var server = 'beta';
var callback = function(e, s) {
    if (e) throw e;
    //    console.log(s);
};

var zfsRecvFlags = '-vF';
var zfsDest = 'tank/sRick/1';

var RemotePort = 9092;
var Snap = 'tank/Rick@zfs-auto-snap-2015-06-17-1820';
var sArray = ['zfs', 'send', Snap];
var mArray = ['mbuffer', '-s', '128k', '-m', '512M', '-O', server + ':' + RemotePort];

var Commands = {
    Local1: 'zfs send tank/Rick@zfs-auto-snap-2015-06-17-1820 | mbuffer -s 128k -m 1G -O beta:9092',
    Local: String('zfs send tank/Rick@zfs-auto-snap-2015-06-17-1820').split(' '),
    Remote: 'mbuffer -s 128k -m 512M -I ' + RemotePort + ' | zfs recv ' + zfsRecvFlags + ' ' + zfsDest,
};
if (program.debug) {
    console.log(Commands.Local.split(' ').slice(1));
    console.log(pj.render(Commands));
    process.exit();
}
var conn = new Client();
var start = new Date().getTime();
console.log(c.red('waiting for ssh'));
conn.on('ready', function() {
    var data = '';
    console.log(c.yellow('ready'));
    setTimeout(function() {
        console.log(c.green('launching'));
        var mbufferSend = child_process.spawn('mbuffer', ['-s', '128k', '-m', '512M', '-O', server + ':' + RemotePort]);
        var zfsSend = child_process.spawn('zfs', ['send','-v', 'tank/Rick@zfs-auto-snap-2015-06-17-1820']);
        zfsSend.stdout.pipe(mbufferSend.stdin);

        var H = function(s) {
            s = s.toString('utf8');
            console.log(c.red.bgWhite(s));
        };
        //        zfsSend.stderr.on('data',H);
        mbufferSend.stderr.on('data', H);
        mbufferSend.on('error', function(e) {
            console.log('error', e);
        });
        zfsSend.on('error', function(e) {
            console.log('error', e);
        });
        zfsSend.on('close', function(e) {
            //            console.log('zfs send process exited with code', c.green(e));
            // mvstream.exit(e);
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

    }, 1000);
    conn.exec(Commands.Remote, function(err, stream) {
        if (err) throw err;
        //var remoteStream = mv.stream('Renote Mbuffer send on '+server);
        //stream.pipe(remoteStream);
        stream.on('data', function(data) {
            data = data.toString('utf8');
            console.log(c.red.bgBlack(data));
        });
        stream.on('close', function(code, signal) {
            conn.end();
        }).on('data', function(data) {
            data = trim(data.toString());
            //                                if (typeof(Command.process) == 'function')
            //                                    data = Command.process(data);
            callback(null, {
                server: server,
                started: start,
                millisecs: new Date().getTime() - start,
                ts: new Date().getTime(),
                data: data,
            });
        }).stderr.on('data', HandleMbufferStdErr);
    });
}).connect({
    host: server,
    port: 22,
    username: 'root',
    privateKey: require('fs').readFileSync('/root/.ssh/id_rsa')
});
//});
