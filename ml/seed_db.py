"""Kopang DB 세부 이벤트 시드 생성기
user_profiles.csv의 유저별 피처값과 일치하는 "원천 이벤트 row"를 SQL로 생성한다.
(경로③ 일원화: 시드된 이벤트를 aggregate_profiles.sql로 집계하면 프로필이 재현됨)

사용법:
  python3 seed_db.py          # ml/seed_events.sql 생성
  psql -d kopang -f seed_events.sql

전제: DDL 실행 + users/categories/products는 \\copy로 로드 완료 상태 (README.md 참고)
날짜는 전부 NOW() 상대값 → 언제 실행해도 룰(3일/7일/30일)에 걸리는 상태가 유지됨.
"""
import csv, random, os

random.seed(42)
ML = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ML, 'seed_events.sql')

profiles = list(csv.DictReader(open(f'{ML}/user_profiles.csv', encoding='utf-8')))
products = list(csv.DictReader(open(f'{ML}/products.csv', encoding='utf-8')))
PIDS = [int(r['product_id']) for r in products]

sql = []
def stmt(s): sql.append(s)

def batch_insert(table, cols, rows, size=500):
    for i in range(0, len(rows), size):
        vals = ',\n'.join('(' + ', '.join(r) + ')' for r in rows[i:i + size])
        stmt(f'INSERT INTO {table} ({", ".join(cols)}) VALUES\n{vals};')

def ts(days_ago, hour=None):
    h = hour if hour is not None else random.randint(8, 22)
    return f"NOW() - INTERVAL '{days_ago} days {h} hours'"

def q(s): return "'" + str(s).replace("'", "''") + "'"

# ---------- 0. 마스터: 멤버십 / 쿠폰 ----------
stmt("INSERT INTO membership (membership_id, name, price, discount_rate, description) VALUES"
     " (1, '와우 멤버십', 4990, 10, '무료배송 + 전용 할인 + 포인트 적립');")
COUPONS = [(1,'신규가입 10%','RATE',10),(2,'웰컴백 3000원','AMOUNT',3000),(3,'장바구니 리마인드 5%','RATE',5),
           (4,'복귀 5000원','AMOUNT',5000),(5,'사과 쿠폰 10%','RATE',10),(6,'멤버십 갱신 15%','RATE',15),
           (7,'찜 상품 7%','RATE',7),(8,'재구매 감사 5%','RATE',5)]
stmt('INSERT INTO coupons (coupon_id, name, discount_type, discount_value, start_date, end_date, quantity) VALUES\n'
     + ',\n'.join(f"({i}, {q(n)}, '{t}', {v}, CURRENT_DATE - 60, CURRENT_DATE + 90, 10000)" for i, n, t, v in COUPONS) + ';')

# ---------- 1. users 날짜를 NOW() 기준으로 재정렬 ----------
rows = [(int(p['user_id']), int(p['tenure_days']), int(p['recency_days'])) for p in profiles]
for i in range(0, len(rows), 500):
    vals = ','.join(f'({u},{t},{r})' for u, t, r in rows[i:i + 500])
    stmt('UPDATE users u SET created_at = NOW() - (v.t || \' days\')::interval,'
         ' updated_at = NOW() - (v.t || \' days\')::interval,'
         ' last_login_at = NOW() - (v.r || \' days\')::interval'
         f' FROM (VALUES {vals}) AS v(id, t, r) WHERE u.user_id = v.id;')

# ---------- 2. 유저별 이벤트 생성 ----------
um_rows, ord_rows, item_rows, cart_rows, citem_rows = [], [], [], [], []
wish_rows, ucp_rows, rev_rows, sat_rows = [], [], [], []
itv_rows, out_rows, noti_rows = [], [], []
oid = cid = ciid = wid = ucid = rvid = sid = itid = outid = nid = umid = 0
user_orders = {}   # uid -> [(order_id, days_ago, cancelled)]

ACTION = {'CART_ABANDON':('PUSH','ABANDON'), 'FIRST_ORDER_ONLY':('COUPON','WELCOME_BACK'),
          'WISHLIST_IDLE':('PUSH','WISHLIST'), 'COUPON_EXPIRING':('PUSH','COUPON_EXPIRE'),
          'BAD_EXPERIENCE':('COUPON','APOLOGY'), 'LOGIN_INACTIVE':('COUPON','COMEBACK'),
          'SPENDING_DROP':('RECOMMEND','REBUY')}
CHANNELS = ['PUSH', 'EMAIL', 'IN_APP']

normal_nonmember = []
active_members = []

