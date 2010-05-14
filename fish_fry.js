// node libraries
var http = require('http');
var sys = require('sys');
var querystring = require('querystring');

// third-party libraries
var jerk = require('./lib/Jerk/lib/jerk');
var base64 = require('./lib/base64');
try {
  var settings = require('./local_settings');
} catch (no_settings) {
  throw new Error('See the README and define local_settings.js');
}

// runtime configuration
var fish_fry = {debug: false};

process.argv.forEach(function (val, index, array) {
  if (val.toLowerCase() === 'debug') {
    fish_fry.debug = true
  }
});

jerk(function(j) {
  j.watch_for('',function(message) {
    // TODO should whitelist names
    // didn't bother to look how this is done in old fish_fry
    var deeds = http.createClient(80, settings.valhalla_options.host);
    var headers = {'host': settings.valhalla_options.host};
    if(settings.valhalla_options.http_basic_auth){
      headers['Authorization'] = 'Basic ' 
        + base64.encode(settings.valhalla_options.user + ':' 
        + settings.valhalla_options.pass);
    }
    var body = querystring.stringify(
      {'deed': {
        'speaker': message.user,
        'performed_at': (new Date()).toString(),
        'text': message.text.join(' ')}});
    headers['Content-Length'] = body.length;
    var request = deeds.request('POST', '/deeds.json', headers);
    if (fish_fry.debug) {
      sys.debug('DEED REQUEST:' + sys.inspect(request));
      request.addListener('response', function (response) {
        sys.debug('DEED RESPONSE STATUS: ' + response.statusCode);
        sys.debug('DEED RESPONSE HEADERS: ' + JSON.stringify(
            response.headers));
        response.setEncoding('utf8');
        response.addListener('data', function (chunk) {
          sys.debug('DEED RESPONSE BODY: ' + chunk);
        });
      });
    }
    request.write(body);
    request.end();
  });

  var urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g;
  j.watch_for(urlRegex, function(message){
    var reddit = http.createClient(80, 'www.reddit.com');
    var request = reddit.request('GET', '/', {'host': 'www.reddit.com'});
    if (fish_fry.debug) {
      sys.debug('STORPHA REQUEST:' + sys.inspect(request));
      request.addListener('response', function (response) {
        sys.debug('STORPHA RESPONSE STATUS: ' + response.statusCode);
        sys.debug('STORPHA RESPONSE HEADERS: ' + JSON.stringify(
            response.headers));
        response.setEncoding('utf8');
        response.addListener('data', function (chunk) {
          sys.debug('STORPHA RESPONSE BODY: ' + chunk);
        });
      });
    }
    request.addListener('response', function (response) {
      if(response.statusCode != 200){
        message.say(message.user + ': How did you find that link when reddit is down?');
      }else{
        var page = '';
        response.setEncoding('utf8');
        response.addListener('data', function (chunk) {
          page += chunk;
        });
        response.addListener('end', function(){
          if(page.indexOf(message.match_data[0]) > -1){
            message.say(message.user + ': thanks jackass we all read reddit.');
          }else{
            message.say(message.user + ': cool link, bro');
          }
        });
      }
    });
    request.end();
  });
 

}).connect(settings.irc_options);
