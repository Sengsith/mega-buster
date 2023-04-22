const canvas = document.querySelector('canvas');
const ctx = canvas.getContext("2d");
canvas.width = 1024;
canvas.height = 720;

const keys = {
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
  w: {
    pressed: false
  },
  s: {
    pressed: false
  },
}

function Tile ({position, size, tileIndex, playerObj, enemyObj}) {
  this.position = position;
  this.size = size;
  this.tileIndex = tileIndex;
  this.playerObj = playerObj;
  this.enemyObj = enemyObj;
  this.attackObj = {};
  this.centerPosition = {
    x: this.position.x + (this.size.width / 2),
    y: this.position.y + (this.size.height / 2)
  };
  this.fillColor = "black";

  this.draw = function() {
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(this.position.x, 
      this.position.y, 
      this.size.width, 
      this.size.height);
    (this.tileIndex.j < 3) ? ctx.strokeStyle = "blue" : ctx.strokeStyle = "red";
    ctx.strokeRect(this.position.x, 
      this.position.y, 
      this.size.width, 
      this.size.height);
  }

  this.update = function() {
    this.draw();
    if (Object.keys(this.playerObj).length !== 0) {
      this.playerObj.update();
    }
    if (Object.keys(this.enemyObj).length !== 0) {
      this.enemyObj.update();
    }
    if (Object.keys(this.attackObj).length !== 0) {
      this.attackObj.update();
    }
  }

  this.setObjToTile = function(obj) {
    obj.position = this.centerPosition;
    obj.tileIndex = this.tileIndex;
    obj.currentTile = this;
    switch (obj.constructor.name) {
      case 'Player':
        this.playerObj = obj;
        break;
      case 'Enemy':
        this.enemyObj = obj;
        break;
      case 'Attack':
        this.attackObj = obj;
        break;
    }
  }

  this.clearObj = function (obj) {
    switch (obj) {
      case 'player':
        this.playerObj = {};
        break;
      case 'enemy':
        this.enemyObj = {};
        break;
      case 'attack':
        this.attackObj = {};
        break;
    }
  }
}

function Field ({position, rows, cols, tile, gridOffset, gap, player, enemy}) {
  this.position = position;
  this.rows = rows;
  this.cols = cols;
  this.tile = tile;
  this.gridOffset = gridOffset;
  this.gap = gap;
  this.grid = [];
  this.player = player;
  this.enemy = enemy;

  // Initialize grid
  for (let i = 0; i < this.rows; i++) {
    // Make the element an array so we actually have something to push into
    this.grid[i] = [];
    for (let j = 0; j < this.cols; j++) {
      this.grid[i].push(new Tile({
        position: {
          // Adjust tile position using offset
          x: this.position.x - this.gridOffset.x + this.gap.x,
          y: this.position.y - this.gridOffset.y + this.gap.y
        },
        size: {
          width: this.tile.size,
          height: this.tile.size
        },
        tileIndex: {
          i: i,
          j: j
        },
        playerObj: (i === player.tileIndex.i && j === player.tileIndex.j) ? this.player : {},
        enemyObj: (i === enemy.tileIndex.i && j === enemy.tileIndex.j) ? this.enemy : {}
      }));
      // draw 110px away from tile before, 10px more than tile width
      this.gap.x += (this.tile.size + this.tile.gap);
    }
    // Reset x back to original position/gap
    this.gap.x = 0;
    // draw 110px away from tile before, 10px more than tile width
    this.gap.y += (this.tile.size + this.tile.gap);
  }

  this.initPlayerPosition = function (obj) {
    obj.position = this.grid[obj.tileIndex.i][obj.tileIndex.j].centerPosition;
    obj.currentTile = this.grid[obj.tileIndex.i][obj.tileIndex.j];
  }

  // Change player's initial spawn after grid initialized
  this.initPlayerPosition(player);
  // Change enemy's initial spawn after grid initalized
  this.initPlayerPosition(enemy);

  this.update = function () {
    this.grid.forEach((element) => element.forEach((tile) => tile.update()));
  }

  this.moveObjLeft = function (obj) {
    // Check if tile exists (rows - 1)
      // Return if tile doesn't exist
    // Move obj.tileIndex to left, and set tile's prev and curr obj
    obj.currentTile.clearObj(obj.constructor.name.toLowerCase());
    field.grid[obj.tileIndex.i][obj.tileIndex.j - 1].setObjToTile(obj);
  }

  this.moveObjRight = function (obj) {
    // Check if tile exists (rows + 1)
      // Return if tile doesn't exist
    // Move obj.tileIndex to right, and set tile's prev and curr obj
    obj.currentTile.clearObj(obj.constructor.name.toLowerCase());
    field.grid[obj.tileIndex.i][obj.tileIndex.j + 1].setObjToTile(obj);
  }

  this.moveObjUp = function (obj) {
    // Check if tile exists (rows + 1)
      // Return if tile doesn't exist
    // Move obj.tileIndex to right, and set tile's prev and curr obj
    obj.currentTile.clearObj(obj.constructor.name.toLowerCase());
    field.grid[obj.tileIndex.i - 1][obj.tileIndex.j].setObjToTile(obj);
  }

  this.moveObjDown = function (obj) {
    // Check if tile exists (rows + 1)
      // Return if tile doesn't exist
    // Move obj.tileIndex to right, and set tile's prev and curr obj
    obj.currentTile.clearObj(obj.constructor.name.toLowerCase());
    field.grid[obj.tileIndex.i + 1][obj.tileIndex.j].setObjToTile(obj);
  }
}

