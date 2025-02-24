import os from 'node:os'
import path from 'node:path'
import { watch } from 'chokidar'
import { loadData } from './load'
import Elysia from 'elysia'

const saveLocationMap: { [key: string]: string } = {
  win32: 'AppData/Roaming/Balatro/',
  darwin: 'Library/Application Support/Balatro/',
}

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

let currentSeed = ''
let currentRun = {}

const initialize = async () => {
  console.log('Running Balatro Seed Watch')
  const home = os.homedir()
  const saveLocation = saveLocationMap[os.platform()]
  const settingsPath = path.join(home, saveLocation, 'settings.jkr')
  const settingsJson = await loadData(settingsPath)
  const loadedProfile = settingsJson.profile.toString()
  const profilePath = path.join(home, saveLocation, loadedProfile, 'save.jkr')

  console.log(`Profile ${loadedProfile}`)
  console.log('Press Ctrl+C to end program')

  const watcher = watch(profilePath, { persistent: true })
  watcher.on('add', onFileChanged)
  watcher.on('change', onFileChanged)
  watcher.on('unlink', onFileRemoved)

  new Elysia().get('/', () => currentRun).listen(3000)
}

const onFileChanged = async (filePath: string | Error) => {
  if (typeof filePath !== 'string') return
  const data = await loadData(filePath)
  if (data.GAME.pseudorandom.seed === currentSeed) return
  currentSeed = data.GAME.pseudorandom.seed
  currentRun = getRunInfo(data)
  console.log(currentRun)
}

const onFileRemoved = async (filePath: string | Error) => {
  console.log('File removed')
  currentSeed = ''
}

// @ts-expect-error: data is json
const getRunInfo = (data) => {
  const seed = data.GAME.pseudorandom.seed
  const deck = data.GAME.selected_back_key.name
  const stake = stakeMap[data.GAME.stake]

  const url = new URL('https://mathisfun0.github.io/The-Soul/')
  url.searchParams.set('deck', deck)
  url.searchParams.set('stake', stake)
  url.searchParams.set('seed', seed)

  const runInfo = {
    timestamp: new Date(),
    seed,
    deck,
    stake,
    url: url.toString(),
  }
  return runInfo
}

initialize()
