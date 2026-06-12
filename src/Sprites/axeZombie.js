class AxeZombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, platform) {
        // Set perfectly on top of the platform (Origin anchored to bottom)
        let y = platform.y - (platform.displayHeight / 2);
        // Position at the back (right side) of the platform
        let x = platform.x + (platform.displayWidth / 2) - 4;

        super(scene, x, y, "axeZombieIdle");
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(2);
        this.setOrigin(0.5, 1); // Anchor bottom to prevent jittering during animations
        this.play("axeZombieIdleAnim");
        this.body.setAllowGravity(false);
        this.body.setSize(this.frame.width, this.frame.height, true);
        this.baseSpeed = 0; // Move identically to the platform it rests on
        this.hp = 1; // 1 hit points
        this.scorePoints = 50;
        this.type = "axe";
        this.attackTimer = 500; // Throw the first axe much faster (0.5 seconds)

        scene.my.sprite.enemies.push(this);
    }

    update(time, dt) {
        if (this.scene.gameState !== "PLAYING" || this.scene.gameOver) return;
        let delta = dt * 1000;

        if (this.body && this.baseSpeed !== undefined) {
            this.body.setVelocityX(-(this.scene.currentPlatformSpeed + this.baseSpeed));
        }

        if (this.visible) {
            this.attackTimer -= delta;
            if (this.attackTimer <= 0) {
                this.attackTimer = 2000;
                this.play("axeZombieAttackAnim");

                // Throw the axe a fraction of a second into the animation
                this.scene.time.delayedCall(400, () => {
                    if (this.active && this.visible) {
                        let ax = this.x - 20;
                        let ay = this.y - 15; // Adjust slightly to hand level (origin is now at bottom)
                        let axeProj = this.scene.add.sprite(ax, ay, "axeThrown").setScale(3).play("axeThrownAnim");
                        axeProj.play("axeThrownAnim");
                        axeProj.vx = -(this.scene.currentPlatformSpeed + 200); // Thrown much faster than platforms
                        axeProj.vy = 0;
                        this.scene.my.sprite.enemyBullet.push(axeProj);
                        this.scene.sound.play("axeThrowAudio", { volume: 2 });
                    }
                });

                this.once('animationcomplete', () => {
                    if (this.active && this.visible && this.hp > 0) {
                        this.play("axeZombieIdleAnim");
                    }
                });
            }
        }
    }
}