class Combatant {
  constructor ({fillColor, position, radius, angle, tileIndex, health}) {
    this.fillColor = fillColor;
    this.position = position;
    this.radius = radius;
    this.angle = angle;
    this.tileIndex = tileIndex;
    this.health = health;

    this.currentTile;
    this.dead = false;
  }

  draw() {
    ctx.fillStyle = this.fillColor;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, this.angle.startAngle, this.angle.endAngle);
    ctx.fill();
  }

  update() {
    this.draw();
  }
}

class Player extends Combatant {
  constructor({fillColor, position, radius, angle, tileIndex, health, buster}) {
    super({fillColor, position, radius, angle, tileIndex, health});
    this.lastKey;
    this.buster = buster;

    this.charging = false;
    this.moved = false;
    this.fired = false;
    this.invuln = false;
    this.invulnDuration = 1000;
  }

  takeHit(value) {
    if (!this.invuln && !enemy.dead) {
      this.health -= value;
      playerHealth.innerText = this.health;
      // Invuln logic for about a second
      // To show it on screen, we will change the color to orange
      this.fillColor = "orange";
      this.invuln = true;
      setTimeout(() => {
        this.fillColor = "blue";
        this.invuln = false;
      }, this.invulnDuration);
    }
    if (this.health <= 0) {
      this.dead = true;
      this.health = 0;
      playerHealth.innerText = this.health;
    }
  }

  fire() {
    //  Buster:
      // When user presses spacebar, get the tile in front of player and draw buster atk
        // Set position of buster and call draw
      // Continuously iterate columns(same row) until enemy is found or reaches end
      // If enemyObj is found or last column, set that tile attackObj to empty as well
    if (!player.fired) {
      player.fired = true;
      const currentRow = this.tileIndex.i;
      const currentCol = this.tileIndex.j;
      let hit = false;
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      // https://stackoverflow.com/questions/40328932/javascript-es6-promise-for-loop
      // Create p, intial resolving promise to chain new promises.
      // p makes sure we don't lose track of the promise chain, allows next loop to continue on same chain
      for (let i = currentCol + 1, p = new Promise((resolve) => resolve()); i < field.cols; i++) {
        p = p.then(() => delay(this.buster.msPerTile))
        .then (() => {
          if (!hit) {
            // Set attack to new column
            field.grid[currentRow][i].setObjToTile(this.buster);
            // Empty previous tile attack
            field.grid[currentRow][i - 1].clearObj('attack');
            if (Object.keys(field.grid[currentRow][i].enemyObj).length !== 0) {
              // Decrease enemy health
              field.grid[currentRow][i].enemyObj.takeHit(this.buster.hitValue);
              setTimeout(() => field.grid[currentRow][i].clearObj('attack'), this.buster.msPerTile);
              // Set hit to true to stop hitbox from moving (unsure if return does anything)
              hit = true;
              // Inside the if statement because of async code
              player.fired = false;
              player.buster.hitValue = 1;
              return;
            }
            // Clear the last tile / nothing is hit
            if (i === 5) {
              setTimeout(() => field.grid[currentRow][i].clearObj('attack'), this.buster.msPerTile);
              player.fired = false;
              player.buster.hitValue = 1;
            };
          }
        });
      }
    }
  }
}

class Enemy extends Combatant {
  constructor({fillColor, position, radius, angle, tileIndex, health, wave, atkInterval, moveInterval}) {
    super({fillColor, position, radius, angle, tileIndex, health});
    this.wave = wave;
    this.atkInterval = atkInterval;
    this.moveInterval = moveInterval;
    this.firing = false;
    this.atkIntervalID;
    this.moveIntervalID;

    this.initEnemyBehavior();
  }

