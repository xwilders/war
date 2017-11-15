const battlefield = {
  dimensions: {width: 15, height: 30}
};

let key;
const readline = require('readline');

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

process.stdin.on('keypress', (str, _key) => {
  key = _key;
  if (key && key.sequence === '\u0003') process.exit();
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
    if (key.name === 'up') newY--;
    if (key.name === 'down') newY++;
    if (key.name === 'right') newX++;
    if (key.name === 'left') newX--;

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

const drawBattlefield = ({battlefield, soldiers, player}) => {
  const view = [];

  const {width, height} = battlefield.dimensions;

  const windowSize = 10;
  const side = windowSize / 2;

  for (let h = player.position.y - side; h < player.position.y + side + 1; h++) {
    const row = [];
    for (let w = player.position.x - side; w < player.position.x + side + 1; w++) {
      row.push(h >= 0 && h < height && w >= 0 && w < width ? ' ' : '#');
    }
    view.push(row);
  }

  const soldierPositions = soldiers.map(soldier => ({
    soldier,
    ...soldier.position
  }));

  soldierPositions.forEach(({soldier, x, y}) => {
    y = y - player.position.y + side;
    x = x - player.position.x + side;
    if (y >= 0 && y <= windowSize && x >= 0 && x <= windowSize) view[y][x] = soldier.draw();
  });

  console.clear();
  const yBorder = Array.from({length: windowSize + 2}, () => '-').join('');
  const board = `${yBorder}\n` + view.map(row => `|${row.join('')}|`).join('\n') + `\n${yBorder}`;
  console.log(board);
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
  x: battlefield.dimensions.width / 2,
  y: battlefield.dimensions.height - 1
});
soldiers.push(player);
play({battlefield, soldiers, player});
