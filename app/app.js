require([
  '$api/models'
], function(models) {
  'use strict';
  console.log('models', models);

  var playlist = models.Playlist.fromURI('spotify:user:possan:starred');
  console.log('playlist', playlist);
  playlist.load('tracks').done(function() {
  	console.log('tracks loaded.');
  	playlist.tracks.snapshot().done(function(t2) {
  	  var promises = [];
	  var all = [];
 	  console.log('t2', t2.toArray());
 	  t2.toArray().forEach(function(t) {
 	  	var p = new models.Promise();
 	  	promises.push(p);
 	 	console.log(t);
 	 	t.load('artists', 'availability').done(function() {
	 	  t.album.load('name', 'availability').done(function(a) {
	 	    p.setDone({
	 	      track: t.uri,
	 	      artist: t.artists[0].name,
	 	  	  albumName: a.name,
	 	  	  albumUri: a.uri,
	 	      available:
	 	      	t.availability == 'premium' &&
	 	      	a.availability == 'premium' /*,
 	      	  t_availability: t.availability,
    	      a_availability: a.availability */
 	 	      });
 	      });
 	   	});
 	  });
 	  var allresults = models.Promise.join(promises).done(function(lst) {
 	  	lst = lst.filter(function(x) {
 	  		return x.available;
 	  	});
      var lst2 = [];
      var previousalbums = [];
      lst.forEach(function(item) {
        if (previousalbums.indexOf(item.albumUri) == -1) {
          previousalbums.push(item.albumUri);
          lst2.push(item);
        }
      });
 	  	lst = lst2.slice(0, 500);
	  	console.log('all results', lst);
 	    console.log(JSON.stringify(lst, null, 2));
 	  });
  	})
  });

  // http://127.0.0.1:10001/

  var onRendererEvent = function(e) {
    console.log('event from app', e);
    if (e.type == 'play' && e.track) {
      console.log('play track', e.track);
      models.player.playTrack(models.Track.fromURI(e.track));
    }
  }

  var pollRendererQueue = function() {
    // console.log('poll...');
    $.ajax({
      type: 'GET',
      url: 'http://localhost:10000',
      success: function(r) {
        r = JSON.parse(r);
        if (r.length > 0) {
          // console.log(r);
          for (var i=0; i<r.length; i++) {
            onRendererEvent(r[i]);
          }
        }
        setTimeout(function() {
          pollRendererQueue();
        }, 150);
      }
    });
  }

  pollRendererQueue();


});
