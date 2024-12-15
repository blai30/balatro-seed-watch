import chokidar from 'chokidar'
import { loadData } from './load'

const stakeMap: { [key: string]: string } = {
  1: 'White Stake',
  2: 'Red Stake',
  3: 'Green Stake',
  4: 'Black Stake',
  5: 'Blue Stake',
  6: 'Purple Stake',
  7: 'Orange Stake',
  8: 'Gold Stake',
}

const initialize = () => {
  console.log('Running Balatro Seed Watch')
  const path = `${process.env.APPDATA}/Balatro/1/save.jkr`
  console.log(path)
  console.log('Press Ctrl+C to end program')

  const data = loadData(path)
  let currentSeed = data.GAME.pseudorandom.seed
  printRunInfo(data)

  const watcher = chokidar.watch(path, {
    persistent: true,
  })
  
  watcher.on('add', (path) => {
    const data = loadData(path)
    if (data.GAME.pseudorandom.seed === currentSeed) return
    currentSeed = data.GAME.pseudorandom.seed
    printRunInfo(data)
  })
  
  watcher.on('change', (path) => {
    const data = loadData(path)
    if (data.GAME.pseudorandom.seed === currentSeed) return
    currentSeed = data.GAME.pseudorandom.seed
    printRunInfo(data)
  })
  
  watcher.on('unlink', (path) => {
    console.log('File removed')
  })
}

// @ts-expect-error: data is json
const printRunInfo = (data) => {
  const seed = data.GAME.pseudorandom.seed
  const deck = data.GAME.selected_back_key.name
  const stake = stakeMap[data.GAME.stake]
  console.log()
  console.log(`Seed: ${seed}`)
  console.log(`${deck}`)
  console.log(`${stake}`)

  const url = new URL('https://mathisfun0.github.io/The-Soul/')
  url.searchParams.set('deck', deck)
  url.searchParams.set('stake', stake)
  url.searchParams.set('seed', seed)
  console.log(url.toString())
}

initialize()
