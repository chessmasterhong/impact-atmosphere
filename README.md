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
* Weather System (add-on)
    * Weather conditions (clear, rain, snow, fog)
    * Configurable maximum particles (snow particles, raindrops)


## Basic Usage

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


## Demonstration

Located in the `demo` directory is a pre-configured setup of the plugin. I also use this as my development testing grounds, so it should be up-to-date. All you need is the Impact game engine source code (sorry, batteries not included).

To see a working live demonstration of the plugin, visit: [http://chessmasterhong.bitbucket.org/projects/impact-atmosphere](http://chessmasterhong.bitbucket.org/projects/impact-atmosphere). *The version of the demo at this link may not reflect the latest changes of the plugin.*


## Configuration

*For reference, the values listed below are the plugin's default values.*

* To configure the plugin's current date and time:

    *Must be a JavaScript Date object. Attempts to convert into Date object if not.*

        this.atmosphere.datetime = new Date;    // Start plugin from current date and time

* To configure the time in seconds the plugin should update at:

  *Must be a positive number (integer or floating point number). Attempts to convert to positive number if not.*

      this.atmosphere.updateUpdateRate(60);    // Update plugin every 60 seconds

* To configure the time speed multiplier the plugin should run at:

  *Must be a positive number (integer or floating point number). Attempts to convert to positive number if not.*

      this.atmosphere.timescale = 1;    // 1 second plugin time = 1 second real time

* To configure the geographical coordinates the plugin should use in its computations:

  *Must be a number (integer or floating point number).*

  *Latitude : North = positive, South = negative*

  *Longitude: East  = positive, West  = negative*

      this.atmosphere.geo_coords.latitude = 40.7789;      // 40.7789 degrees North
      this.atmosphere.geo_coords.longitude = -73.9675;    // 73.9675 degrees West

* To configure the "brightness" of nights:

  *Must be a positive number (integer or floating point number) between 0 and 1 (both inclusive).*

  *Greater numbers, results in darker nights. Exactly zero (0) yields no change compared to day brightness, whereas exactly one (1) yields pitch black.*

      this.atmosphere.brightness_night = 0.65;

* To configure current weather condition:

  *Must be a positive integer.*

  *0 = clear, 1 = rain, 2 = snow, 3 = fog*

      this.atmosphere.condition = 0;    // Clear weather condition

* To configure maximum particle count for weather conditions:

  *Must be a positive integer.*

  *Currently, the term "particles" refer only to raindrops or snow pieces.*

      this.atmosphere.particles.max = 100;    // Maximum of 100 particles will be generated before stopping


## Bugs and Known Issues

* General
    * Plugin may not have correct calculations for other time zones. Current calculations assume Eastern Standard Time (UTC-0500) and Eastern Daylight Time (UTC-0400).
    * Plugin breaks (fails in its computations) when the latitude becomes too large (as it approaches the North and South Poles, specifically around the Arctic and Antarctic Circles).
* Day/Night Cycle System
    * *(none at the moment)*
* Seasonal Cycle System
    * *(none at the moment)*
* Weather System
    * Current method of generating fog is *very* slow and is considered experimental.


## TODO

* General
    * Fix calculations and add support for arbitrary timezones.
    * Fix calculations and add support for arbitrary latitudes.
* Day/Night Cycle System
    * Compute sunrise and sunset duration based on season and geographical coordinates.
    * Improve accuracy of ambient brightness and colors during sunrise and sunset. Current calculations assume linear brightness relative to sunrise/sunset duration. (Maybe consider looking at [Rayleigh scattering](http://en.wikipedia.org/wiki/Rayleigh_scattering) and [Mie scattering](http://en.wikipedia.org/wiki/Mie_scattering)?).
* Seasonal Cycle System
    * Account for polar days and polar nights as latitude approaches North and South Poles.
* Weather System
    * Additional weather conditions (hail, sleet, cloudy, lightning).
    * Improve method to generate fog faster.


## Credits

### Based on

* [http://aa.quae.nl/en/antwoorden/seizoenen.html](http://aa.quae.nl/en/antwoorden/seizoenen.html)
* [http://aa.quae.nl/en/reken/juliaansedag.html](http://aa.quae.nl/en/reken/juliaansedag.html)
* [http://aa.quae.nl/en/reken/zonpositie.html](http://aa.quae.nl/en/reken/zonpositie.html)
* [http://aa.usno.navy.mil/data/docs/JulianDate.php](http://aa.usno.navy.mil/data/docs/JulianDate.php)
* [http://calendars.wikia.com/wiki/Julian_day_number](http://calendars.wikia.com/wiki/Julian_day_number)
* [http://users.electromagnetic.net/bu/astro/sunrise-set.php](http://users.electromagnetic.net/bu/astro/sunrise-set.php)
* [http://www.esrl.noaa.gov/gmd/grad/solcalc](http://www.esrl.noaa.gov/gmd/grad/solcalc)

### Additional resources

* [2D Lost Garden Zelda Style Tiles](http://opengameart.org/content/2d-lost-garden-zelda-style-tiles-resized-to-32x32-with-additions) by Daniel Cook, Jetrel, Saphy, Zabin, and Bertram
* [Snow Emitter](https://github.com/ansimuz/snow-emitter) by ansimuz (for the base code that this plugin's snow and rain generator is based on)
* [JavaScript port](http://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html) of Ken Perlin's [Java implementation](http://cs.nyu.edu/~perlin/noise) of Perlin noise by Kas Thomas


## Disclaimer

I would like to emphasize that although this plugin utilizes computations from various creditable sources, its implementation is rather naive and has not been thoroughly tested for accuracy or validity. In addition, it may potentially contain computational inconsistencies or errors. The original purpose and intent was to *roughly* simulate a realistic atmospheric system for a potential game. As a result, I strongly discourage the use of this plugin for sensitive projects or research. Instead, please consult more creditable, well-tested sources for such purposes.

