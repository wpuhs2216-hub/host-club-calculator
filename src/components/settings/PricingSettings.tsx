import React from 'react';
import type { StoreConfig, CustomerTypePricing } from '../../types/storeConfig';

interface Props {
    config: StoreConfig;
    onUpdate: (updater: (prev: StoreConfig) => StoreConfig) => void;
}

const NumberInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between py-1.5">
        <span className="text-sm text-gray-300">{label}</span>
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value) || 0)}
            className="w-24 p-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm text-right outline-none focus:border-[var(--gold-color)]" />
    </div>
);

const PricingBlock: React.FC<{ title: string; pricing: CustomerTypePricing; onChange: (p: CustomerTypePricing) => void }> = ({ title, pricing, onChange }) => (
    <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border-color)]">
        <h4 className="text-sm font-bold text-white mb-2">{title}</h4>
        <NumberInput label="セット料金" value={pricing.set} onChange={(v) => onChange({ ...pricing, set: v })} />
        <NumberInput label="延長料金/h" value={pricing.ext} onChange={(v) => onChange({ ...pricing, ext: v })} />
        <NumberInput label="指名料" value={pricing.nom} onChange={(v) => onChange({ ...pricing, nom: v })} />
        <NumberInput label="T.C" value={pricing.tc} onChange={(v) => onChange({ ...pricing, tc: v })} />
    </div>
);

export const PricingSettings: React.FC<Props> = ({ config, onUpdate }) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">客層別料金</h3>
                <div className="flex flex-col gap-3">
                    <PricingBlock title="新規（初回）" pricing={config.initialPricing}
                        onChange={(p) => onUpdate(prev => ({ ...prev, initialPricing: p }))} />
                    <PricingBlock title="R（チケット有り）" pricing={config.rWithinPricing}
                        onChange={(p) => onUpdate(prev => ({ ...prev, rWithinPricing: p }))} />
                    <PricingBlock title="R（チケット無し）" pricing={config.rAfterPricing}
                        onChange={(p) => onUpdate(prev => ({ ...prev, rAfterPricing: p }))} />

                    {/* 正規（特殊） */}
                    <div className="p-3 rounded-lg bg-[var(--input-bg)] border border-[var(--border-color)]">
                        <h4 className="text-sm font-bold text-white mb-2">正規</h4>
                        <NumberInput label={`セット料金（${config.regularPricing.thresholdHour}時前）`}
                            value={config.regularPricing.earlySet}
                            onChange={(v) => onUpdate(prev => ({ ...prev, regularPricing: { ...prev.regularPricing, earlySet: v } }))} />
                        <NumberInput label={`セット料金（${config.regularPricing.thresholdHour}時以降）`}
                            value={config.regularPricing.lateSet}
                            onChange={(v) => onUpdate(prev => ({ ...prev, regularPricing: { ...prev.regularPricing, lateSet: v } }))} />
                        <NumberInput label="早/遅 境界 (時)"
                            value={config.regularPricing.thresholdHour}
                            onChange={(v) => onUpdate(prev => ({ ...prev, regularPricing: { ...prev.regularPricing, thresholdHour: v } }))} />
                        <NumberInput label="延長料金/h"
                            value={config.regularPricing.ext}
                            onChange={(v) => onUpdate(prev => ({ ...prev, regularPricing: { ...prev.regularPricing, ext: v } }))} />
                        <NumberInput label="指名料"
                            value={config.regularPricing.nom}
                            onChange={(v) => onUpdate(prev => ({ ...prev, regularPricing: { ...prev.regularPricing, nom: v } }))} />
                        <NumberInput label="T.C"
                            value={config.regularPricing.tc}
                            onChange={(v) => onUpdate(prev => ({ ...prev, regularPricing: { ...prev.regularPricing, tc: v } }))} />
                    </div>
                </div>
            </div>

            {/* セット料金選択肢 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">新規セット料金の選択肢</h3>
                <div className="flex flex-wrap gap-2">
                    {config.initialSetPriceOptions.map((price, i) => (
                        <input key={i} type="number" value={price}
                            onChange={(e) => {
                                const newOpts = [...config.initialSetPriceOptions];
                                newOpts[i] = Number(e.target.value) || 0;
                                onUpdate(prev => ({ ...prev, initialSetPriceOptions: newOpts }));
                            }}
                            className="w-20 p-2 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-sm text-center outline-none" />
                    ))}
                </div>
            </div>

            {/* 手数料 */}
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <h3 className="text-sm font-bold text-[var(--gold-color)] mb-3">手数料</h3>
                <NumberInput label="同伴料" value={config.dohanFee}
                    onChange={(v) => onUpdate(prev => ({ ...prev, dohanFee: v }))} />
                <NumberInput label="複数指名料（/人）" value={config.additionalNominationFee}
                    onChange={(v) => onUpdate(prev => ({ ...prev, additionalNominationFee: v }))} />
            </div>
        </div>
    );
};
