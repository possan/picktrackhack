var http = require('http');
var qs = require('querystring');
var fs = require('fs');
var request = require("request");


function download(url, dest, cb) {
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      cb();
    });
  });
}

function download_and_cache(url, dest, cb) {
  download(url, dest, cb);
}

var port = 8001;

function findCoverUrl(albumid, callback) {
  // https://open.spotify.com/album/4l5EAHpTc0S2X1gMPsMerE
  var url1 = 'https://open.spotify.com/album/' + albumid;
  console.log('fetch', url1);

  request({
    uri: url1
  }, function(error, response, body) {
    // console.log(body);
    var re = new RegExp("\<img\ src=\"([^\"]+)\".+\ id=\"big-cover\"\/\>");
    var m = re.exec(body);
    // console.log(m);
    if (m) {
      callback(m[1]);
    } else {
      callback('');
    }
  });
}

http.createServer(function (req, res) {
  if (req.method == 'GET') {
    var re1 = new RegExp('/album/(.*)');
    var m1 = re1.exec(req.url);
    if (m1) {
      var albumid = m1[1];
      console.log('Fetch album id '+albumid);
      findCoverUrl(albumid, function(imageurl) {
        if (imageurl) {
          res.writeHead(200, {
            'Content-Type': 'image/jpeg',
            'Access-Control-Allow-Methods': 'GET',
            'Access-Control-Allow-Origin': '*'
          });
          var request = http.get(imageurl, function(response) {
            response.on('data', function (data) {
                res.write(data);
            });
            response.on('end', function() {
                res.end();
            });
          });
        } else {
          res.writeHead(404);
          res.end('Not found.');
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not found.');
    }
  }
}).listen(port, '127.0.0.1');

console.log('Spotify cover hack service running!');
console.log();
console.log('Example:');
console.log('  http://127.0.0.1:'+port+'/album/4l5EAHpTc0S2X1gMPsMerE');
console.log('  http://127.0.0.1:'+port+'/album/2TVzGGiNCrkuIJpZHBRpP9');
