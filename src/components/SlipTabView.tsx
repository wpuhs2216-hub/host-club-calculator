import type { CustomerType, Action, CalculatorState, CalculationResult } from '../hooks/useCalculator';
import type { StoreConfig } from '../types/storeConfig';
import { InputGroup } from './InputGroup';
import { ResultDisplay } from './ResultDisplay';
import { BudgetRecommender } from './BudgetRecommender';

export type SlipTab = 'basic' | 'orders' | 'checkout' | 'ai';

interface SlipTabViewProps {
  state: CalculatorState;
  result: CalculationResult;
  dispatch: (action: Action) => void;
  activeTab: SlipTab;
  onTabChange: (tab: SlipTab) => void;
  showAIDetail: boolean;
  config: StoreConfig;
  onTimeOverride: (time: string | null) => void;
  onOpenOrderDialog: () => void;
}

const TABS: { id: SlipTab; label: string }[] = [
  { id: 'basic', label: '基本情報' },
  { id: 'checkout', label: '会計' },
  { id: 'ai', label: '予算' },
];

export const SlipTabView: React.FC<SlipTabViewProps> = ({
  state,
  result,
  dispatch,
  activeTab,
  onTabChange,
  showAIDetail,
  onTimeOverride,
  onOpenOrderDialog,
}) => {
  // ordersタブが選ばれていた場合、basicにフォールバック
  const effectiveTab = activeTab === 'orders' ? 'basic' : activeTab;

  // 追加済みオーダー数
  const orderCount = state.orders.filter(o => !o.isPinned && o.count > 0).length;

  return (
    <div>
      {/* Tab bar + オーダーボタン */}
      <div className="flex border-b border-[var(--border-color)] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-center text-sm font-bold transition-all ${
              effectiveTab === tab.id
                ? 'text-[var(--gold-color)] border-b-2 border-[var(--gold-color)]'
                : 'text-gray-400 border-b-2 border-transparent hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {/* オーダーボタン（タブバー内） */}
        <button
          onClick={onOpenOrderDialog}
          className="flex-1 py-3 text-center text-sm font-bold transition-all text-[var(--gold-color)] border-b-2 border-transparent hover:border-[var(--gold-color)] flex items-center justify-center gap-1"
        >
          オーダー
          {orderCount > 0 && (
            <span className="text-xs bg-[var(--gold-color)] text-black px-1.5 py-0.5 rounded-full font-bold leading-none">
              {orderCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      {effectiveTab === 'basic' && (
        <InputGroup
          customerType={state.customerType}
          initialSetPrice={state.initialSetPrice}
          entryTime={state.entryTime}
          dohan={state.dohan}
          isSetHalfOff={state.isSetHalfOff}
          isGirlsParty={state.isGirlsParty}
          isAppreciationDay={state.isAppreciationDay}
          isSevenLuck={state.isSevenLuck}
          isGoldTicket={state.isGoldTicket}
          additionalNominationCount={state.additionalNominationCount}
          onCustomerTypeChange={(type: CustomerType) => dispatch({ type: 'SET_CUSTOMER_TYPE', payload: type })}
          onInitialSetPriceChange={(price: number) => dispatch({ type: 'SET_INITIAL_SET_PRICE', payload: price })}
          onEntryTimeChange={(time: string) => dispatch({ type: 'SET_ENTRY_TIME', payload: time })}
          onDohanToggle={() => dispatch({ type: 'TOGGLE_DOHAN' })}
          onSetHalfOffToggle={() => dispatch({ type: 'TOGGLE_SET_HALF_OFF' })}
          onGirlsPartyToggle={() => dispatch({ type: 'TOGGLE_GIRLS_PARTY' })}
          onAppreciationDayToggle={() => dispatch({ type: 'TOGGLE_APPRECIATION_DAY' })}
          onSevenLuckToggle={() => dispatch({ type: 'TOGGLE_SEVEN_LUCK' })}
          onGoldTicketToggle={() => dispatch({ type: 'TOGGLE_GOLD_TICKET' })}
          onAdditionalNominationCountChange={(count: number) => dispatch({ type: 'SET_ADDITIONAL_NOMINATION_COUNT', payload: count })}
        />
      )}

      {effectiveTab === 'checkout' && (
        <ResultDisplay
          currentTotal={result.currentTotal}
          breakdown={result.breakdown}
          previousTotal={result.previousTotal}
          previousBreakdown={result.previousBreakdown}
          schedule={result.schedule}
          taxRate={result.taxRate}
          currentTime={state.currentTime}
          isOutOfHours={result.isOutOfHours}
          onTimeOverride={onTimeOverride}
        />
      )}

      {effectiveTab === 'ai' && (
        <BudgetRecommender
          result={result}
          state={state}
          showDetail={showAIDetail}
          onAddOrders={(items) => {
            items.forEach((item) => {
              dispatch({
                type: 'ADD_ORDER',
                payload: {
                  name: item.name,
                  price: item.price,
                  isTaxIncluded: item.isTaxIncluded,
                  canHalfOff: item.canHalfOff,
                  isHalfOff: item.isHalfOff,
                },
              });
            });
          }}
        />
      )}
    </div>
  );
};
