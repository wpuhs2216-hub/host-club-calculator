import React from 'react';
import type { OrderItem } from '../hooks/useCalculator';
import { OrderSection } from './OrderSection';

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderItem[];
  customerType: string;
  onAdd: (name: string, price: number, isTaxIncluded?: boolean, canHalfOff?: boolean, isHalfOff?: boolean) => void;
  onUpdateCount: (id: string, delta: number) => void;
  onSetCount: (id: string, count: number) => void;
  onToggleHalfOff: (id: string) => void;
  onRemove: (id: string) => void;
  isGirlsParty: boolean;
  isAppreciationDay: boolean;
  isSevenLuck: boolean;
}

export const OrderDialog: React.FC<OrderDialogProps> = ({
  isOpen, onClose, orders, customerType, onAdd, onUpdateCount, onSetCount, onToggleHalfOff, onRemove,
  isGirlsParty, isAppreciationDay, isSevenLuck
}) => {
  if (!isOpen) return null;

  // 追加済みオーダー数（ピンなし＝ユーザー追加分）
  const addedCount = orders.filter(o => !o.isPinned && o.count > 0).length;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end justify-center">
      {/* 背景オーバーレイ */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* ダイアログ本体 — 画面下部から立ち上がるシート型 */}
      <div className="relative w-full max-w-2xl bg-[var(--card-bg,#1a1a2e)] border-t border-[var(--border-color)] rounded-t-2xl shadow-2xl max-h-[92vh] flex flex-col animate-slide-up">
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] shrink-0">
          <h3 className="m-0 text-[var(--gold-color)] font-bold text-base flex items-center gap-2">
            <span>◇</span> 商品オーダー
            {addedCount > 0 && (
              <span className="ml-2 text-xs bg-[var(--gold-color)] text-black px-2 py-0.5 rounded-full font-bold">
                {addedCount}品
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full border border-[var(--border-color)] bg-[var(--input-bg)] text-[var(--text-color)] flex items-center justify-center text-lg cursor-pointer hover:border-[var(--gold-color)] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* コンテンツ — スクロール可能 */}
        <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--gold-color) transparent' }}>
          <OrderSection
            orders={orders}
            customerType={customerType}
            onAdd={onAdd}
            onUpdateCount={onUpdateCount}
            onSetCount={onSetCount}
            onToggleHalfOff={onToggleHalfOff}
            onRemove={onRemove}
            isGirlsParty={isGirlsParty}
            isAppreciationDay={isAppreciationDay}
            isSevenLuck={isSevenLuck}
          />
        </div>
      </div>
    </div>
  );
};
