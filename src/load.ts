import * as fs from 'fs'
import Pako from 'pako'

const returnPrefix = /^return /
const stringKeys = /\["(.*?)"\]=/g
const numberKeys = /\[(\d+)\]=/g
const trailingCommas = /,}/g

export function rawToJson(data: string) {
  return JSON.parse(
    data
      .replace(returnPrefix, '')
      .replace(stringKeys, '"$1":')
      .replace(numberKeys, '"NOSTRING_$1":')
      .replace(trailingCommas, '}'),
  )
}

// @ts-expect-error: Originally JavaScript code
export function fixJsonArrays(json) {
  if (typeof json !== 'object' || json === null) {
    return json
  }
  const keys = Object.keys(json)
  if (keys.length === 0) {
    return json
  }
  if (!keys.every((key) => key.startsWith('NOSTRING_'))) {
    for (const key of keys) {
      json[key] = fixJsonArrays(json[key])
    }
    return json
  }
  const array = []
  for (const key of keys) {
    // -1 because Lua is 1-indexed
    array[parseInt(key.slice(9)) - 1] = fixJsonArrays(json[key])
  }
  return array
}

export function processFile(buffer: Pako.Data) {
  const data = Pako.inflateRaw(buffer, { to: 'string' })
  const json = rawToJson(data)
  return fixJsonArrays(json)
}

export const loadData = (path: string) => {
  const file = fs.readFileSync(path)
  const data = processFile(file)
  return data
}
