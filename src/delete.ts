import { sep } from 'path'
import { Uri, workspace } from 'vscode'
import { getSettings } from './settings'
import { getAbsoluteUri, getRelativePath, getWorkspaceInfo, isInSrc, isTargetFile } from './utils'

const { fs } = workspace
const { readDirectory, delete: deleteFile } = fs

export async function onDeleteFile(uri: Uri) {
  const settings = getSettings()

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

  const localesDirs = await readDirectory(localeUri)

  localesDirs.forEach((dir) => {
    if (info.uri) {
      const targetPath = Uri.joinPath(info.uri, ...settings.localeLocation, dir[0], ...relativePathList)
      deleteFile(targetPath)
    }
  })
}
