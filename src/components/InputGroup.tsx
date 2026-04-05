import { useState } from 'react';
import type { CustomerType } from '../hooks/useCalculator';
import { Collapsible } from './Collapsible';
import { ButtonTimePicker } from './ButtonTimePicker';

type MainCategory = 'initial' | 'r' | 'regular';

interface InputGroupProps {
    customerType: CustomerType;
    initialSetPrice: number;
    entryTime: string;
    dohan: boolean;
    isSetHalfOff: boolean;
    isGirlsParty: boolean;
    isAppreciationDay: boolean;
    isSevenLuck: boolean;
    isGoldTicket: boolean;
    additionalNominationCount: number;
    onCustomerTypeChange: (type: CustomerType) => void;
    onInitialSetPriceChange: (price: number) => void;
    onEntryTimeChange: (time: string) => void;
    onDohanToggle: () => void;
    onSetHalfOffToggle: () => void;
    onGirlsPartyToggle: () => void;
    onAppreciationDayToggle: () => void;
    onSevenLuckToggle: () => void;
    onGoldTicketToggle: () => void;
    onAdditionalNominationCountChange: (count: number) => void;
}

// 大カテゴリからCustomerTypeへのマッピング
const getMainCategory = (customerType: CustomerType): MainCategory => {
    if (customerType === 'initial') return 'initial';
    if (customerType === 'r_within' || customerType === 'r_after') return 'r';
    return 'regular';
};

