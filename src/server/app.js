/*jshint node:true*/
'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var port = process.env.PORT || 3007;
var https = require('self-signed-https')

var environment = process.env.NODE_ENV;

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(logger('dev'));
console.log('About to crank up node');
console.log('PORT=' + port);
console.log('NODE_ENV=' + environment);

switch (environment){
    case 'dist':
        console.log('** DIST **');
        app.use(express.static('./dist/'));
        app.use('/*', express.static('./dist/index.html'));
                app.get('/[^\.]+$', function(req, res){
            res.sendfile('index.html', { root: './dist/'});
        });
        app.post('/', function(req, res){
            res.sendFile('index.html', { root: './dist/'});
        });
        break;
    default:
        console.log('** DEV **');
        app.use(express.static('./src/client/'));
        app.use(express.static('./'));
        app.use('/*', express.static('./src/client/index.html'));
        app.get('/[^\.]+$', function(req, res){
            res.sendfile('index.html', { root: './src/client/'});
        });
        app.post('/', function(req, res){
            res.sendFile('index.html', { root: './src/client/'});
        });
        break;
}

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
    console.log('env = ' + app.get('env') +
    '\n__dirname = ' + __dirname  +
    '\nprocess.cwd = ' + process.cwd());
});

https(app).listen(3010, '0.0.0.0')
