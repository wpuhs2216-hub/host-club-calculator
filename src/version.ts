export const APP_VERSION = '1.3.0';

export type VersionEntry = {
  version: string;
  notes: string[];
};

export const VERSION_HISTORY: VersionEntry[] = [
  {
    version: '1.3.0',
    notes: [
      '新規伝票をダイアログ1画面で作成（スワイプ不要）',
      'LOページのタブレット2列表示対応',
    ],
  },
  {
    version: '1.2.1',
    notes: [
      'タブ名改善（オーダー/予算）',
      '会計画面のコンパクト化（1画面表示）',
      '予算タブにAI説明文を追加',
      'アップデート履歴の追加',
      '店舗切替を管理者外に移動',
    ],
  },
  {
    version: '1.2.0',
    notes: [
      '伝票コピー機能（全コピー/選択コピー）',
      'ウィザード式伝票入力',
      'タブ切替表示（基本情報/オーダー/会計/予算）',
      'ボタン式時間入力',
      '正規客のショット半額バグを修正',
    ],
  },
  {
    version: '1.1.0',
    notes: [
      'LOモード料金切替（現在/ラストまで）',
      'テーブル3×3グリッド表示',
      '全卓全伝票一括削除',
      'リアルタイム時刻更新（10秒間隔）',
      '会計時刻のタップ入力対応',
      'PWA即時更新',
    ],
  },
];

// 最新バージョンのリリースノート（互換用）
export const RELEASE_NOTES = VERSION_HISTORY[0].notes;
