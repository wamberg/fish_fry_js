var sys = require('sys');
var http = require('http');
var querystring = require('querystring');
var jerk = require('./lib/Jerk/lib/jerk');
try {
  var settings = require('./local_settings');
} catch (no_settings) {
  throw new Error('See the README and define local_settings.js');
}

jerk(function(j) {
  j.watch_for('',function(message) {
    // TODO should whitelist names. didn't bother to look how this is done in old fish_fry
    var deeds = http.createClient(80, settings.valhalla_options.host);
    var request = deeds.request('POST', '/deeds.json', {'host': settings.valhalla_options.host});
    var body = querystring.stringify({'deed': {'speaker': message.user, 'performed_at': (new Date()).toString(), 'text': message.text.join(' ')}});
    request.write(body);
    request.end();
  });

  var urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g;
  j.watch_for(urlRegex, function(message){
    var reddit = http.createClient(80, 'www.reddit.com');
    var request = reddit.request('GET', '/', {'host': 'www.reddit.com'});
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
