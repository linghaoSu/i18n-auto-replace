import { sep } from 'path'
import { type Disposable, type Uri, commands, env, window, workspace } from 'vscode'
import { disposeSettingListener, getSettings, initialSetting } from './settings'
import { onCreateFile } from './create'
import { onRenameFile } from './rename'
import { onDeleteFile } from './delete'
import { Log } from './log'
import { openLocaleFile } from './openLocale'
import { getRelativePath } from './utils'

let createListenerHandler: Disposable | undefined
let renameListenerHandler: Disposable | undefined
let deleteListenerHandler: Disposable | undefined

export function activate() {
  Log.info('i18n auto replace activated! ')
  initialSetting()

  commands.registerCommand('i18n-auto-replace.openLocaleFile', () => {
    const { activeTextEditor } = window
    if (activeTextEditor?.document?.fileName)
      openLocaleFile(activeTextEditor?.document?.fileName)
  })

  commands.registerCommand('i18n-auto-replace.copyRelativeKeyPath', (filename: Uri) => {
    const path = getRelativePath(filename.toString())
    if (!path)
      return

    const reduceSuffixPath = path.split('.')[0]

    const pathList = reduceSuffixPath.split(sep)

    if (pathList[0] === 'src') {
      const targetPathList = pathList.slice(1)
      const keyPath = targetPathList.join('.')
      Log.info(`[COPY PATH]: ${keyPath}`)
      env.clipboard.writeText(keyPath)
    }
    else {
      Log.warn('[COPY PATH]: not in src dir')
    }
  })
  // only support single workspace for now

  createListenerHandler = workspace.onDidCreateFiles((e) => {
    const { files } = e
    files.forEach(item => onCreateFile(item))
  })

  renameListenerHandler = workspace.onDidRenameFiles((e) => {
    const { files } = e
    files.forEach(item => onRenameFile(item.oldUri, item.newUri))
  })

  deleteListenerHandler = workspace.onDidDeleteFiles((e) => {
    const { files } = e
    const { enableDelete } = getSettings()
    if (enableDelete)
      files.forEach(item => onDeleteFile(item))
  })
}

export function deactivate() {
  disposeSettingListener()

  renameListenerHandler?.dispose()
  renameListenerHandler = undefined

  createListenerHandler?.dispose()
  createListenerHandler = undefined

  deleteListenerHandler?.dispose()
  deleteListenerHandler = undefined
  Log.info('i18n auto replace deactivate! ')
}
