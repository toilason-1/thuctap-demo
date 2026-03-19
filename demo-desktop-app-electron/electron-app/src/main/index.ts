import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import archiver from 'archiver'

const isDev = process.env.NODE_ENV === 'development'

// ── Settings persistence (simple JSON file in userData) ──────────────────────
const settingsPath = path.join(app.getPath('userData'), 'settings.json')

function readGlobalSettings(): object {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
    }
  } catch {
    // ignore corrupt file
  }
  return {}
}

function writeGlobalSettings(data: object): void {
  fs.writeFileSync(settingsPath, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false // allow loading local file:// images
    },
    backgroundColor: '#0f1117'
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    // Updated to point to renderer dist per new code
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ── IPC Handlers ─────────────────────────────────────────────────────────────

// Get templates list from the templates folder
ipcMain.handle('get-templates', async () => {
  const templatesDir = isDev
    ? path.join(process.cwd(), 'templates')
    : path.join(process.resourcesPath, 'templates')

  if (!fs.existsSync(templatesDir)) return []

  const entries = fs.readdirSync(templatesDir, { withFileTypes: true })
  const templates = entries
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const metaPath = path.join(templatesDir, dir.name, 'meta.json')
      const htmlPath = path.join(templatesDir, dir.name, 'index.html')
      if (!fs.existsSync(metaPath) || !fs.existsSync(htmlPath)) return null
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
      return { id: dir.name, ...meta }
    })
    .filter(Boolean)

  return templates
})

// Returns: 'empty' | 'has-project' | 'non-empty'
ipcMain.handle('check-folder-status', async (_event, folderPath: string) => {
  if (!fs.existsSync(folderPath)) return 'empty'
  const entries = fs.readdirSync(folderPath)
  if (entries.length === 0) return 'empty'
  const projFile = path.join(folderPath, 'project.mgproj')
  if (fs.existsSync(projFile)) return 'has-project'
  return 'non-empty'
})

// Dialog: choose a folder to save project
ipcMain.handle('choose-project-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: 'Choose Project Save Location'
  })
  return result.canceled ? null : result.filePaths[0]
})

// Dialog: open an existing project file. filePath is optional: if provided, load that file directly (no dialog)
ipcMain.handle('open-project-file', async (_event, filePath?: string) => {
  let resolvedPath = filePath
  if (!resolvedPath) {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Minigame Project', extensions: ['mgproj'] }],
      title: 'Open Project'
    })
    if (result.canceled || !result.filePaths[0]) return null
    resolvedPath = result.filePaths[0]
  }
  const content = fs.readFileSync(resolvedPath, 'utf-8')
  return { filePath: resolvedPath, data: JSON.parse(content) }
})

// Save project JSON
ipcMain.handle('save-project', async (_event, projectData: object, projectPath: string) => {
  fs.writeFileSync(projectPath, JSON.stringify(projectData, null, 2), 'utf-8')
  return true
})

// Import an image into the project's assets folder, returns the relative asset path
// desiredName: entity id like "group-1" or "item-3" — image stored as "<desiredName><ext>"
ipcMain.handle(
  'import-image',
  async (_event, sourcePath: string, projectDir: string, desiredName: string) => {
    const assetsDir = path.join(projectDir, 'assets')
    fs.mkdirSync(assetsDir, { recursive: true })

    const ext = path.extname(sourcePath).toLowerCase()
    const destName = `${desiredName}${ext}`
    const destPath = path.join(assetsDir, destName)

    fs.copyFileSync(sourcePath, destPath)
    // Return relative path from project dir (not from index.html which will be in project root)
    return `assets/${destName}`
  }
)

// Open system file picker for images
ipcMain.handle('pick-image', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'] }],
    title: 'Select Image'
  })
  return result.canceled ? null : result.filePaths[0]
})

// Resolve a project-relative asset path to an absolute file:// URL for display
ipcMain.handle('resolve-asset-url', async (_event, projectDir: string, relativePath: string) => {
  const abs = path.join(projectDir, relativePath)
  return `file://${abs.replace(/\\/g, '/')}`
})

// ── Settings IPC ──────────────────────────────────────────────────────────────
ipcMain.handle('settings-read-global', async () => readGlobalSettings())
ipcMain.handle('settings-write-global', async (_event, data: object) => {
  writeGlobalSettings(data)
  return true
})

// ── Export project → either folder or zip ─────────────────────────────────────
ipcMain.handle(
  'export-project',
  async (
    _event,
    opts: {
      templateId: string
      appData: object
      projectDir: string
      mode: 'folder' | 'zip'
    }
  ) => {
    const { templateId, appData, projectDir, mode } = opts

    const templatesDir = isDev
      ? path.join(process.cwd(), 'templates')
      : path.join(process.resourcesPath, 'templates')

    const templateHtml = path.join(templatesDir, templateId, 'index.html')
    if (!fs.existsSync(templateHtml)) {
      throw new Error(`Template HTML not found for: ${templateId}`)
    }

    const htmlContent = fs.readFileSync(templateHtml, 'utf-8')
    const injectedHtml = injectAppData(htmlContent, appData)

    if (mode === 'folder') {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose Export Destination'
      })
      if (result.canceled) return { canceled: true }

      const destDir = result.filePaths[0]
      await exportToFolder(injectedHtml, projectDir, destDir)
      shell.openPath(destDir)
      return { success: true, path: destDir }
    } else {
      const result = await dialog.showSaveDialog({
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }],
        defaultPath: 'game-export.zip',
        title: 'Save Export ZIP'
      })
      if (result.canceled) return { canceled: true }

      await exportToZip(injectedHtml, projectDir, result.filePath!)
      shell.showItemInFolder(result.filePath!)
      return { success: true, path: result.filePath }
    }
  }
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * OLD CODE VERSION KEPT: Injects app data before the first script tag
 * to ensure compatibility with specific project requirements.
 */
function injectAppData(html: string, appData: object): string {
  const scriptTag = `<script>window.APP_DATA = ${JSON.stringify(appData)};window.MY_APP_DATA=window.APP_DATA</script>`
  // // Inject just before </head> if present, otherwise before </body>, otherwise prepend
  // if (html.includes('</head>')) {
  //   return html.replace('</head>', `${scriptTag}\n</head>`)
  // } else if (html.includes('</body>')) {
  //   return html.replace('</body>', `${scriptTag}\n</body>`)
  // }
  // return scriptTag + '\n' + html

  // Insert before the first <script> tag (your bundle)
  return html.replace(/<script/, scriptTag + '\n<script')
}

async function exportToFolder(
  injectedHtml: string,
  projectDir: string,
  destDir: string
): Promise<void> {
  // Write index.html
  fs.writeFileSync(path.join(destDir, 'index.html'), injectedHtml, 'utf-8')

  // Copy assets folder if it exists
  const assetsDir = path.join(projectDir, 'assets')
  if (fs.existsSync(assetsDir)) {
    copyDirSync(assetsDir, path.join(destDir, 'assets'))
  }
}

function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true })
  const entries = fs.readdirSync(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

async function exportToZip(
  injectedHtml: string,
  projectDir: string,
  zipPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', resolve)
    archive.on('error', reject)
    archive.pipe(output)

    // Add index.html from memory
    archive.append(injectedHtml, { name: 'index.html' })

    // Add assets folder
    const assetsDir = path.join(projectDir, 'assets')
    if (fs.existsSync(assetsDir)) {
      archive.directory(assetsDir, 'assets')
    }

    archive.finalize()
  })
}
