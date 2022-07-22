import { type Disposable, commands, window, workspace } from 'vscode'
import { disposeSettingListener, getSettings, initialSetting } from './settings'
import { onCreateFile } from './create'
import { onRenameFile } from './rename'
import { onDeleteFile } from './delete'
import { Log } from './log'
import { openLocaleFile } from './openLocale'

let createListenerHandler: Disposable | undefined
let renameListenerHandler: Disposable | undefined
let deleteListenerHandler: Disposable | undefined

export function activate() {
  Log.info('i18n auto replace activated! ')
  initialSetting()

  commands.registerCommand('extension.openLocaleFile', () => {
    const { activeTextEditor } = window
    if (activeTextEditor?.document?.fileName)
      openLocaleFile(activeTextEditor?.document?.fileName)
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
