import { useState } from 'react';

type Section =
  | 'basics' | 'customer' | 'pricing' | 'companion' | 'gold'
  | 'events' | 'champagne' | 'menu' | 'calc' | 'examples'
  | 'mistakes' | 'quiz' | 'glossary';

const sections: { id: Section; label: string }[] = [
  { id: 'basics', label: '基礎知識' },
  { id: 'customer', label: '客種' },
  { id: 'pricing', label: '料金表' },
  { id: 'companion', label: '同伴・指名' },
  { id: 'gold', label: 'ゴールドカード' },
  { id: 'events', label: 'イベント' },
  { id: 'champagne', label: 'シャンパン' },
  { id: 'menu', label: 'メニュー' },
  { id: 'calc', label: '計算の流れ' },
  { id: 'examples', label: '計算例' },
  { id: 'mistakes', label: 'よくあるミス' },
  { id: 'quiz', label: 'テスト' },
  { id: 'glossary', label: '用語集' },
];

function Card({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
      {title && <h3 className="font-bold text-[var(--gold-color)] mb-3">{title}</h3>}
      {children}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--border-color)] last:border-b-0 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className={bold ? 'font-bold text-[var(--gold-color)]' : 'font-bold'}>{value}</span>
    </div>
  );
}

function Note({ type, children }: { type: 'tip' | 'warn'; children: React.ReactNode }) {
  const styles = type === 'tip'
    ? 'bg-[rgba(255,215,0,0.08)] border-[rgba(255,215,0,0.2)]'
    : 'bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.2)]';
  const icon = type === 'tip' ? '💡' : '⚠';
  return <div className={`mt-3 p-3 rounded-lg border text-sm ${styles}`}>{icon} {children}</div>;
}

function Quiz({ questions }: { questions: { q: string; a: string }[] }) {
  const [show, setShow] = useState<Record<number, boolean>>({});
  return (
    <div className="flex flex-col gap-2 mt-3">
      <p className="text-xs text-gray-400 font-bold">練習問題</p>
      {questions.map((item, i) => (
        <div key={i} className="rounded-lg border border-[var(--border-color)] p-3">
          <p className="text-sm font-bold text-[var(--accent-color)]">{item.q}</p>
          <button
            onClick={() => setShow(s => ({ ...s, [i]: !s[i] }))}
            className="mt-2 text-xs text-[var(--gold-color)] cursor-pointer bg-transparent border-none underline"
          >{show[i] ? '答えを隠す' : '答えを見る'}</button>
          {show[i] && <p className="mt-1 text-sm text-[var(--text-color)]">→ {item.a}</p>}
        </div>
      ))}
    </div>
  );
}

function BasicsSection() {
  return (
    <Card title="基礎知識">
      <Row label="営業時間" value="20:00〜25:00（翌1:00）" />
      <Row label="TAX/SVC" value="合計 35%（税10% + サービス25%）" bold />
      <Row label="端数処理" value="百円単位切り上げ" />
      <Note type="tip">例: ¥12,345 → ¥12,400</Note>
    </Card>
  );
}

function CustomerSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="客種の見分け方">
        <Row label="新規" value="1回目の来店" />
        <Row label="R（リピーター）" value="2回目の来店" />
        <Row label="正規" value="3回目以降の来店" />
      </Card>
      <Card title="R の2種類">
        <Row label="Rチケット有り" value="2週間以内＋チケット所持" />
        <Row label="Rチケット無し" value="2週間超過 / 紛失・忘れ" />
      </Card>
      <Card title="判別フロー">
        <div className="text-sm flex flex-col gap-1.5">
          <p>1. 初めてのお客様？ → <b>新規</b></p>
          <p>2. 2回目の来店？</p>
          <p className="ml-4">チケットあり＆2週間以内 → <b>Rチケット有り</b></p>
          <p className="ml-4">それ以外 → <b>Rチケット無し</b></p>
          <p>3. 3回目以降？ → <b>正規</b></p>
        </div>
      </Card>
      <Quiz questions={[
        { q: 'Q1: 初めて来店したお客様は？', a: '新規' },
        { q: 'Q2: 新規来店から10日後、チケットを家に忘れた → 何に分類？', a: 'Rチケット無し（チケット無し扱い）' },
        { q: 'Q3: 5回目の来店は？', a: '正規' },
      ]} />
    </div>
  );
}

function PricingSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="新規">
        <Row label="セット料金" value="¥0 / ¥1,000 / ¥3,000 / ¥5,000" />
        <Row label="延長料金" value="¥2,000 / 1時間" />
        <Row label="指名料" value="¥1,000" />
        <Row label="T.C" value="¥0" />
        <Row label="初回セット" value="1時間" bold />
        <Note type="tip">¥0は無料キャンペーン期間のみ。通常は「フリー回し飲み」¥1,000/¥3,000/¥5,000から選択</Note>
        <Note type="warn">同伴は適用不可。最初のショットは無料（2杯目から半額）</Note>
        <Note type="tip">オーダー無し → 非課税（TAX/SVC 0%）</Note>
      </Card>

      <Card title="Rチケット有り">
        <Row label="セット料金" value="¥0" bold />
        <Row label="延長料金" value="¥1,000 / 1時間" />
        <Row label="指名料" value="¥1,000" />
        <Row label="T.C" value="¥0" />
        <Row label="初回セット" value="2時間" bold />
      </Card>

      <Card title="Rチケット無し">
        <Row label="セット料金" value="¥2,000" />
        <Row label="延長料金" value="¥1,000 / 1時間" />
        <Row label="指名料" value="¥1,000" />
        <Row label="T.C" value="¥500" />
        <Row label="初回セット" value="2時間" bold />
        <Note type="tip">サービスドリンクあり（下記参照）</Note>
      </Card>

      <Card title="正規">
        <p className="text-xs text-gray-400 mb-2">21:00入店が早番/遅番の境界</p>
        <div className="grid grid-cols-3 gap-1 text-xs text-center mb-2">
          <span className="text-gray-400"></span>
          <span className="font-bold text-[var(--accent-color)]">早番（〜20:59）</span>
          <span className="font-bold text-[var(--gold-color)]">遅番（21:00〜）</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-sm text-center">
          <span className="text-gray-400 text-left">セット</span><span>¥2,000</span><span>¥5,000</span>
          <span className="text-gray-400 text-left">延長</span><span>¥3,000</span><span>¥3,000</span>
          <span className="text-gray-400 text-left">指名</span><span>¥3,000</span><span>¥3,000</span>
          <span className="text-gray-400 text-left">T.C</span><span>¥500</span><span>¥500</span>
          <span className="text-gray-400 text-left">初回</span><span className="font-bold">1時間</span><span className="font-bold">1時間</span>
        </div>
        <Note type="tip">サービスドリンクあり（下記参照）</Note>
      </Card>

      <Card title="T.C（テーブルチャージ）">
        <p className="text-sm">Rチケット無しと正規のみ発生（来店時に必ずかかる）</p>
        <p className="text-sm mt-1">新規・Rチケット有りは T.C なし（¥0）</p>
      </Card>

      <Card title="サービスドリンク（Rチケット無し・正規）">
        <p className="text-sm mb-2">来店時に以下のいずれかを<b className="text-[var(--gold-color)]">無料</b>で提供（会計に含まない）:</p>
        <Row label="ハーフボトル1本" value="鏡月/神の河/一刻者/梅酒/杏露酒/林檎酒" />
        <Row label="ペットボトル2本" value="" />
        <Note type="warn">両方オーダーした場合はお酒の方をサービスで出す</Note>
      </Card>

      <Card title="覚えるポイント">
        <div className="text-sm flex flex-col gap-1">
          <p>・新規・正規 → 初回 <b>1時間</b></p>
          <p>・R系 → 初回 <b>2時間</b></p>
          <p>・新規に同伴はつかない</p>
          <p>・新規でオーダー無し → 非課税</p>
        </div>
      </Card>

      <Quiz questions={[
        { q: 'Q4: Rチケット有りのお客様が3時間滞在 → 延長は何セット？', a: '1セット（3時間 − 初回2時間 = 延長1本）' },
        { q: 'Q5: 正規のお客様が21:30に入店 → セット料金は？', a: '¥5,000（遅番）' },
        { q: 'Q6: 新規のお客様にオーダーが無い → TAX/SVCは何%？', a: '0%' },
      ]} />
    </div>
  );
}

function CompanionSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="同伴料">
        <Row label="同伴料" value="¥3,000" />
        <Note type="warn">新規には適用されない</Note>
      </Card>
      <Card title="複数指名">
        <Row label="追加指名料" value="¥3,000 × 追加人数" />
        <p className="text-sm mt-2 text-gray-400">全客種に適用可能。例: 追加2人 → ¥6,000</p>
      </Card>
      <Quiz questions={[
        { q: 'Q7: 正規、同伴あり、追加指名1人 → 指名関連の合計は？', a: '指名¥3,000 + 同伴¥3,000 + 追加指名¥3,000 = ¥9,000' },
        { q: 'Q8: 新規のお客様に同伴料はかかる？', a: 'かからない' },
      ]} />
    </div>
  );
}

function GoldSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="ゴールドカード">
        <Row label="セット料金" value="¥0 に上書き" bold />
        <Row label="延長料金" value="¥1,000 に上書き" bold />
        <Row label="初回セット" value="2時間" bold />
        <div className="text-sm mt-3 flex flex-col gap-1">
          <p>・どの客種でも使える</p>
          <p>・指名料・T.C・同伴料は変わらない</p>
        </div>
        <Note type="warn">セット半額とは併用不可（どちらか一方のみ）</Note>
      </Card>
      <Quiz questions={[
        { q: 'Q9: 正規（遅番）、ゴールドカード、3時間滞在 → セット+延長の合計は？', a: 'セット¥0 + 延長¥1,000（3h − 初回2h = 1本）= ¥1,000' },
      ]} />
    </div>
  );
}

function EventsSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="イベント一覧">
        {[
          { name: '女子会デー', when: '隔週木曜 / 2人以上来店', effects: 'カン・ショット・シャンパン半額' },
          { name: '感謝デー', when: '月の第一営業日', effects: 'セット半額（正規のみ）・カン・ショット半額' },
          { name: 'セブンラック', when: 'その日の来店7組目', effects: 'カン・ショット・シャンパン半額 + タワー可' },
          { name: 'スタシャン', when: '全卓最初の1本 / 22時まで', effects: 'シャンパン半額（リステル〜ゴールド）' },
        ].map((e, i) => (
          <div key={i} className="py-2 border-b border-[var(--border-color)] last:border-b-0">
            <div className="flex justify-between">
              <span className="font-bold text-sm">{e.name}</span>
              <span className="text-xs text-gray-400">{e.when}</span>
            </div>
            <p className="text-xs text-[var(--accent-color)] mt-0.5">{e.effects}</p>
          </div>
        ))}
      </Card>

      <Card title="併用ルール">
        <div className="text-sm flex flex-col gap-1.5">
          <p>・女子会デー ⇔ 感謝デー → <b className="text-[var(--danger-color)]">同時にできない</b></p>
          <p>・セブンラック → どちらとも併用OK</p>
          <p>・感謝デー中 → セット半額が自動ON（手動切替不可）</p>
          <p>・セット半額は<b>正規のみ</b>対象</p>
          <p>・<b className="text-[var(--danger-color)]">二重半額は禁止</b></p>
        </div>
      </Card>

      <Card title="半額の計算方法">
        <Row label="セット・延長の半額" value="切り捨て" />
        <Row label="カンの半額" value="¥700固定（¥750ではない）" bold />
        <Row label="ショット系の半額" value="¥2,000 → ¥1,000" />
      </Card>

      <Quiz questions={[
        { q: 'Q10: 女子会デーと感謝デーは同時にONにできる？', a: 'できない（排他）' },
        { q: 'Q11: 感謝デー中、セット半額のボタンは操作できる？', a: 'できない（自動でONになる）' },
      ]} />
    </div>
  );
}

function ChampagneSection() {
  const champagnes = [
    { name: 'SPLブルー', price: '¥35,000' },
    { name: 'SPLホワイト', price: '¥50,000' },
    { name: 'SPLパープル', price: '¥50,000' },
    { name: 'SPLロゼ', price: '¥80,000' },
    { name: 'SPLジュエルワイン', price: '¥80,000' },
    { name: 'SPLZERO', price: '¥100,000' },
    { name: 'SPLレッド', price: '¥100,000' },
    { name: 'SPLゴールド', price: '¥150,000' },
  ];
  return (
    <div className="flex flex-col gap-3">
      <Card title="半額対象シャンパン（¥35,000〜¥150,000）">
        {champagnes.map((c, i) => <Row key={i} label={c.name} value={c.price} />)}
        <p className="text-xs text-gray-400 mt-2">※ リステル（¥20,000）、アスティ（¥28,000）はイベント半額の対象外</p>
      </Card>
      <Card title="いつ半額になるか">
        <Row label="女子会デー / セブンラック" value="何本でも半額" bold />
        <Row label="スタートシャンパン" value="全卓で最初の1本（22時まで）" bold />
        <Row label="新規・R" value="1本だけ半額（高い方優先）" />
        <Row label="正規（イベント無し）" value="半額なし" />
      </Card>
      <Quiz questions={[
        { q: 'Q12: 女子会デーでSPLロゼ2本注文 → 半額は何本？', a: '2本とも半額' },
        { q: 'Q13: 新規がSPLブルー2本注文 → 半額は何本？', a: '1本だけ半額' },
      ]} />
    </div>
  );
}

function MenuSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="定番">
        <Row label="ソフトドリンク" value="¥500" />
        <Row label="カクテル" value="¥1,000" />
        <Row label="レッドブル" value="¥1,500" />
        <Row label="1800" value="¥3,000" />
        <Row label="コカボム" value="¥3,000" />
        <Row label="茉莉花" value="¥15,000" />
      </Card>
      <Card title="常時表示（ピン留め）">
        <Row label="カン" value="¥1,500（半額時 ¥700）" />
        <Row label="ペットボトル" value="¥2,000" />
        <Row label="ショット系" value="¥2,000（半額時 ¥1,000）" />
      </Card>
      <Card title="焼酎・果実酒">
        <Row label="ハーフ杏露酒 / 林檎酒" value="¥3,500" />
        <Row label="ハーフ焼酎〈芋.麦〉梅酒" value="¥4,200" />
        <Row label="ハーフ鏡月" value="¥5,000" />
        <Row label="JAPAN" value="¥15,000" />
        <Row label="鍛高譚" value="¥15,000" />
        <Row label="黒霧島" value="¥15,000" />
        <Row label="吉四六" value="¥22,000" />
      </Card>
      <Card title="シャンパン">
        {[
          ['リステル', '¥20,000'], ['アスティ', '¥28,000'],
          ['SPLブルー', '¥35,000'], ['SPLホワイト', '¥50,000'],
          ['SPLパープル', '¥50,000'], ['SPLロゼ', '¥80,000'],
          ['SPLジュエルワイン', '¥80,000'], ['SPLZERO', '¥100,000'],
          ['SPLレッド', '¥100,000'], ['SPLゴールド', '¥150,000'],
          ['SPLルミナス', '¥200,000'], ['SPLブラック', '¥250,000'],
          ['SPLマグナム', '¥300,000'], ['SPLエメラルド', '¥350,000'],
          ['SPLルミナスマグナム', '¥400,000'], ['SPLプラチナ', '¥450,000'],
        ].map(([name, price], i) => <Row key={i} label={name} value={price} />)}
      </Card>
      <Card title="特殊・タワー">
        <Row label="オリシャン / その他" value="自由入力" />
        <Row label="テキーラスタンド（12）" value="¥22,000" />
        <Row label="テキーラスタンド（16）" value="¥28,000" />
        <Row label="テキーラスタンドVIP" value="¥45,000" />
        <Row label="セブンラックタワー" value="¥150,000（税込）" />
        <p className="text-xs text-gray-400 mt-1">※ セブンラックタワーはセブンラック時のみ注文可</p>
      </Card>
    </div>
  );
}

