import type { Uri } from 'vscode'
import { commands, window } from 'vscode'
import { Log } from '../log'
import { getPairedLocales } from '../utils'
import { openLocaleFile } from './openLocale'

export const PRESET_LOCALES = ['en-US', 'zh-CN', 'ja'] as const

export function presetLocaleCommandId(locale: string) {
  return `i18n-auto-replace.openLocale.${locale}`
}

export function registerPresetLocaleCommands() {
  return PRESET_LOCALES.map((locale) => {
    return commands.registerCommand(presetLocaleCommandId(locale), async (filename?: Uri) => {
      const { activeTextEditor } = window
      const uri = filename ?? activeTextEditor?.document?.uri
      if (!uri)
        return

      const available = await getPairedLocales(uri)
      if (!available.includes(locale)) {
        window.showWarningMessage(`No "${locale}" locale file found for this file.`)
        return
      }

      const pathStr = filename?.path ?? activeTextEditor?.document?.fileName
      if (!pathStr)
        return

      Log.info(`Open preset locale: ${locale}`)
      openLocaleFile(pathStr, locale)
    })
  })
}
