import { useState, useEffect, useRef } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { useMultiTableCalculator } from './hooks/useMultiTableCalculator';
import type { Action } from './hooks/useCalculator';
import { Layout } from './components/Layout';
import { NewSlipDialog } from './components/NewSlipDialog';
import { SlipTabView } from './components/SlipTabView';
import { SlipCopyModal } from './components/SlipCopyModal';
import type { SlipInfo as CopySlipInfo } from './components/SlipCopyModal';
import { LOPage } from './components/LOPage';
import { SettingsPage } from './components/SettingsPage';
import { UpdateNotice } from './components/UpdateNotice';
import { useStoreConfig } from './contexts/StoreConfigContext';
import { APP_VERSION } from './version';

type PageTab = 'calculator' | 'lo' | 'settings';

// PWA即時更新: 新しいSWが検出されたら自動リロード
const updateSW = registerSW({
  onNeedRefresh() {
    updateSW(true);
  },
});

function App() {
  const {
    tables, activeTableId, activeSlipId, activeTable, activeSlip, state, result, dispatch,
    setActiveTable, setActiveSlip, addSlipWithData, addSlipFromCopy, removeSlip, renameSlip,
    setActiveTab, multiDispatch
  } = useMultiTableCalculator();
  const { config } = useStoreConfig();

  // アップデート通知
  const [showUpdateNotice, setShowUpdateNotice] = useState(() => {
    try {
      return localStorage.getItem('app-version') !== APP_VERSION;
    } catch { return false; }
  });

  // モーダル
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showNewSlipDialog, setShowNewSlipDialog] = useState(false);

  // UI設定の永続化
  const loadUISetting = (key: string, fallback: boolean) => {
    try { const v = localStorage.getItem(key); return v !== null ? v === 'true' : fallback; } catch { return fallback; }
  };
  const [currentPage, setCurrentPage] = useState<PageTab>('calculator');
  const [showLO, setShowLO] = useState(() => loadUISetting('ui-showLO', false));
  const [showAIDetail, setShowAIDetail] = useState(() => loadUISetting('ui-showAIDetail', false));
  const [lightMode, setLightMode] = useState(() => loadUISetting('ui-lightMode', false));

  const persistShowLO = (v: boolean) => { setShowLO(v); localStorage.setItem('ui-showLO', String(v)); };
  const persistAIDetail = (v: boolean) => { setShowAIDetail(v); localStorage.setItem('ui-showAIDetail', String(v)); };
  const persistLightMode = (v: boolean) => { setLightMode(v); localStorage.setItem('ui-lightMode', String(v)); };

  // ライトモード切替
  useEffect(() => {
    document.documentElement.classList.toggle('light-mode', lightMode);
  }, [lightMode]);

  // 通常モード: 伝票がなければダイアログを自動表示
  useEffect(() => {
    if (!showLO && activeTable.slips.length === 0) {
      setShowNewSlipDialog(true);
    }
  }, [showLO, activeTable.slips.length]);

  // 時刻オーバーライド管理（会計時刻タップ入力用）
  const timeOverrideRef = useRef(false);

  // 現在時刻の自動更新（10秒間隔、全伝票一括）
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

  // コピー用のスリップ情報を構築
  const buildCopySlips = (): CopySlipInfo[] => {
    if (showLO) {
      // LOモード: 全テーブルの全伝票
      return tables.flatMap(t =>
        t.slips.map(s => ({
          id: s.id,
          name: s.name,
          tableId: t.id,
          tableName: t.name,
          state: s.state,
        }))
      );
    }
    // 通常モード: アクティブテーブルの伝票
    return activeTable.slips.map(s => ({
      id: s.id,
      name: s.name,
      state: s.state,
    }));
  };

  const handleCopy = (sourceSlipId: string, mode: 'full' | 'selective', selectedFields?: string[]) => {
    addSlipFromCopy(sourceSlipId, mode, selectedFields);
    setShowCopyModal(false);
  };

  // LOページ用dispatch
  const dispatchForSlip = (tableId: string, slipId: string, action: Action) => {
    multiDispatch({ type: 'SLIP_ACTION_FOR', payload: { tableId, slipId, action } });
  };

  return (
    <Layout storeName={config.storeName}>
      {/* ライトモード（左上固定） */}
      <button
        onClick={() => persistLightMode(!lightMode)}
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
          {/* 運営モード: テーブル3×3グリッド＋伝票選択 */}
          {showLO && (
            <div className="bg-[var(--input-bg)] p-4 rounded-xl border border-[var(--border-color)]">
              <label className="text-xs text-gray-400 mb-2 block">テーブル</label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {tables.map(table => {
                  const isActive = activeTableId === table.id;
                  const hasSlips = table.slips.length > 0;
                  return (
                    <button key={table.id} onClick={() => setActiveTable(table.id)}
                      className={`p-2.5 rounded-lg border text-center transition-colors ${
                        isActive
                          ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                          : hasSlips
                            ? 'bg-transparent text-white border-[var(--accent-color)] hover:border-[var(--gold-color)]'
                            : 'bg-transparent text-gray-500 border-[var(--border-color)] hover:border-gray-400'
                      }`}>
                      <div className="text-sm font-bold">{table.name}</div>
                      {hasSlips && <div className={`text-xs mt-0.5 ${isActive ? 'text-black/60' : 'text-gray-400'}`}>{table.slips.length}伝票</div>}
                    </button>
                  );
                })}
              </div>
              <label className="text-xs text-gray-400 mb-2 block">伝票</label>
              <div className="flex gap-2 flex-wrap items-center">
                {activeTable.slips.map(slip => (
                  <button key={slip.id} onClick={() => setActiveSlip(slip.id)}
                    className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                      activeSlipId === slip.id ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]' : 'bg-transparent text-white border-[var(--border-color)] hover:border-gray-400'
                    }`}>{slip.name}</button>
                ))}
                <button onClick={() => setShowNewSlipDialog(true)}
                  className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer"
                >+ 伝票追加</button>
                {activeTable.slips.length > 0 && (
                  <button onClick={() => setShowCopyModal(true)}
                    className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[rgba(0,188,212,0.1)] transition-colors text-sm font-bold cursor-pointer"
                  >コピーして追加</button>
                )}
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
                <button onClick={() => setShowNewSlipDialog(true)}
                  className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--gold-color)] text-[var(--gold-color)] hover:bg-[rgba(255,215,0,0.1)] transition-colors text-sm font-bold cursor-pointer"
                >+ 伝票追加</button>
                {activeTable.slips.length > 0 && (
                  <button onClick={() => setShowCopyModal(true)}
                    className="px-3 py-1.5 rounded-md bg-transparent border border-dashed border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[rgba(0,188,212,0.1)] transition-colors text-sm font-bold cursor-pointer"
                  >コピーして追加</button>
                )}
              </div>
            </div>
          )}

          {/* 伝票が選択されている場合のみ表示 */}
          {state && result && activeSlip ? (
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
                  if (time) {
                    timeOverrideRef.current = true;
                    dispatch({ type: 'SET_CURRENT_TIME', payload: time });
                  } else {
                    timeOverrideRef.current = false;
                  }
                }}
                onAddOrder={handleAddOrder}
              />
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">◎</div>
              <div className="text-lg mb-2">テーブル <span className="text-[var(--gold-color)] font-bold">{activeTable.name}</span></div>
              <div className="text-sm">「+ 伝票追加」で伝票入力を開始</div>
            </div>
          )}
        </div>
      )}

      {/* LOページ */}
      {currentPage === 'lo' && (
        <LOPage tables={tables} config={config} dispatchForSlip={dispatchForSlip}
          onMoveSlip={(fromTableId, slipId, toTableId) => multiDispatch({ type: 'MOVE_SLIP', payload: { fromTableId, slipId, toTableId } })}
          onClearAllSlips={() => multiDispatch({ type: 'CLEAR_ALL_SLIPS' })} />
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
        />
      )}

      {/* 新規伝票ダイアログ */}
      <NewSlipDialog
        isOpen={showNewSlipDialog}
        onClose={() => setShowNewSlipDialog(false)}
        onCreate={(data) => {
          addSlipWithData(data);
          setShowNewSlipDialog(false);
        }}
      />

      {/* コピーモーダル */}
      <SlipCopyModal
        isOpen={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onCopy={handleCopy}
        availableSlips={buildCopySlips()}
      />

      {/* アップデート通知モーダル */}
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
