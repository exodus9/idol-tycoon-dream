#!/usr/bin/env python3
# 최애돌 미러DB(app_idol) → 게임 idols.js 동기화.
# 게임=GitHub Pages 정적사이트+미러DB=사내망이라 브라우저 직결 불가 → 이 맥에서 스냅샷 배치로 idols.js 갱신.
# spec(특기)은 DB에 없어 기존 idols.js에서 id로 보존(나무위키 수작업 매핑 유지). 신규만 category 기반 임시 배분.
# 사용: python3 sync_idols.py [--dry]  (--dry=쓰지 않고 /tmp/idols_new.js 로 출력+검증)
import subprocess, json, re, os, sys

HOME = os.path.expanduser('~')
GAME = os.path.join(HOME, 'idol-tycoon-dream')
IDOLS_JS = os.path.join(GAME, 'idols.js')
QPY = os.path.join(HOME, 'myloveidol-db/q.py')
DRY = '--dry' in sys.argv
SPECS = ['vocal', 'acting', 'dance', 'visual', 'charm', 'creative']

def q(sql):
    r = subprocess.run(['python3', QPY, 'choeaedol', sql], capture_output=True, text=True, timeout=120)
    out = r.stdout
    m = re.search(r'(\[.*\])\s*\n\s*\[\d+ rows\]', out, re.S) or re.search(r'(\[.*\])', out, re.S)
    if not m:
        raise SystemExit('q.py 결과 파싱 실패:\n' + out[:400] + '\n' + r.stderr[:400])
    return json.loads(m.group(1))

def clean(nm):
    return (nm or '').split('_')[0].strip()

# 1) 기존 idols.js에서 spec 보존
existing = {}
if os.path.exists(IDOLS_JS):
    m = re.search(r'window\.IDOL_DB\s*=\s*(\[.*\])', open(IDOLS_JS, encoding='utf-8').read(), re.S)
    if m:
        for o in json.loads(m.group(1)):
            existing[o['id']] = o.get('spec')

# 2) 미러DB 조회 (개인 아이돌 type='S', 얼굴사진 있음)
rows = q("SELECT i.id, i.name, i.name_en, i.category, i.face_image_url, g.name AS grp_name, g.name_en AS grp_en "
         "FROM app_idol i LEFT JOIN app_idol g ON i.group_id=g.id "
         "WHERE i.type='S' AND i.face_image_url IS NOT NULL AND i.face_image_url<>''")

idols = []
for r in rows:
    nm = clean(r['name'])
    img = str(r.get('face_image_url') or '')
    if not nm or not img.startswith('http'):   # 사진 없는(face='0') 비활성 아이돌 제외
        continue
    grp_raw = r.get('grp_name') or ''
    grp = '' if (clean(grp_raw) == nm or not grp_raw) else grp_raw   # 솔로(그룹명==본명)면 그룹 없음
    nm_en = clean(r.get('name_en') or '')
    grp_en = (r.get('grp_en') or '') if grp else ''
    spec = existing.get(r['id']) or SPECS[r['id'] % len(SPECS)]      # 보존 우선, 신규는 임시 배분
    idols.append({
        'id': r['id'], 'name': nm, 'nameEn': nm_en, 'grp': grp, 'grpEn': grp_en or grp,
        'cat': (r.get('category') or 'F'), 'spec': spec, 'img': r['face_image_url'],
        'en': (nm_en + ' ' + grp_en).strip().lower(),
    })

# 3) 검증 (게임 안 깨지게)
assert len(idols) >= 100, f'아이돌 수 이상({len(idols)}) — 동기화 중단(게임 보호)'
assert all(x['img'].startswith('http') and x['name'] and x['spec'] in SPECS for x in idols), '필수 필드 검증 실패'

payload = 'window.IDOL_DB=' + json.dumps(idols, ensure_ascii=False) + ';\n'
kept = sum(1 for x in idols if x['id'] in existing)
if DRY:
    open('/tmp/idols_new.js', 'w', encoding='utf-8').write(payload)
    print(f"[DRY] {len(idols)}명 (spec 보존 {kept}·신규 {len(idols)-kept}) → /tmp/idols_new.js")
    raise SystemExit

# 내용 실제로 바뀔 때만 쓰기+캐시버스터(안 그러면 매일 동일데이터 재배포 낭비)
cur = open(IDOLS_JS, encoding='utf-8').read() if os.path.exists(IDOLS_JS) else ''
if payload == cur:
    print(f"변경 없음 ({len(idols)}명) — 갱신 생략")
    raise SystemExit
open(IDOLS_JS, 'w', encoding='utf-8').write(payload)
import datetime
idx_path = os.path.join(GAME, 'index.html')
idx = open(idx_path, encoding='utf-8').read()
newver = 'sync' + datetime.datetime.now().strftime('%Y%m%d%H%M')
idx2 = re.sub(r'idols\.js\?v=[0-9a-zA-Z]+', 'idols.js?v=' + newver, idx)
if idx2 != idx:
    open(idx_path, 'w', encoding='utf-8').write(idx2)
print(f"{len(idols)}명 동기화 (spec 보존 {kept}·신규 {len(idols)-kept}) · 캐시버스터 {newver}")
