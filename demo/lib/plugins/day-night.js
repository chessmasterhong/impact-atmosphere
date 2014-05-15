/**
 *  day-night.js
 *  -----
 *  Impact Day/Night Cycle Plugin
 *  https://github.com/chessmasterhong/impact-day-night
 *
 *  Kevin Chan (chessmasterhong)
 *
 *  A plugin for the Impact game engine that simulates day/night cycles based
 *  on configurable time of day, day of year, and geographical coordinates.
 *
 *  Based on:
 *      http://aa.quae.nl/en/reken/juliaansedag.html
 *      http://aa.quae.nl/en/reken/zonpositie.html
 *      http://aa.usno.navy.mil/data/docs/JulianDate.php
 *      http://calendars.wikia.com/wiki/Julian_day_number
 *      http://users.electromagnetic.net/bu/astro/sunrise-set.php
 *      http://www.esrl.noaa.gov/gmd/grad/solcalc
 */


ig.module(
    'plugins.day-night'
)
.requires(
    'impact.game'
)
.defines(function() {
    "use strict";

    ig.DayNight = ig.Game.extend({
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
        geo_coord: {latitude: 40.7789, longitude: -73.9675},

        sunriset_next_update: 0,
        solar: {
            //dusk   : {hour:  0, minute: 0, duration:  0},
            sunrise: {date: 0, duration: 60},
            noon   : {date: 0, duration:  0},
            sunset : {date: 0, duration: 60}
        },

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
            this.update_rate = update_rate;
            this.updateTimer = new ig.Timer(this.update_rate);
            this.timescale = timescale;

            console.log('========== Impact Day/Night Cycle Plugin initialized ==========');
            console.log('Update rate: ' + update_rate + ' seconds');
            console.log('Timescale: ' + this.timescale + 'x real time');
            console.log('Geographical coordinates: (Lat: ' + this.geo_coord.latitude + ', Lng: ' + this.geo_coord.longitude + ')');
            console.log('Current: ' + this.convertGregorianToJulian(this.gregorianDate.year, this.gregorianDate.month, this.gregorianDate.day, this.gregorianDate.hour, this.gregorianDate.minute, this.gregorianDate.second));
            console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate.year, this.gregorianDate.month, this.gregorianDate.day, this.gregorianDate.hour, this.gregorianDate.minute, this.gregorianDate.second)).toString());

            this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate.year, this.gregorianDate.month, this.gregorianDate.day, this.gregorianDate.hour, this.gregorianDate.minute, this.gregorianDate.second), this.geo_coord);
        }, // End init
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Update
        update: function() {
            //this.parent();

            if(this.updateTimer.delta() >= 0) {
                this.updateTimer.reset();

                // Update and recalculate time
                //console.log('----- ' + this.update_rate + ' seconds elapsed, date/time updated -----');
                this.updateDateTime(this.gregorianDate, this.timescale);
                //console.log('Current: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate.year, this.gregorianDate.month, this.gregorianDate.day, this.gregorianDate.hour, this.gregorianDate.minute, this.gregorianDate.second)).toString());
            }
        }, // End update
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Draw
        draw: function() {
            //this.parent();

            var jDate_curr = this.convertGregorianToJulian(
                    this.gregorianDate.year,
                    this.gregorianDate.month,
                    this.gregorianDate.day,
                    this.gregorianDate.hour,
                    this.gregorianDate.minute,
                    this.gregorianDate.second
                );

            if(jDate_curr >= this.sunriset_next_update) {
                console.log('----- Time to recompute sunriset -----');
                console.log('New date/time: ' + this.convertJulianToGregorian(this.convertGregorianToJulian(this.gregorianDate.year, this.gregorianDate.month, this.gregorianDate.day, this.gregorianDate.hour, this.gregorianDate.minute, this.gregorianDate.second)).toString());
                this.computeSunriset(this.convertGregorianToJulian(this.gregorianDate.year, this.gregorianDate.month, this.gregorianDate.day, this.gregorianDate.hour, this.gregorianDate.minute, this.gregorianDate.second), this.geo_coord);
            }

            if(jDate_curr >= this.solar.sunrise.date && jDate_curr < this.solar.sunset.date) {
                // Sun is up
                // (0.0006944444444444 = 1 JD / 1440 mins -> mins to JD)
                if(jDate_curr >= this.solar.sunrise.date + this.solar.sunrise.duration * 0.0006944444444444) {
                    // Sun has risen
                    //console.log('Sun has risen');
                    this.sun_state = 1;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, 0)';
                } else {
                    // Sun is rising
                    //console.log('Sun is rising');
                    this.sun_state = 0;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, ' + (this.brightness_night - this.brightness_night * (jDate_curr - this.solar.sunrise.date) / (this.solar.sunrise.duration * 0.0006944444444444)) + ')';
                }
            } else {
                // Sun is down, handle new day hour wraparound
                // (0.0006944444444444 = 1 JD / 1440 mins -> mins to JD)
                if(jDate_curr >= this.solar.sunset.date + this.solar.sunset.duration * 0.0006944444444444 || (jDate_curr % 1 >= 0.5 && jDate_curr < this.sunriset_next_update)) {
                    // Sun has set
                    //console.log('Sun has set');
                    this.sun_state = 3;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, ' + this.brightness_night + ')';
                } else {
                    // Sun is setting
                    //console.log('Sun is setting');
                    this.sun_state = 2;
                    ig.system.context.fillStyle = 'rgba(0, 0, 0, ' + (this.brightness_night * (jDate_curr - this.solar.sunset.date) / (this.solar.sunset.duration * 0.0006944444444444)) + ')';
                }
            }

            ig.system.context.fillRect(0, 0, ig.system.realWidth, ig.system.realHeight);
        }, // End draw
        //---------------------------------------------------------------------

        // Set/Store date and time
        setDateTime: function(datetime) {
            this.gregorianDate = {
                year: datetime.getFullYear(),
                month: datetime.getMonth() + 1,
                day: datetime.getDate(),
                hour: datetime.getHours(),
                minute: datetime.getMinutes(),
                second: datetime.getSeconds()
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
                this.gregorianDate.second
            );
        }, // End getDateTime

        // Update stored date and time
        updateDateTime: function(datetime, timescale) {
            this.gregorianDate = {
                year:   datetime.year,  // TODO: Handle overflow months into years
                month:  datetime.month, // TODO: Handle overflow days into months
                day:    datetime.day    + this.update_rate * (parseInt(timescale / 86400, 10) % 60),
                hour:   datetime.hour   + this.update_rate * (parseInt(timescale /  3600, 10) % 60),
                minute: datetime.minute + this.update_rate * (parseInt(timescale /    60, 10) % 60),
                second: datetime.second + this.update_rate *  parseInt(timescale %    60, 10)
            };
        }, // End updateDateTime

        // Convert Gregorian Date to Julian Date
        convertGregorianToJulian: function(gYear, gMonth, gDay, gHour, gMinute, gSecond) {
            var a = Math.floor((gMonth - 3) / 12),
                b = gYear + a,
                c = Math.floor(b / 100),
                d = b % 100,
                e = gMonth - 12 * a - 3,
                J = Math.floor(146097 * c / 4) +
                    Math.floor(36525 * d / 100) +
                    Math.floor((153 * e + 2) / 5) +
                    gDay + 1721119 +
                    (gHour - 12) / 24 +
                    gMinute / 1440 +
                    gSecond / 86400;

            //console.log('Julian: ' + J);
            return J;
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
                Y = 100 * g + i + l,
                M = k - 12 * l + 3,
                D = Math.floor((j % 153) / 5), // Math.floor((j % 153) / 5) + 1
                H = Math.floor(t / 0.0416666666666667) + 12,
                N = Math.floor((t % 0.0416666666666667) / 0.0006944444444444),
                S = Math.floor((t % 0.00002893518518528336) / 0.00001157407407407407);

            //console.log('Gregorian: ' + Y + '-' + M + '-' + D + ' ' + H + ':' + N + ':' + S);
            return new Date(Y, M - 1, D, H, N, S);
        }, // End convertJulianToGregorian

        // Computes sunrise and sunset for specified date and geographical coordinates
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
            this.solar.sunrise.date = sunrise - 0.0006944444444444 * this.solar.sunrise.duration - 0.125,
            this.solar.noon.date    = solar_noon + 0.875,
            this.solar.sunset.date  = sunset - 0.0006944444444444 * this.solar.sunset.duration - 0.125;

            console.log('----- computeSunriset() -----');
            console.log('Sunrise: ' + this.convertJulianToGregorian(this.solar.sunrise.date).toString());
            console.log('Noon   : ' + this.convertJulianToGregorian(this.solar.noon.date).toString());
            console.log('Sunset : ' + this.convertJulianToGregorian(this.solar.sunset.date).toString());

            this.sunriset_next_update = Math.floor(jDate) + 0.7063657403923571 + (jDate % 1 < 0.7063657403923571 ? 0 : 1); // 0.7063657403923571 JD = 4:57:10
            console.log('Next computeSunriset() at: ' + this.convertJulianToGregorian(this.sunriset_next_update).toString());
        }, // End computeSunriset

        //computeSeasons: function() {
            // TODO
        //}, // End computeSeasons

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
