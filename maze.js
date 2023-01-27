const Maze = class {
  constructor(width, height, defaultValue) {
    this.width = width
    this.height = height
    this.array = Array(width * height).fill(defaultValue)
    for (let [x, y, r] of this.entries().filter(([x, y, r]) => !this.has(x, y) ))
      this.set(x, y, 0)
    this.walls = []
    this.base = defaultValue
  }
  get(x, y) {
    return this.array[y * this.width + x]
  }
  set(x, y, value) {
    this.array[y * this.width + x] = value
  }
  entries() {
    return this.array.map((value, i) => [i % this.width, Math.floor(i / this.width), value])
  }
  has(x, y) {
    return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1
  }
}

export default Maze
