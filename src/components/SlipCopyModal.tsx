import { useState, useMemo, useCallback } from 'react';
import type { CalculatorState } from '../hooks/useCalculator';

export interface SlipInfo {
  id: string;
  name: string;
  tableId?: string;
  tableName?: string;
  state: CalculatorState;
}

export interface SlipCopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (sourceSlipId: string, mode: 'full' | 'selective', selectedFields?: string[]) => void;
  availableSlips: SlipInfo[];
}

const FIELD_GROUPS = [
  { id: 'customerType', label: '客種', description: '客種 + セット料金' },
  { id: 'entryTime', label: '入店時間', description: '入店時間' },
  { id: 'dohan', label: '同伴', description: '同伴フラグ' },
  { id: 'events', label: 'イベント', description: '女子会・感謝DAY・セブンラック・ゴールドカード' },
  { id: 'setHalfOff', label: 'セット半額', description: 'セット料金半額' },
  { id: 'nomination', label: '指名', description: '複数指名の人数' },
  { id: 'orders', label: '注文', description: '注文リスト (全品コピー)' },
] as const;

type Step = 'source' | 'mode' | 'selective';

const CUSTOMER_TYPE_LABELS: Record<string, string> = {
  initial: '新規',
  r_within: 'R(有)',
  r_after: 'R(無)',
  regular: '正規',
};

function slipSummary(state: CalculatorState): string {
  const parts: string[] = [];
  const typeLabel = CUSTOMER_TYPE_LABELS[state.customerType] ?? state.customerType;
  parts.push(typeLabel);
  if (state.entryTime) parts.push(state.entryTime);
  if (state.orders.length > 0) parts.push(`注文${state.orders.length}件`);
  return parts.join(' / ');
}

export const SlipCopyModal: React.FC<SlipCopyModalProps> = ({
  isOpen,
  onClose,
  onCopy,
  availableSlips,
}) => {
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<Step>('source');

  const resetState = useCallback(() => {
    setSelectedSourceId(null);
    setSelectedFields(new Set());
    setStep('source');
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  // Determine initial step based on number of available slips
  const effectiveStep = useMemo(() => {
    if (availableSlips.length === 1 && step === 'source') {
      return 'mode';
    }
    return step;
  }, [availableSlips.length, step]);

  const effectiveSourceId = useMemo(() => {
    if (availableSlips.length === 1) return availableSlips[0].id;
    return selectedSourceId;
  }, [availableSlips, selectedSourceId]);

  const handleSourceSelect = useCallback((id: string) => {
    setSelectedSourceId(id);
    setStep('mode');
  }, []);

  const handleFullCopy = useCallback(() => {
    if (!effectiveSourceId) return;
    onCopy(effectiveSourceId, 'full');
    resetState();
  }, [effectiveSourceId, onCopy, resetState]);

  const handleSelectiveMode = useCallback(() => {
    setStep('selective');
  }, []);

  const handleFieldToggle = useCallback((fieldId: string) => {
    setSelectedFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }, []);

  const handleCreate = useCallback(() => {
    if (!effectiveSourceId || selectedFields.size === 0) return;
    onCopy(effectiveSourceId, 'selective', Array.from(selectedFields));
    resetState();
  }, [effectiveSourceId, selectedFields, onCopy, resetState]);

  const handleBack = useCallback(() => {
    if (effectiveStep === 'selective') {
      setStep('mode');
      setSelectedFields(new Set());
    } else if (effectiveStep === 'mode' && availableSlips.length > 1) {
      setStep('source');
      setSelectedSourceId(null);
    }
  }, [effectiveStep, availableSlips.length]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[400px] max-h-[80vh] flex flex-col rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-bold text-[var(--text-color)]">伝票コピー</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors text-xl leading-none"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Step: Source selection */}
          {effectiveStep === 'source' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">コピー元の伝票を選択</p>
              <div className="flex flex-col gap-2">
                {availableSlips.map((slip) => (
                  <button
                    key={slip.id}
                    onClick={() => handleSourceSelect(slip.id)}
                    className="w-full text-left p-3 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] hover:border-[var(--gold-color)] transition-all duration-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-[var(--gold-color)]">
                        {slip.name}
                      </span>
                      {slip.tableName && (
                        <span className="text-xs text-gray-500">({slip.tableName})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {slipSummary(slip.state)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Mode selection */}
          {effectiveStep === 'mode' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">コピー方法を選択</p>
              {effectiveSourceId && (
                <div className="text-xs text-gray-500 mb-4">
                  コピー元:{' '}
                  <span className="text-[var(--gold-color)] font-bold">
                    {availableSlips.find((s) => s.id === effectiveSourceId)?.name}
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleFullCopy}
                  className="flex-1 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] hover:border-[var(--gold-color)] hover:bg-[rgba(0,188,212,0.08)] transition-all duration-200 text-center"
                >
                  <div className="text-2xl mb-1">📋</div>
                  <div className="font-bold text-[var(--text-color)]">全コピー</div>
                  <div className="text-xs text-gray-400 mt-1">全項目をコピー</div>
                </button>
                <button
                  onClick={handleSelectiveMode}
                  className="flex-1 p-4 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)] hover:border-[var(--gold-color)] hover:bg-[rgba(0,188,212,0.08)] transition-all duration-200 text-center"
                >
                  <div className="text-2xl mb-1">✅</div>
                  <div className="font-bold text-[var(--text-color)]">選択コピー</div>
                  <div className="text-xs text-gray-400 mt-1">項目を選んでコピー</div>
                </button>
              </div>
            </div>
          )}

          {/* Step: Selective field list */}
          {effectiveStep === 'selective' && (
            <div>
              <p className="text-sm text-gray-400 mb-3">コピーする項目を選択</p>
              <div className="flex flex-col gap-2">
                {FIELD_GROUPS.map((group) => (
                  <label
                    key={group.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 select-none ${
                      selectedFields.has(group.id)
                        ? 'border-[var(--gold-color)] bg-[rgba(0,188,212,0.08)] shadow-[0_0_8px_rgba(0,188,212,0.15)]'
                        : 'border-[var(--border-color)] bg-[var(--input-bg)] hover:border-gray-500'
                    }`}
                    onClick={() => handleFieldToggle(group.id)}
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                        selectedFields.has(group.id)
                          ? 'border-[var(--gold-color)] bg-[var(--gold-color)]'
                          : 'border-gray-500 bg-transparent'
                      }`}
                    >
                      {selectedFields.has(group.id) && (
                        <span className="text-black text-xs font-bold leading-none">✓</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-[var(--text-color)]">{group.label}</div>
                      <div className="text-xs text-gray-400">{group.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-[var(--border-color)]">
          {effectiveStep !== 'source' && (
            <button
              onClick={handleBack}
              className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-transparent text-gray-400 hover:text-white hover:border-gray-400 transition-colors text-sm font-bold"
            >
              戻る
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-lg border border-[var(--border-color)] bg-transparent text-gray-400 hover:text-white hover:border-gray-400 transition-colors text-sm font-bold"
          >
            キャンセル
          </button>
          {effectiveStep === 'selective' && (
            <button
              onClick={handleCreate}
              disabled={selectedFields.size === 0}
              className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
                selectedFields.size > 0
                  ? 'bg-[var(--gold-color)] text-black hover:bg-[var(--accent-hover)] shadow-sm'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              作成
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
