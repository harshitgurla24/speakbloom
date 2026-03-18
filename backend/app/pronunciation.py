"""
pronunciation.py
----------------
Core logic for comparing spoken text against original text and
computing accuracy, wrong words, and speaking speed.
"""

import re
import unicodedata
from typing import Any
from difflib import SequenceMatcher


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _normalize(text: str) -> str:
    """
    Lowercase, remove punctuation, and strip extra whitespace.
    Works for Latin and Indic scripts alike.
    """
    # Normalize first so composed/decomposed Indic characters match consistently.
    text = unicodedata.normalize("NFC", text)

    # Remove punctuation characters (keep letters, marks, digits, spaces)
    # This preserves combining marks used in Indic scripts (e.g. Hindi matras).
    cleaned = "".join(
        ch if (ch.isalnum() or unicodedata.category(ch).startswith("M") or ch.isspace()) else " "
        for ch in text
    )
    # Collapse whitespace and lowercase
    return re.sub(r"\s+", " ", cleaned).strip().lower()


def _tokenize(text: str) -> list[str]:
    """Split normalised text into a list of word tokens."""
    return [w for w in _normalize(text).split() if w]


# ---------------------------------------------------------------------------
# Core analysis
# ---------------------------------------------------------------------------


def analyze_pronunciation(
    original_text: str,
    spoken_text: str,
    time_taken: float,  # seconds
) -> dict[str, Any]:
    """
    Compare spoken_text against original_text and return analysis metrics.

    Parameters
    ----------
    original_text : str
        The reference paragraph the user was supposed to read.
    spoken_text : str
        The transcript produced by speech recognition.
    time_taken : float
        Recording duration in seconds.

    Returns
    -------
    dict with keys:
        accuracy        – float, 0–100
        correct_words   – list[str]
        wrong_words     – list[str]
        total_words     – int
        words_spoken    – int
        speaking_speed  – float (words per minute)
        fluency_rating  – str ("Excellent" / "Good" / "Average" / "Needs Practice")
        word_comparison – list[{word, status}]
    """
    original_tokens = _tokenize(original_text)
    spoken_tokens = _tokenize(spoken_text)

    total_words = len(original_tokens)
    words_spoken = len(spoken_tokens)

    correct_words: list[str] = []
    wrong_words: list[str] = []
    word_comparison: list[dict[str, str]] = []

    matcher = SequenceMatcher(a=original_tokens, b=spoken_tokens, autojunk=False)
    for tag, i1, i2, _j1, _j2 in matcher.get_opcodes():
        if tag == "equal":
            for token in original_tokens[i1:i2]:
                correct_words.append(token)
                word_comparison.append({"word": token, "status": "correct"})
        else:
            for token in original_tokens[i1:i2]:
                wrong_words.append(token)
                word_comparison.append({"word": token, "status": "wrong"})

    # Accuracy: correct / total * 100
    accuracy = (len(correct_words) / total_words * 100) if total_words > 0 else 0.0

    # Speaking speed: words per minute
    minutes = time_taken / 60.0 if time_taken > 0 else 1.0
    speaking_speed = round(words_spoken / minutes, 1)

    # Fluency rating based on accuracy
    if accuracy >= 90:
        fluency_rating = "Excellent"
    elif accuracy >= 75:
        fluency_rating = "Good"
    elif accuracy >= 50:
        fluency_rating = "Average"
    else:
        fluency_rating = "Needs Practice"

    return {
        "accuracy": round(accuracy, 1),
        "correct_words": correct_words,
        "wrong_words": wrong_words,
        "total_words": total_words,
        "words_spoken": words_spoken,
        "speaking_speed": speaking_speed,
        "fluency_rating": fluency_rating,
        "word_comparison": word_comparison,
    }
