# 프로젝트 최애돌 (드림그룹) — 개발 핸드오프

> 이 문서는 **다른 도구/머신(예: 집의 안티그래비티/Gemini)에서 이어서 개발**할 때 읽는 크로스툴 핸드오프다.
> 코드 최신은 GitHub(`mandreojo/idol-tycoon-dream`)에 있으니 `git clone` 후 이 문서부터 읽고 이어가면 된다.

## 이게 뭔가
- 단일 `index.html` 웹게임(+`i18n.js` 5개국어 + `idols.js` 연습생 데이터 + `assets/`). 순수 프론트, 서버 없음.
- 코어 루프: **연습생 개별 육성(24턴, 로그라이트 카드 루프) → 9포지션 편성 → 데뷔 → 비동기 랭킹 배틀(경쟁전)**. 카드 수집·별머지·합성 메타.
- ⭐**2026-07-27 대개편: 육성을 "학마스식 로그라이트 카드 루프"로 전면 교체**(QA '지루·몰입0' 처방). 매 턴 손패 3장(`TRAIN_CARDS`/`drawHand`) 중 1택→`playCard()`가 기력(stam)소모·컨디션(好調/보통/부진)배수·성장곡선·특기보너스로 6스탯 성장. **st 6스탯 계약은 그대로라 데뷔심사·최종관문·결과·카드드랍·숙소합류 전부 무수정 재사용.** 벤치마킹 근거는 레포 `BENCHMARK.md`. 밸런스 수치는 재율애비 체감 조정 예정.
- "아이돌 육성 타이쿤 라이브(솔로판, 별도 레포 `idol-tycoon`)"를 클론해 그룹 메타를 얹은 **별개 프로토**. 라이브와 혼동/공유 금지(단 Firebase leaderboard는 한 통 공유 — 아래 주의).

## 실행 / 배포
- 로컬: `cd ~/idol-tycoon-dream && python3 -m http.server 8785` → `http://localhost:8785/index.html?v=N` (⚠️캐시버스터 `?v=` 필수).
- 배포: GitHub Pages public — `git push`하면 Actions로 자동 재배포. 라이브 = https://mandreojo.github.io/idol-tycoon-dream/index.html
- ⚠️ **i18n.js 수정 시 `index.html`의 `<script src="i18n.js?v=...">` 버전 올릴 것** (안 올리면 폰이 옛 텍스트 캐시). 현재 `v=20260724b`.
- 개발 방식: 코드 수정 → 로컬서버+브라우저로 **직접 렌더·조작 검증**(콘솔 에러 0 확인) → 커밋 → push. 재율애비가 잡는 버그 8할이 "변경이 전 표면에 전파 안 됨"이라, 카피/스탯명/개편은 **전 표면 grep 대조**할 것.

## ⭐ 스탯 체계 (헷갈리기 쉬움 — 반드시 이걸로)
내부키 → 표시명(정식): `vocal=발성 · acting=리듬감(랩) · dance=체력 · visual=스타일 · charm=화술 · creative=창조`.
정의처: `STATS`(index.html 상단), `STATNM`, i18n `st_*`. 이벤트/서사도 이 이름으로 통일됨(옛이름 끼·보컬·댄스·비주얼·랩·크리에이티브 잔재 제거 완료).
포지션(리더/센터/보컬/래퍼/댄서/프로듀서)은 스탯이 아니라 역할 — `POSFORMULA`(각 자리를 어떤 스탯 가중합으로 평가), `posScore()`.

## ⭐ 확정 뉘앙스 (개선 리스트만 보면 놓침)
1. **"공유 이미지 제거" = 공유용 export만.** 카드 비주얼·얼굴사진·로고는 게임 내 그대로 유지. (완료: shareLink/shareGroupText로 텍스트+링크 공유)
2. **시너지 한도 제거엔 티어컷 재조정이 세트.** 한도 없애고 폭↓하면 인플레로 승점컷(120/300 고정)이 헐거워짐 → 상대 백분위로 재조정 필수. (미완)
3. **그룹카드 앞 3인 = 리더(고정)+리더제외 posScore 상위 2인** (센터 아님). (완료)
4. **낱장 표시가 내구도 착시의 진짜 해법** — 렌더만 낱장으로 펼침(모델 안 건드림). (완료)
5. **합성 = 별 리셋 유지 + 고별 재료 확률보정 한 몸.** (완료: 초과별 1당 +6%p 상한24)

## 확인답 (재율애비 결정)
- 공유 = 텍스트+링크 (정적사이트라 그룹별 동적 OG 미리보기 불가).
- 포지션 적합도 = posScore 숫자·스탯종류 **가림, 등급표현(적합/우수/최적)**만. (미완)
- 밸런스 수치 = 내가 초안 잡고 진행(재율애비 체감으로 후조정).

