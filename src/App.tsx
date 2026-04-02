import { useState, useEffect } from 'react';
import { useMultiTableCalculator } from './hooks/useMultiTableCalculator';
import type { CustomerType, Action } from './hooks/useCalculator';
import { Layout } from './components/Layout';
import { InputGroup } from './components/InputGroup';
import { OrderSection } from './components/OrderSection';
import { ResultDisplay } from './components/ResultDisplay';
import { BudgetRecommender } from './components/BudgetRecommender';
import { Collapsible } from './components/Collapsible';
import { DebugPanel } from './components/DebugPanel';
import { LOPage } from './components/LOPage';
import { SettingsPage, loadSettings } from './components/SettingsPage';
import type { StoreSettings } from './components/SettingsPage';

type PageTab = 'calculator' | 'lo' | 'settings';

function App() {
  const {
    tables, activeTableId, activeSlipId, activeTable, activeSlip, state, result, dispatch,
    setActiveTable, setActiveSlip, addSlip, removeSlip, renameSlip, multiDispatch
  } = useMultiTableCalculator();
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageTab>('calculator');
  const [settings, setSettings] = useState<StoreSettings>(loadSettings);

  // 現在時刻の自動更新
  useEffect(() => {
    const updateTime = () => {
      if (state && !state.isDebugMode) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        dispatch({ type: 'SET_CURRENT_TIME', payload: `${hours}:${minutes}` });
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [activeSlipId, state?.isDebugMode]);

  const handleAddOrder = (name: string, price: number, isTaxIncluded?: boolean, canHalfOff?: boolean, isHalfOff?: boolean) => {
    dispatch({ type: 'ADD_ORDER', payload: { name, price, isTaxIncluded, canHalfOff, isHalfOff } });
  };

  const handleReset = () => {
    if (!state) return;
    if (window.confirm('この伝票をリセットしますか？')) {
      dispatch({ type: 'RESET' });
      const now = new Date();
      dispatch({ type: 'SET_CURRENT_TIME', payload: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}` });
    }
  };

  // LOページ用dispatch
  const dispatchForSlip = (tableId: string, slipId: string, action: Action) => {
    multiDispatch({ type: 'SLIP_ACTION_FOR', payload: { tableId, slipId, action } });
  };

  return (
    <Layout storeName={settings.storeName}>
      {/* グローバルタブ */}
      <div className="flex mb-4 border border-[var(--border-color)] rounded-xl overflow-hidden">
        <button
          onClick={() => setCurrentPage('calculator')}
          className={`flex-1 py-3 text-base font-bold transition-colors border-none cursor-pointer outline-none ${
            currentPage === 'calculator' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
          }`}
        >💳 計算</button>
        <button
          onClick={() => setCurrentPage('lo')}
          className={`flex-1 py-3 text-base font-bold transition-colors border-none cursor-pointer outline-none ${
            currentPage === 'lo' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
          }`}
        >📊 LO</button>
        <button
          onClick={() => setCurrentPage('settings')}
          className={`py-3 px-4 text-base font-bold transition-colors border-none cursor-pointer outline-none ${
            currentPage === 'settings' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
          }`}
        >⚙️</button>
      </div>

      {/* 計算ページ */}
      {currentPage === 'calculator' && (
        <div className="flex flex-col gap-4">
          {/* テーブル選択 */}
          <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border-color)]">
            <label className="text-xs text-gray-400 mb-2 block">テーブル</label>
            <div className="flex gap-2 flex-wrap mb-3">
              {tables.map(table => (
                <button
                  key={table.id}
                  onClick={() => setActiveTable(table.id)}
                  className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                    activeTableId === table.id
                      ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                      : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                  }`}
                >
                  {table.name}
                  {table.slips.length > 0 && (
                    <span className="ml-1 text-xs opacity-70">({table.slips.length})</span>
                  )}
                </button>
              ))}
            </div>

            {/* 伝票選択 */}
            <label className="text-xs text-gray-400 mb-2 block">伝票</label>
            <div className="flex gap-2 flex-wrap items-center">
              {activeTable.slips.map(slip => (
                <div key={slip.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveSlip(slip.id)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                      activeSlipId === slip.id
                        ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                        : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                    }`}
                  >
                    {activeSlipId === slip.id ? (
                      <input
                        type="text"
                        value={slip.name}
                        onChange={(e) => renameSlip(activeTableId, slip.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-transparent border-none text-black outline-none w-12 font-bold text-center"
                      />
                    ) : slip.name}
                  </button>
                  {activeSlipId === slip.id && (
                    <button
                      onClick={() => removeSlip(activeTableId, slip.id)}
                      className="text-red-500 hover:text-red-400 bg-transparent border-none px-1 text-lg leading-none cursor-pointer"
                    >&times;</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addSlip()}
                className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer"
              >+ 伝票を追加</button>
            </div>
          </div>

          {/* 伝票が選択されている場合のみ表示 */}
          {state && result ? (
            <>
              {/* ヘッダー */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-[var(--gold-color)]">
                  {activeTable.name} - {activeSlip?.name}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-gradient-to-br from-[var(--input-bg)] to-[rgba(255,215,0,0.05)] text-white font-bold text-sm hover:border-[var(--gold-color)] transition-all outline-none"
                  >リセット</button>
                  <button
                    onClick={() => setShowDebugPanel(!showDebugPanel)}
                    className={`w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-xl transition-all outline-none ${showDebugPanel ? 'bg-[var(--gold-color)] text-black rotate-90' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'}`}
                  >⚙️</button>
                </div>
              </div>

              <Collapsible title="📋 基本情報" defaultOpen={false}>
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
                  onInitialSetPriceChange={(price) => dispatch({ type: 'SET_INITIAL_SET_PRICE', payload: price })}
                  onEntryTimeChange={(time) => dispatch({ type: 'SET_ENTRY_TIME', payload: time })}
                  onDohanToggle={() => dispatch({ type: 'TOGGLE_DOHAN' })}
                  onSetHalfOffToggle={() => dispatch({ type: 'TOGGLE_SET_HALF_OFF' })}
                  onGirlsPartyToggle={() => dispatch({ type: 'TOGGLE_GIRLS_PARTY' })}
                  onAppreciationDayToggle={() => dispatch({ type: 'TOGGLE_APPRECIATION_DAY' })}
                  onSevenLuckToggle={() => dispatch({ type: 'TOGGLE_SEVEN_LUCK' })}
                  onGoldTicketToggle={() => dispatch({ type: 'TOGGLE_GOLD_TICKET' })}
                  onAdditionalNominationCountChange={(count) => dispatch({ type: 'SET_ADDITIONAL_NOMINATION_COUNT', payload: count })}
                />
              </Collapsible>

              <Collapsible title="🥂 商品オーダー" defaultOpen={false}>
                <OrderSection
                  orders={state.orders}
                  customerType={state.customerType}
                  onAdd={handleAddOrder}
                  onUpdateCount={(id, delta) => dispatch({ type: 'UPDATE_ORDER_COUNT', payload: { id, delta } })}
                  onSetCount={(id, count) => dispatch({ type: 'SET_ORDER_COUNT', payload: { id, count } })}
                  onToggleHalfOff={(id) => dispatch({ type: 'TOGGLE_ORDER_HALF_OFF', payload: id })}
                  onRemove={(id) => dispatch({ type: 'REMOVE_ORDER', payload: id })}
                  isGirlsParty={state.isGirlsParty}
                  isAppreciationDay={state.isAppreciationDay}
                  isSevenLuck={state.isSevenLuck}
                />
              </Collapsible>

              <Collapsible title="✨ AI予算プランナー" defaultOpen={false}>
                <BudgetRecommender
                  result={result}
                  state={state}
                  onAddOrders={(items) => {
                    items.forEach(item => {
                      dispatch({
                        type: 'ADD_ORDER',
                        payload: { name: item.name, price: item.price, isTaxIncluded: item.isTaxIncluded, canHalfOff: item.canHalfOff, isHalfOff: item.isHalfOff }
                      });
                    });
                  }}
                />
              </Collapsible>

              <ResultDisplay
                currentTotal={result.currentTotal}
                breakdown={result.breakdown}
                schedule={result.schedule}
                taxRate={result.taxRate}
                currentTime={state.currentTime}
                isOutOfHours={result.isOutOfHours}
              />
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📝</div>
              <div className="text-lg mb-2">テーブル <span className="text-[var(--gold-color)] font-bold">{activeTable.name}</span></div>
              <div className="text-sm">「+ 伝票を追加」で伝票入力を開始</div>
            </div>
          )}
        </div>
      )}

      {/* LOページ */}
      {currentPage === 'lo' && (
        <LOPage tables={tables} dispatchForSlip={dispatchForSlip} />
      )}

      {/* 設定ページ */}
      {currentPage === 'settings' && (
        <SettingsPage settings={settings} onSettingsChange={setSettings} />
      )}

      {/* デバッグパネル */}
      <div className={`fixed top-1/2 -translate-y-1/2 z-[1000] transition-all duration-300 ${showDebugPanel ? 'right-5' : '-right-80'}`}>
        <DebugPanel
          isDebugMode={state?.isDebugMode ?? false}
          currentTime={state?.currentTime ?? '20:00'}
          onDebugModeToggle={() => dispatch({ type: 'TOGGLE_DEBUG_MODE' })}
          onCurrentTimeChange={(time) => dispatch({ type: 'SET_CURRENT_TIME', payload: time })}
        />
      </div>
    </Layout>
  );
}

export default App;
