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
        condition: 1, // 0 = clear, 1 = rain, 2 = snow

        max_particles: 100,

        //---------------------------------------------------------------------
        // Init
        init: function() {
            if(this.condition)
                this.nextParticle = new ig.Timer();
        }, // End init
        //---------------------------------------------------------------------

        //---------------------------------------------------------------------
        // Update
        update: function() {
            // Generate particles based on weather condition
            if(this.condition === 1) {
                // Rain
                if(this.nextParticle.delta() >= 0 && this.max_particles > 0) {
                    this.max_particles--;
                    this.nextParticle.set(1 / ig.system.height);
                    ig.game.spawnEntity(
                        EntityRain,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y
                    );
                }
            } else if(this.condition === 2) {
                // Snow
                if(this.nextParticle.delta() >= 0 && this.max_particles > 0) {
                    this.max_particles--;
                    this.nextParticle.set(1 / this.max_particles);
                    ig.game.spawnEntity(
                        EntitySnow,
                        Math.random() * (ig.game.screen.x + ig.system.width - ig.game.screen.x) + ig.game.screen.x,
                        ig.game.screen.y
                    );
                }
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
            // No this.parent(); draw once and leave it alone

            // Draw rain
            ig.system.context.strokeStyle = 'rgba(200, 200, 200, 0.6)';
            ig.system.context.beginPath();
            ig.system.context.moveTo(this.pos.x, this.pos.y);
            ig.system.context.lineTo(this.pos.x + this.vel.x * 0.05, this.pos.y + this.vel.y * 0.025);
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
            // No this.parent(); draw once and leave it alone

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
            ig.system.context.fill();
        },

        handleMovementTrace: function(res) {
            this.pos.x += this.vel.x * ig.system.tick;
            this.pos.y += this.vel.y * ig.system.tick;
        }
    }); // End EntitySnow
});
