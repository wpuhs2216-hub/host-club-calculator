import React, { useState } from 'react';
import type { BreakdownItem, PriceScheduleItem } from '../hooks/useCalculator';
import { ButtonTimePicker } from './ButtonTimePicker';

interface ResultDisplayProps {
    currentTotal: number;
    breakdown: BreakdownItem[];
    previousTotal: number | null;
    previousBreakdown: BreakdownItem[] | null;
    schedule: PriceScheduleItem[];
    taxRate: number;
    currentTime: string;
    isOutOfHours: boolean;
    onTimeOverride?: (time: string | null) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ currentTotal, breakdown, previousTotal, previousBreakdown, schedule, currentTime, isOutOfHours, onTimeOverride }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showPrevious, setShowPrevious] = useState(false);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [isEditingTime, setIsEditingTime] = useState(false);

    // ButtonTimePicker表示中は他を隠す
    if (isEditingTime) {
        return (
            <div className="bg-[rgba(0,10,20,0.8)] rounded-xl p-5 border border-[var(--accent-color)] shadow-[0_0_30px_rgba(0,188,212,0.08)]">
                <div className="text-sm text-gray-400 mb-3 text-center">会計時刻を設定</div>
                <ButtonTimePicker
                    value={currentTime}
                    onChange={(time) => {
                        onTimeOverride?.(time);
                        setIsEditingTime(false);
                    }}
                    onCancel={() => { setIsEditingTime(false); onTimeOverride?.(null); }}
                />
            </div>
        );
    }

    return (
        <div className="bg-[rgba(0,10,20,0.8)] rounded-xl p-4 border border-[var(--accent-color)] shadow-[0_0_30px_rgba(0,188,212,0.08)]">
            {/* 時刻 + 合計 */}
            <div className="text-center mb-3">
                <div className="text-xs text-gray-400 mb-1">
                    {isOutOfHours ? '営業時間外（1時間分）' : (
                        <span className="cursor-pointer hover:text-[var(--accent-color)] transition-colors" onClick={() => setIsEditingTime(true)}>
                            {currentTime} ✎
                        </span>
                    )}
                </div>
                <div className="text-4xl font-bold text-[var(--accent-color)]">
                    ¥{currentTotal.toLocaleString()}
                </div>
                <div className="text-[0.7rem] text-gray-500 mt-0.5">現在のお会計 (税込)</div>
            </div>

            {/* 前セット（1行インライン） */}
            {previousTotal !== null && previousBreakdown && (
                <div className="border-t border-gray-700/50 py-2">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowPrevious(!showPrevious)}>
                        <span className="text-xs text-gray-400">1つ前</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-bold text-yellow-400">¥{previousTotal.toLocaleString()}</span>
                            <span className="text-[0.6rem] text-gray-500">{showPrevious ? '▲' : '▼'}</span>
                        </div>
                    </div>
                    {showPrevious && (
                        <div className="mt-2 bg-[rgba(255,255,255,0.03)] rounded-lg p-2">
                            {previousBreakdown.map((item, index) => (
                                <BreakdownRow key={index} label={item.label} amount={item.amount} isTotal={item.isTotal} note={item.note} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 内訳（折りたたみ） */}
            <div className="border-t border-gray-700/50 py-2">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowBreakdown(!showBreakdown)}>
                    <span className="text-xs text-gray-400">内訳</span>
                    <span className="text-[0.6rem] text-gray-500">{showBreakdown ? '▲' : '▼'}</span>
                </div>
                {showBreakdown && (
                    <div className="mt-2 bg-[rgba(255,255,255,0.03)] rounded-lg p-2">
                        {breakdown.map((item, index) => (
                            <BreakdownRow key={index} label={item.label} amount={item.amount} isTotal={item.isTotal} note={item.note} />
                        ))}
                    </div>
                )}
            </div>

            {/* 料金スケジュール（コンパクト） */}
            <div className="border-t border-gray-700/50 pt-2">
                <div className="text-xs text-gray-400 mb-2">料金スケジュール</div>
                <div className="flex flex-col">
                    {schedule.map((item, index) => {
                        const isExpanded = expandedIndex === index;
                        return (
                            <React.Fragment key={index}>
                                <div
                                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                                    className={`flex justify-between items-center py-1.5 px-1 cursor-pointer rounded transition-colors text-sm ${
                                        isExpanded ? 'bg-[rgba(255,215,0,0.08)]' : 'hover:bg-[rgba(255,255,255,0.03)]'
                                    }`}
                                >
                                    <span className="text-gray-300 text-xs">
                                        〜{item.timeLimit}
                                        <span className="text-[0.6rem] text-gray-600 ml-1">{isExpanded ? '▲' : '▼'}</span>
                                    </span>
                                    <span className="text-[var(--accent-color)] font-bold text-sm">
                                        ¥{item.totalPrice.toLocaleString()}
                                    </span>
                                </div>
                                {isExpanded && (
                                    <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-2 mb-1 ml-2">
                                        {item.breakdown.map((b, bi) => (
                                            <BreakdownRow key={bi} label={b.label} amount={b.amount} isTotal={b.isTotal} note={b.note} />
                                        ))}
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const BreakdownRow: React.FC<{ label: string; amount: number; isTotal?: boolean; note?: string }> = ({ label, amount, isTotal, note }) => {
    if (amount === 0 && !isTotal && !label.includes('セット')) return null;

    return (
        <div className={`flex justify-between items-center mb-1 text-xs ${
            isTotal ? 'text-white font-bold border-t border-gray-600 pt-1' : 'text-gray-300'
        }`}>
            <div>
                {label}
                {note && <span className="text-[0.6rem] text-gray-500 ml-1">{note}</span>}
            </div>
            <div>¥{amount.toLocaleString()}</div>
        </div>
    );
};
