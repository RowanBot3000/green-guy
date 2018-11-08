// Green Guy Game Engine by the Nonamian Development Team
// Version 1.0

// time related variables, measured in milliseconds
var deltaTime, lastTime;

// define properties of the environment (width, height, etc.)
var environment = {
	bottomCollision: true,
	background: function() {
		background(192, 255, 255);
	}
};

// array containing the type of each tile in the environment
var tiles = [];

// fills the tiles array with values (all -1)
// this should be executed before using the tiles array because it catches problems with the environment object
function initializeTiles() {
	// checks to make sure that the environment bounds will line up with the tiles
	if (environment.width % environment.tileSize !== 0 || environment.height % environment.tileSize !== 0) {
		throw "environment error: bounds do not line up with the tiles";
	}
	let tilesWidth = environment.width / environment.tileSize, tilesHeight = environment.height / environment.tileSize;
	for (let i = 0; i < tilesHeight; i ++) {
		tiles.push([]);
		for (let j = 0; j < tilesWidth; j++) {
			tiles[i].push(-1);
		}
	}
}

// used in tile properties. decides how the player should collide with the tile.
const COLLISION_NONE = 0, COLLISION_SOLID = 1;

// class for storing information about each type of tile
class TileProperties {
	constructor(collisionType, draw, collisionEvent = function() {}, size = [environment.tileSize, environment.tileSize]) {
		this.collisionType = collisionType;
		this.draw = draw;
		this.collisionEvent = collisionEvent;
		this.size = size;
	}
}

// array of tile properties, must be defined by whoever's using the engine
var tileProps = [];

// used for key events. For example the expression keys[KEY_RIGHT] returns if the right arrow key is being pressed.
const KEY_JUMP = 0, KEY_LEFT = 1, KEY_RIGHT = 2;
var keys = [];

