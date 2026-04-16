import { sep } from 'path'
import { Uri, ViewColumn, window } from 'vscode'
import { Log } from '../log'
import { getSettings } from '../settings'
import { getAbsoluteUri, getRelativePath, getWorkspaceInfo, isExcluded, isInSrc, isTargetFile, parseLocaleFile, resolveSourceFromLocale } from '../utils'

function pickTargetViewColumn(): ViewColumn {
  const groups = window.tabGroups.all
  if (groups.length <= 1)
    return ViewColumn.Beside

  const activeColumn = window.tabGroups.activeTabGroup.viewColumn
  for (const group of groups) {
    if (group.viewColumn !== activeColumn)
      return group.viewColumn
  }
  return ViewColumn.Beside
}

export async function openLocaleFile(filename: string, locale?: string) {
  const settings = getSettings()
  const info = getWorkspaceInfo()
  if (!info || !info.uri)
    return

  const uri = Uri.file(filename)
  const path = uri.toString()
  const relativePath = getRelativePath(path)
  if (!relativePath)
    return

  const localeFromLocale = parseLocaleFile(relativePath)
  const targetLocale = locale || settings.defaultLocale

  if (localeFromLocale) {
    const targetPath = Uri.joinPath(info.uri, ...settings.localeLocation, targetLocale, ...localeFromLocale.relativePathParts)
    Log.info(`Open locale file: ${targetPath.toString()}`)
    window.showTextDocument(targetPath, {
      viewColumn: pickTargetViewColumn(),
    })
    return
  }

  if (!isTargetFile(path))
    return

  if (!isInSrc(relativePath))
    return

  if (isExcluded(relativePath))
    return

  const relativePathList = relativePath.split(sep)
  relativePathList.shift()

  const lastIndex = relativePathList.length - 1
  const last = relativePathList[lastIndex]

  const fileExtList = last.split('.')
  fileExtList.pop()
  fileExtList.push('json')
  relativePathList[lastIndex] = fileExtList.join('.')

  const localeUri = getAbsoluteUri(settings.localeLocation)
  if (!localeUri)
    return

  const targetPath = Uri.joinPath(info.uri, ...settings.localeLocation, targetLocale, ...relativePathList)
  Log.info(`Open locale file: ${targetPath.toString()}`)
  window.showTextDocument(targetPath, {
    viewColumn: ViewColumn.Beside,
  })
}

export async function openSourceFile(filename: string) {
  const uri = Uri.file(filename)
  const sourceUri = await resolveSourceFromLocale(uri)
  if (!sourceUri) {
    window.showWarningMessage('Paired source file not found.')
    return
  }
  Log.info(`Open source file: ${sourceUri.toString()}`)
  window.showTextDocument(sourceUri, {
    viewColumn: pickTargetViewColumn(),
  })
}
