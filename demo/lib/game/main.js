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
            // Initialize Day Night Cycle Plugin, set date to today with
            //   time scale = 1x (real time) and update time = 60 seconds
            this.daynight = new ig.DayNight(new Date, 1, 60);
            this.loadLevel(LevelDemo);
        },

        update: function() {
            this.parent();

            // Update date and time (based on time scale and update time)
            this.daynight.update();
        }
    });

    ig.main('#canvas', MainGame, 60, 480, 320, 1);
});
