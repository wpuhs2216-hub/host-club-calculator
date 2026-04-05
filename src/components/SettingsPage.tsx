import React, { useState } from 'react';
import { useStoreConfig } from '../contexts/StoreConfigContext';
import { StoreSelector } from './settings/StoreSelector';
import { PricingSettings } from './settings/PricingSettings';
import { MenuSettings } from './settings/MenuSettings';
import { RulesSettings } from './settings/RulesSettings';
import { TableSettings } from './settings/TableSettings';
import { VERSION_HISTORY } from '../version';

const ADMIN_PASSWORD = 'diva3030';

type SettingsTab = 'store' | 'pricing' | 'menu' | 'rules' | 'tables' | 'debug';

interface SettingsPageProps {
    isDebugMode?: boolean;
    currentTime?: string;
    onDebugModeToggle?: () => void;
    onCurrentTimeChange?: (time: string) => void;
    showLO: boolean;
    onShowLOChange: (v: boolean) => void;
    showAIDetail: boolean;
    onShowAIDetailChange: (v: boolean) => void;
    loDisplayMode?: 'sidebar' | 'tab';
    onLoDisplayModeChange?: (v: 'sidebar' | 'tab') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
    isDebugMode, currentTime, onDebugModeToggle, onCurrentTimeChange,
    showLO, onShowLOChange, showAIDetail, onShowAIDetailChange,
    loDisplayMode, onLoDisplayModeChange,
}) => {
    const { config, registry, setActiveStore, updateStoreConfig, addStore, deleteStore } = useStoreConfig();
    const [activeTab, setActiveTab] = useState<SettingsTab>('store');
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState(false);
    const [expandedVersion, setExpandedVersion] = useState<string | null>(VERSION_HISTORY[0]?.version ?? null);

    const handleUnlock = () => {
        if (passwordInput === ADMIN_PASSWORD) {
            setIsUnlocked(true);
            setPasswordError(false);
        } else {
            setPasswordError(true);
        }
    };

    const tabs: { id: SettingsTab; label: string }[] = [
        { id: 'store', label: '店舗' },
        { id: 'pricing', label: '料金' },
        { id: 'menu', label: 'メニュー' },
        { id: 'rules', label: 'ルール' },
        { id: 'tables', label: 'テーブル' },
        { id: 'debug', label: '開発' },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-xl font-bold text-[var(--gold-color)] flex items-center gap-2">
                ◉ 設定
            </h2>

            {/* 店舗切替（パスワード不要） */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">店舗切替</h3>
                <div className="flex gap-2 flex-wrap">
                    {registry.stores.map(store => (
                        <button
                            key={store.id}
                            onClick={() => setActiveStore(store.id)}
                            className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all border cursor-pointer ${
                                store.id === config.id
                                    ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                                    : 'bg-[var(--input-bg)] text-white border-[var(--border-color)] hover:border-gray-400'
                            }`}
                        >
                            {store.storeName}
                        </button>
                    ))}
                </div>
            </div>

            {/* 管理者モード */}
            {!isUnlocked ? (
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
                    <div className="text-center mb-4">
                        <div className="text-3xl mb-2">◎</div>
                        <div className="text-sm text-gray-400">管理者パスワードを入力してください</div>
                    </div>
                    <div className="flex gap-2 max-w-xs mx-auto">
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            placeholder="パスワード"
                            className={`flex-1 p-3 rounded-lg border bg-[var(--input-bg)] text-white outline-none text-center ${
                                passwordError ? 'border-red-500' : 'border-[var(--border-color)] focus:border-[var(--gold-color)]'
                            }`}
                        />
                        <button onClick={handleUnlock}
                            className="px-5 py-3 rounded-lg bg-[var(--gold-color)] text-black font-bold border-none cursor-pointer">解除</button>
                    </div>
                    {passwordError && (
                        <div className="text-red-400 text-sm text-center mt-2">パスワードが違います</div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex border border-[var(--border-color)] rounded-xl overflow-hidden">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 py-2.5 text-sm font-bold transition-colors border-none cursor-pointer outline-none ${
                                    activeTab === tab.id ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
                                }`}
                            >{tab.label}</button>
                        ))}
                    </div>

                    {activeTab === 'store' && (
                        <StoreSelector config={config} registry={registry}
                            onSetActive={setActiveStore} onAdd={addStore} onDelete={deleteStore}
                            onUpdate={(updater) => updateStoreConfig(config.id, updater)} />
                    )}
                    {activeTab === 'pricing' && (
                        <PricingSettings config={config} onUpdate={(updater) => updateStoreConfig(config.id, updater)} />
                    )}
                    {activeTab === 'menu' && (
                        <MenuSettings config={config} onUpdate={(updater) => updateStoreConfig(config.id, updater)} />
                    )}
                    {activeTab === 'rules' && (
                        <RulesSettings config={config} onUpdate={(updater) => updateStoreConfig(config.id, updater)} />
                    )}
                    {activeTab === 'tables' && (
                        <TableSettings config={config} onUpdate={(updater) => updateStoreConfig(config.id, updater)} />
                    )}
                    {activeTab === 'debug' && (
                        <div className="flex flex-col gap-4">
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">機能表示</h3>
                                <ToggleRow label="運営モード" checked={showLO} onChange={onShowLOChange} />
                                <ToggleRow label="AI予算プランナーの詳細表示" checked={showAIDetail} onChange={onShowAIDetailChange} />
                                {showLO && onLoDisplayModeChange && (
                                    <div className="mt-2">
                                        <label className="block mb-2 text-sm text-gray-400">LO一覧の表示方法</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onLoDisplayModeChange('sidebar')}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                                                    loDisplayMode === 'sidebar' ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-[var(--input-bg)] text-white border-[var(--border-color)]'
                                                }`}
                                            >サイドバー</button>
                                            <button
                                                onClick={() => onLoDisplayModeChange('tab')}
                                                className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                                                    loDisplayMode === 'tab' ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-[var(--input-bg)] text-white border-[var(--border-color)]'
                                                }`}
                                            >タブ表示</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">時間設定</h3>
                                <ToggleRow label="時間指定モード" checked={isDebugMode ?? false} onChange={() => onDebugModeToggle?.()} />
                                {isDebugMode && onCurrentTimeChange && (
                                    <div className="mt-3">
                                        <label className="block mb-2 text-sm text-gray-400">指定時間</label>
                                        <input type="time" value={currentTime ?? '20:00'}
                                            onChange={(e) => onCurrentTimeChange(e.target.value)}
                                            className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-base outline-none [color-scheme:dark]" />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <button onClick={() => { setIsUnlocked(false); setPasswordInput(''); }}
                        className="text-sm text-gray-500 hover:text-gray-300 bg-transparent border-none cursor-pointer self-center mt-2">
                        ◎ 管理者モードをロック
                    </button>
                </>
            )}

            {/* アップデート履歴（パスワード不要） */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">アップデート履歴</h3>
                <div className="flex flex-col gap-1">
                    {VERSION_HISTORY.map((entry) => {
                        const isExpanded = expandedVersion === entry.version;
                        return (
                            <div key={entry.version}>
                                <div
                                    className="flex justify-between items-center cursor-pointer py-2 px-2 rounded-lg hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                                    onClick={() => setExpandedVersion(isExpanded ? null : entry.version)}
                                >
                                    <span className="text-sm font-bold text-gray-300">v{entry.version}</span>
                                    <span className="text-[0.6rem] text-gray-500">{isExpanded ? '▲' : '▼'}</span>
                                </div>
                                {isExpanded && (
                                    <ul className="pl-4 pb-2 space-y-1">
                                        {entry.notes.map((note, i) => (
                                            <li key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                                                <span className="text-[var(--gold-color)] mt-0.5 shrink-0">•</span>
                                                <span>{note}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
    <div onClick={() => onChange(!checked)}
        className={`cursor-pointer bg-[var(--input-bg)] p-3 rounded-lg mb-2 flex justify-between items-center select-none transition-all border ${
            checked ? 'border-[var(--accent-color)]' : 'border-[var(--border-color)] hover:border-gray-500'
        }`}>
        <span className="font-bold text-sm">{label}</span>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            checked ? 'border-[var(--accent-color)] bg-[var(--accent-color)]' : 'border-[var(--accent-color)] bg-transparent'
        }`}>
            {checked && <span className="text-black font-bold text-sm leading-none">✓</span>}
        </div>
    </div>
);
