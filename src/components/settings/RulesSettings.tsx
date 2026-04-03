import React from 'react';
import type { StoreConfig } from '../../types/storeConfig';

interface Props {
    config: StoreConfig;
    onUpdate: (updater: (prev: StoreConfig) => StoreConfig) => void;
}

const NumberInput: React.FC<{ label: string; value: number; onChange: (v: number) => void; step?: number }> = ({ label, value, onChange, step }) => (
    <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-gray-300">{label}</span>
        <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-24 p-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm text-right outline-none focus:border-[var(--gold-color)]" />
    </div>
);

export const RulesSettings: React.FC<Props> = ({ config, onUpdate }) => {
    return (
        <div className="flex flex-col gap-4">
            {/* 税率 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">税率・サービス料</h3>
                <NumberInput label="TAX/SVC率（0.35 = 35%）" value={config.taxRate} step={0.01}
                    onChange={(v) => onUpdate(prev => ({ ...prev, taxRate: v }))} />
                <NumberInput label="初回ドリンク無し時の税率" value={config.initialNoOrderTaxRate} step={0.01}
                    onChange={(v) => onUpdate(prev => ({ ...prev, initialNoOrderTaxRate: v }))} />
            </div>

            {/* 営業時間 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">営業時間</h3>
                <NumberInput label="閉店時間（25 = 翌1:00）" value={config.closingHour}
                    onChange={(v) => onUpdate(prev => ({ ...prev, closingHour: v }))} />
                <NumberInput label="LO延長凍結時間（分）" value={config.loCapNormalizedMins}
                    onChange={(v) => onUpdate(prev => ({ ...prev, loCapNormalizedMins: v }))} />
                <p className="text-xs text-gray-500 mt-1">※ 1478 = 24:38（0:38 AM）</p>
            </div>

            {/* ゴールドチケット */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">ゴールドチケット</h3>
                <NumberInput label="セット料金上書き" value={config.goldTicket.setOverride}
                    onChange={(v) => onUpdate(prev => ({ ...prev, goldTicket: { ...prev.goldTicket, setOverride: v } }))} />
                <NumberInput label="延長料金上書き" value={config.goldTicket.extOverride}
                    onChange={(v) => onUpdate(prev => ({ ...prev, goldTicket: { ...prev.goldTicket, extOverride: v } }))} />
            </div>

            {/* 半額ルール */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">半額ルール</h3>
                <NumberInput label="ブルー〜ゴールド最低額" value={config.halfOffRules.blueToGoldMinPrice}
                    onChange={(v) => onUpdate(prev => ({ ...prev, halfOffRules: { ...prev.halfOffRules, blueToGoldMinPrice: v } }))} />
                <NumberInput label="ブルー〜ゴールド最高額" value={config.halfOffRules.blueToGoldMaxPrice}
                    onChange={(v) => onUpdate(prev => ({ ...prev, halfOffRules: { ...prev.halfOffRules, blueToGoldMaxPrice: v } }))} />
                <NumberInput label="カン半額特殊価格" value={config.halfOffRules.canSpecialPrice}
                    onChange={(v) => onUpdate(prev => ({ ...prev, halfOffRules: { ...prev.halfOffRules, canSpecialPrice: v } }))} />
                <div className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-gray-300">初回/R 1本制限</span>
                    <input type="checkbox" checked={config.halfOffRules.initialROneBottleLimit}
                        onChange={(e) => onUpdate(prev => ({ ...prev, halfOffRules: { ...prev.halfOffRules, initialROneBottleLimit: e.target.checked } }))}
                        className="accent-[var(--gold-color)]" />
                </div>

                <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                    <h4 className="text-xs text-gray-400 mb-2">半額対象シャンパン名</h4>
                    <div className="flex flex-wrap gap-1">
                        {config.halfOffRules.champagneNames.map((name, i) => (
                            <span key={i} className="px-2 py-1 rounded bg-[var(--input-bg)] text-xs text-gray-300 border border-[var(--border-color)]">
                                {name}
                                <button onClick={() => {
                                    const newNames = config.halfOffRules.champagneNames.filter((_, j) => j !== i);
                                    onUpdate(prev => ({ ...prev, halfOffRules: { ...prev.halfOffRules, champagneNames: newNames } }));
                                }} className="ml-1 text-red-500 bg-transparent border-none cursor-pointer">✕</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
