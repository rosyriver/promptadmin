export {};

declare global {
  interface Window {
    electronAPI?: {
      platform: string;
      saveMedia: (key: string, file: File, mediaType: string) => Promise<string>;
      getMediaPath: (key: string) => Promise<string | null>;
      deleteMedia: (key: string) => Promise<void>;
      getSettings: () => Promise<Record<string, string>>;
      setSetting: (key: string, value: string) => Promise<void>;
      openFolderDialog: () => Promise<string | null>;
      getUserDataPath: () => Promise<string>;
      saveMediaFromBase64: (key: string, base64: string) => Promise<void>;
      openFolder: (path: string) => Promise<void>;
      organizeFile: (oldKey: string, mediaType: string) => Promise<string | null>;
      readFileAsBase64: (key: string) => Promise<{ data: string; name: string; size: number } | null>;
      saveFile: (defaultName: string, content: string) => Promise<string | null>;
    };
  }
}
