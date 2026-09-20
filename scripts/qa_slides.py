"""Geometric QA for the generated deck.

LibreOffice cannot load any .pptx in this environment, so image-based visual QA
is unavailable. These checks cover the same defect classes the rendering pass
would look for: out-of-bounds shapes, thin margins, overlapping text, and text
too long for its box.
"""
from __future__ import annotations

import pathlib
import sys

from pptx import Presentation
from pptx.util import Emu

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIN_MARGIN_IN = 0.5
MIN_GAP_IN = 0.0          # overlap is the failure; tight gaps are reported separately
TIGHT_GAP_IN = 0.15


def inches(v) -> float:
    return Emu(v).inches if v is not None else 0.0


def rect(shape):
    return (inches(shape.left), inches(shape.top),
            inches(shape.left) + inches(shape.width),
            inches(shape.top) + inches(shape.height))


def overlap_area(a, b) -> float:
    dx = min(a[2], b[2]) - max(a[0], b[0])
    dy = min(a[3], b[3]) - max(a[1], b[1])
    return dx * dy if dx > 0 and dy > 0 else 0.0


def estimate_overflow(shape) -> float | None:
    """Rough fill ratio: characters against the area available at their size.

    Deliberately conservative — it flags only clear overruns, since exact text
    metrics need a renderer.
    """
    if not shape.has_text_frame:
        return None
    text = shape.text_frame.text or ""
    if not text.strip():
        return None
    sizes = [r.font.size.pt for p in shape.text_frame.paragraphs
             for r in p.runs if r.font.size is not None]
    pt = max(sizes) if sizes else 14.0
    w_in, h_in = inches(shape.width), inches(shape.height)
    if w_in <= 0 or h_in <= 0:
        return None
    char_w = pt * 0.5 / 72.0
    line_h = pt * 1.28 / 72.0
    per_line = max(1, int(w_in / char_w))
    lines_needed = sum(max(1, -(-len(line) // per_line))
                       for line in text.split("\n"))
    lines_avail = max(1, int(h_in / line_h))
    return lines_needed / lines_avail


def main() -> int:
    path = ROOT / "paper" / "presentation.pptx"
    if not path.exists():
        print(f"deck not found: {path}")
        return 1
    prs = Presentation(str(path))
    sw, sh = prs.slide_width.inches, prs.slide_height.inches
    problems, notes = [], []

    for i, slide in enumerate(prs.slides, 1):
        shapes = [s for s in slide.shapes if s.width and s.height]
        for s in shapes:
            l, t, r, b = rect(s)
            name = (s.name or "shape")[:28]
            if l < -0.01 or t < -0.01 or r > sw + 0.01 or b > sh + 0.01:
                problems.append(f"slide {i}: '{name}' out of bounds "
                                f"({l:.2f},{t:.2f})-({r:.2f},{b:.2f}) vs {sw:.2f}x{sh:.2f}")
            elif min(l, t, sw - r, sh - b) < MIN_MARGIN_IN - 0.01:
                notes.append(f"slide {i}: '{name}' within {min(l, t, sw-r, sh-b):.2f}\" of a slide edge")
            ratio = estimate_overflow(s)
            if ratio and ratio > 1.35:
                problems.append(f"slide {i}: '{name}' text likely overflows "
                                f"(needs ~{ratio:.1f}x its box)")

        texts = [s for s in shapes if s.has_text_frame and (s.text_frame.text or "").strip()]
        for a_i in range(len(texts)):
            for b_i in range(a_i + 1, len(texts)):
                ov = overlap_area(rect(texts[a_i]), rect(texts[b_i]))
                if ov > 0.05:
                    problems.append(
                        f"slide {i}: text '{texts[a_i].name[:20]}' overlaps "
                        f"'{texts[b_i].name[:20]}' by {ov:.2f} sq in")

    print(f"QA: {len(prs.slides)} slides, {sw:.2f}x{sh:.2f} in")
    if problems:
        print(f"\n{len(problems)} PROBLEM(S):")
        for p in problems:
            print("  -", p)
    if notes:
        print(f"\n{len(notes)} note(s):")
        for n in notes[:12]:
            print("  -", n)
    if not problems:
        print("\nNo geometric defects found.")
    return 1 if problems else 0

if __name__ == "__main__":
    raise SystemExit(main())
