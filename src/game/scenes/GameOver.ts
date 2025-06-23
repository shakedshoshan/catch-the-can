import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene {
    constructor() {
        super('GameOver');
    }

    init(data: { score: number }) {
        this.score = data.score;
    }

    score: number = 0;

    create() {
        this.add.image(512, 384, 'background');
        
        // Game over text
        this.add.text(512, 200, 'GAME OVER', {
            fontFamily: 'Arial Black',
            fontSize: 64,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8,
            align: 'center'
        }).setOrigin(0.5);
        
        // Score
        this.add.text(512, 300, `Your Score: ${this.score}`, {
            fontFamily: 'Arial Black',
            fontSize: 48,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center'
        }).setOrigin(0.5);
        
        // Play again button
        const playAgainButton = this.add.text(512, 400, 'PLAY AGAIN', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            padding: { x: 20, y: 10 },
            backgroundColor: '#4CAF50'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        playAgainButton.on('pointerover', () => {
            playAgainButton.setStyle({ color: '#ffff00' });
        });
        
        playAgainButton.on('pointerout', () => {
            playAgainButton.setStyle({ color: '#ffffff' });
        });
        
        playAgainButton.on('pointerdown', () => {
            this.scene.start('Game');
        });
        
        // Menu button
        const menuButton = this.add.text(512, 480, 'MAIN MENU', {
            fontFamily: 'Arial Black',
            fontSize: 36,
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            align: 'center',
            padding: { x: 20, y: 10 },
            backgroundColor: '#3F51B5'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        
        menuButton.on('pointerover', () => {
            menuButton.setStyle({ color: '#ffff00' });
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setStyle({ color: '#ffffff' });
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.start('Menu');
        });
        
        EventBus.emit('current-scene-ready', this);
    }
} 