var sys = require('sys');
var http = require('http');
var querystring = require('querystring');
var jerk = require('./lib/Jerk/lib/jerk');
var base64 = require('./lib/base64');

var valhalla_host = 'valhalla.robotrockstar.com'
var valhalla_port = 80;
var http_auth = null;
//var http_basic_auth = ['user', 'password'];

var options =
{ server: 'irc.freenode.net',
  nick: 'new_fish',
  channels: ['#rinacrew.en']
};

jerk(function(j) {
  j.watch_for('soup', function(message) {
    message.say(message.user + ': soup is good food!');
  });

  j.watch_for(/^(.+) are silly$/, function(message) {
    message.say(message.user + ': ' + message.match_data[1] + ' are NOT SILLY.');
  });

  j.watch_for('',function(message) {
    // TODO should whitelist names. didn't bother to look how this is done in old fish_fry
    var deeds = http.createClient(valhalla_port, valhalla_host);
    var headers = {'host': valhalla_host};
    if(http_basic_auth){
      headers['Authorization'] = 'Basic ' + base64.encode(http_basic_auth[0] + ':' + http_basic_auth[1]);
    }
    var request = deeds.request('POST', '/deeds.json', headers);
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
 

}).connect(options);
