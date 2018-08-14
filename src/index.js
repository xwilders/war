import _ from 'lodash';

import './css/canvases.css';
import mapSpec from './imgSpecs/sf2-map.json';
import spriteImg from './img/sf2-map.png';

import MCTS from './mcts';

const world = [0, 0, 0, 0, 0, 0, 0];
const game = function(pos = 2, player = 0) {
  return {
    pos,
    getWinner: () => (pos === world.length - 1 ? 0 : 1),
    getPossibleMoves: () => (pos === world.length - 1 || pos === 0 ? [] : [-1, 1, 0, 2, -2, 3, -3, 4, -4]),
    getCurrentPlayer: () => player,
    performMove: move => {
      pos += move;
      pos = Math.max(0, pos);
      pos = Math.min(world.length - 1, pos);
      player = (player + 1) % 2;
    },
    clone: move => {
      const result = game(pos, player);
      result.performMove(move);
      return result;
    }
  };
};

const brain = function(ai, player, turn = 0) {
  return {
    getWinner: () => (player.isDead() ? 0 : 1),
    getPossibleMoves: () => (plyaer.isDead() || ai.isDead() ? [] : ai.getMoves()),
    getCurrentPlayer: () => turn,
    performMove: move => {
      move();
      turn = (turn + 1) % 2;
    },
    clone: move => {
      const result = brain(ai.clone(), player.clone(), turn);
      result.performMove(move);
      return result;
    }
  };
};

const mcts = new MCTS(game(), 100, 0);
console.log(mcts.selectMove());

const battlefield = {
  dimensions: {width: 50, height: 3},
  sizes: {tileSize: 12, windowHeight: 14, windowWidth: 26}
};

const sprite = new Image();
sprite.src = spriteImg;

document.body.innerHTML += '<canvas id="canvasId"></canvas>';

let keys = [];
document.addEventListener('keydown', e => {
  keys = _.uniq(keys.concat(e.key));
});

document.addEventListener('keyup', e => {
  const index = keys.indexOf(e.key);
  keys.splice(index, 1);
});

const DIR_NONE = 'O';
const DIR_UP = 'U';
const DIR_RIGHT = 'R';
const DIR_DOWN = 'D';
const DIR_LEFT = 'L';

const getDir = (x, y) => {
  if (!x && !y) return DIR_NONE;
  if (y === -1) return DIR_UP;
  if (x === 1) return DIR_RIGHT;
  if (y === 1) return DIR_DOWN;
  if (x === -1) return DIR_LEFT;
};

const tileSize = battlefield.sizes.tileSize;
const speedX = 1 / 2;
const speedY = 1 / 3;

const ai = {
  move: ({x, y}, {width, height}) => {
    return {x, y, dir: DIR_NONE};
    const direction = Math.random() * 2;
    let newX = x;
    let newY = y;

    if (direction < 1) {
      newX = x + Math.floor(Math.random() * 3 - 1) * tileSize;
      newX = Math.min(newX, (width - 1) * tileSize);
      newX = Math.max(newX, 0);
    } else {
      newY = y + Math.floor(Math.random() * 3 - 1) * tileSize;
      newY = Math.min(newY, (height - 1) * tileSize);
      newY = Math.max(newY, 0);
    }

    return {x: newX, y: newY, dir: getDir(newX - x, newY - y)};
  },

  decideAction: ({moveForward, attack}) => {
    //moveForward();
  }
};

const playerBrain = {
  move: ({x, y}, {width, height}) => {
    let newX = x;
    let newY = y;
    if (!key) return {x, y, dir: DIR_NONE};
    if (key === 'ArrowUp') newY -= speedY;
    if (key === 'ArrowDown') newY += speedY;
    if (key === 'ArrowRight') newX += speedX;
    if (key === 'ArrowLeft') newX -= speedX;

    newX = Math.min(newX, (width - 1) * tileSize);
    newX = Math.max(newX, 0);
    newY = Math.min(newY, (height - 1) * tileSize);
    newY = Math.max(newY, 0);

    return {x: newX, y: newY, dir: getDir(newX - x, newY - y)};
  },

  decideAction: ({moveForward, moveBack, moveUp, moveDown, attack}) => {
    if (keys.includes(' ')) attack();
    else {
      if (keys.includes('ArrowRight')) moveForward();
      if (keys.includes('ArrowLeft')) moveBack();
      if (keys.includes('ArrowUp')) moveUp();
      if (keys.includes('ArrowDown')) moveDown();
    }
  }
};

