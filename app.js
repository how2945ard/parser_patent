var express = require('express');
var http = require('http');
var path = require('path');
var parser = require('./parser');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var _ = require('lodash');
var Promise = require('bluebird');
Promise.onPossiblyUnhandledRejection(function(error) {
  throw error;
});

exports.server = function() {
  var app = express();

  app.set('port', 3000);

  var connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'dcard'
  });

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.post('/', function(req, res) {
    var insertOne = function(num) {
      return new Promise(function(resolve, reject) {
        connection.query('INSERT INTO `Temp_link`(`serial_number`) VALUES (' + num + ')', function(err, rows, fields) {
          if (err) {
            return reject(err);
          }
          return resolve(num);
        });
      });
    };
    var term = req.body.term;
    return parser(term)
      .then(function(result) {
        PromiseArray = _.map(result, function(element) {
          return insertOne(element);
        });
        return Promise.all(PromiseArray);
      })
      .then(function(results) {
        return res.json(results);
      });
  });

  var server = http
    .createServer(app)
    .listen(app.get('port'), function() {
      connection.connect();
      console.log('Express server listening on port ' + app.get('port'));
    });

  process.on('exit', function() {
    connection.end();
  });
};