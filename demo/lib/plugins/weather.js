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
        condition: 0, // 0 = clear, 1 = rain, 2 = snow

        count: 100,

        //---------------------------------------------------------------------
        // Init
        init: function() {
            this.nextParticle = new ig.Timer();
        }, // End init
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Update
        update: function() {
            if(this.nextParticle.delta() >= 0 && this.count > 0) {
                this.count--;
                this.nextParticle.set(1 / this.count);
                ig.game.spawnEntity(
                    EntitySnow,
                    Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                    ig.game.screen.y
                );
            }
        }, // End update
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Draw
        draw: function() {
            // TODO
        } // End draw
        //---------------------------------------------------------------------
    });

    var EntitySnow = ig.Entity.extend({
        size: {x: 3, y: 3},
        vel: {x: 60, y: 80},
        //maxVel: {x: 100, y: 100},

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
            // No this.parent(); draw once and leave it alone

            // Draw snow
            ig.system.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ig.system.context.beginPath();
            ig.system.context.arc(
                this.pos.x + this.size.x / 2,
                this.pos.y + this.size.y / 2,
                this.size.x / 2,
                0,
                2 * Math.PI
            );
            ig.system.context.fill();
        },

        handleMovementTrace: function(res) {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    });
});
