# Impact Atmospheric System Plugin

A plugin for the [Impact game engine](http://impactjs.com) that simulates an atmospheric weather system, day/night cycles and seasonal cycles based on configurable date, time, and geographical coordinates.


## Features

* General
    * Configurable time speed multiplier to cycle through day and night faster or slower
    * Configurable update rate to update plugin more or less frequently
    * Configurable initial plugin date and time
    * Configurable geographical coordinates
    * Configurable brightness/darkness of nights (for those who like brighter/darker nights)
* Day/Night Cycle System
    * Variable length of day and night based on day of year and geographical coordinates
    * Dynamic ambient brightness during sunrise and sunset
* Seasonal Cycle System
    * Variable solstice (Summer/Estival, Winter/Hibernal) and equinox (Spring/Vernal, Autumn/Autumnal) based on year
    * Current season detection based on current date and time relative to year
* Weather System
    * Weather conditions (clear, rain, snow, lightning, fog)
    * Configurable maximum particles (snow particles, raindrops)
    * Configurable frequency of lightning


## Demonstration

Visit [http://chessmasterhong.bitbucket.org/projects/impact-atmosphere](http://chessmasterhong.bitbucket.org/projects/impact-atmosphere) for a working live demonstration of the plugin. *The version of the demo at this link may not reflect the latest changes of the plugin.*

If you would rather set it up yourself, located in the `demo` directory is a pre-configured setup of the plugin. I also use this as my development testing grounds, so it should be up-to-date. All you need is the Impact game engine source code (sorry, batteries not included).


## Installation and Setup

1. Download and place the file `atmosphere.js` in your `lib/plugins/` directory.

2. Add `'plugins.atmosphere'` to the `.requires( ... )` section of your main game.

3. In the `init` method of your main game, add **one** (and only one) of the following:

    a. To use **all default** settings:

        // Start from current date and time, updating every 60 seconds, running at 1x real time
        this.atmosphere = new ig.Atmosphere();

    b. To specify a custom **date and time**, but leave the other arguments to default:

        // Start from April 14, 2014 5:23:37 PM, updating every 60 seconds, running at 1x real time
        this.atmosphere = new ig.Atmosphere(new Date(2014, 3, 14, 17, 23, 37));

    c. To specify a custom **date and time** and **update rate**, but leave the other arguments to default:

        // Start from April 14, 2014 5:23:37 PM, updating every 15 seconds, running at 1x real time
        this.atmosphere = new ig.Atmosphere(new Date(2014, 3, 14, 17, 23, 37), 15);

    d. To specify a custom **date and time**, **update rate**, and **timescale**:

        // Start from April 14, 2014 5:23:37 PM, updating every 15 seconds, running at 6x real time
        this.atmosphere = new ig.Atmosphere(new Date(2014, 3, 14, 17, 23, 37), 15, 6);

4. In the `update` method of your main game, add the following:

        this.atmosphere.update();

5. In the `draw` method of your main game, add the following:

        this.atmosphere.draw();

6. That's it! Start up your game and enjoy!

If you are still unclear about the usage, see the [`main.js`](demo/lib/game/main.js) file in the `demo/lib/game/` directory for additional details.


## Bugs and Known Issues

See the [Issue Tracker](https://github.com/chessmasterhong/impact-atmosphere/issues?labels=bug&page=1&state=open) for a list of current bugs and issues.


## TODO

See the [Issue Tracker](https://github.com/chessmasterhong/impact-atmosphere/issues?labels=enhancement&page=1&state=open) for a potential list of stuff to do.


## Credits

### Based on

* [http://aa.quae.nl/en/antwoorden/seizoenen.html](http://aa.quae.nl/en/antwoorden/seizoenen.html)
* [http://aa.quae.nl/en/reken/juliaansedag.html](http://aa.quae.nl/en/reken/juliaansedag.html)
* [http://aa.quae.nl/en/reken/zonpositie.html](http://aa.quae.nl/en/reken/zonpositie.html)
* [http://aa.usno.navy.mil/data/docs/JulianDate.php](http://aa.usno.navy.mil/data/docs/JulianDate.php)
* [http://calendars.wikia.com/wiki/Julian_day_number](http://calendars.wikia.com/wiki/Julian_day_number)
* [http://users.electromagnetic.net/bu/astro/sunrise-set.php](http://users.electromagnetic.net/bu/astro/sunrise-set.php)
* [http://www.esrl.noaa.gov/gmd/grad/solcalc](http://www.esrl.noaa.gov/gmd/grad/solcalc)
* [http://planetpixelemporium.com/tutorialpages/light.html](http://planetpixelemporium.com/tutorialpages/light.html)
* [http://digital-lighting.150m.com/ch04lev1sec1.html](http://digital-lighting.150m.com/ch04lev1sec1.html)

### Additional resources

* [2D Lost Garden Zelda Style Tiles](http://opengameart.org/content/2d-lost-garden-zelda-style-tiles-resized-to-32x32-with-additions) by Daniel Cook, Jetrel, Saphy, Zabin, and Bertram
* [Snow Emitter](https://github.com/ansimuz/snow-emitter) by ansimuz (for the base code that this plugin's snow and rain generator is based on)
* [JavaScript port](http://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html) of Ken Perlin's [Java implementation](http://cs.nyu.edu/~perlin/noise) of Perlin noise by Kas Thomas


## Disclaimer

I would like to emphasize that although this plugin utilizes computations from various creditable sources, its implementation is rather naive and has not been thoroughly tested for accuracy or validity. In addition, it may potentially contain computational inconsistencies or errors. The original purpose and intent was to *roughly* simulate a realistic atmospheric system for a potential game. As a result, I strongly discourage the use of this plugin for sensitive projects or research. Instead, please consult more creditable, well-tested sources for such purposes.


## Licence

The plugin's source code is released under the [MIT Licence](LICENCE).

This plugin requires the [Impact game engine](http://impactjs.com). The game
engine is under the terms of a separate [commercial licence](http://impactjs.com/impact-commercial-software-license-agreement)
and is not provided with the plugin.

All artworks are available under their own separate licences. For their
licencing details, visit the respective link under the Additional Resources
section of the README.

