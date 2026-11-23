"""Generate field-spec tables + gap lists from Dev Zone OpenAPI pages.
Usage: python3 -I gen.py <specs_dir> <out_dir> <gaps_json>
"""
import json, re, sys, os

SPECS, OUT, GAPS = sys.argv[1], sys.argv[2], sys.argv[3]
APIS = [
    # file, slug, title, method, path, endpoint shown
    ('payviapaymentpage', 'prepaymentui', '/prePaymentUi', 'POST', '/prePaymentUi', '/api/2.0/Payment/prePaymentUi'),
    ('pay', 'nonui', '/nonUi', 'POST', '/nonUi', '/api/2.0/Payment/nonUi'),
    ('getpaymentstatusbyorderno', 'inquiry-transactionstatus', 'Inquiry: transactionStatus', 'GET', '/TransactionStatus', '/api/2.0/Inquiry/transactionStatus'),
    ('getpaymenttransactionlist', 'inquiry-transactionlist', 'Inquiry: transactionList', 'POST', '/TransactionList', '/api/2.0/Inquiry/transactionList'),
    ('cancel', 'void', 'Void', 'POST', '/void', '/api/2.0/void'),
    ('capture', 'settlement', 'Settlement', 'PUT', '/settlement', '/api/2.0/settlement'),
    ('refund', 'refund', 'Refund', 'POST', '/refund', '/api/2.0/Refund/refund'),
]
SAFE_FORMATS = {'date-time', 'date', 'uuid', 'guid', 'uri', 'email', 'password'}

def load(f):
    t = open(os.path.join(SPECS, f + '.md'), encoding='utf-8').read()
    return json.loads(re.search(r'```json\n(.*?)\n```', t, re.S).group(1)), t

def deref(spec, node, seen):
    while isinstance(node, dict) and '$ref' in node:
        ref = node['$ref']
        if ref in seen: return {}, seen
        seen = seen | {ref}
        cur = spec
        for part in ref.lstrip('#/').split('/'):
            cur = cur.get(part.replace('~1', '/').replace('~0', '~'), {}) if isinstance(cur, dict) else {}
        node = cur
    return node, seen

def merge(spec, node, seen):
    """Flatten allOf; return (schema-like dict with properties/required/type/...)"""
    node, seen = deref(spec, node, seen)
    if not isinstance(node, dict): return {}, seen
    if 'allOf' not in node: return node, seen
    out = {k: v for k, v in node.items() if k != 'allOf'}
    props = dict(out.get('properties', {})); req = list(out.get('required', []))
    for part in node['allOf']:
        p, _ = merge(spec, part, seen)
        props.update(p.get('properties', {})); req += p.get('required', [])
        for k in ('type', 'description', 'example', 'enum', 'maxLength', 'minLength', 'format'):
            if k in p and k not in out: out[k] = p[k]
    if props: out['properties'] = props; out.setdefault('type', 'object')
    out['required'] = req
    return out, seen

rows = []
def walk(spec, node, path, required, seen, depth=0):
    node, seen = merge(spec, node, seen)
    if not isinstance(node, dict) or depth > 8: return
    t = node.get('type') or ('object' if 'properties' in node else '')
    if path:
        rows.append(dict(path=path, node=node, type=t, required=required))
    if t == 'array' and isinstance(node.get('items'), dict):
        it, s2 = merge(spec, node['items'], seen)
        if it.get('type') == 'object' or 'properties' in it:
            for k, v in it.get('properties', {}).items():
                walk(spec, v, f'{path}[].{k}', k in it.get('required', []), s2, depth + 1)
        else:
            rows[-1]['items'] = it
    for k, v in (node.get('properties') or {}).items():
        walk(spec, v, f'{path}.{k}' if path else k, k in (node.get('required') or []), seen, depth + 1)

