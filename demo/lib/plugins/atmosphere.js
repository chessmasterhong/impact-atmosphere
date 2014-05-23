/**
 *  atmosphere.js
 *  -----
 *  Impact Atmospheric System Plugin
 *  https://github.com/chessmasterhong/impact-atmosphere
 *
 *  Kevin Chan (chessmasterhong)
 *
 *  A plugin for the Impact game engine that simulates an atmospheric weather
 *  system, day/night cycles and seasonal cycles based on configurable date,
 *  time, and geographical coordinates.
 *
 *  Based on:
 *      http://aa.quae.nl/en/antwoorden/seizoenen.html
 *      http://aa.quae.nl/en/reken/juliaansedag.html
 *      http://aa.quae.nl/en/reken/zonpositie.html
 *      http://aa.usno.navy.mil/data/docs/JulianDate.php
 *      http://calendars.wikia.com/wiki/Julian_day_number
 *      http://users.electromagnetic.net/bu/astro/sunrise-set.php
 *      http://www.esrl.noaa.gov/gmd/grad/solcalc
 */


ig.module(
    'plugins.atmosphere'
)
.requires(
    'impact.game'
)
.defines(function() {
    "use strict";

    ig.Atmosphere = ig.Game.extend({
        debug: true,

        // Time speed multiplier
        //   1 = real time (default), 2 = 2x real time, 0.5 = 0.5x real time, etc.
        timescale: 1,

        // Real time in seconds before auto-updating and recalculating time
        //   Default: 60 (seconds)
        update_rate: 60,

        // Geographical coordinate system
        //   Latitude : North = positive, South = negative
        //   Longitude: East  = positive, West  = negative
        //   http://ozoneaq.gsfc.nasa.gov/latlon.md
        geo_coords: {latitude: 40.7789, longitude: -73.9675},

        // Set weather condition
        // 0 = clear, 1 = rain, 2 = snow, 3 = fog (EXPERIMENTAL!!)
        weather_condition: {
            rain: false,
            snow: false,
            fog : false
        },

        // "Brightness" of nights
        // Greater values yields darker nights
        // 0 = no change compared to day brightness, 1 = pitch black
        brightness_night: 0.65,

        solar: {
            sunrise: {date: 0, duration: 60},
            sunset : {date: 0, duration: 60},
            next_update: 0
        },

        season: {
            vernal_equinox   : 0,
            estival_solstice : 0,
            autumnal_equinox : 0,
            hibernal_solstice: 0
        },

        particles: {
            max : 100, // Maximum number of particles to generate before stopping
            curr: 0    // Keep track of current number of particles
        },

        //---------------------------------------------------------------------
        // Init
        init: function(datetime, update_rate, timescale) {
            // Initialize plugin variables
            this.setDateTime(datetime);
            this.updateTimescale(timescale);
            this.updateUpdateRate(update_rate);
            this.updateGeoCoords(this.geo_coords.latitude, this.geo_coords.longitude);

            this.nextParticle = new ig.Timer();

            //console.log('========== Impact Atmospheric System Plugin initialized ==========');
            //console.log('Update rate: ' + update_rate + ' seconds');
            //console.log('Timescale: ' + this.timescale + 'x real time');
            //console.log('Geographical coordinates: (Lat: ' + this.geo_coords.latitude + ', Lng: ' + this.geo_coords.longitude + ')');
            //console.log('Current: ' + this.convertGregorianToJulian(this.gregorianDate) + ' JD');
            //console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate)).toString());
        }, // End init
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Update
        update: function() {
            if(this.updateTimer.delta() >= 0) {
                this.updateTimer.reset();

                // Update and recalculate time
                //console.log('----- ' + this.update_rate + ' seconds elapsed, date/time updated -----');
                this.updateDateTime(this.gregorianDate, this.timescale);
                //console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate)).toString());

                // Recompute solstices, equinoxes, and current season for new year
                if(this.gregorianDate.year !== this.convertJulianToGregorian(this.season.vernal_equinox).getFullYear()) {
                    //console.log('----- Time to recompute seasons -----');
                    this.season = this.computeSeasons(this.gregorianDate, this.geo_coords);
                }

                // Recompute sunrise and sunset times for new day
                if(this.convertGregorianToJulian(this.gregorianDate) >= this.solar.next_update) {
                    //console.log('----- Time to recompute sunriset -----');
                    this.solar = this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate), this.geo_coords);
                }
            }

            // Generate particles based on weather condition
            if(this.weather_condition.rain) {
                // Rain
                if(this.particles.curr < this.particles.max && this.nextParticle.delta() >= 0) {
                    this.particles.curr++;
                    this.nextParticle.set(1 / (ig.system.height + 1));
                    ig.game.spawnEntity(
                        EntityRain,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y,
                        {weight: Math.random() + 0.5} // Randomize raindrop weight (range: 0.5 - 1.5)
                    );
                } else if(this.particles.curr >= this.particles.max)
                    this.nextParticle.set(0);
            } else {
                if(this.particles.curr > 0 && this.nextParticle.delta() >= 0) {
                    var r = ig.game.getEntitiesByType(EntityRain)[0];
                    if(typeof r !== 'undefined') {
                        r.kill();
                        this.particles.curr--;

                        this.nextParticle.set(2 / (this.particles.curr + 1));
                    }
                }
            }

            if(this.weather_condition.snow) {
                // Snow
                if(this.particles.curr < this.particles.max && this.nextParticle.delta() >= 0) {
                    this.particles.curr++;
                    this.nextParticle.set(1 / (this.particles.max - this.particles.curr + 1));
                    ig.game.spawnEntity(
                        EntitySnow,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y,
                        {radius: Math.random() * 0.5 + 1} // Randomize snow particle size (range: 1.0 - 1.5)
                    );
                } else if(this.particles.curr >= this.particles.max)
                    this.nextParticle.set(0);
            } else {
                if(this.particles.curr > 0 && this.nextParticle.delta() >= 0) {
                    var s = ig.game.getEntitiesByType(EntitySnow)[0];
                    if(typeof s !== 'undefined') {
                        s.kill();
                        this.particles.curr--;

                        this.nextParticle.set(2 / (this.particles.curr + 1));
                    }
                }
            }
        }, // End update
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Draw
        draw: function() {
            var jDate_curr = this.convertGregorianToJulian(this.gregorianDate);

            if(jDate_curr >= this.solar.sunrise.date && jDate_curr < this.solar.sunset.date) {
                // Sun is up
                if(jDate_curr >= this.solar.sunrise.date + this.solar.sunrise.duration / 1440) {
                    // Sun has risen
                    this.sun_state = 1;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, 0)';
                } else {
                    // Sun is rising
                    this.sun_state = 0;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, ' + (this.brightness_night - this.brightness_night * (jDate_curr - this.solar.sunrise.date) / (this.solar.sunrise.duration / 1440)) + ')';
                }
            } else {
                // Sun is down, handle new day hour wraparound
                if(jDate_curr >= this.solar.sunset.date + this.solar.sunset.duration / 1440 || (jDate_curr % 1 >= 0.5 && jDate_curr < this.solar.next_update)) {
                    // Sun has set
                    this.sun_state = 3;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, ' + this.brightness_night + ')';
                } else {
                    // Sun is setting
                    this.sun_state = 2;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, ' + (this.brightness_night * (jDate_curr - this.solar.sunset.date) / (this.solar.sunset.duration / 1440)) + ')';
                }
            }

            ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);

            if(this.weather_condition.fog) {
                // Fog
                var r, g, b, size = 5;
                for(var x = ig.game.screen.x; x < ig.game.screen.x + ig.system.width; x += size) {
                    for(var y = ig.game.screen.y; y < ig.game.screen.y + ig.system.height; y += size) {
                        r = g = b = Math.round(255 * PerlinNoise.noise(size * x / ig.system.width, size * y / ig.system.height, 0.6));
                        ig.system.context.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.4)';
                        ig.system.context.fillRect(x, y, size, size);
                    }
                }
            }

            // ----- Begin debug -----
            if(this.debug) {
                var x = 0,
                    y = 0;

                ig.system.context.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ig.system.context.fillRect(
                    x += 5,
                    y += 5,
                    ig.system.realWidth - 2 * x,
                    255
                );

                ig.system.context.font = '11px monospace';
                ig.system.context.textBaseline = 'top';
                ig.system.context.fillStyle = '#ffffff';

                ig.system.context.fillText('========== Impact Atmospheric System Plugin ==========', x += 5, y += 5);

                ig.system.context.fillText('Timescale: ' + this.timescale + 'x real time', x, y += 15);
                ig.system.context.fillText('Update rate: ' + this.update_rate + (this.update_rate <= 1 ? ' second' : ' seconds'), x, y += 10);

                ig.system.context.fillText('Geographical coordinates: (Lat: ' + this.geo_coords.latitude + ', Lng: ' + this.geo_coords.longitude + ')', x, y += 15);

                ig.system.context.fillStyle = '#ffff00';
                ig.system.context.fillText('Current: ' + this.convertJulianToGregorian(jDate_curr).toString() + ' | ' + jDate_curr.toFixed(8) + ' JD', x, y += 15);
                ig.system.context.fillText('Sun state: The sun ' + (this.sun_state === 0 ? 'is rising' : this.sun_state === 1 ? 'has risen' : this.sun_state === 2 ? 'is setting' : this.sun_state === 3 ? 'has set' : '<invalid sun state>'), x, y += 15);

                ig.system.context.fillStyle = '#ffffff';
                ig.system.context.fillText('Sunrise: ' + this.convertJulianToGregorian(this.solar.sunrise.date).toString() + ' | ' + this.solar.sunrise.date.toFixed(8) + ' JD', x, y += 15);
                ig.system.context.fillText('Sunset : ' + this.convertJulianToGregorian(this.solar.sunset.date).toString() + ' | ' + this.solar.sunset.date.toFixed(8) + ' JD', x, y += 10);

                ig.system.context.fillText('Next sunriset update: ' + this.convertJulianToGregorian(this.solar.next_update).toString(), x, y += 15);

                ig.system.context.fillStyle = '#ffff00';
                ig.system.context.fillText('Season state: ' + (this.season_state === 0 ? 'Spring/Vernal' : this.season_state === 1 ? 'Summer/Estival' : this.season_state === 2 ? 'Autumn/Autumnal' : this.season_state === 3 ? 'Winter/Hibernal' : '<invalid season state>'), x, y += 15);

                ig.system.context.fillStyle = '#ffffff';
                ig.system.context.fillText('Spring : ' + this.convertJulianToGregorian(this.season.vernal_equinox).toString() + ' | ' + this.season.vernal_equinox.toFixed(8) + ' JD', x, y += 15);
                ig.system.context.fillText('Summer : ' + this.convertJulianToGregorian(this.season.estival_solstice).toString() + ' | ' + this.season.estival_solstice.toFixed(8) + ' JD', x, y += 10);
                ig.system.context.fillText('Autumn : ' + this.convertJulianToGregorian(this.season.autumnal_equinox).toString() + ' | ' + this.season.autumnal_equinox.toFixed(8) + ' JD', x, y += 10);
                ig.system.context.fillText('Winter : ' + this.convertJulianToGregorian(this.season.hibernal_solstice).toString() + ' | ' + this.season.hibernal_solstice.toFixed(8) + ' JD', x, y += 10);

                var wc = 'Clear';
                if(this.weather_condition.rain || this.weather_condition.snow || this.weather_condition.fog) {
                    wc = '';
                    if(this.weather_condition.rain) wc += 'Rain ';
                    if(this.weather_condition.snow) wc += 'Snow ';
                    if(this.weather_condition.fog)  wc += 'Fog ';
                }

                ig.system.context.fillStyle = '#ffff00';
                ig.system.context.fillText('Weather condition: ' + wc, x, y += 15);

                ig.system.context.fillStyle = '#ffffff';
                ig.system.context.fillText('Maximum Particle Count: ' + this.particles.max, x, y += 15);
                ig.system.context.fillText('Current Particle Count: ' + this.particles.curr, x, y += 10);

                if(this.weather_condition.fog) {
                    ig.system.context.fillText('Fog block size: ' + size + 'px * ' + size + 'px', x, y += 15);
                    ig.system.context.fillText('Fog block iterations: ' + Math.ceil(ig.system.width / size) + ' * ' + Math.ceil(ig.system.height / size) + ' = ' + Math.ceil((ig.system.width * ig.system.height) / (size * size)), x, y += 10);
                }
            }
            // ----- End debug -----
        }, // End draw
        //---------------------------------------------------------------------

        // Set/Store date and time
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
        }, // End setDateTime

        // Get stored date and time
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

        // Update stored date and time
        updateDateTime: function(datetime, timescale) {
            this.setDateTime(new Date(
                this.gregorianDate.year,
                this.gregorianDate.month - 1,
                this.gregorianDate.day,
                this.gregorianDate.hour,
                this.gregorianDate.minute,
                this.gregorianDate.second,
                this.gregorianDate.millisecond + this.update_rate * timescale * 1000
            ));

            var jDate = this.convertGregorianToJulian(this.gregorianDate);
            if(jDate < this.season.vernal_equinox || jDate >= this.season.hibernal_solstice)
                this.season_state = 3;
            else if(jDate < this.season.estival_solstice)
                this.season_state = 0;
            else if(jDate < this.season.autumnal_equinox)
                this.season_state = 1;
            else if(jDate < this.season.hibernal_solstice)
                this.season_state = 2;
        }, // End updateDateTime

        // Updates timescale
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

        // Updates update rate
        updateUpdateRate: function(update_rate) {
            // Sanity check
            if(typeof update_rate !== 'undefined') {
                if(typeof update_rate === 'number') {
                    if(update_rate <= 0) {
                        console.warn('update_rate \'' + update_rate + '\' not a positive number. Assuming update_rate absolute value.');
                        update_rate = Math.abs(update_rate);
                    }
                } else {
                    console.warn('update_rate \'' + update_rate + '\' not a number. Typecasting update_rate to number.');
                    update_rate = parseFloat(update_rate);
                }
            } else {
                //console.warn('update_rate not provided. Defaulting update_rate to 60.');
                update_rate = 60;
            }

            this.update_rate = update_rate;
            this.updateTimer = new ig.Timer(update_rate);
        },

        // Updates geographical coordinates
        updateGeoCoords: function(lat, lng) {
            // Sanity check
            var latitude  = parseFloat(lat),
                longitude = parseFloat(lng);

            // Clamp latitude
            if(latitude < -90)     latitude = -90;
            else if(latitude > 90) latitude =  90;

            // Clamp longitude
            if(longitude < -180)     longitude = -180;
            else if(longitude > 180) longitude =  180;

            this.geo_coords = {latitude: latitude, longitude: longitude};
            this.season = this.computeSeasons(this.gregorianDate, this.geo_coords);
            this.solar = this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate), this.geo_coords);
        },

        // Convert Gregorian Date to Julian Date
        convertGregorianToJulian: function(gDate) {
            var gYear        = gDate.year,
                gMonth       = gDate.month,
                gDay         = gDate.day,
                gHour        = gDate.hour,
                gMinute      = gDate.minute,
                gSecond      = gDate.second,
                gMillisecond = gDate.millisecond,
                a = Math.floor((gMonth - 3) / 12),
                b = gYear + a,
                c = Math.floor(b / 100),
                d = b % 100,
                e = gMonth - 12 * a - 3;

            return Math.floor(146097 * c / 4) +
                   Math.floor(36525 * d / 100) +
                   Math.floor((153 * e + 2) / 5) +
                   gDay + 1721119 +
                   (gHour - 12) / 24 +
                   gMinute / 1440 +
                   gSecond / 86400 +
                   gMillisecond / 86400000;
        }, // End convertGregorianToJulian

        // Convert Julian Date to Gregorian Date
        convertJulianToGregorian: function(jDate) {
            var f = 4 * (jDate - 1721120) + 3,
                g = Math.floor(f / 146097),
                h = 100 * Math.floor((f % 146097) / 4) + 99,
                i = Math.floor(h / 36525),
                j = 5 * Math.floor((h % 36525) / 100) + 2,
                k = Math.floor(j / 153),
                l = Math.floor((k + 2) / 12),
                t = jDate % 1,
                u = 1 / 24,
                v = 1 / 1440,
                w = 1 / 86400;

            var Y = 100 * g + i + l,
                M = k - 12 * l + 3,
                D = Math.floor((j % 153) / 5), // Math.floor((j % 153) / 5) + 1
                H = Math.floor(t / u) + 12,
                N = Math.floor((t % u) / v),
                S = Math.floor((t % v) / w),
                m = Math.floor((t % w) / (1 / 86400000));

            // ** Manual time offset correction applied **
            // Possible timezone issue?
            D += H >= 12 && H < 18 ? 1 : 0;

            return new Date(Y, M - 1, D, H, N, S, m);
        }, // End convertJulianToGregorian

        // Computes the approximate sunrise and sunset time for specified date and geographical coordinates
        computeSunriset: function(jDate, geoCoords) {
            var julianCycle        = Math.round((jDate - 2451545 - 0.0009) + (geoCoords.longitude / 360)),
                solar_noon         = 2451545 + 0.0009 - (geoCoords.longitude / 360) + julianCycle,
                solar_mean_anomaly = (357.5291 + 0.98560028 * (solar_noon - 2451545)) % 360,
                equation_of_center = (1.9148 * Math.sin(toRadians(solar_mean_anomaly))) +
                                     (0.0200 * Math.sin(toRadians(2 * solar_mean_anomaly))) +
                                     (0.0003 * Math.sin(toRadians(3 * solar_mean_anomaly))),
                ecliptic_longitude = (solar_mean_anomaly + 102.9372 + equation_of_center + 180) % 360,
                solar_transit      = solar_noon +
                                     (0.0053 * Math.sin(toRadians(solar_mean_anomaly))) -
                                     (0.0069 * Math.sin(toRadians(2 * ecliptic_longitude))),
                declination_of_sun = toDegrees(Math.asin(
                                       Math.sin(toRadians(ecliptic_longitude)) *
                                       Math.sin(toRadians(23.45))
                                     )),
                hour_angle         = toDegrees(Math.acos(
                                       (Math.sin(toRadians(-0.83)) - Math.sin(toRadians(geoCoords.latitude)) * Math.sin(toRadians(declination_of_sun))) /
                                       (Math.cos(toRadians(geoCoords.latitude)) * Math.cos(toRadians(declination_of_sun)))
                                     )),
                julian_hour_angle  = 2451545 + 0.0009 + ((hour_angle - geoCoords.longitude) / 360) + julianCycle,
                sunset             = julian_hour_angle +
                                     (0.0053 * Math.sin(toRadians(solar_mean_anomaly))) -
                                     (0.0069 * Math.sin(toRadians(2 * ecliptic_longitude))),
                sunrise            = solar_transit - (sunset - solar_transit);

            // ** Manual time offset correction applied **
            // Possible timezone issue?
            return {
                sunrise: { date: sunrise - this.solar.sunrise.duration / 1440 - 0.125, duration: this.solar.sunrise.duration },
                sunset : { date: sunset - this.solar.sunset.duration / 1440 - 0.125,   duration: this.solar.sunset.duration  },

                next_update: Math.floor(jDate) + 0.7063657403923571 + (jDate % 1 < 0.7063657403923571 ? 0 : 1) // 0.7063657403923571 JD = 4:57:10
            };

            //console.log('----- computeSunriset() -----');
            //console.log('Sunrise: ' + this.convertJulianToGregorian(this.solar.sunrise.date).toString());
            //console.log('Sunset : ' + this.convertJulianToGregorian(this.solar.sunset.date).toString());
            //console.log('Next computeSunriset() at: ' + this.convertJulianToGregorian(this.solar.next_update).toString());
        }, // End computeSunriset

        /**
         *  Compute the solstices, equinoxes, and current season based on specified specified date
         *
         *  NOTE: This algorithm has no creditable source (or at least that I can find); it was
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
        computeSeasons: function(gDate, geoCoords) {
            // Estimated bound for solstice and equinox dates
            // TODO: Account for arbitrary latitudes (for polar day and polar night)
            var jDate_vernal_min   = this.convertGregorianToJulian({year: gDate.year, month:  3, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // March 20
                jDate_vernal_max   = jDate_vernal_min + 3, // March 23
                jDate_estival_min  = this.convertGregorianToJulian({year: gDate.year, month:  6, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // June 20
                jDate_estival_max  = jDate_estival_min + 3, // June 23
                jDate_autumnal_min = this.convertGregorianToJulian({year: gDate.year, month:  9, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // September 20
                jDate_autumnal_max = jDate_autumnal_min + 3, // September 23
                jDate_hibernal_min = this.convertGregorianToJulian({year: gDate.year, month: 12, day: 20, hour: 12, minute: 0, second: 0, millisecond: 0}), // December 20
                jDate_hibernal_max = jDate_hibernal_min + 3; // December 23

            var jDate_vernal_equinox    = -1, v_day_length = 1,
                jDate_estival_solstice  = -1, e_day_length = 0,
                jDate_autumnal_equinox  = -1, a_day_length = 1,
                jDate_hibernal_solstice = -1, h_day_length = 1,
                day_length;

            // Compute vernal equinox
            for(var v = jDate_vernal_min; v <= jDate_vernal_max; v++) {
                day_length = this.computeSunriset(v, geoCoords);

                if(day_length.sunset.date - day_length.sunrise.date < v_day_length) {
                    jDate_vernal_equinox = v;
                    v_day_length = day_length.sunset.date - day_length.sunrise.date;
                }
            }

            // Compute estival solstice
            for(var e = jDate_estival_min; e <= jDate_estival_max; e++) {
                day_length = this.computeSunriset(e, geoCoords);

                if(day_length.sunset.date - day_length.sunrise.date > e_day_length) {
                    jDate_estival_solstice = e;
                    e_day_length = day_length.sunset.date - day_length.sunrise.date;
                }
            }

            // Compute autumnal equinox
            for(var a = jDate_autumnal_min; a <= jDate_autumnal_max; a++) {
                day_length = this.computeSunriset(a, geoCoords);

                if(day_length.sunset.date - day_length.sunrise.date < a_day_length) {
                    jDate_autumnal_equinox = a;
                    a_day_length = day_length.sunset.date - day_length.sunrise.date;
                }
            }

            // Compute hibernal solstice
            for(var h = jDate_hibernal_min; h <= jDate_hibernal_max; h++) {
                day_length = this.computeSunriset(h, geoCoords);

                if(day_length.sunset.date - day_length.sunrise.date < h_day_length) {
                    jDate_hibernal_solstice = h;
                    h_day_length = day_length.sunset.date - day_length.sunrise.date;
                }
            }

            // Determine current season based on current date relative to solstices and equinoxs
            var jDate = this.convertGregorianToJulian(gDate);
            if(jDate < jDate_vernal_equinox || jDate >= jDate_hibernal_solstice)
                this.season_state = 3;
            else if(jDate < jDate_estival_solstice)
                this.season_state = 0;
            else if(jDate < jDate_autumnal_equinox)
                this.season_state = 1;
            else if(jDate < jDate_hibernal_solstice)
                this.season_state = 2;

            return {
                vernal_equinox   : jDate_vernal_equinox,
                estival_solstice : jDate_estival_solstice,
                autumnal_equinox : jDate_autumnal_equinox,
                hibernal_solstice: jDate_hibernal_solstice
            };
        }, // End computeSeasons
    }); // End ig.Atmosphere
    //#########################################################################

    /**
     *  Perlin Noise Generator
     *  -----
     *  My modifications: Minor code adaptation for use in ImpactJS. Algorithm remains unmodified.
     *  Ken Perlin's original Java implementation: http://cs.nyu.edu/~perlin/noise
     *  Kas Thomas's JavaScript port: http://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html
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

            for(var i = 0; i < 256; i++)
                p[256+i] = p[i] = permutation[i];

                var X = Math.floor(x) & 255,
                    Y = Math.floor(y) & 255,
                    Z = Math.floor(z) & 255;

                x -= Math.floor(x);
                y -= Math.floor(y);
                z -= Math.floor(z);

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

    // Rain particle
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
            } else if(this.pos.x > ig.game.screen.x + ig.system.width)
                this.pos.x = ig.game.screen.x;
            else if(this.pos.x < ig.game.screen.x)
                this.pos.x = ig.game.screen.x + ig.system.width;
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

        handleMovementTrace: function(res) {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    }); // End EntityRain

    // Snow particle
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
            } else if(this.pos.x > ig.game.screen.x + ig.system.width)
                this.pos.x = ig.game.screen.x;
            else if(this.pos.x < ig.game.screen.x)
                this.pos.x = ig.game.screen.x + ig.system.width;
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

        handleMovementTrace: function(res) {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    }); // End EntitySnow

    // End particles
    //#########################################################################


    //#########################################################################
    // Utility Functions

    // Convert degrees to radians
    var toRadians = function(deg) { return deg * Math.PI / 180; };

    // Convert radians to degrees
    var toDegrees = function(rad) { return rad * 180 / Math.PI; };

    // End utility functions
    //#########################################################################
});
