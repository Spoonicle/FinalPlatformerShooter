class BigZombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene) {
        let x = scene.game.config.width + 50 + Phaser.Math.Between(0, 100); 
        // Spawn them higher up so they sit evenly within the middle of the ground 
        let y = scene.game.config.height - 200;
        
        super(scene, x, y, "bigZombieWalk");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(10);
        this.play("bigZombieWalkAnim"); // Big zombies walk slower, so play their animation at half speed
        this.anims.setProgress(Math.random()); 
        this.body.setAllowGravity(false); 
        
        // Shrink the hitbox to be slightly shorter and thinner so the player can stand on low platforms above it
        this.body.setSize(this.width * 0.6, this.height * 0.7);
        this.body.setOffset(this.width * 0.2, this.height * 0.3);

        this.baseSpeed = scene.enemySpeed * 0.2 + Phaser.Math.Between(-10, 20); // Big zombies are slightly slower
        this.hp = 100; // Big zombies have much more health
        this.scorePoints = 50;
        this.type = "big";
        this.setDepth(y); 

        // Add and play the giant walk looping sound
        this.walkSound = scene.sound.add("giantWalk", { loop: true, volume: 2, rate: 3 });
        this.walkSound.play();
        
        scene.my.sprite.enemies.push(this);
    }

    update(time, dt) {
        if (this.scene.gameState !== "PLAYING" || this.scene.gameOver) return;

        if (this.body && this.baseSpeed !== undefined) {
            this.body.setVelocityX(-(this.scene.currentPlatformSpeed + this.baseSpeed));
        }
    }
}