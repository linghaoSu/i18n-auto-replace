import { sep } from 'path'
import { Uri, workspace } from 'vscode'
import { getSettings } from './settings'
import { emptyJSONContent, getAbsoluteUri, getRelativePath, getWorkspaceInfo, isInSrc, isTargetFile } from './utils'

const { fs } = workspace
const { readDirectory, writeFile, readFile } = fs

// get relative path
// is in src dir?
// is a target file?
// get corresponding locale path
// create dir recursively
// is file exist already? yes create noty and exit, no to next step
// create empty json
// write json

export async function onCreateFile(uri: Uri) {
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

      readFile(targetPath).then(() => { }, () => {
        writeFile(targetPath, Buffer.from(emptyJSONContent))
      })
    }
  })
}
