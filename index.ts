import { watch } from 'fs'
import os from 'os'
import path from 'path'
import { loadData } from './load'

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

  const data = await loadData(profilePath)
  printRunInfo(data)

  const watcher = watch(profilePath, { persistent: true })
  watcher.on('add', async (event, filename) => await onFileChanged(profilePath))
  watcher.on('change', async (event, filename) => await onFileChanged(profilePath))
  watcher.on('unlink', async (event, filename) => await onFileRemoved())
}

const onFileChanged = async (filePath: string) => {
  const data = await loadData(filePath)
  if (data.GAME.pseudorandom.seed === currentSeed) return
  currentSeed = data.GAME.pseudorandom.seed
  printRunInfo(data)
}

const onFileRemoved = async () => {
  console.log('File removed')
  currentSeed = ''
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

