import { useState, useEffect } from 'react';
import { useMultiTableCalculator } from './hooks/useMultiTableCalculator';
import type { CustomerType, Action } from './hooks/useCalculator';
import { Layout } from './components/Layout';
import { InputGroup } from './components/InputGroup';
import { OrderSection } from './components/OrderSection';
import { ResultDisplay } from './components/ResultDisplay';
import { BudgetRecommender } from './components/BudgetRecommender';
import { Collapsible } from './components/Collapsible';
import { LOPage } from './components/LOPage';
import { SettingsPage } from './components/SettingsPage';
import { useStoreConfig } from './contexts/StoreConfigContext';

type PageTab = 'calculator' | 'lo' | 'settings';

function App() {
  const {
    tables, activeTableId, activeSlipId, activeTable, activeSlip, state, result, dispatch,
    setActiveTable, setActiveSlip, addSlip, removeSlip, renameSlip, multiDispatch
  } = useMultiTableCalculator();
  const { config } = useStoreConfig();
  const [currentPage, setCurrentPage] = useState<PageTab>('calculator');
  const [showLO, setShowLO] = useState(false);
  const [showAIDetail, setShowAIDetail] = useState(false);
  const [lightMode, setLightMode] = useState(false);

  // ライトモード切替
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', lightMode);
  }, [lightMode]);

  // 通常モード: テーブル選択なし、自動で①の伝票を作成
  useEffect(() => {
    if (!showLO && activeTable.slips.length === 0) {
      addSlip();
    }
  }, [showLO, activeTable.slips.length]);

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


  // LOページ用dispatch
  const dispatchForSlip = (tableId: string, slipId: string, action: Action) => {
    multiDispatch({ type: 'SLIP_ACTION_FOR', payload: { tableId, slipId, action } });
  };

  return (
    <Layout storeName={config.storeName}>
      {/* ライトモード（左上固定） */}
      <button
        onClick={() => setLightMode(!lightMode)}
        style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
        className="fixed left-4 z-[999] w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-lg transition-all outline-none cursor-pointer bg-[var(--input-bg)] text-[var(--text-color)] hover:border-[var(--gold-color)]"
      >{lightMode ? '◐' : '◑'}</button>

      {/* 管理者ボタン（右上固定） */}
      <button
        onClick={() => setCurrentPage(currentPage === 'settings' ? 'calculator' : 'settings')}
        style={{ top: 'max(1rem, env(safe-area-inset-top, 0px))' }}
        className={`fixed right-4 z-[999] w-10 h-10 rounded-full border flex items-center justify-center text-lg transition-all outline-none cursor-pointer ${
          currentPage === 'settings' ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-[var(--input-bg)] text-white border-[var(--border-color)] hover:bg-[#444]'
        }`}
      >◈</button>

      {/* 運営モード時のみタブ表示 */}
      {showLO && (
        <div className="flex mb-4 border border-[var(--border-color)] rounded-xl overflow-hidden">
          <button
            onClick={() => setCurrentPage('calculator')}
            className={`flex-1 py-3 text-base font-bold transition-colors border-none cursor-pointer outline-none ${
              currentPage === 'calculator' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
            }`}
          >計算</button>
          <button
            onClick={() => setCurrentPage('lo')}
            className={`flex-1 py-3 text-base font-bold transition-colors border-none cursor-pointer outline-none ${
              currentPage === 'lo' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
            }`}
          >LO</button>
        </div>
      )}

      {/* 計算ページ */}
      {currentPage === 'calculator' && (
        <div className="flex flex-col gap-4">
          {/* 運営モード: テーブル＋伝票選択 */}
          {showLO && (
            <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border-color)]">
              <label className="text-xs text-gray-400 mb-2 block">テーブル</label>
              <div className="flex gap-2 flex-wrap mb-3">
                {tables.map(table => (
                  <button key={table.id} onClick={() => setActiveTable(table.id)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                      activeTableId === table.id ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                    }`}>
                    {table.name}
                    {table.slips.length > 0 && <span className="ml-1 text-xs opacity-70">({table.slips.length})</span>}
                  </button>
                ))}
              </div>
              <label className="text-xs text-gray-400 mb-2 block">伝票</label>
              <div className="flex gap-2 flex-wrap items-center">
                {activeTable.slips.map(slip => (
                  <button key={slip.id} onClick={() => setActiveSlip(slip.id)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                      activeSlipId === slip.id ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                    }`}>{slip.name}</button>
                ))}
                <button onClick={() => addSlip()}
                  className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer"
                >+ 伝票を追加</button>
              </div>
            </div>
          )}

          {/* 通常モード: 伝票のみ（テーブル非表示、全てAに紐付け） */}
          {!showLO && (
            <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)]">
              <div className="flex gap-2 flex-wrap items-center">
                {activeTable.slips.map(slip => (
                  <button key={slip.id} onClick={() => setActiveSlip(slip.id)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                      activeSlipId === slip.id ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                    }`}>{slip.name}</button>
                ))}
                <button onClick={() => addSlip()}
                  className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer"
                >+ 伝票追加</button>
              </div>
            </div>
          )}

          {/* 伝票が選択されている場合のみ表示 */}
          {state && result ? (
            <>
              {/* ヘッダー: 伝票名(リネーム可) + 削除 + 全伝票削除 */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {showLO && <span className="text-lg font-bold text-[var(--gold-color)]">{activeTable.name}</span>}
                  <input
                    type="text"
                    value={activeSlip?.name ?? ''}
                    onChange={(e) => activeSlip && renameSlip(activeTableId, activeSlip.id, e.target.value)}
                    className="text-lg font-bold text-[var(--gold-color)] bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 outline-none w-24 focus:border-[var(--gold-color)] transition-colors"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {activeSlip && (
                    <button
                      onClick={() => { if (window.confirm('この伝票を削除しますか？')) removeSlip(activeTableId, activeSlip.id); }}
                      className="px-3 py-1.5 rounded-lg border border-[var(--danger-color)] text-[var(--danger-color)] font-bold text-xs hover:bg-[var(--danger-color)] hover:text-white transition-all outline-none cursor-pointer bg-transparent"
                    >削除</button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('全ての伝票を削除しますか？')) {
                        activeTable.slips.forEach(s => removeSlip(activeTableId, s.id));
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] font-bold text-xs hover:border-[var(--gold-color)] transition-all outline-none cursor-pointer"
                  >全削除</button>
                </div>
              </div>

              <Collapsible title="≡ 基本情報" defaultOpen={false}>
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

              <Collapsible title="◇ 商品オーダー" defaultOpen={false}>
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

              <Collapsible title="⟡ AI予算プランナー" defaultOpen={false}>
                <BudgetRecommender
                  result={result}
                  state={state}
                  showDetail={showAIDetail}
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
              <div className="text-4xl mb-4">◎</div>
              <div className="text-lg mb-2">テーブル <span className="text-[var(--gold-color)] font-bold">{activeTable.name}</span></div>
              <div className="text-sm">「+ 伝票を追加」で伝票入力を開始</div>
            </div>
          )}
        </div>
      )}

      {/* LOページ */}
      {currentPage === 'lo' && (
        <LOPage tables={tables} config={config} dispatchForSlip={dispatchForSlip}
          onMoveSlip={(fromTableId, slipId, toTableId) => multiDispatch({ type: 'MOVE_SLIP', payload: { fromTableId, slipId, toTableId } })} />
      )}

      {/* 設定ページ */}
      {currentPage === 'settings' && (
        <SettingsPage
          isDebugMode={state?.isDebugMode ?? false}
          currentTime={state?.currentTime ?? '20:00'}
          onDebugModeToggle={() => dispatch({ type: 'TOGGLE_DEBUG_MODE' })}
          onCurrentTimeChange={(time) => dispatch({ type: 'SET_CURRENT_TIME', payload: time })}
          showLO={showLO}
          onShowLOChange={setShowLO}
          showAIDetail={showAIDetail}
          onShowAIDetailChange={setShowAIDetail}
        />
      )}

    </Layout>
  );
}

export default App;
