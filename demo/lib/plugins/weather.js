/**
 *  weather.js
 *  -----
 *  Impact Weather Add-on for the Impact Day/Night Cycle Plugin
 *  https://github.com/chessmasterhong/impact-day-night
 *
 *  Kevin Chan (chessmasterhong)
 *
 *  An add-on for the Impact Day/Night Cycle Plugin for the Impact game engine
 *  that simulates weather conditions.
 */


ig.module(
    'plugins.weather'
)
.requires(
    'impact.game'
)
.defines(function() {
    "use strict";

    ig.Weather = ig.Game.extend({
        // Set weather condition
        // 0 = clear, 1 = rain, 2 = snow, 3 = fog (EXPERIMENTAL!!)
        condition: 0,

        particles: {
            max: 100,
            curr: 0
        },

        //---------------------------------------------------------------------
        // Init
        init: function() {
        }, // End init
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Update
        update: function() {
            if(this.condition && typeof this.nextParticle === 'undefined')
                this.nextParticle = new ig.Timer();

            // Generate particles based on weather condition
            if(this.condition === 1) {
                // Rain
                if(this.nextParticle.delta() >= 0 && this.particles.curr < this.particles.max) {
                    this.particles.curr++;
                    this.nextParticle.set(1 / ig.system.height);
                    ig.game.spawnEntity(
                        EntityRain,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y
                    );
                } else
                    this.nextParticle.set(0);
            } else if(this.condition === 2) {
                // Snow
                if(this.nextParticle.delta() >= 0 && this.particles.curr < this.particles.max) {
                    this.particles.curr++;
                    this.nextParticle.set(1 / (this.particles.max - this.particles.curr));
                    ig.game.spawnEntity(
                        EntitySnow,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y
                    );
                } else
                    this.nextParticle.set(0);
            } else {
                if(this.particles.curr > 0 && this.nextParticle.delta() >= 0) {
                    var r = ig.game.getEntitiesByType(EntityRain)[0];
                    if(typeof r !== 'undefined') {
                        r.kill();
                        this.particles.curr--;
                    }

                    var s = ig.game.getEntitiesByType(EntitySnow)[0];
                    if(typeof s !== 'undefined') {
                        s.kill();
                        this.particles.curr--;
                    }

                    this.nextParticle.set(2 / this.particles.curr);
                }
            }
        }, // End update
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Draw
        draw: function() {

            if(this.condition === 3) {
                // Fog
                var r, g, b, size = 4;
                for(var x = ig.game.screen.x; x < ig.game.screen.x + ig.system.width; x += size) {
                    for(var y = ig.game.screen.y; y < ig.game.screen.y + ig.system.height; y += size) {
                        r = g = b = Math.round(255 * PerlinNoise.noise(size * x / ig.system.width, size * y / ig.system.height, 0.6));
                        ig.system.context.fillStyle = 'rgba(' + r + ', ' + g + ', ' + b + ', 0.3)';
                        ig.system.context.fillRect(x, y, size, size);
                    }
                }
            }
        } // End draw
        //---------------------------------------------------------------------
    });

    //#########################################################################
    // Particles
    var EntityRain = ig.Entity.extend({
        vel: {x: 20, y: 400},
        maxVel: {x: 100, y: 400},

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Randomize initial velocity
            //this.vel.x *= Math.random() * 2 - 1;
            //this.vel.y *= Math.abs(Math.random() * 2 - 1); // Rain should not "fall" upwards...
        },

        update: function() {
            this.parent();

            // Handle entity moving out of screen bounds
            // Wraparound to opposite side of screen
            if(this.pos.y > ig.game.screen.y + ig.system.height)
               this.pos.y = ig.game.screen.y;
            else if(this.pos.x > ig.game.screen.x + ig.system.width)
                this.pos.x = ig.game.screen.x;
            else if(this.pos.x < ig.game.screen.x)
                this.pos.x = ig.game.screen.x + ig.system.width;
        },

        draw: function() {
            // Draw rain
            ig.system.context.strokeStyle = 'rgba(200, 200, 200, 0.6)';
            ig.system.context.beginPath();
            ig.system.context.moveTo(this.pos.x, this.pos.y);
            ig.system.context.lineTo(this.pos.x + this.vel.x * 0.05, this.pos.y + this.vel.y * 0.025);
            ig.system.context.closePath();
            ig.system.context.stroke();
        },

        handleMovementTrace: function(res) {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    }); // End EntityRain

    var EntitySnow = ig.Entity.extend({
        vel: {x: 60, y: 80},
        maxVel: {x: 100, y: 100},

        radius: 1.5,

        init: function(x, y, settings) {
            this.parent(x, y, settings);

            // Randomize initial velocity
            this.vel.x *= Math.random() * 2 - 1;
            this.vel.y *= Math.abs(Math.random() * 2 - 1); // Snow should not "fall" upwards...
        },

        update: function() {
            this.parent();

            // Handle entity moving out of screen bounds
            // Wraparound to opposite side of screen
            if(this.pos.y > ig.game.screen.y + ig.system.height)
               this.pos.y = ig.game.screen.y;
            else if(this.pos.x > ig.game.screen.x + ig.system.width)
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

    // Perlin Noise Generator
    //
    // My modifications: Minor code adaptation for use in ImpactJS. Algorithm remains unmodified.
    // Ken Perlin's original Java implementation: http://cs.nyu.edu/~perlin/noise
    // Kas Thomas's JavaScript port: http://asserttrue.blogspot.com/2011/12/perlin-noise-in-javascript_31.html
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
    };
});
