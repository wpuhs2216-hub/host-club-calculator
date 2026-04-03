import React, { useState } from 'react';
import type { StoreConfig } from '../../types/storeConfig';

interface Props {
    config: StoreConfig;
    onUpdate: (updater: (prev: StoreConfig) => StoreConfig) => void;
}

export const TableSettings: React.FC<Props> = ({ config, onUpdate }) => {
    const [newName, setNewName] = useState('');

    const handleAdd = () => {
        if (!newName.trim()) return;
        onUpdate(prev => ({ ...prev, tableNames: [...prev.tableNames, newName.trim()] }));
        setNewName('');
    };

    const handleRemove = (index: number) => {
        onUpdate(prev => ({ ...prev, tableNames: prev.tableNames.filter((_, i) => i !== index) }));
    };

    const handleRename = (index: number, name: string) => {
        onUpdate(prev => ({
            ...prev,
            tableNames: prev.tableNames.map((n, i) => i === index ? name : n)
        }));
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">テーブル一覧 ({config.tableNames.length}卓)</h3>
                <div className="flex flex-col gap-1 mb-3">
                    {config.tableNames.map((name, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-[var(--input-bg)] border border-[var(--border-color)]">
                            <input type="text" value={name}
                                onChange={(e) => handleRename(i, e.target.value)}
                                className="flex-1 p-1.5 rounded bg-[var(--bg-color)] border-none text-white text-sm outline-none" />
                            <button onClick={() => handleRemove(i)}
                                className="text-red-500 hover:text-red-400 bg-transparent border-none text-xs cursor-pointer px-2">削除</button>
                        </div>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                        placeholder="新しいテーブル名"
                        className="flex-1 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm outline-none focus:border-[var(--gold-color)]" />
                    <button onClick={handleAdd} disabled={!newName.trim()}
                        className="px-4 py-2 rounded-lg bg-[var(--gold-color)] text-black font-bold text-sm border-none cursor-pointer disabled:opacity-50">追加</button>
                </div>
                <p className="text-xs text-gray-500 mt-2">※ テーブル設定の変更は次回のセッション初期化時に反映されます</p>
            </div>
        </div>
    );
};
