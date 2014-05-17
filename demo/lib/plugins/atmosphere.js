/**
 *  atmosphere.js
 *  -----
 *  Impact Atmospheric System Plugin
 *  https://github.com/chessmasterhong/impact-atmosphere
 *
 *  Kevin Chan (chessmasterhong)
 *
 *  A plugin for the Impact game engine that simulates an atmospheric weather
 *  system (add-on), day/night cycles and seasonal cycles based on configurable
 *  date, time, and geographical coordinates.
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

        // "Brightness" of nights
        // Greater values yields darker nights
        // 0 = no change compared to day brightness, 1 = pitch black
        brightness_night: 0.65,

        //---------------------------------------------------------------------
        // Init
        init: function(datetime, update_rate, timescale) {
            // ----- Begin sanity checks -----
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

            if(typeof update_rate !== 'undefined') {
                if(typeof update_rate === 'number') {
                    if(update_rate <= 0) {
                        console.warn('update_rate \'' + update_rate + '\' not a positive integer. Assuming update_rate absolute value.');
                        update_rate = Math.abs(update_rate);
                    }
                } else {
                    console.warn('update_rate \'' + update_rate + '\' not a number. Typecasting update_rate to integer.');
                    update_rate = Number(update_rate);
                }
            } else {
                //console.warn('update_rate not provided. Defaulting update_rate to 60.');
                update_rate = this.update_rate;
            }

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
                timescale = this.timescale;
            }
            // ----- End sanity checks -----

            this.setDateTime(datetime);
            this.updateUpdateRate(update_rate);
            this.timescale = timescale;

            //console.log('========== Impact Atmospheric System Plugin initialized ==========');
            //console.log('Update rate: ' + update_rate + ' seconds');
            //console.log('Timescale: ' + this.timescale + 'x real time');
            //console.log('Geographical coordinates: (Lat: ' + this.geo_coords.latitude + ', Lng: ' + this.geo_coords.longitude + ')');
            //console.log('Current: ' + this.convertGregorianToJulian(this.gregorianDate) + ' JD');
            //console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate)).toString());

            this.season = this.computeSeasons(this.gregorianDate, this.geo_coords);
            this.solar = this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate), this.geo_coords);
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

            // ----- Begin debug -----
            if(this.debug) {
                var x = 0,
                    y = 0;

                ig.system.context.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ig.system.context.fillRect(
                    x += 5,
                    y += 5,
                    ig.system.realWidth - 2 * x,
                    190
                );

                ig.system.context.font = '11px monospace';
                ig.system.context.textBaseline = 'top';
                ig.system.context.fillStyle = '#ffffff';

                ig.system.context.fillText('========== Impact Atmospheric System Plugin ==========', x += 5, y += 5);

                ig.system.context.fillText('Update rate: ' + this.update_rate + ' seconds', x, y += 15);
                ig.system.context.fillText('Timescale: ' + this.timescale + 'x real time', x, y += 10);

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
            }
            // ----- End debug -----
        }, // End draw
        //---------------------------------------------------------------------

        // Set/Store date and time
        setDateTime: function(datetime) {
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

        updateUpdateRate: function(new_update_rate) {
            this.update_rate = new_update_rate;
            this.updateTimer = new ig.Timer(new_update_rate);
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
                equation_of_center = (1.9148 * Math.sin(this.toRadians(solar_mean_anomaly))) +
                                     (0.0200 * Math.sin(this.toRadians(2 * solar_mean_anomaly))) +
                                     (0.0003 * Math.sin(this.toRadians(3 * solar_mean_anomaly))),
                ecliptic_longitude = (solar_mean_anomaly + 102.9372 + equation_of_center + 180) % 360,
                solar_transit      = solar_noon +
                                     (0.0053 * Math.sin(this.toRadians(solar_mean_anomaly))) -
                                     (0.0069 * Math.sin(this.toRadians(2 * ecliptic_longitude))),
                declination_of_sun = this.toDegrees(Math.asin(
                                       Math.sin(this.toRadians(ecliptic_longitude)) *
                                       Math.sin(this.toRadians(23.45))
                                     )),
                hour_angle         = this.toDegrees(Math.acos(
                                       (Math.sin(this.toRadians(-0.83)) - Math.sin(this.toRadians(geoCoords.latitude)) * Math.sin(this.toRadians(declination_of_sun))) /
                                       (Math.cos(this.toRadians(geoCoords.latitude)) * Math.cos(this.toRadians(declination_of_sun)))
                                     )),
                julian_hour_angle  = 2451545 + 0.0009 + ((hour_angle - geoCoords.longitude) / 360) + julianCycle,
                sunset             = julian_hour_angle +
                                     (0.0053 * Math.sin(this.toRadians(solar_mean_anomaly))) -
                                     (0.0069 * Math.sin(this.toRadians(2 * ecliptic_longitude))),
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

        // Compute the solstices, equinoxes, and current season based on specified specified date
        //
        // NOTE: This algorithm has no creditable source (or at least that I can find); it was
        //       something I made up. I was trying to find some form of mathematical equation to
        //       compute solstices and equinoxes but with no luck. So, I used various tiny bits of
        //       information gathered from various sources along with general knowledge and
        //       constructed my own algorithm. I then compared the final results against some
        //       precomputed tables of solstices and equinoxes, with some degree of inaccuracy.
        //
        // General Algorithm Outline:
        //      0. Information gathering and assumptions
        //          a. Assume day length (sunrise - sunset) can be computed for arbitrary days.
        //          b. Assume vernal equinox occurs between March 20 and March 23.
        //             Assume estival solstice occurs between June 20 and June 23.
        //             Assume autumnal equinox occurs between September 20 and September 23.
        //             Assume hibernal solstice occurs between December 20 and December 23.
        //      1. Computation of vernal equinox
        //          a. For each potential day of vernal equinox, compute day length.
        //          b. Of all potential days of vernal equinox, take the day where day length is
        //             closest to 12 hours. This day is the vernal equinox.
        //             This is because:
        //                 vernal equinox: day length = night length
        //                 day length - night length = 12 hours - 12 hours = 0 (or as close to 0 as possible)
        //      2. Computation of estival solstice
        //          a. For each potential day of estival solstice, compute day length.
        //          b. Of all potential days of estival solstice, take the day where day length is
        //             greatest. This day is the estival solstice.
        //             This is because:
        //                 estival solstice: longest day
        //                 longest day = greatest day length
        //      3. Computation of autumnal equinox
        //          a. For each potential day of autumnal equinox, compute day length.
        //          b. Of all potential days of autumnal equinox, take the day where day length is
        //             closest to 12 hours. This day is the autumnal equinox.
        //             This is because:
        //                 autumnal equinox: day length = night length
        //                 day length - night length = 12 hours - 12 hours = 0 (or as close to 0 as possible)
        //      4. Computation of hibernal solstice
        //          a. For each potential day of hibernal solstice, compute day length.
        //          b. Of all potential days of hibernal solstice, take the day where day length is
        //             least value. This day is the hibernal solstice.
        //             This is because:
        //                 hibernal solstice: shortest day
        //                 shortest day = least day length
        //      5. Computation of current season
        //         Once solstices and equinoxes are determined, take current date (and time) and
        //         compare it against solstices and equinoxes.
        //          a. If current date falls between vernal equinox (inclusive) and estival
        //             solstice (exclusive), current date is in vernal season (Spring).
        //          b. If current date falls between estival solstice (inclusive) and autumnal
        //             equinox (exclusive), current date is in estival season (Summer).
        //          c. If current date falls between autumnal equinox (inclusive) and hibernal
        //             solstice (exclusive), current date is in autumnal season (Autumn).
        //          d. If current date falls between hibernal solstice (inclusive) and vernal
        //             equinox (exclusive), current date is in hibernal season (Winter).
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

        //---------------------------------------------------------------------
        // Utility Functions

        // Convert degrees to radians
        toRadians: function(deg) {
            return deg * Math.PI / 180;
        },

        // Convert radians to degrees
        toDegrees: function(rad) {
            return rad * 180 / Math.PI;
        }

        // End utility functions
        //---------------------------------------------------------------------
    });
});
