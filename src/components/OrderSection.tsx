import React, { useState, useEffect } from 'react';
import type { OrderItem } from '../hooks/useCalculator';

interface OrderSectionProps {
    orders: OrderItem[];
    onAdd: (name: string, price: number, isTaxIncluded?: boolean) => void;
    onUpdateCount: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
    isGirlsParty: boolean;
    isAppreciationDay: boolean;
    isFirstLady: boolean;
}

// Define the menu items. 
// Note: 'isCustom' flag marks the item that requires manual input.
// 'canHalfOff' flag marks items eligible for half-price option (Asti to SPL Gold).
const MENU_ITEMS = [
    // Top Priority Items
    { name: '缶モノ', price: 1500, canHalfOff: true },
    { name: 'ペットボトル各種', price: 2000 },
    { name: 'ソフトドリンク', price: 500 },
    { name: 'ショット系', price: 2000, canHalfOff: true },
    { name: 'コカボム', price: 3000 },
    { name: '茉莉花', price: 15000 },

    // Custom Item
    { name: 'オリシャン / その他', price: 0, isCustom: true },

    // Others
    { name: 'ハーフ杏露酒 / 林檎酒', price: 3500 },
    { name: 'ハーフ焼酎 〈芋.麦〉 梅酒', price: 4200 },
    { name: 'ハーフ鏡月', price: 5000 },

    { name: 'JAPAN', price: 15000 },
    { name: '鍛高譚', price: 15000 },
    { name: '黒霧島', price: 15000 },
    { name: '吉四六', price: 22000 },

    { name: 'カクテル', price: 1000 },

    { name: 'テキーラスタンド（12）', price: 22000 },
    { name: 'テキーラスタンド（16）', price: 28000 },
    { name: 'テキーラスタンドVIP', price: 45000 },

    { name: 'リステル', price: 20000, canHalfOff: true },
    { name: 'アスティ', price: 28000, canHalfOff: true },
    { name: 'SPLブルー', price: 35000, canHalfOff: true },
    { name: 'SPLホワイト', price: 50000, canHalfOff: true },
    { name: 'SPLパープル', price: 50000, canHalfOff: true },
    { name: 'SPLロゼ', price: 80000, canHalfOff: true },
    { name: 'SPLジュエルワイン', price: 80000, canHalfOff: true },
    { name: 'SPLZERO', price: 100000, canHalfOff: true },
    { name: 'SPLレッド', price: 100000, canHalfOff: true },
    { name: 'SPLゴールド', price: 150000, canHalfOff: true },
    { name: 'SPLルミナス', price: 200000 },
    { name: 'SPLブラック', price: 250000 },
    { name: 'SPLマグナム', price: 300000 },
    { name: 'SPLエメラルド', price: 350000 },
    { name: 'SPLルミナスマグナム', price: 400000 },
    { name: 'SPLプラチナ', price: 450000 },

    // Special
    { name: 'ファーストレディタワー', price: 150000, isTaxIncluded: true },
];

