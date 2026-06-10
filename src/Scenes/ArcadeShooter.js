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
        this.my.sprite.deadEnemies = [];
        this.bulletsInChamber = 6;     // Track revolver ammo
        this.isReloading = false;      // Track if currently reloading

        this.myScore = 0;       // record a score as a class variable
        this.myHealth = 3;      // Start with 3 health
        this.gameOver = false;  // Track if the game is over
        this.highScore = 0;     // Track the high score across restarts
        this.gameState = "TITLE"; // Track if we are on the title screen
        // More typically want to use a global variable for score, since
        // it will be used across multiple scenes
    }

    preload() {
        this.load.setPath("./assets/");
        this.load.spritesheet("xeno-grunt-range-attack", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-range-attack.png", {
            frameWidth: 320,
            frameHeight: 320
        });
        this.load.spritesheet("xeno-grunt-prep-jump", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-prep-jump.png", {
            frameWidth: 320,
            frameHeight: 320
        });
        this.load.spritesheet("xeno-grunt-run", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-run.png", {
            frameWidth: 320, frameHeight: 320
        });
        this.load.spritesheet("xeno-grunt-idle", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-idle.png", {
            frameWidth: 320, frameHeight: 320
        });
        this.load.spritesheet("xeno-grunt-attack-2", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-attack-2.png", {
            frameWidth: 320, frameHeight: 320
        });
        this.load.spritesheet("xeno-grunt-attack-1", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-attack-1.png", {
            frameWidth: 320, frameHeight: 320
        });
        this.load.image("xeno-grunt-knockback", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-knockback.png");
        this.load.image("xeno-grunt-jumping", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-jumping.png");
        this.load.image("xeno-grunt-death", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-death-grounded.png");
        this.load.image("bullet", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-range-projectile.png");
        for (let i = 0; i <= 5; i++) {
            this.load.image(`bg${i}`, `${i}.png`);
        }

        this.load.spritesheet("hearts", "player/hearts.png", {
            frameWidth: 16,
            frameHeight: 16
        });

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

        // Load Zombie Images (frames will be dynamically sliced in create() based on filenames)
        this.load.setPath("./assets/big_Zombie/");
        this.load.image("bigZombieAttack1", "Zombie_Big_Side-left_First-Attack-Sheet8.png");
        this.load.image("bigZombieAttack2", "Zombie_Big_Side-left_Second-Attack-Sheet15.png");
        this.load.image("bigZombieDeath", "Zombie_Big_Side-left_Second-Death-Sheet8.png");
        this.load.image("bigZombieWalk", "Zombie_Big_Side-left_Walk-Sheet8.png");

        this.load.setPath("./assets/axe_Zombie/");
        this.load.image("axeZombieAttack", "Zombie_Axe_Side-left_Second-Attack-Sheet9.png");
        this.load.image("axeZombieDeath", "Zombie_Axe_Side-left_Second-Death-Sheet7.png");
        this.load.image("axeZombieIdle", "Zombie_Axe_Side-left_Idle-Sheet6.png");

        this.load.setPath("./assets/small_Zombie/");
        this.load.image("smallZombieAttack1", "Zombie_Small_Side-left_First-Attack-Sheet4.png");
        this.load.image("smallZombieAttack2", "Zombie_Small_Side-left_Second-Attack-Sheet11.png");
        this.load.image("smallZombieDeath", "Zombie_Small_Side-left_Second-Death-Sheet7.png");
        this.load.image("smallZombieWalk", "Zombie_Small_Side-left_Walk-Sheet6.png");
        this.load.image("axeThrown", "Axe_Side-left_Thrown-Sheet9.png"); // Load thrown axe projectile
        
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
        
        // Load Reload Sound Effects
        // Note: Change '.wav' to '.ogg' or '.mp3' if your files use a different extension!
        this.load.audio("revolverSpin", "RevolverSpin.mp3");
        this.load.audio("revolverCock", "revolverCock.mp3");
        
        this.load.audio("axeHitAudio", "axeHitAudio.mp3");
        this.load.audio("axeThrowAudio", "axeThrowAudio.mp3");

        this.load.audio("giantWalk", "giantWalk.mp3");
        this.load.audio("playerHit", "playerHitSound.mp3");
        this.load.audio("shiftSmash", "ShiftSmash.mp3");
        this.load.audio("playerJumping", "playerJumping.mp3");
        this.load.audio("gameOver", "gameOver.mp3");
        this.load.audio("sillyBoing", "sillyBoing.mp3");

        this.load.setPath("./assets/zombieSounds/");

        this.load.audio("zombie1", "zombie1.mp3");
        this.load.audio("zombie2", "zombie2.mp3");
        this.load.audio("zombie3", "zombie3.mp3");
        this.load.audio("zombie4", "zombie4.mp3");
        this.load.audio("zombie5", "zombie5.mp3");
        this.load.audio("zombie6", "zombie6.mp3");
        this.load.audio("zombie7", "zombie7.mp3");
    }

    create() {
        let my = this.my;

        // Array of sound keys loaded in preload to use for ambient horde noises
        this.zombieSoundKeys = ["zombie1", "zombie2", "zombie3", "zombie4", "zombie5", "zombie6", "zombie7"];

        // Safely check if the audio exists before adding and playing it to avoid crashes
        if (this.cache.audio.exists("space_audio")) {
            this.backgroundAudio = this.sound.add("space_audio");
            this.backgroundAudio.play({ loop: true, volume: 0.3 }); // Adjust volume as needed
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

        this.anims.create({
            key: "xeno-grunt-range-attack",
            frames: this.anims.generateFrameNumbers("xeno-grunt-range-attack", { start: 0, end: 6 }),
            frameRate: 15,
            repeat: 0
        });

        this.anims.create({
            key: "xeno-grunt-run",
            frames: this.anims.generateFrameNumbers("xeno-grunt-run", { start: 0, end: 7 }),
            frameRate: 15,
            repeat: -1
        });
        this.anims.create({
            key: "xeno-grunt-idle",
            frames: this.anims.generateFrameNumbers("xeno-grunt-idle", { start: 0, end: 1 }),
            frameRate: 4,
            repeat: -1
        });
        this.anims.create({
            key: "xeno-grunt-attack-2",
            frames: this.anims.generateFrameNumbers("xeno-grunt-attack-2", { start: 0, end: 6 }),
            frameRate: 15,
            repeat: 0
        });
        this.anims.create({
            key: "xeno-grunt-attack-1",
            frames: this.anims.generateFrameNumbers("xeno-grunt-attack-1", { start: 0, end: 8 }),
            frameRate: 15,
            repeat: 0
        });

        // Dynamically slice the loaded zombie images into frames based on the file names
        const zombieConfigs = [
            { key: "bigZombieAttack1", frames: 8 },
            { key: "bigZombieAttack2", frames: 15 },
            { key: "bigZombieDeath", frames: 8 },
            { key: "bigZombieWalk", frames: 8 },
            { key: "axeZombieAttack", frames: 9 },
            { key: "axeZombieDeath", frames: 7 },
            { key: "axeZombieIdle", frames: 6 },
            { key: "smallZombieAttack1", frames: 4 },
            { key: "smallZombieAttack2", frames: 11 },
            { key: "smallZombieDeath", frames: 7 },
            { key: "smallZombieWalk", frames: 6 },
            { key: "axeThrown", frames: 9 }
        ];

        for (let zc of zombieConfigs) {
            let tex = this.textures.get(zc.key);
            if (tex && tex.key !== '__MISSING') {
                let w = tex.source[0].width;
                let h = tex.source[0].height;
                let fw = Math.floor(w / zc.frames);
                // Create each frame dynamically on the texture
                for (let i = 0; i < zc.frames; i++) {
                    tex.add(i, 0, i * fw, 0, fw, h);
                }
            }
        }

        // Helper function to safely fetch generated frames
        const getZombieFrames = (key, count) => {
            let frames = [];
            for (let i = 0; i < count; i++) frames.push({ key: key, frame: i });
            return frames;
        };

        // Big Zombie Animations
        this.anims.create({ key: 'bigZombieWalkAnim', frames: getZombieFrames('bigZombieWalk', 8), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'bigZombieAttack1Anim', frames: getZombieFrames('bigZombieAttack1', 8), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'bigZombieAttack2Anim', frames: getZombieFrames('bigZombieAttack2', 15), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'bigZombieDeathAnim', frames: getZombieFrames('bigZombieDeath', 8), frameRate: 8, repeat: 0 });

        // Axe Zombie Animations
        this.anims.create({ key: 'axeZombieIdleAnim', frames: getZombieFrames('axeZombieIdle', 6), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'axeZombieAttackAnim', frames: getZombieFrames('axeZombieAttack', 9), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'axeZombieDeathAnim', frames: getZombieFrames('axeZombieDeath', 7), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'axeThrownAnim', frames: getZombieFrames('axeThrown', 9), frameRate: 15, repeat: -1 });

        // Small Zombie Animations
        this.anims.create({ key: 'smallZombieWalkAnim', frames: getZombieFrames('smallZombieWalk', 6), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'smallZombieAttack1Anim', frames: getZombieFrames('smallZombieAttack1', 4), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'smallZombieAttack2Anim', frames: getZombieFrames('smallZombieAttack2', 11), frameRate: 8, repeat: 0 });
        this.anims.create({ key: 'smallZombieDeathAnim', frames: getZombieFrames('smallZombieDeath', 7), frameRate: 8, repeat: 0 });

        // Create key objects
        this.up = this.input.keyboard.addKey("W");
        this.down = this.input.keyboard.addKey("S");
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.jKey = this.input.keyboard.addKey("J");
        this.rKey = this.input.keyboard.addKey("R");
        this.iKey = this.input.keyboard.addKey("I"); // Toggle invulnerability during tests
        this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // Set movement speeds (in pixels/sec)
        this.playerSpeed = 300;
        this.jumpSpeed = 1500;
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
            zoneTopMargin: 160,
            zoneBottomMargin: 220,
            platformSpeed: 200,
            spawnIntervalRange: [1000, 1500],
            initialLowCount: 2,
            platformMaxRiseRatio: 0.75,
            platformScale: 2,
            oneWay: true
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
        my.sprite.highScoreBadge = this.add.sprite(760, 27, "xeno-grunt-range-attack", 0).setScale(0.09);
        my.sprite.highScoreBadge.visible = false; // Hide until a score is actually achieved
        // Small on-screen indicator for invulnerability (hidden by default)
        my.text.invul = this.add.text(580, 55, "INVUL", { fontFamily: 'sans-serif', fontSize: '18px', fontStyle: 'bold', color: '#FF4444' }).setOrigin(0, 0);
        my.text.invul.visible = false;
        
        // Shift Cooldown UI
        my.text.slamLabel = this.add.bitmapText(20, 570, "rocketSquare", "SLAM", 16);
        my.text.slamLabel.visible = false;
        this.slamBarBg = this.add.graphics();
        this.slamBarBg.fillStyle(0x000000, 0.5);
        this.slamBarBg.fillRect(90, 570, 100, 16);
        this.slamBarBg.lineStyle(2, 0xffffff, 1);
        this.slamBarBg.strokeRect(90, 570, 100, 16);
        this.slamBarBg.visible = false;
        this.slamBar = this.add.graphics();
        this.slamBar.visible = false;

        // Title Screen Text
        my.text.titleTextShadow1 = this.add.text(game.config.width / 2 + 3, game.config.height / 2 - 63, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.titleTextShadow2 = this.add.text(game.config.width / 2 + 6, game.config.height / 2 - 66, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.titleText = this.add.text(game.config.width / 2, game.config.height / 2 - 60, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.authorText = this.add.text(game.config.width / 2, game.config.height / 2 + 20, "Created by Mason Reoch", { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.startText = this.add.bitmapText(game.config.width / 2, game.config.height / 2 + 80, "rocketSquare", "Press SPACE to Start", 24).setOrigin(0.5);

        // Game Over text
        my.text.gameOver = this.add.bitmapText(game.config.width / 2, game.config.height / 2, "rocketSquare", "GAME OVER\nPress R to Restart").setOrigin(0.5).setCenterAlign();
        my.text.gameOver.visible = false;

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
        this.zombieGroupTimer = 4000;    // Time until next group of small zombies
        this.zombiesToSpawn = 0;         // Number of zombies to spawn in the current cluster
        this.zombieSpawnTimer = 0;       // Fast timer between individual spawns in a cluster
        this.bigZombieSpawnTimer = 12000; // Start spawning big zombies after 15 seconds
        this.zombieAmbientTimer = 4000;  // Start playing horde sounds when zombies arrive
        this.jumperZombieSpawnTimer = 3000; // Initial timer for jumping zombies once score hits 500
        this.bgScrollSpeed = 100;        // Reset parallax speed
        this.currentPlatformSpeed = this.platformConfig.platformSpeed;
        this.bulletsInChamber = 6;       // Reset ammo on restart
        this.isReloading = false;        // Reset reloading state
        this.lastSlamTime = 0;           // Reset slam cooldown timer
        this.slamReady = true;           // Reset slam readiness flag
        this.damageInvulnTimer = 0;      // Reset damage i-frames timer
        this.knockbackTimer = 0;         // Reset knockback visual timer
        // Testing: make player invulnerable to damage while we test
        this.invulnerable = false;
        if (my.text && my.text.invul) my.text.invul.visible = this.invulnerable;

        // Update HUD text (safe to call because text objects exist before initGame() is ever called)
        if (my.text.gameOver) my.text.gameOver.visible = false;
        this.updateHealth();
        this.updateScore();
        this.updateHighScoreUI();

        // Destroy any leftover sprites from a previous game
        for (let enemy of my.sprite.enemies) {
            if (enemy.walkSound) enemy.walkSound.stop();
            enemy.destroy();
        }
        my.sprite.enemies = [];
        if (my.sprite.deadEnemies) {
            for (let dead of my.sprite.deadEnemies) dead.destroy();
        }
        my.sprite.deadEnemies = [];
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
        if (my.sprite.deadPlayer) my.sprite.deadPlayer.destroy();

        my.sprite.player = this.physics.add.sprite(40, game.config.height - 400, "xeno-grunt-range-attack", 0).setScale(0.45).setCollideWorldBounds(true);
        my.sprite.player.body.setSize(70, 95, false); // Adjusted height to be 5 pixels taller
        my.sprite.player.body.setOffset(70, 225); // Push Y offset down to keep feet on the ground
        my.sprite.player.facingDirection = 1;
        this.physics.add.collider(my.sprite.player, this.ground);
        // Standard collider; one-way behavior is handled via checkCollision flags on each platform
        this.platformCollider = this.physics.add.collider(my.sprite.player, this.platforms);
        this.isGroundPounding = false;
        this.wasOnActualGround = false;
    }

    update(time, delta) {
        let my = this.my;
        let dt = delta / 1000;

        // Handle damage invulnerability timer and flashing effect
        if (this.damageInvulnTimer > 0) {
            this.damageInvulnTimer -= delta;
            if (my.sprite.player) {
                my.sprite.player.setAlpha(Math.floor(time / 100) % 2 === 0 ? 0.3 : 1);
            }
            if (this.damageInvulnTimer <= 0 && my.sprite.player) {
                my.sprite.player.setAlpha(1); // Ensure alpha resets cleanly when done
            }
        }
        if (this.knockbackTimer > 0) {
            this.knockbackTimer -= delta;
        }

        // Debug: toggle invulnerability at runtime with I
        if (Phaser.Input.Keyboard.JustDown(this.iKey)) {
            this.invulnerable = !this.invulnerable;
            if (my.text && my.text.invul) my.text.invul.visible = this.invulnerable;
            console.log("Invulnerable:", this.invulnerable);
        }

        // Slow the parallax background down if the game is over
        if (this.gameOver) {
            this.bgScrollSpeed = Math.max(0, this.bgScrollSpeed - 100 * dt);
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
                if (my.text.slamLabel) my.text.slamLabel.visible = true;
                if (this.slamBarBg) this.slamBarBg.visible = true;
                if (this.slamBar) this.slamBar.visible = true;

                this.initGame();
            }
            return; // Don't run the rest of the game logic while on the title screen
        }

        // Game Over Restart Logic
        if (this.gameOver && Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.initGame();
        }

        if (this.gameState === "PLAYING" && !this.gameOver) {
            // Increase platform speed over time (e.g., 1 pixel per second)
            this.currentPlatformSpeed += 1 * dt;

            this.platformSpawnTimer -= delta;
            if (this.platformSpawnTimer <= 0) {
                this.spawnPlatform();
                // Decrease spawn interval as speed increases to keep platforms from getting too far apart
                let speedRatio = this.platformConfig.platformSpeed / this.currentPlatformSpeed;
                this.platformSpawnTimer = Phaser.Math.Between(
                    this.platformConfig.spawnIntervalRange[0] * speedRatio,
                    this.platformConfig.spawnIntervalRange[1] * speedRatio
                );
            }
            
            // Zombie Group Spawn Logic
            if (this.zombiesToSpawn > 0) {
                this.zombieSpawnTimer -= delta;
                if (this.zombieSpawnTimer <= 0) {
                    this.spawnSmallZombie();
                    this.zombiesToSpawn--;
                    this.zombieSpawnTimer = Phaser.Math.Between(50, 150); 
                }
            } else {
                this.zombieGroupTimer -= delta;
                if (this.zombieGroupTimer <= 0) {
                    this.zombiesToSpawn = Phaser.Math.Between(8, 18); // Spawn a cluster of 4 to 10 zombies
                    this.zombieGroupTimer = Phaser.Math.Between(750, 1250); // Leave a .75 to 1.25 second gap between clusters
                }
            }

            if (this.myScore >= 500) {
                this.bigZombieSpawnTimer -= delta;
                if (this.bigZombieSpawnTimer <= 0) {
                    this.spawnBigZombie();
                    // Spawn big zombies much less often (every 3 to 8 seconds)
                    this.bigZombieSpawnTimer = Phaser.Math.Between(3000, 8000); 
                }
            }

            // Jumper Zombie Spawn Logic (Starts at 1000 score)
            if (this.myScore >= 1000) {
                this.jumperZombieSpawnTimer -= delta;
                if (this.jumperZombieSpawnTimer <= 0) {
                    this.spawnJumperZombie();
                    this.jumperZombieSpawnTimer = Phaser.Math.Between(1500, 4000); 
                }
            }

            // Zombie Ambient Sound Logic
            this.zombieAmbientTimer -= delta;
            if (this.zombieAmbientTimer <= 0) {
                let randomSound = Phaser.Utils.Array.GetRandom(this.zombieSoundKeys);
                this.sound.play(randomSound, { volume: 0.2 }); // Kept slightly quieter so it doesn't drown out gunfire
                // Play the next ambient sound randomly between 400ms and 1500ms from now
                this.zombieAmbientTimer = Phaser.Math.Between(400, 1500); 
            }


            // Update dead zombie velocities to match the world speed and their momentum
            for (let dead of my.sprite.deadEnemies) {
                if (dead.body && dead.baseSpeed !== undefined) {
                    dead.body.setVelocityX(-(this.currentPlatformSpeed + dead.baseSpeed));
                }
            }

            this.platforms.getChildren().forEach((platform) => {
                if (platform.body) {
                    platform.body.setVelocityX(-Math.abs(this.currentPlatformSpeed));
                    if (platform._spawnMeta) {
                        platform._spawnMeta.speed = this.currentPlatformSpeed;
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
                    
                    // Trigger outward shockwave explosions
                    let px = my.sprite.player.x;
                    let py = my.sprite.player.y + 40; // Ground level
                    
                    for (let i = 0; i < 3; i++) {
                        this.time.delayedCall(i * 60, () => {
                            if (!my.sprite.player || !my.sprite.player.active) return;
                            
                            let spawnExplosionAndKill = (exX) => {
                                this.add.sprite(exX, py, "explosion-1").setScale(2).play("enemyExplosion");
                                for (let enemy of my.sprite.enemies) {
                                    if (enemy.visible) {
                                        let dist = Math.abs(exX - enemy.x);
                                        let yDist = Math.abs(py - enemy.y);
                                        if (dist < 80 && yDist < 150) { // Check rectangular bounds
                                            this.playZombieDeathVisual(enemy);
                                            enemy.visible = false;
                                            enemy.x = -100;
                                            this.myScore += (enemy.scorePoints || 100);
                                            this.updateScore();
                                            let deathSound = enemy.type === "big" ? "explosion2" : "explosion";
                                            this.sound.play(deathSound, { volume: 1 });
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
                            this.sound.play("explosion", { volume: 0.4 });
                        });
                    }
                }
            }

            // Check if slam cooldown just finished
            if (this.myHealth > 0 && !this.slamReady && (time - this.lastSlamTime > 2000)) {
                this.slamReady = true;
            }
            
            // Update Slam Cooldown UI
            if (this.slamBar) {
                this.slamBar.clear();
                if (this.slamReady) {
                    this.slamBar.fillStyle(0x00ff00, 1); // Green when ready
                    this.slamBar.fillRect(90, 570, 100, 16);
                } else {
                    let elapsed = time - this.lastSlamTime;
                    let ratio = Math.max(0, Math.min(elapsed / 2000, 1));
                    this.slamBar.fillStyle(0xffaa00, 1); // Orange when recharging
                    this.slamBar.fillRect(90, 570, 100 * ratio, 16);
                }
            }

            // Ground pound trigger
            if (Phaser.Input.Keyboard.JustDown(this.shift) && !this.isGroundPounding && this.slamReady) {
                this.isGroundPounding = true;
                this.slamReady = false;
                this.lastSlamTime = time; // Record the time the slam was used for the cooldown
                my.sprite.player.setVelocityX(0); // Stop horizontal movement
                if (this.platformCollider) this.platformCollider.active = false; // Disable platform collision
                this.sound.play("shiftSmash", { volume: 1 });
                // Chain the two ground pound animations seamlessly
                my.sprite.player.play("xeno-grunt-attack-2").chain("xeno-grunt-attack-1");
            }

            // Ground pound active logic
            if (this.isGroundPounding) {
                my.sprite.player.setVelocityY(2000); // Force fast slam
                this.physics.overlap(my.sprite.player, this.platforms, (player, platform) => {
                    let explosion = this.add.sprite(platform.x, platform.y, "explosion-1").setScale(2).play("enemyExplosion");
                    this.removePlatform(platform);
                    this.sound.play("explosion", { volume: 0.8 });
                });

                // Kill all zombies beneath and in a small radius
                for (let enemy of my.sprite.enemies) {
                    if (enemy.visible) {
                        let dist = Phaser.Math.Distance.Between(my.sprite.player.x, my.sprite.player.y, enemy.x, enemy.y);
                        let dx = Math.abs(my.sprite.player.x - enemy.x);
                        let dy = enemy.y - my.sprite.player.y;
                        
                        // Enemy is beneath if lower than player and horizontally close
                        let isBeneath = dy > 0 && dx < 80;
                        
                        if (dist < 150 || isBeneath) {
                            this.playZombieDeathVisual(enemy);
                            enemy.visible = false;
                            enemy.x = -100;
                            this.myScore += (enemy.scorePoints || 100);
                            this.updateScore();
                            let deathSound = enemy.type === "big" ? "explosion2" : "explosion";
                            this.sound.play(deathSound, { volume: 1 });
                        }
                    }
                }
            }

            // Calculate platform speed if standing on one
            let platformSpeed = 0;
            if (onGround && !onActualGround) {
                for (let platform of this.platforms.getChildren()) {
                    if (my.sprite.player.body.bottom >= platform.body.top - 5 &&
                        my.sprite.player.body.bottom <= platform.body.top + 10 &&
                        my.sprite.player.body.right >= platform.body.left &&
                        my.sprite.player.body.left <= platform.body.right) {
                        platformSpeed = platform.body.velocity.x;
                        break;
                    }
                }
            }

            let isCrouching = this.down.isDown && !this.isGroundPounding;

            // Move horizontally
            if (my.sprite.player) {
                if (this.isGroundPounding) {
                    my.sprite.player.setVelocityX(0); // Lock movement
                } else if (this.left.isDown) {
                    my.sprite.player.setVelocityX(-this.playerSpeed + platformSpeed);
                    my.sprite.player.setFlipX(false);
                    my.sprite.player.facingDirection = 1;
                    isMoving = true;
                } else if (this.right.isDown) {
                    my.sprite.player.setVelocityX(this.playerSpeed + platformSpeed);
                    my.sprite.player.setFlipX(false);
                    my.sprite.player.facingDirection = 1;
                    isMoving = true;
                } else {
                    my.sprite.player.setVelocityX(platformSpeed);
                }

                // Jump with SPACE — first jump uses coyote time, second is a mid-air double jump
                if (Phaser.Input.Keyboard.JustDown(this.space) && this.jumpsRemaining > 0 && !this.isGroundPounding) {
                    // Allow coyote-time grace for the first jump off a ledge
                    
                    if (!onGround && this.jumpsRemaining === this.maxJumps && (time - this.lastGrounded) > this.coyoteTime) {
                        // Fell off a ledge and coyote time expired — costs the first jump
                        this.jumpsRemaining--;
                    }

                    if (this.jumpsRemaining > 0) {
                        my.sprite.player.setVelocityY(-this.jumpSpeed);
                        this.jumpsRemaining--;
                        this.sound.play("playerJumping", { volume: .2});
                    }
                }
            }

            // Check for bullet being fired
            if (Phaser.Input.Keyboard.JustDown(this.jKey)) {
                if (my.sprite.player && this.bulletsInChamber > 0 && !this.isReloading && !this.wasCrouching) {
                    this.bulletsInChamber--;
                    let dir = my.sprite.player.facingDirection || 1;
                    
                    // Adjust these offsets to fine-tune exactly where the bullet leaves the gun barrel!
                    let offsetX = 0; // Decreased from 72 to pull it left, closer to the player
                    let offsetY = 50; // Positive Y moves the bullet down from the sprite's origin
                    
                    let newBullet = this.add.sprite(
                        my.sprite.player.x + offsetX, my.sprite.player.y + offsetY, "bullet"
                    ).setScale(0.75); // You can adjust this number up or down to find the perfect size!
                    newBullet.setFlipX(dir === -1);
                    newBullet.fireDirection = dir;
                    my.sprite.bullet.push(newBullet);
                    this.sound.play("playerFire", { volume: 0.3 });
                
                    my.sprite.player.play("xeno-grunt-range-attack", true);

                    // Auto-reload if empty
                    if (this.bulletsInChamber <= 0) {
                        this.reloadGun();
                    }
                }
            }

            // Manual Reload
            if (Phaser.Input.Keyboard.JustDown(this.rKey) && !this.isReloading && this.bulletsInChamber < 6) {
                this.reloadGun();
            }

            // Play or stop animation based on horizontal movement
            if (my.sprite.player) {
                if (this.wasCrouching === undefined) this.wasCrouching = false;

                let currentAnim = my.sprite.player.anims.currentAnim?.key;
                let currentKey = my.sprite.player.texture.key;
                let isShooting = currentAnim === "xeno-grunt-range-attack" && my.sprite.player.anims.isPlaying;
                let isPoundingAnim = (currentAnim === "xeno-grunt-attack-2" || currentAnim === "xeno-grunt-attack-1") && my.sprite.player.anims.isPlaying;

                let targetOffsetX = 70;
                let targetOffsetY = 225; // Default standing offset
                
                // Prioritize the shoot animation offset!
                // If shooting mid-air, we keep the standing offset (225) so the sprite doesn't physically detach from the hitbox
                if (!onGround && !isCrouching && this.knockbackTimer <= 0 && !this.isGroundPounding && !isPoundingAnim && !isShooting) {
                    targetOffsetX = 150; // Jumping X offset
                    targetOffsetY = 100; // Jumping Y offset
                }

                if (this.knockbackTimer > 0) {
                    if (currentKey !== "xeno-grunt-knockback") {
                        my.sprite.player.stop();
                        my.sprite.player.setTexture("xeno-grunt-knockback", 0); 
                    }
                    this.wasCrouching = false;
                } else if (this.isGroundPounding || isPoundingAnim) {
                    // Let the attack-2 and attack-1 animations play out seamlessly
                    this.wasCrouching = false;
                } else if (isCrouching) {
                    if (!this.wasCrouching) {
                        let wasJumping = my.sprite.player.body.offset.y === 100; // Check if we were in the jumping hitbox before crouching
                        my.sprite.player.stop();
                        my.sprite.player.setTexture("xeno-grunt-prep-jump", 0);
                        my.sprite.player.body.setSize(70, 60, false); // Half height for ducking
                        my.sprite.player.body.setOffset(70, 260); // Push bounding box down to the feet
                        this.wasCrouching = true;
                        //this.sound.play("sillyBoing", { volume: 0.5 });

                        // If crouching while in the air (jumping bounding box), adjust the sprite 
                        // so the physical body doesn't instantly teleport downwards into the floor
                        if (wasJumping) {
                            my.sprite.player.x += 36;
                            my.sprite.player.y -= 56.25;
                        } 
                    }
                } else {
                    if (this.wasCrouching) {
                        my.sprite.player.setTexture("xeno-grunt-range-attack", 0);
                        my.sprite.player.body.setSize(70, 95, false); // Restore full height
                        my.sprite.player.body.setOffset(70, 225); // Restore offset
                        this.wasCrouching = false;
                    }

                    if (!isShooting) {
                        if (!onGround) {
                            if (currentKey !== "xeno-grunt-jumping") {
                                my.sprite.player.stop();
                                my.sprite.player.setTexture("xeno-grunt-jumping", 0);
                            }
                        } else {
                            if (onActualGround || isMoving) {
                                my.sprite.player.play("xeno-grunt-run", true);
                            } else {
                                my.sprite.player.play("xeno-grunt-idle", true);
                            }
                        }
                    }
                }

                // Apply jumping offset compensation if not currently crouching
                // This adjusts the sprite X and Y to perfectly counter the offset shift so the body NEVER moves
                if (!isCrouching && !this.wasCrouching) {
                    if (targetOffsetY === 100 && my.sprite.player.body.offset.y !== 100) {
                        my.sprite.player.body.setSize(70, 95, false);
                        my.sprite.player.body.setOffset(150, 100);
                        my.sprite.player.x -= 36; 
                        my.sprite.player.y += 56.25; 
                    } else if (targetOffsetY === 225 && my.sprite.player.body.offset.y !== 225) {
                        my.sprite.player.body.setSize(70, 95, false);
                        my.sprite.player.body.setOffset(70, 225);
                        my.sprite.player.x += 36;
                        my.sprite.player.y -= 56.25;
                    }
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

        // Filter destroyed enemies to prevent memory leaks, or despawn if completely off-screen left
        my.sprite.enemies = my.sprite.enemies.filter((enemy) => {
            if (enemy.visible && enemy.x > -(enemy.displayWidth || 100)) {
                return true;
            } else {
                if (enemy.walkSound) {
                    if (!enemy.visible) {
                        // Enemy was killed (visible was set to false), stop sound instantly
                        enemy.walkSound.stop();
                    } else {
                        // Enemy safely wandered off-screen, fade out over 1 second
                        this.tweens.add({
                            targets: enemy.walkSound,
                            volume: 0,
                            duration: 1000,
                            onComplete: (tween, targets) => {
                                targets[0].stop();
                            }
                        });
                    }
                }
                enemy.destroy();
                return false;
            }
        });

        // Filter dead enemies completely off-screen left
        my.sprite.deadEnemies = my.sprite.deadEnemies.filter((dead) => {
            if (dead.x > -(dead.displayWidth || 100)) {
                return true;
            } else {
                dead.destroy();
                return false;
            }
        });

        // Move and update enemies
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
                    let deathSound = enemy.type === "big" ? "explosion2" : "explosion";
                    if (enemy.hp !== undefined) {
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            this.playZombieDeathVisual(enemy);
                            enemy.visible = false;
                            enemy.x = -100;
                            this.myScore += (enemy.scorePoints || 100);
                            this.updateScore();
                            this.sound.play(deathSound, { volume: 1 });
                        } else {
                            this.sound.play("explosion", { volume: 1 });
                        }
                    } else {
                        this.playZombieDeathVisual(enemy);
                        enemy.visible = false;
                        enemy.x = -100;
                        this.myScore += (enemy.scorePoints || 100);
                        this.updateScore();
                        this.sound.play(deathSound, { volume: 1 });
                    }
                    break; // Stop checking this bullet against other enemies since it already hit one
                }
            }
        }

        // Check for collision with the PLAYER
        if (this.myHealth > 0) {
            let isPoundingAnim = false;
            if (my.sprite.player && my.sprite.player.anims) {
                let currentAnim = my.sprite.player.anims.currentAnim?.key;
                isPoundingAnim = (currentAnim === "xeno-grunt-attack-2" || currentAnim === "xeno-grunt-attack-1") && my.sprite.player.anims.isPlaying;
            }

            // 1. Player vs Enemy Body Collision
            for (let enemy of my.sprite.enemies) {
                if (enemy.visible && this.collides(my.sprite.player, enemy)) {
                    let playerDied = false;

                    if (!this.invulnerable && !this.isGroundPounding && !isPoundingAnim && this.damageInvulnTimer <= 0) {
                        this.myHealth -= 1;
                        this.damageInvulnTimer = 2000; // 2 seconds of invulnerability
                        this.knockbackTimer = 500;     // 0.5 seconds of knockback visual

                        this.updateHealth();
                        this.sound.play("playerHit", { volume: 1 });

                        if (this.myHealth <= 0) {
                            playerDied = true;
                            my.sprite.player.visible = false;
                            my.sprite.player.body.setEnable(false); // Stop physics interactions

                            my.sprite.deadPlayer = this.add.sprite(my.sprite.player.x, my.sprite.player.body.bottom, "xeno-grunt-death")
                                .setScale(my.sprite.player.scaleX)
                                .setOrigin(0.5, 1); // Anchor to feet
                                
                            if (my.sprite.player.facingDirection === -1) my.sprite.deadPlayer.setFlipX(true);

                            this.gameOver = true;
                            my.text.gameOver.visible = true;
                            this.sound.play("gameOver", { volume: 3 });
                        }
                    }

                    // Only destroy the enemy on contact if it didn't kill the player
                    if (!playerDied) {
                        this.playZombieDeathVisual(enemy);
                        enemy.visible = false;
                        enemy.x = -100;
                    }
                }
            }

            // 2. Player vs Enemy Bullet Collision
            for (let enemyBullet of my.sprite.enemyBullet) {
                if (this.collides(my.sprite.player, enemyBullet)) {
                    // Immune to axe projectiles while crouched
                    if (this.wasCrouching) continue;

                    // clear out enemy bullet -- put y offscreen bottom, will get reaped next update
                    enemyBullet.y = game.config.height + 100;
                    // Update health
                    if (!this.invulnerable && !this.isGroundPounding && !isPoundingAnim && this.damageInvulnTimer <= 0) {
                        this.myHealth -= 1;
                        this.damageInvulnTimer = 2000; // 2 seconds of invulnerability
                        this.knockbackTimer = 500;     // 0.5 seconds of knockback visual

                        this.updateHealth();
                        // Play sound
                        this.sound.play("playerHit", {
                            volume: 1   // Can adjust volume using this, goes from 0 to 1
                        });

                        if (this.myHealth <= 0) {
                            my.sprite.player.visible = false;
                            my.sprite.player.body.setEnable(false); // Stop physics interactions
                            
                            my.sprite.deadPlayer = this.add.sprite(my.sprite.player.x, my.sprite.player.body.bottom, "xeno-grunt-death")
                                .setScale(my.sprite.player.scaleX)
                                .setOrigin(0.5, 1); // Anchor to feet
                                
                            if (my.sprite.player.facingDirection === -1) my.sprite.deadPlayer.setFlipX(true);

                            this.gameOver = true;
                            my.text.gameOver.visible = true;
                            this.sound.play("gameOver", { volume: 1 });
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

                // Rule 3: No two platforms onscreen can overlap on both the X and Y axes
                let overlaps = false;
                for (let i = 0; i < children.length - 1; i++) { // Check against all EXCEPT the newly created one
                    let other = children[i];
                    let minDistX = (platform.displayWidth / 2) + (other.displayWidth / 2) + 50; // 50px X buffer
                    let minDistY = (platform.displayHeight / 2) + (other.displayHeight / 2) + 40; // 40px Y buffer
                    if (Math.abs(x - other.x) < minDistX && Math.abs(y - other.y) < minDistY) {
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
        }

        // If we failed to find a valid non-overlapping Y after 50 attempts (or forcedY was used), fix it!
        if (!validY) {
            // First, enforce the jump height rule if we fell out of the loop
            if (forcedY === null && lastPlatform && y < lastPlatform.y && (lastPlatform.y - y) > maxRise) {
                y = lastPlatform.y - maxRise;
                y = Math.max(zone.top + Math.floor(spriteHeight / 2), y);
            }

            // Now that Y is determined, push X to the right until it is clear of all overlaps
            let safeXFound = false;
            while (!safeXFound) {
                let overlaps = false;
                for (let i = 0; i < children.length - 1; i++) {
                    let other = children[i];
                    let minDistX = (platform.displayWidth / 2) + (other.displayWidth / 2) + 50;
                    let minDistY = (platform.displayHeight / 2) + (other.displayHeight / 2) + 40;
                    if (Math.abs(x - other.x) < minDistX && Math.abs(y - other.y) < minDistY) {
                        overlaps = true;
                        break;
                    }
                }
                if (!overlaps) {
                    safeXFound = true;
                } else {
                    x += 100; // Shift right by 100 pixels and try again
                }
            }
        }

        platform.x = x;
        platform.y = y;

        // Use dynamic platform speed
        let speed = this.currentPlatformSpeed;

        this.platformSpawnCount += 1;
        platform.isGroundSpawn = isGroundSpawn;
        this.addPlatformInstance(platform, textureWidth, textureHeight, speed, zoneIndex);

        // If a high platform was spawned, also spawn a low platform slightly offset on the X axis
        if (!isGroundSpawn && forcedY === null && y < (game.config.height / 2) - 50) {
            let offsetX = Phaser.Math.Between(150, 350); // Slight X offset so they aren't perfectly stacked
            let lowX = x + offsetX;
            let spriteKeyLow = Phaser.Utils.Array.GetRandom(this.platformSpriteKeys);
            let platformLow = this.platforms.create(lowX, 0, spriteKeyLow).setOrigin(0.5).setScale(pScale);
            
            let lowValidY = false;
            let lowAttempts = 0;
            let lowY = 0;
            let allPlatforms = this.platforms.getChildren();
            
            while (!lowValidY && lowAttempts < 50) {
                lowY = Phaser.Math.Between((game.config.height / 2) + 50, game.config.height - this.platformConfig.zoneBottomMargin);
                let overlaps = false;
                for (let i = 0; i < allPlatforms.length - 1; i++) { // Check against existing
                    let other = allPlatforms[i];
                    let minDistX = (platformLow.displayWidth / 2) + (other.displayWidth / 2) + 50; // 50px X buffer
                    let minDistY = (platformLow.displayHeight / 2) + (other.displayHeight / 2) + 40; // 40px Y buffer
                    if (Math.abs(lowX - other.x) < minDistX && Math.abs(lowY - other.y) < minDistY) {
                        overlaps = true;
                        break;
                    }
                }
                if (!overlaps) lowValidY = true;
                lowAttempts++;
            }
            
            // If it STILL overlaps after 50 attempts, push lowX to the right
            if (!lowValidY) {
                let safeXFound = false;
                while (!safeXFound) {
                    let overlaps = false;
                    for (let i = 0; i < allPlatforms.length - 1; i++) {
                        let other = allPlatforms[i];
                        let minDistX = (platformLow.displayWidth / 2) + (other.displayWidth / 2) + 50;
                        let minDistY = (platformLow.displayHeight / 2) + (other.displayHeight / 2) + 40;
                        if (Math.abs(lowX - other.x) < minDistX && Math.abs(lowY - other.y) < minDistY) {
                            overlaps = true;
                            break;
                        }
                    }
                    if (!overlaps) safeXFound = true;
                    else lowX += 100;
                }
            }

            platformLow.x = lowX;
            platformLow.y = lowY;
            
            let lowTexWidth = platformLow.width;
            let lowTexHeight = platformLow.height;
            this.addPlatformInstance(platformLow, lowTexWidth, lowTexHeight, speed, this.numZones - 1);
        }
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

        // 25% chance to spawn an Axe Zombie resting on this platform
        if (this.gameState === "PLAYING" && Phaser.Math.Between(1, 100) <= 25) {
            this.spawnAxeZombie(platform);
        }
    }

    // A center-radius AABB collision check, updated to use precise physics bodies when available!
    collides(a, b) {
        const getBounds = (obj) => {
            if (obj.body) {
                // Prioritize the tightly configured physics hitbox if it exists
                return {
                    left: obj.body.left,
                    right: obj.body.right,
                    top: obj.body.top,
                    bottom: obj.body.bottom
                };
            } else {
                // Fallback to visual bounds, but shrink non-physics projectiles by 40% so hits don't feel cheap
                let originX = obj.originX !== undefined ? obj.originX : 0.5;
                let originY = obj.originY !== undefined ? obj.originY : 0.5;
                
                let scaleReduction = 0.6; // 60% of original visual size
                let w = obj.displayWidth * scaleReduction; 
                let h = obj.displayHeight * scaleReduction;
                
                let centerX = obj.x - (obj.displayWidth * (originX - 0.5));
                let centerY = obj.y - (obj.displayHeight * (originY - 0.5));
                
                return {
                    left: centerX - (w / 2),
                    right: centerX + (w / 2),
                    top: centerY - (h / 2),
                    bottom: centerY + (h / 2)
                };
            }
        };

        let boxA = getBounds(a);
        let boxB = getBounds(b);
        
        // AABB overlap check
        if (boxA.right < boxB.left || boxA.left > boxB.right) return false;
        if (boxA.bottom < boxB.top || boxA.top > boxB.bottom) return false;
        
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
            this.updateHighScoreUI();
        }
    }

    updateHighScoreUI() {
        let my = this.my;
        my.text.highScore.setText("High " + this.highScore);
        if (this.highScore > 0) {
            my.sprite.highScoreBadge.setTexture("xeno-grunt-range-attack", 0);
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

        // Generate new icons (always draw 3, show empty frame 3 if health is lost)
        for (let i = 0; i < 3; i++) {
            let frame = (i < this.myHealth) ? 0 : 3;
            let icon = this.add.sprite(30 + i * 50, 30, "hearts", frame).setScale(3);
            my.sprite.healthIcons.push(icon);
        }
    }

    spawnSmallZombie() {
        new SmallZombie(this);
    }

    spawnBigZombie() {
        new BigZombie(this);
    }

    spawnJumperZombie() {
        new JumperZombie(this);
    }

    spawnAxeZombie(platform) {
        if (!platform || !platform.active) return;
        new AxeZombie(this, platform);
    }

    reloadGun() {
        // Prevent spamming the reload or reloading when already full
        if (this.isReloading || this.bulletsInChamber === 6) return;
        
        this.isReloading = true;
        this.sound.play("revolverSpin");
        
        // Approximate timing: 800ms for spin to finish, then play cock sound, then wait 400ms to allow firing.
        // You can tweak these timer values to perfectly match the duration of your audio files!
        this.time.delayedCall(50, () => {
            this.sound.play("revolverCock");
            this.time.delayedCall(600, () => {
                this.bulletsInChamber = 6;
                this.isReloading = false;
            });
        });
    }

    playZombieDeathVisual(enemy) {
        let animKey = "smallZombieDeathAnim";
        let spriteKey = "smallZombieDeath";
        
        if (enemy.type === "big") {
            animKey = "bigZombieDeathAnim";
            spriteKey = "bigZombieDeath";
        } else if (enemy.type === "axe") {
            animKey = "axeZombieDeathAnim";
            spriteKey = "axeZombieDeath";
        }
        
        let deathSprite = this.physics.add.sprite(enemy.x, enemy.y, spriteKey)
            .setScale(enemy.scaleX, enemy.scaleY)
            .setDepth(enemy.depth)
            .play(animKey);
            
        // Anchor to the bottom of the previous sprite so feet stay firmly planted
        let origY = enemy.originY !== undefined ? enemy.originY : 0.5;
        let enemyBottom = enemy.y + (enemy.displayHeight * (1 - origY));
        deathSprite.setOrigin(0.5, 1);
        deathSprite.y = enemyBottom;

        // Shift X to compensate for the death animation frame being a different width.
        // By subtracting half the difference, we anchor the back edge of the sprite,
        // which prevents the character from visually snapping backwards!
        let widthDiff = (deathSprite.width - enemy.width) * enemy.scaleX;
        deathSprite.x -= (widthDiff / 2);

        deathSprite.body.setAllowGravity(false);
        deathSprite.baseSpeed = enemy.baseSpeed; // Maintain the same momentum
        this.my.sprite.deadEnemies.push(deathSprite);
    }
}
