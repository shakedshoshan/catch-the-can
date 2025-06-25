import { Scene, GameObjects, Physics } from 'phaser';
import { EventBus } from '../EventBus';

interface PlatformData {
    type: 'normal' | 'breakable' | 'moving' | 'spring';
    moveDirection?: number;
    moveSpeed?: number;
    used?: boolean;
}

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    // Game variables
    private player!: Physics.Arcade.Sprite;
    private platforms!: Physics.Arcade.StaticGroup;
    private movingPlatforms!: Physics.Arcade.Group;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: { [key: string]: Phaser.Input.Keyboard.Key };
    private scoreText!: GameObjects.Text;
    private score: number = 0;
    private highestY: number = 0;
    private gameWidth: number = 1024;
    private gameHeight: number = 768;
    private platformCount: number = 20;
    private jumpVelocity: number = -500;
    private superJumpVelocity: number = -800;
    private playerSpeed: number = 300;
    private gravity: number = 800;
    private isGameOver: boolean = false;

    preload ()
    {
        this.load.setPath('assets');
        
        this.load.image('background', 'bg.png');
        this.load.image('player', 'cart.png');
    }

    create ()
    {
        // Set world bounds to allow infinite scrolling upward
        this.physics.world.setBounds(0, -50000, this.gameWidth, 100000);
        
        // Background
        this.add.image(512, 384, 'background');
        
        // Score display
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setScrollFactor(0);
        
        // Create player
        this.player = this.physics.add.sprite(this.gameWidth / 2, this.gameHeight - 100, 'player');
        this.player.setScale(0.2);
        this.player.setBounce(0.1);
        this.player.setCollideWorldBounds(false);
        
        // Give player an initial upward velocity
        this.player.setVelocityY(this.jumpVelocity);
        
        // Set initial high score position
        this.highestY = this.player.y;
        
        // Create platform groups
        this.platforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group();
        
        // Generate initial platforms
        this.generatePlatforms();
        
        // Set up collisions
        this.physics.add.overlap(this.player, this.platforms, this.playerHitPlatform, undefined, this);
        this.physics.add.overlap(this.player, this.movingPlatforms, this.playerHitMovingPlatform, undefined, this);
        
        // Set up input
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D') as { [key: string]: Phaser.Input.Keyboard.Key };
        
        // Add game over test key (G key)
        this.input.keyboard!.on('keydown-G', () => {
            console.log("G key pressed - testing game over");
            this.gameOver();
        });
        
        // Set up physics
        this.physics.world.gravity.y = this.gravity;
        
        // Set up camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setDeadzone(50, 200);
        this.cameras.main.setFollowOffset(0, 200);
        
        EventBus.emit('current-scene-ready', this);
    }

    update() {
        if (this.isGameOver) return;
        
        // Horizontal movement
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            this.player.setVelocityX(-this.playerSpeed);
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            this.player.setVelocityX(this.playerSpeed);
        } else {
            this.player.setVelocityX(0);
        }
        
        // Screen wrapping
        if (this.player.x < -20) {
            this.player.x = this.gameWidth + 20;
        } else if (this.player.x > this.gameWidth + 20) {
            this.player.x = -20;
        }
        
        // Update moving platforms
        this.movingPlatforms.children.entries.forEach((platform: any) => {
            const data = platform.getData('platformData') as PlatformData;
            if (data && data.type === 'moving') {
                const newX = platform.x + (data.moveDirection! * data.moveSpeed!);
                if (newX <= 50 || newX >= this.gameWidth - 50) {
                    data.moveDirection! *= -1;
                }
                platform.x = newX;
            }
        });
        
        // Update score based on height
        if (this.player.y < this.highestY) {
            this.highestY = this.player.y;
            this.score = Math.max(0, Math.floor((this.gameHeight - 100 - this.highestY) / 10));
            this.scoreText.setText('Score: ' + this.score);
        }
        
        // Generate new platforms
        if (this.player.y < this.getHighestPlatformY() + 1000) {
            this.generateMorePlatforms();
        }
        
        // Cleanup
        this.cleanupPlatforms();
        
        // Game over check - if player falls below the visible screen
        const bottomScreenY = this.cameras.main.scrollY + this.gameHeight;
        
        // Debug text to show player position relative to screen bottom
        console.log(`Player Y: ${this.player.y}, Screen bottom: ${bottomScreenY}`);
        
        // Game over if player is below screen bottom
        if (this.player.y > bottomScreenY) {
            console.log("GAME OVER TRIGGERED");
            this.gameOver();
        }
    }
    
    private generatePlatforms() {
        // Starting platform
        this.createPlatform(this.gameWidth / 2, this.gameHeight - 50, 'normal');
        
        // Generate platforms
        for (let i = 1; i < this.platformCount; i++) {
            const x = Phaser.Math.Between(80, this.gameWidth - 80);
            const y = this.gameHeight - 50 - (i * 120);
            const platformType = this.choosePlatformType(i);
            this.createPlatform(x, y, platformType);
        }
    }
    
    private generateMorePlatforms() {
        const highestY = this.getHighestPlatformY();
        const platformsToAdd = 10;
        
        for (let i = 1; i <= platformsToAdd; i++) {
            const x = Phaser.Math.Between(80, this.gameWidth - 80);
            const y = highestY - (i * 120);
            const platformType = this.choosePlatformType(Math.floor((-highestY) / 120));
            this.createPlatform(x, y, platformType);
        }
    }
    
    private choosePlatformType(level: number): 'normal' | 'breakable' | 'moving' | 'spring' {
        if (level < 5) return 'normal';
        
        const rand = Math.random();
        if (rand < 0.6) return 'normal';
        if (rand < 0.8) return 'breakable';
        if (rand < 0.95) return 'moving';
        return 'spring';
    }
    
    private createPlatform(x: number, y: number, type: 'normal' | 'breakable' | 'moving' | 'spring') {
        let platform: any;
        const data: PlatformData = { type };
        
        switch (type) {
            case 'normal':
                platform = this.add.rectangle(x, y, 100, 20, 0x00ff00);
                platform.setStrokeStyle(2, 0x008800);
                this.physics.add.existing(platform, true);
                this.platforms.add(platform);
                break;
                
            case 'breakable':
                platform = this.add.rectangle(x, y, 100, 20, 0xffaa00);
                platform.setStrokeStyle(2, 0xdd8800);
                this.physics.add.existing(platform, true);
                this.platforms.add(platform);
                break;
                
            case 'moving':
                platform = this.add.rectangle(x, y, 100, 20, 0x0088ff);
                platform.setStrokeStyle(2, 0x0066cc);
                this.physics.add.existing(platform, false);
                this.movingPlatforms.add(platform);
                data.moveDirection = Phaser.Math.Between(0, 1) ? 1 : -1;
                data.moveSpeed = 2;
                break;
                
            case 'spring':
                platform = this.add.rectangle(x, y, 100, 30, 0xff0088);
                platform.setStrokeStyle(2, 0xcc0066);
                this.physics.add.existing(platform, true);
                this.platforms.add(platform);
                break;
        }
        
        platform.setData('platformData', data);
    }
    
    private getHighestPlatformY(): number {
        let highest = this.gameHeight;
        
        this.platforms.children.entries.forEach((platform: any) => {
            if (platform && platform.y < highest) {
                highest = platform.y;
            }
        });
        
        this.movingPlatforms.children.entries.forEach((platform: any) => {
            if (platform && platform.y < highest) {
                highest = platform.y;
            }
        });
        
        return highest;
    }
    
    private cleanupPlatforms() {
        const cameraBottom = this.cameras.main.scrollY + this.gameHeight + 300;
        
        this.platforms.children.entries.forEach((platform: any) => {
            if (platform && platform.y > cameraBottom) {
                platform.destroy();
            }
        });
        
        this.movingPlatforms.children.entries.forEach((platform: any) => {
            if (platform && platform.y > cameraBottom) {
                platform.destroy();
            }
        });
    }
    
    private playerHitPlatform(player: any, platform: any) {
        // Only jump if player is falling down (positive velocity) and approaching from above
        if (!this.player.body || this.player.body.velocity.y <= 0) {
            return;
        }
        
        // Check if player is hitting platform from above (with some tolerance)
        if (this.player.y > platform.y + 10) {
            return;
        }
        
        const data = platform.getData('platformData') as PlatformData;
        
        switch (data.type) {
            case 'normal':
                this.player.setVelocityY(this.jumpVelocity);
                break;
                
            case 'breakable':
                if (!data.used) {
                    this.player.setVelocityY(this.jumpVelocity);
                    data.used = true;
                    platform.setAlpha(0.5);
                    this.time.delayedCall(100, () => {
                        platform.destroy();
                    });
                }
                break;
                
            case 'spring':
                this.player.setVelocityY(this.superJumpVelocity);
                platform.setScale(1.2, 0.8);
                this.time.delayedCall(200, () => {
                    platform.setScale(1, 1);
                });
                break;
        }
    }
    
    private playerHitMovingPlatform(player: any, platform: any) {
        // Only jump if player is falling down (positive velocity) and approaching from above
        if (!this.player.body || this.player.body.velocity.y <= 0) {
            return;
        }
        
        // Check if player is hitting platform from above (with some tolerance)
        if (this.player.y > platform.y + 10) {
            return;
        }
        
        this.player.setVelocityY(this.jumpVelocity);
    }
    
    private gameOver() {
        if (this.isGameOver) return;
        
        console.log("GAME OVER FUNCTION CALLED");
        
        // Set game over state
        this.isGameOver = true;
        
        // Stop physics and show visual feedback
        this.physics.pause();
        this.player.setTint(0xff0000);
        
        // Show game over text on screen for immediate feedback
        const gameOverText = this.add.text(
            this.cameras.main.midPoint.x, 
            this.cameras.main.midPoint.y, 
            'GAME OVER', 
            { 
                fontSize: '64px',
                color: '#ff0000',
                stroke: '#ffffff',
                strokeThickness: 6
            }
        ).setOrigin(0.5).setScrollFactor(0);
        
        // Wait a moment before transitioning to game over scene
        this.time.delayedCall(1000, () => {
            console.log("TRANSITIONING TO GAME OVER SCENE");
            this.scene.start('GameOver', { score: this.score });
        });
    }
}