export const InputGroup: React.FC<InputGroupProps> = ({
    customerType,
    initialSetPrice,
    entryTime,
    dohan,
    isSetHalfOff,
    isGirlsParty,
    isAppreciationDay,
    isSevenLuck,
    isGoldTicket,
    additionalNominationCount,
    onCustomerTypeChange,
    onInitialSetPriceChange,
    onEntryTimeChange,
    onDohanToggle,
    onSetHalfOffToggle,
    onGirlsPartyToggle,
    onAppreciationDayToggle,
    onSevenLuckToggle,
    onGoldTicketToggle,
    onAdditionalNominationCountChange
}) => {
    const mainCategory = getMainCategory(customerType);

    const handleMainCategoryChange = (cat: MainCategory) => {
        if (cat === 'initial') onCustomerTypeChange('initial');
        else if (cat === 'r') onCustomerTypeChange('r_within');
        else onCustomerTypeChange('regular');
    };

    const mainCategories: { value: MainCategory; label: string }[] = [
        { value: 'initial', label: '新規' },
        { value: 'r', label: 'R' },
        { value: 'regular', label: '正規' },
    ];

    const initialPriceOptions = [0, 1000, 3000, 5000];

    return (
        <div className="card">
            <h3 className="mb-4">基本情報</h3>

            {/* システム - 大カテゴリ */}
            <div className="mb-4">
                <label className="block mb-2 font-bold text-[var(--gold-color)]">
                    システム
                </label>
                <div className="flex gap-2">
                    {mainCategories.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => handleMainCategoryChange(cat.value)}
                            className={`flex-1 p-3 rounded-md font-bold text-base transition-all duration-200 border ${
                                mainCategory === cat.value
                                    ? 'border-[var(--gold-color)] bg-[var(--gold-color)] text-black'
                                    : 'border-[var(--border-color)] bg-[var(--input-bg)] text-white hover:border-gray-400'
                            }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* サブ選択: 新規 → セット料金 */}
            {mainCategory === 'initial' && (
                <div className="mb-4">
                    <label className="block mb-2 font-bold text-[var(--gold-color)] text-sm">
                        セット料金
                    </label>
                    <div className="flex gap-1.5 flex-wrap sm:flex-nowrap">
                        {initialPriceOptions.map((price) => (
                            <button
                                key={price}
                                onClick={() => onInitialSetPriceChange(price)}
                                className={`flex-1 p-2 rounded-md text-sm transition-all duration-200 border ${
                                    initialSetPrice === price
                                        ? 'border-[var(--gold-color)] bg-[rgba(255,215,0,0.2)] text-[var(--gold-color)] font-bold'
                                        : 'border-[var(--border-color)] bg-[var(--input-bg)] text-white font-normal hover:border-gray-400'
                                }`}
                            >
                                ¥{price.toLocaleString()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* サブ選択: R → チケット有り/無し */}
            {mainCategory === 'r' && (
                <div className="mb-4">
                    <label className="block mb-2 font-bold text-[var(--gold-color)] text-sm">
                        チケット
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onCustomerTypeChange('r_within')}
                            className={`flex-1 p-3 rounded-md text-[0.95rem] transition-all duration-200 border ${
                                customerType === 'r_within'
                                    ? 'border-[var(--gold-color)] bg-[rgba(255,215,0,0.2)] text-[var(--gold-color)] font-bold'
                                    : 'border-[var(--border-color)] bg-[var(--input-bg)] text-white font-normal hover:border-gray-400'
                            }`}
                        >
                            チケット有り
                        </button>
                        <button
                            onClick={() => onCustomerTypeChange('r_after')}
                            className={`flex-1 p-3 rounded-md text-[0.95rem] transition-all duration-200 border ${
                                customerType === 'r_after'
                                    ? 'border-[var(--gold-color)] bg-[rgba(255,215,0,0.2)] text-[var(--gold-color)] font-bold'
                                    : 'border-[var(--border-color)] bg-[var(--input-bg)] text-white font-normal hover:border-gray-400'
                            }`}
                        >
                            チケット無し
                        </button>
                    </div>
                </div>
            )}

            <TimeInput
                label="入店時間"
                value={entryTime}
                onChange={onEntryTimeChange}
                displayFormat
            />

            <Toggle
                label="同伴"
                checked={dohan}
                onChange={onDohanToggle}
                price={3000}
            />

            <Collapsible title="◈ 割引オプション">
                <Toggle
                    label="セット料金半額"
                    checked={isSetHalfOff}
                    onChange={onSetHalfOffToggle}
                />
                <Toggle
                    label="女子会デー"
                    checked={isGirlsParty}
                    onChange={onGirlsPartyToggle}
                />
                <Toggle
                    label="お客様感謝DAY"
                    checked={isAppreciationDay}
                    onChange={onAppreciationDayToggle}
                />
                <Toggle
                    label="セブンラック"
                    checked={isSevenLuck}
                    onChange={onSevenLuckToggle}
                />
                <Toggle
                    label="ゴールドチケット"
                    checked={isGoldTicket}
                    onChange={onGoldTicketToggle}
                />

                <div className="mb-4">
                    <label className="block mb-2 font-bold text-[var(--gold-color)]">
                        複数指名 (人数)
                    </label>
                    <div className="flex items-center gap-4 bg-[var(--input-bg)] p-3 rounded-md border border-[var(--border-color)]">
                        <button
                            onClick={() => onAdditionalNominationCountChange(Math.max(0, additionalNominationCount - 1))}
                            className="w-10 h-10 rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] text-white text-xl flex items-center justify-center hover:bg-gray-600 transition-colors"
                        >
                            -
                        </button>
                        <div className="text-xl font-bold min-w-[30px] text-center">
                            {additionalNominationCount}
                        </div>
                        <button
                            onClick={() => onAdditionalNominationCountChange(additionalNominationCount + 1)}
                            className="w-10 h-10 rounded-md border-none bg-[var(--gold-color)] text-black text-xl flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
                        >
                            +
                        </button>
                        <div className="text-sm text-gray-400 ml-auto">
                            +¥{(additionalNominationCount * 3000).toLocaleString()}
                        </div>
                    </div>
                </div>
            </Collapsible>
        </div>
    );
};

interface TimeInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    displayFormat?: boolean;
}

export const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="mb-4">
                <ButtonTimePicker
                    label={label}
                    value={value}
                    onChange={(time) => {
                        onChange(time);
                        setIsEditing(false);
                    }}
                    onCancel={() => setIsEditing(false)}
                />
            </div>
        );
    }

    return (
        <div className="mb-4">
            <label className="block mb-2 font-bold text-[var(--gold-color)]">
                {label}
            </label>
            <button
                onClick={() => setIsEditing(true)}
                className="w-full p-3 rounded-md border border-[var(--border-color)] bg-[var(--input-bg)] text-white text-base text-left outline-none cursor-pointer hover:border-[var(--gold-color)] transition-colors font-mono tracking-wider"
            >
                {value || '--:--'}
            </button>
        </div>
    );
};

interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: () => void;
    price?: number;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, price }) => {
    return (
        <div 
            className={`mb-4 flex justify-between items-center cursor-pointer bg-[var(--input-bg)] p-3 rounded-md border transition-all duration-200 select-none ${
                checked ? 'border-[var(--gold-color)] shadow-[0_0_8px_rgba(212,175,55,0.2)]' : 'border-[var(--border-color)] hover:border-gray-500'
            }`}
            onClick={onChange}
        >
            <div>
                <div className="font-bold">{label}</div>
                {price && <div className="text-xs text-gray-400 mt-1">+¥{price.toLocaleString()}</div>}
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                checked ? 'border-[var(--gold-color)] bg-[var(--gold-color)]' : 'border-[var(--gold-color)] bg-transparent'
            }`}>
                {checked && <span className="text-black font-bold text-sm leading-none">✓</span>}
            </div>
        </div>
    );
};
