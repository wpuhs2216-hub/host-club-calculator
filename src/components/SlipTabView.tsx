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
  { id: 'orders', label: 'オーダー' },
  { id: 'checkout', label: '会計' },
  { id: 'ai', label: '予算' },
];

// シャンパン名リスト（半額判定用）
const CHAMPAGNE_HALF_NAMES = [
  'リステル', 'アスティ', 'SPLブルー', 'SPLホワイト', 'SPLパープル',
  'SPLロゼ', 'SPLジュエルワイン', 'SPLZERO', 'SPLレッド', 'SPLゴールド',
];

export const SlipTabView: React.FC<SlipTabViewProps> = ({
  state,
  result,
  dispatch,
  activeTab,
  onTabChange,
  showAIDetail,
  config,
  onTimeOverride,
  onOpenOrderDialog,
}) => {
  const isInitialOrR = state.customerType === 'initial' || state.customerType === 'r_within' || state.customerType === 'r_after';
  const hasHalfOffChampagne = state.orders.some(o =>
    o.isHalfOff && o.count > 0 && CHAMPAGNE_HALF_NAMES.includes(o.baseName)
  );

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-color)] mb-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          // オーダータブにバッジ表示
          const badge = tab.id === 'orders'
            ? state.orders.filter(o => o.count > 0).length
            : 0;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 py-3 text-center text-sm font-bold transition-all flex items-center justify-center gap-1 ${
                isActive
                  ? 'text-[var(--gold-color)] border-b-2 border-[var(--gold-color)]'
                  : 'text-gray-400 border-b-2 border-transparent hover:text-gray-200'
              }`}
            >
              {tab.label}
              {badge > 0 && (
                <span className="text-xs bg-[var(--gold-color)] text-black px-1.5 py-0.5 rounded-full font-bold leading-none">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
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
        <div className="mt-2">
          {/* オーダー追加ボタン */}
          <button
            onClick={onOpenOrderDialog}
            className="w-full p-3 rounded-lg font-bold text-base border-2 border-dashed border-[var(--gold-color)] text-[var(--gold-color)] bg-transparent hover:bg-[rgba(255,215,0,0.08)] transition-all cursor-pointer mb-4"
          >
            + オーダーを追加
          </button>

          {/* 現在のオーダー一覧 */}
          <h4 className="text-sm m-0 mb-3 text-[var(--gold-color)] font-bold">現在のオーダー</h4>
          <div className="flex flex-col gap-2">
            {state.orders.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">オーダーはありません</div>
            )}
            {state.orders.map((order) => (
              <div key={order.id} className="flex justify-between items-center p-3 bg-[var(--input-bg)] rounded-lg border border-[var(--border-color)]">
                <div className="flex-1 pr-2">
                  <div className="font-bold text-sm mb-1">{order.name}</div>
                  <div className="text-xs text-gray-400 mb-1">
                    ¥{order.price.toLocaleString()}
                    {order.isTaxIncluded && ' (税込)'}
                  </div>
                  {order.canHalfOff && (() => {
                    const isOrderChampagne = CHAMPAGNE_HALF_NAMES.includes(order.baseName);
                    const blocked = isOrderChampagne && isInitialOrR && !order.isHalfOff && hasHalfOffChampagne;
                    return blocked ? (
                      <span className="text-xs text-gray-500">半額適用済み（1本制限）</span>
                    ) : (
                      <label className="flex items-center text-xs text-[var(--gold-color)] cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={order.isHalfOff || false}
                          onChange={() => dispatch({ type: 'TOGGLE_ORDER_HALF_OFF', payload: order.id })}
                          className="mr-1 accent-[var(--gold-color)]"
                        />
                        半額適用
                      </label>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: -5 } })}
                    className="w-7 h-7 rounded-md border border-[var(--border-color)] bg-transparent text-gray-400 text-xs flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                  >-5</button>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: -1 } })}
                    className="w-8 h-8 rounded-full border border-[var(--border-color)] bg-transparent text-white flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                  >-</button>
                  <input
                    type="number"
                    value={order.count.toString()}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val) && val >= 0) dispatch({ type: 'SET_ORDER_COUNT', payload: { id: order.id, count: val } });
                      else if (e.target.value === '') dispatch({ type: 'SET_ORDER_COUNT', payload: { id: order.id, count: 0 } });
                    }}
                    onFocus={(e) => e.target.select()}
                    className="w-10 text-center font-bold bg-transparent border-none border-b border-b-[var(--border-color)] outline-none text-white text-sm hide-spin-button"
                  />
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: 1 } })}
                    className="w-8 h-8 rounded-full border-none bg-[var(--gold-color)] text-black flex items-center justify-center cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                  >+</button>
                  <button
                    onClick={() => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id: order.id, delta: 5 } })}
                    className="w-7 h-7 rounded-md border-none bg-[var(--gold-color)] text-black text-xs flex items-center justify-center cursor-pointer hover:bg-[var(--accent-hover)] transition-colors"
                  >+5</button>
                  {!order.isPinned && (
                    <button
                      onClick={() => dispatch({ type: 'REMOVE_ORDER', payload: order.id })}
                      className="ml-1 text-xs border-none bg-transparent underline cursor-pointer text-[var(--danger-color)] hover:text-red-300"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
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
          taxRate={config.taxRate}
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
