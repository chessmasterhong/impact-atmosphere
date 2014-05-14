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
    'plugins.day-night'
)
.defines(function() {
    var MainGame = ig.Game.extend({
        init: function() {
            // Initialize Day/Night Cycle Plugin
            // Start from current date and time, updating every 0.5 seconds, running at 600x real time
            this.daynight = new ig.DayNight(new Date, 0.5, 600);

            this.loadLevel(LevelDemo);
        },

        update: function() {
            this.parent();

            this.daynight.update();
        },

        draw: function() {
            this.parent();

            this.daynight.draw();
        }
    });

    ig.main('#canvas', MainGame, 60, 480, 320, 1);
});
