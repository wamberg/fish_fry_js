var sys = require('sys');
var http = require('http');
var querystring = require('querystring');
var irc = require('./node-irc/lib/irc');
var base64 = require('./base64');
try {
  var settings = require('./local_settings');
} catch (no_settings) {
  throw new Error('See the README and define local_settings.js');
}

var client = new irc.Client(settings.irc_options.server,
    settings.irc_options.nick,
    {channels: settings.irc_options.channels});

// Log messages to a valhalla server
client.addListener('message', function(from, to, message) {
  var deeds = http.createClient(80, settings.valhalla_options.host);
  var headers = {'host': settings.valhalla_options.host};
  if(settings.valhalla_options.http_basic_auth){
    headers['Authorization'] = 'Basic ' 
      + base64.encode(settings.valhalla_options.user + ':' 
      + settings.valhalla_options.pass);
  }
  var body = querystring.stringify({'deed': 
    {'speaker': from, 'performed_at': (new Date()).toString(),
    'text': message}});
  headers['Content-Length'] = body.length;
  var request = deeds.request('POST', '/deeds.json', headers);
  request.write(body);
  request.end();
});

// Check to see if a link posted in IRC is from Reddit
client.addListener('message', function(from, to, message) {
  var urlRegex = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/g;
  var match = urlRegex.exec(message);
  if (match !== null) {
    var reddit = http.createClient(80, 'www.reddit.com');
    var request = reddit.request('GET', '/', {'host': 'www.reddit.com'});
    request.addListener('response', function (response) { if(response.statusCode != 200){
        client.say(to,
          from + ': How did you find that link when reddit is down?');
      }else{
        var page = '';
        response.setEncoding('utf8');
        response.addListener('data', function (chunk) {
          page += chunk;
        });
        response.addListener('end', function(){
          if(page.indexOf(match[0]) > -1){
            client.say(to, from + ': thanks jackass we all read reddit.');
          }else{
            client.say(to, from + ': cool link, bro');
          }
        });
      }
    });
    request.end();
  }
});