for p in profiles:
    uid = int(p['user_id'])
    is_m, canc = int(p['is_member']), int(p['membership_cancelled'])
    oc, cc = int(p['order_count']), int(p['cancel_count'])
    cc = min(cc, max(oc - 1, 0))
    spend, dslo = int(p['total_spend']), int(p['day_since_last_order'])
    ab, wi, cu, br = (int(p[k]) for k in ('cart_abandon_count','wishlist_idle_count','coupon_unused_count','bad_review_count'))
    sdr = float(p['spending_drop_ratio']); ten = int(p['tenure_days'])
    churned = int(p['churned']); g, t = p['seed_group'], p['seed_type']
    if is_m: active_members.append(uid)
    if g == 'normal' and not is_m and not canc: normal_nonmember.append(uid)

    # --- 멤버십 상태 ---
    if is_m:
        umid += 1
        um_rows.append([str(umid), str(uid), '1', f'CURRENT_DATE - {random.randint(30, min(ten,365))}',
                        'CURRENT_DATE + 30', "'ACTIVE'", 'NULL'])
    elif canc:
        umid += 1
        cd = random.randint(1, 7) if t == 'MEMBERSHIP_CANCEL' else random.randint(15, 45)
        um_rows.append([str(umid), str(uid), '1', f'CURRENT_DATE - {cd + random.randint(60, 300)}',
                        f'CURRENT_DATE - {cd}', "'CANCELLED'", ts(cd)])
        p['_cancel_days'] = cd

    # --- 주문 (비취소 n_ok + 취소 cc) ---
    n_ok = oc - cc
    dslo_eff = max(dslo, 8) if ab > 0 else dslo          # 방치 룰(이후 주문 없음) 보장
    if n_ok > 0:
        amts = [random.random() for _ in range(n_ok)]
        amts = [max(3000, int(spend * a / sum(amts))) for a in amts]
        amts[-1] = max(1000, spend - sum(amts[:-1]))      # 합계 = total_spend 정확히
        drop = sdr < 0.7 and n_ok >= 2
        days = []
        if drop:                                          # ⑧ 직전 30일 무겁게 / 최근 30일 가볍게
            n_prev = max(1, int(n_ok * 0.7))
            days = [random.randint(31, 60) for _ in range(n_prev)]
            days += [random.randint(min(dslo_eff, 29), 29) for _ in range(n_ok - n_prev)]
            prev_t, rec_t = int(spend / (1 + sdr)), int(spend * sdr / (1 + sdr))
            amts = [max(3000, int(prev_t / n_prev))] * n_prev + \
                   [max(3000, int(rec_t / max(1, n_ok - n_prev)))] * (n_ok - n_prev)
            amts[0] = max(1000, amts[0] + spend - sum(amts))   # 합계 = total_spend 정확히
            days[0] = min(days[0], 60)
        else:
            days = [dslo_eff] + sorted(random.randint(dslo_eff + 1, max(dslo_eff + 2, min(ten, 400)))
                                       for _ in range(n_ok - 1))
        user_orders[uid] = []
        for d, a in zip(days, amts):
            oid += 1
            ord_rows.append([str(oid), str(uid), str(a), "'PAID'", "'DELIVERED'", ts(d)])
            pid = random.choice(PIDS)
            item_rows.append([str(oid), str(oid), str(pid), '1', str(a)])
            user_orders[uid].append((oid, d, pid))
    for _ in range(cc):                                   # ⑥ 취소 주문 (최근 2주)
        oid += 1
        d = random.randint(2, 13)
        ord_rows.append([str(oid), str(uid), str(random.randint(10000, 60000)), "'PAID'", "'CANCELLED'", ts(d)])
        pid = random.choice(PIDS)
        item_rows.append([str(oid), str(oid), str(pid), '1', str(random.randint(10000, 60000))])

    ordered_pids = {x[2] for x in user_orders.get(uid, [])}

    # --- 장바구니 방치 ---
    if ab > 0:
        cid += 1
        citems_days = [random.randint(4, 7) for _ in range(ab)]
        cart_rows.append([str(cid), str(uid), ts(max(citems_days))])
        for d in citems_days:
            ciid += 1
            citem_rows.append([str(ciid), str(cid), str(random.choice(PIDS)), str(random.randint(1, 3)), ts(d)])

    # --- 찜 방치 (주문 안 한 상품으로) ---
    for _ in range(wi):
        wid += 1
        pid = random.choice([x for x in random.sample(PIDS, 20) if x not in ordered_pids])
        ordered_pids.add(pid)                              # 찜 중복 방지 재활용
        wish_rows.append([str(wid), str(uid), str(pid), ts(random.randint(8, 20))])

    # --- 쿠폰 (만료임박 미사용 + 일부 사용 이력) ---
    for _ in range(cu):
        ucid += 1
        ucp_rows.append([str(ucid), str(uid), str(random.randint(1, 8)), 'FALSE',
                         ts(random.randint(14, 28)), f'CURRENT_DATE + {random.randint(1, 3)}', 'NULL'])
    if random.random() < 0.25:
        ucid += 1
        d = random.randint(5, 40)
        ucp_rows.append([str(ucid), str(uid), str(random.randint(1, 8)), 'TRUE', ts(d + 10),
                         f'CURRENT_DATE + {random.randint(10, 60)}', ts(d)])

    # --- 리뷰 (저평점 = ⑥ 신호 / 일부 고평점 = 현실감) ---
    for _ in range(br):
        rvid += 1
        rev_rows.append([str(rvid), str(uid), str(random.choice(PIDS)), str(random.randint(1, 2)),
                         q('기대 이하였어요. 실망했습니다.'), 'NULL', ts(random.randint(2, 25))])
    if n_ok >= 3 and random.random() < 0.25:
        rvid += 1
        rev_rows.append([str(rvid), str(uid), str(random.choice(list(ordered_pids) or PIDS)),
                         str(random.randint(4, 5)), q('만족합니다. 잘 쓰고 있어요.'), 'NULL', ts(random.randint(5, 60))])

    # --- 만족도 (응답자만) ---
    if p['satisfaction_score'] != '':
        sid += 1
        ctx = 'ORDER' if random.random() < 0.85 else 'CS'
        sat_rows.append([str(sid), str(uid), p['satisfaction_score'], f"'{ctx}'", ts(random.randint(1, 30))])

    # --- 대응 이력 (모달 제외 유형, 60% 발송 · 15% 대조군) ---
    if g == 'risk' and t in ACTION and random.random() < 0.60:
        itid += 1
        act, ntype = ACTION[t]
        ctl = random.random() < 0.15
        d = random.randint(1, 14)
        itv_rows.append([str(itid), str(uid), 'NULL', q(t), q(act),
                         str(random.randint(1, 8)) if act == 'COUPON' else 'NULL',
                         'TRUE' if ctl else 'FALSE', q(random.choice(CHANNELS)), "'SENT'", ts(d)])
        outid += 1
        conv = random.random() < (0.15 if ctl else 0.30)
        out_rows.append([str(outid), str(itid), 'TRUE' if conv else 'FALSE', 'NULL',
                         str(random.randint(15000, 90000) if conv else 0),
                         'FALSE' if churned else 'TRUE', '7', ts(max(0, d - 7))])
        if not ctl:
            nid += 1
            noti_rows.append([str(nid), str(uid), q(ntype), q('고객님을 위한 혜택이 도착했어요!'),
                              'NULL', 'TRUE' if random.random() < 0.5 else 'FALSE',
                              'TRUE' if random.random() < 0.35 else 'FALSE', ts(d)])

