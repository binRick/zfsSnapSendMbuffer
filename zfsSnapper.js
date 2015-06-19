#!/usr/bin/env node

var trim = require('trim'),
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
    .option('-s, --server', 'Server')
    .option('-c, --client', 'Client')
    .parse(process.argv);



if (program.server)
    require('./Server')(program);
else
    require('./Client')(program);
