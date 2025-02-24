import os from 'node:os'
import path from 'node:path'
import Elysia from 'elysia'
import { watch } from 'chokidar'
import { loadData } from './load'

type GameData = {
  GAME: {
    pseudorandom: {
      seed: string
    }
    selected_back_key: {
      name: string
    }
    stake: keyof typeof STAKE_MAP
  }
}

type RunInfo = {
  timestamp: Date
  seed: string
  deck: string
  stake: string
  url: string
}

const SAVE_LOCATION_MAP: Record<string, string> = {
  win32: 'AppData/Roaming/Balatro/',
  darwin: 'Library/Application Support/Balatro/',
  linux:
    '.local/share/Steam/steamapps/compatdata/2379780/pfx/drive_c/users/steamuser/AppData/Roaming/Balatro/',
}

const STAKE_MAP = {
  1: 'White Stake',
  2: 'Red Stake',
  3: 'Green Stake',
  4: 'Black Stake',
  5: 'Blue Stake',
  6: 'Purple Stake',
  7: 'Orange Stake',
  8: 'Gold Stake',
} as const

const SEED_ANALYZER_BASE_URL = 'https://mathisfun0.github.io/The-Soul/'
const HTTP_PORT = 3000

let currentSeed = ''
let currentRun: RunInfo | Record<string, never> = {}

const getRunInfo = (data: GameData): RunInfo => {
  const { seed } = data.GAME.pseudorandom
  const deck = data.GAME.selected_back_key.name
  const stake = STAKE_MAP[data.GAME.stake]

  const url = new URL(SEED_ANALYZER_BASE_URL)
  url.searchParams.set('deck', deck)
  url.searchParams.set('stake', stake)
  url.searchParams.set('seed', seed)

  return {
    timestamp: new Date(),
    seed,
    deck,
    stake,
    url: url.toString(),
  }
}

const handleFileChange = async (filePath: string | Error): Promise<void> => {
  if (typeof filePath !== 'string') return

  try {
    const data = (await loadData(filePath)) as GameData
    if (data.GAME.pseudorandom.seed === currentSeed) return

    currentSeed = data.GAME.pseudorandom.seed
    currentRun = getRunInfo(data)
    console.log(currentRun)
  } catch (error) {
    console.error('Error processing file change:', error)
  }
}

const initialize = async (): Promise<void> => {
  try {
    console.log('Running Balatro Seed Watch')
    const home = os.homedir()
    const saveLocation = SAVE_LOCATION_MAP[os.platform()]
    const settingsPath = path.join(home, saveLocation, 'settings.jkr')

    const settingsJson = await loadData(settingsPath)
    const loadedProfile = settingsJson.profile.toString()
    const profilePath = path.join(home, saveLocation, loadedProfile, 'save.jkr')

    console.log(`Profile ${loadedProfile}`)
    console.log('Press Ctrl+C to end program')

    const watcher = watch(profilePath, { persistent: true })
    watcher.on('add', handleFileChange)
    watcher.on('change', handleFileChange)
    watcher.on('unlink', () => {
      console.log('File removed')
      currentSeed = ''
    })

    new Elysia().get('/', () => currentRun).listen(HTTP_PORT)
  } catch (error) {
    console.error('Initialization error:', error)
    process.exit(1)
  }
}

initialize()
