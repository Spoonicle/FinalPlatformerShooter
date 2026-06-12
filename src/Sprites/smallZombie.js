class SmallZombie extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, animKey = "smallZombieWalkAnim") {
        // Initialize textures and animations if not already done
        SmallZombie.initTexturesAndAnims(scene);

        // Fallback spawn positions if not provided (ArcadeShooter default offscreen horde logic)
        let spawnX = (x !== undefined) ? x : scene.game.config.width + 50 + Phaser.Math.Between(0, 100);
        let spawnY = (y !== undefined) ? y : scene.game.config.height - 103 + Phaser.Math.Between(-15, 15);

        let initialTexture = animKey.includes("Idle") ? "smallZombieIdle" : "smallZombieWalk";
        super(scene, spawnX, spawnY, initialTexture);
        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setScale(3);
        this.play(animKey);
        this.anims.setProgress(Math.random()); // Desynchronize the walk animation so they don't march in sync
        this.body.setAllowGravity(false); // They glide/run firmly on top of the ground

        let enemySpeed = (scene.enemySpeed !== undefined) ? scene.enemySpeed : 100;
        this.baseSpeed = enemySpeed + Phaser.Math.Between(-30, 60); // Vary walking speed slightly
        this.hp = 1; // Small zombies die in 1 hit
        this.scorePoints = 20;
        this.type = "small";
        this.setDepth(spawnY); // Ensure zombies lower on the screen render in front of those behind them

        if (!scene.my.sprite.enemies) {
            scene.my.sprite.enemies = [];
        }
        scene.my.sprite.enemies.push(this);
    }

    static preload(scene) {
        scene.load.setPath("./assets/small_Zombie/");
        scene.load.image("smallZombieAttack1", "Zombie_Small_Side-left_First-Attack-Sheet4.png");
        scene.load.image("smallZombieAttack2", "Zombie_Small_Side-left_Second-Attack-Sheet11.png");
        scene.load.image("smallZombieDeath", "Zombie_Small_Side-left_Second-Death-Sheet7.png");
        scene.load.image("smallZombieWalk", "Zombie_Small_Side-left_Walk-Sheet6.png");
        scene.load.image("smallZombieIdle", "Zombie_Small_Side-left_Idle-Sheet6.png");
        scene.load.setPath("./assets/");
    }

    static initTexturesAndAnims(scene) {
        if (!scene.textures.exists("smallZombieWalk")) return; // Guard in case not loaded yet

        const zombieConfigs = [
            { key: "smallZombieAttack1", frames: 4 },
            { key: "smallZombieAttack2", frames: 11 },
            { key: "smallZombieDeath", frames: 7 },
            { key: "smallZombieWalk", frames: 6 },
            { key: "smallZombieIdle", frames: 6 }
        ];

        for (let zc of zombieConfigs) {
            let tex = scene.textures.get(zc.key);
            // Check if frames have already been added to prevent duplicate frame creation error
            if (tex && tex.key !== '__MISSING' && tex.getFrameNames().length <= 1) {
                let w = tex.source[0].width;
                let h = tex.source[0].height;
                let fw = Math.floor(w / zc.frames);
                for (let i = 0; i < zc.frames; i++) {
                    tex.add(i, 0, i * fw, 0, fw, h);
                }
            }
        }

        const getZombieFrames = (key, count) => {
            let frames = [];
            for (let i = 0; i < count; i++) frames.push({ key: key, frame: i });
            return frames;
        };

        if (!scene.anims.exists("smallZombieWalkAnim")) {
            scene.anims.create({ key: 'smallZombieWalkAnim', frames: getZombieFrames('smallZombieWalk', 6), frameRate: 8, repeat: -1 });
        }
        if (!scene.anims.exists("smallZombieIdleAnim")) {
            scene.anims.create({ key: 'smallZombieIdleAnim', frames: getZombieFrames('smallZombieIdle', 6), frameRate: 8, repeat: -1 });
        }
        if (!scene.anims.exists("smallZombieAttack1Anim")) {
            scene.anims.create({ key: 'smallZombieAttack1Anim', frames: getZombieFrames('smallZombieAttack1', 4), frameRate: 8, repeat: 0 });
        }
        if (!scene.anims.exists("smallZombieAttack2Anim")) {
            scene.anims.create({ key: 'smallZombieAttack2Anim', frames: getZombieFrames('smallZombieAttack2', 11), frameRate: 8, repeat: 0 });
        }
        if (!scene.anims.exists("smallZombieDeathAnim")) {
            scene.anims.create({ key: 'smallZombieDeathAnim', frames: getZombieFrames('smallZombieDeath', 7), frameRate: 8, repeat: 0 });
        }
    }

    static playDeathVisual(scene, enemy) {
        let animKey = "smallZombieDeathAnim";
        let spriteKey = "smallZombieDeath";

        let deathSprite = scene.physics.add.sprite(enemy.x, enemy.y, spriteKey)
            .setScale(enemy.scaleX, enemy.scaleY)
            .setDepth(enemy.depth)
            .play(animKey);

        // Anchor to the bottom of the previous sprite so feet stay firmly planted
        let origY = enemy.originY !== undefined ? enemy.originY : 0.5;
        let enemyBottom = enemy.y + (enemy.displayHeight * (1 - origY));
        deathSprite.setOrigin(0.5, 1);
        deathSprite.y = enemyBottom;

        // Shift X to compensate for the death animation frame being a different width.
        let widthDiff = (deathSprite.width - enemy.width) * enemy.scaleX;
        deathSprite.x -= (widthDiff / 2);

        deathSprite.body.setAllowGravity(false);
        deathSprite.baseSpeed = enemy.baseSpeed || 0; // Maintain the same momentum

        if (!scene.my.sprite.deadEnemies) {
            scene.my.sprite.deadEnemies = [];
        }
        scene.my.sprite.deadEnemies.push(deathSprite);
    }

    update(time, dt) {
        if (this.scene.gameState !== "PLAYING" || this.scene.gameOver) return;

        if (this.body && this.baseSpeed !== undefined) {
            this.body.setVelocityX(-(this.scene.currentPlatformSpeed + this.baseSpeed));
        }
    }
}