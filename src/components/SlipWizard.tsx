import React from 'react';
import type { CustomerType, Action, CalculatorState } from '../hooks/useCalculator';
import type { StoreConfig } from '../types/storeConfig';
import { ButtonTimePicker } from './ButtonTimePicker';
import { OrderSection } from './OrderSection';

interface SlipWizardProps {
  state: CalculatorState;
  dispatch: (action: Action) => void;
  wizardStep: number;
  onStepChange: (step: number) => void;
  onComplete: () => void;
  config: StoreConfig;
  onAddOrder: (name: string, price: number, isTaxIncluded?: boolean, canHalfOff?: boolean, isHalfOff?: boolean) => void;
}

const WizardToggle = ({ label, checked, onChange, price }: { label: string; checked: boolean; onChange: () => void; price?: number }) => (
  <div
    className={`mb-3 flex justify-between items-center cursor-pointer bg-[var(--input-bg)] p-3 rounded-md border transition-all duration-200 select-none ${
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

const STEP_LABELS: Record<number, string> = {
  1: '客種選択',
  2: 'セット料金',
  3: '入店時間',
  4: 'オプション',
  5: '注文入力',
};

const INITIAL_SET_PRICES = [0, 1000, 3000, 5000];

export const SlipWizard: React.FC<SlipWizardProps> = ({
  state,
  dispatch,
  wizardStep,
  onStepChange,
  onComplete,
  config,
  onAddOrder,
}) => {
  const isInitial = state.customerType === 'initial';
  const totalSteps = isInitial ? 5 : 4;

  // Map internal step (1-5) to display step number, skipping step 2 for non-initial
  const getDisplayStep = (internalStep: number): number => {
    if (isInitial) return internalStep;
    if (internalStep <= 1) return 1;
    // Steps 3,4,5 become 2,3,4
    return internalStep - 1;
  };

  // Get all visible internal steps
  const visibleSteps = isInitial ? [1, 2, 3, 4, 5] : [1, 3, 4, 5];

  const displayStep = getDisplayStep(wizardStep);
  const stepLabel = STEP_LABELS[wizardStep];

  const goNext = () => {
    if (wizardStep === 5) {
      onComplete();
      return;
    }
    let next = wizardStep + 1;
    // Skip step 2 if not initial
    if (next === 2 && !isInitial) next = 3;
    onStepChange(next);
  };

  const goBack = () => {
    let prev = wizardStep - 1;
    // Skip step 2 when going back if not initial
    if (prev === 2 && !isInitial) prev = 1;
    if (prev >= 1) onStepChange(prev);
  };

  const handleCustomerMainSelect = (type: 'initial' | 'r' | 'regular') => {
    if (type === 'initial') {
      dispatch({ type: 'SET_CUSTOMER_TYPE', payload: 'initial' });
      // Auto-advance: step 2 is for initial set price
      onStepChange(2);
    } else if (type === 'regular') {
      dispatch({ type: 'SET_CUSTOMER_TYPE', payload: 'regular' });
      // Auto-advance, skip step 2
      onStepChange(3);
    }
    // 'r' shows sub-buttons, no auto-advance
  };

  const handleRSubSelect = (type: CustomerType) => {
    dispatch({ type: 'SET_CUSTOMER_TYPE', payload: type });
    // Auto-advance, skip step 2
    onStepChange(3);
  };

  const handleInitialSetPrice = (price: number) => {
    dispatch({ type: 'SET_INITIAL_SET_PRICE', payload: price });
    goNext();
  };

  const [showRSub, setShowRSub] = React.useState(false);

  // Reset R sub-selection when entering step 1
  React.useEffect(() => {
    if (wizardStep === 1) {
      setShowRSub(false);
    }
  }, [wizardStep]);

  const selectionBtnBase = 'rounded-xl border-2 p-4 font-bold text-lg transition-all duration-200 cursor-pointer';
  const selectionBtnActive = 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]';
  const selectionBtnInactive = 'border-[var(--border-color)] bg-[var(--input-bg)] text-white hover:border-gray-400';

  // Navigate to a completed step via dot tap
  const handleDotNav = (internalStep: number) => {
    // Only allow navigation to completed steps (before current) or current
    const currentIdx = visibleSteps.indexOf(wizardStep);
    const targetIdx = visibleSteps.indexOf(internalStep);
    if (targetIdx <= currentIdx) {
      onStepChange(internalStep);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 flex flex-col">
      {/* Step indicator */}
      <div className="mb-4">
        <div className="flex justify-center gap-2 mb-2">
          {visibleSteps.map((s, i) => {
            const currentIdx = visibleSteps.indexOf(wizardStep);
            const isCurrent = s === wizardStep;
            const isCompleted = i < currentIdx;
            return (
              <button
                key={s}
                onClick={() => handleDotNav(s)}
                className={`w-3 h-3 rounded-full border-none cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-[var(--gold-color)]'
                    : isCompleted
                      ? 'bg-[var(--gold-color)] opacity-50'
                      : 'bg-gray-600'
                }`}
                aria-label={`Step ${i + 1}`}
              />
            );
          })}
        </div>
        <div className="text-center text-sm text-gray-400">
          {displayStep}/{totalSteps} {stepLabel}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0">
        {/* Step 1: Customer Type */}
        {wizardStep === 1 && (
          <div>
            <h3 className="text-[var(--gold-color)] font-bold mb-4 text-center">客種選択</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <button
                className={`${selectionBtnBase} ${state.customerType === 'initial' ? selectionBtnActive : selectionBtnInactive}`}
                onClick={() => handleCustomerMainSelect('initial')}
              >
                新規
              </button>
              <button
                className={`${selectionBtnBase} ${showRSub || state.customerType === 'r_within' || state.customerType === 'r_after' ? selectionBtnActive : selectionBtnInactive}`}
                onClick={() => setShowRSub(true)}
              >
                R
              </button>
              <button
                className={`${selectionBtnBase} ${state.customerType === 'regular' ? selectionBtnActive : selectionBtnInactive}`}
                onClick={() => handleCustomerMainSelect('regular')}
              >
                正規
              </button>
            </div>
            {showRSub && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  className={`${selectionBtnBase} ${state.customerType === 'r_within' ? selectionBtnActive : selectionBtnInactive}`}
                  onClick={() => handleRSubSelect('r_within')}
                >
                  チケット有り
                </button>
                <button
                  className={`${selectionBtnBase} ${state.customerType === 'r_after' ? selectionBtnActive : selectionBtnInactive}`}
                  onClick={() => handleRSubSelect('r_after')}
                >
                  チケット無し
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Initial Set Price (only for initial) */}
        {wizardStep === 2 && isInitial && (
          <div>
            <h3 className="text-[var(--gold-color)] font-bold mb-4 text-center">新規セット料金</h3>
            <div className="grid grid-cols-2 gap-3">
              {INITIAL_SET_PRICES.map((price) => (
                <button
                  key={price}
                  className={`${selectionBtnBase} ${state.initialSetPrice === price ? selectionBtnActive : selectionBtnInactive}`}
                  onClick={() => handleInitialSetPrice(price)}
                >
                  ¥{price.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Entry Time */}
        {wizardStep === 3 && (
          <div>
            <h3 className="text-[var(--gold-color)] font-bold mb-4 text-center">入店時間</h3>
            <ButtonTimePicker
              label="入店時間"
              value={state.entryTime}
              onChange={(time) => dispatch({ type: 'SET_ENTRY_TIME', payload: time })}
            />
          </div>
        )}

        {/* Step 4: Options */}
        {wizardStep === 4 && (
          <div>
            <h3 className="text-[var(--gold-color)] font-bold mb-4 text-center">同伴・イベント・オプション</h3>
            <WizardToggle
              label="同伴"
              checked={state.dohan}
              onChange={() => dispatch({ type: 'TOGGLE_DOHAN' })}
              price={config.dohanFee}
            />
            <WizardToggle
              label="セット料金半額"
              checked={state.isSetHalfOff}
              onChange={() => dispatch({ type: 'TOGGLE_SET_HALF_OFF' })}
            />
            <WizardToggle
              label="女子会デー"
              checked={state.isGirlsParty}
              onChange={() => dispatch({ type: 'TOGGLE_GIRLS_PARTY' })}
            />
            <WizardToggle
              label="お客様感謝DAY"
              checked={state.isAppreciationDay}
              onChange={() => dispatch({ type: 'TOGGLE_APPRECIATION_DAY' })}
            />
            <WizardToggle
              label="セブンラック"
              checked={state.isSevenLuck}
              onChange={() => dispatch({ type: 'TOGGLE_SEVEN_LUCK' })}
            />
            <WizardToggle
              label="ゴールドカード"
              checked={state.isGoldTicket}
              onChange={() => dispatch({ type: 'TOGGLE_GOLD_TICKET' })}
            />

            {/* Additional nomination counter */}
            <div className="mb-3 flex justify-between items-center bg-[var(--input-bg)] p-3 rounded-md border border-[var(--border-color)]">
              <div className="font-bold">複数指名</div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => dispatch({ type: 'SET_ADDITIONAL_NOMINATION_COUNT', payload: state.additionalNominationCount - 1 })}
                  className="w-8 h-8 rounded-full border border-[var(--border-color)] bg-transparent text-white flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                >
                  -
                </button>
                <span className="font-bold text-lg min-w-[2ch] text-center">{state.additionalNominationCount}</span>
                <button
                  onClick={() => dispatch({ type: 'SET_ADDITIONAL_NOMINATION_COUNT', payload: state.additionalNominationCount + 1 })}
                  className="w-8 h-8 rounded-full border-none bg-[var(--gold-color)] text-black flex items-center justify-center cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Orders */}
        {wizardStep === 5 && (
          <div>
            <h3 className="text-[var(--gold-color)] font-bold mb-4 text-center">注文入力</h3>
            <OrderSection
              orders={state.orders}
              customerType={state.customerType}
              isGirlsParty={state.isGirlsParty}
              isAppreciationDay={state.isAppreciationDay}
              isSevenLuck={state.isSevenLuck}
              onAdd={onAddOrder}
              onUpdateCount={(id, delta) => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id, delta } })}
              onSetCount={(id, count) => dispatch({ type: 'SET_ORDER_COUNT', payload: { id, count } })}
              onToggleHalfOff={(id) => dispatch({ type: 'TOGGLE_ORDER_HALF_OFF', payload: id })}
              onRemove={(id) => dispatch({ type: 'REMOVE_ORDER', payload: id })}
            />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-[var(--border-color)]">
        {wizardStep > 1 ? (
          <button
            onClick={goBack}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-[var(--text-color)] cursor-pointer hover:bg-[var(--input-bg)] transition-colors"
          >
            ← 戻る
          </button>
        ) : (
          <span />
        )}

        <div className="flex gap-2">
          {wizardStep < 5 && (
            <button
              onClick={goNext}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-transparent text-gray-400 cursor-pointer hover:bg-[var(--input-bg)] transition-colors"
            >
              スキップ →
            </button>
          )}
          <button
            onClick={wizardStep === 5 ? onComplete : goNext}
            className="px-6 py-2 rounded-lg border-none bg-[var(--gold-color)] text-black font-bold cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
          >
            {wizardStep === 5 ? '完了' : '次へ →'}
          </button>
        </div>
      </div>
    </div>
  );
};
