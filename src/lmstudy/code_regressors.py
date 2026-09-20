"""Apply the regressor dictionary to posting text.

Coding is deliberately rule-based and inspectable: every coded value carries
the pattern that produced it, so the audit stage can measure per-regressor
precision and recall against hand-coded truth.
"""
from __future__ import annotations

import pathlib
import re
from dataclasses import dataclass, field
from typing import Any

import yaml

from .filters import _matches, _norm

CONFIG_PATH = pathlib.Path(__file__).resolve().parents[2] / "config" / "regressors.yaml"


@dataclass
class CodedValue:
    value: int
    matched: str | None = None
    negated_by: str | None = None


@dataclass
class CodingResult:
    values: dict[str, int] = field(default_factory=dict)
    evidence: dict[str, dict[str, Any]] = field(default_factory=dict)


def load_dictionary(path: pathlib.Path | None = None) -> dict[str, dict]:
    """Flatten the grouped YAML into {regressor_name: spec} with group kept."""
    raw = yaml.safe_load((path or CONFIG_PATH).read_text())
    flat: dict[str, dict] = {}
    for group, regressors in raw.items():
        for name, spec in (regressors or {}).items():
            flat[name] = {**spec, "group": group}
    return flat


def code_one(text_norm: str, spec: dict) -> CodedValue:
    """Binary coding: any pattern hit sets 1, any negation forces back to 0."""
    hit = next((p for p in spec.get("patterns", []) if _matches(text_norm, p)), None)
    if hit is None:
        return CodedValue(0)
    negation = next((n for n in spec.get("negations", []) if _matches(text_norm, n)), None)
    if negation is not None:
        return CodedValue(0, matched=hit, negated_by=negation)
    return CodedValue(1, matched=hit)


def code_posting(
    title: str, description: str, dictionary: dict[str, dict] | None = None
) -> CodingResult:
    dictionary = dictionary if dictionary is not None else load_dictionary()
    text_norm = _norm(f"{title}\n{description}")
    result = CodingResult()
    for name, spec in dictionary.items():
        coded = code_one(text_norm, spec)
        result.values[name] = coded.value
        result.evidence[name] = {
            "matched": coded.matched,
            "negated_by": coded.negated_by,
            "group": spec.get("group"),
        }
    return result