# ---------- 3. 멤버십 EXPIRED 80명 (일반 유저 중 과거 만료) ----------
for uid in normal_nonmember[:80]:
    umid += 1
    e = random.randint(30, 200)
    um_rows.append([str(umid), str(uid), '1', f'CURRENT_DATE - {e + 365}', f'CURRENT_DATE - {e}', "'EXPIRED'", 'NULL'])

# ---------- 4. 멤버십 해지 모달 실험 (처치 170: 잔존 70 + 강행 100 / 대조 30: 잔존 7 + 강행 23) ----------
cancel_users = [p for p in profiles if int(p['membership_cancelled'])]
type2 = [p for p in cancel_users if p['seed_type'] == 'MEMBERSHIP_CANCEL']          # 강행 100 (처치)
past = [p for p in cancel_users if p['seed_type'] != 'MEMBERSHIP_CANCEL']           # 과거 해지 70
random.shuffle(active_members)
retained_treat = active_members[:70]                                                 # 잔존 70 (처치)
retained_ctl = active_members[70:77]                                                 # 잔존 7 (대조)
ctl_cancel = past[:23]                                                               # 강행 23 (대조)

def modal(uid, days, ctl, retained, churn_conv=0.15):
    global itid, outid
    itid += 1
    itv_rows.append([str(itid), str(uid), 'NULL', "'MEMBERSHIP_CANCEL'", "'MODAL'", 'NULL',
                     'TRUE' if ctl else 'FALSE', "'IN_APP'", "'SENT'", ts(days)])
    outid += 1
    conv = random.random() < churn_conv
    out_rows.append([str(outid), str(itid), 'TRUE' if conv else 'FALSE', 'NULL',
                     str(random.randint(20000, 80000) if conv else 0),
                     'TRUE' if retained else 'FALSE', '30', ts(max(0, days - 30))])

for p in type2:  modal(int(p['user_id']), p.get('_cancel_days', random.randint(1, 7)), False, False)
for uid in retained_treat: modal(uid, random.randint(5, 40), False, True, 0.25)
for uid in retained_ctl:   modal(uid, random.randint(46, 60), True, True)            # 도입 전 = 대조
for p in ctl_cancel:       modal(int(p['user_id']), p.get('_cancel_days', 20), True, False)

