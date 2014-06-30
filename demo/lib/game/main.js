ig.module(
    'game.main'
)
.requires(
    'impact.game',
    //'game.levels.demo',
    'game.levels.demo2',
    'plugins.atmosphere' // Add plugin to .requires section
)
.defines(function() {
    var MainGame = ig.Game.extend({
        init: function() {
            // Initialize Atmospheric System Plugin
            // Used to setup necessary components for plugin to begin operation
            // Start from current date and time, updating every 0.5 seconds, running at 600x real time
            // (0.5 real_sec/update) * (600 plugin_secs/real_sec) = (300 plugin_secs/update) * (1/60 plugin_min/plugin_sec) = 5 plugin_mins/update
            this.atmosphere = new ig.Atmosphere(new Date(), 0.5, 600);

            // Bind a key for togging debug messages
            ig.input.bind(ig.KEY.MOUSE1, 'click');

            // Load a level
            //this.loadLevel(LevelDemo);
            this.loadLevel(LevelDemo2);
        },

        update: function() {
            this.parent();

            // Used to toggle debug display
            //if(ig.input.pressed('click'))
            //    this.atmosphere.debug = !this.atmosphere.debug;

            // Call plugin's update method
            // Used to update plugin's computations
            this.atmosphere.update();
        },

        draw: function() {
            this.parent();

            // Call plugin's draw method
            // Used to draw and update plugin's elements in canvas
            this.atmosphere.draw();
        }
    });

    ig.main('#canvas', MainGame, 60, 640, 480, 1);
});
