"""Kopang ML 시드 v2 — 위험 유형 8종 확정 반영 (docs/시드_시나리오.md 기준)
생성: categories.csv / products.csv / users.csv / user_profiles.csv
기존 v1 파일(users.csv 등)은 1단계 테스트용으로 유지 — 건드리지 않음.
"""
import csv, math, os, random
from datetime import date, datetime, timedelta

random.seed(42)
TODAY = date(2026, 7, 2)
ML = os.path.dirname(os.path.abspath(__file__))          # ml/seed/ — csv 생성 위치
V1 = os.path.join(os.path.dirname(ML), '_')               # v1 원본 (ml/_ — 한 단계 위)
BCRYPT = '$2a$10$7zB3qQzEcbB7mU5eL2n9fO0xH98o2tYpM.2s5lR7wE.2F8u7y6X1.'  # v1과 동일 해시(비번 통일)

# ---------- 1. categories_v2 ----------
rows = list(csv.DictReader(open(f'{V1}/synthetic_products.csv', encoding='utf-8')))
mains, subs = [], {}
for r in rows:
    if r['MainCategory'] not in mains: mains.append(r['MainCategory'])
    subs.setdefault(r['MainCategory'], [])
    if r['SubCategory'] not in subs[r['MainCategory']]: subs[r['MainCategory']].append(r['SubCategory'])

cat_rows, sub_id = [], 100
main_ids, sub_ids = {}, {}
for i, m in enumerate(mains, 1):
    main_ids[m] = i
    cat_rows.append({'category_id': i, 'parent_id': '', 'depth': 1, 'name': m})
for m in mains:
    for s in sorted(subs[m]):
        sub_ids[(m, s)] = sub_id
        cat_rows.append({'category_id': sub_id, 'parent_id': main_ids[m], 'depth': 2, 'name': s})
        sub_id += 1
