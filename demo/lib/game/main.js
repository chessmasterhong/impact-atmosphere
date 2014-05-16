ig.module(
    'game.main'
)
.requires(
    'impact.game',
    'game.levels.demo',
    'game.levels.demo2',
    'plugins.day-night',
    'plugins.weather'
)
.defines(function() {
    var MainGame = ig.Game.extend({
        init: function() {
            // Initialize Day/Night Cycle Plugin
            // Start from current date and time, updating every 0.5 seconds, running at 600x real time
            // (0.5 real_sec/update) * (600 plugin_secs/real_sec) = (300 plugin_secs/update) * (1/60 plugin_min/plugin_sec) = 5 plugin_mins/update
            this.daynight = new ig.DayNight(new Date(), 0.5, 600);
            this.weather = new ig.Weather();

            ig.input.bind(ig.KEY.MOUSE1, 'click');

            //this.loadLevel(LevelDemo);
            this.loadLevel(LevelDemo2);
        },

        update: function() {
            this.parent();

            // Used to toggle debug display
            if(ig.input.pressed('click'))
                this.daynight.debug = !this.daynight.debug;

            this.daynight.update();
        },

        draw: function() {
            this.parent();

            this.daynight.draw();
        }
    });

    ig.main('#canvas', MainGame, 60, 640, 480, 1);
});
