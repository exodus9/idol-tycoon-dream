#!/bin/bash
# 일 1회: 미러DB→idols.js 동기화 + 바뀌면 커밋·푸시(GitHub Pages 자동배포).
# launchd(com.myloveidol.idolsync)에서 호출. 로그=~/idol-tycoon-dream/sync.log
cd "$HOME/idol-tycoon-dream" || exit 1
export PATH="$HOME/.local/bin:/usr/local/bin:/usr/bin:/bin"
echo "=== $(date '+%Y-%m-%d %H:%M') 연습생 동기화 시작 ==="
python3 sync_idols.py || { echo "sync 실패"; exit 1; }
if git diff --quiet idols.js index.html; then
  echo "변경 없음 — 배포 생략"
else
  git add idols.js index.html
  git commit -q -m "chore: 연습생 데이터 자동 동기화 (미러DB→idols.js)"
  git push origin HEAD && echo "동기화+배포 완료" || echo "push 실패(수동 확인)"
fi
