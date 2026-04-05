import React, { useState } from 'react';
import type { CustomerType } from '../hooks/useCalculator';

type MainCategory = 'initial' | 'r' | 'regular';

interface TableOption {
  id: string;
  name: string;
}

interface NewSlipDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    customerType: CustomerType;
    initialSetPrice: number;
    entryTime: string;
    dohan: boolean;
    tableId?: string;
  }) => void;
  /** 運営モード時のみテーブル一覧を渡す */
  tables?: TableOption[];
  activeTableId?: string;
}

const HOURS = [20, 21, 22, 23, 24];
const MINUTE_TENS = [0, 1, 2, 3, 4, 5];
const MINUTE_ONES_ROW1 = [0, 1, 2, 3, 4];
const MINUTE_ONES_ROW2 = [5, 6, 7, 8, 9];

type TimeStep = 'hour' | 'minuteTens' | 'minuteOnes' | 'done';

interface NewSlipInlineProps {
  onCreate: NewSlipDialogProps['onCreate'];
  tables?: TableOption[];
  activeTableId?: string;
  tableName?: string;
}

/** インライン伝票作成フォーム（伝票0件時に直接表示） */
export const NewSlipInline: React.FC<NewSlipInlineProps> = ({ onCreate, tables, activeTableId, tableName }) => {
  return (
    <NewSlipForm onCreate={onCreate} tables={tables} activeTableId={activeTableId} tableName={tableName} />
  );
};

export const NewSlipDialog: React.FC<NewSlipDialogProps> = ({ isOpen, onClose, onCreate, tables, activeTableId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-[400px] max-h-[90vh] flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--gold-color)]">新しい伝票</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xl leading-none" aria-label="閉じる">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <NewSlipForm onCreate={(data) => { onCreate(data); }} tables={tables} activeTableId={activeTableId} />
        </div>
      </div>
    </div>
  );
};

