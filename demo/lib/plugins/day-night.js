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
        // Time speed multiplier (1 = real time, 2 = 2x real time, 0.5 = 0.5x real time, etc.)
        timescale: 1,

        // Real time in seconds before auto-updating and recalculating time
        update_rate: 60,

        // Geographical coordinate system
        geo_coord: {latitude: 40.7789, longitude: 73.9675},

        solar: {
            dusk   : {hour:  0, minute: 0, duration:  0},
            sunrise: {hour:  6, minute: 0, duration: 60},
            noon   : {hour: 12, minute: 0, duration:  0},
            sunset : {hour: 18, minute: 0, duration: 60}
        },

        init: function(date, timescale, update_rate) {
            this.setDateTime(date);
            this.timescale = timescale;
            this.update_rate = new ig.Timer(update_rate);

            console.log(
                this.convertJulianToGregorian(
                    this.convertGregorianToJulian(
                        this.gregorianDate.year,
                        this.gregorianDate.month,
                        this.gregorianDate.day,
                        this.gregorianDate.hour,
                        this.gregorianDate.minute,
                        this.gregorianDate.second
                    )
                )
            );
        },

        update: function() {
            this.parent();

            // Update and recalculate time
            if(this.update_rate.delta() >= 0) {
                this.update_rate.reset();

                this.updateDateTime(this.gregorianDate, this.timescale);

                console.log(
                    this.convertJulianToGregorian(
                        this.convertGregorianToJulian(
                            this.gregorianDate.year,
                            this.gregorianDate.month,
                            this.gregorianDate.day,
                            this.gregorianDate.hour,
                            this.gregorianDate.minute,
                            this.gregorianDate.second
                        )
                    )
                );
            }
        },

        // Update stored date and time
        setDateTime: function(date) {
            this.gregorianDate = {
                year: date.getFullYear(),
                month: date.getMonth() + 1,
                day: date.getDate(),
                hour: date.getHours(),
                minute: date.getMinutes(),
                second: date.getSeconds()
            };
        },

        // Update stored date and time
        updateDateTime: function(date, timescale) {
            this.gregorianDate = {
                year: date.year, // TODO
                month: date.month, // TODO
                day: date.day + (parseInt(timescale / 86400) % 60),
                hour: date.hour + (parseInt(timescale / 3600) % 60),
                minute: date.minute + (parseInt(timescale / 60) % 60),
                second: date.second + parseInt(timescale % 60)
            };
        },

        // Convert Gregorian Date to Chronological Julian Day Number
        // http://aa.quae.nl/en/reken/juliaansedag.html#3_1
        // http://calendars.wikia.com/wiki/Julian_day_number#Calculation
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

            console.log('Julian: ' + J);
            return J;
        },

        // Convert Chronological Julian Day Number to Gregorian Date
        // http://aa.quae.nl/en/reken/juliaansedag.html#3_2
        // http://calendars.wikia.com/wiki/Julian_day_number
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
                D = Math.floor((j % 153) / 5) + 1,
                H = Math.floor(t / 0.0416666666666667),
                N = Math.floor((t % 0.0416666666666667) / 0.0006944444444444),
                S = Math.floor((t % 0.00002893518518528336) / 0.00001157407407407407);

            console.log('Gregorian: ' + Y + '-' + M + '-' + D + ' ' + H + ':' + N + ':' + S);
            return {year: Y, month: M, day: D};
        },

        // Convert degrees to radians
        toRadians: function(deg) {
            return deg * Math.PI / 180;
        },

        // Convert radians to degrees
        toDegrees: function(rad) {
            return rad * 180 / Math.PI;
        },

        draw: function() {
            this.parent();
        }
    });
});
