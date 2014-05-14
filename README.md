# Impact Day/Night Cycle Plugin

A plugin for the Impact game engine that simulates a day/night system based on
configurable time of day, day of year, and geographical coordinates.


## Features

* Dynamic ambient luminosity
* Variable length of day/night based on geographical coordinates
* Time scale/speed to cycle through day and night quicker or slower


## Basic Usage

1. To initialize the plugin: in your `init` method of your main game, you may add any **one** of the following:

    a. To use **all default** settings:

        this.daynight = new ig.DayNight();

    b. To specify a custom **date and time**, but leave the other arguments to default:

        this.daynight = new ig.DayNight(new Date(2014, 3, 14, 17, 23, 37));

    c. To specify a custom **date and time** and **update rate**, but leave the other arguments to default:

        this.daynight = new ig.DayNight(new Date(2014, 3, 14, 17, 23, 37), 30);

    d. To specify a custom **date and time**, **update rate**, and **timescale**:

        this.daynight = new ig.DayNight(new Date(2014, 3, 14, 17, 23, 37), 30, 2);

2. In your `update` method of your main game, add the following:


    this.daynight.update();


3. In your `draw` method of your main game, add the following:


    this.daynight.draw();


4. That's it! Start up your game and enjoy!


## Configuration

TODO


## Disclaimer

I would like to emphasize that although this plugin utilizes computations from various creditable sources, its implementation is rather naive and has not been thoroughly tested for accuracy or validity. It's original purpose and intent was to *roughly* simulate a realistic system for a potential game. As a result, I do not encourage using this plugin for sensitive projects or research.


## Credits

### Based on

* [http://aa.quae.nl/en/reken/juliaansedag.html](http://aa.quae.nl/en/reken/juliaansedag.html)
* [http://aa.quae.nl/en/reken/zonpositie.html](http://aa.quae.nl/en/reken/zonpositie.html)
* [http://aa.usno.navy.mil/data/docs/JulianDate.php](http://aa.usno.navy.mil/data/docs/JulianDate.php)
* [http://calendars.wikia.com/wiki/Julian_day_number](http://calendars.wikia.com/wiki/Julian_day_number)
* [http://users.electromagnetic.net/bu/astro/sunrise-set.php](http://users.electromagnetic.net/bu/astro/sunrise-set.php)

