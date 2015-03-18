/**
 *  @fileOverview Debug module for the Impact Atmospheric System Plugin.
 *  @author Kevin Chan {@link https://github.com/chessmasterhong|(chessmasterhong)}
 *  @license {@link https://github.com/chessmasterhong/impact-atmosphere/blob/master/LICENCE|MIT License}
 */


ig.module(
    'plugins.atmosphere-debug'
)
.requires(
    'plugins.atmosphere'
)
.defines(function() {
    'use strict';

    ig.Atmosphere.inject({
        debug: true,

        draw: function() {
            this.parent();

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
                ig.system.context.fillText('Update rate: ' + this.updateRate + (this.updateRate <= 1 ? ' second' : ' seconds'), x, y += 10);

                ig.system.context.fillText('Geographical coordinates: (Lat: ' + this.geoCoords.latitude + ', Lng: ' + this.geoCoords.longitude + ')', x, y += 15);

                ig.system.context.fillStyle = '#ffff00';
                ig.system.context.fillText('Current: ' + this.convertJulianToGregorian(this.julianDate).toString() + ' | ' + this.julianDate.toFixed(8) + ' JD', x, y += 15);
                ig.system.context.fillText('Sun state: The sun ' + (
                    this.sunState === 0 ? 'is rising' :
                    this.sunState === 1 ? 'has risen' :
                    this.sunState === 2 ? 'is setting' :
                    this.sunState === 3 ? 'has set' :
                    '<invalid sun state>'
                ), x, y += 15);

                ig.system.context.fillText('Ambient illumination color: (r: ' + this.sky.r.toFixed(4) + ', g: ' + this.sky.g.toFixed(4) + ', b: ' + this.sky.b.toFixed(4) + ', a: ' + this.sky.a.toFixed(4) + ')', x, y += 15);

                ig.system.context.fillStyle = '#ffffff';
                ig.system.context.fillText('Sunrise: ' + this.convertJulianToGregorian(this.solar.sunrise.date).toString() + ' | ' + this.solar.sunrise.date.toFixed(8) + ' JD', x, y += 15);
                ig.system.context.fillText('Sunset : ' + this.convertJulianToGregorian(this.solar.sunset.date).toString() + ' | ' + this.solar.sunset.date.toFixed(8) + ' JD', x, y += 10);

                ig.system.context.fillText('Next sunriset update: ' + this.convertJulianToGregorian(this.solar.nextUpdate).toString(), x, y += 15);

                ig.system.context.fillStyle = '#ffff00';
                ig.system.context.fillText('Season state: ' + (
                    this.seasonState === 0 ? 'Spring/Vernal' :
                    this.seasonState === 1 ? 'Summer/Estival' :
                    this.seasonState === 2 ? 'Autumn/Autumnal' :
                    this.seasonState === 3 ? 'Winter/Hibernal' :
                    '<invalid season state>'
                ), x, y += 15);

                ig.system.context.fillStyle = '#ffffff';
                ig.system.context.fillText('Spring : ' + this.convertJulianToGregorian(this.season.vernalEquinox).toString() + ' | ' + this.season.vernalEquinox.toFixed(8) + ' JD', x, y += 15);
                ig.system.context.fillText('Summer : ' + this.convertJulianToGregorian(this.season.estivalSolstice).toString() + ' | ' + this.season.estivalSolstice.toFixed(8) + ' JD', x, y += 10);
                ig.system.context.fillText('Autumn : ' + this.convertJulianToGregorian(this.season.autumnalEquinox).toString() + ' | ' + this.season.autumnalEquinox.toFixed(8) + ' JD', x, y += 10);
                ig.system.context.fillText('Winter : ' + this.convertJulianToGregorian(this.season.hibernalSolstice).toString() + ' | ' + this.season.hibernalSolstice.toFixed(8) + ' JD', x, y += 10);

                var wc = 'Clear';
                if(this.weatherCondition.rain || this.weatherCondition.snow || this.weatherCondition.fog) {
                    wc = '';
                    if(this.weatherCondition.rain)      { wc += 'Rain ';      }
                    if(this.weatherCondition.snow)      { wc += 'Snow ';      }
                    if(this.weatherCondition.lightning) { wc += 'Lightning '; }
                    if(this.weatherCondition.fog)       { wc += 'Fog ';       }
                }

                ig.system.context.fillStyle = '#ffff00';
                ig.system.context.fillText('Weather condition: ' + wc, x, y += 15);

                ig.system.context.fillStyle = '#ffffff';
                ig.system.context.fillText('Maximum Particle Count: ' + this.particlesMax, x, y += 15);
                ig.system.context.fillText('Current Particle Count: ' + this.particlesCurr, x, y += 10);

                //if(this.weatherCondition.fog) {
                //    ig.system.context.fillText('Fog block size: ' + size + 'px * ' + size + 'px', x, y += 15);
                //    ig.system.context.fillText('Fog block iterations: ' + Math.ceil(ig.system.width / size) + ' * ' + Math.ceil(ig.system.height / size) + ' = ' + Math.ceil((ig.system.width * ig.system.height) / (size * size)), x, y += 10);
                //}
            }
        }
    });
});
