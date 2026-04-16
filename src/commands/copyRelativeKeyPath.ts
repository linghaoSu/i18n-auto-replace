import { sep } from 'node:path'
import { env, SnippetString, Uri, window } from 'vscode'
import { Log } from '../log'
import { getRelativePath } from '../utils'

export function copyRelativeKeyPath(filename?: Uri) {
  const { activeTextEditor } = window
  let path: false | string = false

  if (filename) {
    path = getRelativePath(filename.toString())
  }
  else if (activeTextEditor?.document?.fileName) {
    const uri = Uri.file(activeTextEditor.document.fileName)
    path = getRelativePath(uri.toString())
  }

  if (!path)
    return

  const reduceSuffixPath = path.split('.')[0]
  const pathList = reduceSuffixPath.split(sep)

  if (pathList[0] !== 'src') {
    Log.warn('[COPY PATH]: not in src dir')
    return
  }

  const keyPath = pathList.slice(1).join('.')

  if (filename) {
    Log.info(`[COPY PATH]: ${keyPath}`)
    env.clipboard.writeText(keyPath)
  }
  else {
    Log.info(`[INSERT PATH]: ${keyPath}`)
    activeTextEditor?.insertSnippet(new SnippetString(keyPath))
  }
}