/** 共通フォーム部分 */
const NewSlipForm: React.FC<NewSlipInlineProps> = ({ onCreate, tables, activeTableId, tableName }) => {
  const [mainCategory, setMainCategory] = useState<MainCategory>('regular');
  const [customerType, setCustomerType] = useState<CustomerType>('regular');
  const [initialSetPrice, setInitialSetPrice] = useState(0);
  const [dohan, setDohan] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>(activeTableId);

  // Time state
  const [timeStep, setTimeStep] = useState<TimeStep>('hour');
  const [hour, setHour] = useState<number | null>(20);
  const [minuteTens, setMinuteTens] = useState<number | null>(0);
  const [minuteOnes, setMinuteOnes] = useState<number | null>(0);

  const getTimeStr = (): string => {
    const h = hour ?? 20;
    const m = (minuteTens ?? 0) * 10 + (minuteOnes ?? 0);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const timePreview = (): string => {
    const hStr = hour !== null ? String(hour).padStart(2, '0') : '__';
    const tStr = minuteTens !== null ? String(minuteTens) : '_';
    const oStr = minuteOnes !== null ? String(minuteOnes) : '_';
    return `${hStr}:${tStr}${oStr}`;
  };

  const handleMainCategory = (cat: MainCategory) => {
    setMainCategory(cat);
    if (cat === 'initial') setCustomerType('initial');
    else if (cat === 'regular') setCustomerType('regular');
    // R: wait for sub-selection
  };

  const handleRSub = (type: CustomerType) => {
    setCustomerType(type);
  };

  const handleHour = (h: number) => {
    setHour(h);
    setTimeStep('minuteTens');
  };

  const handleMinuteTens = (t: number) => {
    setMinuteTens(t);
    setTimeStep('minuteOnes');
  };

  const handleMinuteOnes = (o: number) => {
    setMinuteOnes(o);
    setTimeStep('done');
  };

  const handleTimeBack = () => {
    if (timeStep === 'minuteOnes') { setMinuteTens(null); setTimeStep('minuteTens'); }
    else if (timeStep === 'minuteTens') { setHour(null); setTimeStep('hour'); }
  };

  const handleCreate = () => {
    onCreate({
      customerType,
      initialSetPrice: customerType === 'initial' ? initialSetPrice : 0,
      entryTime: getTimeStr(),
      dohan,
      tableId: selectedTableId,
    });
  };

  const btnBase = 'rounded-lg border-2 font-bold transition-all duration-200 cursor-pointer';
  const btnActive = 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]';
  const btnInactive = 'border-[var(--border-color)] bg-[var(--input-bg)] text-white hover:border-gray-400';
  const timeBtnBase = 'min-w-[42px] min-h-[42px] rounded-md font-bold text-sm transition-all duration-200 border cursor-pointer';
  const timeBtnActive = 'bg-blue-600 text-white border-blue-600';
  const timeBtnInactive = 'border-gray-600 text-gray-200 bg-transparent hover:border-gray-400';

  return (
    <div className="px-5 py-4 flex flex-col gap-4">
      {/* テーブル名表示（インライン時） */}
      {tableName && (
        <div className="text-center">
          <span className="text-lg font-bold text-[var(--gold-color)]">{tableName}</span>
          <span className="text-sm text-gray-400 ml-2">— 新しい伝票</span>
        </div>
      )}

      {/* テーブル選択（運営モード時のみ） */}
      {tables && tables.length > 0 && (
        <div>
          <label className="text-xs text-gray-400 mb-2 block">テーブル</label>
          <div className="grid grid-cols-3 gap-1.5">
            {tables.map(t => (
              <button key={t.id} onClick={() => setSelectedTableId(t.id)}
                className={`py-2.5 text-sm ${btnBase} ${selectedTableId === t.id ? btnActive : btnInactive}`}
              >{t.name}</button>
            ))}
          </div>
        </div>
      )}

      {/* 客種 */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">客種</label>
        <div className="grid grid-cols-3 gap-2">
          {([['initial', '新規'], ['r', 'R'], ['regular', '正規']] as [MainCategory, string][]).map(([val, lbl]) => (
            <button key={val} onClick={() => handleMainCategory(val)}
              className={`py-3 text-base ${btnBase} ${mainCategory === val ? btnActive : btnInactive}`}
            >{lbl}</button>
          ))}
        </div>
        {/* R sub-selection */}
        {mainCategory === 'r' && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => handleRSub('r_within')}
              className={`py-2.5 text-sm ${btnBase} ${customerType === 'r_within' ? btnActive : btnInactive}`}
            >チケット有り</button>
            <button onClick={() => handleRSub('r_after')}
              className={`py-2.5 text-sm ${btnBase} ${customerType === 'r_after' ? btnActive : btnInactive}`}
            >チケット無し</button>
          </div>
        )}
        {/* Initial set price */}
        {mainCategory === 'initial' && (
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[0, 1000, 3000, 5000].map(p => (
              <button key={p} onClick={() => setInitialSetPrice(p)}
                className={`py-2 text-xs ${btnBase} ${initialSetPrice === p ? btnActive : btnInactive}`}
              >¥{p.toLocaleString()}</button>
            ))}
          </div>
        )}
      </div>

      {/* 入店時間 */}
      <div>
        <label className="text-xs text-gray-400 mb-1 block">入店時間</label>
        <div className="text-2xl font-mono font-bold text-center mb-2 tracking-widest">
          {timePreview()}
        </div>

        {timeStep !== 'hour' && timeStep !== 'done' && (
          <button onClick={handleTimeBack} className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer bg-transparent border-none mb-2">← 戻る</button>
        )}

        {timeStep === 'hour' && (
          <div className="flex gap-1.5 justify-center">
            {HOURS.map(h => (
              <button key={h} onClick={() => handleHour(h)}
                className={`flex-1 ${timeBtnBase} ${hour === h ? timeBtnActive : timeBtnInactive}`}
              >{h}</button>
            ))}
          </div>
        )}
        {timeStep === 'minuteTens' && (
          <div className="flex gap-1.5 justify-center">
            {MINUTE_TENS.map(t => (
              <button key={t} onClick={() => handleMinuteTens(t)}
                className={`flex-1 ${timeBtnBase} ${minuteTens === t ? timeBtnActive : timeBtnInactive}`}
              >{t}_</button>
            ))}
          </div>
        )}
        {timeStep === 'minuteOnes' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5 justify-center">
              {MINUTE_ONES_ROW1.map(o => (
                <button key={o} onClick={() => handleMinuteOnes(o)}
                  className={`flex-1 ${timeBtnBase} ${minuteOnes === o ? timeBtnActive : timeBtnInactive}`}
                >{o}</button>
              ))}
            </div>
            <div className="flex gap-1.5 justify-center">
              {MINUTE_ONES_ROW2.map(o => (
                <button key={o} onClick={() => handleMinuteOnes(o)}
                  className={`flex-1 ${timeBtnBase} ${minuteOnes === o ? timeBtnActive : timeBtnInactive}`}
                >{o}</button>
              ))}
            </div>
          </div>
        )}
        {timeStep === 'done' && (
          <div className="text-center">
            <button onClick={() => setTimeStep('hour')} className="text-xs text-gray-400 hover:text-[var(--accent-color)] cursor-pointer bg-transparent border-none">
              時間を変更
            </button>
          </div>
        )}
      </div>

      {/* 同伴 */}
      <div
        className={`flex justify-between items-center cursor-pointer bg-[var(--input-bg)] p-3 rounded-lg border transition-all duration-200 select-none ${
          dohan ? 'border-[var(--gold-color)] shadow-[0_0_8px_rgba(212,175,55,0.2)]' : 'border-[var(--border-color)] hover:border-gray-500'
        }`}
        onClick={() => setDohan(!dohan)}
      >
        <div>
          <div className="font-bold text-sm">同伴</div>
          <div className="text-xs text-gray-400">+¥3,000</div>
        </div>
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          dohan ? 'border-[var(--gold-color)] bg-[var(--gold-color)]' : 'border-[var(--gold-color)] bg-transparent'
        }`}>
          {dohan && <span className="text-black font-bold text-sm leading-none">✓</span>}
        </div>
      </div>

      {/* 作成ボタン */}
      <button onClick={handleCreate}
        className="w-full py-3 rounded-lg border-none bg-[var(--gold-color)] text-black font-bold text-base cursor-pointer hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
      >作成</button>
    </div>
  );
};
