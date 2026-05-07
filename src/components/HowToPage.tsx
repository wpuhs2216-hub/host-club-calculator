import { useState } from 'react';

type Section = 'slip' | 'basic' | 'order' | 'checkout' | 'budget' | 'lo' | 'faq';

const sections: { id: Section; icon: string; label: string }[] = [
  { id: 'slip', icon: '📝', label: '伝票を作る' },
  { id: 'basic', icon: '👤', label: '基本情報' },
  { id: 'order', icon: '🍾', label: 'オーダー' },
  { id: 'checkout', icon: '💰', label: '会計' },
  { id: 'budget', icon: '🤖', label: '予算プランナー' },
  { id: 'lo', icon: '📋', label: '全卓会計' },
  { id: 'faq', icon: '❓', label: 'よくある質問' },
];

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
      {children}
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col gap-2 mt-2 ml-1">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed">
          <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--gold-color)] text-black flex items-center justify-center text-xs font-bold">{i + 1}</span>
          <span className="pt-0.5">{step}</span>
        </li>
      ))}
    </ol>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border-color)] last:border-b-0 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-[rgba(255,215,0,0.08)] border border-[rgba(255,215,0,0.2)] text-sm">
      <span className="text-[var(--gold-color)] font-bold">💡 ポイント: </span>
      {children}
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 p-3 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-sm">
      <span className="text-[var(--danger-color)] font-bold">⚠ 注意: </span>
      {children}
    </div>
  );
}

function SlipSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">伝票の作成手順</h3>
        <StepList steps={[
          'サイドバーの「+ 伝票追加」をタップ',
          '客種を選択（新規 / R / 正規）',
          'Rの場合 →「チケット有り」or「チケット無し」を選択',
          '新規の場合 → セット料金を選択（¥0 / ¥1,000 / ¥3,000 / ¥5,000）',
          '入店時間を入力（時 → 十の位 → 一の位）',
          '同伴がある場合はチェックを入れる',
          '「作成」をタップ',
        ]} />
        <Tip>入店時間の入力を間違えたら「← 戻る」で前のステップに戻れます</Tip>
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">客種の見分け方</h3>
        <InfoRow label="新規" value="1回目の来店" />
        <InfoRow label="R（チケット有り）" value="2回目 / 2週間以内+チケット所持" />
        <InfoRow label="R（チケット無し）" value="2回目 / チケット紛失・期限切れ" />
        <InfoRow label="正規" value="3回目以降の来店" />
      </Card>
    </div>
  );
}

function BasicSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">基本情報タブ</h3>
        <p className="text-sm text-gray-400 mb-3">伝票の基本設定を変更できます</p>
        <InfoRow label="客種の変更" value="「新規」「R」「正規」ボタンで切替" />
        <InfoRow label="入店時間の変更" value="時刻表示をタップ → 再入力" />
        <InfoRow label="同伴" value="チェックで ON/OFF（+¥3,000）" />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">割引オプション</h3>
        <p className="text-sm text-gray-400 mb-3">「割引オプション」をタップすると展開されます</p>
        <InfoRow label="セット料金半額" value="正規のみ対象" />
        <InfoRow label="女子会デー" value="カン・ショット・シャンパン半額" />
        <InfoRow label="お客様感謝DAY" value="セット半額自動ON + カン・ショット半額" />
        <InfoRow label="セブンラック" value="他イベントと併用OK" />
        <InfoRow label="ゴールドカード" value="セット¥0 / 延長¥1,000" />
        <InfoRow label="複数指名" value="「−」「+」で人数調整" />
        <Warning>女子会デーと感謝DAYは同時に使えません。ゴールドカードとセット半額も併用不可です。</Warning>
      </Card>
    </div>
  );
}

function OrderSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">オーダーの追加</h3>
        <StepList steps={[
          '「+ オーダーを追加」をタップ',
          'カテゴリを選択（定番 / シャンパン / 焼酎・果実酒 / 特殊・タワー）',
          '商品をタップして選択（金色の枠がつく）',
          '半額対象の場合 →「半額適用」にチェック',
          '「選択したアイテムを追加する」をタップ',
        ]} />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">数量の変更</h3>
        <InfoRow label="1個ずつ" value="「+」「−」ボタン" />
        <InfoRow label="5個ずつ" value="「+5」「−5」ボタン" />
        <InfoRow label="削除" value="「削除」ボタン" />
        <Tip>カン・ペットボトル・ショット系は常時表示で削除できません。数量を0にすれば計算に含まれません。</Tip>
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">オリシャン（自由入力）</h3>
        <StepList steps={[
          '「特殊/タワー」タブ →「オリシャン / その他」を選択',
          '商品名を入力',
          '金額を入力',
          '「選択したアイテムを追加する」をタップ',
        ]} />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">半額のルール</h3>
        <InfoRow label="カンの半額" value="¥700固定（¥750ではない）" />
        <InfoRow label="ショット系の半額" value="¥1,000" />
        <InfoRow label="新規・Rのシャンパン" value="1本だけ半額" />
        <InfoRow label="女子会・セブンラック" value="シャンパン何本でも半額" />
        <Warning>新規・Rでシャンパン2本目以降は「半額適用済み（1本制限）」と表示され、半額にできません。</Warning>
      </Card>
    </div>
  );
}

function CheckoutSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">会計タブの見方</h3>
        <InfoRow label="現在のお会計（税込）" value="TAX/SVC込みの最終合計" />
        <InfoRow label="時刻表示" value="✎をタップで時刻変更可能" />
        <InfoRow label="1つ前" value="1セット前の会計金額" />
        <InfoRow label="内訳" value="セット・延長・指名・オーダーの明細" />
        <InfoRow label="料金スケジュール" value="時間帯ごとの合計金額一覧" />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">料金スケジュール</h3>
        <p className="text-sm leading-relaxed">入店時刻から閉店（25:00）まで、1時間刻みで合計を表示します。「お客様が○時まで滞在したらいくらか」が一目で分かります。</p>
        <Tip>各時間帯をタップすると内訳が展開されます。</Tip>
      </Card>
    </div>
  );
}

function BudgetSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">予算プランナーの使い方</h3>
        <p className="text-sm text-gray-400 mb-2">お客様の予算に合わせた注文をAIが自動提案します</p>
        <StepList steps={[
          '予算タブを開く',
          '「目標金額」を入力（テキスト欄 or スライダー）',
          '滞在時間をタップして選択',
          '表示されたおすすめから「+ 追加」をタップ',
        ]} />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">表示の見方</h3>
        <InfoRow label="白いボタン" value="予算内の時間帯" />
        <InfoRow label="金色のボタン" value="選択中の時間帯" />
        <InfoRow label="赤いボタン" value="予算オーバーの時間帯" />
        <InfoRow label="「残り」" value="あといくら使えるか" />
        <InfoRow label="「超過」" value="予算をいくらオーバーか" />
      </Card>
    </div>
  );
}

function LOSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">全卓会計</h3>
        <p className="text-sm text-gray-400 mb-2">全テーブルの伝票を一覧で確認・操作する画面です</p>
        <InfoRow label="「現在」モード" value="現時点での会計金額" />
        <InfoRow label="「ラストまで」モード" value="閉店時の会計金額" />
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">操作ボタン</h3>
        <InfoRow label="開く" value="計算画面で伝票を開く" />
        <InfoRow label="編集" value="客種・割引・オーダーをその場で変更" />
        <InfoRow label="移動" value="伝票を別テーブルに移す" />
        <Warning>「全卓リセット」は全伝票を一括削除します。元に戻せません。</Warning>
      </Card>

      <Card>
        <h3 className="font-bold text-[var(--gold-color)] mb-2">伝票の移動</h3>
        <StepList steps={[
          '「移動」をタップ',
          '移動先テーブルが表示される',
          '移動先をタップ → 完了',
        ]} />
      </Card>
    </div>
  );
}

function FAQSection() {
  const faqs = [
    { q: '客種を間違えて作ってしまった', a: '基本情報タブで客種ボタンをタップすれば変更できます。' },
    { q: 'オーダーを間違えて追加した', a: 'オーダータブで「削除」ボタンをタップ。ピン留め商品は数量を0にすればOK。' },
    { q: '入店時間を間違えた', a: '基本情報タブの時刻表示をタップして再入力できます。' },
    { q: 'セブンラックタワーが見つからない', a: '基本情報タブで「セブンラック」をONにしてください。ONにすると特殊/タワーに表示されます。' },
    { q: 'シャンパンの半額が適用できない', a: '新規・Rは1本制限です。「半額適用済み（1本制限）」と出たら、それ以上は半額にできません。' },
    { q: '感謝DAY中にセット半額がOFFにできない', a: '感謝DAYでは自動でONになり、手動切替できない仕様です。' },
    { q: '予算タブで時間帯が赤い', a: 'その時間帯まで滞在すると予算オーバーという意味です。前の時間帯を選ぶか予算を上げてください。' },
    { q: '営業時間外と表示される', a: '現在時刻が営業時間（20:00〜25:00）外のためです。入店1時間後として計算されます。' },
  ];

  return (
    <div className="flex flex-col gap-2">
      {faqs.map((faq, i) => (
        <Card key={i}>
          <p className="font-bold text-sm text-[var(--accent-color)]">Q: {faq.q}</p>
          <p className="text-sm mt-1.5 text-[var(--text-color)]">A: {faq.a}</p>
        </Card>
      ))}
    </div>
  );
}

export function HowToPage() {
  const [activeSection, setActiveSection] = useState<Section>('slip');

  const renderSection = () => {
    switch (activeSection) {
      case 'slip': return <SlipSection />;
      case 'basic': return <BasicSection />;
      case 'order': return <OrderSection />;
      case 'checkout': return <CheckoutSection />;
      case 'budget': return <BudgetSection />;
      case 'lo': return <LOSection />;
      case 'faq': return <FAQSection />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-[var(--gold-color)] flex items-center gap-2">
        <span>📖</span>
        <span>使い方ガイド</span>
      </h2>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeSection === s.id
                ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                : 'bg-[var(--input-bg)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--gold-color)]'
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {renderSection()}
    </div>
  );
}
