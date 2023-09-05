import { sep } from 'path'
import { type Disposable, SnippetString, Uri, commands, env, window, workspace } from 'vscode'
import { disposeSettingListener, getSettings, initialSetting } from './settings'
import { onCreateFile } from './create'
import { onRenameFile } from './rename'
import { onDeleteFile } from './delete'
import { Log } from './log'
import { openLocaleFile } from './openLocale'
import { getLocaleList, getRelativePath } from './utils'

let createListenerHandler: Disposable | undefined
let renameListenerHandler: Disposable | undefined
let deleteListenerHandler: Disposable | undefined

export function activate() {
  Log.info('i18n auto replace activated! ')
  initialSetting()

  commands.registerCommand('i18n-auto-replace.openSpecificLocaleFile', async (filename?: Uri) => {
    const { activeTextEditor } = window
    const localeList = await getLocaleList()

    if (localeList) {
      const locale = await window.showQuickPick(
        localeList,
        {
          canPickMany: false,
        },
      )
      if (filename) {
        Log.info(filename.path)
        openLocaleFile(filename.path, locale)
      }
      else if (activeTextEditor?.document?.fileName) {
        Log.info(activeTextEditor?.document?.fileName)
        openLocaleFile(activeTextEditor?.document?.fileName, locale)
      }
    }
  })

  commands.registerCommand('i18n-auto-replace.quickCreatePairedLocaleFile', async (filename?: Uri) => {
    const { activeTextEditor } = window
    if (filename)
      onCreateFile(filename)
    else if (activeTextEditor?.document?.fileName)
      onCreateFile(activeTextEditor.document.uri)
  })

  commands.registerCommand('i18n-auto-replace.openLocaleFile', (filename?: Uri) => {
    const { activeTextEditor } = window
    if (filename)
      openLocaleFile(filename.path)
    else if (activeTextEditor?.document?.fileName)
      openLocaleFile(activeTextEditor?.document?.fileName)
  })

  commands.registerCommand('i18n-auto-replace.copyRelativeKeyPath', (filename?: Uri) => {
    let path: false | string = false
    const { activeTextEditor } = window

    if (filename) {
      path = getRelativePath(filename.toString())
    }
    else {
      if (activeTextEditor?.document?.fileName) {
        const activeFileName = activeTextEditor?.document?.fileName
        const uri = Uri.file(activeFileName)

        const activePath = uri.toString()

        path = getRelativePath(activePath)
      }
    }

    if (!path)
      return

    const reduceSuffixPath = path.split('.')[0]

    const pathList = reduceSuffixPath.split(sep)

    if (pathList[0] === 'src') {
      const targetPathList = pathList.slice(1)
      const keyPath = targetPathList.join('.')

      if (filename) {
        Log.info(`[COPY PATH]: ${keyPath}`)
        env.clipboard.writeText(keyPath)
      }
      else {
        Log.info(`[INSERT PATH]: ${keyPath}`)
        activeTextEditor?.insertSnippet(new SnippetString(keyPath))
      }
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
