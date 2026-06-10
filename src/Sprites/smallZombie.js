class SmallZombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        // Add a slight random X offset so they don't perfectly overlap if spawned rapidly
        let x = scene.game.config.width + 50 + Phaser.Math.Between(0, 100); 
        // The ground rests at (game.config.height - 40) and has a height of 80.
        // Add a random Y offset (-15 to 15) to give depth to the horde across the ground
        let y = scene.game.config.height - 103 + Phaser.Math.Between(-15, 15);
        
        super(scene, x, y, "smallZombieWalk");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(3);
        this.play("smallZombieWalkAnim");
        this.anims.setProgress(Math.random()); // Desynchronize the walk animation so they don't march in sync
        this.body.setAllowGravity(false); // They glide/run firmly on top of the ground
        this.baseSpeed = scene.enemySpeed + Phaser.Math.Between(-30, 60); // Vary walking speed slightly
        this.hp = 1; // Small zombies die in 1 hit
        this.scorePoints = 10;
        this.type = "small";
        this.setDepth(y); // Ensure zombies lower on the screen render in front of those behind them
        
        scene.my.sprite.enemies.push(this);
    }

    update(time, dt) {
        if (this.scene.gameState !== "PLAYING" || this.scene.gameOver) return;

        if (this.body && this.baseSpeed !== undefined) {
            this.body.setVelocityX(-(this.scene.currentPlatformSpeed + this.baseSpeed));
        }
    }
}