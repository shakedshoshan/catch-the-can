import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class Menu extends Scene {
    constructor() {
        super('Menu');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('background', 'bg.png');
    }

    create() {
        this.add.image(512, 384, 'background');
        
        // Title
        this.add.text(512, 200, 'DOODLE JUMP', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        
        // Instructions
        this.add.text(512, 300, 'Jump on platforms and reach the highest score!\nUse arrow keys or WASD to move left and right\nYou wrap around the screen edges\nDon\'t fall below the screen!', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            align: 'center'
        }).setOrigin(0.5);
        
        // Start button
        const startButton = this.add.text(512, 450, 'START GAME', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            padding: { x: 20, y: 10 },
            backgroundColor: '#4CAF50'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        startButton.on('pointerover', () => {
            startButton.setStyle({ color: '#ffff00' });
        });
        
        startButton.on('pointerout', () => {
            startButton.setStyle({ color: '#ffffff' });
        });
        
        startButton.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
        EventBus.emit('current-scene-ready', this);
    }
} 