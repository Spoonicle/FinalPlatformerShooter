class ArcadeShooter extends Phaser.Scene {
    constructor() {
        super("ArcadeShooter");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = { sprite: {}, text: {} };

        // Array of platform sprite keys for random selection
        this.platformSpriteKeys = [
            "platform1", "platform2", "platform3", "platform4",
            "platform5", "platform6", "platform7", "platform8",
            "platform9", "platform10", "platform11", "platform12"
        ];

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];
        this.my.sprite.enemyBullet = [];
        this.my.sprite.enemies = [];
        this.maxBullets = 1;           // Don't create more than this many bullets

        this.myScore = 0;       // record a score as a class variable
        this.myHealth = 3;      // Start with 3 health
        this.currentRound = 1;  // Start at round 1 (disabled while no enemies)
        this.gameOver = false;  // Track if the game is over
        this.highScore = 0;     // Track the high score across restarts
        this.highScoreColor = "Beige"; // Track the color of the alien with the high score
        this.gameState = "TITLE"; // Track if we are on the title screen
        // More typically want to use a global variable for score, since
        // it will be used across multiple scenes
    }

    preload() {
        this.load.setPath("./assets/");
        for (let color of ["Beige", "Blue", "Green", "Pink", "Yellow"]) {
            for (let i = 1; i <= 5; i++) {
                this.load.image(`alien${color}_newWalk${i}`, `alien${color}_newWalk${i}.png`);
            }
            // Load the badge corresponding to this color
            this.load.image(`alien${color}_badge2`, `alien${color}_badge2.png`);
            this.load.image(`alien${color}_badge1`, `alien${color}_badge1.png`);
        }
        this.load.image("bullet", "ghost_hit.png");
        for (let i = 0; i <= 5; i++) {
            this.load.image(`bg${i}`, `${i}.png`);
        }

        // For animation
        this.load.image("explosion-1", "explosion-1.png");
        this.load.image("explosion-2", "explosion-2.png");
        this.load.image("explosion-3", "explosion-3.png");
        this.load.image("explosion-4", "explosion-4.png");
        this.load.image("explosion-5", "explosion-5.png");
        this.load.image("explosion-6", "explosion-6.png");
        this.load.image("explosion-7", "explosion-7.png");
        this.load.image("explosion-8", "explosion-8.png");

        // Load platform sprites
        this.load.setPath("./assets/Platforms/");
        this.load.image("platform1", "Container_11_Green_Horizontal.png");
        this.load.image("platform2", "Container_12_Green_Horizontal_Overgrown_Bleak-Yellow.png");
        this.load.image("platform3", "Container_12_Green_Horizontal_Overgrown_Dark-Green.png");
        this.load.image("platform4", "Container_12_Green_Horizontal_Overgrown_Green.png");
        this.load.image("platform5", "Container_3_Gray_Horizontal.png");
        this.load.image("platform6", "Container_4_Gray_Horizontal_Overgrown_Bleak-Yellow.png");
        this.load.image("platform7", "Container_4_Gray_Horizontal_Overgrown_Dark-Green.png");
        this.load.image("platform8", "Container_4_Gray_Horizontal_Overgrown_Green.png");
        this.load.image("platform9", "Container_7_Red_Horizontal.png");
        this.load.image("platform10", "Container_8_Red_Horizontal_Overgrown_Bleak-Yellow.png");
        this.load.image("platform11", "Container_8_Red_Horizontal_Overgrown_Dark-Green.png");
        this.load.image("platform12", "Container_8_Red_Horizontal_Overgrown_Green.png");
        this.load.setPath("./assets/");




        // Load the Kenny Rocket Square bitmap font
        // This was converted from TrueType format into Phaser bitmap
        // format using the BMFont tool.
        // BMFont: https://www.angelcode.com/products/bmfont/
        // Tutorial: https://dev.to/omar4ur/how-to-create-bitmap-fonts-for-phaser-js-with-bmfont-2ndc
        this.load.bitmapFont("rocketSquare", "KennyRocketSquare_0.png", "KennyRocketSquare.fnt");

        // Sound asset from the Kenny Impact Audio pack
        this.load.audio("explosion", "explosionCrunch_000.ogg");
        this.load.audio("explosion2", "explosionCrunch_001.ogg");
        this.load.audio("explosion3", "explosionCrunch_002.ogg");
        this.load.audio("playerFire", "laserRetro_001.ogg");
        this.load.audio("enemyFire", "laserRetro_004.ogg");
        this.load.audio("space_audio", "space_audio.mp3");
    }

    create() {
        let my = this.my;

        // Safely check if the audio exists before adding and playing it to avoid crashes
        if (this.cache.audio.exists("space_audio")) {
            this.backgroundAudio = this.sound.add("space_audio");
            this.backgroundAudio.play({ loop: true });
        } else {
            console.warn("Audio key 'space_audio' missing. Check if the file is in the assets folder.");
        }

        // Add parallax background TileSprites
        this.bgScrollSpeed = 100; // Base speed of the foreground
        this.parallaxLayers = [];
        // Loop backwards from 5 to 0 so the backdrop (5) renders first and foreground (0) renders last
        for (let i = 5; i >= 0; i--) {
            // 1. Get the actual height of the loaded image texture
            let textureHeight = this.textures.get(`bg${i}`).getSourceImage().height;
            let scaleY = game.config.height / textureHeight;

            // 2. Create the TileSprite to be EXACTLY the height of the texture so it never repeats vertically.
            // We divide the width by scaleY so that when we scale the whole object up, it fits perfectly.
            let bg = this.add.tileSprite(400, 300, game.config.width / scaleY, textureHeight, `bg${i}`);
            bg.setScale(scaleY); // 3. Scale the entire object up to fit the screen

            let speedMultiplier = 1 - (i * 0.16); // Layer 5 is slowest (0.2x speed), layer 0 is fastest (1x speed)
            this.parallaxLayers.push({ sprite: bg, speed: speedMultiplier });
        }



        // Notice that in this approach, we don't create any bullet sprites in create(),
        // and instead wait until we need them, based on the number of space bar presses

        // Create white enemyExplosion animation
        this.anims.create({
            key: "enemyExplosion",
            frames: [
                { key: "explosion-1" },
                { key: "explosion-2" },
                { key: "explosion-3" },
                { key: "explosion-4" },
                { key: "explosion-6" },
                { key: "explosion-7" },
                { key: "explosion-8" },
            ],
            frameRate: 20,    // Note: case sensitive
            repeat: 0,
            hideOnComplete: true
        });

        for (let color of ["Beige", "Blue", "Green", "Pink", "Yellow"]) {
            this.anims.create({
                key: `walk_${color}`,
                frames: [
                    { key: `alien${color}_newWalk1` },
                    { key: `alien${color}_newWalk2` },
                    { key: `alien${color}_newWalk3` },
                    { key: `alien${color}_newWalk4` },
                    { key: `alien${color}_newWalk5` }
                ],
                frameRate: 15, // Increased from 8 to 15 so the 5 frames play smoothly
                repeat: -1
            });
        }

        // Create key objects
        this.up = this.input.keyboard.addKey("W");
        this.down = this.input.keyboard.addKey("S");
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.rKey = this.input.keyboard.addKey("R");
        this.iKey = this.input.keyboard.addKey("I"); // Toggle invulnerability during tests
        this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Set movement speeds (in pixels/sec)
        this.playerSpeed = 250;
        this.jumpSpeed = 1200;
        this.bulletSpeed = 500;
        this.enemyBulletSpeed = 300;
        this.enemySpeed = 100;

        // Determine the maximum vertical reach of a jump (use original jump reference to keep platform spawning unchanged)
        const low_height = 500; // preserve original platform spawn behavior
        this.maxPlatformJumpDistance = Math.floor((low_height * low_height) / (2 * this.physics.world.gravity.y));

        // Coyote time: allow a short grace period after leaving ground so jumps feel responsive
        this.coyoteTime = 150; // milliseconds
        this.lastGrounded = 0;

        // Single jump
        this.maxJumps = 1;
        this.jumpsRemaining = this.maxJumps;

        // Create a simple ground for the platformer (invisible but collidable)
        // Increased height so the ground area is a bit taller
        this.ground = this.add.rectangle(game.config.width / 2, game.config.height - 40, game.config.width, 80, 0x555555).setOrigin(0.5).setVisible(false);
        this.physics.add.existing(this.ground, true);

        // Create moving platforms as a physics group so collision is handled consistently
        this.platforms = this.physics.add.group({ immovable: true, allowGravity: false });
        this.platformSpawnCount = 0;
        this.patterns = {}; // track active patterns

        // Platform configuration
        this.platformConfig = {
            platformSize: { width: 160, height: 32 },
            spawnBufferX: 100,
            despawnBufferX: 60,
            numZones: null, // dynamic
            zoneTopMargin: 120,
            zoneBottomMargin: 220,
            platformSpeed: 150,
            speedJitter: 0,
            spawnIntervalRange: [1200, 2200],
            initialLowCount: 3,
            platformMaxRiseRatio: 0.75,
            platformScale: 2,
            oneWay: false
        };

        // Determine zones (equal-height vertical bands)
        let usable = game.config.height - this.platformConfig.zoneTopMargin - this.platformConfig.zoneBottomMargin;
        this.numZones = this.platformConfig.numZones || 5;
        this.zoneHeight = Math.floor(usable / this.numZones);
        this.zones = [];
        for (let i = 0; i < this.numZones; i++) {
            let top = this.platformConfig.zoneTopMargin + i * this.zoneHeight;
            let bottom = Math.min(top + this.zoneHeight, game.config.height - this.platformConfig.zoneBottomMargin);
            this.zones.push({ top: top, bottom: bottom });
        }

        this.platformSpawnTimer = Phaser.Math.Between(this.platformConfig.spawnIntervalRange[0], this.platformConfig.spawnIntervalRange[1]);

        my.text.score = this.add.bitmapText(580, 5, "rocketSquare", "Score 0", 20);
        my.text.score.visible = false;

        // High Score UI
        my.text.highScore = this.add.bitmapText(580, 30, "rocketSquare", "High 0", 20);
        my.text.highScore.visible = false;
        my.sprite.highScoreBadge = this.add.sprite(760, 27, `alien${this.highScoreColor}_badge2`).setScale(0.8);
        my.sprite.highScoreBadge.visible = false; // Hide until a score is actually achieved
        // Small on-screen indicator for invulnerability (hidden by default)
        my.text.invul = this.add.text(580, 55, "INVUL", { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#FF4444' }).setOrigin(0, 0);
        my.text.invul.visible = false;

        my.text.round = this.add.bitmapText(350, 5, "rocketSquare", "Round 1", 20);
        my.text.round.visible = false;

        // Title Screen Text
        my.text.titleTextShadow1 = this.add.text(game.config.width / 2 + 3, game.config.height / 2 - 63, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.titleTextShadow2 = this.add.text(game.config.width / 2 + 6, game.config.height / 2 - 66, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.titleText = this.add.text(game.config.width / 2, game.config.height / 2 - 60, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.authorText = this.add.text(game.config.width / 2, game.config.height / 2 + 20, "Created by Mason Reoch", { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.startText = this.add.bitmapText(game.config.width / 2, game.config.height / 2 + 80, "rocketSquare", "Press SPACE to Start", 24).setOrigin(0.5);

        // Game Over text
        my.text.gameOver = this.add.bitmapText(game.config.width / 2, game.config.height / 2, "rocketSquare", "GAME OVER\nPress R to Restart").setOrigin(0.5).setCenterAlign();
        my.text.gameOver.visible = false;

        // Round announcement — shown briefly at the start of each round
        my.text.roundAnnounce = this.add.bitmapText(game.config.width / 2, game.config.height / 2 - 60, "rocketSquare", "", 64).setOrigin(0.5).setCenterAlign().setDepth(10);
        my.text.roundAnnounce.visible = false;

        // Health/logo indicators (can be used for display during gameplay)
        my.text.logo1 = this.add.text(0, 0, "").setVisible(false);
        my.text.logo2 = this.add.text(0, 0, "").setVisible(false);
        my.text.logo3 = this.add.text(0, 0, "").setVisible(false);
    }

    initGame() {
        let my = this.my;

        // Reset game state variables
        this.gameOver = false;
        this.myHealth = 3;
        this.myScore = 0;
        this.currentRound = 1;
        // Testing: make player invulnerable to damage while we test
        this.invulnerable = true;
        if (my.text && my.text.invul) my.text.invul.visible = this.invulnerable;

        // Determine player color first so HUD can use it to draw the correct health icons
        const colors = ["Beige", "Blue", "Green", "Pink", "Yellow"];
        this.playerColor = colors[Math.floor(Math.random() * colors.length)];

        // Update HUD text (safe to call because text objects exist before initGame() is ever called)
        if (my.text.gameOver) my.text.gameOver.visible = false;
        this.updateHealth();
        this.updateScore();
        // Round counter disabled while no enemies are implemented
        // this.updateRound();
        this.updateHighScoreUI();

        // Destroy any leftover sprites from a previous game
        for (let enemy of my.sprite.enemies) enemy.destroy();
        my.sprite.enemies = [];
        for (let b of my.sprite.bullet) b.destroy();
        my.sprite.bullet = [];
        for (let eb of my.sprite.enemyBullet) eb.destroy();
        my.sprite.enemyBullet = [];
        if (this.platforms) {
            this.platforms.clear(true, true);
        }
        this.platformSpawnCount = 0;

        // Destroy old player if one exists (e.g. on restart)
        if (my.sprite.player) my.sprite.player.destroy();

        my.sprite.player = this.physics.add.sprite(40, game.config.height - 120, `alien${this.playerColor}_newWalk1`).setScale(0.5).setCollideWorldBounds(true);
        my.sprite.player.facingDirection = 1;
        this.physics.add.collider(my.sprite.player, this.ground);
        // Standard collider; one-way behavior is handled via checkCollision flags on each platform
        this.platformCollider = this.physics.add.collider(my.sprite.player, this.platforms);
        this.isGroundPounding = false;

        // Round system disabled while no enemies are implemented
        // this.spawnRound(this.currentRound);
        // this.showRoundAnnouncement(this.currentRound);
    }

    update(time, delta) {
        let my = this.my;
        let dt = delta / 1000;

        // Debug: toggle invulnerability at runtime with I
        if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
            this.invulnerable = !this.invulnerable;
            if (my.text && my.text.invul) my.text.invul.visible = this.invulnerable;
            console.log("Invulnerable:", this.invulnerable);
        }

        // Scroll the parallax background (increases tilePositionX so texture moves up, simulating player moving down)
        for (let layer of this.parallaxLayers) {
            layer.sprite.tilePositionX += (this.bgScrollSpeed * layer.speed) * dt;
        }

        // Title Screen Logic
        if (this.gameState === "TITLE") {
            if (Phaser.Input.Keyboard.JustDown(this.space)) {
                this.gameState = "PLAYING";
                my.text.titleTextShadow1.visible = false;
                my.text.titleTextShadow2.visible = false;
                my.text.titleText.visible = false;
                my.text.authorText.visible = false;
                my.text.startText.visible = false;

                if (my.text.logo1) my.text.logo1.visible = true;
                if (my.text.logo2) my.text.logo2.visible = true;
                if (my.text.logo3) my.text.logo3.visible = true;
                if (my.text.score) my.text.score.visible = true;
                if (my.text.highScore) my.text.highScore.visible = true;
                // Round counter hidden while no enemies
                // if (my.text.round) my.text.round.visible = true;

                this.initGame();
            }
            return; // Don't run the rest of the game logic while on the title screen
        }

        // Game Over Restart Logic
        if (this.gameOver && Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.initGame();
        }

        if (this.gameState === "PLAYING" && !this.gameOver) {
            this.platformSpawnTimer -= delta;
            if (this.platformSpawnTimer <= 0) {
                this.spawnPlatform();
                this.platformSpawnTimer = Phaser.Math.Between(this.platformConfig.spawnIntervalRange[0], this.platformConfig.spawnIntervalRange[1]);
            }

            this.platforms.getChildren().forEach((platform) => {
                // Safety check: if platform has lost its velocity (stuck), restore it
                if (platform.body && platform.x > -500 && platform.x < game.config.width + 200) {
                    if (Math.abs(platform.body.velocity.x) < 1) {
                        // Platform is moving too slowly or not at all - restore velocity
                        let speed = platform._spawnMeta?.speed || 120;
                        platform.body.setVelocityX(-Math.abs(speed));
                        console.warn("Platform velocity reset to", -Math.abs(speed));
                    }
                }

                // Despawn when fully off-screen to the left
                if (platform.x < -(this.platformConfig.despawnBufferX + (platform.displayWidth / 2))) {
                    this.removePlatform(platform);
                }
            });
        }

        if (this.myHealth > 0) {
            let isMoving = false;
            // Improved ground detection using blocked/touching/onFloor
            let onGround = false;
            let onActualGround = false;
            if (my.sprite.player && my.sprite.player.body) {
                onGround = my.sprite.player.body.blocked.down || my.sprite.player.body.touching.down || my.sprite.player.body.onFloor();
                
                // Check if the player is specifically touching the ground object at the bottom of the screen
                if (onGround && my.sprite.player.body.bottom >= this.ground.y - (this.ground.height / 2) - 1) {
                    onActualGround = true;
                }
            }
            
            if (onActualGround && !this.wasOnActualGround) {
                // Check if a ground-spawned platform already exists on screen
                let groundPlatformExists = this.platforms.getChildren().some(p => p.isGroundSpawn);
                if (!groundPlatformExists || this.isGroundPounding) {
                    this.spawnPlatform(my.sprite.player.y - 60, true);
                }
            }
            this.wasOnActualGround = onActualGround;

            if (onGround) {
                this.lastGrounded = time;
                this.jumpsRemaining = this.maxJumps; // reset jumps when grounded
                
                // Reset ground pound state upon landing
                if (this.isGroundPounding) {
                    this.isGroundPounding = false;
                    if (this.platformCollider) this.platformCollider.active = true;
                }
            }

            // Ground pound trigger
            if (!onGround && Phaser.Input.Keyboard.JustDown(this.shift) && !this.isGroundPounding) {
                this.isGroundPounding = true;
                my.sprite.player.setVelocityX(0); // Stop horizontal movement
                if (this.platformCollider) this.platformCollider.active = false; // Disable platform collision
            }

            // Ground pound active logic
            if (this.isGroundPounding) {
                my.sprite.player.setVelocityY(2000); // Force fast slam
                this.physics.overlap(my.sprite.player, this.platforms, (player, platform) => {
                    let explosion = this.add.sprite(platform.x, platform.y, "explosion-1").setScale(2).play("enemyExplosion");
                    this.removePlatform(platform);
                    this.sound.play("explosion", { volume: 0.8 });
                });
            }

            // Move horizontally
            if (my.sprite.player) {
                if (this.isGroundPounding) {
                    my.sprite.player.setVelocityX(0); // Lock movement
                } else if (this.left.isDown) {
                    my.sprite.player.setVelocityX(-this.playerSpeed);
                    my.sprite.player.setFlipX(true);
                    my.sprite.player.facingDirection = -1;
                    isMoving = true;
                } else if (this.right.isDown) {
                    my.sprite.player.setVelocityX(this.playerSpeed);
                    my.sprite.player.setFlipX(false);
                    my.sprite.player.facingDirection = 1;
                    isMoving = true;
                } else {
                    my.sprite.player.setVelocityX(0);
                }

                // Jump with W — first jump uses coyote time, second is a mid-air double jump
                if (Phaser.Input.Keyboard.JustDown(this.up) && this.jumpsRemaining > 0 && !this.isGroundPounding) {
                    // Allow coyote-time grace for the first jump off a ledge
                    if (!onGround && this.jumpsRemaining === this.maxJumps && (time - this.lastGrounded) > this.coyoteTime) {
                        // Fell off a ledge and coyote time expired — costs the first jump
                        this.jumpsRemaining--;
                    }
                    if (this.jumpsRemaining > 0) {
                        my.sprite.player.setVelocityY(-this.jumpSpeed);
                        this.jumpsRemaining--;
                    }
                }
            }

            // Play or stop animation based on horizontal movement
            if (my.sprite.player) {
                if (isMoving) {
                    my.sprite.player.play(`walk_${this.playerColor}`, true);
                } else {
                    my.sprite.player.stop();
                }
            }

            // Check for bullet being fired
            if (Phaser.Input.Keyboard.JustDown(this.space)) {
                if (my.sprite.player && my.sprite.bullet.length < this.maxBullets) {
                    let dir = my.sprite.player.facingDirection || 1;
                    let offsetX = dir === -1 ? -(my.sprite.player.displayWidth / 2) : (my.sprite.player.displayWidth / 2);
                    let newBullet = this.add.sprite(
                        my.sprite.player.x + offsetX, my.sprite.player.y, "bullet"
                    );
                    newBullet.setAngle(dir === -1 ? -90 : 90);
                    newBullet.fireDirection = dir;
                    my.sprite.bullet.push(newBullet);
                    this.sound.play("playerFire");
                }
            }
        }

        // Remove all of the bullets which are offscreen
        // filter() goes through all of the elements of the array, and
        // only returns those which **pass** the provided test (conditional)
        // In this case, the condition is, is the y value of the bullet
        // greater than zero minus half the display height of the bullet? 
        // (i.e., is the bullet fully offscreen to the top?)
        // We store the array returned from filter() back into the bullet
        // array, overwriting it. 
        // This does have the impact of re-creating the bullet array on every 
        // update() call. 
        my.sprite.bullet = my.sprite.bullet.filter((bullet) => {
            if (bullet.x < game.config.width + (bullet.displayWidth / 2) && bullet.x > -(bullet.displayWidth / 2)) {
                return true;
            } else {
                bullet.destroy();
                return false;
            }
        });

        // Filter enemy bullets if they travel entirely off any side of the screen and destroy them
        my.sprite.enemyBullet = my.sprite.enemyBullet.filter((enemyBullet) => {
            if (enemyBullet.x > -(enemyBullet.displayWidth / 2) &&
                enemyBullet.x < game.config.width + (enemyBullet.displayWidth / 2) &&
                enemyBullet.y > -(enemyBullet.displayHeight / 2) &&
                enemyBullet.y < game.config.height + (enemyBullet.displayHeight / 2)) {
                return true;
            } else {
                enemyBullet.destroy();
                return false;
            }
        });

        // Filter destroyed enemies to prevent memory leaks
        my.sprite.enemies = my.sprite.enemies.filter((enemy) => {
            if (enemy.visible) {
                return true;
            } else {
                enemy.destroy();
                return false;
            }
        });

        // Round progression disabled while no enemies are implemented
        // if (this.myHealth > 0 && my.sprite.enemies.length === 0) {
        //     this.currentRound++;
        //     this.updateRound();
        //     this.spawnRound(this.currentRound);
        //     this.showRoundAnnouncement(this.currentRound);
        // }

        // Move and update enemies (placeholder — new enemies will be implemented in bigZombie/smallZombie)
        for (let enemy of my.sprite.enemies) {
            if (enemy.visible && enemy.update) {
                enemy.update(time, dt);
            }
        }

        // Check for bullet collision with the enemies
        for (let bullet of my.sprite.bullet) {
            for (let enemy of my.sprite.enemies) {
                if (enemy.visible && this.collides(enemy, bullet)) {
                    bullet.x = game.config.width + 100; // Move bullet offscreen to be despawned

                    // Generic enemy hit logic
                    if (enemy.hp !== undefined) {
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            let enemyExplosion = this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(2).play("enemyExplosion");
                            enemy.visible = false;
                            enemy.x = -100;
                            this.myScore += (enemy.scorePoints || 100);
                            this.updateScore();
                            this.sound.play("explosion", { volume: 1 });
                        } else {
                            this.sound.play("explosion", { volume: 0.5 });
                        }
                    } else {
                        let enemyExplosion = this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(2).play("enemyExplosion");
                        enemy.visible = false;
                        enemy.x = -100;
                        this.myScore += (enemy.scorePoints || 100);
                        this.updateScore();
                        this.sound.play("explosion", { volume: 1 });
                    }
                }
            }
        }

        // Check for collision with the PLAYER
        if (this.myHealth > 0) {
            // 1. Player vs Enemy Body Collision
            for (let enemy of my.sprite.enemies) {
                if (enemy.visible && this.collides(my.sprite.player, enemy)) {
                    let playerExplosion = this.add.sprite(my.sprite.player.x, my.sprite.player.y, "explosion-1").setScale(2).play("enemyExplosion");

                    // Destroy the enemy on contact
                    enemy.visible = false;
                    enemy.x = -100;

                    if (!this.invulnerable && !this.isGroundPounding) {
                        this.myHealth -= 1;

                        // Explode the health badge when taking damage
                        if (this.myHealth >= 0) {
                            let lostIconX = 30 + this.myHealth * 40;
                            this.add.sprite(lostIconX, 570, "explosion-1").setScale(1.5).play("enemyExplosion");
                        }

                        this.updateHealth();
                        this.sound.play("explosion", { volume: 1 });

                        if (this.myHealth <= 0) {
                            my.sprite.player.destroy();
                            this.gameOver = true;
                            my.text.gameOver.visible = true;
                        }
                    }
                }
            }

            // 2. Player vs Enemy Bullet Collision
            for (let enemyBullet of my.sprite.enemyBullet) {
                if (this.collides(my.sprite.player, enemyBullet)) {
                    // start animation at player's location
                    let playerExplosion = this.add.sprite(my.sprite.player.x, my.sprite.player.y, "explosion-1").setScale(2).play("enemyExplosion");
                    // clear out enemy bullet -- put y offscreen bottom, will get reaped next update
                    enemyBullet.y = game.config.height + 100;
                    // Update health
                    if (!this.invulnerable && !this.isGroundPounding) {
                        this.myHealth -= 1;

                        // Explode the health badge  
                        if (this.myHealth >= 0) {
                            let lostIconX = 30 + this.myHealth * 40;
                            this.add.sprite(lostIconX, 570, "explosion-1").setScale(1.5).play("enemyExplosion");
                        }

                        this.updateHealth();
                        // Play sound
                        this.sound.play("explosion", {
                            volume: 1   // Can adjust volume using this, goes from 0 to 1
                        });

                        if (this.myHealth <= 0) {
                            my.sprite.player.destroy();
                            this.gameOver = true;
                            my.text.gameOver.visible = true;
                        }
                    }
                }
            }
        }

        // Make player bullets move
        for (let bullet of my.sprite.bullet) {
            let direction = bullet.fireDirection || 1;
            bullet.x += this.bulletSpeed * dt * direction;
        }

        // Make enemy bullets move
        for (let enemyBullet of my.sprite.enemyBullet) {
            if (enemyBullet.vx !== undefined && enemyBullet.vy !== undefined) {
                enemyBullet.x += enemyBullet.vx * dt;
                enemyBullet.y += enemyBullet.vy * dt;
            } else {
                enemyBullet.x -= this.enemyBulletSpeed * dt;
            }
        }
    }

    spawnPlatform(forcedY = null, isGroundSpawn = false) {
        let x = game.config.width + this.platformConfig.spawnBufferX;

        // Choose zone index: first few go to bottom zone, rest random
        let zoneIndex;
        if (this.platformSpawnCount < this.platformConfig.initialLowCount) {
            zoneIndex = this.numZones - 1; // bottom-most zone
        } else {
            zoneIndex = Phaser.Math.Between(0, this.numZones - 1);
        }

        let zone = this.zones[zoneIndex];

        // Select a random platform sprite
        let spriteKey = Phaser.Utils.Array.GetRandom(this.platformSpriteKeys);

        // Create the platform sprite with configured scale
        let pScale = this.platformConfig.platformScale || 1.5;
        let platform = this.platforms.create(x, 0, spriteKey).setOrigin(0.5).setScale(pScale);

        // Use the raw texture dimensions for the physics body (setSize works in unscaled space)
        let textureWidth = platform.width;
        let textureHeight = platform.height;
        let spriteHeight = platform.displayHeight;

        let children = this.platforms.getChildren();
        // The newly created platform is at the end of the children array.
        let lastPlatform = children.length > 1 ? children[children.length - 2] : null;
        
        // Calculate player's max jump height dynamically
        let jumpHeight = (this.jumpSpeed * this.jumpSpeed) / (2 * this.physics.world.gravity.y);
        let maxRise = Math.floor(0.66 * jumpHeight);
        let minDistance = spriteHeight + 40; // To prevent any overlap on the Y axis

        let validY = false;
        let attempts = 0;
        let y = 0;

        if (forcedY !== null) {
            y = forcedY;
        } else {
            while (!validY && attempts < 50) {
                y = Phaser.Math.Between(zone.top + Math.floor(spriteHeight / 2), zone.bottom - Math.floor(spriteHeight / 2));
                
                // Rule 1: If spawning higher (lower Y value), it cannot exceed 2/3 of player's jump
                if (lastPlatform && y < lastPlatform.y && (lastPlatform.y - y) > maxRise) {
                    attempts++;
                    continue;
                }

                // Rule 3: No two platforms onscreen can overlap on the Y axis
                let overlaps = false;
                for (let i = 0; i < children.length - 1; i++) { // Check against all EXCEPT the newly created one
                    if (Math.abs(y - children[i].y) < minDistance) {
                        overlaps = true;
                        break;
                    }
                }

                if (overlaps) {
                    attempts++;
                    continue;
                }

                validY = true;
            }

            // If we failed to find a valid non-overlapping Y after 50 attempts, enforce the jump height rule
            if (!validY && lastPlatform && y < lastPlatform.y && (lastPlatform.y - y) > maxRise) {
                y = lastPlatform.y - maxRise;
                y = Math.max(zone.top + Math.floor(spriteHeight / 2), y);
            }
        }

        platform.y = y;

        // Use constant platform speed
        let speed = this.platformConfig.platformSpeed;

        this.platformSpawnCount += 1;
        platform.isGroundSpawn = isGroundSpawn;
        this.addPlatformInstance(platform, textureWidth, textureHeight, speed, zoneIndex);
    }

    addPlatformInstance(platform, spriteWidth, spriteHeight, speed, zoneIndex) {
        platform.body.setImmovable(true);
        platform.body.allowGravity = false;
        platform.body.setCollideWorldBounds(false);
        platform.body.setSize(spriteWidth, spriteHeight, true);
        platform.body.setDrag(0);
        platform.body.setAngularVelocity(0);
        platform.body.setMaxVelocity(9999, 0);
        platform.body.setVelocityX(-Math.abs(speed));

        if (this.platformConfig.oneWay) {
            platform.body.checkCollision.up = true;
            platform.body.checkCollision.down = false;
            platform.body.checkCollision.left = false;
            platform.body.checkCollision.right = false;
        }

        platform._spawnMeta = { zoneIndex: zoneIndex, speed: speed, patternId: null };
        this.platforms.add(platform);
    }

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth / 2 + b.displayWidth / 2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight / 2 + b.displayHeight / 2)) return false;
        return true;
    }

    // One-way platform logic is now handled natively via platform.body.checkCollision flags

    removePlatform(platform) {
        if (!platform) return;
        let meta = platform._spawnMeta || {};
        if (meta.patternId) {
            let p = this.patterns[meta.patternId];
            if (p) {
                p.remaining = Math.max(0, p.remaining - 1);
                if (p.remaining === 0) this.onPatternComplete(meta.patternId);
            }
        }
        platform.destroy();
    }

    onPatternComplete(patternId) {
        console.log("Pattern complete:", patternId);
        // Placeholder: pattern selection logic could be added here
    }

    updateScore() {
        let my = this.my;
        my.text.score.setText("Score " + this.myScore);

        // Check if we beat the high score, update value and color if we did
        if (this.myScore > this.highScore) {
            this.highScore = this.myScore;
            this.highScoreColor = this.playerColor;
            this.updateHighScoreUI();
        }
    }

    updateHighScoreUI() {
        let my = this.my;
        my.text.highScore.setText("High " + this.highScore);
        if (this.highScore > 0) {
            my.sprite.highScoreBadge.setTexture(`alien${this.highScoreColor}_badge2`);
            my.sprite.highScoreBadge.visible = true;
        }
    }

    updateHealth() {
        let my = this.my;

        if (!my.sprite.healthIcons) my.sprite.healthIcons = [];

        // Clear existing icons
        for (let icon of my.sprite.healthIcons) {
            icon.destroy();
        }
        my.sprite.healthIcons = [];

        // Generate new icons
        for (let i = 0; i < this.myHealth; i++) {
            let icon = this.add.sprite(30 + i * 40, 570, `alien${this.playerColor}_badge1`).setScale(0.8);
            my.sprite.healthIcons.push(icon);
        }
    }

    updateRound() {
        let my = this.my;
        my.text.round.setText("Round " + this.currentRound);
    }

    showRoundAnnouncement(round) {
        let my = this.my;
        my.text.roundAnnounce.setText("Round " + round);
        my.text.roundAnnounce.visible = true;
        this.time.delayedCall(2000, () => {
            my.text.roundAnnounce.visible = false;
        });
    }

    spawnRound(round) {
        // TODO: Implement new enemy spawning using bigZombie and smallZombie
        // For now this is a placeholder
    }
}
