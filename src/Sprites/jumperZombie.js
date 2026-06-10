class JumperZombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        let x = Phaser.Math.Between(50, scene.game.config.width + 100);
        let startY = scene.game.config.height + 20; // Start below the visible screen/ground
        
        super(scene, x, startY, "smallZombieWalk");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(3);
        this.play("smallZombieWalkAnim");
        this.anims.setProgress(Math.random()); 
        this.body.setAllowGravity(false); 
        this.baseSpeed = scene.enemySpeed + 150; // Jumper zombies are very fast horizontally
        this.hp = 1; 
        this.scorePoints = 20;
        this.type = "jumper";
        this.startY = startY;
        this.timeAlive = 0; // Used to track the sine wave math over time
        
        scene.my.sprite.enemies.push(this);
    }

    update(time, dt) {
        if (this.scene.gameState !== "PLAYING" || this.scene.gameOver) return;

        if (this.body && this.baseSpeed !== undefined) {
            this.body.setVelocityX(-(this.scene.currentPlatformSpeed + this.baseSpeed));
        }

        this.timeAlive += dt;
        // Single long arc: Math.sin(time * speed) * high_jump_height
        // Once timeAlive * 1.5 exceeds PI, sine becomes negative and it falls back down offscreen
        this.y = this.startY - Math.sin(this.timeAlive * 1.5) * 500;
    }
}