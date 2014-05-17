ig.module(
    'game.main'
)
.requires(
    'impact.game',
    'impact.debug.debug',
    'game.levels.demo',
    'game.levels.demo2',
    'plugins.atmosphere',
    'plugins.weather'
)
.defines(function() {
    var MainGame = ig.Game.extend({
        init: function() {
            // Initialize Atmospheric System Plugin
            // Start from current date and time, updating every 0.5 seconds, running at 600x real time
            // (0.5 real_sec/update) * (600 plugin_secs/real_sec) = (300 plugin_secs/update) * (1/60 plugin_min/plugin_sec) = 5 plugin_mins/update
            this.atmosphere = new ig.Atmosphere(new Date(), 0.5, 600);
            this.weather = new ig.Weather();

            ig.input.bind(ig.KEY.MOUSE1, 'click');

            //this.loadLevel(LevelDemo);
            this.loadLevel(LevelDemo2);
        },

        update: function() {
            this.parent();

            // Used to toggle debug display
            if(ig.input.pressed('click'))
                this.atmosphere.debug = !this.atmosphere.debug;

            this.atmosphere.update();
            this.weather.update();
        },

        draw: function() {
            this.parent();

            this.atmosphere.draw();
            this.weather.draw();
        }
    });

    ig.main('#canvas', MainGame, 60, 640, 480, 1);
});