with open(f'{ML}/categories.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=['category_id','parent_id','depth','name']); w.writeheader(); w.writerows(cat_rows)

# ---------- 2. products_v2 (DDL 컬럼 정합) ----------
prod_rows = []
for r in rows:
    price = int(r['Price']); rate = int(r['DiscountRate'])
    created = TODAY - timedelta(days=random.randint(30, 720))
    prod_rows.append({
        'product_id': r['ProductID'],
        'category_id': sub_ids[(r['MainCategory'], r['SubCategory'])],
        'name': r['ProductName'],
        'description': r['Description'],
        'price': price,
        'discount_price': int(round(price * (1 - rate / 100), -2)) if rate else '',
        'stock': r['Stock'],
        'image_url': r['ImageUrl'],
        'status': r['Status'],
        'created_at': f'{created} 00:00:00',
    })
with open(f'{ML}/products.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=list(prod_rows[0].keys())); w.writeheader(); w.writerows(prod_rows)

# ---------- 3. 유저 그룹 설계 ----------
N = 4000
TYPES = ['CART_ABANDON','MEMBERSHIP_CANCEL','FIRST_ORDER_ONLY','WISHLIST_IDLE',
         'COUPON_EXPIRING','BAD_EXPERIENCE','LOGIN_INACTIVE','SPENDING_DROP']
ALLOC = dict(zip(TYPES, [150,100,130,130,160,80,150,100]))   # 위험군 1,000
N_COMPOSITE, N_BORDER = 200, 200

groups = []
for t, n in ALLOC.items(): groups += [('risk', t)] * n
groups += [('composite', None)] * N_COMPOSITE + [('border', None)] * N_BORDER
groups += [('normal', None)] * (N - len(groups))
random.shuffle(groups)

def base():  # 정상 기본값
    oc = random.randint(4, 30)
    return {
        'tenure_days': random.randint(60, 1000),
        'recency_days': random.randint(0, 14),
        'day_since_last_order': random.randint(2, 30),
        'order_count': oc,
        'total_spend': oc * random.randint(20000, 90000),
        'cart_abandon_count': random.choices([0,1],[0.85,0.15])[0],
        'wishlist_idle_count': random.choices([0,1],[0.8,0.2])[0],
        'coupon_unused_count': random.choices([0,1],[0.8,0.2])[0],
        'bad_review_count': 0, 'cancel_count': 0,
        'spending_drop_ratio': round(random.uniform(0.75, 1.4), 2),
        'membership_cancelled': 0,
    }

def apply(f, t):  # 유형 시그니처
    if t == 'CART_ABANDON':      f['cart_abandon_count'] = random.randint(1, 4); f['recency_days'] = random.randint(0, 10)
    elif t == 'MEMBERSHIP_CANCEL': f['membership_cancelled'] = 1; f['recency_days'] = random.randint(3, 25)
    elif t == 'FIRST_ORDER_ONLY':  f['order_count'] = 1; f['total_spend'] = random.randint(10000, 80000); f['day_since_last_order'] = random.randint(31, 60); f['recency_days'] = random.randint(15, 50); f['tenure_days'] = f['day_since_last_order'] + random.randint(0, 20)
    elif t == 'WISHLIST_IDLE':     f['wishlist_idle_count'] = random.randint(1, 5)
    elif t == 'COUPON_EXPIRING':   f['coupon_unused_count'] = random.randint(1, 3)
    elif t == 'BAD_EXPERIENCE':    f['bad_review_count'] = random.randint(0, 2); f['cancel_count'] = random.randint(0, 2); (f.update(bad_review_count=1) if f['bad_review_count']+f['cancel_count']==0 else None)
    elif t == 'LOGIN_INACTIVE':    f['recency_days'] = random.randint(31, 90); f['day_since_last_order'] = f['recency_days'] + random.randint(0, 30)
    elif t == 'SPENDING_DROP':     f['spending_drop_ratio'] = round(random.uniform(0.05, 0.45), 2); f['order_count'] = random.randint(6, 30)

CATS = mains
users, profiles = [], []
for g, t in groups:
    f = base()
    if g == 'risk': apply(f, t)
    elif g == 'composite':
        for tt in random.sample([x for x in TYPES if x != 'MEMBERSHIP_CANCEL'], random.randint(2, 3)): apply(f, tt)
    elif g == 'border':  # 룰 기준 직전 — 어느 룰에도 안 걸림
        f['recency_days'] = random.randint(20, 29)
        f['day_since_last_order'] = random.randint(20, 29)
        f['spending_drop_ratio'] = round(random.uniform(0.5, 0.65), 2)
    f['_group'] = g; f['_type'] = t or ''
    profiles.append(f)

# ---------- 4. 멤버십 배정 (25% = 1,000명, ②는 멤버 필수) ----------
idx_cancel = [i for i, p in enumerate(profiles) if p['membership_cancelled'] == 1]        # ② 100명
pool = [i for i, p in enumerate(profiles) if p['membership_cancelled'] == 0]
random.shuffle(pool)
extra_cancel = pool[:70]                                   # 과거 해지자 70 → CANCELLED 총 170
members_active = pool[70:70 + 830]                         # ACTIVE 750 + EXPIRED 80
member_set = set(idx_cancel) | set(extra_cancel) | set(members_active)
for i in extra_cancel: profiles[i]['membership_cancelled'] = 1
# is_member = 현재 ACTIVE 멤버만 1 (해지자는 0 + cancelled=1 — 시나리오 문서와 일치)
for i, p in enumerate(profiles): p['is_member'] = 1 if (i in member_set and p['membership_cancelled'] == 0) else 0

# ---------- 4-1. 만족도 (satisfaction_survey 원천, 응답률 ~40%) ----------
for p in profiles:
    if random.random() < 0.40:
        base_s = 4.2
        if p['bad_review_count'] or p['cancel_count']: base_s -= 1.6   # 부정경험자는 낮게
        if p['membership_cancelled']: base_s -= 0.8
        if p['recency_days'] > 30: base_s -= 0.5
        if p['spending_drop_ratio'] < 0.5: base_s -= 0.4
        p['satisfaction_score'] = max(1, min(5, round(base_s + random.gauss(0, 0.8))))
    else:
        p['satisfaction_score'] = ''                                    # 미응답 = 결측

# ---------- 5. 라벨 (확률 조합 + 노이즈, 절편 보정) ----------
def z_of(p, b, wm):
    return (b
        + 0.045 * p['recency_days']
        + 0.35  * p['cart_abandon_count']
        + 1.1   * p['membership_cancelled']
        + (0.9 if p['order_count'] == 1 else 0)
        + 0.22  * p['wishlist_idle_count']
        + 0.55  * p['bad_review_count']
        + 0.5   * p['cancel_count']
        + 0.28  * p['coupon_unused_count']
        + 1.4   * max(0, 0.8 - p['spending_drop_ratio'])
        - 0.35  * ((p['satisfaction_score'] if p['satisfaction_score'] != '' else 3) - 3)
        - wm    * p['is_member'])

b, wm = -3.2, 1.0
for _ in range(60):  # 전체 20%, 멤버 ~11% 목표로 보정
    ps = [1/(1+math.exp(-z_of(p, b, wm))) for p in profiles]
    overall = sum(ps)/len(ps)
    mem = [ps[i] for i,p in enumerate(profiles) if p['is_member']]
    b += 0.5 * (0.20 - overall) * 10 / (1+abs(0.20-overall)*10)
    wm += 2.0 * (sum(mem)/len(mem) - 0.11)
    wm = max(0.2, min(wm, 2.5))
for p in profiles:
    prob = 1/(1+math.exp(-z_of(p, b, wm)))
    p['churned'] = 1 if random.random() < prob else 0

# ---------- 6. users_v2 + user_profiles_v2 출력 ----------
SUR = '김이박최정강조윤장임한오서신권황안송전홍'
G1 = '민서지현도예승주하은시태'
G2 = '준우아인혁원영수빈현아율'
def kname(): return random.choice(SUR) + random.choice(G1) + random.choice(G2)

with open(f'{ML}/users.csv', 'w', newline='', encoding='utf-8') as fu, \
     open(f'{ML}/user_profiles.csv', 'w', newline='', encoding='utf-8') as fp:
    uw = csv.DictWriter(fu, fieldnames=['user_id','email','password','name','phone','birth_date','role','status','created_at','updated_at','last_login_at'])
    pw = csv.DictWriter(fp, fieldnames=['user_id','is_member','membership_cancelled','tenure_days','recency_days','day_since_last_order','order_count','total_spend','cart_abandon_count','wishlist_idle_count','coupon_unused_count','bad_review_count','cancel_count','spending_drop_ratio','satisfaction_score','prefered_order_cat','seed_group','seed_type','churned'])
    uw.writeheader(); pw.writeheader()
    for i, p in enumerate(profiles, 1):
        created = TODAY - timedelta(days=p['tenure_days'])
        lastlog = TODAY - timedelta(days=p['recency_days'])
        birth = date(random.randint(1970, 2004), random.randint(1, 12), random.randint(1, 28))
        uw.writerow({'user_id': i, 'email': f'user_{i}@test.com', 'password': BCRYPT, 'name': kname(),
                     'phone': f'010-{random.randint(1000,9999)}-{random.randint(1000,9999)}', 'birth_date': birth,
                     'role': 'ROLE_USER', 'status': 'ACTIVE',
                     'created_at': f'{created} 00:00:00', 'updated_at': f'{created} 00:00:00',
                     'last_login_at': f'{lastlog} {random.randint(8,22):02d}:{random.randint(0,59):02d}:00'})
        pw.writerow({'user_id': i, 'is_member': p['is_member'], 'membership_cancelled': p['membership_cancelled'],
                     'tenure_days': p['tenure_days'], 'recency_days': p['recency_days'],
                     'day_since_last_order': p['day_since_last_order'], 'order_count': p['order_count'],
                     'total_spend': p['total_spend'], 'cart_abandon_count': p['cart_abandon_count'],
                     'wishlist_idle_count': p['wishlist_idle_count'], 'coupon_unused_count': p['coupon_unused_count'],
                     'bad_review_count': p['bad_review_count'], 'cancel_count': p['cancel_count'],
                     'spending_drop_ratio': p['spending_drop_ratio'], 'satisfaction_score': p['satisfaction_score'], 'prefered_order_cat': random.choice(CATS),
                     'seed_group': p['_group'], 'seed_type': p['_type'], 'churned': p['churned']})
    # 관리자 계정 1개 (프로필 없음)
    uw.writerow({'user_id': N+1, 'email': 'admin@kopang.com', 'password': BCRYPT, 'name': '관리자',
                 'phone': '010-0000-0000', 'birth_date': '1990-01-01', 'role': 'ROLE_ADMIN', 'status': 'ACTIVE',
                 'created_at': f'{TODAY - timedelta(days=365)} 00:00:00', 'updated_at': f'{TODAY - timedelta(days=365)} 00:00:00',
                 'last_login_at': f'{TODAY} 09:00:00'})

# ---------- 검증 출력 ----------
n = len(profiles)
ch = sum(p['churned'] for p in profiles)
mem = [p for p in profiles if p['is_member']]; non = [p for p in profiles if not p['is_member']]
rec = sum(1 for p in profiles if p['is_member'] or p['membership_cancelled'])
print(f'전체 {n}명 | 이탈 {ch/n:.1%} | 멤버십 이력 보유 {rec/n:.1%} (현재 ACTIVE {len(mem)/n:.1%})')
print(f'일반 이탈 {sum(p["churned"] for p in non)/len(non):.1%} | 멤버십 이탈 {sum(p["churned"] for p in mem)/len(mem):.1%}')
print(f'해지자 {sum(p["membership_cancelled"] for p in profiles)}명 (이탈률 {sum(p["churned"] for p in profiles if p["membership_cancelled"])/170:.1%})')
from collections import Counter
gc = Counter(p['_group'] for p in profiles)
print('그룹:', dict(gc))
for t in TYPES:
    g = [p for p in profiles if p['_type'] == t]
    print(f'  {t}: {len(g)}명, 이탈률 {sum(p["churned"] for p in g)/len(g):.1%}')
bd = [p for p in profiles if p['_group']=='border']; nm = [p for p in profiles if p['_group']=='normal']
print(f'경계선 이탈률 {sum(p["churned"] for p in bd)/len(bd):.1%} | 정상 이탈률 {sum(p["churned"] for p in nm)/len(nm):.1%}')
resp = [p for p in profiles if p['satisfaction_score'] != '']
print(f'만족도 응답률 {len(resp)/n:.1%} | 평균 {sum(p["satisfaction_score"] for p in resp)/len(resp):.2f}')
lo = [p for p in resp if p['satisfaction_score'] <= 2]; hi = [p for p in resp if p['satisfaction_score'] >= 4]
print(f'  저만족(≤2) 이탈률 {sum(p["churned"] for p in lo)/len(lo):.1%} vs 고만족(≥4) {sum(p["churned"] for p in hi)/len(hi):.1%}')
print('categories_v2:', len(cat_rows), '행 | products_v2:', len(prod_rows), '행')
