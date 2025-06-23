import { Scene, GameObjects, Physics } from 'phaser';
import { EventBus } from '../EventBus';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    // Game variables
    private player!: Physics.Arcade.Sprite;
    private cans!: Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private scoreText!: GameObjects.Text;
    private timeText!: GameObjects.Text;
    private score: number = 0;
    private timeLeft: number = 60;
    private gameTimer!: Phaser.Time.TimerEvent;
    private canSpawnTimer!: Phaser.Time.TimerEvent;

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('red_can', 'red_can.png');
        this.load.image('background', 'bg.png');
        this.load.image('cart', 'cart.png',  );
    }

    create ()
    {
        // Background
        this.add.image(512, 384, 'background');
        
        // Score and timer display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.timeText = this.add.text(16, 56, 'Time: 60', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Create player (cart)
        this.player = this.physics.add.sprite(512, 700, 'cart');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(0.2);
        
        // Create cans group
        this.cans = this.physics.add.group();
        
        // Set up collision between player and cans
        this.physics.add.overlap(
            this.player,
            this.cans,
            this.collectCan as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
            undefined,
            this
        );
        
        // Set up cursor keys for input
        this.cursors = this.input.keyboard!.createCursorKeys();
        
        // Timer for game duration
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
        
        // Timer for spawning stars
        this.canSpawnTimer = this.time.addEvent({
            delay: 1000,
            callback: this.spawnCan,
            callbackScope: this,
            loop: true
        });
        
        EventBus.emit('current-scene-ready', this);
    }

    update() {
        // Player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-20);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(20);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Check for stars that have gone off screen
        this.cans.getChildren().forEach((can: GameObjects.GameObject) => {
            const c = can as Physics.Arcade.Sprite;
            if (c.y > 800) {
                c.destroy();
            }
        });
    }
    
    private collectCan(player: any, can: any) {
        const c = can as Physics.Arcade.Sprite;
        c.destroy();
        
        // Update score
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
    }
    
    private updateTimer() {
        this.timeLeft--;
        this.timeText.setText('Time: ' + this.timeLeft);
        
        if (this.timeLeft <= 0) {
            // End the game
            this.gameTimer.remove();
            this.canSpawnTimer.remove();
            this.scene.start('GameOver', { score: this.score });
        }
    }
    
    private spawnCan() {
        // Create a star at a random x position at the top of the screen
        const x = Phaser.Math.Between(50, 974);
        const can = this.cans.create(x, 0, 'red_can') as Physics.Arcade.Sprite;
        
        // Set star properties
        can.setScale(0.1);
        can.setBounce(0);
        can.setCollideWorldBounds(false);
        can.setVelocityY(Phaser.Math.Between(100, 300));
        can.setAngularVelocity(Phaser.Math.Between(-100, 100));
    }
}