var player = {
	x: 0, y: 0,
	xv: 0, yv: 0,
	friction: 0.75,
	gravity: 2500,
	speed: 50,
	jumpForce: 600,
	
	lockWalkingAnimationSpeed: false,
	_walkingAnimationTime: 0,
	
	update: function(deltaTime) {
		// player controls
		if (!this.falling) {
			if (keys[KEY_RIGHT]) {
				this.xv += this.speed;
			} else if (keys[KEY_LEFT]) {
				this.xv -= this.speed;
			}
			if (keys[KEY_JUMP]) {
				this.yv = -this.jumpForce;
			}
		}
		
		// move the player
		
		this.x += this.xv * (deltaTime / 1000);
		let tileProp, box;
		for (let i = 0; i < tiles.length; i++) {
			for (let j = 0; j < tiles[i].length; j++) {
				if (tiles[i][j] < 0) {
					continue;
				}
				tileProp = tileProps[tiles[i][j]];
				box = {x: j * environment.tileSize, y: i * environment.tileSize, w: tileProp.size[0], h: tileProp.size[1]};
				if (this.touching(box.x, box.y, box.w, box.h)) {
					if (this.xv > 0) {
						this.x = box.x - this.w;
					} else {
						this.x = box.x - box.w;
					}
					this.xv = 0;
					tileProp.collisionEvent();
				}
			}
		}
		
		this.falling = true;
		this.y += this.yv * (deltaTime / 1000);
		for (let i = 0; i < tiles.length; i++) {
			for (let j = 0; j < tiles[i].length; j++) {
				if (tiles[i][j] < 0) {
					continue;
				}
				tileProp = tileProps[tiles[i][j]];
				box = {x: j * environment.tileSize, y: i * environment.tileSize, w: tileProp.size[0], h: tileProp.size[1]};
				if (this.touching(box.x, box.y, box.w, box.h)) {
					if (this.yv > 0) {
						this.y = box.y - this.h;
						this.falling = false;
					} else {
						this.y = box.y - box.h;
					}
					this.yv = 0;
					tileProp.collisionEvent();
				}
			}
		}
		
		this.x = constrain(this.x, 0, environment.width - this.w);
		this.y = max(this.y, 0);
		if (environment.bottomCollision && this.y > environment.height - this.h) {
			this.y = environment.height - this.h;
			this.yv = 0;
			this.falling = false;
		}
		
		if (!this.falling)
			this.xv *= this.friction;
		this.yv += this.gravity * (deltaTime / 1000);
		
		// update walking animation if the player is walking
		if (keys[KEY_RIGHT] || keys[KEY_LEFT]) {
			if (typeof this.walkingAnimationSpeed === "undefined") {
				this._walkingAnimationTime += deltaTime * (this.speed / environment.tileSize);
			}
		}
	},
	
	camera: function() {
		translate(constrain(-player.x - player.w/2 + width/2, -environment.width + width, 0),
			constrain(-player.y - player.h/2 + height/2, -environment.height + height, 0));
	},
	
	draw: function() {
		if (!this.falling) {
			if (!keys[KEY_RIGHT] && !keys[KEY_LEFT]) {
				// standing still
				
				noStroke();
				fill(0, 128, 0);
				rect(this.x + this.w/4, this.y + this.h/8, this.w/2, this.h/4);
				rect(this.x + this.w * (3/8), this.y + this.h * (3/8), this.w/4, this.h/3);
				quad(this.x + this.w * (3/8), this.y + this.h * (3/8), this.x + this.w * (3/8), this.y + this.h/2,
					this.x + this.w/4, this.y + this.h * 0.7, this.x + this.w/8, this.y + this.h * 0.7);
				quad(this.x + this.w * (5/8), this.y + this.h * (3/8), this.x + this.w * (5/8), this.y + this.h/2,
					this.x + this.w * (3/4), this.y + this.h * 0.7, this.x + this.w * (7/8), this.y + this.h * 0.7);
				quad(this.x + this.w * (3/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
					this.x + this.w * (3/8), this.y + this.h, this.x + this.w/4, this.y + this.h);
				quad(this.x + this.w * (5/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
					this.x + this.w * (5/8), this.y + this.h, this.x + this.w * (3/4), this.y + this.h);
				
				fill(255);
				ellipse(this.x + this.w/2, this.y + this.h/4, this.w/3, this.h/6);
				fill(0);
				ellipse(this.x + this.w/2, this.y + this.h/4, this.w/12, this.h/12);
				
				stroke(0, 64, 0);
				line(this.x + this.w * (3/8), this.y + this.h * 0.35, this.x + this.w * (5/8), this.y + this.h * 0.35);
			} else if (this.xv > 0) {
				// walking right
				
				let factor =  sin(this._walkingAnimationTime / 1000 * TWO_PI);
				let factor2 = max(cos(this._walkingAnimationTime / 1000 * TWO_PI), 0);
				let factor3 = -min(cos(this._walkingAnimationTime / 1000 * TWO_PI), 0);
				
				stroke(0, 64, 0);
				fill(0, 128, 0);
				quad(this.x + this.w * (5/8), this.y + this.h * (3/8), this.x + this.w * (5/8), this.y + this.h/2,
					this.x + this.w/2 + this.w/4 * -factor, this.y + this.h * 0.7,
					this.x + this.w/2 + this.w * (3/8) * -factor, this.y + this.h * 0.7);
				
				noStroke();
				rect(this.x + this.w/4, this.y + this.h/8, this.w/2, this.h/4);
				rect(this.x + this.w * (3/8), this.y + this.h * (3/8), this.w/4, this.h/3);
				
				stroke(0, 64, 0);
				quad(this.x + this.w * (3/8), this.y + this.h * (3/8), this.x + this.w * (3/8), this.y + this.h/2,
					this.x + this.w/2 - this.w/4 * -factor, this.y + this.h * 0.7,
					this.x + this.w/2 - this.w * (3/8) * -factor, this.y + this.h * 0.7);
				
				quad(this.x + this.w * (5/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
					this.x + this.w/2 + this.w/4 * factor, this.y + this.h - this.h/16 * factor2,
					this.x + this.w * (5/8) + this.w/4 * factor, this.y + this.h - this.h/16 * factor2);
				quad(this.x + this.w * (3/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
					this.x + this.w/2 - this.w/4 * factor, this.y + this.h - this.h/16 * factor3,
					this.x + this.w * (3/8) - this.w/4 * factor, this.y + this.h - this.h/16 * factor3);
				
				noStroke();
				fill(255);
				ellipse(this.x + this.w/2, this.y + this.h/4, this.w/3, this.h/6);
				fill(0);
				ellipse(this.x + this.w * (9/16), this.y + this.h/4, this.w/12, this.h/12);
				
				stroke(0, 64, 0);
				line(this.x + this.w * (3/8), this.y + this.h * 0.35, this.x + this.w * (5/8), this.y + this.h * 0.35);
			} else {
				// walking left
				
				let factor =  sin(this._walkingAnimationTime / 1000 * TWO_PI);
				let factor2 = max(cos(this._walkingAnimationTime / 1000 * TWO_PI), 0);
				let factor3 = -min(cos(this._walkingAnimationTime / 1000 * TWO_PI), 0);
				
				stroke(0, 64, 0);
				fill(0, 128, 0);
				quad(this.x + this.w * (3/8), this.y + this.h * (3/8), this.x + this.w * (3/8), this.y + this.h/2,
					this.x + this.w/2 - this.w/4 * -factor, this.y + this.h * 0.7,
					this.x + this.w/2 - this.w * (3/8) * -factor, this.y + this.h * 0.7);
				
				noStroke();
				rect(this.x + this.w/4, this.y + this.h/8, this.w/2, this.h/4);
				rect(this.x + this.w * (3/8), this.y + this.h * (3/8), this.w/4, this.h/3);
				
				stroke(0, 64, 0);
				quad(this.x + this.w * (5/8), this.y + this.h * (3/8), this.x + this.w * (5/8), this.y + this.h/2,
					this.x + this.w/2 + this.w/4 * -factor, this.y + this.h * 0.7,
					this.x + this.w/2 + this.w * (3/8) * -factor, this.y + this.h * 0.7);
				
				quad(this.x + this.w * (3/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
					this.x + this.w/2 - this.w/4 * factor, this.y + this.h - this.h/16 * factor2,
					this.x + this.w * (3/8) - this.w/4 * factor, this.y + this.h - this.h/16 * factor2);
				quad(this.x + this.w * (5/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
					this.x + this.w/2 + this.w/4 * factor, this.y + this.h - this.h/16 * factor3,
					this.x + this.w * (5/8) + this.w/4 * factor, this.y + this.h - this.h/16 * factor3);
				
				noStroke();
				fill(255);
				ellipse(this.x + this.w/2, this.y + this.h/4, this.w/3, this.h/6);
				fill(0);
				ellipse(this.x + this.w * (7/16), this.y + this.h/4, this.w/12, this.h/12);
				
				stroke(0, 64, 0);
				line(this.x + this.w * (3/8), this.y + this.h * 0.35, this.x + this.w * (5/8), this.y + this.h * 0.35);
			}
		} else {
			// in the air
			
			noStroke();
			fill(0, 128, 0);
			rect(this.x + this.w/4, this.y + this.h/8, this.w/2, this.h/4);
			rect(this.x + this.w * (3/8), this.y + this.h * (3/8), this.w/4, this.h/3);
			quad(this.x + this.w * (3/8), this.y + this.h * (3/8), this.x + this.w * (3/8), this.y + this.h/2,
				this.x + this.w/4, this.y + this.h * 0.7, this.x + this.w/8, this.y + this.h * 0.7);
			quad(this.x + this.w * (5/8), this.y + this.h * (3/8), this.x + this.w * (5/8), this.y + this.h/2,
				this.x + this.w * (3/4), this.y + this.h * 0.7, this.x + this.w * (7/8), this.y + this.h * 0.7);
			quad(this.x + this.w * (3/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
				this.x + this.w * (7/16), this.y + this.h, this.x + this.w * (5/16), this.y + this.h);
			quad(this.x + this.w * (5/8), this.y + this.h * 0.708, this.x + this.w/2, this.y + this.h * 0.708,
				this.x + this.w * (9/16), this.y + this.h, this.x + this.w * (11/16), this.y + this.h);
			
			fill(255);
			ellipse(this.x + this.w/2, this.y + this.h/4, this.w/3, this.h/6);
			fill(0);
			ellipse(this.x + this.w/2, this.y + this.h * 0.28, this.w/12, this.h/12);
			
			stroke(0, 64, 0);
			line(this.x + this.w * (3/8), this.y + this.h * 0.35, this.x + this.w * (5/8), this.y + this.h * 0.35);
		}
	},
	
	// returns true if the player is overlapping the specified bounding box
	touching: function(ox, oy, ow, oh) {
		return this.x + this.w > ox && this.x < ox + ow &&
			this.y + this.h > oy && this.y < oy + oh;
	}
};

function initializeEnvironment() {
	if (typeof environment.width === "undefined" || typeof environment.height === "undefined") {
		throw "environment error: width/height is undefined";
	}
	if (typeof environment.tileSize === "undefined") {
		throw "environment error: tile size is undefined";
	}
	
	// disable key scrolling
	window.addEventListener('keydown', function (event) {
		if (event.keyCode === UP_ARROW || event.keyCode === DOWN_ARROW ||
				event.keyCode === LEFT_ARROW || event.keyCode === RIGHT_ARROW || event.keyCode === 32) {
			event.preventDefault();
			return false;
		}
	});
	
	// set player size proportional to tile size
	player.w = environment.tileSize * 2;
	player.h = environment.tileSize * 4;
	
	initializeTiles();
	
	lastTime = millis();
}

function updateEnvironment() {
	deltaTime = millis() - lastTime;
	lastTime = millis();
	
	player.update(deltaTime);
	
	environment.background();
	
	player.camera();
	
	player.draw();
	
	push();
	for (let i = 0; i < tiles.length; i++) {
		for (let j = 0; j < tiles[i].length; j++) {
			if (tiles[i][j] < 0) {
				continue;
			}
			tileProps[tiles[i][j]].draw();
			translate(environment.tileSize, 0);
		}
		translate(0, environment.tileSize);
	}
	pop();
}

function updateKeys1() {
	if (keyCode === UP_ARROW || key === 'W' || key === ' ')
		keys[KEY_JUMP] = true;
	if (keyCode === LEFT_ARROW || key === 'A')
		keys[KEY_LEFT] = true;
	if (keyCode === RIGHT_ARROW || key === 'D')
		keys[KEY_RIGHT] = true;
}

function updateKeys2() {
	if (keyCode === UP_ARROW || key === 'W' || key === ' ')
		keys[KEY_JUMP] = false;
	if (keyCode === LEFT_ARROW || key === 'A') {
		keys[KEY_LEFT] = false;
		player.walkingAnimationTime = 0;
	} if (keyCode === RIGHT_ARROW || key === 'D') {
		keys[KEY_RIGHT] = false;
		player.walkingAnimationTime = 0;
	}
}
