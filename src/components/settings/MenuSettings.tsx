import React, { useState } from 'react';
import type { StoreConfig, MenuItemDef } from '../../types/storeConfig';

interface Props {
    config: StoreConfig;
    onUpdate: (updater: (prev: StoreConfig) => StoreConfig) => void;
}

export const MenuSettings: React.FC<Props> = ({ config, onUpdate }) => {
    const [newItemName, setNewItemName] = useState('');
    const [newItemPrice, setNewItemPrice] = useState('');

    const handleAddItem = () => {
        if (!newItemName.trim() || !newItemPrice) return;
        const item: MenuItemDef = { name: newItemName.trim(), price: Number(newItemPrice) || 0 };
        onUpdate(prev => ({ ...prev, menuItems: [...prev.menuItems, item] }));
        setNewItemName('');
        setNewItemPrice('');
    };

    const handleRemoveItem = (index: number) => {
        onUpdate(prev => ({ ...prev, menuItems: prev.menuItems.filter((_, i) => i !== index) }));
    };

    const handleUpdateItem = (index: number, field: keyof MenuItemDef, value: unknown) => {
        onUpdate(prev => ({
            ...prev,
            menuItems: prev.menuItems.map((item, i) => i === index ? { ...item, [field]: value } : item)
        }));
    };

    return (
        <div className="flex flex-col gap-4">
            {/* メニューアイテム一覧 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">メニューアイテム ({config.menuItems.length}品)</h3>
                <div className="max-h-[400px] overflow-y-auto flex flex-col gap-1" style={{ scrollbarWidth: 'thin' }}>
                    {config.menuItems.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-[var(--input-bg)] border border-[var(--border-color)]">
                            <input type="text" value={item.name}
                                onChange={(e) => handleUpdateItem(i, 'name', e.target.value)}
                                className="flex-1 p-1.5 rounded bg-[var(--bg-color)] border-none text-white text-sm outline-none min-w-0" />
                            <input type="number" value={item.price}
                                onChange={(e) => handleUpdateItem(i, 'price', Number(e.target.value) || 0)}
                                className="w-20 p-1.5 rounded bg-[var(--bg-color)] border-none text-white text-sm text-right outline-none" />
                            <label className="flex items-center text-xs text-gray-400 whitespace-nowrap cursor-pointer">
                                <input type="checkbox" checked={item.canHalfOff ?? false}
                                    onChange={(e) => handleUpdateItem(i, 'canHalfOff', e.target.checked)}
                                    className="mr-1 accent-[var(--gold-color)]" />半額
                            </label>
                            <label className="flex items-center text-xs text-gray-400 whitespace-nowrap cursor-pointer">
                                <input type="checkbox" checked={item.isTaxIncluded ?? false}
                                    onChange={(e) => handleUpdateItem(i, 'isTaxIncluded', e.target.checked)}
                                    className="mr-1 accent-[var(--gold-color)]" />税込
                            </label>
                            {!item.isCustom && (
                                <button onClick={() => handleRemoveItem(i)}
                                    className="text-red-500 hover:text-red-400 bg-transparent border-none text-xs cursor-pointer px-1">✕</button>
                            )}
                        </div>
                    ))}
                </div>

                {/* アイテム追加 */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--border-color)]">
                    <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                        placeholder="商品名"
                        className="flex-1 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm outline-none" />
                    <input type="number" value={newItemPrice} onChange={(e) => setNewItemPrice(e.target.value)}
                        placeholder="価格"
                        className="w-24 p-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm text-right outline-none" />
                    <button onClick={handleAddItem}
                        disabled={!newItemName.trim() || !newItemPrice}
                        className="px-4 py-2 rounded-lg bg-[var(--gold-color)] text-black font-bold text-sm border-none cursor-pointer disabled:opacity-50">+</button>
                </div>
            </div>

            {/* ピン留めオーダー */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">デフォルトオーダー（ピン留め）</h3>
                {config.pinnedOrders.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-[var(--input-bg)] border border-[var(--border-color)] mb-1">
                        <input type="text" value={item.name}
                            onChange={(e) => {
                                const newPinned = [...config.pinnedOrders];
                                newPinned[i] = { ...newPinned[i], name: e.target.value };
                                onUpdate(prev => ({ ...prev, pinnedOrders: newPinned }));
                            }}
                            className="flex-1 p-1.5 rounded bg-[var(--bg-color)] border-none text-white text-sm outline-none" />
                        <input type="number" value={item.price}
                            onChange={(e) => {
                                const newPinned = [...config.pinnedOrders];
                                newPinned[i] = { ...newPinned[i], price: Number(e.target.value) || 0 };
                                onUpdate(prev => ({ ...prev, pinnedOrders: newPinned }));
                            }}
                            className="w-20 p-1.5 rounded bg-[var(--bg-color)] border-none text-white text-sm text-right outline-none" />
                        <label className="flex items-center text-xs text-gray-400 whitespace-nowrap cursor-pointer">
                            <input type="checkbox" checked={item.canHalfOff ?? false}
                                onChange={(e) => {
                                    const newPinned = [...config.pinnedOrders];
                                    newPinned[i] = { ...newPinned[i], canHalfOff: e.target.checked };
                                    onUpdate(prev => ({ ...prev, pinnedOrders: newPinned }));
                                }}
                                className="mr-1 accent-[var(--gold-color)]" />半額可
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};
