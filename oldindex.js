import ErosionMaze from './generators/erosion.js'
import SeedMaze from './generators/seed.js'
import * as utils from './utils.js'

const canvas = document.getElementById('canvas')
const ctx = canvas.getContext('2d')
let width = 40
let height = 40
let pixelSize = 10
canvas.width = pixelSize * width
canvas.height = pixelSize * height
ctx.scale(pixelSize, pixelSize)

let running = false
runSeed.onclick = async () => {
  if (!running) {
    running = true
    for (let i = 0; i < 1000; i++) {
      pixelSize = Math.floor(41 / 41 * 13)
      canvas.width = 555
      canvas.height = 555
      ctx.scale(pixelSize, pixelSize)
      ctx.roundRect(1, 1, 41, 41, 0.75)
      ctx.lineWidth = 0.95
      ctx.strokeStyle = '#797979'
      ctx.fillStyle = '#cdcdcd'
      ctx.fill()
      ctx.stroke()
      let map = new SeedMaze({
        width: 40,
        height: 40,
        minSeeds: 30,
        maxSeeds: 50,
        seedSpread: 2,
        turnChance: 0.2,
        branchChance: 0,
        terminationChance: 0.1,
        wallWrapping: false,
        type: 0,
        mazeSeed: document.getElementById('input1').value,
        debug: document.getElementById('debug').checked,
      })
      let [ maze, seed ] = await map.init()
      
      document.getElementById('seed1').textContent = seed
      document.getElementById('image').setAttribute('download', `seed_maze_${seed}.png`)
      if (maze.length >= 300) break
    }
    running = false
    utils.alreadyPlaced.length = 0
  }
}

runSeedExcavator.onclick = async () => {
  for (let i = 0; i < 1000; i++) {
    pixelSize = Math.floor(41 / 41 * 13)
    canvas.width = 555
    canvas.height = 555
    ctx.scale(pixelSize, pixelSize)
    ctx.roundRect(1, 1, 41, 41, 0.75)
    ctx.lineWidth = 0.95
    ctx.strokeStyle = '#797979'
    ctx.fillStyle = '#cdcdcd'
    ctx.fill()
    ctx.stroke()
    let map = new SeedMaze({
      width: 40,
      height: 40,
      minSeeds: 100,
      maxSeeds: 150,
      seedSpread: 0,
      turnChance: 0.2,
      branchChance: 0,
      terminationChance: 0.1,
      wallWrapping: true,
      type: 1,
      mazeSeed: document.getElementById('input2').value,
      debug: document.getElementById('debug').checked,
    })
    let [ maze, seed ] = await map.init()
    let takenSpace = 0
    let averageSize = maze.reduce((a, b) => a + b.width, 0) / maze.length
    for (let {x, y, width, height} of maze)
      takenSpace += width * height
    
    document.getElementById('seed2').textContent = seed
    document.getElementById('image').setAttribute('download', `excavator_seed_maze_${seed}.png`)
    /*if (takenSpace >= 650 && takenSpace <= 750 && averageSize < 1.25)*/ break
  }
}

runErosion.onclick = () => {
  let maze = new ErosionMaze(0)
  let { squares, width, height } = maze.place()
  pixelSize = Math.floor(33 / 33 * 16)
  canvas.width = 555
  canvas.height = 555
  ctx.scale(pixelSize, pixelSize)
  ctx.roundRect(1, 1, 33, 33, 0.75)
  ctx.lineWidth = 0.75
  ctx.strokeStyle = '#797979'
  ctx.fillStyle = '#cdcdcd'
  ctx.fill()
  ctx.stroke()
  for (let { x, y, size } of squares) {
    ctx.strokeStyle = '#00000080'
    ctx.lineWidth = 0.01
    ctx.fillStyle = '#9f9f9f80'
    ctx.fillRect(x + 1.5, y + 1.5, size, size)
    ctx.strokeRect(x + 1.5, y + 1.5, size, size)
  }
}

download.onclick = () => {
  let download = document.getElementById('image')
  let image = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream')
  download.setAttribute('href', image)
  download.click()
}
