# -*- coding: utf-8 -*-
"""
tests/test_persona.py — Projek Badar Task 57 (G4)
Unit tests for brain_qa.persona — persona routing for SIDIX.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / "apps" / "brain_qa"))

import pytest

from brain_qa.persona import normalize_persona, route_persona, PersonaDecision, _PERSONA_SET


class TestNormalizePersona:
    """Tests for normalize_persona()."""

    def test_valid_uppercase(self):
        assert normalize_persona("HAYFAR") == "HAYFAR"

    def test_valid_lowercase_converted(self):
        assert normalize_persona("hayfar") == "HAYFAR"

    def test_valid_mixedcase(self):
        assert normalize_persona("Fach") == "FACH"

    def test_all_valid_personas(self):
        for p in ["TOARD", "FACH", "MIGHAN", "HAYFAR", "INAN"]:
            assert normalize_persona(p) == p

    def test_none_returns_none(self):
        assert normalize_persona(None) is None

    def test_invalid_raises(self):
        with pytest.raises(ValueError, match="Unknown persona"):
            normalize_persona("INVALID_PERSONA")

    def test_persona_set_completeness(self):
        """Ensure SIDIX has exactly 5 personas."""
        assert len(_PERSONA_SET) == 5
        expected = {"TOARD", "FACH", "MIGHAN", "HAYFAR", "INAN"}
        assert _PERSONA_SET == expected


class TestRoutePersona:
    """Tests for route_persona() keyword-based routing."""

    def test_returns_persona_decision(self):
        result = route_persona("apa itu python?")
        assert isinstance(result, PersonaDecision)
        assert result.persona in _PERSONA_SET

    def test_coding_question_routes_hayfar(self):
        result = route_persona("bagaimana cara debug bug ini di python?")
        assert result.persona == "HAYFAR"

    def test_creative_question_routes_mighan(self):
        result = route_persona("bantu desain poster untuk acara")
        assert result.persona == "MIGHAN"

    def test_research_question_routes_fach(self):
        result = route_persona("tolong bantu riset literatur untuk tesis ini")
        assert result.persona == "FACH"

    def test_planning_question_routes_toard(self):
        result = route_persona("buat roadmap dan strategi untuk proyek")
        assert result.persona == "TOARD"

    def test_simple_question_routes_inan(self):
        result = route_persona("apa kabar?")
        assert result.persona == "INAN"

    def test_confidence_is_float(self):
        result = route_persona("apa itu kecerdasan buatan?")
        assert isinstance(result.confidence, float)
        assert 0.0 <= result.confidence <= 1.0

    def test_scores_dict_has_all_personas(self):
        result = route_persona("test question")
        assert set(result.scores.keys()) == _PERSONA_SET

    def test_reason_is_nonempty_string(self):
        result = route_persona("explain this code")
        assert isinstance(result.reason, str)
        assert len(result.reason) > 0

    def test_persona_not_none(self):
        """route_persona() must always return a non-None persona."""
        result = route_persona("")
        assert result.persona is not None
        assert result.persona in _PERSONA_SET
