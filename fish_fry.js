var jerk = require('./lib/Jerk/lib/jerk');

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

}).connect(options);
