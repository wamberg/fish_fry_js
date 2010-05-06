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
