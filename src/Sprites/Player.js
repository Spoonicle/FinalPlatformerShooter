class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "xeno-grunt-idle", 0);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Movement Settings
        this.playerSpeed = 300;
        this.jumpSpeed = 1500;
        this.coyoteTime = 150;
        this.lastGrounded = 0;
        this.maxJumps = 1;
        this.jumpsRemaining = this.maxJumps;
        this.isGroundPounding = false;
        this.wasCrouching = false;
        this.facingDirection = 1;

        // Stats & States
        this.health = 3;
        this.bulletsInChamber = 6;
        this.isReloading = false;
        this.slamReady = true;
        this.lastSlamTime = 0;
        this.damageInvulnTimer = 0;
        this.knockbackTimer = 0;
        this.invulnerable = false;
        this.wasOnActualGround = false;

        // Hitbox & Scale Setup
        this.setScale(0.45);
        this.body.setSize(70, 95, false);
        this.body.setOffset(70, 225);
        this.setCollideWorldBounds(true);

        // Input Setup
        this.down = scene.input.keyboard.addKey("S");
        this.left = scene.input.keyboard.addKey("A");
        this.right = scene.input.keyboard.addKey("D");
        this.space = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shift = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        this.jKey = scene.input.keyboard.addKey("J");
        this.rKey = scene.input.keyboard.addKey("R");
        this.iKey = scene.input.keyboard.addKey("I");

        // Initialize animations if they don't exist
        this.initAnimations(scene);
    }

    static preload(scene) {
        scene.load.setPath("./assets/");
        scene.load.spritesheet("xeno-grunt-run", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-run.png", {
            frameWidth: 320, frameHeight: 320
        });
        scene.load.spritesheet("xeno-grunt-idle", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-idle.png", {
            frameWidth: 320, frameHeight: 320
        });
        scene.load.spritesheet("xeno-grunt-range-attack", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-range-attack.png", {
            frameWidth: 320, frameHeight: 320
        });
        scene.load.spritesheet("xeno-grunt-prep-jump", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-prep-jump.png", {
            frameWidth: 320, frameHeight: 320
        });
        scene.load.spritesheet("xeno-grunt-attack-2", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-attack-2.png", {
            frameWidth: 320, frameHeight: 320
        });
        scene.load.spritesheet("xeno-grunt-attack-1", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-attack-1.png", {
            frameWidth: 320, frameHeight: 320
        });
        scene.load.image("xeno-grunt-jumping", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-jumping.png");
        scene.load.image("xeno-grunt-knockback", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-knockback.png");
        scene.load.image("xeno-grunt-death", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-death-grounded.png");
        scene.load.image("bullet", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-range-projectile.png");

        scene.load.audio("playerFire", "laserRetro_001.ogg");
        scene.load.audio("revolverSpin", "RevolverSpin.mp3");
        scene.load.audio("revolverCock", "revolverCock.mp3");
        scene.load.audio("playerHit", "playerHitSound.mp3");
        scene.load.audio("shiftSmash", "ShiftSmash.mp3");
        scene.load.audio("playerJumping", "playerJumping.mp3");
        scene.load.audio("gameOver", "gameOver.mp3");
    }

    initAnimations(scene) {
        if (!scene.anims.exists("xeno-grunt-idle")) {
            scene.anims.create({
                key: "xeno-grunt-idle",
                frames: scene.anims.generateFrameNumbers("xeno-grunt-idle", { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1
            });
        }
        if (!scene.anims.exists("xeno-grunt-run")) {
            scene.anims.create({
                key: "xeno-grunt-run",
                frames: scene.anims.generateFrameNumbers("xeno-grunt-run", { start: 0, end: 7 }),
                frameRate: 15,
                repeat: -1
            });
        }
        if (!scene.anims.exists("xeno-grunt-attack-2")) {
            scene.anims.create({
                key: "xeno-grunt-attack-2",
                frames: scene.anims.generateFrameNumbers("xeno-grunt-attack-2", { start: 0, end: 6 }),
                frameRate: 15,
                repeat: 0
            });
        }
        if (!scene.anims.exists("xeno-grunt-attack-1")) {
            scene.anims.create({
                key: "xeno-grunt-attack-1",
                frames: scene.anims.generateFrameNumbers("xeno-grunt-attack-1", { start: 0, end: 8 }),
                frameRate: 15,
                repeat: 0
            });
        }
        if (!scene.anims.exists("xeno-grunt-range-attack")) {
            scene.anims.create({
                key: "xeno-grunt-range-attack",
                frames: scene.anims.generateFrameNumbers("xeno-grunt-range-attack", { start: 0, end: 6 }),
                frameRate: 15,
                repeat: 0
            });
        }
    }

    playSound(key, config) {
        if (this.scene.sound && this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, config);
        }
    }

    update(time, delta) {
        if (this.health <= 0) return;

        let dt = delta / 1000;
        let isMoving = false;

        // Damage invulnerability timers and knockback
        if (this.damageInvulnTimer > 0) {
            this.damageInvulnTimer -= delta;
            this.setAlpha(Math.floor(time / 100) % 2 === 0 ? 0.3 : 1);
            if (this.damageInvulnTimer <= 0) {
                this.setAlpha(1);
            }
        }
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;
        }

        // Invulnerability debug toggle (I key)
        if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
            this.invulnerable = !this.invulnerable;
            if (this.scene.my && this.scene.my.text && this.scene.my.text.invul) {
                this.scene.my.text.invul.visible = this.invulnerable;
            }
            console.log("Invulnerable:", this.invulnerable);
        }

        // Slam cooldown recharge
        if (!this.slamReady && (time - this.lastSlamTime > 2000)) {
            this.slamReady = true;
        }

        // Check ground status
        let onGround = this.body.blocked.down || this.body.touching.down || this.body.onFloor();
        let onActualGround = false;

        if (onGround) {
            // Check if player is specifically touching the scene's bottom ground object (ArcadeShooter ground)
            if (this.scene.ground && this.body.bottom >= this.scene.ground.y - (this.scene.ground.height / 2) - 1) {
                onActualGround = true;
            }
        }

        // Spawn platforms on landing on ground (ArcadeShooter feature)
        if (onActualGround && !this.wasOnActualGround) {
            if (this.scene.spawnPlatform && this.scene.platforms) {
                let groundPlatformExists = this.scene.platforms.getChildren().some(p => p.isGroundSpawn);
                if (!groundPlatformExists || this.isGroundPounding) {
                    this.scene.spawnPlatform(this.y - 60, true);
                }
            }
        }
        this.wasOnActualGround = onActualGround;

        // Landing and ground-pound impact triggers
        if (onGround) {
            this.lastGrounded = time;
            this.jumpsRemaining = this.maxJumps;

            if (this.isGroundPounding) {
                this.isGroundPounding = false;
                if (this.scene.platformCollider) this.scene.platformCollider.active = true;

                // Outward shockwave explosions (ArcadeShooter)
                if (this.scene.my && this.scene.my.sprite && this.scene.my.sprite.enemies) {
                    let px = this.x;
                    let py = this.y + this.displayHeight * (1 - this.originY); // Ground level (feet of player)

                    for (let i = 0; i < 2; i++) {
                        this.scene.time.delayedCall(i * 60, () => {
                            if (!this.active) return;

                            let spawnExplosionAndKill = (exX) => {
                                this.scene.add.sprite(exX, py, "explosion-1").setOrigin(0.5, 0.5).setScale(2).play("enemyExplosion");
                                for (let enemy of this.scene.my.sprite.enemies) {
                                    if (enemy.visible) {
                                        let dist = Math.abs(exX - enemy.x);
                                        let yDist = Math.abs(py - enemy.y);
                                        if (dist < 80 && yDist < 150) {
                                            this.scene.playZombieDeathVisual(enemy);
                                            enemy.visible = false;
                                            enemy.x = -100;
                                            if (this.scene.myScore !== undefined) {
                                                this.scene.myScore += (enemy.scorePoints || 100);
                                            }
                                            if (this.scene.updateScore) {
                                                this.scene.updateScore();
                                            }
                                            let deathSound = enemy.type === "big" ? "explosion2" : "explosion";
                                            this.playSound(deathSound, { volume: 1 });
                                        }
                                    }
                                }
                            };

                            if (i === 0) {
                                spawnExplosionAndKill(px);
                            } else {
                                spawnExplosionAndKill(px - (i * 90));
                                spawnExplosionAndKill(px + (i * 90));
                            }
                            this.playSound("explosion", { volume: 0.4 });
                        });
                    }
                }
            }
        }

        // Ground pound (slam) trigger (SHIFT key)
        if (Phaser.Input.Keyboard.JustDown(this.shift) && !this.isGroundPounding && this.slamReady) {
            this.isGroundPounding = true;
            this.slamReady = false;
            this.lastSlamTime = time;
            this.setVelocityX(0);
            if (this.scene.platformCollider) this.scene.platformCollider.active = false;
            this.playSound("shiftSmash", { volume: 1 });
            this.play("xeno-grunt-attack-2").chain("xeno-grunt-attack-1");
        }

        // Ground pound active movement and collision logic
        if (this.isGroundPounding) {
            this.setVelocityY(2000); // Force fast slam

            // platform overlap destruction (ArcadeShooter)
            if (this.scene.platforms) {
                this.scene.physics.overlap(this, this.scene.platforms, (player, platform) => {
                    this.scene.add.sprite(platform.x, platform.y, "explosion-1").setScale(2).play("enemyExplosion");
                    this.scene.removePlatform(platform);
                    this.playSound("explosion", { volume: 0.8 });

                    // Kill all enemies within the spawned platform explosion (120px radius)
                    if (this.scene.my && this.scene.my.sprite && this.scene.my.sprite.enemies) {
                        for (let enemy of this.scene.my.sprite.enemies) {
                            if (enemy.visible) {
                                let dist = Phaser.Math.Distance.Between(platform.x, platform.y, enemy.x, enemy.y);
                                if (dist < 120) {
                                    this.scene.playZombieDeathVisual(enemy);
                                    enemy.visible = false;
                                    enemy.x = -100;
                                    if (this.scene.myScore !== undefined) {
                                        this.scene.myScore += (enemy.scorePoints || 100);
                                    }
                                    if (this.scene.updateScore) {
                                        this.scene.updateScore();
                                    }
                                    let deathSound = enemy.type === "big" ? "explosion2" : "explosion";
                                    this.playSound(deathSound, { volume: 1 });
                                }
                            }
                        }
                    }
                });
            }
        }

        // Calculate moving platforms speed (ArcadeShooter)
        let platformSpeed = 0;
        if (onGround && !onActualGround) {
            if (this.scene.platforms) {
                for (let platform of this.scene.platforms.getChildren()) {
                    if (this.body.bottom >= platform.body.top - 5 &&
                        this.body.bottom <= platform.body.top + 10 &&
                        this.body.right >= platform.body.left &&
                        this.body.left <= platform.body.right) {
                        platformSpeed = platform.body.velocity.x;
                        break;
                    }
                }
            }
        }

        let isCrouching = this.down.isDown && !this.isGroundPounding;

        // Move horizontally
        if (this.isGroundPounding) {
            this.setVelocityX(0);
        } else if (this.left.isDown) {
            this.setVelocityX(-this.playerSpeed + platformSpeed);
            this.setFlipX(false);
            if (this.scene.scene.key === "ArcadeShooter") {
                this.facingDirection = 1;
            } else {
                this.facingDirection = -1;
            }
            isMoving = true;
        } else if (this.right.isDown) {
            this.setVelocityX(this.playerSpeed + platformSpeed);
            this.setFlipX(false);
            this.facingDirection = 1;
            isMoving = true;
        } else {
            this.setVelocityX(platformSpeed);
        }

        // Jump (SPACE key)
        if (Phaser.Input.Keyboard.JustDown(this.space) && this.jumpsRemaining > 0 && !this.isGroundPounding) {
            if (!onGround && this.jumpsRemaining === this.maxJumps && (time - this.lastGrounded) > this.coyoteTime) {
                this.jumpsRemaining--;
            }
            if (this.jumpsRemaining > 0) {
                this.setVelocityY(-this.jumpSpeed);
                this.jumpsRemaining--;
                this.playSound("playerJumping", { volume: 0.2 });
            }
        }

        // Shooting (J key)
        if (Phaser.Input.Keyboard.JustDown(this.jKey)) {
            if (this.scene.scene.key === "ArcadeShooter" || this.scene.scene.key === "TutorialRoom") {
                this.fireBullet();
            }
        }

        // Manual Reload (R key)
        if (Phaser.Input.Keyboard.JustDown(this.rKey) && !this.isReloading && this.bulletsInChamber < 6) {
            if (this.scene.scene.key === "ArcadeShooter" || this.scene.scene.key === "TutorialRoom") {
                this.reloadGun();
            }
        }

        // Animations and physics bounds adjustments
        let currentAnim = this.anims.currentAnim?.key;
        let currentKey = this.texture.key;
        let isShooting = currentAnim === "xeno-grunt-range-attack" && this.anims.isPlaying;
        let isPoundingAnim = (currentAnim === "xeno-grunt-attack-2" || currentAnim === "xeno-grunt-attack-1") && this.anims.isPlaying;

        let targetOffsetX = 70;
        let targetOffsetY = 225;

        if (!onGround && !isCrouching && this.knockbackTimer <= 0 && !this.isGroundPounding && !isPoundingAnim && !isShooting) {
            targetOffsetX = 150;
            targetOffsetY = 100;
        }

        if (this.knockbackTimer > 0) {
            if (currentKey !== "xeno-grunt-knockback") {
                this.stop();
                this.setTexture("xeno-grunt-knockback", 0);
            }
            this.wasCrouching = false;
        } else if (this.isGroundPounding || isPoundingAnim) {
            this.wasCrouching = false;
        } else if (isCrouching) {
            if (!this.wasCrouching) {
                let wasJumping = this.body.offset.y === 100;
                this.stop();
                this.setTexture("xeno-grunt-prep-jump", 0);
                this.body.setSize(70, 60, false);
                this.body.setOffset(70, 260);
                this.wasCrouching = true;
                if (wasJumping) {
                    this.x += 36;
                    this.y -= 56.25;
                }
            }
        } else {
            if (this.wasCrouching) {
                let standKey = (this.scene.scene.key === "ArcadeShooter") ? "xeno-grunt-range-attack" : "xeno-grunt-idle";
                this.setTexture(standKey, 0);
                this.body.setSize(70, 95, false);
                this.body.setOffset(70, 225);
                this.wasCrouching = false;
            }

            if (!isShooting) {
                if (!onGround) {
                    if (currentKey !== "xeno-grunt-jumping") {
                        this.stop();
                        this.setTexture("xeno-grunt-jumping", 0);
                    }
                } else {
                    if (onActualGround || isMoving) {
                        this.play("xeno-grunt-run", true);
                    } else {
                        this.play("xeno-grunt-idle", true);
                    }
                }
            }
        }

        if (!isCrouching && !this.wasCrouching) {
            if (targetOffsetY === 100 && this.body.offset.y !== 100) {
                this.body.setSize(70, 95, false);
                this.body.setOffset(150, 100);
                this.x -= 36;
                this.y += 56.25;
            } else if (targetOffsetY === 225 && this.body.offset.y !== 225) {
                this.body.setSize(70, 95, false);
                this.body.setOffset(70, 225);
                this.x += 36;
                this.y -= 56.25;
            }
        }
    }

    fireBullet() {
        if (this.bulletsInChamber > 0 && !this.isReloading && !this.wasCrouching) {
            this.bulletsInChamber--;
            let dir = 1;
            let offsetX = 0;
            let offsetY = 50;

            let newBullet = this.scene.add.sprite(
                this.x + offsetX, this.y + offsetY, "bullet"
            ).setScale(0.75);
            newBullet.setFlipX(false);
            newBullet.fireDirection = dir;

            if (this.scene.my && this.scene.my.sprite && this.scene.my.sprite.bullet) {
                this.scene.my.sprite.bullet.push(newBullet);
            }
            this.playSound("playerFire", { volume: 0.3 });

            this.play("xeno-grunt-range-attack", true);

            if (this.bulletsInChamber <= 0) {
                this.reloadGun();
            }
        }
    }

    reloadGun() {
        if (this.isReloading || this.bulletsInChamber === 6) return;

        this.isReloading = true;
        this.playSound("revolverSpin");

        this.scene.time.delayedCall(50, () => {
            //this.playSound("revolver");
            this.scene.time.delayedCall(600, () => {
                this.bulletsInChamber = 6;
                this.isReloading = false;
            });
        });
    }

    takeDamage() {
        if (this.health <= 0) return false;

        let currentAnim = this.anims.currentAnim?.key;
        let isPoundingAnim = (currentAnim === "xeno-grunt-attack-2" || currentAnim === "xeno-grunt-attack-1") && this.anims.isPlaying;

        if (this.invulnerable || this.isGroundPounding || isPoundingAnim || this.damageInvulnTimer > 0) {
            return false;
        }

        this.health -= 1;
        this.damageInvulnTimer = 2000;
        this.knockbackTimer = 500;

        this.playSound("playerHit", { volume: 1 });

        if (this.scene.updateHealth) {
            this.scene.updateHealth();
        }

        if (this.health <= 0) {
            this.die();
            return true;
        }

        return false;
    }

    die() {
        this.visible = false;
        this.body.setEnable(false);

        // Adjust coordinates if the player was in the jumping state (offset Y = 100)
        // to align with the running/grounded state coordinate space
        let spawnX = this.x;
        let spawnY = this.y;
        if (this.body.offset.y === 100) {
            spawnX += 36;
            spawnY -= 56.25;
        }

        // Spawn the deadPlayer as a physics sprite so it experiences gravity and physics
        let deadPlayer = this.scene.physics.add.sprite(spawnX, spawnY, "xeno-grunt-death")
            .setScale(this.scaleX)
            .setOrigin(this.originX, this.originY);

        if (this.facingDirection === -1) {
            deadPlayer.setFlipX(true);
        }

        // Mirror the player's running/grounded physics body properties and collision geometry
        deadPlayer.body.setSize(70, 95, false);
        deadPlayer.body.setOffset(70, 225);
        deadPlayer.setCollideWorldBounds(true);

        // Carry over the player's momentum (velocity) at death
        deadPlayer.body.setVelocity(this.body.velocity.x, this.body.velocity.y);
        deadPlayer.body.setDragX(150); // Add horizontal drag to slide smoothly to a stop

        // Dynamically add colliders with whatever environmental features exist in the active scene
        if (this.scene.ground) {
            this.scene.physics.add.collider(deadPlayer, this.scene.ground);
        }
        if (this.scene.platforms) {
            this.scene.physics.add.collider(deadPlayer, this.scene.platforms);
        }
        if (this.scene.wallLayer) {
            this.scene.physics.add.collider(deadPlayer, this.scene.wallLayer);
        }
        if (this.scene.boxesLayer) {
            this.scene.physics.add.collider(deadPlayer, this.scene.boxesLayer);
        }

        this.scene.my.sprite.deadPlayer = deadPlayer;

        if (this.scene.scene.key === "ArcadeShooter") {
            this.scene.gameOver = true;
            this.scene.my.text.gameOver.visible = true;
            this.playSound("gameOver", { volume: 3 });
        }
    }
}