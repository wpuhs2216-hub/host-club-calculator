import type { CustomerType, Action, CalculatorState, CalculationResult } from '../hooks/useCalculator';
import type { StoreConfig } from '../types/storeConfig';
import { InputGroup } from './InputGroup';
import { OrderSection } from './OrderSection';
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
  onAddOrder: (name: string, price: number, isTaxIncluded?: boolean, canHalfOff?: boolean, isHalfOff?: boolean) => void;
}

const TABS: { id: SlipTab; label: string }[] = [
  { id: 'basic', label: '基本情報' },
  { id: 'orders', label: 'オーダー' },
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
  onAddOrder,
}) => {
  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-color)] mb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 text-center text-sm font-bold transition-all ${
              activeTab === tab.id
                ? 'text-[var(--gold-color)] border-b-2 border-[var(--gold-color)]'
                : 'text-gray-400 border-b-2 border-transparent hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'basic' && (
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

      {activeTab === 'orders' && (
        <OrderSection
          orders={state.orders}
          customerType={state.customerType}
          onAdd={onAddOrder}
          onUpdateCount={(id: string, delta: number) => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id, delta } })}
          onSetCount={(id: string, count: number) => dispatch({ type: 'SET_ORDER_COUNT', payload: { id, count } })}
          onToggleHalfOff={(id: string) => dispatch({ type: 'TOGGLE_ORDER_HALF_OFF', payload: id })}
          onRemove={(id: string) => dispatch({ type: 'REMOVE_ORDER', payload: id })}
          isGirlsParty={state.isGirlsParty}
          isAppreciationDay={state.isAppreciationDay}
          isSevenLuck={state.isSevenLuck}
        />
      )}

      {activeTab === 'checkout' && (
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

      {activeTab === 'ai' && (
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
