#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = [
#   "stelint==0.1.5",
#   "pyyaml",  # stelint imports yaml for --glossaries but does not declare it
#   "en_core_web_sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl",
# ]
# ///
"""Lint output styles written in ASD-STE100 Simplified Technical English.

stelint reports many rules that misfire on Markdown instruction files (it reads
every instruction as descriptive prose, and it flags headers and code). This
runner fails only on the rules in GATED_RULES, which catch real STE errors.
test/ste/simpleclaude.jsonl lists the technical words that the style may use.

Usage: test/test_ste_lint.py [--all] [FILE...]
  --all  print every stelint warning, gated or not
"""

import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GLOSSARIES = ROOT / "test" / "ste" / "glossaries.yaml"
DEFAULT_FILES = [ROOT / "plugins" / "sc-output-styles" / "output-styles" / "bottom-line-ste.md"]

GATED_RULES = {
    "NonApprovedWords",
    "PhrasalVerbs",
    "VerbForms",
    "IngForms",
    "Contractions",
    "PassiveVoice",
    "SentenceLength",
}
WARNING = re.compile(r"^(?P<file>[^:]+):(?P<line>\d+):(?P<col>\d+) STE100\.(?P<rule>\w+): (?P<message>.*)$")


def lintable_body(text: str) -> str:
    """Blank the YAML frontmatter and headers, and drop blockquote markers, keeping line numbers.

    stelint joins a header to the next paragraph, and joins sentences across
    blockquoted lines that contain bold text. Both produce false sentence-length
    warnings.
    """
    lines = text.split("\n")
    if lines[0] == "---":
        end = lines.index("---", 1)
        lines = [""] * (end + 1) + lines[end + 1 :]
    lines = [re.sub(r"^> ?", "", line) for line in lines]
    return "\n".join("" if line.startswith("#") else line for line in lines)


def is_gated(warning: re.Match) -> bool:
    """SentenceLength reports each long sentence up to three times; gate only the
    20-word procedural limit, because every sentence in a style is an instruction."""
    if warning["rule"] == "SentenceLength":
        return "maximum of 20 words" in warning["message"]
    return warning["rule"] in GATED_RULES


def lint(path: Path) -> list[re.Match]:
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False) as body:
        body.write(lintable_body(path.read_text()))
    result = subprocess.run(
        [sys.executable, "-m", "stelint", "--glossaries", str(GLOSSARIES), body.name],
        capture_output=True,
        text=True,
    )
    Path(body.name).unlink()
    if result.returncode != 0:
        sys.exit(f"stelint failed on {path}:\n{result.stderr}")
    return [m for m in map(WARNING.match, result.stdout.splitlines()) if m]


def main() -> int:
    args = sys.argv[1:]
    show_all = "--all" in args
    files = [Path(a).resolve() for a in args if a != "--all"] or DEFAULT_FILES
    gated_total = 0
    for path in files:
        warnings = lint(path)
        gated = [w for w in warnings if is_gated(w)]
        gated_total += len(gated)
        for w in warnings if show_all else gated:
            print(f"{path.relative_to(ROOT)}:{w['line']}:{w['col']} {w['rule']}: {w['message']}")
        print(f"{path.relative_to(ROOT)}: {len(gated)} gated, {len(warnings) - len(gated)} advisory")
    return 1 if gated_total else 0


if __name__ == "__main__":
    sys.exit(main())