for p in type2:                                        # 2차 윈백 쿠폰 (해지자 60%)
    if random.random() < 0.60:
        itid += 1; outid += 1
        d = max(0, p.get('_cancel_days', 3) - 1)
        itv_rows.append([str(itid), p['user_id'], 'NULL', "'MEMBERSHIP_CANCEL'", "'COUPON'", '6',
                         'FALSE', "'PUSH'", "'SENT'", ts(d)])
        conv = random.random() < 0.25
        out_rows.append([str(outid), str(itid), 'TRUE' if conv else 'FALSE', 'NULL',
                         str(random.randint(20000, 80000) if conv else 0),
                         'TRUE' if conv else 'FALSE', '30', ts(0)])

# ---------- 5. 일별 지표 (최근 5주, 이탈율 5.1 → 4.2 하락) ----------
dm = []
for i in range(34, -1, -1):
    rate = round(5.1 - (34 - i) * (0.9 / 34) + random.uniform(-0.15, 0.15), 2)
    dm.append(f"(CURRENT_DATE - {i}, 4000, {random.randint(130,155)}, {random.randint(290,330)}, {rate},"
              f" {random.randint(20,45)}, {random.randint(6,16)}, {random.randint(150,700)*1000}, {random.randint(15,35)})")
stmt('INSERT INTO churn_daily_metric (metric_date, total_users, at_risk_high, at_risk_mid, churn_rate,'
     ' intervention_count, conversion_count, attributed_revenue, retained_count) VALUES\n' + ',\n'.join(dm) + ';')

# ---------- 6. 배출 ----------
batch_insert('user_membership', ['user_membership_id','user_id','membership_id','start_date','end_date','status','cancelled_at'], um_rows)
batch_insert('orders', ['order_id','user_id','total_price','payment_status','order_status','ordered_at'], ord_rows)
batch_insert('orders_item', ['order_item_id','order_id','product_id','quantity','price'], item_rows)
batch_insert('cart', ['cart_id','user_id','created_at'], cart_rows)
batch_insert('cart_item', ['cart_item_id','cart_id','product_id','quantity','added_at'], citem_rows)
batch_insert('wishlist', ['wishlist_id','user_id','product_id','created_at'], wish_rows)
batch_insert('user_coupons', ['user_coupon_id','user_id','coupon_id','used','issued_at','expires_at','used_at'], ucp_rows)
batch_insert('reviews', ['review_id','user_id','product_id','rating','content','image','created_at'], rev_rows)
batch_insert('satisfaction_survey', ['survey_id','user_id','score','context','created_at'], sat_rows)
batch_insert('retention_intervention', ['intervention_id','user_id','churn_score_id','risk_type','action_type','ref_id','is_control','channel','status','created_at'], itv_rows)
batch_insert('intervention_outcome', ['outcome_id','intervention_id','converted','order_id','revenue_amount','retained','window_days','measured_at'], out_rows)
batch_insert('notifications', ['notification_id','user_id','type','message','ref_id','is_read','clicked','created_at'], noti_rows)

for t, c in [('membership','membership_id'),('coupons','coupon_id'),('user_membership','user_membership_id'),
             ('orders','order_id'),('orders_item','order_item_id'),('cart','cart_id'),('cart_item','cart_item_id'),
             ('wishlist','wishlist_id'),('user_coupons','user_coupon_id'),('reviews','review_id'),
             ('satisfaction_survey','survey_id'),('retention_intervention','intervention_id'),
             ('intervention_outcome','outcome_id'),('notifications','notification_id')]:
    stmt(f"SELECT setval(pg_get_serial_sequence('{t}', '{c}'), COALESCE((SELECT MAX({c}) FROM {t}), 1));")

with open(OUT, 'w', encoding='utf-8') as f:
    f.write('-- Kopang 세부 이벤트 시드 (자동 생성: seed_db.py — 직접 수정 금지)\n'
            '-- 전제: DDL 실행 + users/categories/products \\copy 로드 완료\nBEGIN;\n')
    f.write('\n'.join(sql))
    f.write('\nCOMMIT;\n')

print(f'seed_events.sql 생성: 주문 {len(ord_rows)} · 장바구니템 {len(citem_rows)} · 찜 {len(wish_rows)}'
      f' · 쿠폰 {len(ucp_rows)} · 리뷰 {len(rev_rows)} · 만족도 {len(sat_rows)}'
      f' · 멤버십 {len(um_rows)} · 대응 {len(itv_rows)} · 결과 {len(out_rows)} · 알림 {len(noti_rows)}')
