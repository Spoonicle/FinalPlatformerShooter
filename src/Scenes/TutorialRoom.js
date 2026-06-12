class TutorialRoom extends Phaser.Scene {
    constructor() {
        super("TutorialRoom");
        this.my = { sprite: {}, text: {} };
    }

    preload() {
        this.load.setPath("./assets/");

        // 1. Load the Tilemap
        this.load.tilemapTiledJSON("tutorialMap", "spaceShip.tmj");

        // 2. Load the Tileset Image
        // NOTE: Make sure this exactly matches the PNG file in your assets folder!
        this.load.image("spaceShipTiles", "SpaceStationAda/SpaceStation_Tileset.png");

        this.load.spritesheet("SpaceStation_Objects", "SpaceStationAda/SpaceStation_Objects.png", {
            frameWidth: 16, frameHeight: 96
        });

        // Load player assets
        Player.preload(this);

        // Load small zombie assets
        SmallZombie.preload(this);

        // Load explosion assets
        this.load.image("explosion-1", "explosion-1.png");
        this.load.image("explosion-2", "explosion-2.png");
        this.load.image("explosion-3", "explosion-3.png");
        this.load.image("explosion-4", "explosion-4.png");
        this.load.image("explosion-5", "explosion-5.png");
        this.load.image("explosion-6", "explosion-6.png");
        this.load.image("explosion-7", "explosion-7.png");
        this.load.image("explosion-8", "explosion-8.png");

        this.load.audio("explosion", "explosionCrunch_000.ogg");
        this.load.audio("explosion2", "explosionCrunch_001.ogg");
        this.load.audio("DoorOpen", "DoorOpen.mp3");
        this.load.audio("DoorClose", "DoorClosing.mp3");

        // Load platform image for smash tutorial
        this.load.setPath("./assets/Platforms/");
        this.load.image("platform1", "Container_11_Green_Horizontal.png");
        this.load.setPath("./assets/");
    }

    create() {
        // Set TILE_BIAS to prevent the player from tunneling through floor tiles during fast ground pounds
        this.physics.world.TILE_BIAS = 64;

        // 1. Initialize Tilemap
        const map = this.add.tilemap("tutorialMap");

        // 2. Add Tileset Image
        // First arg: Name of the tileset INSIDE Tiled (SpaceStation_Tileset).
        // Second arg: The Phaser image key we just preloaded above (spaceShipTiles).
        const tileset1 = map.addTilesetImage("SpaceStation_Tileset", "spaceShipTiles", 16, 16);
        const tileset2 = map.addTilesetImage("SpaceStation_Objects", "SpaceStation_Objects", 16, 16);

        // 3. Create Layers
        // IMPORTANT: Replace "Background" and "Boxes" with exactly what you named the layers in Tiled.
        const tilesetsArray = [tileset1, tileset2];
        const backgroundLayer = map.createLayer("BG", tilesetsArray, 0, 0);
        const wallLayer = map.createLayer("Walls", tilesetsArray, 0, 0);
        const boxesLayer = map.layers.some(l => l.name === "Boxes") ? map.createLayer("Boxes", tilesetsArray, 0, 0) : null;
        const foregroundLayer = map.createLayer("Foreground", tilesetsArray, 0, 0);

        // Expose layers for external physics collision queries (e.g. Player corpse collision)
        this.wallLayer = wallLayer;
        this.boxesLayer = boxesLayer;

        // Scale the map up by 2.5 so the 16x16 tiles look good on an 800x600 screen
        const mapScale = 2.5;
        if (backgroundLayer) backgroundLayer.setScale(mapScale);
        if (wallLayer) wallLayer.setScale(mapScale);
        if (boxesLayer) boxesLayer.setScale(mapScale);
        if (foregroundLayer) foregroundLayer.setScale(mapScale);

        // 4. Set Collision on the Walls and Boxes based ONLY on the "collidable" property
        // This ensures decorative tiles placed on these layers remain pass-through!
        if (boxesLayer) {
            boxesLayer.setCollisionByProperty({ collidable: true });
            // Fallback: Tiled doesn't embed tileset custom properties in JSON exports by default.
            // Enable collision only on the boxes (tile ID 155), leaving the spawn capsule (IDs 102-170) pass-through.
            boxesLayer.setCollision([155]);
        }
        if (wallLayer) {
            wallLayer.setCollisionByProperty({ collidable: true });
            // Fallback: Tiled doesn't embed tileset custom properties in JSON exports by default.
            // Enable collision on floor and wall tiles matching collidable IDs in SpaceStation_Tileset.tsx.
            wallLayer.setCollision([1, 2, 3, 4, 5, 6, 12, 13, 14, 15, 16, 23, 24, 25]);
        }

        // 5. Get Spawn Points from the Object Layer
        let playerSpawnX = -500; // Defaults just in case
        let playerSpawnY = 300;

        // Get PlayerSpawn from its specific Object Layer
        const playerSpawnLayer = map.getObjectLayer("PlayerSpawn");
        if (playerSpawnLayer && playerSpawnLayer.objects && playerSpawnLayer.objects.length > 0) {
            let spawnObj = playerSpawnLayer.objects[0]; // Assuming there is one point in this layer
            playerSpawnX = spawnObj.x * mapScale;
            playerSpawnY = spawnObj.y * mapScale;
        }

        // Get Door from its specific Object Layer
        let doorX = 0;
        let doorY = 0;
        const doorLayer = map.getObjectLayer("Door");
        if (doorLayer && doorLayer.objects && doorLayer.objects.length > 0) {
            doorLayer.objects.forEach(obj => {
                if (obj.name === "doorTop") {
                    doorX = obj.x * mapScale;
                    // Subtract 16 (one tile) in Tiled coordinates before scaling to shift it up 1 tile
                    doorY = (obj.y - 16) * mapScale;
                }
            });
        }

        // Add the Door Sprite
        this.my.sprite.door = this.physics.add.sprite(doorX, doorY, "SpaceStation_Objects", 0).setScale(mapScale);
        this.my.sprite.door.setOrigin(0, 0); // Anchor to the top-left of the Tiled point
        this.my.sprite.door.body.setAllowGravity(false);
        this.my.sprite.door.body.setImmovable(true);

        // Visually crop 48 pixels off the bottom of the sprite to hide adjacent art.
        let cropHeight = Math.max(1, this.my.sprite.door.height - 48);
        this.my.sprite.door.setCrop(0, 0, this.my.sprite.door.width, cropHeight);
        this.my.sprite.door.body.setSize(this.my.sprite.door.width);

        // Dynamically crop the door sprite frame-by-frame as it plays its opening animation
        const cropAmounts = [48, 48, 54, 60, 66, 72, 80, 80, 80, 80];
        this.my.sprite.door.on('animationupdate', (animation, frame) => {
            let frameIdx = parseInt(frame.frame.name);
            if (isNaN(frameIdx)) {
                frameIdx = frame.index - 1;
            }
            let cropAmt = cropAmounts[frameIdx] !== undefined ? cropAmounts[frameIdx] : 96;
            let currentCropHeight = Math.max(0, this.my.sprite.door.height - cropAmt);
            this.my.sprite.door.setCrop(0, 0, this.my.sprite.door.width, currentCropHeight);
        });

        // Create the Door Opening Animation (Frames 0 to 9)
        this.anims.create({
            key: "doorOpen",
            frames: this.anims.generateFrameNumbers("SpaceStation_Objects", { start: 0, end: 9 }),
            frameRate: 10,
            repeat: 0
        });

        this.doorOpening = false; // Track if the animation is currently playing

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
            frameRate: 20,
            repeat: 0,
            hideOnComplete: true
        });

        // Initialize enemies list
        this.my.sprite.enemies = [];
        this.my.sprite.deadEnemies = [];

        // 6. Spawn the Player
        this.my.sprite.player = new Player(this, playerSpawnX, playerSpawnY);

        // Spawn the Small Zombie 80 pixels horizontally to the left of the door
        let zombieX = doorX - 10 * mapScale;
        let zombieY = 375;
        new SmallZombie(this, zombieX, zombieY, "smallZombieIdleAnim");

        // Initialize platforms group for smash tutorial
        this.platforms = this.physics.add.group({ immovable: true, allowGravity: false });

        // ====================================================================
        // PLATFORM CONFIGURATION SECTION
        // Feel free to adjust these values to move or customize the stacks!
        // ====================================================================
        const platformXOffset = -110;     // Adjust this to move all platform stacks left/right together
        const columnHeights = [2, 4, 3];  // Heights of the first (left), next (middle), and last (right) stacks
        const platformScale = 1.5;        // Visual scale of the platforms
        const platformSpacingY = 35;      // Vertical spacing between platform centers in each stack
        // ====================================================================

        // Helper to determine the dynamic width of the platform sprite for perfect horizontal spacing
        let tempPlatform = this.add.sprite(0, 0, "platform1").setScale(platformScale);
        const platformDisplayWidth = tempPlatform.displayWidth;
        tempPlatform.destroy();

        let basePlatformX = zombieX + platformXOffset;
        const bottomY = zombieY + 4;

        // Create the 3 columns of platform stacks
        for (let col = 0; col < columnHeights.length; col++) {
            // Offset each column horizontally by its index relative to the center column
            let colX = basePlatformX + (col - 1) * platformDisplayWidth;
            let numPlatforms = columnHeights[col];

            for (let i = 0; i < numPlatforms; i++) {
                let platformY = bottomY - i * platformSpacingY;
                let platform = this.platforms.create(colX, platformY, "platform1").setScale(platformScale);
                platform.body.setImmovable(true);
                platform.body.allowGravity = false;
                platform.body.setSize(platform.width, platform.height, true);

                // Enable all-sided collision so the stacks block the player path horizontally and vertically
                platform.body.checkCollision.up = true;
                platform.body.checkCollision.down = true;
                platform.body.checkCollision.left = true;
                platform.body.checkCollision.right = true;
            }
        }

        // Player vs Platforms collider (saved to platformCollider so Player.js can toggle it)
        this.platformCollider = this.physics.add.collider(this.my.sprite.player, this.platforms);

        // Player vs Enemies overlap
        this.physics.add.overlap(this.my.sprite.player, this.my.sprite.enemies, (player, enemy) => {
            if (enemy.visible && player.health > 0) {
                let playerDied = player.takeDamage();
                if (!playerDied) {
                    this.playZombieDeathVisual(enemy);
                    enemy.visible = false;
                    enemy.x = -100;
                }
            }
        });

        // 7. Add Collider between Player and Boxes
        if (boxesLayer) {
            this.physics.add.collider(this.my.sprite.player, boxesLayer);
        }
        if (wallLayer) {
            this.physics.add.collider(this.my.sprite.player, wallLayer);
        }

        // Transition to next scene when player overlaps with the opened/opening door
        this.physics.add.overlap(this.my.sprite.player, this.my.sprite.door, () => {
            if (this.doorOpening) {
                this.scene.start("ArcadeShooter");
            }
        }, null, this);

        // Create prompt text for the computer desk
        this.my.text.deskPrompt = this.add.text(320, 245, "S to dodge projectiles\n  Shift to ground slash", {
            fontFamily: 'PressStart2P',
            fontSize: '14px',
            color: '#FFFFFF',
            align: 'center',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setVisible(false);
    }

    update(time, delta) {
        let my = this.my;

        // Check for Computer Desk Proximity to show/hide tutorial prompt
        if (my.sprite.player && my.sprite.player.active && my.text.deskPrompt) {
            let px = my.sprite.player.x;
            let py = my.sprite.player.y;
            // Desk is at x = [240, 400], y = [320, 400]
            let nearDesk = (px >= 220 && px <= 420 && py >= 250 && py <= 450);
            my.text.deskPrompt.setVisible(nearDesk);
        }

        // Check for Door Proximity to open/close the door
        if (my.sprite.door) {
            // Calculate horizontal distance to the center of the door
            let doorCenterX = my.sprite.door.x + (8 * 2.5); // 8 is half of 16px, 2.5 is the mapScale
            let dist = Math.abs(my.sprite.player.x - doorCenterX);

            if (dist < 140) {
                if (!this.doorOpening) {
                    this.doorOpening = true;
                    my.sprite.door.anims.play("doorOpen");
                    this.sound.play("DoorOpen");
                }
            } else {
                if (this.doorOpening) {
                    this.doorOpening = false;
                    my.sprite.door.anims.playReverse("doorOpen");
                    this.sound.play("DoorClose");
                }
            }
        }

        if (my.sprite.player && my.sprite.player.active) {
            my.sprite.player.update(time, delta);
        }
    }

    playZombieDeathVisual(enemy) {
        SmallZombie.playDeathVisual(this, enemy);
    }

    removePlatform(platform) {
        if (platform) {
            platform.destroy();
        }
    }
}