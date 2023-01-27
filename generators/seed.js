import * as utils from '../utils.js'
import Maze from '../maze.js'
import { Seed, cyrb53 } from '../seed.js'

const SeedMaze = class {
  constructor({width, height, minSeeds, maxSeeds, seedSpread, turnChance, branchChance, terminationChance, wallWrapping, type, mazeSeed, debug}) {
    this.placement = {
      default: type,
      seed: type === 1 ? 0 : 1,
    }
    this.map = new Maze(width, height, this.placement.default)
    
    if (mazeSeed === '') {
      this.mazeSeed = Math.floor(Math.random() * 2147483646)
    } else if (/^\d+$/.test(mazeSeed)) {
      this.mazeSeed = parseInt(mazeSeed)
    } else {
      this.mazeSeed = cyrb53(mazeSeed)
    }
    this.mapSeed = new Seed(this.mazeSeed)
    
    this.seeds = []
    this.seedAmount = Math.floor(this.mapSeed.nextFloat() * (maxSeeds - minSeeds)) + minSeeds
    this.seedSpread = seedSpread
    
    this.type = type
    this.turnChance = turnChance
    this.branchChance = branchChance
    this.terminationChance = terminationChance
    this.wallWrapping = wallWrapping
    
    this.debug = debug
  }
  async init() {
    await this.seedWalls()
    await this.growWalls()
    await this.sprinkleWalls()
    await utils.findPockets(this.map, this.debug)
    let walls = this.map.array.filter(r => r === 1)
    await utils.mergeWalls(this.map, this.debug)
    //while (this.map.array.filter(r => r === 1).length > 0)
      //utils.combineWalls(this.map)
    await utils.placeWalls(this.map)
    return [walls, this.mazeSeed]
  }
  async seedWalls() {
    let i = 0
    while (this.seeds.length < this.seedAmount) {
      if (i > 1000) throw Error('Loop overflow')
      i++
      let loc = { x: 0, y: 0 }
      loc.x = Math.floor(this.mapSeed.nextFloat() * this.map.width) - 1
      loc.y = Math.floor(this.mapSeed.nextFloat() * this.map.height) - 1
      if (this.seeds.some(r => (Math.abs(loc.x - r.x) <= this.seedSpread && Math.abs(loc.y - r.y) <= this.seedSpread))) continue
      if (!this.map.has(loc.x, loc.y)) continue
      this.seeds.push(loc)
      this.map.set(loc.x, loc.y, this.placement.seed)
      await utils.placeWalls(this.map, this.debug ? 0 : -1)
    }
  }
  async sprinkleWalls() {
    for (let i = 0; i < 15; i++) { 
      let loc = { x: 0, y: 0 }
      loc.x = Math.floor(this.mapSeed.nextFloat() * this.map.width) - 1
      loc.y = Math.floor(this.mapSeed.nextFloat() * this.map.height) - 1
      if (this.map.entries().some(([x, y, r]) => r === 1 && (Math.abs(loc.x - x) <= this.seedSpread && Math.abs(loc.y - y) <= this.seedSpread))) continue
      if (!this.map.has(loc.x, loc.y)) continue
      this.map.set(loc.x, loc.y, this.placement.seed)
      await utils.placeWalls(this.map, this.debug ? 0 : -1)
    }
  }
  async growWalls() {
    let perpendicular = ([x, y]) => [[y, -x], [-y, x]]
    for (let [i, seed] of this.seeds.entries()) {
      let dir = utils.direction[Math.floor(this.mapSeed.nextFloat() * 4)]
      let termination = 1
      do {
        termination = this.mapSeed.nextFloat()
        let [x, y] = dir
        seed.x += x
        seed.y += y
        if (!this.map.has(seed.x, seed.y)) {
          if (!this.wallWrapping) break
          let wrap = utils.wrapping(seed.x, seed.y, this.map)
          seed.x = wrap.x
          seed.y = wrap.y
        }
        this.map.set(seed.x, seed.y, this.placement.seed)
        if (this.mapSeed.nextFloat() <= this.branchChance) {
          if (this.seeds.length > 75) continue
          let [ xx, yy ] = perpendicular(dir)[Math.floor(this.mapSeed.nextFloat() * 2)]
          if (!this.map.has(seed.x + xx, seed.y + yy)) {
            if (!this.wallWrapping) break
            let wrap = utils.wrapping(seed.x + xx, seed.y + yy, this.map)
            seed.x = wrap.x
            seed.y = wrap.y
          }
          this.seeds.push({ x: seed.x + xx, y: seed.y + yy })
          this.map.set(seed.x + xx, seed.y + yy, this.placement.seed)
        } else if (this.mapSeed.nextFloat() <= this.turnChance) {
          dir = perpendicular(dir)[Math.floor(this.mapSeed.nextFloat() * 2)]
        }
        await utils.placeWalls(this.map, this.debug ? 0 : -1)
      } while (termination >= this.terminationChance)
    }
  }
}
  
export default SeedMaze
