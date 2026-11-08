import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
file = Path(sys.argv[1])
if file.suffix.lower() == '.pdf':
    from pypdf import PdfReader
    print('\n'.join((page.extract_text() or '') for page in list(PdfReader(file).pages)[:80])[:100000])
else:
    with zipfile.ZipFile(file) as doc:
        entry = doc.getinfo('word/document.xml')
        if entry.file_size > 5_000_000:
            raise ValueError('Document text is too large')
        root = ET.fromstring(doc.read(entry))
        print('\n'.join(''.join(p.itertext()) for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'))[:100000])
