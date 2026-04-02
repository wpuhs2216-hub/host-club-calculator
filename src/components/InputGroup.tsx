import type { CustomerType } from '../hooks/useCalculator';

// ... (keep existing components)

interface InputGroupProps {
    customerType: CustomerType;
    entryTime: string;
    dohan: boolean;
    isSetHalfOff: boolean;
    isGirlsParty: boolean;
    isAppreciationDay: boolean;
    isFirstLady: boolean;
    additionalNominationCount: number;
    onCustomerTypeChange: (type: CustomerType) => void;
    onEntryTimeChange: (time: string) => void;
    onDohanToggle: () => void;
    onSetHalfOffToggle: () => void;
    onGirlsPartyToggle: () => void;
    onAppreciationDayToggle: () => void;
    onFirstLadyToggle: () => void;
    onAdditionalNominationCountChange: (count: number) => void;
}

export const InputGroup: React.FC<InputGroupProps> = ({
    customerType,
    entryTime,
    dohan,
    isSetHalfOff,
    isGirlsParty,
    isAppreciationDay,
    isFirstLady,
    additionalNominationCount,
    onCustomerTypeChange,
    onEntryTimeChange,
    onDohanToggle,
    onSetHalfOffToggle,
    onGirlsPartyToggle,
    onAppreciationDayToggle,
    onFirstLadyToggle,
    onAdditionalNominationCountChange
}) => {
    return (
        <div className="card">
            <h3 className="mb-4">基本情報</h3>
            <SelectGroup
                label="システム"
                value={customerType}
                options={[
                    { value: 'initial', label: '新規' },
                    { value: 'r_within', label: 'R (二週間以内)' },
                    { value: 'r_after', label: 'R (二週間以降)' },
                    { value: 'regular', label: '正規' },
                ]}
                onChange={(val) => onCustomerTypeChange(val as CustomerType)}
            />
            <TimeInput
                label="入店時間"
                value={entryTime}
                onChange={onEntryTimeChange}
            />

            {/* Option Header */}
            <div style={{
                marginTop: '16px',
                marginBottom: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: 'var(--gold-color)'
            }}>
                オプション
            </div>

            <Toggle
                label="同伴"
                checked={dohan}
                onChange={onDohanToggle}
                price={3000}
            />
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
                label="ファーストレディ"
                checked={isFirstLady}
                onChange={onFirstLadyToggle}
            />

            <div className="mb-4">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    複数指名 (人数)
                </label>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onAdditionalNominationCountChange(additionalNominationCount - 1)}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                            background: 'var(--input-bg)',
                            color: 'var(--text-color)',
                            fontSize: '1.2rem',
                            cursor: 'pointer'
                        }}
                    >
                        -
                    </button>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '30px', textAlign: 'center' }}>
                        {additionalNominationCount}
                    </div>
                    <button
                        onClick={() => onAdditionalNominationCountChange(additionalNominationCount + 1)}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-md)',
                            border: 'none',
                            background: 'var(--accent-color)',
                            color: '#000',
                            fontSize: '1.2rem',
                            cursor: 'pointer'
                        }}
                    >
                        +
                    </button>
                    <div style={{ fontSize: '0.9rem', color: '#aaa', marginLeft: 'auto' }}>
                        +¥{(additionalNominationCount * 3000).toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface SelectGroupProps {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

export const SelectGroup: React.FC<SelectGroupProps> = ({ label, value, options, onChange }) => {
    return (
        <div className="mb-4">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
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
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

interface TimeInputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
}

export const TimeInput: React.FC<TimeInputProps> = ({ label, value, onChange }) => {
    return (
        <div className="mb-4">
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                {label}
            </label>
            <input
                type="time"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--input-bg)',
                    color: 'var(--text-color)',
                    fontSize: '1rem',
                    outline: 'none',
                    colorScheme: 'dark',
                }}
            />
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
        <div className="mb-4 flex justify-between items-center"
            onClick={onChange}
            style={{
                cursor: 'pointer',
                background: 'var(--input-bg)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                border: checked ? '1px solid var(--accent-color)' : '1px solid var(--border-color)'
            }}>
            <div>
                <div style={{ fontWeight: 'bold' }}>{label}</div>
                {price && <div style={{ fontSize: '0.8rem', color: '#aaa' }}>+¥{price.toLocaleString()}</div>}
            </div>
            <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid var(--accent-color)',
                background: checked ? 'var(--accent-color)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {checked && <span style={{ color: '#000', fontWeight: 'bold' }}>✓</span>}
            </div>
        </div>
    );
};
