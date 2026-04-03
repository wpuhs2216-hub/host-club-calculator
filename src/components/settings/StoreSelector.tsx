import React, { useState } from 'react';
import type { StoreConfig, StoreRegistry } from '../../types/storeConfig';

interface Props {
    config: StoreConfig;
    registry: StoreRegistry;
    onSetActive: (id: string) => void;
    onAdd: (name: string, cloneFromId?: string) => string;
    onDelete: (id: string) => void;
    onUpdate: (updater: (prev: StoreConfig) => StoreConfig) => void;
}

export const StoreSelector: React.FC<Props> = ({ config, registry, onSetActive, onAdd, onDelete, onUpdate }) => {
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        onAdd(newName.trim(), config.id);
        setNewName('');
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 店舗一覧 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">登録店舗</h3>
                <div className="flex flex-col gap-2 mb-4">
                    {registry.stores.map(store => (
                        <div key={store.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            store.id === config.id ? 'border-[var(--gold-color)] bg-[rgba(255,215,0,0.08)]' : 'border-[var(--border-color)] bg-[var(--input-bg)]'
                        }`}>
                            <button
                                onClick={() => onSetActive(store.id)}
                                className="flex-1 text-left bg-transparent border-none text-white font-bold cursor-pointer outline-none"
                            >
                                {store.storeName}
                                {store.id === config.id && <span className="text-[var(--gold-color)] ml-2 text-xs">選択中</span>}
                            </button>
                            {registry.stores.length > 1 && (
                                <button
                                    onClick={() => { if (window.confirm(`「${store.storeName}」を削除しますか？`)) onDelete(store.id); }}
                                    className="text-red-500 hover:text-red-400 bg-transparent border-none text-sm cursor-pointer"
                                >削除</button>
                            )}
                        </div>
                    ))}
                </div>

                {/* 新規追加 */}
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="新しい店舗名"
                        className="flex-1 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm outline-none focus:border-[var(--gold-color)]"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newName.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--gold-color)] text-black font-bold text-sm border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >追加</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">※ 現在の店舗設定をコピーして新店舗を作成します</p>
            </div>

            {/* 選択中店舗の名前変更 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">店舗名</h3>
                <input
                    type="text"
                    value={config.storeName}
                    onChange={(e) => onUpdate(prev => ({ ...prev, storeName: e.target.value }))}
                    className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-lg outline-none focus:border-[var(--gold-color)]"
                />
            </div>
        </div>
    );
};
