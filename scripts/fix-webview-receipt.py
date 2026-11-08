#!/usr/bin/env python3
"""Escape HTML script end tags embedded inside the printable receipt JS template.

The receipt is a JavaScript template literal in an inline <script>. Literal
</script> ends that inline element in HTML parsing even when inside a string.
"""
from pathlib import Path

for app in ("one", "admin"):
    file = Path("android-build/app/src/main/assets/index.html")
    if not file.exists():
        raise SystemExit("Missing staged WebView entrypoint: " + str(file))
    html = file.read_text(encoding="utf-8")
    start = html.find('<div class="foot">امضای مشتری:')
    end = html.find('</body></html>`;', start) if start >= 0 else -1
    if start >= 0 and end > start:
        section = html[start:end]
        fixed = section.replace('</script>', '<\\/script>')
        if section != fixed:
            html = html[:start] + fixed + html[end:]
            file.write_text(html, encoding="utf-8")
            print("Escaped receipt template script endings")
    # The inline script must remain open through the end of the receipt.
    if start >= 0 and end > start and '</script>' in html[start:end]:
        raise SystemExit("Unsafe raw script closing tag in receipt template")
    break
