import Maze from '../maze.js'

const MazeZone = class {
  constructor(array = [], offset = { x: 0, y: 0 }, length = array.map(row => row.filter(r => r).length).reduce((a, b) => a + b, 0)) {
    this.array = array
    this.offset = offset
    this.length = length
  }
  get width() {
    return this.array.length
  }
  get height() {
    return this.array.length === 0 ? 0 : this.array[0].length
  }
  normalize() {
    while (this.array.length > 0 && this.array[0].every(r => !r)) {
      this.offset.x++
      this.array.shift()
    }
    while (this.array.length > 0 && this.array[this.array.length - 1].every(r => !r)) {
      this.array.pop()
    }
    let minY = Infinity
    let maxY = -Infinity
    for (let x = 0; x < this.width; x++) {
      for (let y = 0; y < this.height; y++) {
        if (!this.array[x][y]) continue
        minY = y < minY ? y : minY
        maxY = y > maxY ? y : maxY
      }
    }
    this.offset.y += minY
    if (minY === Infinity) {
      this.array = []
    } else {
      this.array = this.array.map(row => row.slice(minY, maxY + 1))
    }
    return this
  }
  blocks() {
    let blocks = []
    for (let x = 0; x < this.width; x++)
      for (let y = 0; y < this.height; y++)
        if (this.array[x][y])
          blocks.push({ x: x + this.offset.x, y: y + this.offset.y, size: 1 })
    return blocks
  }
  shaveSingles() {
    let { width, height } = this
    if (this.length <= 3)
      return [null, this.blocks()]

    let output = []
    let shaveable = true
    let shaved = false
    while (shaveable) {
      shaveable = false
      for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
          if (!this.array[x][y]) continue
          let left = x > 0 && this.array[x - 1][y]
          let right = x + 1 < width && this.array[x + 1][y]
          let top = y > 0 && this.array[x][y - 1]
          let bottom = y + 1 < height && this.array[x][y + 1]
          if ((!left && !right) || (!top && !bottom)) {
            this.array[x][y] = false
            output.push({ x: x + this.offset.x, y: y + this.offset.y, size: 1 })
            shaveable = true
          }
        }
      }
      shaved = shaved || shaveable
    }
    this.length -= output.length
    if (shaved)
      return [this.normalize(), output]
    return null
  }
  takeBiggestSquare() {
    let { width, height } = this
    let best = null
    let maxSize = 0
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (!this.array[x][y]) continue
        let size = 1
        loop: while (x + size < width && y + size < height) {
          for (let i = 0; i <= size; i++)
            if (!this.array[x + size][y + i]
             || !this.array[x + i][y + size])
              break loop
          size++
        }
        if (size > maxSize) {
          maxSize = size
          best = { x, y }
        }
      }
    }
    if (!best) return null
    this.length -= maxSize * maxSize
    for (let x = 0; x < maxSize; x++) {
      for (let y = 0; y < maxSize; y++) {
        this.array[best.x + x][best.y + y] = false
      }
    }
    let square = { x: best.x + this.offset.x, y: best.y + this.offset.y, size: maxSize }
    if (best.x === 0 || best.x + maxSize === width
     || best.y === 0 || best.y + maxSize === height)
      this.normalize()
    return square
  }
  shave() {
    this.normalize()
    let shave = this.shaveSingles()
    if (shave)
      return shave
    let biggestSquare = this.takeBiggestSquare()
    return [this.width && this.height ? this : null, [biggestSquare]]
  }
  intoSquares() {
    let current = this
    let squares = []
    while (current) {
      let now = this.shave()
      current = now[0]
      squares.push(...now[1])
    }
    return squares
  }
  toString(filled = '[]', unfilled = '--') {
    let map = Array(this.height).fill().map((_, i) => this.array.map(row => row[i]))
    return [
      `${this.width}x${this.height} (${this.length})`,
      map.map(row => row.map(cell => cell ? filled : unfilled).join('')).join('\n'),
      `+(${this.offset.x}, ${this.offset.y})`,
    ].join('\n')
  }
}

