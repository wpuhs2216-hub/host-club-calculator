import { useState, useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useMultiTableCalculator } from './hooks/useMultiTableCalculator';
import type { Action } from './hooks/useCalculator';
import { Layout } from './components/Layout';
import { NewSlipDialog, NewSlipInline } from './components/NewSlipDialog';
import { SlipTabView } from './components/SlipTabView';
import { OrderDialog } from './components/OrderDialog';
import { SlipCopyModal } from './components/SlipCopyModal';
import type { SlipInfo as CopySlipInfo } from './components/SlipCopyModal';
import { LOPage } from './components/LOPage';
import { SettingsPage } from './components/SettingsPage';
import { UpdateNotice } from './components/UpdateNotice';
import { useStoreConfig } from './contexts/StoreConfigContext';
import { APP_VERSION } from './version';

type PageTab = 'calculator' | 'lo' | 'settings';
type LODisplayMode = 'sidebar' | 'tab';

// PWA即時更新
const updateSW = registerSW({
  onNeedRefresh() { updateSW(true); },
});

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(() => window.matchMedia('(min-width: 768px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsTablet(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isTablet;
}

function App() {
  const {
    tables, activeTableId, activeSlipId, activeTable, activeSlip, state, result, dispatch,
    setActiveTable, setActiveSlip, addSlipWithData, addSlipFromCopy, removeSlip, renameSlip,
    setActiveTab, multiDispatch
  } = useMultiTableCalculator();
  const { config } = useStoreConfig();
  const isTablet = useIsTablet();

  // アップデート通知
  const [showUpdateNotice, setShowUpdateNotice] = useState(() => {
    try { return localStorage.getItem('app-version') !== APP_VERSION; } catch { return false; }
  });

  // モーダル
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showNewSlipDialog, setShowNewSlipDialog] = useState(false);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  // UI設定の永続化
  const loadUISetting = (key: string, fallback: string) => {
    try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
  };
  const loadUIBool = (key: string, fallback: boolean) => {
    try { const v = localStorage.getItem(key); return v !== null ? v === 'true' : fallback; } catch { return fallback; }
  };
  const [currentPage, setCurrentPage] = useState<PageTab>('calculator');
  const [showLO, setShowLO] = useState(() => loadUIBool('ui-showLO', false));
  const [showAIDetail, setShowAIDetail] = useState(() => loadUIBool('ui-showAIDetail', false));
  const [lightMode, setLightMode] = useState(() => loadUIBool('ui-lightMode', false));
  const [loDisplayMode, setLoDisplayMode] = useState<LODisplayMode>(() => loadUISetting('ui-loDisplayMode', 'sidebar') as LODisplayMode);

  const persistShowLO = (v: boolean) => { setShowLO(v); localStorage.setItem('ui-showLO', String(v)); };
  const persistAIDetail = (v: boolean) => { setShowAIDetail(v); localStorage.setItem('ui-showAIDetail', String(v)); };
  const persistLightMode = (v: boolean) => { setLightMode(v); localStorage.setItem('ui-lightMode', String(v)); };
  const persistLoDisplayMode = (v: LODisplayMode) => { setLoDisplayMode(v); localStorage.setItem('ui-loDisplayMode', v); };

  useEffect(() => { document.documentElement.classList.toggle('light-mode', lightMode); }, [lightMode]);

  const timeOverrideRef = useRef(false);
  useEffect(() => {
    const updateTime = () => {
      if (timeOverrideRef.current) return;
      if (state && !state.isDebugMode) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        dispatch({ type: 'SET_CURRENT_TIME', payload: timeStr });
        multiDispatch({ type: 'UPDATE_ALL_CURRENT_TIME', payload: timeStr });
      }
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, [activeSlipId, state?.isDebugMode]);

  const handleAddOrder = (name: string, price: number, isTaxIncluded?: boolean, canHalfOff?: boolean, isHalfOff?: boolean) => {
    dispatch({ type: 'ADD_ORDER', payload: { name, price, isTaxIncluded, canHalfOff, isHalfOff } });
  };

  const buildCopySlips = (): CopySlipInfo[] => {
    if (showLO) {
      return tables.flatMap(t => t.slips.map(s => ({ id: s.id, name: s.name, tableId: t.id, tableName: t.name, state: s.state })));
    }
    return activeTable.slips.map(s => ({ id: s.id, name: s.name, state: s.state }));
  };

  const handleCopy = (sourceSlipId: string, mode: 'full' | 'selective', selectedFields?: string[]) => {
    addSlipFromCopy(sourceSlipId, mode, selectedFields);
    setShowCopyModal(false);
  };

  const dispatchForSlip = (tableId: string, slipId: string, action: Action) => {
    multiDispatch({ type: 'SLIP_ACTION_FOR', payload: { tableId, slipId, action } });
  };

  // LOをタブで表示するか
  const loAsTab = showLO && loDisplayMode === 'tab';

  // --- サイドバーコンテンツ ---
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* サイドバーヘッダー — モバイルではsafe-area + ☰ボタン分の余白 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] shrink-0"
        style={{ paddingTop: isTablet ? undefined : 'calc(max(0.75rem, env(safe-area-inset-top, 0px)) + 2.5rem)' }}>
        <span className="text-sm font-bold text-[var(--gold-color)]">
          {showLO ? 'テーブル / 伝票' : '伝票'}
        </span>
        {!isTablet && (
          <button onClick={() => setShowMobileSidebar(false)}
            className="w-8 h-8 rounded-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] flex items-center justify-center text-sm cursor-pointer hover:border-[var(--gold-color)] transition-colors">✕</button>
        )}
      </div>

      <div className="p-3 flex flex-col gap-3 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {/* テーブル選択（LOモード時のみ） */}
        {showLO && (
          <>
            <label className="text-xs text-gray-400 block">テーブル</label>
            <div className="grid grid-cols-3 gap-1.5">
              {tables.map(table => {
                const isActive = activeTableId === table.id;
                const hasSlips = table.slips.length > 0;
                return (
                  <button key={table.id} onClick={() => { setActiveTable(table.id); if (currentPage !== 'calculator') setCurrentPage('calculator'); setShowMobileSidebar(false); }}
                    className={`p-2 rounded-lg border text-center transition-colors ${
                      isActive
                        ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                        : hasSlips
                          ? 'bg-transparent text-white border-[var(--accent-color)] hover:border-[var(--gold-color)]'
                          : 'bg-transparent text-gray-500 border-[var(--border-color)] hover:border-gray-400'
                    }`}>
                    <div className="text-xs font-bold">{table.name}</div>
                    {hasSlips && <div className={`text-[10px] mt-0.5 ${isActive ? 'text-black/60' : 'text-gray-400'}`}>{table.slips.length}伝票</div>}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* 伝票一覧 */}
        <label className="text-xs text-gray-400 block">伝票</label>
        <div className="flex flex-col gap-1.5">
          {activeTable.slips.map(slip => (
            <button key={slip.id} onClick={() => { setActiveSlip(slip.id); if (currentPage !== 'calculator') setCurrentPage('calculator'); setShowMobileSidebar(false); }}
              className={`px-3 py-2 rounded-lg border text-sm font-bold transition-colors text-left ${
                activeSlipId === slip.id ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
              }`}>
              {showLO && <span className="text-xs opacity-60 mr-1">{activeTable.name}</span>}
              {slip.name}
            </button>
          ))}
          <button onClick={() => { setShowNewSlipDialog(true); setShowMobileSidebar(false); }}
            className="px-3 py-2 rounded-lg bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer text-left"
          >+ 伝票追加</button>
          {activeTable.slips.length > 0 && (
            <button onClick={() => { setShowCopyModal(true); setShowMobileSidebar(false); }}
              className="px-3 py-2 rounded-lg bg-transparent border border-dashed border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[rgba(0,188,212,0.1)] transition-colors text-sm font-bold cursor-pointer text-left"
            >コピーして追加</button>
          )}
        </div>

        {/* 全卓会計（サイドバーモード時） */}
        {showLO && loDisplayMode === 'sidebar' && (
          <div className="border-t border-[var(--border-color)] pt-3 mt-1">
            <LOPage tables={tables} config={config} dispatchForSlip={dispatchForSlip}
              onMoveSlip={(fromTableId, slipId, toTableId) => multiDispatch({ type: 'MOVE_SLIP', payload: { fromTableId, slipId, toTableId } })}
              onClearAllSlips={() => multiDispatch({ type: 'CLEAR_ALL_SLIPS' })}
              onOpenSlip={(tableId, slipId) => { setActiveTable(tableId); setActiveSlip(slipId); setCurrentPage('calculator'); setShowMobileSidebar(false); }} />
          </div>
        )}
      </div>

      {/* サイドバー下部: ライトモード + 設定 */}
      <div className="p-3 border-t border-[var(--border-color)] shrink-0 flex flex-col gap-2">
        <button
          onClick={() => persistLightMode(!lightMode)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] text-sm font-bold transition-all outline-none cursor-pointer hover:border-[var(--gold-color)]"
        >
          {lightMode ? '◐' : '◑'}
          <span>{lightMode ? 'ダークモード' : 'ライトモード'}</span>
        </button>
        <button
          onClick={() => { setCurrentPage(currentPage === 'settings' ? 'calculator' : 'settings'); setShowMobileSidebar(false); }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-bold transition-all outline-none cursor-pointer ${
            currentPage === 'settings'
              ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
              : 'bg-[var(--input-bg)] text-white border-[var(--border-color)] hover:border-[var(--gold-color)]'
          }`}
        >
          <span>◈</span>
          <span>設定</span>
        </button>
      </div>
    </div>
  );

  return (
    <Layout storeName={config.storeName}>
      {/* サイドバー開閉ボタン（左上固定） — モバイルのみ */}
      {!isTablet && (
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          style={{ top: 'max(0.75rem, env(safe-area-inset-top, 0px))' }}
          className="fixed left-4 z-[999] w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center text-lg transition-all outline-none cursor-pointer bg-[var(--input-bg)] text-[var(--text-color)] hover:border-[var(--gold-color)]"
        >☰</button>
      )}

      {/* LOタブ表示モード時のみ計算/LOタブ */}
      {loAsTab && (
        <div className="flex mb-3 border border-[var(--border-color)] rounded-lg overflow-hidden">
          <button
            onClick={() => setCurrentPage('calculator')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors border-none cursor-pointer outline-none ${
              currentPage === 'calculator' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
            }`}
          >計算</button>
          <button
            onClick={() => setCurrentPage('lo')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors border-none cursor-pointer outline-none ${
              currentPage === 'lo' ? 'bg-[var(--gold-color)] text-black' : 'bg-[var(--input-bg)] text-white hover:bg-[#444]'
            }`}
          >全卓会計</button>
        </div>
      )}

      {/* メインコンテンツ */}
      <div className={isTablet ? 'flex gap-4' : ''}>
        {/* タブレット: 常時表示サイドバー（LO埋め込み時は幅広） */}
        {isTablet && (
          <div className={`${showLO && loDisplayMode === 'sidebar' ? 'w-[420px]' : 'w-60'} shrink-0 bg-[var(--card-bg,#111827)] border border-[var(--border-color)] rounded-xl overflow-hidden self-start sticky top-4 max-h-[calc(100vh-2rem)]`}>
            {sidebarContent}
          </div>
        )}

        {/* モバイル: ドロワーサイドバー（全ページで開ける） */}
        {!isTablet && showMobileSidebar && (
          <div className="fixed inset-0 z-[900] flex">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileSidebar(false)} />
            <div className={`relative ${showLO && loDisplayMode === 'sidebar' ? 'w-[90vw]' : 'w-72 max-w-[80vw]'} h-full bg-[var(--card-bg,#111827)] border-r border-[var(--border-color)] shadow-2xl animate-slide-in-left overflow-hidden`}>
              {sidebarContent}
            </div>
          </div>
        )}

        {/* メインコンテンツエリア */}
        <div className="flex-1 min-w-0">
          {/* 計算ページ */}
          {currentPage === 'calculator' && (
            <div className="flex flex-col gap-4">
              {/* モバイル: コンパクト伝票セレクター */}
              {!isTablet && (
                <div className="flex gap-2 overflow-x-auto items-center" style={{ scrollbarWidth: 'none' }}>
                  {activeTable.slips.map(slip => (
                    <button key={slip.id} onClick={() => setActiveSlip(slip.id)}
                      className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors whitespace-nowrap shrink-0 ${
                        activeSlipId === slip.id ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                      }`}>{slip.name}</button>
                  ))}
                  {activeTable.slips.length > 0 && (
                    <button onClick={() => setShowNewSlipDialog(true)}
                      className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer whitespace-nowrap shrink-0"
                    >+</button>
                  )}
                </div>
              )}

              {state && result && activeSlip ? (
                <>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {showLO && <span className="text-lg font-bold text-[var(--gold-color)]">{activeTable.name}</span>}
                      <input
                        type="text"
                        value={activeSlip?.name ?? ''}
                        onChange={(e) => activeSlip && renameSlip(activeTableId, activeSlip.id, e.target.value)}
                        onFocus={(e) => e.target.select()}
                        className="text-lg font-bold text-[var(--gold-color)] bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-1.5 outline-none w-24 focus:border-[var(--gold-color)] transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { if (window.confirm('この伝票を削除しますか？')) removeSlip(activeTableId, activeSlip.id); }}
                        className="px-3 py-1.5 rounded-lg border border-[var(--danger-color)] text-[var(--danger-color)] font-bold text-xs hover:bg-[var(--danger-color)] hover:text-white transition-all outline-none cursor-pointer bg-transparent"
                      >削除</button>
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

                  <SlipTabView
                    state={state}
                    result={result}
                    dispatch={dispatch}
                    activeTab={activeSlip.activeTab}
                    onTabChange={setActiveTab}
                    showAIDetail={showAIDetail}
                    config={config}
                    onTimeOverride={(time) => {
                      if (time) { timeOverrideRef.current = true; dispatch({ type: 'SET_CURRENT_TIME', payload: time }); }
                      else { timeOverrideRef.current = false; }
                    }}
                    onOpenOrderDialog={() => setShowOrderDialog(true)}
                  />
                </>
              ) : (
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
                  <NewSlipInline
                    onCreate={(data) => {
                      const { tableId, ...slipData } = data;
                      if (tableId) setActiveTable(tableId);
                      addSlipWithData(slipData, tableId);
                    }}
                    activeTableId={activeTableId}
                  />
                </div>
              )}
            </div>
          )}

          {/* LOページ（タブモード時のみ） */}
          {currentPage === 'lo' && (
            <LOPage tables={tables} config={config} dispatchForSlip={dispatchForSlip}
              onMoveSlip={(fromTableId, slipId, toTableId) => multiDispatch({ type: 'MOVE_SLIP', payload: { fromTableId, slipId, toTableId } })}
              onClearAllSlips={() => multiDispatch({ type: 'CLEAR_ALL_SLIPS' })}
              onOpenSlip={(tableId, slipId) => { setActiveTable(tableId); setActiveSlip(slipId); setCurrentPage('calculator'); setShowMobileSidebar(false); }} />
          )}

          {/* 設定ページ */}
          {currentPage === 'settings' && (
            <SettingsPage
              isDebugMode={state?.isDebugMode ?? false}
              currentTime={state?.currentTime ?? '20:00'}
              onDebugModeToggle={() => dispatch({ type: 'TOGGLE_DEBUG_MODE' })}
              onCurrentTimeChange={(time) => dispatch({ type: 'SET_CURRENT_TIME', payload: time })}
              showLO={showLO}
              onShowLOChange={persistShowLO}
              showAIDetail={showAIDetail}
              onShowAIDetailChange={persistAIDetail}
              loDisplayMode={loDisplayMode}
              onLoDisplayModeChange={persistLoDisplayMode}
            />
          )}
        </div>
      </div>

      {/* オーダーダイアログ */}
      {state && (
        <OrderDialog
          isOpen={showOrderDialog}
          onClose={() => setShowOrderDialog(false)}
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
      )}

      <NewSlipDialog
        isOpen={showNewSlipDialog}
        onClose={() => setShowNewSlipDialog(false)}
        onCreate={(data) => {
          const { tableId, ...slipData } = data;
          if (tableId) setActiveTable(tableId);
          addSlipWithData(slipData, tableId);
          setShowNewSlipDialog(false);
        }}
        tables={showLO ? tables.map(t => ({ id: t.id, name: t.name })) : undefined}
        activeTableId={activeTableId}
      />

      <SlipCopyModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopy={handleCopy}
        availableSlips={buildCopySlips()}
      />

      {showUpdateNotice && (
        <UpdateNotice onClose={() => {
          setShowUpdateNotice(false);
          try { localStorage.setItem('app-version', APP_VERSION); } catch {}
        }} />
      )}
    </Layout>
  );
}

export default App;
