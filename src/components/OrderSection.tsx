import React, { useState, useEffect } from 'react';
import type { OrderItem } from '../hooks/useCalculator';
import { MENU_ITEMS } from '../data/menu';

interface OrderSectionProps {
    orders: OrderItem[];
    customerType: string;
    onAdd: (name: string, price: number, isTaxIncluded?: boolean, canHalfOff?: boolean, isHalfOff?: boolean) => void;
    onUpdateCount: (id: string, delta: number) => void;
    onSetCount?: (id: string, count: number) => void;
    onToggleHalfOff?: (id: string) => void;
    onRemove: (id: string) => void;
    isGirlsParty: boolean;
    isAppreciationDay: boolean;
    isSevenLuck: boolean;
}

type TabType = 'standard' | 'champagne' | 'shochu' | 'special';

export const OrderSection: React.FC<OrderSectionProps> = ({
    orders, customerType, onAdd, onUpdateCount, onSetCount, onToggleHalfOff, onRemove,
    isGirlsParty, isAppreciationDay, isSevenLuck
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('standard');
    // 初期値: standardタブの最初のアイテム
    const [selectedItemIndex, setSelectedItemIndex] = useState(() => {
        const first = MENU_ITEMS.findIndex(m => m.name === 'ソフトドリンク');
        return first !== -1 ? first : 0;
    });
    const [customName, setCustomName] = useState('');
    const [customPrice, setCustomPrice] = useState<string>('');
    const [isHalfOff, setIsHalfOff] = useState(false);

    const categories: Record<TabType, string[]> = {
        standard: ['ソフトドリンク', '1800', 'コカボム', '茉莉花', 'カクテル', 'レッドブル'],
        champagne: ['リステル', 'アスティ', 'SPLブルー', 'SPLホワイト', 'SPLパープル', 'SPLロゼ', 'SPLジュエルワイン', 'SPLZERO', 'SPLレッド', 'SPLゴールド', 'SPLルミナス', 'SPLブラック', 'SPLマグナム', 'SPLエメラルド', 'SPLルミナスマグナム', 'SPLプラチナ'],
        shochu: ['ハーフ杏露酒 / 林檎酒', 'ハーフ焼酎 〈芋.麦〉 梅酒', 'ハーフ鏡月', 'JAPAN', '鍛高譚', '黒霧島', '吉四六'],
        special: ['オリシャン / その他', 'テキーラスタンド（12）', 'テキーラスタンド（16）', 'テキーラスタンドVIP', 'セブンラックタワー']
    };

    const selectedItem = MENU_ITEMS[selectedItemIndex] || MENU_ITEMS[0];
    const isCustom = selectedItem.isCustom;
    const canHalfOff = selectedItem.canHalfOff;

    // シャンパン名リスト（半額判定用）
    const CHAMPAGNE_HALF_NAMES = [
        'リステル', 'アスティ', 'SPLブルー', 'SPLホワイト', 'SPLパープル',
        'SPLロゼ', 'SPLジュエルワイン', 'SPLZERO', 'SPLレッド', 'SPLゴールド',
    ];
    const BLUE_TO_GOLD_MIN = 35000; // SPLブルー〜SPLゴールドの価格帯

    const isInitialOrR = customerType === 'initial' || customerType === 'r_within' || customerType === 'r_after';
    const hasHalfOffChampagne = orders.some(o =>
        o.isHalfOff && o.count > 0 && CHAMPAGNE_HALF_NAMES.includes(o.baseName)
    );

    useEffect(() => {
        if (!isCustom) {
            setCustomName('');
            setCustomPrice('');
        }
        let shouldHalfOff = false;

        // 女子会 / セブンラック: カン・ショット + ブルー〜ゴールド何本でも半額
        if (isGirlsParty || isSevenLuck) {
            if (
                selectedItem.name === 'カン' ||
                selectedItem.name === 'ショット系' ||
                (canHalfOff && selectedItem.price >= BLUE_TO_GOLD_MIN && selectedItem.price <= 150000)
            ) {
                shouldHalfOff = true;
            }
        }

        // 感謝DAY: カン・ショットのみ半額
        if (isAppreciationDay) {
            if (selectedItem.name === 'カン' || selectedItem.name === 'ショット系') {
                shouldHalfOff = true;
            }
        }

        // 初回 / R: リステル〜ゴールドの最初の1本のみ半額
        if (isInitialOrR && !hasHalfOffChampagne) {
            if (canHalfOff && CHAMPAGNE_HALF_NAMES.includes(selectedItem.name)) {
                shouldHalfOff = true;
            }
        }

        setIsHalfOff(shouldHalfOff);
    }, [selectedItemIndex, isCustom, isGirlsParty, isAppreciationDay, isSevenLuck, isInitialOrR, hasHalfOffChampagne, canHalfOff, selectedItem.name, selectedItem.price]);

    const handleAdd = () => {
        if (isCustom) {
            const price = Number(customPrice);
            if (!customName || !customPrice || isNaN(price) || price <= 0) return;
            onAdd(customName, price, false, true, false);
            setCustomName('');
            setCustomPrice('');
        } else {
            // 元の名前・元の価格で渡す。半額計算はreducer側で行う
            onAdd(selectedItem.name, selectedItem.price, selectedItem.isTaxIncluded, selectedItem.canHalfOff, !!(isHalfOff && canHalfOff));
        }
    };

    const handleSelectItem = (itemName: string) => {
        const index = MENU_ITEMS.findIndex(item => item.name === itemName);
        if (index !== -1) setSelectedItemIndex(index);
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        // タブ切替時にそのタブの最初のアイテムを選択
        const firstName = categories[tab][0];
        if (firstName) handleSelectItem(firstName);
    };

    const tabs = [
        { id: 'standard' as const, label: '定番' },
        { id: 'champagne' as const, label: 'シャンパン' },
        { id: 'shochu' as const, label: '焼酎/果実酒' },
        { id: 'special' as const, label: '特殊/タワー' }
    ];

    return (
        <div className="mt-4 overflow-hidden border border-[var(--border-color)] rounded-xl">
            {/* ヘッダー */}
            <div className="p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-[rgba(255,215,0,0.05)] to-transparent">
                <h3 className="m-0 flex items-center gap-2 text-[var(--gold-color)] font-bold">
                    <span>◇</span> 商品オーダー
                </h3>
            </div>

            {/* タブ */}
            <div className="flex border-b border-[var(--border-color)] overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex-1 py-3 px-2 text-sm font-bold whitespace-nowrap transition-colors border-none border-r border-[var(--border-color)] cursor-pointer outline-none ${
                            activeTab === tab.id
                                ? 'bg-[var(--input-bg)] text-[var(--gold-color)] border-b-2 border-b-[var(--gold-color)]'
                                : 'bg-transparent text-[var(--text-color)] border-b-2 border-b-transparent hover:text-[var(--gold-color)]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 選択グリッド */}
            <div className="p-4 bg-[var(--input-bg)]">
                <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2">
                    {categories[activeTab].map(itemName => {
                        const item = MENU_ITEMS.find(m => m.name === itemName);
                        if (!item) return null;
                        if (itemName === 'セブンラックタワー' && !isSevenLuck) return null;

                        const isSelected = MENU_ITEMS.indexOf(item) === selectedItemIndex;

                        return (
                            <button
                                key={itemName}
                                onClick={() => handleSelectItem(itemName)}
                                className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all text-center cursor-pointer border ${
                                    isSelected
                                        ? 'border-[var(--gold-color)] bg-[rgba(255,215,0,0.1)] text-[var(--gold-color)]'
                                        : 'border-[var(--border-color)] bg-[var(--bg-color)] text-[var(--text-color)] hover:border-gray-400'
                                }`}
                            >
                                <span className="text-sm font-bold mb-1 break-words w-full">{item.name}</span>
                                {!item.isCustom && (
                                    <span className="text-xs opacity-70">¥{item.price.toLocaleString()}</span>
                                )}
                                {item.isCustom && (
                                    <span className="text-xs opacity-80 text-[var(--accent-color)]">自由入力</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 追加セクション */}
            <div className="p-4 border-t border-[var(--border-color)]">
                <h4 className="text-sm text-gray-500 m-0 mb-3">選択中のアイテム設定</h4>

                {/* カスタム入力 */}
                {isCustom && (
                    <div className="flex flex-col gap-3 mb-4 mt-3">
                        <input
                            type="text"
                            placeholder="オリジナル商品名"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] text-base outline-none focus:border-[var(--gold-color)] transition-colors"
                        />
                        <input
                            type="number"
                            placeholder="金額（円）"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="w-full p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] text-base outline-none focus:border-[var(--gold-color)] transition-colors"
                        />
                    </div>
                )}

                {/* 半額チェック */}
                {canHalfOff && !isCustom && (() => {
                    // 初回/Rで半額シャンパン注文済み → シャンパンの半額は不可
                    const isChampagne = CHAMPAGNE_HALF_NAMES.includes(selectedItem.name);
                    const champagneBlocked = isChampagne && isInitialOrR && hasHalfOffChampagne;
                    return champagneBlocked ? (
                        <div className="flex justify-between items-center p-3 rounded-lg mb-4 mt-3 border border-gray-700 bg-[var(--input-bg)] opacity-50 select-none">
                            <span className="text-sm text-gray-500">半額適用済み（1本制限）</span>
                        </div>
                    ) : (
                        <div
                            onClick={() => setIsHalfOff(!isHalfOff)}
                            className={`flex justify-between items-center p-3 rounded-lg mb-4 mt-3 cursor-pointer border transition-all select-none ${
                                isHalfOff
                                    ? 'bg-[rgba(255,215,0,0.1)] border-[var(--gold-color)]'
                                    : 'bg-[var(--input-bg)] border-[var(--border-color)] hover:border-gray-400'
                            }`}
                        >
                            <span className={`text-sm font-bold ${isHalfOff ? 'text-[var(--gold-color)]' : 'text-[var(--text-color)]'}`}>
                                ⟡ 半額適用 (¥{(selectedItem.name === 'カン' ? 700 : selectedItem.price / 2).toLocaleString()})
                            </span>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                isHalfOff ? 'border-[var(--gold-color)] bg-[var(--gold-color)]' : 'border-[var(--border-color)] bg-transparent'
                            }`}>
                                {isHalfOff && <span className="text-black font-bold text-xs">✓</span>}
                            </div>
                        </div>
                    );
                })()}

                {/* 追加ボタン */}
                <button
                    onClick={handleAdd}
                    disabled={isCustom && (!customName || !customPrice)}
                    className={`w-full p-3 rounded-lg font-bold text-base border-none cursor-pointer transition-all ${
                        isCustom && (!customName || !customPrice)
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-[var(--gold-color)] text-black hover:bg-[var(--accent-hover)] shadow-sm'
                    } ${(isCustom || canHalfOff) ? '' : 'mt-3'}`}
                >
                    選択したアイテムを追加する
                </button>
            </div>

            {/* オーダー一覧 */}
            <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-color)]">
                <h4 className="text-sm m-0 mb-3 text-[var(--gold-color)] font-bold">現在のオーダー</h4>
                <div className="max-h-[300px] overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--gold-color) transparent' }}>
                    {orders.length === 0 && (
                        <div className="text-center py-6 text-gray-500 text-sm">オーダーはありません</div>
                    )}
                    {orders.map((order) => (
                        <div key={order.id} className="flex justify-between items-center mb-3 p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--border-color)]">
                            <div className="flex-1 pr-2">
                                <div className="font-bold text-sm mb-1">{order.name}</div>
                                <div className="text-xs text-gray-400 mb-1">
                                    ¥{order.price.toLocaleString()}
                                    {order.isTaxIncluded && ' (税込)'}
                                </div>
                                {order.canHalfOff && onToggleHalfOff && (() => {
                                    const isOrderChampagne = CHAMPAGNE_HALF_NAMES.includes(order.baseName);
                                    // 初回/Rで他の半額シャンパンが既にある場合、このシャンパン自体が半額でなければブロック
                                    const blocked = isOrderChampagne && isInitialOrR && !order.isHalfOff && hasHalfOffChampagne;
                                    return blocked ? (
                                        <span className="text-xs text-gray-500">半額適用済み（1本制限）</span>
                                    ) : (
                                        <label className="flex items-center text-xs text-[var(--gold-color)] cursor-pointer select-none">
                                            <input
                                                type="checkbox"
                                                checked={order.isHalfOff || false}
                                                onChange={() => onToggleHalfOff(order.id)}
                                                className="mr-1 accent-[var(--gold-color)]"
                                            />
                                            半額適用
                                        </label>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onUpdateCount(order.id, -1)}
                                    className="w-8 h-8 rounded-full border border-[var(--border-color)] bg-transparent text-white flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                                >-</button>
                                {onSetCount ? (
                                    <input
                                        type="number"
                                        value={order.count.toString()}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (!isNaN(val) && val >= 0) onSetCount(order.id, val);
                                            else if (e.target.value === '') onSetCount(order.id, 0);
                                        }}
                                        onFocus={(e) => e.target.select()}
                                        className="w-10 text-center font-bold bg-transparent border-none border-b border-b-[var(--border-color)] outline-none text-white text-sm hide-spin-button"
                                    />
                                ) : (
                                    <div className="w-6 text-center font-bold">{order.count}</div>
                                )}
                                <button
                                    onClick={() => onUpdateCount(order.id, 1)}
                                    className="w-8 h-8 rounded-full border-none bg-[var(--gold-color)] text-black flex items-center justify-center cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                                >+</button>
                                {!order.isPinned && (
                                    <button
                                        onClick={() => onRemove(order.id)}
                                        className="ml-2 text-xs border-none bg-transparent underline cursor-pointer text-[var(--danger-color)] hover:text-red-300"
                                    >
                                        削除
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
