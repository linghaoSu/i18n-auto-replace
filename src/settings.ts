import { sep } from 'path'
import { type Disposable, window, workspace } from 'vscode'
import { getWorkspaceInfo } from './utils'

const PLUGIN_SCOPE = 'i18n-auto-replace'
const LOCALE_PATH_KEY = 'localePath'
const EXT_KEY = 'ext'
const ENABLE_DELETE_KEY = 'enableDelete'
const SRC_PATH_KEY = 'srcPath'
const DEFAULT_LOCALE = 'defaultLocale'

interface ReplaceSettings {
  localePath: string[]
  ext: string[]
  enableDelete: boolean
  srcPath: string[]
  defaultLocale: string
}

const replaceSettings: ReplaceSettings = {
  localePath: ['src', 'locales'],
  ext: ['vue'],
  enableDelete: false,
  srcPath: ['src'],
  defaultLocale: 'zh-CN',
}

const usedSettings = {
  extRegex: new RegExp(`.*(\.(${replaceSettings.ext.join('|')}))$`),
  srcLocation: replaceSettings.srcPath.join(sep),
  localeLocation: replaceSettings.localePath,
  enableDelete: replaceSettings.enableDelete,
  defaultLocale: replaceSettings.defaultLocale,
}

// .*(\.(vue|ts))$
export function updateSettings() {
  const info = getWorkspaceInfo()
  if (!info)
    return
  const settings = workspace.getConfiguration(
    PLUGIN_SCOPE,
  )

  replaceSettings.localePath = settings.get(LOCALE_PATH_KEY, ['src', 'locales'])
  replaceSettings.ext = settings.get(EXT_KEY, ['vue'])
  replaceSettings.enableDelete = settings.get(ENABLE_DELETE_KEY, false)
  replaceSettings.srcPath = settings.get(SRC_PATH_KEY, ['src'])
  replaceSettings.defaultLocale = settings.get(DEFAULT_LOCALE, 'zh-CN')

  applySettings()
}

function applySettings() {
  Object.assign(usedSettings, {
    extRegex: new RegExp(`.*(\.(${replaceSettings.ext.join('|')}))$`),
    srcLocation: replaceSettings.srcPath.join(sep),
    localeLocation: replaceSettings.localePath,
    enableDelete: replaceSettings.enableDelete,
    DEFAULT_LOCALE: replaceSettings.defaultLocale,
  })
}

let disposeHandler: Disposable | undefined

export function initialSetting() {
  updateSettings()

  if (disposeHandler)
    disposeSettingListener()

  disposeHandler = workspace.onDidChangeConfiguration(async (e) => {
    const isChanged = await e.affectsConfiguration(PLUGIN_SCOPE)

    if (isChanged) {
      window.showInformationMessage('changed!')
      updateSettings()
    }
  })
}

export function disposeSettingListener() {
  if (disposeHandler) {
    disposeHandler.dispose()
    disposeHandler = undefined
  }
}

export function getSettings() {
  return usedSettings
}
