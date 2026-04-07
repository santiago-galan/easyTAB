import { contextBridge, ipcRenderer } from "electron";

export interface SaveFileResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

export interface OpenFileResult {
  success: boolean;
  content?: string;
  error?: string;
}

contextBridge.exposeInMainWorld("electronAPI", {
  saveFile: (defaultName: string, content: string): Promise<SaveFileResult> =>
    ipcRenderer.invoke("dialog:saveFile", { defaultName, content }),

  openFile: (): Promise<OpenFileResult> =>
    ipcRenderer.invoke("dialog:openFile"),
});