## 진행상황 (2026-07-25 기준)
### ✅ 완료·배포
- **카피**: 계약해지→방출 · 홈탭→🏢사무실 · 랭킹→🏆차트
- **입력 필수값**: 기획사명·그룹명 빈값 차단 + 버튼 비활성
- **마이크 타이머**: 충전 MM:SS 카운트다운(`micClock`/`micBarHTML`/`startMicTick`, 로비 이탈 시 자동정지)
- **합성 고별 확률보정**: `combineOdds(rr, excess)` — 별 리셋 유지, 조합소에 경고+보정 표시
- **육성결과 카드 숨김**: `renderResult`가 전 드랍을 뒷면(tback)→탭 개봉
- **공유 이미지 제거**: 솔로/그룹/나가기 전부 텍스트+링크(`shareLink`/`shareGroupText`), 캔버스함수 dead
- **보관함 낱장 표시**: `renderCardsOwned` 기본 낱장 + 🂠겹치기 토글(`_cardStack`), 닳은 1장만 🔋감소
- **시작슬롯**: `defaultSlots` 리더/센터/댄서
- **업적 중복 제거**: 홈=새 달성 있을 때만 넛지, 메뉴=본진
- **그룹카드**: 앞면 3인 사선(`ucardHTML` `members`+`.rph3`) + 뒷면 9명 그리드 크게(54px) + 상세 아이콘 확대(`.flipcard .tc-em` 72px)
- **밸런스(시너지만)**: `groupSynergy` +40% 상한 삭제 + 전 항목 수치 대폭↓(~반토막) → base 지배적. 트렌드 ×1.5 유지
- **포지션 등급표현**: `fitLabel(val)` 3단계(최적>=520·우수>=320·적합), 편성슬롯·배치후보 posScore 숫자 숨김 + "능력치 2개+ 반영·종류 비공개" 안내
- **업적 보상**: `achvReward(a)` 차등(큰 마일스톤=SR genius·자잘 초반=N effort·기본=R 랜덤스탯), checkAchv 지급+배너 표시
- **온보딩 공유팝업**: `_renderLobby`에서 경쟁전 3판 후 1회 `shareNudgePopup`(sharePromptShown 플래그)
- **UI 대비**: `.manual-body`(#4a4048 다크그레이=밝은테마 잔재, 1.62:1) → var(--txt) 14:1. 전 화면 WCAG 4.5:1 전수 스캔 통과
- **IA**: 배틀로비 진입을 차트탭 최상단으로(`#leagueBattle`/`renderLeagueBattle` — 대표그룹 요약+⚔️대결하러가기). 탭 정체성(사무실=육성/운영, 차트=무대/경쟁)
- **연출 무대화**: `_showBattle` 전투력 숫자만 카운트업 → 내 멤버들 기여(posScore) 큰 순 순차 등장(`.bt-stage`/`.bts-mem`)+무대점수 합산+시너지 → VS·전투력 → 결과. openBattle이 mem 전달
- **효과음**: `drumroll`/`cardpop` sfx 추가, revealDrop 전 카드 긴장감(드럼롤+`.tsuspense` 흔들림+뜸들이기 레어도별 340/560/740ms+cardpop 임팩트+햅틱)

- **온보딩 상세화**: Tut.onForge(조합소 강화/합성)·onBattleLobby(마이크/티어) 코치마크 추가
- **BGM 3종**: `BGM_THEMES`(home/train/battle 템포·강도), show()가 화면별 전환. ⚠️멜로디 품질은 귀로 튜닝
- **밸런스 티어컷 백분위**: `computeTierCuts`(리더보드 pts 분포 백분위, 표본<8 고정폴백), fetchGroupBoard서 갱신 → 인플레로 컷 자동 상승
- **최애돌 서사**: 앱요소 이벤트 추가(themepick·freetalk·miracle) + 기존(heartpick·fairy·awards·birthday), showEvent 로테이션
- **데이터 동기화**: `sync_idols.py`(app_idol type=S→idols.js, ⭐spec은 기존서 id로 보존=나무위키 매핑 유지, 내용변경시만 캐시버스터) + `sync_and_deploy.sh` + launchd `com.myloveidol.idolsync`(매일 05:20 sync→변경시 commit+push). 초기 763→1517명 배포

### ✅ 개선 마스터리스트 A~L 전부 완료. 잔여 = 폴리시/수동(기능 아님)
- 신규 아이돌 754명 spec=임시 id배분 → **나무위키 수작업 매핑** 대기(sync는 기존 spec 보존하니 매핑하면 유지됨)
- BGM 멜로디·밸런스 수치 = 재율애비 체감으로 튜닝
- 데이터 동기화 launchd = **회사맥 켜져 있어야** 매일 실행(로그 ~/idol-tycoon-dream/sync.log)

## 코드 구조 힌트
- 게임 로직 대부분 `index.html` 하단 `DG` 모듈(그룹 메타) + `Game` 객체(육성 엔진, 라이브서 재활용).
- 화면 = `<section class="screen" id="s-*">` + `show(id)` 전환. 탭바 `TAB_OF`/`updateTabbar`, `Nav.go`.
- 카드: `data.cards[type][star]=수량`, `data.wear["type:star"]`. `combine`/`merge`/`combineResult`/`combineOdds`.
- 경쟁전: `_renderLobby`, `battlePower`, `groupSynergy`, `battleSeason`. 리더보드=Firestore(아래).
- 튜토리얼: `Tut` 모듈(스포트라이트 코치마크, `dg_tut_v2`).

## ⚠️ 주의
- **Firebase leaderboard = 라이브 솔로게임(`idol-tycoon`)과 한 통 공유.** 그룹은 `ending='GRP:n:pts'` 마커로 분리, 양쪽 `fetchBoard`가 GRP 필터함. 규칙=생성+수정 허용, **삭제 차단**(옛 테스트 데이터 청소는 Firebase 콘솔에서). 더미 상대 20팀 심어둠. `submitGroup`=고정ID upsert(중복방지).
- 세이브(localStorage)는 origin별 — 로컬(localhost)과 배포(Pages)가 분리됨.
- 다국어: 한국어만 iterate, en/ja/zh는 배포 때 몰아서. 스탯명·이벤트는 각 언어 내부 정합 확인.
