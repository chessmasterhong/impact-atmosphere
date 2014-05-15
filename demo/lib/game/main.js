/**
 *  main.js
 *  -----
 */


ig.module(
    'game.main'
)
.requires(
    'impact.game',
    'game.levels.demo',
    'game.levels.demo2',
    'plugins.day-night'
)
.defines(function() {
    var MainGame = ig.Game.extend({
        debug: true,

        init: function() {
            // Initialize Day/Night Cycle Plugin
            // Start from current date and time, updating every 0.5 seconds, running at 600x real time
            this.daynight = new ig.DayNight(new Date(), 0.5, 600);

            ig.input.bind(ig.KEY.MOUSE1, 'click');

            //this.loadLevel(LevelDemo);
            this.loadLevel(LevelDemo2);
        },

        update: function() {
            this.parent();

            if(ig.input.pressed('click'))
                this.debug = !this.debug;

            this.daynight.update();
        },

        draw: function() {
            this.parent();

            this.daynight.draw();

            // ----- Begin custom debug -----
            if(this.debug) {
                var ctx = ig.system.context,
                    dn = this.daynight,
                    x = 0,
                    y = 0;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(
                    x += 5,
                    y += 5,
                    ig.system.realWidth - 2 * x,
                    140
                );

                ctx.fillStyle = 'white';
                ctx.font = '11px monospace';
                ctx.textBaseline = 'top';

                ctx.fillText('===== Impact Day/Night Cycle Plugin initialized =====', x += 5, y += 5);

                ctx.fillText('Update rate: ' + dn.update_rate + ' seconds', x, y += 15);
                ctx.fillText('Timescale: ' + dn.timescale + 'x real time', x, y += 10);

                ctx.fillText('Geographical coordinates: (Lat: ' + dn.geo_coord.latitude + ', Lng: ' + dn.geo_coord.longitude + ')', x, y += 15);

                ctx.fillStyle = 'yellow';
                ctx.fillText('Current: ' + dn.convertJulianToGregorian(dn.convertGregorianToJulian(
                    dn.gregorianDate.year, dn.gregorianDate.month, dn.gregorianDate.day,
                    dn.gregorianDate.hour, dn.gregorianDate.minute, dn.gregorianDate.second
                )).toString(), x, y += 15);
                ctx.fillText('Sun state: The sun ' + (dn.sun_state === 0 ? 'is rising' : dn.sun_state === 1 ? 'has risen' : dn.sun_state === 2 ? 'is setting' : dn.sun_state === 3 ? 'has set' : '<invalid>'), x, y += 10);

                ctx.fillStyle = 'white';
                ctx.fillText('Sunrise: ' + dn.convertJulianToGregorian(dn.solar.sunrise.date).toString(), x, y += 15);
                ctx.fillText('Noon   : ' + dn.convertJulianToGregorian(dn.solar.noon.date).toString(), x, y += 10);
                ctx.fillText('Sunset : ' + dn.convertJulianToGregorian(dn.solar.sunset.date).toString(), x, y += 10);

                ctx.fillText('Next sunriset update: ' + dn.convertJulianToGregorian(dn.sunriset_next_update).toString(), x, y += 15);
            }
            // ----- End custom debug -----
        }
    });

    ig.main('#canvas', MainGame, 60, 640, 480, 1);
});
