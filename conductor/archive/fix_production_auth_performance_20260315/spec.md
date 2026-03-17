# Specification - Fix Production Auth Performance and JWKS Timeout Issues

## Background
Railway (Backend) から Supabase (Auth) への JWKS 取得において、断続的なタイムアウト (`<urlopen error timed out>`) が発生している。
これにより、認証が必要な API リクエストが同期的にブロックされ、全体のレスポンス低下と 401 エラー（認証失敗）を引き起こしている。

## Requirements
1.  **JWKS のプリフェッチ:** サーバー起動時（Lifespan startup）に公開鍵を取得し、最初のリクエストで遅延が発生するのを防ぐ。
2.  **キャッシュ寿命の延長:** 公開鍵は頻繁に変更されないため、キャッシュ寿命を現在の 1時間から 24時間以上に延長する。
3.  **フェイルセーフ・キャッシュ:** ネットワークエラーで最新の鍵が取得できなかった場合でも、以前に取得に成功したキャッシュがあればそれを使い回すロジックを検討する。
4.  **非同期性の検討:** 公開鍵の更新が API リクエストを過度にブロックしないようにする。

## Success Criteria
-   本番環境で `ES256 JWKS error ... timed out` が発生しなくなる。
-   API レスポンスタイムが改善し、Market Summary や履歴データが迅速に表示される。