const ErosionMaze = class {
  constructor(type) { // TODO new config format
    this.type = type
    this.staticRand = Math.random()
    this.clear()
  }
  clear(mapString) {
    if (mapString) {
      let map = mapString.trim().split('\n').map(r => r.trim().split('').map(r => r === '#' ? 1 : r === '@'))
      this.width = map[0].length
      this.height = map.length
      this.m = new Maze(this.width, this.height, false)
      for (let y = 0; y < map.length; y++)
        for (let x = 0; x < map[y].length; x++)
          this.m.set(x, y, map[y][x])
    } else {
      this.width = 32
      this.height = 32
      this.m = new Maze(32, 32, false)
    }
  }
  isClosed() {
    let cells = this.m.entries().map(([x, y]) => [x, y, x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1])

    let work = true
    while (work) {
      work = false
      for (let [x, y, open] of cells)
        if (open)
          for (let other of cells) {
            let [ox, oy, oOpen] = other
            if (!oOpen && Math.abs(ox - x) + Math.abs(oy - y) === 1) {
              other[2] = true
              work = true
            }
          }
    }
    return cells.some(r => !r[2])
  }
  randomErosion(side = null, corner = null) { // null = no requirement, 0 = neither, 1 = only one, 2 = both, true = one or two
    for (let i = 0; i < 10000; i++) {
      // find position
      let x = Math.floor(Math.random() * this.width)
      let y = Math.floor(Math.random() * this.height)
      if (this.m.get(x, y)) continue
      // find direction
      if ((x === 0 || x === this.width - 1) && (y === 0 || y === this.height - 1)) continue
      let direction = Math.floor(Math.random() * 4)
      if (x === 0) direction = 0
      else if (y === 0) direction = 1
      else if (x === this.width - 1) direction = 2
      else if (y === this.height - 1) direction = 3
      // find target
      let tx = direction === 0 ? x + 1 : direction === 2 ? x - 1 : x
      let ty = direction === 1 ? y + 1 : direction === 3 ? y - 1 : y
      if (this.m.get(tx, ty) !== true) continue
      // check corner
      if (corner !== null) {
        let left = this.m.get(
          direction === 2 || direction === 3 ? x - 1 : x + 1,
          direction === 0 || direction === 3 ? y - 1 : y + 1,
        )
        let right = this.m.get(
          direction === 1 || direction === 2 ? x - 1 : x + 1,
          direction === 2 || direction === 3 ? y - 1 : y + 1,
        )
        if ((corner === true && (left || right)) || (corner === +left + +right)) {
        } else {
          continue
        }
      }
      // check side
      if (side !== null) {
        let left = this.m.get(
          direction === 3 ? x + 1 : direction === 1 ? x - 1 : x,
          direction === 0 ? y + 1 : direction === 2 ? y - 1 : y,
        )
        let right = this.m.get(
          direction === 1 ? x + 1 : direction === 3 ? x - 1 : x,
          direction === 2 ? y + 1 : direction === 0 ? y - 1 : y,
        )
        if ((side === true && (left || right)) || (side === +left + +right)) {
        } else {
          continue
        }
      }
      // return it
      return [tx, ty, x, y]
    }
    throw new Error(`Unable to find suitable erosion site; side = ${side}, corner = ${corner}`)
  }
  erode(side, corner) {
    let [x, y] = this.randomErosion(side, corner)
    this.m.set(x, y, false)
  }
  erodeSym2(side, corner) {
    let [x, y] = this.randomErosion(side, corner)
    this.m.set(x, y, false)
    this.m.set(this.width - 1 - x, this.height - 1 - y, false)
  }
  erodeSym4(side, corner) {
    if (this.width !== this.height)
      throw new Error('Maze must be a square')
    let size = this.width - 1
    let [x, y] = this.randomErosion(side, corner)
    if (this.staticRand < 0.5) {
      this.m.set(x, y, false)
      this.m.set(x, size - y, false)
      this.m.set(size - x, y, false)
      this.m.set(size - x, size - y, false)
    } else {
      this.m.set(x, y, false)
      this.m.set(y, size - x, false)
      this.m.set(size - x, size - y, false)
      this.m.set(size - y, x, false)
    }
  }
  erodeSym8(side, corner) {
    if (this.width !== this.height)
      throw new Error('Maze must be a square')
    let size = this.width - 1
    let [x, y] = this.randomErosion(side, corner)
    this.m.set(x, y, false)
    this.m.set(y, x, false)
    this.m.set(x, size - y, false)
    this.m.set(size - y, x, false)
    this.m.set(size - x, y, false)
    this.m.set(y, size - x, false)
    this.m.set(size - x, size - y, false)
    this.m.set(size - y, size - x, false)
  }
  runNormal() {
    this.clear(`
      --------------------------------
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@-----------------@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@--------@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@-@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@-@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@-----------------@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      -@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-
      --------------------------------
    `)
    for (let i = 0; i < 20; i++)
      this.erode(0, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 20; i++) {
      this.erode(1, 2)
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 150; i++)
      this.erode(1, 2)
    for (let i = 0; i < 10; i++) {
      this.erode(0, 2)
      this.erode(2, 2)
      this.erode(2, 2)
      this.erode(2, 2)
    }
    for (let i = 0; i < 50; i++)
      this.erode(0, 0)
  }
  runTrial() {
    try {
      switch (this.type) {
        case 0:
          this.runNormal()
          break
        default:
          return null
      }
    } catch {
      // console.log(e)
      return null
    }
    if (this.isClosed() && this.type !== 12) {
      // console.log('Maze generation failed')
      return null
    }
    let array = []
    for (let x = 0; x < this.m.width; x++) {
      let column = []
      for (let y = 0; y < this.m.height; y++)
        column.push(this.m.get(x, y))
      array.push(column)
    }
    return new MazeZone(array)
  }
  place() {
    for (let i = 0; i < 500; i++) {
      let trial = this.runTrial()
      if (trial)
        return {
          squares: trial.intoSquares(),
          width: this.width,
          height: this.height,
        }
    }
  }
}

export default ErosionMaze
