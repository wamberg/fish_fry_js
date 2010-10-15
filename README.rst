Fish Fry IRC bot
================

Brought to you by node.js.

local_settings.js
-----------------

All configuration is done in a file outside of the git repository.  Your file should look like this:

    var settings = exports;

    settings.irc_options = {
      server: 'irc.freenode.net',
      nick: 'new_fish',
      channels: ['#new_fish_test']
    };

    settings.valhalla_options = {
      host: 'your-site.domain',
      user: '<basic auth username>',
      pass: '<basic auth password>',

    };

settings.twitter_options = {
  consumer_key: '<dev.twitter.com creds>',
  consumer_secret: '<dev.twitter.com creds>',
  access_key: '<dev.twitter.com creds>',
  access_secret: '<dev.twitter.com creds>',
  request_token_url: 'https://api.twitter.com/oauth/request_token',
  access_token_url: 'https://api.twitter.com/oauth/access_token',
  status_update_url: 'http://api.twitter.com/1/statuses/update.json'
};

Features
--------

* Posts deeds to valhalla server
* Posts messages that start with 'twitter:' to Twitter
* In-chat programmable responses for example:
  * respond: .* weather .*^^http://www.spaceneedle.com/view/webcam.html

To-do:
------

* Event countdown
  * event_set: <name> <time>
    * sets an event
  * event: <name> 
    * reports on event <name>
