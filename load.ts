const returnPrefix = /^return /
const stringKeys = /\["(.*?)"\]=/g
const numberKeys = /\[(\d+)\]=/g
const trailingCommas = /,}/g

type JsonObject = {
  [key: string]: JsonValue
}

type JsonValue = string | number | boolean | JsonObject | JsonValue[]

const rawToJson = (data: string): JsonObject => {
  const input = data
    .replace(returnPrefix, '')
    .replace(stringKeys, '"$1":')
    .replace(numberKeys, '"NOSTRING_$1":')
    .replace(trailingCommas, '}')
  return JSON.parse(input)
}

const fixJsonArrays = (json: JsonValue): JsonValue => {
  if (typeof json !== 'object' || json === null) {
    return json
  }
  if (Array.isArray(json)) {
    return json.map(fixJsonArrays)
  }
  const keys = Object.keys(json)
  if (!keys.every((key) => key.startsWith('NOSTRING_'))) {
    const result: JsonObject = {}
    for (const key of keys) {
      result[key] = fixJsonArrays(json[key])
    }
    return result
  }
  const array: JsonValue[] = []
  for (const key of keys) {
    array[Number.parseInt(key.slice(9)) - 1] = fixJsonArrays(json[key])
  }
  return array
}

const processFile = (
  arrayBuffer: Uint8Array | string | ArrayBuffer,
): JsonObject => {
  const decompressed = Bun.inflateSync(arrayBuffer)
  const decoder = new TextDecoder()
  const decoded = decoder.decode(decompressed)
  const json = rawToJson(decoded)
  return fixJsonArrays(json) as JsonObject
}

export const loadData = async (path: string): Promise<JsonObject> => {
  const file = Bun.file(path)
  const arrayBuffer = await file.arrayBuffer()
  return processFile(arrayBuffer)
}
