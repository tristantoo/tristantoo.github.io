"""Quarto post-render: drop the title-block headers minimal mode emits (each page sets its own head)
and swap the en dash Quarto puts between page and site title for a bar."""
import os, re

for path in os.environ.get("QUARTO_PROJECT_OUTPUT_FILES", "").splitlines():
    if not path.endswith(".html"):
        continue
    with open(path, encoding="utf-8") as f:
        html = f.read()
    html = re.sub(r'<header id="title-block-header".*?</header>\s*', "", html, flags=re.S)
    html = re.sub(r"(<title>.*?) – (.*?</title>)", r"\1 | \2", html)
    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
