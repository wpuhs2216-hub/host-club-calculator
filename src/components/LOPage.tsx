import React, { useState } from 'react';
import type { TableInfo } from '../hooks/useMultiTableCalculator';
import type { Action, CustomerType } from '../hooks/useCalculator';
import { calculateResult } from '../hooks/useCalculator';
import type { StoreConfig } from '../types/storeConfig';

interface LOPageProps {
    tables: TableInfo[];
    config: StoreConfig;
    dispatchForSlip: (tableId: string, slipId: string, action: Action) => void;
    onMoveSlip?: (fromTableId: string, slipId: string, toTableId: string) => void;
    onClearAllSlips?: () => void;
}

const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
    initial: '新規',
    r_within: 'R(チケ有)',
    r_after: 'R(チケ無)',
    regular: '正規',
};

// 23:45以降かどうか判定
function isNearClosing(): boolean {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    return (h === 23 && m >= 45) || (h >= 0 && h < 6);
}

export const LOPage: React.FC<LOPageProps> = ({ tables, config, dispatchForSlip, onMoveSlip, onClearAllSlips }) => {
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [movingSlipKey, setMovingSlipKey] = useState<string | null>(null);
    // 伝票ごとの表示モード（現在 or ラストまで）
    const [slipViewMode, setSlipViewMode] = useState<Record<string, 'current' | 'closing'>>({});

    const defaultMode = isNearClosing() ? 'closing' : 'current';
    const hasAnySlips = tables.some(t => t.slips.length > 0);

    return (
        <div className="flex flex-col gap-4">
            {/* ヘッダー (outside grid) */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-[var(--gold-color)] flex items-center gap-2">
                    ◆ LO（ラストオーダー一覧）
                </h2>
                {hasAnySlips && onClearAllSlips && (
                    <button
                        onClick={() => { if (window.confirm('全テーブルの全伝票を削除しますか？')) onClearAllSlips(); }}
                        className="px-3 py-1.5 rounded-lg border border-[var(--danger-color)] text-[var(--danger-color)] font-bold text-xs hover:bg-[var(--danger-color)] hover:text-white transition-all outline-none cursor-pointer bg-transparent"
                    >全卓リセット</button>
                )}
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 gap-4">
            {tables.map(table => (
                <div key={table.id} className="rounded-xl border border-[var(--border-color)] overflow-hidden bg-[var(--card-bg)]">
                    {/* テーブルヘッダー */}
                    <div className="px-4 py-3 border-b border-[var(--border-color)] bg-gradient-to-r from-[rgba(255,215,0,0.1)] to-transparent">
                        <span className="text-lg font-bold text-[var(--gold-color)]">{table.name}</span>
                        <span className="text-sm text-gray-400 ml-2">({table.slips.length}伝票)</span>
                    </div>

                    {/* 伝票なし */}
                    {table.slips.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">伝票なし</div>
                    )}

                    {/* 各伝票 */}
                    {table.slips.map(slip => {
                        const result = calculateResult(slip.state, config, { loCapEnabled: true });
                        const closingResult = result.schedule[result.schedule.length - 1];
                        const editKey = `${table.id}-${slip.id}`;
                        const isEditing = editingKey === editKey;
                        const activeOrders = slip.state.orders.filter(o => o.count > 0);
                        const pinnedOrders = slip.state.orders.filter(o => o.isPinned);

                        const viewMode = slipViewMode[editKey] ?? defaultMode;
                        const displayBreakdown = viewMode === 'closing' ? (closingResult?.breakdown ?? result.breakdown) : result.breakdown;
                        const displayTotal = viewMode === 'closing' ? (closingResult?.totalPrice ?? result.currentTotal) : result.currentTotal;

                        return (
                            <div key={slip.id} className="border-b border-[var(--border-color)] last:border-b-0">
                                {/* 伝票ヘッダー */}
                                <div className="p-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div>
                                            <div className="text-base font-bold">
                                                {slip.name}
                                                <span className="text-sm text-gray-400 font-normal ml-2">
                                                    {CUSTOMER_TYPE_LABELS[slip.state.customerType]} | 入店 {slip.state.entryTime}
                                                    {slip.state.dohan && ' | 同伴'}
                                                    {slip.state.additionalNominationCount > 0 && ` | 複数指名+${slip.state.additionalNominationCount}`}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-right">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-400">現在</span>
                                                <span className="text-lg font-mono">¥{result.currentTotal.toLocaleString()}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-[var(--accent-color)]">閉店</span>
                                                <span className="text-xl font-bold font-mono text-[var(--gold-color)]">
                                                    ¥{closingResult?.totalPrice.toLocaleString() ?? '---'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => setEditingKey(isEditing ? null : editKey)}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border cursor-pointer ${
                                                isEditing
                                                    ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                                                    : 'bg-transparent text-[var(--gold-color)] border-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)]'
                                            }`}
                                        >
                                            {isEditing ? '✓ 閉じる' : '▹ 編集'}
                                        </button>
                                        {onMoveSlip && (
                                            <button
                                                onClick={() => setMovingSlipKey(movingSlipKey === editKey ? null : editKey)}
                                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all border cursor-pointer ${
                                                    movingSlipKey === editKey
                                                        ? 'bg-blue-500 text-white border-blue-500'
                                                        : 'bg-transparent text-blue-400 border-blue-400 hover:bg-[rgba(59,130,246,0.1)]'
                                                }`}
                                            >
                                                {movingSlipKey === editKey ? '✕ キャンセル' : '↔ 移動'}
                                            </button>
                                        )}
                                    </div>
                                    {/* 伝票移動先選択 */}
                                    {movingSlipKey === editKey && onMoveSlip && (
                                        <div className="mt-2 p-3 rounded-lg bg-[rgba(59,130,246,0.08)] border border-blue-500/30">
                                            <div className="text-xs text-blue-400 mb-2">移動先テーブルを選択</div>
                                            <div className="flex gap-2 flex-wrap">
                                                {tables.filter(t => t.id !== table.id).map(t => (
                                                    <button key={t.id}
                                                        onClick={() => { onMoveSlip(table.id, slip.id, t.id); setMovingSlipKey(null); }}
                                                        className="px-3 py-1.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-bold cursor-pointer hover:bg-blue-500/40 transition-colors"
                                                    >{t.name}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* 簡易編集 */}
                                {isEditing && (
                                    <div className="px-4 pb-4 pt-0">
                                        <div className="p-3 rounded-lg bg-[var(--input-bg)] flex flex-col gap-3">
                                            {/* 客層 */}
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">客層</label>
                                                <div className="flex gap-2">
                                                    {(['initial', 'r_within', 'r_after', 'regular'] as CustomerType[]).map(ct => (
                                                        <button key={ct}
                                                            onClick={() => dispatchForSlip(table.id, slip.id, { type: 'SET_CUSTOMER_TYPE', payload: ct })}
                                                            className={`flex-1 py-2 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                                                slip.state.customerType === ct ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)]'
                                                            }`}
                                                        >{CUSTOMER_TYPE_LABELS[ct]}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            {/* 新規セット料金 */}
                                            {slip.state.customerType === 'initial' && (
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">セット料金</label>
                                                    <div className="flex gap-1.5">
                                                        {[0, 1000, 3000, 5000].map(price => (
                                                            <button key={price}
                                                                onClick={() => dispatchForSlip(table.id, slip.id, { type: 'SET_INITIAL_SET_PRICE', payload: price })}
                                                                className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                                                    slip.state.initialSetPrice === price ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)]'
                                                                }`}
                                                            >¥{price.toLocaleString()}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* 入店時間 */}
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">入店時間</label>
                                                <input type="time" value={slip.state.entryTime}
                                                    onChange={(e) => dispatchForSlip(table.id, slip.id, { type: 'SET_ENTRY_TIME', payload: e.target.value })}
                                                    className="w-full p-2 rounded-md border border-[var(--border-color)] bg-[var(--bg-color)] text-white text-sm outline-none [color-scheme:dark]"
                                                />
                                            </div>
                                            {/* トグル */}
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { label: '同伴', active: slip.state.dohan, action: 'TOGGLE_DOHAN' as const },
                                                    { label: 'セット半額', active: slip.state.isSetHalfOff, action: 'TOGGLE_SET_HALF_OFF' as const },
                                                    { label: '女子会', active: slip.state.isGirlsParty, action: 'TOGGLE_GIRLS_PARTY' as const },
                                                    { label: '感謝DAY', active: slip.state.isAppreciationDay, action: 'TOGGLE_APPRECIATION_DAY' as const },
                                                    { label: 'セブンラック', active: slip.state.isSevenLuck, action: 'TOGGLE_SEVEN_LUCK' as const },
                                                    { label: 'ゴールドチケット', active: slip.state.isGoldTicket, action: 'TOGGLE_GOLD_TICKET' as const },
                                                ].map(toggle => (
                                                    <button key={toggle.label}
                                                        onClick={() => dispatchForSlip(table.id, slip.id, { type: toggle.action })}
                                                        className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                                            toggle.active ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-gray-300 border-[var(--border-color)]'
                                                        }`}
                                                    >{toggle.label}</button>
                                                ))}
                                            </div>
                                            {/* デフォルトオーダー */}
                                            <div>
                                                <label className="text-xs text-gray-400 mb-1 block">デフォルトオーダー</label>
                                                {pinnedOrders.map(order => (
                                                    <div key={order.id} className="flex items-center justify-between py-1.5 px-2 bg-[var(--bg-color)] rounded-md mb-1">
                                                        <div>
                                                            <span className="text-sm">{order.name}</span>
                                                            <span className="text-xs text-gray-500 ml-2">¥{order.price.toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => dispatchForSlip(table.id, slip.id, { type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: -1 } })}
                                                                className="w-7 h-7 rounded-full border border-[var(--border-color)] bg-transparent text-white text-sm flex items-center justify-center cursor-pointer">-</button>
                                                            <span className="w-6 text-center text-sm font-bold">{order.count}</span>
                                                            <button onClick={() => dispatchForSlip(table.id, slip.id, { type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: 1 } })}
                                                                className="w-7 h-7 rounded-full border-none bg-[var(--gold-color)] text-black text-sm flex items-center justify-center cursor-pointer">+</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* 追加オーダー */}
                                            {activeOrders.filter(o => !o.isPinned).length > 0 && (
                                                <div>
                                                    <label className="text-xs text-gray-400 mb-1 block">追加オーダー</label>
                                                    {activeOrders.filter(o => !o.isPinned).map(order => (
                                                        <div key={order.id} className="flex items-center justify-between py-1.5 px-2 bg-[var(--bg-color)] rounded-md mb-1">
                                                            <span className="text-sm">{order.name}</span>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => dispatchForSlip(table.id, slip.id, { type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: -1 } })}
                                                                    className="w-7 h-7 rounded-full border border-[var(--border-color)] bg-transparent text-white text-sm flex items-center justify-center cursor-pointer">-</button>
                                                                <span className="w-6 text-center text-sm font-bold">{order.count}</span>
                                                                <button onClick={() => dispatchForSlip(table.id, slip.id, { type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: 1 } })}
                                                                    className="w-7 h-7 rounded-full border-none bg-[var(--gold-color)] text-black text-sm flex items-center justify-center cursor-pointer">+</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 料金切替タブ + 詳細内訳 */}
                                <div className="px-4 pb-4">
                                    <div className="flex gap-1 mb-2">
                                        <button
                                            onClick={() => setSlipViewMode(prev => ({ ...prev, [editKey]: 'current' }))}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                                viewMode === 'current'
                                                    ? 'bg-[var(--accent-color)] text-black border-[var(--accent-color)]'
                                                    : 'bg-transparent text-gray-400 border-[var(--border-color)]'
                                            }`}
                                        >現在</button>
                                        <button
                                            onClick={() => setSlipViewMode(prev => ({ ...prev, [editKey]: 'closing' }))}
                                            className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                                                viewMode === 'closing'
                                                    ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                                                    : 'bg-transparent text-gray-400 border-[var(--border-color)]'
                                            }`}
                                        >ラストまで</button>
                                    </div>

                                    <h4 className="text-sm text-gray-400 mb-2">内訳</h4>
                                    {displayBreakdown.map((item, index) => {
                                        const LO_QUICK_NAMES = [
                                            'カン', 'ペットボトル', 'ショット系',
                                            'ソフトドリンク', '1800', 'コカボム', '茉莉花', 'カクテル', 'レッドブル',
                                            'ハーフ鏡月',
                                        ];
                                        const matchedOrder = slip.state.orders.find(o =>
                                            LO_QUICK_NAMES.includes(o.baseName) && item.label.startsWith(o.name)
                                        );
                                        return (
                                            <BreakdownRow
                                                key={index}
                                                label={item.label}
                                                amount={item.amount}
                                                isTotal={item.isTotal}
                                                note={item.note}
                                                onIncrement={matchedOrder ? () => dispatchForSlip(table.id, slip.id, { type: 'UPDATE_ORDER_COUNT', payload: { id: matchedOrder.id, delta: 1 } }) : undefined}
                                                onDecrement={matchedOrder ? () => dispatchForSlip(table.id, slip.id, { type: 'UPDATE_ORDER_COUNT', payload: { id: matchedOrder.id, delta: -1 } }) : undefined}
                                            />
                                        );
                                    })}
                                    <div className="mt-2 pt-2 border-t border-gray-600 flex justify-between items-center">
                                        <span className="font-bold text-white">合計 (税込)</span>
                                        <span className="text-xl font-bold text-[var(--gold-color)]">¥{displayTotal.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}
            </div>
        </div>
    );
};

const BreakdownRow: React.FC<{
    label: string; amount: number; isTotal?: boolean; note?: string;
    onIncrement?: () => void; onDecrement?: () => void;
}> = ({ label, amount, isTotal, note, onIncrement, onDecrement }) => {
    if (amount === 0 && !isTotal && !label.includes('セット') && !onIncrement) return null;
    return (
        <div className={`flex justify-between items-center mb-1.5 text-sm ${isTotal ? 'text-white font-bold border-t border-gray-600 pt-1.5' : 'text-gray-300'}`}>
            <div className="flex items-center gap-2">
                {label}{note && <span className="text-[0.7rem] text-gray-500 ml-1">{note}</span>}
                {onIncrement && (
                    <div className="flex items-center gap-1 ml-1">
                        <button onClick={onDecrement}
                            className="w-5 h-5 rounded-full border border-[var(--border-color)] bg-transparent text-white text-[0.65rem] flex items-center justify-center cursor-pointer">-</button>
                        <button onClick={onIncrement}
                            className="w-5 h-5 rounded-full border-none bg-[var(--gold-color)] text-black text-[0.65rem] flex items-center justify-center cursor-pointer">+</button>
                    </div>
                )}
            </div>
            <div>¥{amount.toLocaleString()}</div>
        </div>
    );
};
