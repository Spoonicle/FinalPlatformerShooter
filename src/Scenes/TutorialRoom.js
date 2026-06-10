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

        // Load player assets if they aren't globally cached yet
        this.load.spritesheet("xeno-grunt-run", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-run.png", {
            frameWidth: 320, frameHeight: 320
        });
        this.load.spritesheet("xeno-grunt-idle", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-idle.png", {
            frameWidth: 320, frameHeight: 320
        });
        this.load.image("xeno-grunt-jumping", "player/xeno-grunt/xeno-grunt/spritesheets/5x/xeno-grunt-jumping.png");
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
        this.my.sprite.player = this.physics.add.sprite(playerSpawnX, playerSpawnY, "xeno-grunt-idle", 0).setScale(0.45);
        this.my.sprite.player.body.setSize(70, 95, false);
        this.my.sprite.player.body.setOffset(70, 225);
        // Set world bounds so the player can't walk off the screen
        this.my.sprite.player.setCollideWorldBounds(true);

        // 7. Add Collider between Player and Boxes
        if (boxesLayer) {
            this.physics.add.collider(this.my.sprite.player, boxesLayer);
        }
        if (wallLayer) {
            this.physics.add.collider(this.my.sprite.player, wallLayer);
        }

        // 8. Create Input Keys
        this.up = this.input.keyboard.addKey("W");
        this.down = this.input.keyboard.addKey("S");
        this.left = this.input.keyboard.addKey("A");
        this.right = this.input.keyboard.addKey("D");
        this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.shift = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
        
        // Basic Settings
        this.playerSpeed = 300;
        this.jumpSpeed = 1500; // Matched with ArcadeShooter jump speed
        this.coyoteTime = 150;
        this.lastGrounded = 0;
        this.maxJumps = 1;
        this.jumpsRemaining = this.maxJumps;
        this.isGroundPounding = false;
        this.wasCrouching = false;
        
        // Setup Player Animations
        if (!this.anims.exists("xeno-grunt-idle")) {
            this.anims.create({
                key: "xeno-grunt-idle",
                frames: this.anims.generateFrameNumbers("xeno-grunt-idle", { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1
            });
            this.anims.create({
                key: "xeno-grunt-run",
                frames: this.anims.generateFrameNumbers("xeno-grunt-run", { start: 0, end: 7 }),
                frameRate: 15,
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
        }
        
        this.my.sprite.player.play("xeno-grunt-idle", true);
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

        // Check if player is on the ground
        let onGround = my.sprite.player.body.blocked.down || my.sprite.player.body.onFloor();

        if (onGround) {
            this.lastGrounded = time;
            this.jumpsRemaining = this.maxJumps;
            if (this.isGroundPounding) {
                this.isGroundPounding = false;
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.shift) && !this.isGroundPounding) {
            this.isGroundPounding = true;
            my.sprite.player.setVelocityX(0);
            my.sprite.player.play("xeno-grunt-attack-2").chain("xeno-grunt-attack-1");
        }

        if (this.isGroundPounding) {
            my.sprite.player.setVelocityY(2000); // Force fast slam
        }

        let isCrouching = this.down.isDown && !this.isGroundPounding;

        if (my.sprite.player) {
            if (this.isGroundPounding) {
                my.sprite.player.setVelocityX(0);
            } else if (this.left.isDown) {
                my.sprite.player.setVelocityX(-this.playerSpeed);
                my.sprite.player.setFlipX(false);
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

            if (Phaser.Input.Keyboard.JustDown(this.space) && this.jumpsRemaining > 0 && !this.isGroundPounding) {
                if (!onGround && this.jumpsRemaining === this.maxJumps && (time - this.lastGrounded) > this.coyoteTime) {
                    this.jumpsRemaining--;
                }
                if (this.jumpsRemaining > 0) {
                    my.sprite.player.setVelocityY(-this.jumpSpeed);
                    this.jumpsRemaining--;
                }
            }
        }

        // Animations and hitbox shifts
        if (my.sprite.player) {
            if (this.wasCrouching === undefined) this.wasCrouching = false;

            let currentAnim = my.sprite.player.anims.currentAnim?.key;
            let currentKey = my.sprite.player.texture.key;
            let isPoundingAnim = (currentAnim === "xeno-grunt-attack-2" || currentAnim === "xeno-grunt-attack-1") && my.sprite.player.anims.isPlaying;

            let targetOffsetX = 70;
            let targetOffsetY = 225;
            
            if (!onGround && !isCrouching && !this.isGroundPounding && !isPoundingAnim) {
                targetOffsetX = 150;
                targetOffsetY = 100;
            }

            if (this.isGroundPounding || isPoundingAnim) {
                this.wasCrouching = false;
            } else if (isCrouching) {
                if (!this.wasCrouching) {
                    let wasJumping = my.sprite.player.body.offset.y === 100;
                    my.sprite.player.stop();
                    my.sprite.player.setTexture("xeno-grunt-prep-jump", 0);
                    my.sprite.player.body.setSize(70, 60, false);
                    my.sprite.player.body.setOffset(70, 260);
                    this.wasCrouching = true;
                    if (wasJumping) {
                        my.sprite.player.x += 36;
                        my.sprite.player.y -= 56.25;
                    } 
                }
            } else {
                if (this.wasCrouching) {
                    my.sprite.player.setTexture("xeno-grunt-idle", 0);
                    my.sprite.player.body.setSize(70, 95, false);
                    my.sprite.player.body.setOffset(70, 225);
                    this.wasCrouching = false;
                }

                if (!onGround) {
                    if (currentKey !== "xeno-grunt-jumping") {
                        my.sprite.player.stop();
                        my.sprite.player.setTexture("xeno-grunt-jumping", 0);
                    }
                } else {
                    if (isMoving) {
                        my.sprite.player.play("xeno-grunt-run", true);
                    } else {
                        my.sprite.player.play("xeno-grunt-idle", true);
                    }
                }
            }

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
}