  takeHit(value) {
    if (!player.dead) {
      this.health -= value;
      enemyHealth.innerText = this.health;
      if (this.health <= 0) {
        this.health = 0;
        enemyHealth.innerText = this.health;
        this.dead = true;
      }
    }
  }

  clearAtkInterval() {
    this.firing = false;
    clearInterval(this.atkIntervalID);
  }

  setMoveIntervalID() {
    this.moveIntervalID = setInterval(() => {this.move()}, this.moveInterval);
  }

  clearMoveInterval() {
    clearInterval(this.moveIntervalID);
  }

  move() {
    // If enemy.tileIndex.i != player.tileIndex.i
    // Move until it reaches every second  
    if (!this.dead) {
      if (player.tileIndex.i < this.tileIndex.i) {
        this.clearAtkInterval();
        field.moveObjUp(this);
      }
      else if (player.tileIndex.i > this.tileIndex.i) {
        this.clearAtkInterval();
        field.moveObjDown(this);
      }
      else {
        if (!this.firing) {
          this.fire();
        }
      }
    }
  }

  fire() {
    // Wave attack logic
    // Fire is called, but 2 projectiles are coming out
    if (!this.dead && !player.dead) {
      this.firing = true;
      this.atkIntervalID = setInterval(() => {
        const currentRow = this.tileIndex.i;
        const currentCol = this.tileIndex.j;
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
        // Clear old move interval before setting new one
        this.clearMoveInterval();
        setTimeout(() => {
          this.setMoveIntervalID();
        }, this.wave.msPerTile * 4);
        for (let i = currentCol - 1, p = new Promise((resolve) => resolve()); i >= 0; i--) {
          p = p.then(() => delay(this.wave.msPerTile))
          .then (() => {
            // Set attack to new column
            this.clearAtkInterval();
            field.grid[currentRow][i].setObjToTile(this.wave);
            field.grid[currentRow][i].fillColor = "yellow";
            // Empty previous tile attack
            field.grid[currentRow][i + 1].clearObj('attack');
            field.grid[currentRow][i + 1].fillColor = "black";
            if (Object.keys(field.grid[currentRow][i].playerObj).length !== 0) {
              // Decrease enemy health
              field.grid[currentRow][i].playerObj.takeHit(this.wave.hitValue);
            }
            // Clear the last tile / nothing is hit
            if (i === 0) {
              setTimeout(() => {
                field.grid[currentRow][i].clearObj('attack');
                field.grid[currentRow][i].fillColor = "black";
              }, this.wave.msPerTile);
            };
          });
        }
      }, this.atkInterval);
    }
  }

  initEnemyBehavior() {
    this.setMoveIntervalID();
  }
}

class Attack {
  constructor({size, hitValue, msPerTile = 10}) {
    this.size = size;
    this.offset = {
      x: this.size.width / 2,
      y: this.size.height / 2
    };
    this.hitValue = hitValue;
    this.msPerTile = msPerTile;
    this.fillColor = "pink";
    this.position = {};
    this.tileIndex = {};
  }

  draw() {
    ctx.fillStyle = this.fillColor;
    ctx.fillRect(this.position.x - this.offset.x, this.position.y - this.offset.y, this.size.width, this.size.height);
  }

  update() {
    this.draw();
  }
}

const buster = new Attack({
  size: {
    width: 10,
    height: 10
  },
  hitValue: 1,
  msPerTile: 20
});

const player = new Player({
  fillColor: 'blue',
  position: {
    x: 0,
    y: 0
  },
  radius: 35,
  angle: {
    startAngle: 0,
    endAngle: 2 * Math.PI
  },
  tileIndex: {
    i: 1,
    j: 1
  },
  health: 100,
  buster: buster
});

const wave = new Attack({
  size: {
    width: 10,
    height: 10
  },
  hitValue: 10,
  msPerTile: 500
})

const enemy = new Enemy({
  fillColor: 'red',
  position: {
    x: 0,
    y: 0
  },
  radius: 35,
  angle: {
    startAngle: 0,
    endAngle: 2 * Math.PI
  },
  tileIndex: {
    i: 1,
    j: 4
  },
  health: 40,
  wave: wave,
  atkInterval: 750,
  moveInterval: 750
});

const field = new Field({
  position: {
    x: canvas.width / 2,
    y: canvas.height / 2
  },
  rows: 3,
  cols: 6,
  tile: {
    size: 100,
    gap: 10
  },
  gridOffset: { // Offset needs to change based on tile size and gap
    // x: ((tile.size + tile.gap) * cols)
    // y: ((tile.size + tile.gap) * rows)
    x: 660 / 2,
    y: 330 / 2
  },
  gap: {
    x: 0,
    y: 0
  },
  player: player,
  enemy: enemy
});

