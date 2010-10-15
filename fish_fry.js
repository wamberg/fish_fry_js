// node imports
var fs = require('fs');
var path = require('path');
var http = require('http');
var sys = require('sys');
var querystring = require('querystring');

// third-party imports
var base64 = require('./base64');
var irc = require('./node-irc/lib/irc');

// local imports
try {
  var settings = require('./local_settings');
} catch (no_settings) {
  throw new Error('See the README and define local_settings.js');
}

var trim = function(str) {
  return str.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, "");
};

var client = new irc.Client(settings.irc_options.server,
    settings.irc_options.nick,
    {channels: settings.irc_options.channels});

if (settings.valhalla_options) {
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
}

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

// post messages to twitter on command
if (settings.twitter_options) {
  var OAuth= require('./node-oauth/lib/oauth').OAuth;

  var oa= new OAuth(settings.twitter_options.request_token_url,
      settings.twitter_options.access_token_url,
      settings.twitter_options.consumer_key,
      settings.twitter_options.consumer_secret,
      "1.0a",
      null,
      "HMAC-SHA1");

  client.addListener('message', function(from, to, message) {
    var twitter_match = message.match("^twitter:\(.*\)");
    if (twitter_match) {
      oa.post(settings.twitter_options.status_update_url,
          settings.twitter_options.access_key, 
          settings.twitter_options.access_secret,
          {"status": trim(twitter_match[1])},
          function(error, data) {
            if(error) console.log(require('sys').inspect(error))
          });
    }
  });
}

////////////////////////
// respond to commands
////////////////////////

var responses = [];
// load responses
path.exists('./responses.json', function(exists) {
    if (exists) {
      // imports
      var Script = process.binding('evals').Script;

      fs.readFile('./responses.json', function(err, data) {
        if (err) throw err;
        responses = Script.runInNewContext(data);
        console.log(sys.inspect(responses));
      });
    }
});

// add message listener
client.addListener('message', function(from, to, message) {
  var respond_match = message.match("^respond:\s*\(.*\)");
  if (respond_match) {
    var command_response = respond_match[1].split('^^');
    if (command_response.length == 2) {
      responses.push([trim(command_response[0]), trim(command_response[1])]);
      fs.writeFile('./responses.json', JSON.stringify(responses));
    } else {
      client.say(to, from + ': doin it wrong, invalid command');
    }
  }
});

client.addListener('message', function(from, to, message) {
    for (var i = 0; i < responses.length; i++) {
      if (message.match(responses[i][0])) {
        client.say(to, responses[i][1]);
      }
    }
});

//////////////////////////
// end respond to commands
//////////////////////////
