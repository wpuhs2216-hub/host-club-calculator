import { useState, useCallback, useEffect } from 'react';

interface ButtonTimePickerProps {
  value?: string;
  onChange: (time: string) => void;
  onCancel?: () => void;
  label?: string;
}

type Step = 1 | 2 | 3;

const HOURS = [20, 21, 22, 23, 24];
const MINUTE_TENS = [0, 1, 2, 3, 4, 5];
const MINUTE_ONES_ROW1 = [0, 1, 2, 3, 4];
const MINUTE_ONES_ROW2 = [5, 6, 7, 8, 9];

export const ButtonTimePicker: React.FC<ButtonTimePickerProps> = ({
  value,
  onChange,
  onCancel,
  label,
}) => {
  const [step, setStep] = useState<Step>(1);
  const [hour, setHour] = useState<number | null>(null);
  const [minuteTens, setMinuteTens] = useState<number | null>(null);
  const [minuteOnes, setMinuteOnes] = useState<number | null>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        setHour(h);
        setMinuteTens(Math.floor(m / 10));
        setMinuteOnes(m % 10);
      }
    }
  }, [value]);

  const formatPreview = () => {
    const hStr = hour !== null ? String(hour).padStart(2, '0') : '__';
    const tStr = minuteTens !== null ? String(minuteTens) : '_';
    const oStr = minuteOnes !== null ? String(minuteOnes) : '_';
    return `${hStr} : ${tStr}${oStr}`;
  };

  const handleHourSelect = useCallback((h: number) => {
    setHour(h);
    setStep(2);
  }, []);

  const handleMinuteTensSelect = useCallback((t: number) => {
    setMinuteTens(t);
    setStep(3);
  }, []);

  const handleMinuteOnesSelect = useCallback((o: number) => {
    setMinuteOnes(o);
  }, []);

  // Fire onChange when all three parts are set
  useEffect(() => {
    if (hour !== null && minuteTens !== null && minuteOnes !== null) {
      const hStr = String(hour).padStart(2, '0');
      const mStr = `${minuteTens}${minuteOnes}`;
      onChange(`${hStr}:${mStr}`);
    }
  }, [hour, minuteTens, minuteOnes, onChange]);

  const handleBack = () => {
    if (step === 2) {
      setHour(null);
      setStep(1);
    } else if (step === 3) {
      setMinuteTens(null);
      setStep(2);
    }
  };

  const btnBase =
    'min-w-[48px] min-h-[48px] rounded-md font-bold text-base transition-all duration-200 border cursor-pointer';
  const btnSelected =
    'bg-blue-600 text-white border-blue-600';
  const btnUnselected =
    'border-gray-600 text-gray-200 bg-transparent hover:border-gray-400';

  const stepDot = (active: boolean) =>
    `w-2.5 h-2.5 rounded-full ${active ? 'bg-blue-500' : 'bg-gray-600'}`;

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
      {/* Label */}
      {label && (
        <label className="block mb-2 font-bold text-[var(--gold-color)]">
          {label}
        </label>
      )}

      {/* Step indicator dots */}
      <div className="flex justify-center gap-2 mb-3">
        <span className={stepDot(step >= 1)} />
        <span className={stepDot(step >= 2)} />
        <span className={stepDot(step >= 3)} />
      </div>

      {/* Time preview */}
      <div className="text-3xl font-mono font-bold text-center mb-4 tracking-widest">
        {formatPreview()}
      </div>

      {/* Back / Cancel row */}
      <div className="flex justify-between items-center mb-3 min-h-[36px]">
        {step > 1 ? (
          <button
            onClick={handleBack}
            className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer bg-transparent border-none"
          >
            ← 戻る
          </button>
        ) : (
          <span />
        )}
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-sm text-gray-400 hover:text-gray-200 cursor-pointer bg-transparent border-none"
          >
            キャンセル
          </button>
        )}
      </div>

      {/* Step 1: Hour */}
      {step === 1 && (
        <div className="flex gap-2 justify-center">
          {HOURS.map((h) => (
            <button
              key={h}
              onClick={() => handleHourSelect(h)}
              className={`${btnBase} flex-1 ${hour === h ? btnSelected : btnUnselected}`}
            >
              {h}
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Minute tens */}
      {step === 2 && (
        <div className="flex gap-2 justify-center">
          {MINUTE_TENS.map((t) => (
            <button
              key={t}
              onClick={() => handleMinuteTensSelect(t)}
              className={`${btnBase} flex-1 ${minuteTens === t ? btnSelected : btnUnselected}`}
            >
              {t}_
            </button>
          ))}
        </div>
      )}

      {/* Step 3: Minute ones */}
      {step === 3 && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2 justify-center">
            {MINUTE_ONES_ROW1.map((o) => (
              <button
                key={o}
                onClick={() => handleMinuteOnesSelect(o)}
                className={`${btnBase} flex-1 ${minuteOnes === o ? btnSelected : btnUnselected}`}
              >
                {o}
              </button>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            {MINUTE_ONES_ROW2.map((o) => (
              <button
                key={o}
                onClick={() => handleMinuteOnesSelect(o)}
                className={`${btnBase} flex-1 ${minuteOnes === o ? btnSelected : btnUnselected}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