class Soldier {
  constructor({x, y, brain, team, internal = {}}) {
    this.position = {x, y};
    this.direction = DIR_NONE;
    this.brain = brain;
    this.team = team;
    const {attacking = false, timer = 0, hp = 10} = internal;
    this.attacking = attacking;
    this.timer = timer;
    this.hp = hp;
  }

  clone() {
    const {x, y} = this.position;
    return new Soldier({
      x,
      y,
      brain: this.brain,
      team: this.team,
      internal: {attacking: this.attacking, timer: this.timer, hp: this.hp}
    });
  }

  damage() {
    this.hp -= 1;
  }
  isDead() {
    return this.hp <= 0;
  }

  move(dimensions, {x, y}) {
    let newX = this.position.x + x * speedX;
    let newY = this.position.y + y * speedX;
    newX = Math.min(newX, dimensions.width - 1);
    newX = Math.max(newX, 0);
    newY = Math.min(newY, dimensions.height - 1);
    newY = Math.max(newY, 0);
    this.position = {x: newX, y: newY};
    this.direction = getDir(x, y);
  }

  moveForward(dimensions) {
    this.move(dimensions, {x: this.team === 1 ? 1 : -1, y: 0});
  }
  moveBack(dimensions) {
    this.move(dimensions, {x: this.team === 1 ? -1 : 1, y: 0});
  }
  moveUp(dimensions) {
    this.move(dimensions, {x: 0, y: -1});
  }
  moveDown(dimensions) {
    this.move(dimensions, {x: 0, y: 1});
  }
  attack() {
    this.attacking = true;
    this.timer = 3;
    this.attackDim = {
      startPoint: {x: this.team === 1 ? 1 : -1, y: 0.5},
      width: 1.5,
      height: 0.5
    };
  }
  getMoves() {
    return [
      () => this.moveForward(battlefield.dimensions),
      () => this.moveBack(battlefield.dimensions),
      () => this.moveUp(battlefield.dimensions),
      () => this.moveDown(battlefield.dimensions),
      () => this.attack()
    ];
  }

  decideAction({battlefield}) {
    if (this.timer) {
      this.timer -= 1;
    } else {
      this.attacking = false;
      this.brain.decideAction({
        moveForward: () => this.moveForward(battlefield.dimensions),
        moveBack: () => this.moveBack(battlefield.dimensions),
        moveUp: () => this.moveUp(battlefield.dimensions),
        moveDown: () => this.moveDown(battlefield.dimensions),
        attack: () => this.attack()
      });
    }
  }
}
let collisions;

// This assumes right
const addCollision = ({position, dimensions}) => {
  const {width, height, startPoint} = dimensions;
  let {x, y} = startPoint;
  x += position.x;
  y += position.y;
  // Get four corners, and everything in between
  const left = x;
  const right = x + width;
  const top = y - height / 2;
  const bottom = y + height / 2;

  const xs = Array.from({length: Math.floor(right) - Math.floor(left) + 1}, (_, i) => Math.floor(left + i));
  const ys = Array.from({length: Math.floor(bottom) - Math.floor(top) + 1}, (_, i) => Math.floor(top + i));
  for (const y of ys) {
    for (const x of xs) {
      collisions[y][x].push({left, top, right, bottom});
    }
  }
};

const checkCollision = (a, b) => {
  return Math.max(a.left, b.left) < Math.min(a.right, b.right) && Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom);
};

const performActions = ({battlefield, soldiers}) => {
  const orderOfActions = soldiers
    .map(soldier => ({soldier, rand: Math.random()}))
    .sort(({rand}, {rand: rand2}) => rand - rand2)
    .map(({soldier, rand}) => soldier);

  collisions = Array.from({length: battlefield.dimensions.height}, i =>
    Array.from({length: battlefield.dimensions.width}, i => [])
  );

  orderOfActions.forEach(soldier => {
    //soldier.move(battlefield.dimensions);
    soldier.decideAction({battlefield});
    if (soldier.attacking && soldier.timer === 1)
      addCollision({position: soldier.position, dimensions: soldier.attackDim});
  });

  for (let i = 0; i < soldiers.length; i++) {
    const soldier = soldiers[i];
    const {x, y} = soldier.position;
    for (const col of collisions[Math.floor(y)][Math.floor(x)]) {
      if (checkCollision(col, {left: x, right: x + 1, top: y, bottom: y + 1})) {
        soldier.damage();
        if (soldier.isDead()) {
          soldier.dead = true;
          soldiers.splice(i, 1);
          i--;
        }
      }
    }
  }
};

