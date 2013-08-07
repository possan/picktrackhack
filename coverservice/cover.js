var http = require('http');
var qs = require('querystring');
var fs = require('fs');
var request = require("request");


function download(url, dest, cb) {
  console.log('Download '+url+' to '+dest+' ...');
  var file = fs.createWriteStream(dest);
  var request = http.get(url, function(response) {
    response.pipe(file);
    file.on('finish', function() {
      file.close();
      cb();
    });
  });
}

var port = 8001;

function findCoverUrl(albumid, callback) {
  // https://open.spotify.com/album/4l5EAHpTc0S2X1gMPsMerE
  var url1 = 'https://open.spotify.com/album/' + albumid;
  console.log('fetch', url1);
  request({
    uri: url1
  }, function(error, response, body) {
    console.log(body);
    var re = new RegExp("\<img\ src=\"([^\"]+)\".+\ id=\"big-cover\"\/\>");
    var m = re.exec(body);
    if (m) {
      callback(m[1]);
    } else {
      callback('');
    }
  });
}

function send_404(response) {
  response.writeHead(404, {
    'Content-Type': 'image/jpeg',
    'Access-Control-Allow-Methods': 'GET',
    'Access-Control-Allow-Origin': '*'
  });
  response.end('Not found.');
}

function send_file(cachefile, response) {
  if (fs.existsSync(cachefile)) {
    var stat = fs.statSync(cachefile);
    response.writeHead(200, {
      'Content-Type' : 'image/jpeg',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Origin': '*',
      'Content-Length': stat.size
    });
    fs.createReadStream(cachefile).pipe(response);
  } else {
    send_404(response);
  }
}

http.createServer(function (req, res) {
  if (req.method == 'GET') {
    var re1 = new RegExp('/album/([^.$]+)');
    var m1 = re1.exec(req.url);
    if (m1) {
      var albumid = m1[1];
      console.log('Fetch album id '+albumid);

      var cachefile = 'cache/'+albumid+'.jpg';

      if (fs.existsSync(cachefile)) {
        send_file(cachefile, res);
        return;
      }

      findCoverUrl(albumid, function(imageurl) {
        console.log('found cover url', imageurl);
        if (imageurl) {
          download(imageurl, cachefile, function() {
            send_file(cachefile, res);
          });
        } else {
          send_404(res);
        }
      });
    } else {
      send_404(res);
    }
  }
}).listen(port, '127.0.0.1');

console.log('Spotify cover hack service running!');
console.log();
console.log('Example:');
console.log('  http://127.0.0.1:'+port+'/album/4l5EAHpTc0S2X1gMPsMerE');
console.log('  http://127.0.0.1:'+port+'/album/2TVzGGiNCrkuIJpZHBRpP9');
