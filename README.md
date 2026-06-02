# 5次元五目並べ

3D 盤面、位相循環、同位置コンボを組み合わせた五目並べプロトタイプです。  
現時点ではローカル対戦と対 AI を中心に実装しており、オンライン対戦は仕様と型の整備まで進んでいます。

## 現状

- 盤面ルール
  - XYZ の直線 5 連
  - 同位相 5 連
  - 位相階段 5 連
  - 同位置コンボ勝利
- 対局機能
  - ローカル 2P
  - 対 AI
  - Undo / Redo
  - 持ち時間
  - 引き分け手数
- 表示
  - Three.js による 3D 盤面
  - スライス表示
  - 脅威表示
  - デバッグ表示

## 未実装

- オンライン通信本体
- 部屋作成 / 参加 / 再接続
- rematch
- オンライン時の Undo 同意フロー

オンライン対戦の要件は [docs/specs/09_online_multiplayer.md](/C:/Users/kinok/PRG/5次元五目並べ/docs/specs/09_online_multiplayer.md) にあります。

## 起動

```bash
npm install
npm run dev
```

## テスト

```bash
npm test
npx tsc -b --pretty false
npm run build
```

## ロードマップ

1. UI 文言と文字化けの完全解消
   - 開始画面、オーバーレイ、ガイド、README を日本語で揃える
2. ローカル対戦の完成度向上
   - 持ち時間切れと引き分け時の演出整理
   - 勝敗説明の明確化
3. 状態管理テストの拡張
   - 時計
   - 引き分け
   - Undo / Redo 時の復元
4. 仕様同期
   - `PROTOTYPE.md`
   - オンライン仕様書
   - README
5. オンライン対戦の最小実装
   - 部屋作成
   - 参加
   - 着手同期
   - 再接続
