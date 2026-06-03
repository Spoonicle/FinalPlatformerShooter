class ArcadeShooter extends Phaser.Scene {
    constructor() {
        super("ArcadeShooter");

        // Initialize a class variable "my" which is an object.
        // The object has two properties, both of which are objects
        //  - "sprite" holds bindings (pointers) to created sprites
        //  - "text"   holds bindings to created bitmap text objects
        this.my = {sprite: {}, text: {}};

        // Create a property inside "sprite" named "bullet".
        // The bullet property has a value which is an array.
        // This array will hold bindings (pointers) to bullet sprites
        this.my.sprite.bullet = [];
        this.my.sprite.enemyBullet = [];
        this.my.sprite.enemies = [];
        this.maxBullets = 1;           // Don't create more than this many bullets
        
        this.myScore = 0;       // record a score as a class variable
        this.myHealth = 3;      // Start with 3 health
        this.currentRound = 1;  // Start at round 1
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
        this.load.image("snake", "snake.png");
        this.load.image("snake_walk", "snake_walk.png");
        this.load.image("redSnake", "snakeLava.png");
        this.load.image("redSnake_ani", "snakeLava_ani.png");
        this.load.image("redSnake_dead", "snakeLava_dead.png");
        this.load.image("redSnake_hit", "snakeLava_hit.png");
        this.load.image("greenSnake", "snakeSlime.png");
        this.load.image("greenSnake_ani", "snakeSlime_ani.png");
        this.load.image("greenSnake_dead", "snakeSlime_dead.png");
        this.load.image("greenSnake_hit", "snakeSlime_hit.png");
        this.load.image("greenSnake", "snakeSlime.png");
        this.load.image("slimeBlock", "slimeBlock.png");
        this.load.image("barnacle", "barnacle.png");
        this.load.image("barnacleBite", "barnacle_bite.png");
        this.load.image("barnacleHit", "barnacle_hit.png");
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

        // Create green snake / boss animation
        this.anims.create({
            key: "greenSnakeAnim",
            frames: [
                { key: "greenSnake" },
                { key: "greenSnake_ani" }
            ],
            frameRate: 4,
            repeat: -1
        });
        
        // Create enemy bullet animation
        this.anims.create({
            key: "enemyBulletAnim",
            frames: [
                { key: "snake" },
                { key: "snake_walk" }
            ],
            frameRate: 8,
            repeat: -1
        });

        // Create red snake pop-up animation
        this.anims.create({
            key: "redSnakeAnim",
            frames: [
                { key: "redSnake" },
                { key: "redSnake_ani" }
            ],
            frameRate: 4,
            repeat: -1
        });

        // Create red snake pop-up animation
        this.anims.create({
            key: "barnacleAnim",
            frames: [
                { key: "barnacle" },
                { key: "barnacleBite" }
            ],
            frameRate: 4,
            repeat: -1
        });

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

        // Set movement speeds (in pixels/sec)
        this.playerSpeed = 250;
        this.bulletSpeed = 500;
        this.enemyBulletSpeed = 300;
        this.enemySpeed = 100;

        // update HTML description
        document.getElementById('description').innerHTML = '<h2>Vendetta</h2><br>WASD: Move // Space: Fire // R: Restart'

        // HUD
        my.text.logo1 = this.add.text(10, 5, "vendetta", { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'oblique', color: '#FFFFFF' });
        my.text.logo2 = this.add.text(11, 6, "vendetta", { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'oblique', color: '#FFFFFF' });
        my.text.logo3 = this.add.text(12, 7, "vendetta", { fontFamily: 'sans-serif', fontSize: '28px', fontStyle: 'oblique', color: '#FFFFFF' });
        my.text.logo1.visible = false;
        my.text.logo2.visible = false;
        my.text.logo3.visible = false;

        my.text.score  = this.add.bitmapText(580, 5,   "rocketSquare", "Score 0",  20);
        my.text.score.visible = false;
        
        // High Score UI
        my.text.highScore = this.add.bitmapText(580, 30, "rocketSquare", "High 0", 20);
        my.text.highScore.visible = false;
        my.sprite.highScoreBadge = this.add.sprite(760, 27, `alien${this.highScoreColor}_badge2`).setScale(0.8);
        my.sprite.highScoreBadge.visible = false; // Hide until a score is actually achieved
        
        my.text.round  = this.add.bitmapText(350, 5,   "rocketSquare", "Round 1",  20);
        my.text.round.visible = false;

        // Title Screen Text
        my.text.titleTextShadow1 = this.add.text(game.config.width/2 + 3, game.config.height/2 - 63, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.titleTextShadow2 = this.add.text(game.config.width/2 + 6, game.config.height/2 - 66, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.titleText = this.add.text(game.config.width/2, game.config.height/2 - 60, "VENDETTA", { fontFamily: 'sans-serif', fontSize: '64px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.authorText = this.add.text(game.config.width/2, game.config.height/2 + 20, "Created by Mason Reoch", { fontFamily: 'sans-serif', fontSize: '24px', fontStyle: 'italic bold', color: '#FFFFFF' }).setOrigin(0.5);
        my.text.startText = this.add.bitmapText(game.config.width/2, game.config.height/2 + 80, "rocketSquare", "Press SPACE to Start", 24).setOrigin(0.5);

        // Game Over text
        my.text.gameOver = this.add.bitmapText(game.config.width/2, game.config.height/2, "rocketSquare", "GAME OVER\nPress R to Restart").setOrigin(0.5).setCenterAlign();
        my.text.gameOver.visible = false;

        // Round announcement — shown briefly at the start of each round
        my.text.roundAnnounce = this.add.bitmapText(game.config.width/2, game.config.height/2 - 60, "rocketSquare", "", 64).setOrigin(0.5).setCenterAlign().setDepth(10);
        my.text.roundAnnounce.visible = false;
    }

    initGame() {
        let my = this.my;

        // Reset game state variables
        this.gameOver = false;
        this.myHealth = 3;
        this.myScore = 0;
        this.currentRound = 1;

        // Determine player color first so HUD can use it to draw the correct health icons
        const colors = ["Beige", "Blue", "Green", "Pink", "Yellow"];
        this.playerColor = colors[Math.floor(Math.random() * colors.length)];

        // Update HUD text (safe to call because text objects exist before initGame() is ever called)
        if (my.text.gameOver) my.text.gameOver.visible = false;
        this.updateHealth();
        this.updateScore();
        this.updateRound();
        this.updateHighScoreUI();

        // Destroy any leftover sprites from a previous game
        for (let enemy of my.sprite.enemies) enemy.destroy();
        my.sprite.enemies = [];
        for (let b of my.sprite.bullet) b.destroy();
        my.sprite.bullet = [];
        for (let eb of my.sprite.enemyBullet) eb.destroy();
        my.sprite.enemyBullet = [];

        // Destroy old player if one exists (e.g. on restart)
        if (my.sprite.player) my.sprite.player.destroy();

        my.sprite.player = this.add.sprite(40, game.config.height / 2, `alien${this.playerColor}_newWalk1`).setScale(0.5);
        my.sprite.player.facingDirection = 1;

        this.spawnRound(this.currentRound);
        this.showRoundAnnouncement(this.currentRound);
    }

    update(time, delta) {
        let my = this.my;
        let dt = delta / 1000;

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
                
                my.text.logo1.visible = true;
                my.text.logo2.visible = true;
                my.text.logo3.visible = true;
                my.text.score.visible = true;
                my.text.highScore.visible = true;
                my.text.round.visible = true;
                
                this.initGame();
            }
            return; // Don't run the rest of the game logic while on the title screen
        }

        // Game Over Restart Logic
        if (this.gameOver && Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.initGame();
        }

        if (this.myHealth > 0) {
            let isMoving = false;

            // Moving up
            if (this.up.isDown) {
                if (my.sprite.player.y > (my.sprite.player.displayHeight/2)) {
                    my.sprite.player.y -= this.playerSpeed * dt;
                }
                isMoving = true;
            }

            // Moving down
            if (this.down.isDown) {
                if (my.sprite.player.y < (game.config.height - (my.sprite.player.displayHeight/2))) {
                    my.sprite.player.y += this.playerSpeed * dt;
                }
                isMoving = true;
            }

            // Moving left
            if (this.left.isDown) {
                if (my.sprite.player.x > (my.sprite.player.displayWidth/2)) {
                    my.sprite.player.x -= this.playerSpeed * dt;
                }
                my.sprite.player.setFlipX(true); // Face left
                my.sprite.player.facingDirection = -1; // Remember that we are facing left
                isMoving = true;
            }

            // Moving right
            if (this.right.isDown) {
                if (my.sprite.player.x < (game.config.width - (my.sprite.player.displayWidth/2))) {
                    my.sprite.player.x += this.playerSpeed * dt;
                }
                my.sprite.player.setFlipX(false);
                my.sprite.player.facingDirection = 1; // Remember that we are facing right
                isMoving = true;
            }

            // Play or stop animation
            if (isMoving) {
                my.sprite.player.play(`walk_${this.playerColor}`, true);
            } else {
                my.sprite.player.stop();
            }

            // Check for bullet being fired
            if (Phaser.Input.Keyboard.JustDown(this.space)) {
                // Are we under our bullet quota?
                if (my.sprite.bullet.length < this.maxBullets) {
                    let dir = my.sprite.player.facingDirection || 1;
                    let offsetX = dir === -1 ? -(my.sprite.player.displayWidth/2) : (my.sprite.player.displayWidth/2);
                    let newBullet = this.add.sprite(
                        my.sprite.player.x + offsetX, my.sprite.player.y, "bullet"
                    );
                    newBullet.setAngle(dir === -1 ? -90 : 90); // Rotate bullet to face left or right
                    newBullet.fireDirection = dir; // Set explicit movement direction property
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
            if (bullet.x < game.config.width + (bullet.displayWidth/2) && bullet.x > -(bullet.displayWidth/2)) {
                return true;
            } else {
                bullet.destroy();
                return false;
            }
        });
        
        // Filter enemy bullets if they travel entirely off any side of the screen and destroy them
        my.sprite.enemyBullet = my.sprite.enemyBullet.filter((enemyBullet) => {
            if (enemyBullet.x > -(enemyBullet.displayWidth/2) && 
                enemyBullet.x < game.config.width + (enemyBullet.displayWidth/2) &&
                enemyBullet.y > -(enemyBullet.displayHeight/2) &&
                enemyBullet.y < game.config.height + (enemyBullet.displayHeight/2)) {
                return true;
            } else {
                enemyBullet.destroy();
                return false;
            }
        });

        // Filter destroyed enemies to prevent memory leaks
        my.sprite.enemies = my.sprite.enemies.filter((enemy) => {
            // Allow bosses to persist while they hide off-screen
            if (enemy.visible || enemy.isBoss) {
                return true;
            } else {
                enemy.destroy();
                return false;
            }
        });

        // Check for round progression
        if (this.myHealth > 0 && my.sprite.enemies.filter(e => e.enemyType !== "barnacle").length === 0) {
            // Heal player based on the round that was just completed
            if (this.currentRound === 5) {
                this.myHealth += 2;
            } else {
                this.myHealth += 1;
            }
            this.updateHealth(); // Ensure the HUD badges are redrawn

            this.currentRound++;
            this.updateRound();
            this.spawnRound(this.currentRound);
            this.showRoundAnnouncement(this.currentRound);
        }

        // Move and update enemies
        for (let enemy of my.sprite.enemies) {
            if (enemy.visible) {
                if (enemy.enemyType === "redSnake") {
                    // Ground Snake State Machine
                    if (enemy.state === "hidden") {
                        enemy.timer -= dt;
                        if (enemy.timer <= 0) {
                            enemy.x = Phaser.Math.Between(50, game.config.width - 50);
                            enemy.state = "rising";
                            enemy.play("redSnakeAnim");
                        }
                    } else if (enemy.state === "rising") {
                        enemy.y -= 150 * dt;
                        if (enemy.y <= enemy.activeY) {
                            enemy.y = enemy.activeY;
                            enemy.state = "active";
                            enemy.timer = Phaser.Math.Between(1000, 2000) / 1000; // Stay up for 1 to 2 seconds
                        }
                    } else if (enemy.state === "active") {
                        enemy.timer -= dt;
                        if (enemy.timer <= 0) {
                            enemy.state = "lowering";
                        }
                    } else if (enemy.state === "lowering" || enemy.state === "dead") {
                        enemy.y += 150 * dt;
                        if (enemy.y >= enemy.groundY) {
                            enemy.y = enemy.groundY;
                            if (enemy.state === "dead") {
                                enemy.visible = false; // Will be cleaned up by the filter next frame
                            } else {
                                enemy.state = "hidden";
                                enemy.stop();
                                enemy.timer = Phaser.Math.Between(1000, 3000) / 1000; // Wait to pop up again
                            }
                        }
                    }
                } else if (enemy.enemyType === "greenBoss") {
                    // Green Boss State Machine
                    if (enemy.state === "hidden") {
                        enemy.timer -= dt;
                        if (enemy.timer <= 0) {
                            let side = enemy.sides[enemy.sideIndex % 4];
                            let padding = 150;
                            if (side === "top") {
                                enemy.x = game.config.width / 2; enemy.y = -300;
                                enemy.targetX = game.config.width / 2; enemy.targetY = padding;
                                enemy.setAngle(180);
                            } else if (side === "right") {
                                enemy.x = game.config.width + 300; enemy.y = game.config.height / 2;
                                enemy.targetX = game.config.width - padding; enemy.targetY = game.config.height / 2;
                                enemy.setAngle(-90);
                            } else if (side === "bottom") {
                                enemy.x = game.config.width / 2; enemy.y = game.config.height + 300;
                                enemy.targetX = game.config.width / 2; enemy.targetY = game.config.height - padding;
                                enemy.setAngle(0);
                            } else if (side === "left") {
                                enemy.x = -300; enemy.y = game.config.height / 2;
                                enemy.targetX = padding; enemy.targetY = game.config.height / 2;
                                enemy.setAngle(90);
                            }
                            enemy.state = "emerging";
                            enemy.play("greenSnakeAnim", true);
                        }
                    } else if (enemy.state === "emerging") {
                        let dx = enemy.targetX - enemy.x;
                        let dy = enemy.targetY - enemy.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 5) {
                            enemy.x = enemy.targetX; enemy.y = enemy.targetY;
                            enemy.state = "firing";
                            enemy.timer = 0.5; // Quick pause before firing
                        } else {
                            enemy.x += (dx / dist) * 150 * dt;
                            enemy.y += (dy / dist) * 150 * dt;
                        }
                    } else if (enemy.state === "firing") {
                        enemy.timer -= dt;
                        if (enemy.timer <= 0) {
                            // Fire in 8 directions
                            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                                let newBullet = this.add.sprite(enemy.x, enemy.y, "snake");
                                newBullet.play("enemyBulletAnim");
                                newBullet.vx = Math.cos(angle) * this.enemyBulletSpeed;
                                newBullet.vy = Math.sin(angle) * this.enemyBulletSpeed;
                                newBullet.rotation = angle;
                                my.sprite.enemyBullet.push(newBullet);
                            }
                            this.sound.play("enemyFire");
                            enemy.state = "retreating";
                        }
                    } else if (enemy.state === "retreating") {
                        let side = enemy.sides[enemy.sideIndex % 4];
                        let offX = enemy.x, offY = enemy.y;
                        if (side === "top") offY = -300;
                        else if (side === "right") offX = game.config.width + 300;
                        else if (side === "bottom") offY = game.config.height + 300;
                        else if (side === "left") offX = -300;
                        
                        let dx = offX - enemy.x;
                        let dy = offY - enemy.y;
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        if (dist < 5) {
                            enemy.state = "hidden";
                            enemy.timer = 1; // Wait 1 second before popping up on next side
                            enemy.sideIndex++;
                        } else {
                            enemy.x += (dx / dist) * 150 * dt;
                            enemy.y += (dy / dist) * 150 * dt;
                        }
                    }
                } else if (enemy.enemyType === "barnacle") {
                    // Barnacles are attached to the walls and act as stationary hazards
                } else {
                    // Normal Horizontal Enemy Movement
                    enemy.x -= this.enemySpeed * dt;

                    // Snake-like movement on the Y axis
                    enemy.y = enemy.startY + Math.sin((time / 1000) * 3 + enemy.timeOffset) * 50;

                    // Enemy firing logic
                    enemy.shootTimer -= dt;
                    if (enemy.shootTimer <= 0) {
                        let newBullet = this.add.sprite(enemy.x - (enemy.displayWidth/2), enemy.y, "snake");
                        newBullet.setAngle(180); // Rotate to face left
                        newBullet.play("enemyBulletAnim");
                        this.sound.play("enemyFire");
                        my.sprite.enemyBullet.push(newBullet);
                        enemy.shootTimer = Phaser.Math.Between(1500, 4000) / 1000; // Reset timer to between 1.5 to 4 seconds
                    }

                    // Loop enemy back to the left side if they fall off screen
                    if (enemy.x < -(enemy.displayWidth/2)) {
                        enemy.x = game.config.width + Phaser.Math.Between(50, 100);
                        enemy.startY = Phaser.Math.Between(50, game.config.height - 50);
                    }
                }
            }
        }

        // Check for bullet collision with the enemies
        for (let bullet of my.sprite.bullet) {
            for (let enemy of my.sprite.enemies) {
                if (enemy.visible && this.collides(enemy, bullet)) {
                    if (enemy.enemyType === "redSnake" && (enemy.state === "dead" || enemy.state === "hidden")) continue;
                    if (enemy.enemyType === "greenBoss" && enemy.state === "hidden") continue;

                    bullet.x = game.config.width + 100; // Move bullet fully offscreen right to be despawned

                    if (enemy.enemyType === "redSnake") {
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            enemy.state = "dead";
                            enemy.stop();
                            enemy.setTexture("redSnake_dead");
                            
                            let enemyExplosion = this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(2).play("enemyExplosion");
                            this.myScore += enemy.scorePoints;
                            this.updateScore();
                            this.sound.play("explosion", { volume: 1 });
                        } else {
                            // Red snake took a hit but is still alive
                            this.sound.play("explosion", { volume: 0.5 });
                            
                            // Flash the dead texture for 0.3 seconds
                            enemy.stop();
                            enemy.setTexture("redSnake_hit");
                            this.time.delayedCall(300, () => {
                                // Make sure it hasn't died or gone back underground before resuming animation
                                if (enemy && enemy.active && enemy.hp > 0 && enemy.state !== "hidden") {
                                    enemy.play("redSnakeAnim");
                                }
                            });
                        }
                    } else if (enemy.enemyType === "barnacle") {
                        // Barnacle hit logic - takes multiple hits as a bulky obstacle!
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            let enemyExplosion = this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(4).play("enemyExplosion");
                            enemy.visible = false;
                            enemy.x = -100;
                            this.myScore += enemy.scorePoints;
                            this.updateScore();
                            this.sound.play("explosion", { volume: 1 });
                        } else {
                            this.sound.play("explosion", { volume: 0.5 });
                            enemy.stop();
                            enemy.setTexture("barnacleHit");
                            this.time.delayedCall(150, () => {
                                if (enemy && enemy.active && enemy.hp > 0) enemy.play("barnacleAnim");
                            });
                        }
                    } else if (enemy.enemyType === "greenBoss") {
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            let enemyExplosion = this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(5).play("enemyExplosion");
                            enemy.visible = false;
                            enemy.isBoss = false; // So it gets cleaned up by the array filter
                            enemy.x = -1000;
                            this.myScore += enemy.scorePoints;
                            this.updateScore();
                            this.sound.play("explosion", { volume: 1 });
                        } else {
                            this.sound.play("explosion", { volume: 0.5 });
                            enemy.stop();
                            enemy.setTexture("greenSnake_hit");
                            this.time.delayedCall(150, () => {
                                if (enemy && enemy.active && enemy.hp > 0 && enemy.state !== "hidden") enemy.play("greenSnakeAnim");
                            });
                        }
                    } else {
                        // Normal enemy hit logic
                        let enemyExplosion = this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(2).play("enemyExplosion");
                        enemy.visible = false;
                        enemy.x = -100;
                        this.myScore += enemy.scorePoints;
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
                    if (enemy.enemyType === "redSnake" && (enemy.state === "dead" || enemy.state === "hidden")) continue;
                    if (enemy.enemyType === "greenBoss" && enemy.state === "hidden") continue;

                    let playerExplosion = this.add.sprite(my.sprite.player.x, my.sprite.player.y, "explosion-1-d").setScale(2).play("enemyExplosion");

                    if (enemy.enemyType === "redSnake") {
                        // Force the snake down when it damages the player
                        enemy.state = "dead";
                        enemy.stop();
                        enemy.setTexture("redSnake_dead");
                    } else if (enemy.enemyType === "barnacle") {
                        // Barnacle survives player contact — it uses HP like bullet hits
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(4).play("enemyExplosion");
                            enemy.visible = false;
                            enemy.x = -100;
                            this.myScore += enemy.scorePoints;
                            this.updateScore();
                        } else {
                            enemy.stop();
                            enemy.setTexture("barnacleHit");
                            this.time.delayedCall(150, () => {
                                if (enemy && enemy.active && enemy.hp > 0) enemy.play("barnacleAnim");
                            });
                        }
                    } else if (enemy.enemyType === "greenBoss") {
                        enemy.hp -= 1;
                        if (enemy.hp <= 0) {
                            this.add.sprite(enemy.x, enemy.y, "explosion-1").setScale(5).play("enemyExplosion");
                            enemy.visible = false;
                            enemy.isBoss = false;
                            enemy.x = -1000;
                            this.myScore += enemy.scorePoints;
                            this.updateScore();
                        } else {
                            enemy.stop();
                            enemy.setTexture("greenSnake_hit");
                            this.time.delayedCall(150, () => {
                                if (enemy && enemy.active && enemy.hp > 0 && enemy.state !== "hidden") enemy.play("greenSnakeAnim");
                            });
                        }
                    } else {
                        enemy.visible = false;
                        enemy.x = -100;
                    }

                    this.myHealth -= 1;
;                    
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

            // 2. Player vs Enemy Bullet Collision
            for (let enemyBullet of my.sprite.enemyBullet) {
                if (this.collides(my.sprite.player, enemyBullet)) {
                    // start animation at player's location
                    let playerExplosion = this.add.sprite(my.sprite.player.x, my.sprite.player.y, "explosion-1").setScale(2).play("enemyExplosion");
                    // clear out enemy bullet -- put y offscreen bottom, will get reaped next update
                    enemyBullet.y = game.config.height + 100;
                    // Update health
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

                    if (this.myHealth <= 0){
                        my.sprite.player.destroy();
                        this.gameOver = true;
                        my.text.gameOver.visible = true;
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

    // A center-radius AABB collision check
    collides(a, b) {
        if (Math.abs(a.x - b.x) > (a.displayWidth/2 + b.displayWidth/2)) return false;
        if (Math.abs(a.y - b.y) > (a.displayHeight/2 + b.displayHeight/2)) return false;
        return true;
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
        if (this.currentRound === 5) {
            my.text.round.setText("Boss Round");
        } else {
            my.text.round.setText("Round " + this.currentRound);
        }
    }

    showRoundAnnouncement(round) {
        let my = this.my;
        if (round === 5) {
            my.text.roundAnnounce.setText("Boss Round");
        } else {
            my.text.roundAnnounce.setText("Round " + round);
        }
        my.text.roundAnnounce.visible = true;
        this.time.delayedCall(2000, () => {
            my.text.roundAnnounce.visible = false;
        });
    }

    spawnBoss(isMainBoss = false) {
        let my = this.my;
        let boss = this.add.sprite(-1000, -1000, "greenSnake").setScale(3);
        boss.enemyType = "greenBoss";
        boss.hp = isMainBoss ? 25 : 10; // Lower HP when spawning as a normal enemy
        boss.scorePoints = isMainBoss ? 5000 : 1000;
        boss.state = "hidden";
        boss.timer = Phaser.Math.Between(15, 30) / 10; // Staggered 1.5 to 3.0 seconds until first appearance
        boss.sideIndex = Phaser.Math.Between(0, 3); // Start on random side
        boss.sides = ["top", "right", "bottom", "left"];
        boss.isBoss = true; // Prevents being culled while off-screen
        
        my.sprite.enemies.push(boss);
    }

    spawnRound(round) {
        // Check for boss round
        if (round === 5) {
            this.spawnBoss(true);
            return; // Skip normal spawning
        }
        
        // Total enemies grows much slower with round number
        let budget = 4 + round;

        let counts = { slimeBlock: 0, barnacle: 0, redSnake: 0, greenBoss: 0 };
        
        // Limit barnacles to a maximum of 2 per round
        counts.barnacle = Math.min(2, Math.ceil(round / 2));

        // A few red snakes (unlocks at round 2, maxes out at 3 per round)
        if (round >= 2) {
            if (round > 5) {
                counts.greenBoss = 1; // Limit to only 1 mini-boss per round
                counts.redSnake = 2; // Fill the rest of the slots with regular red snakes
            } else {
                counts.redSnake = Math.min(3, Math.floor(round / 2));
            }
        }

        // The rest of the budget goes primarily to green enemies (slimeBlock)
        let allocated = counts.barnacle + counts.redSnake + counts.greenBoss;
        counts.slimeBlock = Math.max(1, budget - allocated);

        this.spawnEnemies(counts.slimeBlock, counts.redSnake, counts.barnacle, counts.greenBoss);
    }

    spawnEnemies(enemy1 = 0, enemy2 = 0, enemy3 = 0, enemy4 = 0) {
        let my = this.my;
        
        let spawnConfig = [
            { count: enemy1, type: "slimeBlock", scale: 0.5, score: 100 },
            { count: enemy2, type: "redSnake", scale: 1, score: 300 },
            { count: enemy3, type: "barnacle", scale: 1.5, score: 150 }
        ];

        for (let config of spawnConfig) {
            for (let i = 0; i < config.count; i++) {
                let startX = game.config.width + Phaser.Math.Between(50, 300);
                let startY = Phaser.Math.Between(50, game.config.height - 50);

                let enemy = this.add.sprite(startX, startY, config.type);
                enemy.setScale(config.scale);
                enemy.scorePoints = config.score;
                enemy.enemyType = config.type;

                if (config.type === "redSnake") {
                    enemy.scale = 2.5;
                    enemy.x = Phaser.Math.Between(50, game.config.width - 50);
                    enemy.y = game.config.height + 200; // Start hidden safely below the screen
                    enemy.state = "hidden";
                    enemy.timer = Phaser.Math.Between(1000, 3000) / 1000;
                    enemy.hp = 5;
                    enemy.groundY = game.config.height + 200;
                    enemy.activeY = (game.config.height / 2) + 150  // Pop up to the middle of the screen
                } else if (config.type === "barnacle") {
                    enemy.hp = 8; // Give it high health so it acts as a barrier
                    let wall = Phaser.Math.Between(0, 2); // 0=Top, 1=Right, 2=Bottom (skip left wall — player spawns there)
                    let padding = 40; // Increased padding to push this massive hazard further onto the screen

                    if (wall === 0) { // Top Wall
                        enemy.x = Phaser.Math.Between(padding, game.config.width - padding);
                        enemy.y = padding;
                        enemy.setAngle(180); // Face down
                    } else if (wall === 1) { // Right Wall
                        enemy.x = game.config.width - padding;
                        enemy.y = Phaser.Math.Between(padding, game.config.height - padding);
                        enemy.setAngle(-90); // Face left
                    } else { // Bottom Wall
                        enemy.x = Phaser.Math.Between(padding, game.config.width - padding);
                        enemy.y = game.config.height - padding;
                        enemy.setAngle(0); // Face up
                    }
                    enemy.play("barnacleAnim");
                } else {
                    enemy.shootTimer = Phaser.Math.Between(1000, 3000) / 1000;
                    enemy.startY = startY; 
                    enemy.timeOffset = Math.random() * Math.PI * 2; 
                }

                my.sprite.enemies.push(enemy);
            }
        }

        // Spawn bosses if they took the red snake slot
        for (let i = 0; i < enemy4; i++) {
            this.spawnBoss(false);
        }
    }
}
         