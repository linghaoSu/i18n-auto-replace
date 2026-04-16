import { sep } from 'node:path'
import { Uri, workspace } from 'vscode'
import { getSettings } from './settings'

interface WorkspaceInfo {
  name: string
  basePath: string
  uri?: Uri
  schemaPath: string
}

const info: WorkspaceInfo = {
  name: '',
  basePath: '',
  schemaPath: '',
}

export const emptyJSONContent = `{}
`

const { fs } = workspace
const { readDirectory } = fs

export function getWorkspaceInfo() {
  const { workspaceFolders } = workspace
  if (workspaceFolders?.length) {
    const [folder] = workspaceFolders
    if (info.name !== folder.name) {
      info.name = folder.name
      info.basePath = `${folder.uri.path}${sep}`
      info.schemaPath = `${folder.uri.toString()}${sep}`
      info.uri = folder.uri
    }
  }
  else {
    return false
  }
  return info
}

export function isTargetFile(path: string) {
  // only check vue file for now
  const settings = getSettings()
  if (settings.extRegex.test(path))
    return true
  return false
}

export function isInSrc(path: string) {
  const settings = getSettings()
  return path.startsWith(settings.srcLocation)
}

export function isExcluded(relativePath: string) {
  const settings = getSettings()
  if (!settings.excludeList.length)
    return false
  const normalized = relativePath.replace(/\\/g, '/')
  return settings.excludeList.some((prefix) => {
    return normalized === prefix || normalized.startsWith(`${prefix}/`)
  })
}

export function isMenuTargetFile(uri: Uri) {
  const path = uri.toString()
  if (!isTargetFile(path))
    return false
  const relativePath = getRelativePath(path)
  if (!relativePath)
    return false
  if (!isInSrc(relativePath))
    return false
  if (isExcluded(relativePath))
    return false
  return true
}

export function getRelativePath(path: string) {
  const info = getWorkspaceInfo()
  if (!info)
    return false

  if (path.startsWith(info.schemaPath))
    return path.slice((info.schemaPath).length)

  return path
}

export function getAbsoluteUri(path: string[]) {
  const info = getWorkspaceInfo()
  if (!info || !info.uri)
    return false

  return Uri.joinPath(info.uri, ...path)
}

export async function getLocaleList() {
  const settings = getSettings()
  const localeUri = getAbsoluteUri(settings.localeLocation)
  if (!localeUri)
    return

  const localesDirs = await readDirectory(localeUri)

  return localesDirs.map(([locale]) => locale)
}

interface LocaleFileParts {
  locale: string
  relativePathParts: string[]
}

export function parseLocaleFile(relativePath: string): LocaleFileParts | undefined {
  const settings = getSettings()
  const normalized = relativePath.replace(/\\/g, '/')
  if (!normalized.endsWith('.json'))
    return undefined

  const prefix = `${settings.localeLocation.join('/')}/`
  if (!normalized.startsWith(prefix))
    return undefined

  const rest = normalized.slice(prefix.length)
  const parts = rest.split('/')
  if (parts.length < 2)
    return undefined

  const [locale, ...relativePathParts] = parts
  if (!locale || relativePathParts.length === 0)
    return undefined

  return { locale, relativePathParts }
}

export function isLocaleFile(uri: Uri): boolean {
  const relativePath = getRelativePath(uri.toString())
  if (!relativePath)
    return false
  return parseLocaleFile(relativePath) !== undefined
}

async function resolveLocaleRelativeParts(uri: Uri): Promise<string[] | undefined> {
  const path = uri.toString()
  const relativePath = getRelativePath(path)
  if (!relativePath)
    return undefined

  const parsed = parseLocaleFile(relativePath)
  if (parsed)
    return parsed.relativePathParts

  if (!isTargetFile(path))
    return undefined
  if (!isInSrc(relativePath))
    return undefined
  if (isExcluded(relativePath))
    return undefined

  const relativePathList = relativePath.split(sep)
  relativePathList.shift()

  const lastIndex = relativePathList.length - 1
  const last = relativePathList[lastIndex]
  const fileExtList = last.split('.')
  fileExtList.pop()
  fileExtList.push('json')
  relativePathList[lastIndex] = fileExtList.join('.')

  return relativePathList
}

export async function getPairedLocales(uri: Uri): Promise<string[]> {
  const info = getWorkspaceInfo()
  if (!info || !info.uri)
    return []
  const settings = getSettings()

  const relativePathParts = await resolveLocaleRelativeParts(uri)
  if (!relativePathParts)
    return []

  const allLocales = (await getLocaleList()) ?? []
  const base = info.uri
  const results = await Promise.all(allLocales.map(async (locale) => {
    const candidate = Uri.joinPath(base, ...settings.localeLocation, locale, ...relativePathParts)
    try {
      await workspace.fs.stat(candidate)
      return locale
    }
    catch {
      return undefined
    }
  }))

  return results.filter((x): x is string => x !== undefined)
}

export async function resolveSourceFromLocale(localeUri: Uri): Promise<Uri | undefined> {
  const settings = getSettings()
  const info = getWorkspaceInfo()
  if (!info || !info.uri)
    return undefined

  const relativePath = getRelativePath(localeUri.toString())
  if (!relativePath)
    return undefined

  const parsed = parseLocaleFile(relativePath)
  if (!parsed)
    return undefined

  const { relativePathParts } = parsed
  const lastIndex = relativePathParts.length - 1
  const nameParts = relativePathParts[lastIndex].split('.')
  nameParts.pop()
  const baseName = nameParts.join('.')

  for (const ext of settings.ext) {
    const candidateParts = [...relativePathParts]
    candidateParts[lastIndex] = `${baseName}.${ext}`
    const candidate = Uri.joinPath(info.uri, settings.srcLocation, ...candidateParts)
    try {
      await workspace.fs.stat(candidate)
      return candidate
    }
    catch {
      // try next extension
    }
  }
  return undefined
}
