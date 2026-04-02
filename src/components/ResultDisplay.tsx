import React from 'react';
import type { BreakdownItem, PriceScheduleItem } from '../hooks/useCalculator';

interface ResultDisplayProps {
    currentTotal: number;
    breakdown: BreakdownItem[];
    schedule: PriceScheduleItem[];
    taxRate: number;
    currentTime: string; // V4: Display Current Time
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ currentTotal, breakdown, schedule, currentTime }) => {
    return (
        <div style={{
            background: '#000',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginTop: '20px',
            border: '1px solid var(--accent-color)'
        }}>
            <div className="text-center mb-4">
                {/* Current Time Display */}
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                    現在時刻: {currentTime}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#aaa' }}>現在のお会計 (税込)</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    ¥{currentTotal.toLocaleString()}
                </div>
            </div>

            {/* Breakdown Table */}
            <div style={{ borderTop: '1px solid #333', paddingTop: '15px', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>詳細内訳</h4>
                {breakdown.map((item, index) => (
                    <BreakdownRow
                        key={index}
                        label={item.label}
                        amount={item.amount}
                        isTotal={item.isTotal}
                        note={item.note}
                    />
                ))}
            </div>

            {/* Price Schedule Table */}
            <div style={{ borderTop: '1px solid #333', paddingTop: '15px' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '10px' }}>料金スケジュール</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        <tr style={{ color: '#aaa', borderBottom: '1px solid #444' }}>
                            <th style={{ textAlign: 'left', padding: '8px' }}>時間</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>合計金額 (税込)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedule.map((item, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #222' }}>
                                <td style={{ padding: '8px', color: '#fff' }}>〜{item.timeLimit}</td>
                                <td style={{ padding: '8px', textAlign: 'right', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                                    ¥{item.totalPrice.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BreakdownRow: React.FC<{ label: string; amount: number; isTotal?: boolean; note?: string }> = ({ label, amount, isTotal, note }) => {
    // Show even if 0 for some items? Or hide? 
    // Let's hide 0 amount items unless it's Total or specifically important.
    // But for "Set Fee" it might be 0 if R-Within?
    if (amount === 0 && !isTotal && !label.includes('セット')) return null;

    return (
        <div className="flex justify-between items-center mb-2" style={{
            color: isTotal ? '#fff' : '#ccc',
            fontWeight: isTotal ? 'bold' : 'normal',
            borderTop: isTotal ? '1px solid #444' : 'none',
            paddingTop: isTotal ? '5px' : '0'
        }}>
            <div>
                {label}
                {note && <span style={{ fontSize: '0.7rem', color: '#666', marginLeft: '5px' }}>{note}</span>}
            </div>
            <div>¥{amount.toLocaleString()}</div>
        </div>
    );
};