def describe(r):
    n = r['node']; t = r['type']; fmt = n.get('format', '')
    it = r.get('items')
    if t == 'array' and it: t = f"array of {it.get('type', '?')}"
    ln = ''
    if 'minLength' in n or 'maxLength' in n:
        a, b = n.get('minLength'), n.get('maxLength')
        ln = f'{a}' if a == b and a is not None else f"{a if a is not None else ''}–{b if b is not None else ''}".strip('–') if (a or b) else ''
        if a is None and b is not None: ln = f'≤ {b}'
        if a is not None and b is None: ln = f'≥ {a}'
        if a is not None and b is not None and a != b: ln = f'{a}–{b}'
    rng = []
    if 'minimum' in n: rng.append(f"min {n['minimum']}")
    if 'maximum' in n: rng.append(f"max {n['maximum']}")
    if 'maxItems' in n: rng.append(f"max {n['maxItems']} items")
    enum = n.get('enum') or (it or {}).get('enum')
    desc = (n.get('description') or '').strip().replace('\n', ' ')
    desc = re.sub(r'\s+', ' ', desc)
    ex = n.get('example')
    gaps = []
    if r['path'].endswith('currencyCode'):
        return dict(type=(t + (f' ({fmt})' if fmt else '')).strip(), length='3', range='', enum='ISO 4217 alphabetic, see `../currencies.md`',
                    desc='', example=n.get('example'), gaps=[])
    if fmt.startswith('paco-'):
        gaps.append(f'format {fmt}')
    if t == 'string' and not ln and not enum and fmt not in SAFE_FORMATS:
        gaps.append('length')
    if r['type'] == 'string' and not enum and re.search(r'\bflag\b|Flag$|Ind$|Type$|Status$|Code$', r['path'].split('.')[-1]) and fmt not in SAFE_FORMATS:
        gaps.append('values')
    if r['type'] in ('number', 'integer') and not rng and not r['path'].endswith('.amount') and not r['path'].endswith('decimalPlaces'):
        gaps.append('range')
    if r['type'] == 'array' and 'maxItems' not in n:
        gaps.append('max items')
    if fmt == 'date-time':
        pass
    return dict(type=(t + (f' ({fmt})' if fmt else '')).strip(), length=ln, range=', '.join(rng),
                enum=', '.join(map(str, enum)) if enum else '', desc=desc, example=ex, gaps=gaps)

all_gaps = {}
os.makedirs(OUT, exist_ok=True)
index = []
for f, slug, title, method, opath, ep in APIS:
    spec, raw = load(f)
    updated = re.search(r'updatedAt: (\S+)', raw).group(1)[:10]
    rows = []
    op = spec['paths'][opath]
    op = op.get(method.lower()) or list(op.values())[0]
    params = op.get('parameters', [])
    for p in params:
        p2, _ = deref(spec, p, frozenset())
        sch, _ = merge(spec, p2.get('schema', {}), frozenset())
        rows.append(dict(path=f"{p2.get('name')} ({p2.get('in')})", node={**sch, 'description': p2.get('description', sch.get('description', ''))},
                         type=sch.get('type', 'string'), required=p2.get('required', False)))
    rb = op.get('requestBody')
    if rb:
        rb, _ = deref(spec, rb, frozenset())
        c = rb.get('content', {})
        sch = (c.get('application/jose') or c.get('application/json') or next(iter(c.values()), {})).get('schema', {})
        walk(spec, sch, '', False, frozenset())
    lines = [f'# {title}: request fields', '',
             f'`{method} {{base}}{ep}` · Source: Dev Zone reference (updated {updated}), API v2.0.',
             'Generated from the public OpenAPI spec. **Length** = characters for strings. `[]` = array item.',
             '⚠️ = the public docs don\'t state this (length, allowed values, range, max items or format). **Unconfirmed:** don\'t guess. Keep values short and plain (letters, digits, `-`, `_`) and confirm with 2C2P before relying on a limit.', '',
             '| Field | Req | Type | Length / range | Allowed values | Notes | ⚠️ |', '|---|---|---|---|---|---|---|']
    gaps = []
    for r in rows:
        d = describe(r)
        note = d['desc']
        if len(note) > 160: note = note[:157] + '…'
        if d['example'] not in (None, '') and not isinstance(d['example'], (dict, list)): note = (note + f" e.g. `{d['example']}`").strip()
        lr = ' · '.join(x for x in (d['length'], d['range']) if x)
        g = ', '.join(d['gaps'])
        lines.append(f"| `{r['path']}` | {'**yes**' if r['required'] else ''} | {d['type']} | {lr} | {d['enum']} | {note.replace('|', '/')} | {g} |")
        if d['gaps']: gaps.append(dict(field=r['path'], type=d['type'], gaps=d['gaps'], desc=d['desc'][:120], required=r['required']))
    open(os.path.join(OUT, f'{slug}.md'), 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    all_gaps[slug] = dict(title=title, endpoint=ep, fields=len(rows), gaps=gaps)
    index.append((slug, title, ep, len(rows), len(gaps)))
json.dump(all_gaps, open(GAPS, 'w'), indent=1)
for i in index: print(i)
