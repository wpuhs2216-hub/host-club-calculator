import React, { useState, useMemo } from 'react';
import { MENU_ITEMS } from '../data/menu';
import type { CalculationResult, CalculatorState, PriceScheduleItem } from '../hooks/useCalculator';

interface AddItem {
    name: string;
    price: number;
    isTaxIncluded?: boolean;
    canHalfOff?: boolean;
    isHalfOff?: boolean;
}

interface BudgetRecommenderProps {
    result: CalculationResult;
    state: CalculatorState;
    showDetail?: boolean;
    onAddOrders: (items: AddItem[]) => void;
}

const CHAMPAGNE_HALF_NAMES = [
    'リステル', 'アスティ', 'SPLブルー', 'SPLホワイト', 'SPLパープル',
    'SPLロゼ', 'SPLジュエルワイン', 'SPLZERO', 'SPLレッド', 'SPLゴールド',
];
const BLUE_TO_GOLD_MIN = 35000;

const SLIDER_MIN = 10000;
const SLIDER_MAX = 200000;
const SLIDER_STEP = 5000;

export const BudgetRecommender: React.FC<BudgetRecommenderProps> = ({ result, state, showDetail = false, onAddOrders }) => {
    const [targetBudgetStr, setTargetBudgetStr] = useState<string>('');
    const [selectedTimeIdx, setSelectedTimeIdx] = useState<number | null>(null);

    const targetBudget = parseInt(targetBudgetStr.replace(/,/g, ''), 10);

    // ピン留めアイテムの価格
    const pinnedCan = state.orders.find(o => o.baseName === 'カン');
    const pinnedShot = state.orders.find(o => o.baseName === 'ショット系');
    // 計算用: 実効価格（半額適用後）
    const canPrice = pinnedCan?.price ?? 1500;
    const shotPrice = pinnedShot?.price ?? 2000;
    const canIsHalf = pinnedCan?.isHalfOff ?? false;
    const shotIsHalf = pinnedShot?.isHalfOff ?? false;
    // 追加用: 元の価格（reducerが半額計算する）
    const canOriginalPrice = pinnedCan?.originalPrice ?? 1500;
    const shotOriginalPrice = pinnedShot?.originalPrice ?? 2000;

    // 半額ルール判定
    const isInitialOrR = state.customerType === 'initial' || state.customerType === 'r_within' || state.customerType === 'r_after';
    const isGirlsOrSevenLuck = state.isGirlsParty || state.isSevenLuck;
    const hasHalfOffChampagne = state.orders.some(o =>
        o.isHalfOff && o.count > 0 && CHAMPAGNE_HALF_NAMES.includes(o.baseName)
    );

    // 初回でドリンク0本→追加時に税率が変わる
    const activeOrders = state.orders.filter(o => o.count > 0);
    const totalItemsCount = activeOrders.reduce((sum, item) => sum + item.count, 0);
    const taxRateAfterAdd = (state.customerType === 'initial' && totalItemsCount === 0) ? 0.35 : result.taxRate;

    // 各スケジュールエントリの予算分析
    const timeSlots = useMemo(() => {
        if (!targetBudget || isNaN(targetBudget) || targetBudget <= 0) return [];

        return result.schedule.map((slot) => {
            const remaining = targetBudget - slot.totalPrice;
            const isAffordable = remaining >= 0;
            return { ...slot, remaining, isAffordable };
        });
    }, [targetBudget, result.schedule]);

    // N本追加時のトータルコスト（税率変動を正しく反映）
    interface CalcDebug {
        slotSubTotal: number;
        addPreTax: number;
        newSubTotal: number;
        taxRate: number;
        taxAmount: number;
        newTotalRaw: number;
        newTotalRounded: number;
        slotTotal: number;
        marginal: number;
    }
    const getSlotAddCost = (slot: PriceScheduleItem, totalPreTaxAdd: number): number => {
        const slotSubTotal = slot.breakdown.find(b => b.isTotal)?.amount ?? 0;
        const newTotal = (slotSubTotal + totalPreTaxAdd) * (1 + taxRateAfterAdd);
        return Math.ceil(newTotal / 100) * 100 - slot.totalPrice;
    };
    const getSlotAddCostDebug = (slot: PriceScheduleItem, totalPreTaxAdd: number): CalcDebug => {
        const slotSubTotal = slot.breakdown.find(b => b.isTotal)?.amount ?? 0;
        const newSubTotal = slotSubTotal + totalPreTaxAdd;
        const taxAmount = newSubTotal * taxRateAfterAdd;
        const newTotalRaw = newSubTotal + taxAmount;
        const newTotalRounded = Math.ceil(newTotalRaw / 100) * 100;
        return {
            slotSubTotal, addPreTax: totalPreTaxAdd, newSubTotal,
            taxRate: taxRateAfterAdd, taxAmount, newTotalRaw,
            newTotalRounded, slotTotal: slot.totalPrice,
            marginal: newTotalRounded - slot.totalPrice,
        };
    };

    // 指定単価でN本追加した時のコストを正しく計算し、予算内最大本数を返す
    const findMaxItems = (slot: PriceScheduleItem, unitPrice: number, remaining: number) => {
        let n = 0;
        while (n < 50) {
            const cost = getSlotAddCost(slot, (n + 1) * unitPrice);
            if (cost > remaining) break;
            n++;
        }
        return n;
    };

    // 選択タイムスロットでの追加提案
    const recommendations = useMemo(() => {
        if (selectedTimeIdx === null || !timeSlots[selectedTimeIdx]) return [];
        const slot = timeSlots[selectedTimeIdx];
        if (slot.remaining <= 0) return [];

        const remaining = slot.remaining;
        const scheduleSlot = result.schedule[selectedTimeIdx];
        const recs: { label: string; desc: string; items: AddItem[]; cost: number; debug: CalcDebug }[] = [];

        // カン
        const maxCans = findMaxItems(scheduleSlot, canPrice, remaining);
        if (maxCans > 0) {
            recs.push({
                label: `▪ カン ${maxCans}本`,
                desc: `¥${canPrice.toLocaleString()}/本${canIsHalf ? ' (半額)' : ''}`,
                items: Array(maxCans).fill(null).map(() => ({
                    name: 'カン', price: canOriginalPrice, canHalfOff: true, isHalfOff: canIsHalf,
                })),
                cost: getSlotAddCost(scheduleSlot, maxCans * canPrice),
                debug: getSlotAddCostDebug(scheduleSlot, maxCans * canPrice),
            });
        }

        // ショット
        const maxShots = findMaxItems(scheduleSlot, shotPrice, remaining);
        if (maxShots > 0) {
            recs.push({
                label: `▫ ショット ${maxShots}本`,
                desc: `¥${shotPrice.toLocaleString()}/本${shotIsHalf ? ' (半額)' : ''}`,
                items: Array(maxShots).fill(null).map(() => ({
                    name: 'ショット系', price: shotOriginalPrice, canHalfOff: true, isHalfOff: shotIsHalf,
                })),
                cost: getSlotAddCost(scheduleSlot, maxShots * shotPrice),
                debug: getSlotAddCostDebug(scheduleSlot, maxShots * shotPrice),
            });
        }

        // ミックス（カンとショットを交互に詰める）
        if (maxCans > 0 && maxShots > 0) {
            // カン半分 + 残りをショットで
            let bestCans = 0;
            let bestShots = 0;
            for (let c = 1; c <= maxCans; c++) {
                const canCostTotal = c * canPrice;
                // 残り予算でショット何本入るか
                let s = 0;
                while (s < 50) {
                    const totalCost = getSlotAddCost(scheduleSlot, canCostTotal + (s + 1) * shotPrice);
                    if (totalCost > remaining) break;
                    s++;
                }
                if (s > 0 && (c + s > bestCans + bestShots)) {
                    bestCans = c;
                    bestShots = s;
                }
            }
            if (bestCans > 0 && bestShots > 0) {
                const mixPreTax = bestCans * canPrice + bestShots * shotPrice;
                recs.push({
                    label: `▪▫ カン${bestCans} + ショット${bestShots}`,
                    desc: 'ミックス',
                    items: [
                        ...Array(bestCans).fill(null).map(() => ({ name: 'カン', price: canOriginalPrice, canHalfOff: true, isHalfOff: canIsHalf })),
                        ...Array(bestShots).fill(null).map(() => ({ name: 'ショット系', price: shotOriginalPrice, canHalfOff: true, isHalfOff: shotIsHalf })),
                    ],
                    cost: getSlotAddCost(scheduleSlot, mixPreTax),
                    debug: getSlotAddCostDebug(scheduleSlot, mixPreTax),
                });
            }
        }

        // シャンパン
        const champagnes = MENU_ITEMS
            .filter(m => CHAMPAGNE_HALF_NAMES.includes(m.name) && m.canHalfOff)
            .map(m => {
                let canBeHalf = false;
                if (isGirlsOrSevenLuck && m.price >= BLUE_TO_GOLD_MIN && m.price <= 150000) canBeHalf = true;
                else if (isInitialOrR && !hasHalfOffChampagne) canBeHalf = true;
                const effectivePrice = canBeHalf ? Math.floor(m.price / 2) : m.price;
                const cost = getSlotAddCost(scheduleSlot, effectivePrice);
                return { ...m, effectivePrice, cost, isHalf: canBeHalf };
            })
            .filter(m => m.cost > 0 && m.cost <= remaining)
            .sort((a, b) => b.effectivePrice - a.effectivePrice);

        champagnes.slice(0, 2).forEach(ch => {
            recs.push({
                label: `◆ ${ch.name}${ch.isHalf ? ' (半額)' : ''}`,
                desc: `¥${ch.effectivePrice.toLocaleString()}${ch.isHalf ? ` (定価¥${ch.price.toLocaleString()})` : ''}`,
                items: [{
                    name: ch.name, price: ch.price, canHalfOff: true, isHalfOff: ch.isHalf,
                }],
                cost: ch.cost,
                debug: getSlotAddCostDebug(scheduleSlot, ch.effectivePrice),
            });
        });

        return recs;
    }, [selectedTimeIdx, timeSlots, result.schedule, canPrice, shotPrice, canIsHalf, shotIsHalf, isGirlsOrSevenLuck, isInitialOrR, hasHalfOffChampagne, taxRateAfterAdd]);

    // あと少しヒント（選択中タブ基準）
    const nearMiss = useMemo(() => {
        if (selectedTimeIdx === null || !timeSlots[selectedTimeIdx]) return [];
        const slot = timeSlots[selectedTimeIdx];
        if (slot.remaining <= 0) return [];
        const scheduleSlot = result.schedule[selectedTimeIdx];

        return MENU_ITEMS
            .filter(m => CHAMPAGNE_HALF_NAMES.includes(m.name) && m.canHalfOff)
            .map(m => {
                let canBeHalf = false;
                if (isGirlsOrSevenLuck && m.price >= BLUE_TO_GOLD_MIN && m.price <= 150000) canBeHalf = true;
                else if (isInitialOrR && !hasHalfOffChampagne) canBeHalf = true;
                const effectivePrice = canBeHalf ? Math.floor(m.price / 2) : m.price;
                const marginal = getSlotAddCost(scheduleSlot, effectivePrice);
                const over = marginal - slot.remaining;
                return { name: m.name, effectivePrice, over, isHalf: canBeHalf };
            })
            .filter(m => m.over > 0 && m.over <= 15000)
            .sort((a, b) => a.over - b.over)
            .slice(0, 3);
    }, [selectedTimeIdx, timeSlots, result.schedule, isGirlsOrSevenLuck, isInitialOrR, hasHalfOffChampagne]);

    // 予算設定時にデフォルトで最初の予算内タブを選択
    const handleBudgetChange = (val: string) => {
        setTargetBudgetStr(val);
        const budget = parseInt(val.replace(/,/g, ''), 10);
        if (budget > 0) {
            // 最後の予算内タイムスロットを自動選択
            const lastIdx = result.schedule.reduce((acc, s, i) => s.totalPrice <= budget ? i : acc, -1);
            setSelectedTimeIdx(lastIdx >= 0 ? lastIdx : 0);
        }
    };

    return (
        <div>
            {/* 説明文 */}
            <div className="mb-4 p-3 rounded-lg bg-[rgba(0,188,212,0.05)] border border-[var(--border-color)]">
                <div className="text-sm font-bold text-[var(--text-color)] mb-1">予算に対しての最適な注文内容をAIが自動計算します。</div>
                <div className="text-xs text-gray-400">予算と退店時間を設定してください。</div>
            </div>

            {/* サマリ */}
            <div className="flex justify-between items-center mb-4 p-3 rounded-lg bg-[rgba(255,215,0,0.05)] border border-[var(--border-color)]">
                <div>
                    <div className="text-xs text-gray-400">現在のお会計</div>
                    <div className="text-xl font-bold text-white">¥{result.currentTotal.toLocaleString()}</div>
                </div>
                {targetBudget > 0 && targetBudget >= result.currentTotal && (
                    <div className="text-right">
                        <div className="text-xs text-gray-400">目標との差額</div>
                        <div className="text-xl font-bold text-[var(--gold-color)]">¥{(targetBudget - result.currentTotal).toLocaleString()}</div>
                    </div>
                )}
            </div>

            {/* 予算入力: スライダー + テキスト */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">目標金額</label>
                    <input
                        type="text"
                        value={targetBudgetStr}
                        onChange={(e) => {
                            const v = e.target.value.replace(/[^0-9]/g, '');
                            handleBudgetChange(v ? parseInt(v, 10).toLocaleString() : '');
                        }}
                        placeholder="直接入力"
                        className="w-32 p-2 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-lg text-[var(--text-color)] text-sm text-right outline-none focus:border-[var(--gold-color)] transition-colors"
                    />
                </div>
                <input
                    type="range"
                    min={SLIDER_MIN}
                    max={SLIDER_MAX}
                    step={SLIDER_STEP}
                    value={targetBudget > 0 ? Math.min(targetBudget, SLIDER_MAX) : SLIDER_MIN}
                    onChange={(e) => handleBudgetChange(parseInt(e.target.value, 10).toLocaleString())}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[var(--gold-color)]"
                    style={{ background: `linear-gradient(to right, var(--gold-color) ${((Math.min(targetBudget || SLIDER_MIN, SLIDER_MAX) - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100}%, var(--border-color) 0%)` }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>¥{SLIDER_MIN.toLocaleString()}</span>
                    <span>¥{SLIDER_MAX.toLocaleString()}</span>
                </div>
            </div>

            {targetBudget > 0 && targetBudget < result.currentTotal && (
                <div className="text-red-400 text-sm mb-4 p-3 rounded-lg bg-[rgba(255,0,0,0.05)] border border-red-900">
                    ⚠️ 現在の合計が予算を超過しています。
                </div>
            )}

            {/* 滞在時間タブ */}
            {timeSlots.length > 0 && targetBudget >= result.currentTotal && (
                <>
                    <label className="text-sm text-gray-400 mb-2 block">◷ 滞在時間を選択</label>
                    <div className="flex gap-1.5 flex-wrap mb-4">
                        {timeSlots.map((slot, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedTimeIdx(i)}
                                className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer flex flex-col items-center min-w-[60px] ${
                                    selectedTimeIdx === i
                                        ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                                        : slot.isAffordable
                                            ? 'bg-transparent text-white border-[var(--border-color)] hover:border-[var(--gold-color)]'
                                            : 'bg-transparent text-red-400 border-red-900 opacity-60'
                                }`}
                            >
                                <span>〜{slot.timeLimit}</span>
                                <span className={`text-[0.65rem] mt-0.5 ${
                                    selectedTimeIdx === i ? 'text-black/70' : slot.isAffordable ? 'text-gray-400' : 'text-red-400'
                                }`}>
                                    ¥{slot.totalPrice.toLocaleString()}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* 選択中タブの詳細 */}
                    {selectedTimeIdx !== null && timeSlots[selectedTimeIdx] && (
                        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-color)] overflow-hidden">
                            {/* タブヘッダー */}
                            <div className={`p-4 border-b border-[var(--border-color)] ${
                                timeSlots[selectedTimeIdx].isAffordable
                                    ? 'bg-[rgba(255,215,0,0.05)]'
                                    : 'bg-[rgba(255,0,0,0.05)]'
                            }`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div className="text-lg font-bold">〜{timeSlots[selectedTimeIdx].timeLimit}</div>
                                        <div className="text-xs text-gray-400">この時間での合計</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-bold">¥{timeSlots[selectedTimeIdx].totalPrice.toLocaleString()}</div>
                                        {timeSlots[selectedTimeIdx].isAffordable ? (
                                            <div className="text-sm text-[var(--gold-color)] font-bold">
                                                残り ¥{timeSlots[selectedTimeIdx].remaining.toLocaleString()}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-red-400 font-bold">
                                                超過 ¥{Math.abs(timeSlots[selectedTimeIdx].remaining).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* 追加提案 */}
                            {timeSlots[selectedTimeIdx].isAffordable && (
                                <div className="p-4">
                                    {recommendations.length > 0 ? (
                                        <div className="flex flex-col gap-3">
                                            <h4 className="text-sm font-bold text-[var(--gold-color)]">▸ この時間内で追加できるもの</h4>
                                            {recommendations.map((rec, i) => (
                                                <div key={i} className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] transition-all hover:border-[var(--gold-color)]">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold text-white text-sm">{rec.label}</span>
                                                        <div className="text-right">
                                                            <div className="text-sm font-bold text-[var(--gold-color)]">+¥{rec.cost.toLocaleString()}</div>
                                                            <div className="text-xs text-gray-400">合計 ¥{(timeSlots[selectedTimeIdx!].totalPrice + rec.cost).toLocaleString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mb-2">{rec.desc}</div>
                                                    {showDetail && rec.debug && (
                                                        <div className="text-[0.65rem] text-gray-500 mb-2 p-2 rounded bg-black/30 font-mono leading-relaxed">
                                                            <div>現小計: ¥{rec.debug.slotSubTotal.toLocaleString()}</div>
                                                            <div>+ 追加(税前): ¥{rec.debug.addPreTax.toLocaleString()}</div>
                                                            <div>= 新小計: ¥{rec.debug.newSubTotal.toLocaleString()}</div>
                                                            <div>× TAX {(rec.debug.taxRate * 100).toFixed(0)}% = ¥{Math.ceil(rec.debug.taxAmount).toLocaleString()}</div>
                                                            <div>= 税込: ¥{Math.ceil(rec.debug.newTotalRaw).toLocaleString()} → ¥{rec.debug.newTotalRounded.toLocaleString()} (100円切上)</div>
                                                            <div className="border-t border-gray-700 mt-1 pt-1">現合計: ¥{rec.debug.slotTotal.toLocaleString()}</div>
                                                            <div className="text-[var(--gold-color)]">差額: ¥{rec.debug.marginal.toLocaleString()}</div>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => onAddOrders(rec.items)}
                                                        className="w-full p-2 rounded-lg bg-transparent border border-[var(--gold-color)] text-[var(--gold-color)] cursor-pointer text-sm font-bold transition-all hover:bg-[var(--gold-color)] hover:text-black"
                                                    >
                                                        ＋ 追加
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-gray-500 text-sm">
                                            追加可能な商品がありません
                                        </div>
                                    )}

                                    {/* あと少しヒント */}
                                    {nearMiss.length > 0 && (
                                        <div className="mt-4 p-3 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[var(--border-color)]">
                                            <h5 className="text-xs font-bold text-gray-400 mb-2">› あと少し予算を上げれば...</h5>
                                            {nearMiss.map((h, i) => (
                                                <div key={i} className="text-sm text-gray-300 mb-1">
                                                    <span className="text-[var(--gold-color)]">{h.name}</span>
                                                    <span className="text-gray-500"> (¥{h.effectivePrice.toLocaleString()}{h.isHalf ? ' 半額' : ''})</span>
                                                    <span className="text-xs text-red-400"> — あと¥{h.over.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* 予算超過の場合 */}
                            {!timeSlots[selectedTimeIdx].isAffordable && (
                                <div className="p-4 text-center">
                                    <div className="text-red-400 text-sm mb-2">この時間まで滞在すると予算を超過します</div>
                                    <div className="text-xs text-gray-500">
                                        1つ前の時間帯を選択するか、予算を引き上げてください
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
