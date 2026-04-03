import React, { useState } from 'react';
import type { BreakdownItem, PriceScheduleItem } from '../hooks/useCalculator';

interface ResultDisplayProps {
    currentTotal: number;
    breakdown: BreakdownItem[];
    previousTotal: number | null;
    previousBreakdown: BreakdownItem[] | null;
    schedule: PriceScheduleItem[];
    taxRate: number;
    currentTime: string;
    isOutOfHours: boolean;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ currentTotal, breakdown, previousTotal, previousBreakdown, schedule, currentTime, isOutOfHours }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showPrevious, setShowPrevious] = useState(false);

    const toggleExpand = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="bg-[rgba(0,10,20,0.8)] rounded-xl p-5 mt-5 border border-[var(--accent-color)] shadow-[0_0_30px_rgba(0,188,212,0.08)]">
            {/* 合計表示 */}
            <div className="text-center mb-4">
                <div className="text-lg font-bold text-white mb-2">
                    {isOutOfHours ? '１時間分の料金' : `現在時刻: ${currentTime}`}
                </div>
                <div className="text-sm text-gray-400">現在のお会計 (税込)</div>
                <div className="text-4xl font-bold text-[var(--accent-color)] mt-1">
                    ¥{currentTotal.toLocaleString()}
                </div>
            </div>

            {/* ワンセット前の料金 */}
            {previousTotal !== null && previousBreakdown && (
                <div className="border-t border-gray-700 pt-3 mb-3">
                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowPrevious(!showPrevious)}>
                        <h4 className="text-sm text-gray-400">1つ前のセット料金 (税込)</h4>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-yellow-400">¥{previousTotal.toLocaleString()}</span>
                            <span className="text-[0.7rem] text-gray-500">{showPrevious ? '▲' : '▼'}</span>
                        </div>
                    </div>
                    {showPrevious && (
                        <div className="mt-2 bg-[rgba(255,255,255,0.03)] rounded-lg p-3">
                            {previousBreakdown.map((item, index) => (
                                <BreakdownRow key={index} label={item.label} amount={item.amount} isTotal={item.isTotal} note={item.note} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* 詳細内訳 */}
            <div className="border-t border-gray-700 pt-4 mb-5">
                <h4 className="text-sm text-gray-400 mb-3">詳細内訳</h4>
                {breakdown.map((item, index) => (
                    <BreakdownRow key={index} label={item.label} amount={item.amount} isTotal={item.isTotal} note={item.note} />
                ))}
            </div>

            {/* 料金スケジュール */}
            <div className="border-t border-gray-700 pt-4">
                <h4 className="text-sm text-gray-400 mb-3">料金スケジュール（タップで内訳表示）</h4>
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-600">
                            <th className="text-left p-2">時間</th>
                            <th className="text-right p-2">合計金額 (税込)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr
                                    onClick={() => toggleExpand(index)}
                                    className={`cursor-pointer transition-colors ${
                                        expandedIndex === index
                                            ? 'bg-[rgba(255,215,0,0.08)]'
                                            : 'hover:bg-[rgba(255,255,255,0.03)] border-b border-gray-800'
                                    }`}
                                >
                                    <td className="p-2 text-white">
                                        〜{item.timeLimit}
                                        <span className="text-[0.7rem] text-gray-500 ml-1.5">
                                            {expandedIndex === index ? '▲' : '▼'}
                                        </span>
                                    </td>
                                    <td className="p-2 text-right text-[var(--accent-color)] font-bold">
                                        ¥{item.totalPrice.toLocaleString()}
                                    </td>
                                </tr>
                                {expandedIndex === index && (
                                    <tr>
                                        <td colSpan={2} className="px-2 pb-3 pl-4">
                                            <div className="bg-[rgba(255,255,255,0.03)] rounded-lg p-3 border-b border-gray-800">
                                                {item.breakdown.map((b, bi) => (
                                                    <BreakdownRow key={bi} label={b.label} amount={b.amount} isTotal={b.isTotal} note={b.note} />
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BreakdownRow: React.FC<{ label: string; amount: number; isTotal?: boolean; note?: string }> = ({ label, amount, isTotal, note }) => {
    if (amount === 0 && !isTotal && !label.includes('セット')) return null;

    return (
        <div className={`flex justify-between items-center mb-2 text-[0.85rem] ${
            isTotal ? 'text-white font-bold border-t border-gray-600 pt-1.5' : 'text-gray-300'
        }`}>
            <div>
                {label}
                {note && <span className="text-[0.7rem] text-gray-500 ml-1.5">{note}</span>}
            </div>
            <div>¥{amount.toLocaleString()}</div>
        </div>
    );
};
