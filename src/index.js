import './css/canvases.css';
import mapSpec from './imgSpecs/sf2-map.json';
import spriteImg from './img/sf2-map.png';

const battlefield = {
  dimensions: {width: 20, height: 30},
  sizes: {tileSize: 12, windowHeight: 14, windowWidth: 26}
};

const sprite = new Image();
sprite.src = spriteImg;

document.body.innerHTML += '<canvas id="canvasId"></canvas>';

let key;
document.addEventListener('keydown', e => {
  const _key = e.key;
  key = _key;
});

document.addEventListener('keyup', e => {
  const _key = e.key;
  if (_key === key) key = undefined;
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

const ai = {
  move: ({x, y}, {width, height}) => {
    const direction = Math.random() * 2;
    let newX = x;
    let newY = y;

    if (direction < 1) {
      newX = x + Math.floor(Math.random() * 3 - 1);
      newX = Math.min(newX, width - 1);
      newX = Math.max(newX, 0);
    } else {
      newY = y + Math.floor(Math.random() * 3 - 1);
      newY = Math.min(newY, height - 1);
      newY = Math.max(newY, 0);
    }

    return {x: newX, y: newY, dir: getDir(newX - x, newY - y)};
  }
};

const playerBrain = {
  move: ({x, y}, {width, height}) => {
    let newX = x;
    let newY = y;
    if (!key) return {x, y, dir: DIR_NONE};
    if (key === 'ArrowUp') newY--;
    if (key === 'ArrowDown') newY++;
    if (key === 'ArrowRight') newX++;
    if (key === 'ArrowLeft') newX--;

    newX = Math.min(newX, width - 1);
    newX = Math.max(newX, 0);
    newY = Math.min(newY, height - 1);
    newY = Math.max(newY, 0);

    return {x: newX, y: newY, dir: getDir(newX - x, newY - y)};
  }
};

class Soldier {
  constructor({x, y, brain}) {
    this.position = {x, y};
    this.direction = DIR_NONE;
    this.brain = brain;
  }

  draw() {
    return this.direction;
  }

  move(dimensions) {
    const {x, y, dir} = this.brain.move(this.position, dimensions);
    this.position = {x, y};
    this.direction = dir;
  }
}

const performActions = ({battlefield, soldiers}) => {
  const orderOfActions = soldiers
    .map(soldier => ({soldier, rand: Math.random()}))
    .sort(({rand}, {rand: rand2}) => rand - rand2)
    .map(({soldier, rand}) => soldier);

  orderOfActions.forEach(soldier => {
    soldier.move(battlefield.dimensions);
  });
};

const hasLeft = (view, x, y, symbol) => !view[y][x - 1] || view[y][x - 1] === symbol;
const hasRight = (view, x, y, symbol) => !view[y][x + 1] || view[y][x + 1] === symbol;

const drawBattlefield = ({battlefield, soldiers, player}) => {
  const view = [];

  const {width, height} = battlefield.dimensions;
  const {windowHeight, windowWidth, tileSize} = battlefield.sizes;
  const {position} = player;

  for (let y = 0; y < windowHeight; y++) {
    const row = [];
    const h = position.y - windowHeight / 2 + y;
    for (let x = 0; x < windowWidth; x++) {
      const w = position.x - windowWidth / 2 + x;
      row.push(h >= 0 && h < height && w >= 0 && w < width ? ' ' : '#');
    }
    view.push(row);
  }

  const soldierPositions = soldiers.map(soldier => ({
    soldier,
    ...soldier.position
  }));

  soldierPositions.forEach(({soldier, x, y}) => {
    const newY = y - position.y + windowHeight / 2;
    const newX = x - position.x + windowWidth / 2;
    if (newY >= 0 && newY < windowHeight && newX >= 0 && newX < windowWidth) view[newY][newX] = soldier.draw();
  });

  const canvas = document.getElementById('canvasId');
  const context = canvas.getContext('2d');
  context.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < view.length; y++) {
    for (let x = 0; x < view[y].length; x++) {
      const left = hasLeft(view, x, y, '#');
      const right = hasRight(view, x, y, '#');
      const specNum = left && right ? 0 : left ? 2 : 1;
      if (view[y][x] === '#') drawTile(context, sprite, mapSpec[specNum], x, y, tileSize);
      else if (view[y][x] !== ' ') drawBlock(context, x, y, tileSize);
    }
  }
};

const drawTile = (context, sprite, singleTileSpec, x, y, tileSize) => {
  context.drawImage(
    sprite,
    singleTileSpec.x,
    singleTileSpec.y,
    24,
    24, // source coords
    Math.floor(x * tileSize),
    Math.floor(y * tileSize),
    tileSize,
    tileSize // destination coords
  );
};

const drawBlock = (context, x, y, tileSize) => {
  context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
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
      x: Math.floor(Math.random() * battlefield.dimensions.width),
      y: Math.floor(Math.random() * battlefield.dimensions.height)
    })
);
const player = new Soldier({
  brain: playerBrain,
  x: Math.floor(battlefield.dimensions.width / 2),
  y: battlefield.dimensions.height - 1
});
soldiers.push(player);
play({battlefield, soldiers, player});
