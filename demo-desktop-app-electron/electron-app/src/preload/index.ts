import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Templates
  getTemplates: () => ipcRenderer.invoke('get-templates'),

  // Folder / project management
  checkFolderStatus: (folderPath: string) => ipcRenderer.invoke('check-folder-status', folderPath),
  chooseProjectFolder: () => ipcRenderer.invoke('choose-project-folder'),
  openProjectFile: (filePath?: string) => ipcRenderer.invoke('open-project-file', filePath),
  saveProject: (data: object, projectPath: string) =>
    ipcRenderer.invoke('save-project', data, projectPath),

  // Assets — desiredName is the entity id (e.g. "group-1")
  pickImage: () => ipcRenderer.invoke('pick-image'),
  importImage: (sourcePath: string, projectDir: string, desiredName: string) =>
    ipcRenderer.invoke('import-image', sourcePath, projectDir, desiredName),
  resolveAssetUrl: (projectDir: string, relativePath: string) =>
    ipcRenderer.invoke('resolve-asset-url', projectDir, relativePath),

  // Settings
  settingsReadGlobal: () => ipcRenderer.invoke('settings-read-global'),
  settingsWriteGlobal: (data: object) => ipcRenderer.invoke('settings-write-global', data),

  // Export
  exportProject: (opts: {
    templateId: string
    appData: object
    projectDir: string
    mode: 'folder' | 'zip'
  }) => ipcRenderer.invoke('export-project', opts)
})
