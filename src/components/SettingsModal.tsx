import React, { useState } from 'react';
import { Modal, Input, Switch } from 'antd';
import { Settings, User, HardDrive, Shield } from 'lucide-react';
import { saveDeviceName } from '../utils/device';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceName: string;
  autoDownload: boolean;
  onUpdateDeviceName: (name: string) => void;
  onToggleAutoDownload: (v: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  deviceName,
  autoDownload,
  onUpdateDeviceName,
  onToggleAutoDownload,
}: SettingsModalProps) {
  const [localName, setLocalName] = useState(deviceName);

  const handleSave = () => {
    const trimmed = localName.trim();
    if (trimmed) {
      onUpdateDeviceName(trimmed);
      saveDeviceName(trimmed);
    }
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save"
      okButtonProps={{ className: '!bg-blue-600 !border-none hover:!bg-blue-700' }}
      centered
      width={420}
      title={
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
          <Settings className="w-4 h-4 text-blue-500" />
          <span className="font-bold text-sm">Settings</span>
        </div>
      }
    >
      <div className="space-y-5 pt-2">
        {/* Device Name */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-2">
            <User className="w-3.5 h-3.5" />
            Device Name
          </label>
          <Input
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            placeholder="e.g. Prince's MacBook"
            className="rounded-lg text-sm font-medium"
            maxLength={40}
          />
          <p className="text-[11px] text-zinc-400 mt-1.5">
            This is how your device appears to other users on the network.
          </p>
        </div>

        {/* Auto-download */}
        <div className="flex items-center justify-between py-3 border-t border-zinc-100 dark:border-zinc-800">
          <div>
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Auto-download files</p>
            <p className="text-[11px] text-zinc-400 mt-0.5">Automatically save received files to your downloads folder</p>
          </div>
          <Switch checked={autoDownload} onChange={onToggleAutoDownload} />
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50">
          <Shield className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[11px] text-blue-700 dark:text-blue-300 leading-relaxed">
            Files transfer directly between devices using WebRTC. Nothing is stored on our servers.
          </p>
        </div>
      </div>
    </Modal>
  );
}
