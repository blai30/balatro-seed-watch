const returnPrefix = /^return /
const stringKeys = /\["(.*?)"\]=/g
const numberKeys = /\[(\d+)\]=/g
const trailingCommas = /,}/g

const rawToJson = (data: string) => {
  const input = data
    .replace(returnPrefix, '')
    .replace(stringKeys, '"$1":')
    .replace(numberKeys, '"NOSTRING_$1":')
    .replace(trailingCommas, '}')
  return JSON.parse(input)
}

// @ts-expect-error: json
const fixJsonArrays = (json) => {
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

const processFile = (arrayBuffer: Uint8Array | string | ArrayBuffer) => {
  const decompressed = Bun.inflateSync(arrayBuffer)
  const decoder = new TextDecoder()
  const decoded = decoder.decode(decompressed)
  const json = rawToJson(decoded)
  return fixJsonArrays(json)
}

export const loadData = async (path: string) => {
  const file = Bun.file(path)
  const arrayBuffer = await file.arrayBuffer()
  const data = processFile(arrayBuffer)
  return data
}
