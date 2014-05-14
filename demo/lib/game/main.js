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
            // Initialize Day/Night Cycle Plugin, set date to today, update every 60 seconds
            this.daynight = new ig.DayNight(new Date, 60);

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
