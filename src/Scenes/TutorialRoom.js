class TutorialRoom extends Phaser.Scene {
    constructor() {
        super("TutorialRoom");
        this.my = { sprite: {}, text: {} };
    }

    preload() {
        this.load.setPath("./assets/");

        // 1. Load the Tilemap
        this.load.tilemapTiledJSON("tutorialMap", "SpaceStationAda/spaceShip.tmj");

        // 2. Load the Tileset Image
        // NOTE: Make sure this exactly matches the PNG file in your assets folder!
        this.load.image("spaceShipTiles", "SpaceStationAda/SpaceStation_Tileset.png");

        this.load.spritesheet("SpaceStation_Objects", "SpaceStationAda/SpaceStation_Objects.png", {
            frameWidth: 352, frameHeight: 96
        });

        // Load player assets
        Player.preload(this);
    }

    create() {
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
        const boxesLayer = map.createLayer("Boxes", tilesetsArray, 0, 0);

        // Scale the map up by 2.5 so the 16x16 tiles look good on an 800x600 screen
        const mapScale = 2.5;
        if (backgroundLayer) backgroundLayer.setScale(mapScale);
        if (wallLayer) wallLayer.setScale(mapScale);
        if (boxesLayer) boxesLayer.setScale(mapScale);

        // 4. Set Collision on the Walls and Boxes based ONLY on the "collidable" property
        // This ensures decorative tiles placed on these layers remain pass-through!
        if (boxesLayer) {
            boxesLayer.setCollisionByProperty({ collidable: true });
        }
        if (wallLayer) {
            wallLayer.setCollisionByProperty({ collidable: true });
        }

        // 5. Get Spawn Points from the Object Layer
        let playerSpawnX = 100; // Defaults just in case
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

        // Visually crop 16 pixels (1 tile) off the bottom of the sprite to hide adjacent art.
        // We also reduce the physics hitbox so it accurately matches the new cropped visual size!
        let cropHeight = Math.max(1, this.my.sprite.door.height - 16);
        this.my.sprite.door.setCrop(0, 0, this.my.sprite.door.width, cropHeight);
        this.my.sprite.door.body.setSize(this.my.sprite.door.width, cropHeight);

        // Create the Door Opening Animation (Frames 0 to 9)
        this.anims.create({
            key: "doorOpen",
            frames: this.anims.generateFrameNumbers("SpaceStation_Objects", { start: 0, end: 9 }),
            frameRate: 10,
            repeat: 0
        });

        this.doorOpening = false; // Track if the animation is currently playing

        // 6. Spawn the Player
        this.my.sprite.player = new Player(this, playerSpawnX, playerSpawnY);

        // 7. Add Collider between Player and Boxes
        if (boxesLayer) {
            this.physics.add.collider(this.my.sprite.player, boxesLayer);
        }
        if (wallLayer) {
            this.physics.add.collider(this.my.sprite.player, wallLayer);
        }
    }

    update(time, delta) {
        let my = this.my;
        let isMoving = false;

        // Check for Door Proximity to Transition
        if (my.sprite.door && !this.doorOpening) {
            // Calculate distance to the center of the door
            let doorCenterX = my.sprite.door.x + (8 * 2.5); // 8 is half of 16px, 2.5 is the mapScale
            let doorCenterY = my.sprite.door.y + (8 * 2.5);
            let dist = Phaser.Math.Distance.Between(my.sprite.player.x, my.sprite.player.y, doorCenterX, doorCenterY);

            // If player is within 80 pixels, open the door!
            if (dist < 80) {
                this.doorOpening = true;
                my.sprite.door.play("doorOpen");

                // When animation finishes, jump to the ArcadeShooter scene
                my.sprite.door.once('animationcomplete', () => {
                    this.scene.start("ArcadeShooter");
                });
            }
        }

        if (my.sprite.player && my.sprite.player.active) {
            my.sprite.player.update(time, delta);
        }
    }
}