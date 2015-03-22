/**
 *  @fileOverview A plugin for the Impact game engine that simulates an
 *    atmospheric weather system, day/night cycles, and seasonal cycles based
 *    on configurable date, time, and geographical coordinates.
 *  @author Kevin Chan {@link https://github.com/chessmasterhong|(chessmasterhong)}
 *  @license {@link https://github.com/chessmasterhong/impact-atmosphere/blob/master/LICENCE|MIT License}
 */


/**
 *  @namespace ig
 */
ig.module(
    'plugins.atmosphere'
)
.requires(
    'impact.game'
)
.defines(function() {
    'use strict';

    /**
     *  Starts a new atmospheric system.
     *  @class
     *  @memberof ig
     *  @extends ig.Game
     *  @param {Date}   [datetime=new Date()] Start from specified date and time
     *  @param {Number} [updateRate=60]      Real time in seconds the plugin should update itself
     *  @param {Number} [timescale=1]         Speed relative to real time at which the plugin should run
     *
     *  @example
     *  // Start plugin from current date and time, updating every 60 seconds, running at 1x real time
     *  new ig.Atmosphere();
     *  @example
     *  // Start plugin from April 14, 2014 5:23:37 PM, updating every 60 seconds, running at 1x real time
     *  new ig.Atmosphere(new Date(2014, 3, 14, 17, 23, 37));
     *  @example
     *  // Start plugin from April 14, 2014 5:23:37 PM, updating every 15 seconds, running at 1x real time
     *  new ig.Atmosphere(new Date(2014, 3, 14, 17, 23, 37), 15);
     *  @example
     *  // Start plugin from April 14, 2014 5:23:37 PM, updating every 15 seconds, running at 6x real time
     *  new ig.Atmosphere(new Date(2014, 3, 14, 17, 23, 37), 15, 6);
     */
    ig.Atmosphere = ig.Game.extend({

        /**
         *  Time speed multiplier relative to real time
         *  @name ig.Atmosphere#timescale
         *  @type {Number}
         *  @default
         *  @readonly
         *  @see Do not modify this value directly. Instead, to update the time scale, use {@link updateTimescale}.
         */
        timescale: 1,

        /**
         *  Real time in seconds before auto-updating and recalculating time
         *  @name ig.Atmosphere#updateRate
         *  @type {Number}
         *  @default
         *  @readonly
         *  @see Do not modify this value directly. Instead, to update the update rate, use {@link updateUpdateRate}.
         */
        updateRate: 60,

        /**
         *  Geographical Coordinates
         *  @typedef {Object} GeoCoordObject
         *  @property {Number} latitude  The north-south position (North = positive, South = negative)
         *  @property {Number} longitude The east-west position (East  = positive, West  = negative)
         */

        /**
         *  Geographical coordinate system
         *  @name ig.Atmosphere#geoCoords
         *  @type {GeoCoordObject}
         *  @default
         *  @readonly
         *  @see Do not modify this value directly. Instead, to update the geographical coordinates, use {@link updateGeoCoords}.
         */
        // http://ozoneaq.gsfc.nasa.gov/latlon.md
        geoCoords: {latitude: 40.7789, longitude: -73.9675},

        /**
         *  Set weather condition
         *  @name ig.Atmosphere#weatherCondition
         *  @type {Object}
         *  @property {Boolean} fog       Is fog active?
         *  @property {Boolean} lightning Is lightning active?
         *  @property {Boolean} rain      Is rain active?
         *  @property {Boolean} snow      Is snow active?
         *  @default
         *
         *  @example
         *  // Let it snow!
         *  ig.Atmosphere.weatherCondition.snow = true;
         */
        weatherCondition: {
            fog      : false,
            lightning: false,
            rain     : false,
            snow     : false
        },

        /**
         *  Probability of lightning flash per update rate
         *  <br>- Higher update rates should have higher lightning rates (increase lightning trigger chance over large time intervals)
         *  <br>- Lower update rates should have lower lightning rates (decrease lightning trigger chance over short time intervals)
         *  @name ig.Atmosphere#lightningRate
         *  @type {Number}
         *  @default
         *
         *  @example
         *  // 2.675% chance for lightning flash per update rate
         *  ig.Atmosphere.lightningRate = 0.02675;
         */
        lightningRate: 0.025,

        /**
         *  Opaqueness of the fog via modifying the alpha channel of the fog
         *  <br>- Higher values yields thicker (more opaque) fogs
         *  <br>- Lower values yields thinner (less opaque) fogs
         *  @name ig.Atmosphere#fogThickness
         *  @type {Number}
         *  @default
         */
        fogThickness: 0.3,

        /**
         *  Sky color-related components
         *  @typedef {Object} SkyColorObject
         *  @property {Object} day       Peak daytime color
         *  @property {Number} day.r     Red value of the RGBA color space for daytime
         *  @property {Number} day.g     Green value of the RGBA color space for daytime
         *  @property {Number} day.b     Blue value of the RGBA color space for daytime
         *  @property {Number} day.a     Alpha channel of the RGBA color space for daytime
         *  @property {Object} night     Peak nighttime color
         *  @property {Number} night.r   Red value of the RGBA color space for nighttime
         *  @property {Number} night.g   Green value of the RGBA color space for nighttime
         *  @property {Number} night.b   Blue value of the RGBA color space for nighttime
         *  @property {Number} night.a   Alpha channel of the RGBA color space for nighttime
         *  @property {Object} sunrise   Peak sunrise color
         *  @property {Number} sunrise.r Red value of the RGB color space for sunrise
         *  @property {Number} sunrise.g Green value of the RGB color space for sunrise
         *  @property {Number} sunrise.b Blue value of the RGB color space for sunrise
         *  @property {Object} sunset    Peak sunset color
         *  @property {Number} sunset.r  Red value of the RGB color space for sunset
         *  @property {Number} sunset.g  Green value of the RGB color space for sunset
         *  @property {Number} sunset.b  Blue value of the RGB color space for sunset
         */

        /**
         *  Ambient illumination color
         *  @name ig.Atmosphere#skyColor
         *  @type {SkyColorObject}
         *  @default
         */
        skyColor: {
            day    : {r:   0, g:   0, b:  0, a: 0   },
            night  : {r:   0, g:   0, b:  0, a: 0.65},
            sunrise: {r: 182, g: 126, b: 81},
            sunset : {r: 182, g: 126, b: 81}
        },

        /**
         *  Solar-related components
         *  @typedef {Object} SolarObject
         *  @property {Object} sunrise          Computed sunrise-related results
         *  @property {Number} sunrise.date     Date of next sunrise in Julian days
         *  @property {Number} sunrise.duration Duration of next sunrise in minutes
         *  @property {Object} sunset           Computed sunset-related results
         *  @property {Number} sunset.date      Date of next sunset in Julian days
         *  @property {Number} sunset.duration  Duration of next sunset in minutes
         *  @property {Number} nextUpdate      Date of next solar-related recomputations in Julian days
         */

        /**
         *  Computed solar-related results
         *  @name ig.Atmosphere#solar
         *  @type {SolarObject}
         *  @default
         *  @readonly
         */
        solar: {
            sunrise: {date: 0, duration: 60},
            sunset : {date: 0, duration: 60},
            nextUpdate: 0
        },

        /**
         *  Season-related components
         *  @typedef {Object} SeasonObject
         *  @property {Number} vernalEquinox    Date of next vernal (Spring) equinox in Julian days
         *  @property {Number} estivalSolstice  Date of next estival (Summer) solstice in Julian days
         *  @property {Number} autumnalEquinox  Date of next autumnal (Autumn) equinox in Julian days
         *  @property {Number} hibernalSolstice Date of next hibernal (Winter) solstice in Julian days
         */

        /**
         *  Computed season-related results
         *  @name ig.Atmosphere#season
         *  @type {SeasonObject}
         *  @default
         *  @readonly
         */
        season: {
            vernalEquinox   : 0,
            estivalSolstice : 0,
            autumnalEquinox : 0,
            hibernalSolstice: 0
        },

        /**
         *  Maximum number of particles to generate during particle-based weather conditions before stopping
         *  @name ig.Atmosphere#particlesMax
         *  @type {Number}
         *  @default
         */
        particlesMax : 100,

        /**
         *  Current number of particles generated during particle-based weather conditions
         *  @name ig.Atmosphere#particlesCurr
         *  @type {Number}
         *  @readonly
         */
        particlesCurr: 0,

        /**
         *  Determines current duration into lightning flash effect
         *  @name ig.Atmosphere#lightningActive
         *  @type {Number}
         *  @private
         */
        lightningActive: 0,


        //---------------------------------------------------------------------
        // Init
        /**
         *  Plugin initialization. Called when new instance is created.
         *  @method ig.Atmosphere#init
         *  @param {Date}   [datetime=new Date()] Start from specified date and time
         *  @param {Number} [updateRate=60]      Real time in seconds the plugin should update itself
         *  @param {Number} [timescale=1]         Speed relative to real time at which the plugin should run
         *  @private
         */
        init: function(datetime, updateRate, timescale) {
            // Initialize plugin variables
            this.setDateTime(datetime);
            this.updateTimescale(timescale);
            this.updateUpdateRate(updateRate);
            this.updateGeoCoords(this.geoCoords.latitude, this.geoCoords.longitude);

            this.nextParticle = new ig.Timer();

            //console.log('========== Impact Atmospheric System Plugin initialized ==========');
            //console.log('Update rate: ' + updateRate + ' seconds');
            //console.log('Timescale: ' + this.timescale + 'x real time');
            //console.log('Geographical coordinates: (Lat: ' + this.geoCoords.latitude + ', Lng: ' + this.geoCoords.longitude + ')');
            //console.log('Current: ' + this.convertGregorianToJulian(this.gregorianDate) + ' JD');
            //console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate)).toString());
        }, // End init
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Update
        /**
         *  Updates logic-related components of the plugin
         *  @method ig.Atmosphere#update
         *  @private
         */
        update: function() {
            if(this.updateTimer.delta() >= 0) {
                this.updateTimer.reset();

                // Update and recalculate time
                //console.log('----- ' + this.updateRate + ' seconds elapsed, date/time updated -----');
                this.updateDateTime(this.gregorianDate, this.timescale);
                //console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate)).toString());

                // Recompute solstices, equinoxes, and current season for new year
                if(this.gregorianDate.year !== this.convertJulianToGregorian(this.season.vernalEquinox).getFullYear()) {
                    //console.log('----- Time to recompute seasons -----');
                    this.season = this.computeSeasons(this.gregorianDate, this.geoCoords);
                }

                // Recompute sunrise and sunset times for new day
                if(this.convertGregorianToJulian(this.gregorianDate) >= this.solar.nextUpdate) {
                    //console.log('----- Time to recompute sunriset -----');
                    this.solar = this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate), this.geoCoords);
                }
            }

            // Generate particles based on weather condition
            if(this.weatherCondition.rain) {
                // Rain
                if(this.particlesCurr < this.particlesMax && this.nextParticle.delta() >= 0) {
                    this.particlesCurr++;
                    this.nextParticle.set(1 / (ig.system.height + 1));
                    ig.game.spawnEntity(
                        EntityRain,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y,
                        {weight: Math.random() + 0.5} // Randomize raindrop weight (range: 0.5 - 1.5)
                    );
                } else if(this.particlesCurr >= this.particlesMax) {
                    this.nextParticle.set(0);
                }
            } else {
                if(this.particlesCurr > 0 && this.nextParticle.delta() >= 0) {
                    var r = ig.game.getEntitiesByType(EntityRain)[0];
                    if(typeof r !== 'undefined') {
                        r.kill();
                        this.particlesCurr--;

                        this.nextParticle.set(2 / (this.particlesCurr + 1));
                    }
                }
            }

            if(this.weatherCondition.snow) {
                // Snow
                if(this.particlesCurr < this.particlesMax && this.nextParticle.delta() >= 0) {
                    this.particlesCurr++;
                    this.nextParticle.set(1 / (this.particlesMax - this.particlesCurr + 1));
                    ig.game.spawnEntity(
                        EntitySnow,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y,
                        {radius: Math.random() * 0.5 + 1} // Randomize snow particle size (range: 1.0 - 1.5)
                    );
                } else if(this.particlesCurr >= this.particlesMax) {
                    this.nextParticle.set(0);
                }
            } else {
                if(this.particlesCurr > 0 && this.nextParticle.delta() >= 0) {
                    var s = ig.game.getEntitiesByType(EntitySnow)[0];
                    if(typeof s !== 'undefined') {
                        s.kill();
                        this.particlesCurr--;

                        this.nextParticle.set(2 / (this.particlesCurr + 1));
                    }
                }
            }
        }, // End update
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Draw
        /**
         *  Updates canvas draw-related components of the plugin
         *  @method ig.Atmosphere#draw
         *  @private
         */
        draw: function() {
            if(this.weatherCondition.lightning) {
                if(this.lightningActive <= 0 && this.updateTimer.delta() === -this.updateRate) {
                    // Trigger lightning
                    if(Math.random() < this.lightningRate) {
                        this.lightningActive = ig.system.tick;
                    }
                } else if(this.lightningActive > 0) {
                    // Compute ambient brightness due to lightning flash
                    ig.system.context.fillStyle = 'rgba(255, 255, 255, ' + (0.7 - this.lightningActive) + ')';
                    ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);

                    this.lightningActive += ig.system.tick;

                    if(this.lightningActive > 1) {
                        this.lightningActive = 0;
                    }
                }
            }

            this.sky = {};

            // Compute rgba based on time of day
            if(this.julianDate >= this.solar.sunrise.date && this.julianDate < this.solar.sunset.date) {
                // Sun is up
                if(this.julianDate >= this.solar.sunrise.date + this.solar.sunrise.duration / 1440) {
                    // Sun has risen
                    this.sunState = 1;
                    this.sky.r = this.skyColor.day.r;
                    this.sky.g = this.skyColor.day.g;
                    this.sky.b = this.skyColor.day.b;
                    this.sky.a = this.skyColor.day.a;
                } else {
                    // Sun is rising
                    this.sunState = 0;
                    this.sky.r = (this.skyColor.sunrise.r * (this.julianDate - this.solar.sunrise.date) / (this.solar.sunrise.duration / 1440)).floor();
                    this.sky.g = (this.skyColor.sunrise.g * (this.julianDate - this.solar.sunrise.date) / (this.solar.sunrise.duration / 1440)).floor();
                    this.sky.b = (this.skyColor.sunrise.b  * (this.julianDate - this.solar.sunrise.date) / (this.solar.sunrise.duration / 1440)).floor();
                    this.sky.a = this.skyColor.night.a - this.skyColor.night.a * (this.julianDate - this.solar.sunrise.date) / (this.solar.sunrise.duration / 1440);
                }
            } else {
                // Sun is down, handle new day hour wraparound
                if(this.julianDate >= this.solar.sunset.date + this.solar.sunset.duration / 1440 || (this.julianDate % 1 >= 0.5 && this.julianDate < this.solar.nextUpdate)) {
                    // Sun has set
                    this.sunState = 3;
                    this.sky.r = this.skyColor.night.r;
                    this.sky.g = this.skyColor.night.g;
                    this.sky.b = this.skyColor.night.b;
                    this.sky.a = this.skyColor.night.a;
                } else {
                    // Sun is setting
                    this.sunState = 2;
                    this.sky.r = this.skyColor.sunset.r - (this.skyColor.sunset.r * (this.julianDate - this.solar.sunset.date) / (this.solar.sunset.duration / 1440)).floor();
                    this.sky.g = this.skyColor.sunset.g - (this.skyColor.sunset.g * (this.julianDate - this.solar.sunset.date) / (this.solar.sunset.duration / 1440)).floor();
                    this.sky.b = this.skyColor.sunset.b - (this.skyColor.sunset.b * (this.julianDate - this.solar.sunset.date) / (this.solar.sunset.duration / 1440)).floor();
                    this.sky.a = this.skyColor.night.a * (this.julianDate - this.solar.sunset.date) / (this.solar.sunset.duration / 1440);
                }
            }

            ig.system.context.fillStyle = 'rgba(' + this.sky.r + ', ' + this.sky.g + ', ' + this.sky.b + ', ' + this.sky.a + ')';
            ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);

            if(this.weatherCondition.fog) {
                // Fog
                if(!this.fog) {
                    ig.system.context.clearRect(0, 0, ig.system.width, ig.system.height);

                    var r, g, b, size = 5;
                    for(var i = ig.game.screen.x; i < ig.game.screen.x + ig.system.width; i += size) {
                        for(var j = ig.game.screen.y; j < ig.game.screen.y + ig.system.height; j += size) {
                            r = g = b = (255 * PerlinNoise.noise(size * i / ig.system.width, size * j / ig.system.height, 0.6)).round();
                            ig.system.context.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + this.fogThickness + ')';
                            ig.system.context.fillRect(i, j, size, size);
                        }
                    }

                    this.fog = new Image();
                    this.fog.src = ig.system.context.canvas.toDataURL('image/png');
                } else {
                    ig.system.context.drawImage(this.fog, 0, 0);
                }
            } else if(this.fog) {
                delete this.fog;
            }
        }, // End draw
        //---------------------------------------------------------------------

        /**
         *  Set/Store date and time
         *  @method ig.Atmosphere#setDateTime
         *  @param {Date} [datetime=new Date()] New plugin date and time
         *
         *  @example
         *  // Set plugin current date and time to today
         *  ig.Atmosphere.setDateTime(new Date());
         *  @example
         *  // Set plugin current date and time to April 14, 2014 5:23:37 PM
         *  ig.Atmosphere.setDateTime(new Date(2014, 3, 14, 17, 23, 37));
         */
        setDateTime: function(datetime) {
            // Sanity check
            if(typeof datetime !== 'undefined') {
                if(!(datetime instanceof Date) && typeof datetime.getFullYear === 'undefined') {
                    console.warn('datetime \'' + datetime + '\' not a valid Date object. Attempting to create Date object from datetime.');
                    datetime = new Date(datetime);

                    if(typeof datetime.getFullYear() === 'number') {
                        console.warn('Failed to create Date object. Defaulting datetime to current date and time.');
                        datetime = new Date(datetime);
                    }
                }
            } else {
                //console.warn('datetime not provided. Defaulting datetime to current date and time.');
                datetime = new Date();
            }

            this.gregorianDate = {
                year       : datetime.getFullYear(),
                month      : datetime.getMonth() + 1,
                day        : datetime.getDate(),
                hour       : datetime.getHours(),
                minute     : datetime.getMinutes(),
                second     : datetime.getSeconds(),
                millisecond: datetime.getMilliseconds()
            };

            this.julianDate = this.convertGregorianToJulian(this.gregorianDate);
        }, // End setDateTime

        /**
         *  Get stored date and time
         *  @method ig.Atmosphere#getDateTime
         *  @return {Date} Current plugin date and time
         */
        getDateTime: function() {
            return new Date(
                this.gregorianDate.year,
                this.gregorianDate.month,
                this.gregorianDate.day,
                this.gregorianDate.hour,
                this.gregorianDate.mintute,
                this.gregorianDate.second,
                this.gregorianDate.millisecond
            );
        }, // End getDateTime

        /**
         *  Updates stored date and time and performs post-recomputations, if necessary
         *  @method ig.Atmosphere#updateDateTime
         *  @param {Date}   datetime  Current plugin date and time
         *  @param {Number} timescale Elapsed time in seconds to advance current date and time by
         *  @readonly
         *  @private
         */
        updateDateTime: function(datetime, timescale) {
            this.setDateTime(new Date(
                this.gregorianDate.year,
                this.gregorianDate.month - 1,
                this.gregorianDate.day,
                this.gregorianDate.hour,
                this.gregorianDate.minute,
                this.gregorianDate.second,
                this.gregorianDate.millisecond + this.updateRate * timescale * 1000
            ));

            this.julianDate = this.convertGregorianToJulian(this.gregorianDate);

            if(this.julianDate < this.season.vernalEquinox || this.julianDate >= this.season.hibernalSolstice) {
                this.seasonState = 3;
            } else if(this.julianDate < this.season.estivalSolstice) {
                this.seasonState = 0;
            } else if(this.julianDate < this.season.autumnalEquinox) {
                this.seasonState = 1;
            } else if(this.julianDate < this.season.hibernalSolstice) {
                this.seasonState = 2;
            }
        }, // End updateDateTime

        /**
         *  Updates time scale and performs post-recomputations, if necessary
         *  @method ig.Atmosphere#updateTimescale
         *  @param {Number} [timescale=1] New plugin time scale
         *
         *  @example
         *  // 1 second real time = 0.5 second plugin time
         *  ig.Atmosphere.updateTimescale(0.5);
         *  @example
         *  // 1 second real time = 10 second plugin time
         *  ig.Atmosphere.updateTimescale(10);
         */
        updateTimescale: function(timescale) {
            // Sanity check
            if(typeof timescale !== 'undefined') {
                if(typeof timescale === 'number') {
                    if(timescale <= 0) {
                        console.warn('timescale \'' + timescale + '\' not a positive integer. Assuming timescale absolute value.');
                        timescale = Math.abs(timescale);
                    }
                } else {
                    console.warn('timescale \'' + timescale + '\' not a number. Typecasting timescale to integer.');
                    timescale = Number(timescale);
                }
            } else {
                //console.warn('timescale not provided. Defaulting timescale to 1.');
                timescale = 1;
            }

            this.timescale = timescale;
        },

        /**
         *  Updates update rate and performs post-recomputations, if necessary
         *  @method ig.Atmosphere#updateUpdateRate
         *  @param {Number} [updateRate=60] New plugin update rate
         *
         *  @example
         *  // Update plugin every 30 seconds
         *  ig.Atmosphere.updateUpdateRate(30);
         */
        updateUpdateRate: function(updateRate) {
            // Sanity check
            if(typeof updateRate !== 'undefined') {
                if(typeof updateRate === 'number') {
                    if(updateRate <= 0) {
                        console.warn('updateRate \'' + updateRate + '\' not a positive number. Assuming updateRate absolute value.');
                        updateRate = Math.abs(updateRate);
                    }
                } else {
                    console.warn('updateRate \'' + updateRate + '\' not a number. Typecasting updateRate to number.');
                    updateRate = parseFloat(updateRate);
                }
            } else {
                //console.warn('updateRate not provided. Defaulting updateRate to 60.');
                updateRate = 60;
            }

            this.updateRate = updateRate;
            this.updateTimer = new ig.Timer(updateRate);
        },

        /**
         *  Updates geographical coordinates and performs post-recomputations, if necessary
         *  @method ig.Atmosphere#updateGeoCoords
         *  @param {Number} lat The north-south position
         *  @param {Number} lng The east-west position
         *
         *  @example
         *  // Set new plugin coordinates to 40.7789 degrees North, 73.9675 degrees West
         *  ig.Atmosphere.updateGeoCoords(40.7789, -73.9675);
         */
        updateGeoCoords: function(lat, lng) {
            // Sanity check
            var latitude  = parseFloat(lat),
                longitude = parseFloat(lng);

            // Clamp latitude and longitude
            latitude.limit(-90, 90);
            longitude.limit(-180, 180);

            this.geoCoords = {latitude: latitude, longitude: longitude};
            this.season = this.computeSeasons(this.gregorianDate, this.geoCoords);
            this.solar = this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate), this.geoCoords);
        },

        /**
         *  Converts Gregorian Date to Julian Date
         *  @method ig.Atmosphere#convertGregorianToJulian
         *  @param  {Date}   gDate Specified date in Gregorian date
         *  @return {Number}       The equivalent Julian Date
         */
        convertGregorianToJulian: function(gDate) {
            var gYear        = gDate.year,
                gMonth       = gDate.month,
                gDay         = gDate.day,
                gHour        = gDate.hour,
                gMinute      = gDate.minute,
                gSecond      = gDate.second,
                gMillisecond = gDate.millisecond,
                a = ((gMonth - 3) / 12).floor(),
                b = gYear + a,
                c = (b / 100).floor(),
                d = b % 100,
                e = gMonth - 12 * a - 3;

            return (146097 * c / 4).floor() +
                   (36525 * d / 100).floor() +
                   ((153 * e + 2) / 5).floor() +
                   gDay + 1721119 +
                   (gHour - 12) / 24 +
                   gMinute / 1440 +
                   gSecond / 86400 +
                   gMillisecond / 86400000;
        }, // End convertGregorianToJulian

        /**
         *  Converts Julian Date to Gregorian Date
         *  @method ig.Atmosphere#convertJulianToGregorian
         *  @param  {Number} jDate Specified date in Julian date
         *  @return {Date}         The equivalent Gregorian Date
         */
        convertJulianToGregorian: function(jDate) {
            var f = 4 * (jDate - 1721120) + 3,
                g = (f / 146097).floor(),
                h = 100 * ((f % 146097) / 4).floor() + 99,
                i = (h / 36525).floor(),
                j = 5 * ((h % 36525) / 100).floor() + 2,
                k = (j / 153),
                l = ((k + 2) / 12).floor(),
                t = jDate % 1,
                u = 1 / 24,
                v = 1 / 1440,
                w = 1 / 86400;

            var Y = 100 * g + i + l,
                M = k - 12 * l + 3,
                D = ((j % 153) / 5).floor(), // Math.floor((j % 153) / 5) + 1
                H = (t / u).floor() + 12,
                N = ((t % u) / v).floor(),
                S = ((t % v) / w).floor(),
                m = ((t % w) / (1 / 86400000)).floor();

            // ** Manual time offset correction applied **
            // Possible timezone issue?
            D += H >= 12 && H < 18 ? 1 : 0;

            return new Date(Y, M - 1, D, H, N, S, m);
        }, // End convertJulianToGregorian

        /**
         *  Computes the approximate sunrise and sunset time for specified date and geographical coordinates
         *  @method ig.Atmosphere#computeSunriset
         *  @param  {Date}           jDate     Specified date in Gregorian date
         *  @param  {GeoCoordObject} geoCoords Geographical coordinates
         *  @return {SolarObject}              Computed solar-based results
         *  @private
         */
        computeSunriset: function(jDate, geoCoords) {
            var julianCycle        = ((jDate - 2451545 - 0.0009) + (geoCoords.longitude / 360)).round(),
                solarNoon          = 2451545 + 0.0009 - (geoCoords.longitude / 360) + julianCycle,
                solarMeanAnomaly   = (357.5291 + 0.98560028 * (solarNoon - 2451545)) % 360,
                equationOfCenter   = (1.9148 * Math.sin((solarMeanAnomaly).toRad())) +
                                     (0.0200 * Math.sin((2 * solarMeanAnomaly).toRad())) +
                                     (0.0003 * Math.sin((3 * solarMeanAnomaly).toRad())),
                eclipticLongitude  = (solarMeanAnomaly + 102.9372 + equationOfCenter + 180) % 360,
                solarTransit       = solarNoon +
                                     (0.0053 * Math.sin((solarMeanAnomaly).toRad())) -
                                     (0.0069 * Math.sin((2 * eclipticLongitude).toRad())),
                declinationOfSun  = (Math.asin(
                                       Math.sin((eclipticLongitude).toRad()) *
                                       Math.sin((23.45).toRad())
                                     )).toDeg(),
                hourAngle          = (Math.acos(
                                       (Math.sin((-0.83).toRad()) - Math.sin((geoCoords.latitude).toRad()) * Math.sin((declinationOfSun).toRad())) /
                                       (Math.cos((geoCoords.latitude).toRad()) * Math.cos((declinationOfSun).toRad()))
                                     )).toDeg(),
                julianHourAngle    = 2451545 + 0.0009 + ((hourAngle - geoCoords.longitude) / 360) + julianCycle,
                sunset             = julianHourAngle +
                                     (0.0053 * Math.sin((solarMeanAnomaly).toRad())) -
                                     (0.0069 * Math.sin((2 * eclipticLongitude).toRad())),
                sunrise            = solarTransit - (sunset - solarTransit);

            // ** Manual time offset correction applied **
            // Possible timezone issue?
            return {
                sunrise: { date: sunrise - this.solar.sunrise.duration / 1440 - 0.125, duration: this.solar.sunrise.duration },
                sunset : { date: sunset - this.solar.sunset.duration / 1440 - 0.125,   duration: this.solar.sunset.duration  },

                nextUpdate: jDate.floor() + 0.7063657403923571 + (jDate % 1 < 0.7063657403923571 ? 0 : 1) // 0.7063657403923571 JD = 4:57:10
            };

            //console.log('----- computeSunriset() -----');
            //console.log('Sunrise: ' + this.convertJulianToGregorian(this.solar.sunrise.date).toString());
            //console.log('Sunset : ' + this.convertJulianToGregorian(this.solar.sunset.date).toString());
            //console.log('Next computeSunriset() at: ' + this.convertJulianToGregorian(this.solar.nextUpdate).toString());
        }, // End computeSunriset

        /**
         *  Compute the solstices, equinoxes, and current season based on specified specified date
         *  @method ig.Atmosphere#computeSeasons
         *  @param  {Date}           gDate     Specified date in Gregorian date
         *  @param  {GeoCoordObject} geoCoords Geographical coordinates
         *  @return {SeasonObject}             Computed season-related results
         *  @private
         */
        computeSeasons: function(gDate, geoCoords) {
            /*  NOTE: This algorithm has no creditable source (or at least that I can find); it was
             *        something I made up. I was trying to find some form of mathematical equation to
             *        compute solstices and equinoxes but with no luck. So, I used various tiny bits of
             *        information gathered from various sources along with general knowledge and
             *        constructed my own algorithm. I then compared the final results against some
             *        precomputed tables of solstices and equinoxes, with some degree of inaccuracy.
             *
             *  General Algorithm Outline:
             *      0. Information gathering and assumptions
             *          a. Assume day length (sunrise - sunset) can be computed for arbitrary days.
             *          b. Assume vernal equinox occurs between March 20 and March 23.
             *             Assume estival solstice occurs between June 20 and June 23.
             *             Assume autumnal equinox occurs between September 20 and September 23.
             *             Assume hibernal solstice occurs between December 20 and December 23.
             *      1. Computation of vernal equinox
             *          a. For each potential day of vernal equinox, compute day length.
             *          b. Of all potential days of vernal equinox, take the day where day length is
             *             closest to 12 hours. This day is the vernal equinox.
             *             This is because:
             *                  vernal equinox: day length = night length
             *                  day length - night length = 12 hours - 12 hours = 0 (or as close to 0 as possible)
             *      2. Computation of estival solstice
             *          a. For each potential day of estival solstice, compute day length.
             *          b. Of all potential days of estival solstice, take the day where day length is
             *             greatest. This day is the estival solstice.
             *             This is because:
             *                  estival solstice: longest day
             *                  longest day = greatest day length
             *      3. Computation of autumnal equinox
             *          a. For each potential day of autumnal equinox, compute day length.
             *          b. Of all potential days of autumnal equinox, take the day where day length is
             *             closest to 12 hours. This day is the autumnal equinox.
             *             This is because:
             *                  autumnal equinox: day length = night length
             *                  day length - night length = 12 hours - 12 hours = 0 (or as close to 0 as possible)
             *      4. Computation of hibernal solstice
             *          a. For each potential day of hibernal solstice, compute day length.
             *          b. Of all potential days of hibernal solstice, take the day where day length is
             *             least value. This day is the hibernal solstice.
             *             This is because:
             *                  hibernal solstice: shortest day
             *                  shortest day = least day length
             *      5. Computation of current season
             *         Once solstices and equinoxes are determined, take current date (and time) and
             *         compare it against solstices and equinoxes.
             *          a. If current date falls between vernal equinox (inclusive) and estival
             *             solstice (exclusive), current date is in vernal season (Spring).
             *          b. If current date falls between estival solstice (inclusive) and autumnal
             *             equinox (exclusive), current date is in estival season (Summer).
             *          c. If current date falls between autumnal equinox (inclusive) and hibernal
             *             solstice (exclusive), current date is in autumnal season (Autumn).
             *          d. If current date falls between hibernal solstice (inclusive) and vernal
             *             equinox (exclusive), current date is in hibernal season (Winter).
             */

            // Estimated bound for solstice and equinox dates
            // TODO: Account for arbitrary latitudes (for polar day and polar night)
            var jDateVernalMin   = this.convertGregorianToJulian({year: gDate.year, month:  3, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // March 20
                jDateVernalMax   = jDateVernalMin + 3, // March 23
                jDateEstivalMin  = this.convertGregorianToJulian({year: gDate.year, month:  6, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // June 20
                jDateEstivalMax  = jDateEstivalMin + 3, // June 23
                jDateAutumnalMin = this.convertGregorianToJulian({year: gDate.year, month:  9, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // September 20
                jDateAutumnalMax = jDateAutumnalMin + 3, // September 23
                jDateHibernalMin = this.convertGregorianToJulian({year: gDate.year, month: 12, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // December 20
                jDateHibernalMax = jDateHibernalMin + 3; // December 23

            var jDateVernalEquinox    = -1, vDayLength = 1,
                jDateEstivalSolstice  = -1, eDayLength = 0,
                jDateAutumnalEquinox  = -1, aDayLength = 1,
                jDateHibernalSolstice = -1, hDayLength = 1,
                dayLength;

            // Compute vernal equinox
            for(var v = jDateVernalMin; v <= jDateVernalMax; v++) {
                dayLength = this.computeSunriset(v, geoCoords);

                if(dayLength.sunset.date - dayLength.sunrise.date < vDayLength) {
                    jDateVernalEquinox = v;
                    vDayLength = dayLength.sunset.date - dayLength.sunrise.date;
                }
            }

            // Compute estival solstice
            for(var e = jDateEstivalMin; e <= jDateEstivalMax; e++) {
                dayLength = this.computeSunriset(e, geoCoords);

                if(dayLength.sunset.date - dayLength.sunrise.date > eDayLength) {
                    jDateEstivalSolstice = e;
                    eDayLength = dayLength.sunset.date - dayLength.sunrise.date;
                }
            }

            // Compute autumnal equinox
            for(var a = jDateAutumnalMin; a <= jDateAutumnalMax; a++) {
                dayLength = this.computeSunriset(a, geoCoords);

                if(dayLength.sunset.date - dayLength.sunrise.date < aDayLength) {
                    jDateAutumnalEquinox = a;
                    aDayLength = dayLength.sunset.date - dayLength.sunrise.date;
                }
            }

            // Compute hibernal solstice
            for(var h = jDateHibernalMin; h <= jDateHibernalMax; h++) {
                dayLength = this.computeSunriset(h, geoCoords);

                if(dayLength.sunset.date - dayLength.sunrise.date < hDayLength) {
                    jDateHibernalSolstice = h;
                    hDayLength = dayLength.sunset.date - dayLength.sunrise.date;
                }
            }

            // Determine current season based on current date relative to solstices and equinoxs
            var jDate = this.convertGregorianToJulian(gDate);
            if(jDate < jDateVernalEquinox || jDate >= jDateHibernalSolstice) {
                this.seasonState = 3;
            } else if(jDate < jDateEstivalSolstice) {
                this.seasonState = 0;
            } else if(jDate < jDateAutumnalEquinox) {
                this.seasonState = 1;
            } else if(jDate < jDateHibernalSolstice) {
                this.seasonState = 2;
            }

            return {
                vernalEquinox   : jDateVernalEquinox,
                estivalSolstice : jDateEstivalSolstice,
                autumnalEquinox : jDateAutumnalEquinox,
                hibernalSolstice: jDateHibernalSolstice
            };
        }, // End computeSeasons
    }); // End ig.Atmosphere
    //#########################################################################


    /**
     *  Perlin Noise Generator
     *  <br>My modifications: Minor code adaptation for use in ImpactJS. Algorithm remains unmodified.
     *  <br>Ken Perlin's original Java implementation: http://cs.nyu.edu/~perlin/noise
     *  <br>Kas Thomas's JavaScript port: http://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html
     */
    var PerlinNoise = {
        noise: function(x, y, z) {
            var p = new Array(512);
            var permutation = [
                151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,
                99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,
                11,32, 57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,
                139,48,27,166, 77,146,158,231,83,111,229,122, 60,211,133,230,220,105,92,41,55,
                46,245,40,244,102,143,54, 65,25,63,161, 1,216,80,73,209, 76,132,187,208,89,18,
                169,200,196,135,130,116,188,159, 86,164,100,109,198,173,186, 3, 64,52,217,226,
                250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,
                189,28, 42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,
                172,9,129, 22,39,253,19,98,108,110, 79,113,224,232,178,185,112,104,218,246,97,
                228,251, 34,242,193,238,210,144, 12,191,179,162,241,81,51,145,235,249, 14,239,
                107, 49,192,214, 31,181,199,106,157,184, 84,204,176,115,121, 50,45,127, 4,150,
                254,138,236,205,93,222,114,67,29, 24,72,243,141,128,195,78,66,215, 61,156,180
            ];

            for(var i = 0; i < 256; i++) {
                p[256+i] = p[i] = permutation[i];
            }

                var X = x.floor() & 255,
                    Y = y.floor() & 255,
                    Z = z.floor() & 255;

                x -= x.floor();
                y -= y.floor();
                z -= z.floor();

                var u = this.fade(x),
                    v = this.fade(y),
                    w = this.fade(z);

                var A = p[X  ]+Y, AA = p[A]+Z, AB = p[A+1]+Z,
                    B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;

                // Returns a number between 0 and 1
                return this.scale(this.lerp(w, this.lerp(v, this.lerp(u, this.grad(p[AA  ], x  , y  , z  ),
                                                                         this.grad(p[BA  ], x-1, y  , z  )),
                                                            this.lerp(u, this.grad(p[AB  ], x  , y-1, z  ),
                                                                         this.grad(p[BB  ], x-1, y-1, z  ))),
                                               this.lerp(v, this.lerp(u, this.grad(p[AA+1], x  , y  , z-1),
                                                                         this.grad(p[BA+1], x-1, y  , z-1)),
                                                            this.lerp(u, this.grad(p[AB+1], x  , y-1, z-1),
                                                                         this.grad(p[BB+1], x-1, y-1, z-1)))));
        },

        fade: function(t) { return t * t * t * (t * (t * 6 - 15) + 10); },
        lerp: function(t, a, b) { return a + t * (b - a); },
        grad: function(hash, x, y, z) {
            var h = hash & 15;
            var u = h < 8 ? x : y,
                v = h < 4 ? y : h === 12 || h === 14 ? x : z;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        },
        scale: function(n) { return (1 + n) / 2; }
    }; // End PerlinNoise


    //#########################################################################
    // Particles

    /**
     *  Rain particle
     *  @extends ig.Entity
     */
    var EntityRain = ig.Entity.extend({
        vel: {x: 20, y: 400},
        maxVel: {x: 100, y: 400},

        weight: 1,    // Raindrop weight

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Randomize raindrop lifetime
            this.lifetime = ig.system.height / this.vel.y;
            this.lifetimeTimer = new ig.Timer(Math.abs(Math.random() * this.lifetime * 1.5 - this.lifetime) + this.lifetime / 2); // Range: 0.5 - lifetime (skewed towards lifetime)

            // Randomize initial velocity
            this.vel.x *= Math.random() + 0.5; // Range: 0.5 - 1.5
            this.vel.y *= Math.random() + 1;   // Range: 1.0 - 2.0 (rain should not "fall" upwards...)

            this.weight = Math.abs(this.weight);
        },

        update: function() {
            this.parent();

            // Handle entity moving out of screen bounds
            // Wraparound to opposite side of screen
            if(this.pos.y > ig.game.screen.y + ig.system.height || this.lifetimeTimer.delta() >= 0) {
               this.pos.y = ig.game.screen.y;
               this.lifetimeTimer.set(Math.random() * this.lifetime + this.lifetime / 2);
            } else if(this.pos.x > ig.game.screen.x + ig.system.width) {
                this.pos.x = ig.game.screen.x;
            } else if(this.pos.x < ig.game.screen.x) {
                this.pos.x = ig.game.screen.x + ig.system.width;
            }
        },

        draw: function() {
            // Draw rain
            ig.system.context.strokeStyle = 'rgba(200, 200, 200, 0.6)';
            ig.system.context.lineWidth = this.weight;
            ig.system.context.beginPath();
                ig.system.context.moveTo(this.pos.x, this.pos.y);
                ig.system.context.lineTo(this.pos.x + this.vel.x * 0.05, this.pos.y + this.vel.y * 0.02);
            ig.system.context.closePath();
            ig.system.context.stroke();
        },

        handleMovementTrace: function() {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    }); // End EntityRain

    //
    /**
     *  Snow particle
     *  @extends {ig.Entity}
     */
    var EntitySnow = ig.Entity.extend({
        vel: {x: 60, y: 80},
        maxVel: {x: 100, y: 100},

        radius: 1,    // Particle radius

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Randomize snow particle lifetime
            this.lifetime = ig.system.height / this.vel.y * 1.5;
            this.lifetimeTimer = new ig.Timer(Math.abs(Math.random() * this.lifetime * 1.5 - this.lifetime) + this.lifetime / 2); // Range: 0.5 - lifetime (skewed towards lifetime)

            // Randomize initial velocity
            this.vel.x *= Math.random() * 2 - 1; // Range: -1.0 - 1.0
            this.vel.y *= Math.abs(Math.random() * 2 - 1); // Range: 0.0 - 1.0 (skewed towards 0) (snow should not "fall" upwards...)

            this.radius = Math.abs(this.radius);
        },

        update: function() {
            this.parent();

            // Handle entity moving out of screen bounds
            // Wraparound to opposite side of screen
            if(this.pos.y > ig.game.screen.y + ig.system.height || this.lifetimeTimer.delta() >= 0) {
               this.pos.y = ig.game.screen.y;
               this.lifetimeTimer.set(Math.random() * this.lifetime + this.lifetime / 2);
            } else if(this.pos.x > ig.game.screen.x + ig.system.width) {
                this.pos.x = ig.game.screen.x;
            } else if(this.pos.x < ig.game.screen.x) {
                this.pos.x = ig.game.screen.x + ig.system.width;
            }
        },

        draw: function() {
            // Draw snow
            ig.system.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ig.system.context.beginPath();
                ig.system.context.arc(
                    this.pos.x,
                    this.pos.y,
                    this.radius,
                    0,
                    2 * Math.PI
                );
            ig.system.context.closePath();
            ig.system.context.fill();
        },

        handleMovementTrace: function() {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    }); // End EntitySnow

    // End particles
    //#########################################################################
});
