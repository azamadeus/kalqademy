#!/usr/bin/env python3
"""Extracts plain text from the four reference books (fb2/fb2.zip/epub) into knowledge/raw/ for local analysis.

Usage: python3 scripts/extract_books.py <book-file> [<book-file> ...]
The raw texts are not committed (knowledge/raw is in .gitignore); the repository keeps only the
structured notes written in our own words (knowledge/*.json).
"""
import html
import os
import re
import sys
import zipfile
from xml.etree import ElementTree as ET

OUT = os.path.join(os.path.dirname(__file__), "..", "knowledge", "raw")


def clean_html(h: str) -> str:
    h = re.sub(r"(?is)<(script|style).*?</\1>", "", h)
    h = re.sub(r"(?i)</(p|div|h\d|li|tr)\s*>|<br\s*/?>", "\n", h)
    h = html.unescape(re.sub(r"(?s)<[^>]+>", "", h))
    return "\n".join(" ".join(l.split()) for l in h.split("\n") if l.strip())


def read_fb2(data: bytes) -> str:
    ns = {"f": "http://www.gribuser.ru/xml/fictionbook/2.0"}
    root = ET.fromstring(data)
    lines: list[str] = []

    def txt(e):
        return " ".join("".join(e.itertext()).split())

    def walk(sec, depth=0):
        title = sec.find("f:title", ns)
        if title is not None:
            lines.append("\n" + "#" * (depth + 1) + " " + txt(title))
        for ch in sec:
            tag = ch.tag.split("}")[1]
            if tag == "p":
                lines.append(txt(ch))
            elif tag == "section":
                walk(ch, depth + 1)

    body = [b for b in root.findall("f:body", ns) if b.get("name") is None][0]
    for s in body.findall("f:section", ns):
        walk(s)
    return "\n".join(lines)


def read_epub(zf: zipfile.ZipFile) -> str:
    opf = zf.read("content.opf").decode("utf-8", "ignore")
    ids = dict(re.findall(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"', opf))
    order = [ids[i] for i in re.findall(r'<itemref[^>]*idref="([^"]+)"', opf) if i in ids]
    parts = [f"\n=== {f} ===\n" + clean_html(zf.read(f).decode("utf-8", "ignore")) for f in order if f.endswith(("html", "xhtml"))]
    return "\n".join(parts)


def extract(path: str) -> str:
    if path.endswith(".epub"):
        return read_epub(zipfile.ZipFile(path))
    if path.endswith(".zip"):
        zf = zipfile.ZipFile(path)
        names = zf.namelist()
        fb = [n for n in names if n.endswith(".fb2")]
        if fb:
            return read_fb2(zf.read(fb[0]))
        if "content.opf" in names:
            return read_epub(zf)
        raise SystemExit(f"unknown archive layout: {path}")
    return read_fb2(open(path, "rb").read())


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for p in sys.argv[1:]:
        text = extract(p)
        name = re.sub(r"[^A-Za-z0-9_-]+", "_", os.path.basename(p))[:60] + ".txt"
        open(os.path.join(OUT, name), "w", encoding="utf-8").write(text)
        print(name, len(text))
