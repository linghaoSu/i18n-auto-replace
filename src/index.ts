import type { Disposable, Uri } from 'vscode'
import { commands, window, workspace } from 'vscode'
import { copyRelativeKeyPath } from './commands/copyRelativeKeyPath'
import { openLocaleFile, openSourceFile } from './commands/openLocale'
import { registerPresetLocaleCommands } from './commands/openPresetLocale'
import { Log } from './log'
import { disposeSettingListener, getSettings, initialSetting } from './settings'
import { getPairedLocales, isLocaleFile, isMenuTargetFile } from './utils'
import { onCreateFile } from './watchers/onCreateFile'
import { onDeleteFile } from './watchers/onDeleteFile'
import { onRenameFile } from './watchers/onRenameFile'

const TARGET_FILE_CONTEXT_KEY = 'i18nAutoReplace.isTargetFile'
const LOCALE_FILE_CONTEXT_KEY = 'i18nAutoReplace.isLocaleFile'

let createListenerHandler: Disposable | undefined
let renameListenerHandler: Disposable | undefined
let deleteListenerHandler: Disposable | undefined
let activeEditorListenerHandler: Disposable | undefined
let configChangeListenerHandler: Disposable | undefined

function updateEditorContexts() {
  const editor = window.activeTextEditor
  const uri = editor?.document.uri
  const isTarget = uri ? isMenuTargetFile(uri) : false
  const isLocale = uri ? isLocaleFile(uri) : false
  commands.executeCommand('setContext', TARGET_FILE_CONTEXT_KEY, isTarget)
  commands.executeCommand('setContext', LOCALE_FILE_CONTEXT_KEY, isLocale)
}

export function activate() {
  Log.info('i18n auto replace activated! ')
  initialSetting()

  commands.registerCommand('i18n-auto-replace.openSpecificLocaleFile', async (filename?: Uri) => {
    const { activeTextEditor } = window
    const sourceUri = filename ?? activeTextEditor?.document?.uri
    if (!sourceUri)
      return

    const localeList = await getPairedLocales(sourceUri)
    if (!localeList.length) {
      window.showWarningMessage('No paired locale files found for this file.')
      return
    }

    const locale = await window.showQuickPick(
      localeList,
      {
        canPickMany: false,
      },
    )
    if (!locale)
      return

    if (filename) {
      Log.info(filename.path)
      openLocaleFile(filename.path, locale)
    }
    else if (activeTextEditor?.document?.fileName) {
      Log.info(activeTextEditor?.document?.fileName)
      openLocaleFile(activeTextEditor?.document?.fileName, locale)
    }
  })

  commands.registerCommand('i18n-auto-replace.openSourceFile', (filename?: Uri) => {
    const { activeTextEditor } = window
    if (filename)
      openSourceFile(filename.path)
    else if (activeTextEditor?.document?.fileName)
      openSourceFile(activeTextEditor.document.fileName)
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
    copyRelativeKeyPath(filename)
  })

  registerPresetLocaleCommands()

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

  activeEditorListenerHandler = window.onDidChangeActiveTextEditor(() => {
    updateEditorContexts()
  })

  configChangeListenerHandler = workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('i18n-auto-replace'))
      updateEditorContexts()
  })

  updateEditorContexts()
}

export function deactivate() {
  disposeSettingListener()

  renameListenerHandler?.dispose()
  renameListenerHandler = undefined

  createListenerHandler?.dispose()
  createListenerHandler = undefined

  deleteListenerHandler?.dispose()
  deleteListenerHandler = undefined

  activeEditorListenerHandler?.dispose()
  activeEditorListenerHandler = undefined

  configChangeListenerHandler?.dispose()
  configChangeListenerHandler = undefined

  commands.executeCommand('setContext', TARGET_FILE_CONTEXT_KEY, false)
  commands.executeCommand('setContext', LOCALE_FILE_CONTEXT_KEY, false)

  Log.info('i18n auto replace deactivate! ')
}
