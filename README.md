# Tools-Lab 即時文字雲

這是一個連接 Firebase Cloud Firestore 的靜態文字雲網頁。

## Firebase

- Project ID: `tools-lab-fa456`
- Firestore database: `(default)`
- Collection: `demo_records`
- Session marker: `wordcloud-web`

目前使用測試用公開規則，只適合 demo 與假資料。

## 本機預覽

```powershell
python -m http.server 5173
```

然後開啟：

```text
http://localhost:5173
```

## GitHub Pages

推到 GitHub 後，可在 repository settings 啟用 Pages：

- Source: Deploy from a branch
- Branch: `main`
- Folder: `/ (root)`