// HUD
const playerHealth = document.querySelector('#health-player');
const enemyHealth = document.querySelector('#health-enemy');
playerHealth.innerText = player.health;
enemyHealth.innerText = enemy.health;

function updateHealthPosition() {
  const offsetX = 50;
  const offsetY = 40;
  playerHealth.style.left = player.position.x - offsetX + "px";
  playerHealth.style.top = player.position.y + offsetY + "px";
  enemyHealth.style.left = enemy.position.x - offsetX + "px";
  enemyHealth.style.top = enemy.position.y + offsetY + "px";
}

function animate() {
  window.requestAnimationFrame(animate);
  // Redraw canvas and player
  ctx.fillStyle = "hsl(0, 0%, 35%)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  let start = false;
  
  // Draw field
  field.update();
  handleMovement();
  updateHealthPosition();
  determineWinner();
}

animate();

function handleMovement() {
  // Player Movement
  if (keys.a.pressed && player.lastKey ==='a' && player.moved && player.tileIndex.j !== 0) {
    // Get position of i-- tile, and set player's position to that tile
    // Remove the player obj from old tile
    // Change new tile's playerObj
    field.moveObjLeft(player);
    // Set moved back to false so they only move 1 tile at a time
    player.moved = false;
  } else if (keys.d.pressed && player.lastKey ==='d' && player.moved && player.tileIndex.j !== 2) {
    // Get position of i-- tile, and set player's position to that tile
    // Remove the player obj from old tile
    // Change new tile's playerObj
    field.moveObjRight(player);
    // Set moved back to false so they only move 1 tile at a time
    player.moved = false;
  }
  else if (keys.w.pressed && player.lastKey ==='w' && player.moved && player.tileIndex.i !== 0) {
    // Get position of i-- tile, and set player's position to that tile
    // Remove the player obj from old tile
    // Change new tile's playerObj
    field.moveObjUp(player);
    // Set moved back to false so they only move 1 tile at a time
    player.moved = false;
  }
  else if (keys.s.pressed && player.lastKey ==='s' && player.moved && player.tileIndex.i !== 2) {
    // Get position of i-- tile, and set player's position to that tile
    // Remove the player obj from old tile
    // Change new tile's playerObj
    field.moveObjDown(player);
    // Set moved back to false so they only move 1 tile at a time
    player.moved = false;
  }
}

const winner = document.querySelector('#winner');
function determineWinner() {
  if (player.health <= 0) {
    winner.innerText = "Enemy Win!";
  }
  else if (enemy.health <= 0) {
    winner.innerText = "Player Win!";
  }
}

let spaceKeyDownTime = null;
const charge = document.querySelector('#charge');
let chargeTimeoutID;
let showChargeTimeoutID;

window.addEventListener("keydown", (e) => {
if (!player.dead && !enemy.dead) {
  switch(e.key) {
    case 'a':
      keys.a.pressed = true;
      player.lastKey = 'a';
      player.moved = true;
      break;
    case 'd':
      keys.d.pressed = true;
      player.lastKey = 'd';
      player.moved = true;
      break;
    case 'w':
      keys.w.pressed = true;
      player.lastKey = 'w';
      player.moved = true;
      break;
    case 's':
      keys.s.pressed = true;
      player.lastKey = 's';
      player.moved = true;
      break;
    case ' ':
      if (!e.repeat) {
        spaceKeyDownTime = e.timeStamp;
        // Player charging logic
        player.charging = true;
        showChargeTimeoutID = setTimeout(() => {charge.innerText = "Charging..."}, 200);
        chargeTimeoutID = setTimeout(() => {charge.innerText = "Charged!"}, 2000);
      }
      break;
}
  }
  // Player cannot hold the button to move
  if (e.repeat) {
    player.moved = false;
  }
});

window.addEventListener('keyup', (e) => {
  switch (e.key) {
    // Player Keys
    case 'a':
      keys.a.pressed = false;
      break;
    case 'd':
      keys.d.pressed = false;
      break;
    case 'w':
      keys.w.pressed = false;
      break;
    case 's':
      keys.s.pressed = false;
      break;
    case ' ':
      if (!e.repeat && spaceKeyDownTime !== null) {
        clearTimeout(showChargeTimeoutID);
        clearTimeout(chargeTimeoutID);
        player.charging = false;
        charge.innerText = "";
        const spaceKeyUpTime = e.timeStamp;
        const duration = spaceKeyUpTime - spaceKeyDownTime;
        if (duration >= 2000) {
          player.buster.hitValue = 10;
        }
        player.fire();
        spaceKeyDownTime = null;
      }
      break;
  }
});
