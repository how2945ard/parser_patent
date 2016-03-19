var cheerio = require('cheerio');
var request = require('request');
var Promise = require('bluebird');
Promise.onPossiblyUnhandledRejection(function(error) {
  throw error;
});
var _ = require('lodash');
var sleep = require('sleep');
Promise.promisifyAll(request);


function getSerialNumberInAPage(pageNum, search) {
  var url = 'http://appft.uspto.gov/netacgi/nph-Parser?Sect1=PTO2&Sect2=HITOFF&u=%2Fnetahtml%2FPTO%2Fsearch-adv.html&r=0&f=S&l=50&d=PG01&s1=VR&s2=APPLE&co1=AND&Page=Next';

  function setPage(pageNum) {
    url += '&p=' + pageNum;
    return url;
  }

  function searchTerm(search) {
    url += '&OS=' + search;
    url += '&RS=' + search;
    return url;
  }

  setPage(pageNum);
  searchTerm(search);

  return request
    .getAsync(url)
    .then(function(request) {
      var body = request.body;
      var $ = cheerio.load(body);
      var total = $('body strong:nth-child(3)').text();

      var numberArray = [];
      $('body table')
        .find('tr')
        .map(function(index, row) {
          var element = $(this).find($('td:nth-child(2)')).text();
          numberArray.push(element);
        });
      return {
        numbers: _.drop(numberArray, 1),
        total: total
      };
    });
}

function getAllSerialNumer(search) {
  var serialNumbers = [];
  return getSerialNumberInAPage(1, search)
    .then(function(result) {
      var last = Math.floor(result.total / 50) + 1;
      var currentPage = 2;
      var PromiseArray = [];
      serialNumbers = serialNumbers.concat(result.numbers);
      while (currentPage <= last + 1) {
        sleep.sleep(1);
        PromiseArray.push(getSerialNumberInAPage(currentPage));
        console.log(currentPage)
        currentPage += 1;
      }
      return Promise.all(PromiseArray);
    })
    .then(function(results) {
      _.each(results, function(result) {
        serialNumbers = serialNumbers.concat(result.numbers);
      });
      return serialNumbers;
    });
}

module.exports = getAllSerialNumer;