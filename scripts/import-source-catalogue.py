import json, re, pathlib, hashlib, argparse
root = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description='Import the lead facilitator skill knowledge without inventing unavailable procedures.')
local_skill = root.parent / '.agents/skills/lead-creative-session-facilitator'
packaged_skill = root.parent / 'skills/lead-creative-session-facilitator'
parser.add_argument('--skill-dir', type=pathlib.Path, default=local_skill if local_skill.exists() else packaged_skill)
args = parser.parse_args()
refs = args.skill_dir / 'references'
source = refs / 'catalogue.md'
records = []
frameworks = []
section = ''
book = 'Delft Design Guide'
for line in source.read_text(encoding='utf-8').splitlines():
    if line.startswith('## Road Map'): book = 'Road Map for Creative Problem Solving Techniques'
    if line.startswith('### '): section = line[4:]
    names = []
    if book == 'Delft Design Guide' and line.startswith('- ') and section in ('Planning models', 'Approaches'):
        name = line[2:]
        key = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        frameworks.append(dict(id='delft-'+key,name=name,kind='model' if section=='Planning models' else 'approach',source='Delft Design Guide · '+section+' · '+name,status='indexed',notes=[]))
    if line.startswith('- ') and section.startswith('Methods:'): names = [line[2:].split(' — ')[0]]
    elif book.startswith('Road Map') and section.startswith(('Content Finding:', 'Acceptance Finding', 'Information Finding')) and line.strip() and not line.startswith('#'): names = [x.strip().rstrip('.') for x in line.split(';')]
    for name in names:
        if not name: continue
        category = 'unclassified' if book == 'Delft Design Guide' or section.startswith('Information Finding') else 'diverging'
        if 'Reverging' in section: category = 'reverging'
        if 'Converging' in section or 'Acceptance' in section: category = 'converging'
        phase = ['discover'] if 'Discover' in section else ['define'] if 'Define' in section else ['develop','deliver','iterate']
        key = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
        prefix = 'index-delft-' if book == 'Delft Design Guide' else 'index-roadmap-'
        if any(x['id'] == prefix+key for x in records): continue
        records.append(dict(id=prefix+key,name=name,category=category,phase=phase,source=book+' · discovery index only'))
(root/'lib/discovery.json').write_text(json.dumps(records,indent=2),encoding='utf-8')

def clean(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    return text.replace('`', '').replace('**', '').strip()

def sections(filename):
    result = []; current = None
    for line in (refs/filename).read_text(encoding='utf-8').splitlines():
        if line.startswith('## '):
            current = {'heading':line[3:], 'lines':[]}; result.append(current)
        elif current is not None and line.strip(): current['lines'].append(line)
    return result

method_records = {}
for record in sections('delft-activities.md'):
    name = record['heading'].split(' — ')[0]
    fields = {}
    for line in record['lines']:
        if line.startswith('- ') and ': ' in line:
            key, value = line[2:].split(': ',1); fields[key] = clean(value)
    if not fields.get('Core'): raise ValueError('Method record has no recovered core: '+name)
    method_records[name] = dict(name=name,book='Delft Design Guide',section='Methods: Develop & Deliver',heading=name,fit=fields.get('Fit',''),input=fields.get('Input',''),core=fields['Core'],output=fields.get('Output',''),consideration=fields.get('Consideration',''),planningEstimate=fields.get('Planning implication (facilitator judgment)',''),sourceGroup=fields.get('Source group/material guidance',''),sourceScope=fields.get('Source scope',''),citation='Delft Design Guide · Methods: Develop & Deliver · '+name+' · verified record: Core')

perspective_line = next(line for line in source.read_text(encoding='utf-8').splitlines() if 'Its 11 Perspectives' in line)
perspectives = perspective_line.split(': ',1)[1].split('. The last entry',1)[0].rstrip('.').split('; ')
if len(perspectives)!=11: raise ValueError('Review the changed perspective index before importing.')
for name in perspectives:
    key = re.sub(r'[^a-z0-9]+','-',name.lower()).strip('-')
    frameworks.append(dict(id='delft-'+key,name=name,kind='perspective',source='Delft Design Guide · Perspectives · '+name,status='indexed',notes=[]))
for record in sections('delft-models-and-drawing.md'):
    match = next((f for f in frameworks if f['name'].lower()==record['heading'].lower()),None)
    if match:
        match['status'] = 'recovered'
        # Internal printed/PDF locators and photo paths stay in the skill, not the website.
        match['notes'] = [clean(line[2:] if line.startswith('- ') else line) for line in record['lines'] if not line.startswith('Source text:')]

guidance = []
for filename in ['activity-selection.md','timing-and-recovery.md']:
    for record in sections(filename):
        guidance.append(dict(title=record['heading'],source='Lead creative-session facilitator · '+filename,notes=[clean(line) for line in record['lines']],status='facilitator-guidance'))
used = ['catalogue.md','delft-activities.md','delft-models-and-drawing.md','sources.md','road-map-preview.md','activity-selection.md','timing-and-recovery.md']
snapshot = dict(skill='lead-creative-session-facilitator',sourceFiles={name:hashlib.sha256((refs/name).read_bytes()).hexdigest() for name in used},coverage={'delft':'Full scan and supplemental photographs available in the skill; only recovered records have verified content.','roadMap':'Partial 30-page preview. The 40 method names are discovery entries; their procedures are unavailable in the preview.'},methods=method_records,frameworks=frameworks,guidance=guidance)
(root/'lib/facilitator-knowledge.json').write_text(json.dumps(snapshot,indent=2),encoding='utf-8')
print(f'Imported {len(records)} method names, {len(method_records)} recovered method summaries and {len(frameworks)} models, approaches and perspectives from the skill. No procedures invented.')