export const OrderSection: React.FC<OrderSectionProps> = ({
    orders, onAdd, onUpdateCount, onRemove,
    isGirlsParty, isAppreciationDay, isFirstLady
}) => {
    const [selectedItemIndex, setSelectedItemIndex] = useState(0);

    // Custom item state
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState<string>('');

    // Champagne Half-Off state
    const [isHalfOff, setIsHalfOff] = useState(false);

    const selectedItem = MENU_ITEMS[selectedItemIndex];
    const isCustom = selectedItem.isCustom;
    const canHalfOff = selectedItem.canHalfOff;

    // Reset inputs when selection changes
    useEffect(() => {
        if (!isCustom) {
            setCustomName('');
            setCustomPrice('');
        }

        // Auto-check logic
        let shouldHalfOff = false;

        // 1. Girls' Party OR First Lady: Shot, Canned, SPL Blue-Gold
        if (isGirlsParty || isFirstLady) {
            if (
                selectedItem.name === '缶モノ' ||
                selectedItem.name === 'ショット系' ||
                (canHalfOff && selectedItem.price >= 35000 && selectedItem.price <= 150000) // SPL Blue to Gold
            ) {
                shouldHalfOff = true;
            }
        }

        // 2. Appreciation Day: Shot, Canned
        if (isAppreciationDay) {
            if (
                selectedItem.name === '缶モノ' ||
                selectedItem.name === 'ショット系'
            ) {
                shouldHalfOff = true;
            }
        }

        setIsHalfOff(shouldHalfOff);
    }, [selectedItemIndex, isCustom, isGirlsParty, isAppreciationDay, isFirstLady, canHalfOff, selectedItem.name, selectedItem.price]);

    const handleAdd = () => {
        if (isCustom) {
            if (!customName || !customPrice) return; // Validate
            onAdd(customName, Number(customPrice));
            setCustomName('');
            setCustomPrice('');
        } else {
            if (isHalfOff && canHalfOff) {
                let finalPrice = selectedItem.price / 2;
                // Special case for Canned items (缶モノ) -> 700 yen
                if (selectedItem.name === '缶モノ') {
                    finalPrice = 700;
                }
                onAdd(`${selectedItem.name} (半額)`, finalPrice);
            } else {
                // @ts-ignore
                onAdd(selectedItem.name, selectedItem.price, selectedItem.isTaxIncluded);
            }
        }
    };

    return (
        <div className="card">
            <h3 className="mb-4">商品オーダー</h3>

            <div className="flex flex-col mb-4 gap-2">
                {/* Dropdown */}
                <div className="flex">
                    <select
                        value={selectedItemIndex}
                        onChange={(e) => setSelectedItemIndex(Number(e.target.value))}
                        style={{
                            flex: 1,
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            fontSize: '1rem',
                            outline: 'none',
                        }}
                    >
                        {MENU_ITEMS
                            .filter(item => {
                                if (item.name === 'ファーストレディタワー') {
                                    return isFirstLady;
                                }
                                return true;
                            })
                            .map((item, index) => (
                                <option key={index} value={MENU_ITEMS.indexOf(item)}>
                                    {item.name} {item.isCustom ? '(自由入力)' : `(¥${item.price.toLocaleString()})${item.isTaxIncluded ? '(税込)' : ''}`}
                                </option>
                            ))}
                    </select>
                </div>

                {/* Champagne Half-Off Checkbox */}
                {canHalfOff && (
                    <div
                        onClick={() => setIsHalfOff(!isHalfOff)}
                        style={{
                            cursor: 'pointer',
                            background: 'var(--input-bg)',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: isHalfOff ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
                            marginTop: '8px',
                            marginBottom: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}
                    >
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--gold-color)' }}>
                            半額 (¥{(selectedItem.name === '缶モノ' ? 700 : selectedItem.price / 2).toLocaleString()})
                        </span>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: '2px solid var(--accent-color)',
                            background: isHalfOff ? 'var(--accent-color)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {isHalfOff && <span style={{ color: '#000', fontWeight: 'bold' }}>✓</span>}
                        </div>
                    </div>
                )}

                {/* Standard Add Button (Only show if NOT custom) */}
                {!isCustom && (
                    <button
                        onClick={handleAdd}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'var(--accent-color)',
                            color: '#000',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        追加
                    </button>
                )}
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: isCustom ? '20px' : '0' }}>
                {orders.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
                        オーダーはありません
                    </div>
                )}
                {orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center mb-3" style={{ padding: '8px 0', borderBottom: '1px solid #333' }}>
                        <div>
                            <div style={{ fontWeight: 'bold' }}>{order.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>¥{order.price.toLocaleString()}</div>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => onUpdateCount(order.id, -1)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: '1px solid var(--border-color)',
                                    background: 'transparent',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            >-</button>
                            <div style={{ width: '40px', textAlign: 'center', fontWeight: 'bold' }}>{order.count}</div>
                            <button
                                onClick={() => onUpdateCount(order.id, 1)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'var(--accent-color)',
                                    color: '#000',
                                    fontSize: '1rem'
                                }}
                            >+</button>
                            <button
                                onClick={() => onRemove(order.id)}
                                style={{
                                    marginLeft: '10px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--danger-color)',
                                    fontSize: '0.9rem',
                                    textDecoration: 'underline'
                                }}
                            >
                                削除
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Inputs (Only show if Custom is selected) - Placed BELOW the list */}
            {isCustom && (
                <div className="flex flex-col gap-2 pt-4 border-t border-gray-700" data-testid="custom-inputs-container">
                    <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '4px' }}>自由入力アイテム</div>
                    <input
                        type="text"
                        placeholder="商品名"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            fontSize: '1rem',
                            outline: 'none',
                        }}
                    />
                    <input
                        type="number"
                        placeholder="金額"
                        value={customPrice}
                        onChange={(e) => setCustomPrice(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            fontSize: '1rem',
                            outline: 'none',
                        }}
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!customName || !customPrice}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: (!customName || !customPrice) ? '#444' : 'var(--accent-color)',
                            color: '#000',
                            border: 'none',
                            borderRadius: 'var(--radius-md)',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            cursor: (!customName || !customPrice) ? 'not-allowed' : 'pointer',
                            transition: 'background 0.3s',
                            marginTop: '8px'
                        }}
                    >
                        追加
                    </button>
                </div>
            )}
        </div>
    );
};
