import { sep } from 'path'
import { Uri, ViewColumn, window } from 'vscode'
import { Log } from './log'
import { getSettings } from './settings'
import { getAbsoluteUri, getRelativePath, getWorkspaceInfo, isInSrc, isTargetFile } from './utils'

// get relative path
// is in src dir?
// is a target file?
// get corresponding locale path
// create dir recursively
// is file exist already? yes create noty and exit, no to next step
// create empty json
// write json

export async function openLocaleFile(filename: string, locale?: string) {
  const settings = getSettings()

  const uri = Uri.file(filename)

  const path = uri.toString()
  if (!isTargetFile(path))
    return

  const info = getWorkspaceInfo()

  if (!info)
    return
  const relativePath = getRelativePath(path)

  if (!relativePath)
    return

  if (!isInSrc(relativePath))
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

  const localesDirs = locale || settings.defaultLocale

  if (info.uri) {
    const targetPath = Uri.joinPath(info.uri, ...settings.localeLocation, localesDirs, ...relativePathList)
    Log.info(`Open locale file: ${targetPath.toString()}`)
    window.showTextDocument(targetPath, {
      viewColumn: ViewColumn.Beside,
    })
  }
}
