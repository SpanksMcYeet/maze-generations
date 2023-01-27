const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
canvas.width = 555
canvas.height = 555

export const direction = [
  [-1, 0], [1, 0], // left and right
  [0, -1], [0, 1], // up and down
]

export const sleep = ms => new Promise(r => setTimeout(r, ms))

export let alreadyPlaced = []

export const placeWalls = async (map, debugType = -1) => {
  if (debugType === 0 || debugType === -1)
    map.walls = map.entries().filter(([x, y, r]) => r === 1).map(([x, y, r]) => ({x, y, width: 1, height: 1}))
  
  for (let {x, y, width, height} of map.walls) {
    if (alreadyPlaced.find(r => r.x === x && r.y === y) && Math.abs(debugType) !== 1) continue
    if (Math.abs(debugType) !== 1) await sleep(8)
    ctx.fillStyle = '#cdcdcd'
    ctx.fillRect(x + 1.5, y + 1.5, width, height)
    
    ctx.strokeStyle = '#00000080'
    ctx.lineWidth = 0.01
    ctx.fillStyle = '#9f9f9f80'
    ctx.fillRect(x + 1.5, y + 1.5, width, height)
    ctx.strokeRect(x + 1.5, y + 1.5, width, height)  
    if (Math.abs(debugType) !== 1) {
      alreadyPlaced.push({x, y})
    } else {
      map.walls.shift()
    }
  }
}

export const findPockets = async (map, debug) => {
  let queue = [[0, 0]]
  map.set(0, 0, 2)
  let checkedIndices = new Set([0])
  for (let i = 0; i < 5000 && queue.length > 0; i++) {
    let [x, y] = queue.shift()
    for (let [nx, ny] of [
      [x - 1, y], // left
      [x + 1, y], // right
      [x, y - 1], // top
      [x, y + 1], // bottom
    ]) {
      if (nx < 0 || nx > map.width - 1 || ny < 0 || ny > map.height - 1) continue
      if (map.get(nx, ny) !== 0) continue
      let i = ny * map.width + nx
      if (checkedIndices.has(i)) continue
      checkedIndices.add(i)
      queue.push([nx, ny])
      map.set(nx, ny, 2)
      
      if (debug) {
        ctx.fillStyle = '#ff000080'
        ctx.fillRect(nx + 1.5, ny + 1.5, 0.95, 0.95)
        await sleep(1)
      }
    }
  }
  for (let [x, y, r] of map.entries()) {
    if (r === 2) {
      if (!debug) continue
      ctx.fillStyle = '#cdcdcd'
      ctx.fillRect(x + 1.5, y + 1.5, 1, 1)
      await sleep(1)
    } else if (r === 0) {
      map.set(x, y, 1)
      if (!debug) continue
      ctx.fillStyle = '#ff000080'
      ctx.fillRect(x + 1.5, y + 1.5, 1, 1)
      await sleep(1)
    }
  }
}

export const combineWalls = map => {
  let best = null
  let maxSize = 0
  for (let [x, y, r] of map.entries()) {
    if (r !== 1) continue
    let size = 1
    loop: while (map.has(x + size, y + size)) {
      for (let v = 0; v <= size; v++)
        if (map.get(x + size, y + v) !== 1
         || map.get(x + v, y + size) !== 1)
          break loop
      size++
    }
    if (size > maxSize) {
      maxSize = size
      best = { x, y }
    }
  }
  if (!best) return null
  for (let y = 0; y < maxSize; y++) {
    for (let x = 0; x < maxSize; x++) {
      map.set(best.x + x, best.y + y, 0)
    }
  }
  map.walls.push({ x: best.x, y: best.y, width: maxSize, height: maxSize, }) 
}

export const mergeWalls = async (map, debug) => {
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      if (map.get(x, y) !== 1) continue
      let chunk = { x, y, width: 0, height: 1 }
      while (map.get(x + chunk.width, y) === 1) {
        map.set(x + chunk.width, y, 0)
        chunk.width++
        
        map.walls.push(chunk)
        placeWalls(map, 1)
        if (debug) await sleep(10)
      }
      outer: while (true) {
        for (let i = 0; i < chunk.width; i++) {
          if (map.get(x + i, y + chunk.height) !== 1) break outer
        }
        for (let i = 0; i < chunk.width; i++)
          map.set(x + i, y + chunk.height, 0)
        chunk.height++
        
        map.walls.push(chunk)
        placeWalls(map, 1)
        if (debug) await sleep(10)
      }
      map.walls.push(chunk)
    }
  }
}

export const wrapping = (x, y, map) => {
  return {
    x: x === 0 ? map.width  - 2 : x === map.width  - 1 ? 1 : x,
    y: y === 0 ? map.height - 2 : y === map.height - 1 ? 1 : y,
  }
}