const hasLeft = (view, x, y, symbol) => !view[y][x - 1] || view[y][x - 1] === symbol;
const hasRight = (view, x, y, symbol) => !view[y][x + 1] || view[y][x + 1] === symbol;

const drawBattlefield = ({battlefield, soldiers, player}) => {
  const view = [];

  const {width, height} = battlefield.dimensions;
  const {windowHeight, windowWidth, tileSize} = battlefield.sizes;
  const {position} = player;

  for (let y = 0; y < windowHeight + 1; y++) {
    const row = [];
    const h = position.y - windowHeight / 2 + y;
    for (let x = 0; x < windowWidth + 1; x++) {
      const w = position.x - windowWidth / 2 + x;
      row.push(h >= 0 && h < height && w >= 0 && w < width ? ' ' : '#');
    }
    view.push(row);
  }

  const canvas = document.getElementById('canvasId');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  const xDiff = (position.x * tileSize) % tileSize;
  const yDiff = (position.y * tileSize) % tileSize;
  for (let y = 0; y < view.length; y++) {
    for (let x = 0; x < view[y].length; x++) {
      const left = hasLeft(view, x, y, '#');
      const right = hasRight(view, x, y, '#');
      const specNum = left && right ? 0 : left ? 2 : 1;
      if (view[y][x] === '#')
        drawTile(context, sprite, mapSpec[specNum], x * tileSize - xDiff, y * tileSize - yDiff, tileSize);
    }
  }

  const soldierPositions = soldiers.map(soldier => ({
    soldier,
    ...soldier.position
  }));

  soldierPositions.forEach(({soldier, x, y}) => {
    const newY = (y - position.y + windowHeight / 2) * tileSize;
    const newX = (x - position.x + windowWidth / 2) * tileSize;
    if (newY >= 0 && newY < windowHeight * tileSize && newX >= 0 && newX < windowWidth * tileSize) {
      drawBlock(context, newX, newY, {tileWidth: tileSize, tileHeight: tileSize}, soldier.team, 1);
      if (soldier.attacking) {
        const {x, y} = soldier.attackDim.startPoint;
        drawBlock(
          context,
          newX + x * tileSize,
          newY + y * tileSize - soldier.attackDim.height * tileSize / 2,
          {tileWidth: tileSize * soldier.attackDim.width, tileHeight: tileSize * soldier.attackDim.height},
          soldier.team,
          1 / soldier.timer
        );
      }
    }
  });
};

const drawTile = (context, sprite, singleTileSpec, x, y, tileSize) => {
  context.drawImage(
    sprite,
    singleTileSpec.x,
    singleTileSpec.y,
    24,
    24, // source coords
    x,
    y,
    tileSize,
    tileSize // destination coords
  );
};

const drawBlock = (context, x, y, {tileWidth, tileHeight}, team, alpha) => {
  context.fillStyle = team === 1 ? `rgba(50, 50, 150, ${alpha})` : `rgba(150, 50, 50, ${alpha})`;
  context.fillRect(x, y, tileWidth, tileHeight);
};

const play = ({battlefield, soldiers, player}) => {
  drawBattlefield({battlefield, soldiers, player});
  setTimeout(() => {
    performActions({battlefield, soldiers});
    play({battlefield, soldiers, player});
  }, 100);
};

const armySize = 5;
const soldiers = Array.from(
  {length: armySize},
  () =>
    new Soldier({
      brain: ai,
      x: battlefield.dimensions.width - 1 - Math.random() * 20,
      y: Math.floor(Math.random() * battlefield.dimensions.height),
      team: 2
    })
);
const player = new Soldier({
  brain: playerBrain,
  x: Math.floor(battlefield.dimensions.width / 2),
  y: battlefield.dimensions.height - 1,
  team: 1
});
soldiers.push(player);
play({battlefield, soldiers, player});