function CalcFlowSection() {
  return (
    <Card title="5ステップで計算">
      <ol className="flex flex-col gap-2 text-sm">
        {[
          '客種と入店時刻を確認 → セット・延長料金を決定',
          'ゴールドカードがあれば上書き（セット¥0、延長¥1,000）',
          '滞在時間から延長本数を計算\n→ 滞在時間（切り上げ） − 初回セット = 延長本数',
          '小計を出す\n→ セット+延長+指名+同伴+T.C+複数指名+オーダー',
          'TAX/SVCを加算して百円切り上げ\n→ 小計 × 1.35 → 百円切り上げ = 最終合計',
        ].map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="shrink-0 w-6 h-6 rounded-full bg-[var(--gold-color)] text-black flex items-center justify-center text-xs font-bold">{i + 1}</span>
            <span className="pt-0.5 whitespace-pre-line">{step}</span>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function ExampleCard({ title, conditions, steps, answer }: {
  title: string; conditions: string[]; steps: string[]; answer: string;
}) {
  return (
    <Card title={title}>
      <p className="text-xs text-gray-400 font-bold mb-1">前提</p>
      <ul className="text-sm mb-3">{conditions.map((c, i) => <li key={i}>・{c}</li>)}</ul>
      <p className="text-xs text-gray-400 font-bold mb-1">計算</p>
      <ol className="text-sm flex flex-col gap-0.5">
        {steps.map((s, i) => <li key={i}>{i + 1}. {s}</li>)}
      </ol>
      <div className="mt-3 p-2 rounded-lg bg-[rgba(255,215,0,0.1)] text-center">
        <span className="text-lg font-bold text-[var(--gold-color)]">{answer}</span>
      </div>
    </Card>
  );
}

function ExamplesSection() {
  return (
    <div className="flex flex-col gap-3">
      <ExampleCard
        title="例1: 新規 × オーダー無し（非課税）"
        conditions={['新規（セット¥1,000）', '20:30入店 → 22:00会計', 'オーダー: なし']}
        steps={[
          '滞在1.5h → 切り上げ 2時間',
          '初回1h → 延長 1本',
          'セット¥1,000 + 延長¥2,000 + 指名¥1,000 = ¥4,000',
          'オーダー無しの新規 → TAX/SVC 0%',
        ]}
        answer="合計: ¥4,000"
      />
      <ExampleCard
        title="例2: Rチケット有り × カン2本"
        conditions={['Rチケット有り', '20:00入店 → 23:00会計', 'カン × 2']}
        steps={[
          '滞在3h、初回2h → 延長 1本',
          'セット¥0 + 延長¥1,000 + 指名¥1,000 + カン¥3,000 = ¥5,000',
          'TAX/SVC: ¥5,000 × 35% = ¥1,750',
          '¥6,750 → 切り上げ',
        ]}
        answer="合計: ¥6,800"
      />
      <ExampleCard
        title="例3: 正規（早番）× 同伴+複数指名+シャンパン"
        conditions={['正規（20:30入店 → 早番）', '24:00会計（3.5h滞在）', '同伴あり、追加指名2人', 'SPLブルー × 1']}
        steps={[
          '滞在3.5h → 切り上げ4h、初回1h → 延長 3本',
          'セット¥2,000 + 延長¥9,000 = ¥11,000',
          '指名¥3,000 + 同伴¥3,000 + T.C¥500 + 追加指名¥6,000 = ¥12,500',
          'SPLブルー¥35,000（正規・イベント無し→半額なし）',
          '小計: ¥58,500、TAX/SVC: ¥20,475',
        ]}
        answer="合計: ¥79,000"
      />
      <ExampleCard
        title="例4: 正規 × 女子会デー × シャンパン2本"
        conditions={['正規（21:30入店 → 遅番）', '24:30会計（3h滞在）', '女子会デー', 'SPLロゼ × 2']}
        steps={[
          '滞在3h、初回1h → 延長 2本',
          'セット¥5,000 + 延長¥6,000 = ¥11,000',
          '指名¥3,000 + T.C¥500 = ¥3,500',
          'SPLロゼ → 女子会デーで両方半額 → ¥40,000×2 = ¥80,000',
          '小計: ¥94,500、TAX/SVC: ¥33,075',
        ]}
        answer="合計: ¥127,600"
      />
      <ExampleCard
        title="例5: 正規 × ゴールドカード"
        conditions={['正規（20:00入店）', '23:00会計（3h滞在）', 'ゴールドカード使用', 'オーダー: なし']}
        steps={[
          'ゴールドカードで上書き → 初回2h → 延長 1本',
          'セット¥0 + 延長¥1,000 = ¥1,000',
          '指名¥3,000 + T.C¥500 = ¥3,500',
          '小計: ¥4,500、TAX/SVC: ¥1,575',
        ]}
        answer="合計: ¥6,100"
      />
    </div>
  );
}

function MistakesSection() {
  const mistakes = [
    { mistake: '新規に同伴料をつけた', correct: '新規に同伴はつかない' },
    { mistake: '感謝デーと女子会デーを同時にON', correct: '排他なので同時にできない' },
    { mistake: 'ゴールドカード＋セット半額を両方ON', correct: '併用不可（どちらか一方）' },
    { mistake: 'カンの半額を¥750にした', correct: 'カンは ¥700固定' },
    { mistake: 'Rチケット有りにセット料金を取った', correct: 'セット料金は ¥0' },
    { mistake: '新規オーダー無しで税がかかった', correct: '非課税（0%）' },
    { mistake: '新規・Rでセット半額を適用した', correct: 'セット半額は正規のみ' },
    { mistake: '半額を二重に適用した', correct: '二重半額は禁止' },
    { mistake: '新規の最初のショットを半額にした', correct: '最初の1杯は無料' },
    { mistake: 'サービスドリンクを会計に入れた', correct: '無料（会計に含まない）' },
  ];
  return (
    <div className="flex flex-col gap-2">
      {mistakes.map((m, i) => (
        <Card key={i}>
          <p className="text-sm"><span className="text-[var(--danger-color)]">✗</span> {m.mistake}</p>
          <p className="text-sm mt-1"><span className="text-[var(--gold-color)]">→</span> {m.correct}</p>
        </Card>
      ))}
    </div>
  );
}

function QuizSection() {
  return (
    <div className="flex flex-col gap-3">
      <Card title="総合テスト">
        <p className="text-sm text-gray-400 mb-3">答えを見るボタンで確認できます</p>
      </Card>
      <Quiz questions={[
        { q: 'Q14: Rチケット無し、20:00入店、22:30会計、カン1本。合計は？', a: 'セット¥2,000+延長¥1,000+指名¥1,000+T.C¥500+カン¥1,500=¥6,000 → TAX¥2,100 → ¥8,100' },
        { q: 'Q15: 正規（遅番）、21:00入店、24:00会計、同伴あり、オーダー無し。合計は？', a: 'セット¥5,000+延長¥6,000+指名¥3,000+同伴¥3,000+T.C¥500=¥17,500 → TAX¥6,125 → ¥23,700' },
        { q: 'Q16: 新規（セット¥1,000）、20:00入店、21:00会計、ショット1杯（半額）。合計は？', a: 'セット¥1,000+指名¥1,000+ショット半額¥1,000=¥3,000 → TAX¥1,050 → ¥4,100' },
        { q: 'Q17: 正規にゴールドカードとセット半額を同時に適用できる？', a: 'できない（併用不可）' },
        { q: 'Q18: セブンラック中にSPLブルー3本注文（正規）。半額は何本？', a: '3本すべて半額' },
        { q: 'Q19: 感謝デー中の正規。セット半額は手動でONにする必要がある？', a: '不要（自動でONになる）' },
      ]} />
    </div>
  );
}

function GlossarySection() {
  const terms = [
    ['セット料金', '席についた時にかかる基本料金'],
    ['延長', '初回セット時間を超えた分、1時間ごとに追加される料金'],
    ['指名料', 'キャストを指名するときの料金'],
    ['同伴', 'お客様が店外からキャストと一緒に来店すること'],
    ['T.C', 'テーブルチャージ。Rチケット無しと正規に発生'],
    ['TAX/SVC', '税金＋サービス料（合計35%）'],
    ['カン', '缶ドリンク'],
    ['ショット系', 'ショットグラスで提供されるお酒'],
    ['SPL〜', 'シャンパンのブランド名'],
    ['早番 / 遅番', '21:00入店を境にした料金区分（正規のみ）'],
    ['ゴールドカード', 'セット・延長料金を大幅に割引する特別カード'],
    ['フリー回し飲み', '新規のセット料金プラン（¥1,000/¥3,000/¥5,000）'],
    ['サービスドリンク', 'Rチケット無し・正規に無料で提供されるドリンク'],
    ['スタシャン', 'スタートシャンパン。全卓最初のシャンパンが半額'],
  ];
  return (
    <Card title="用語集">
      {terms.map(([term, desc], i) => <Row key={i} label={term} value={desc} />)}
    </Card>
  );
}

export function TrainingGuidePage() {
  const [active, setActive] = useState<Section>('basics');

  const renderSection = () => {
    switch (active) {
      case 'basics': return <BasicsSection />;
      case 'customer': return <CustomerSection />;
      case 'pricing': return <PricingSection />;
      case 'companion': return <CompanionSection />;
      case 'gold': return <GoldSection />;
      case 'events': return <EventsSection />;
      case 'champagne': return <ChampagneSection />;
      case 'menu': return <MenuSection />;
      case 'calc': return <CalcFlowSection />;
      case 'examples': return <ExamplesSection />;
      case 'mistakes': return <MistakesSection />;
      case 'quiz': return <QuizSection />;
      case 'glossary': return <GlossarySection />;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-[var(--gold-color)] flex items-center gap-2">
        <span>📚</span>
        <span>会計ハンドブック</span>
      </h2>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              active === s.id
                ? 'bg-[var(--gold-color)] text-black border-[var(--gold-color)]'
                : 'bg-[var(--input-bg)] text-[var(--text-color)] border-[var(--border-color)] hover:border-[var(--gold-color)]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {renderSection()}
    </div>
  );
}
