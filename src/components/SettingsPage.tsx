import React, { useState, useEffect } from 'react';

export interface StoreSettings {
    storeName: string;
}

const STORAGE_KEY = 'host-club-settings';
const DEFAULT_SETTINGS: StoreSettings = {
    storeName: 'GENTLY DIVA',
};

export function loadSettings(): StoreSettings {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings: StoreSettings) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsPageProps {
    settings: StoreSettings;
    onSettingsChange: (settings: StoreSettings) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ settings, onSettingsChange }) => {
    const [storeName, setStoreName] = useState(settings.storeName);

    useEffect(() => {
        setStoreName(settings.storeName);
    }, [settings.storeName]);

    const handleSave = () => {
        const newSettings = { ...settings, storeName };
        saveSettings(newSettings);
        onSettingsChange(newSettings);
    };

    const handleReset = () => {
        setStoreName(DEFAULT_SETTINGS.storeName);
        saveSettings(DEFAULT_SETTINGS);
        onSettingsChange(DEFAULT_SETTINGS);
    };

    return (
        <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold text-[var(--gold-color)] flex items-center gap-2">
                ⚙️ 設定
            </h2>

            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[rgba(255,215,0,0.08)] to-transparent">
                    <h3 className="text-base font-bold text-[var(--gold-color)]">店舗情報</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">店舗名</label>
                        <input
                            type="text"
                            value={storeName}
                            onChange={(e) => setStoreName(e.target.value)}
                            placeholder="店舗名を入力"
                            className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-lg outline-none focus:border-[var(--gold-color)] transition-colors"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            className="flex-1 p-3 rounded-lg bg-[var(--gold-color)] text-black font-bold text-base border-none cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                        >
                            保存
                        </button>
                        <button
                            onClick={handleReset}
                            className="px-4 py-3 rounded-lg bg-transparent border border-[var(--border-color)] text-gray-400 font-bold text-sm cursor-pointer hover:border-gray-400 hover:text-white transition-colors"
                        >
                            初期値に戻す
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
