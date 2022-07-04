import { sep } from 'path'
import { Uri, workspace } from 'vscode'
import { Log } from './log'
import { getSettings } from './settings'
import { getAbsoluteUri, getRelativePath, getWorkspaceInfo } from './utils'

const { fs } = workspace
const { readDirectory, readFile, rename, writeFile } = fs

export async function onRenameFile(oldUri: Uri, newUri: Uri) {
  const settings = getSettings()

  const info = getWorkspaceInfo()

  if (!info)
    return
  // 4. rename old locale file name to new locale file name

  const oldUriRelativePath = getRelativePath(oldUri.toString())
  const newUriRelativePath = getRelativePath(newUri.toString())

  if (!oldUriRelativePath || !newUriRelativePath)
    return

  // 1. get old locale path in file
  const oldUriRelativePathList = oldUriRelativePath.split(sep)
  const newUriRelativePathList = newUriRelativePath.split(sep)

  oldUriRelativePathList.shift()
  newUriRelativePathList.shift()

  const oldLocaleKeyPath = oldUriRelativePathList.join('.').split('.').slice(0, -1).join('.')
  const newLocaleKeyPath = newUriRelativePathList.join('.').split('.').slice(0, -1).join('.')

  const fileContentBuffer = await readFile(newUri)
  const fileContentStr = fileContentBuffer.toString()

  // 2. replace old locale path with new locale path
  const newFileContentStr = fileContentStr.replaceAll(oldLocaleKeyPath, newLocaleKeyPath)

  // no need to wait write finish
  writeFile(newUri, Buffer.from(newFileContentStr))

  // 3. get old locale file

  if (!info.uri)
    return

  const localeUri = getAbsoluteUri(settings.localeLocation)
  if (!localeUri)
    return

  const localesDirs = await readDirectory(localeUri)

  localesDirs.forEach((dir) => {
    if (info.uri) {
      const oldLastIndex = oldUriRelativePathList.length - 1
      const oldLast = oldUriRelativePathList[oldLastIndex]

      const oldFileExtList = oldLast.split('.')
      oldFileExtList.pop()
      oldFileExtList.push('json')
      oldUriRelativePathList[oldLastIndex] = oldFileExtList.join('.')

      const oldLocaleFileUri = Uri.joinPath(info.uri, ...settings.localeLocation, dir[0], ...oldUriRelativePathList)

      const newLastIndex = newUriRelativePathList.length - 1
      const newLast = newUriRelativePathList[newLastIndex]

      const newFileExtList = newLast.split('.')
      newFileExtList.pop()
      newFileExtList.push('json')
      newUriRelativePathList[newLastIndex] = newFileExtList.join('.')

      const newLocaleFileUri = Uri.joinPath(info.uri, ...settings.localeLocation, dir[0], ...newUriRelativePathList)

      rename(oldLocaleFileUri, newLocaleFileUri).then(() => {

      }, () => {
        Log.error({
          name: 'RENAME -> ',
          message: `from ${oldLocaleFileUri.toString()} to ${newLocaleFileUri.toString()} Failed.`,
        })
      })
    }
  })
}
