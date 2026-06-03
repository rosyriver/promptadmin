import { useState, useEffect } from 'react';
import { X, FolderOpen, Trash2, Download, HardDrive } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  onClearAll: () => void;
  onExport: () => void;
  totalCases: number;
}

export function SettingsDialog({ open, onClose, onClearAll, onExport, totalCases }: SettingsDialogProps) {
  const [mediaPath, setMediaPath] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const isElectron = !!window.electronAPI;

  useEffect(() => {
    if (open && isElectron) {
      window.electronAPI!.getSettings().then(s => {
        setMediaPath(s.mediaPath || '');
      });
    }
  }, [open, isElectron]);

  const handleChooseFolder = async () => {
    if (!isElectron) return;
    const folder = await window.electronAPI!.openFolderDialog();
    if (folder) {
      await window.electronAPI!.setSetting('mediaPath', folder);
      setMediaPath(folder);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-[480px] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E4E7]">
          <h2 className="text-base font-semibold text-[#18181B]">设置</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#F4F4F5] transition-colors">
            <X size={18} className="text-[#A1A1AA]" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {isElectron && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <HardDrive size={16} className="text-[#71717A]" />
                <h3 className="text-sm font-medium text-[#18181B]">媒体存储</h3>
              </div>
              <div className="bg-[#FAFAF8] rounded-xl p-4 space-y-3">
                <div>
                  <p className="text-xs text-[#A1A1AA] mb-1">当前存储位置</p>
                  <p className="text-xs text-[#52525B] break-all font-mono">{mediaPath}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleChooseFolder}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
                  >
                    <FolderOpen size={13} />
                    更改目录
                  </button>
                  <button
                    onClick={() => window.electronAPI?.openFolder(mediaPath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
                  >
                    <FolderOpen size={13} />
                    打开文件夹
                  </button>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Download size={16} className="text-[#71717A]" />
              <h3 className="text-sm font-medium text-[#18181B]">数据管理</h3>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-[#A1A1AA]">
                当前共收录 <span className="text-[#52525B] font-medium">{totalCases}</span> 个 Prompt Case
              </p>

              <div className="flex gap-2">
                <button
                  onClick={onExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
                >
                  <Download size={13} />
                  导出元数据
                </button>
                {showClearConfirm ? (
                  <>
                    <button
                      onClick={() => { onClearAll(); setShowClearConfirm(false); onClose(); }}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      确认清空
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1.5 text-xs border border-[#E4E4E7] rounded-lg hover:bg-[#F4F4F5] transition-colors"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                    清空所有数据
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
