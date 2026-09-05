import sys
import time
import subprocess
from typing import Dict, Any
from ..core.config import get_llm
from ..core.logger import logger

class CodeRunnerService:
    """Service providing secure Python snippet execution & Claude AI code analysis/explanation."""

    FORBIDDEN_KEYWORDS = [
        "__import__('os')", "import os", "import subprocess", "import shutil",
        "open(", "eval(", "exec(", "globals()", "locals()", "shutil.", "sys.modules"
    ]

    @classmethod
    def run_code(cls, code: str, language: str = "python") -> Dict[str, Any]:
        lang = (language or "python").lower().strip()
        start_time = time.time()

        if lang in ["python", "py"]:
            return cls._execute_python_safely(code, start_time)
        
        # For other languages or non-executable code, use Bedrock Claude Sonnet to trace output and explain
        return cls._simulate_and_explain(code, lang, start_time)

    @classmethod
    def _execute_python_safely(cls, code: str, start_time: float) -> Dict[str, Any]:
        # Safety inspection
        has_forbidden = any(kw in code for kw in cls.FORBIDDEN_KEYWORDS)
        if has_forbidden:
            elapsed = round((time.time() - start_time) * 1000, 2)
            return {
                "language": "python",
                "output": "⚠️ Security Notice: File system and OS access commands are restricted in this chat sandbox.",
                "hasError": True,
                "executionTimeMs": elapsed,
                "explanation": "Execution blocked due to safety restrictions. Use pure algorithmic Python (math, strings, dicts, arrays)."
            }

        try:
            # Run in isolated python process with strict timeout
            result = subprocess.run(
                [sys.executable, "-c", code],
                capture_output=True,
                text=True,
                timeout=4,
            )
            elapsed = round((time.time() - start_time) * 1000, 2)
            stdout = result.stdout.strip()
            stderr = result.stderr.strip()

            if result.returncode == 0:
                out = stdout if stdout else "(Execution completed successfully with no stdout output)"
                return {
                    "language": "python",
                    "output": out,
                    "hasError": False,
                    "executionTimeMs": elapsed,
                    "explanation": None
                }
            else:
                return {
                    "language": "python",
                    "output": stderr or "Execution failed with non-zero exit code.",
                    "hasError": True,
                    "executionTimeMs": elapsed,
                    "explanation": "Runtime error encountered. Check variable definitions and indentation."
                }
        except subprocess.TimeoutExpired:
            elapsed = round((time.time() - start_time) * 1000, 2)
            return {
                "language": "python",
                "output": "Execution timed out (exceeded 4.0 seconds limit).",
                "hasError": True,
                "executionTimeMs": elapsed,
                "explanation": "Your code took longer than 4 seconds. Check for infinite loops."
            }
        except Exception as e:
            elapsed = round((time.time() - start_time) * 1000, 2)
            return {
                "language": "python",
                "output": f"Execution error: {str(e)}",
                "hasError": True,
                "executionTimeMs": elapsed,
                "explanation": None
            }

    @classmethod
    def _simulate_and_explain(cls, code: str, language: str, start_time: float) -> Dict[str, Any]:
        llm = get_llm(temperature=0.2, max_tokens=600)
        elapsed = round((time.time() - start_time) * 1000, 2)
        if llm:
            try:
                prompt = f"""You are Clyde AI, a developer copilot for Discord.
Analyze and trace the execution of this {language} snippet:

```{language}
{code}
```

Provide a concise 2-part response:
1. EXPECTED OUTPUT: The exact output/return value printed to console.
2. EXPLANATION: 1-2 bullet points explaining how the code works and time complexity if applicable.
"""
                resp = llm.invoke(prompt)
                ai_text = resp.content if isinstance(resp.content, str) else str(resp.content)
                return {
                    "language": language,
                    "output": ai_text.strip(),
                    "hasError": False,
                    "executionTimeMs": round((time.time() - start_time) * 1000, 2),
                    "explanation": f"Simulated and analyzed via Claude Sonnet Bedrock for {language}."
                }
            except Exception as e:
                logger.warning(f"Bedrock code analysis failed: {e}")

        return {
            "language": language,
            "output": f"Code preview for {language} ({len(code.splitlines())} lines).\nClick 'Explain' to inspect logic.",
            "hasError": False,
            "executionTimeMs": elapsed,
            "explanation": "Local runtime analyzer fallback."
        }

    @classmethod
    def explain_code(cls, code: str, language: str = "javascript") -> str:
        """One-click Clyde AI explanation for any code block."""
        llm = get_llm(temperature=0.3, max_tokens=800)
        if llm:
            try:
                prompt = f"""You are Clyde, Discord's AI assistant.
A member in chat asked you to explain this {language} snippet:

```{language}
{code}
```

Provide a friendly, high-clarity explanation in Discord Markdown:
• **What it does** (1 sentence)
• **Key Logic & Step-by-Step Breakdown** (bullet points)
• **Tips or Edge Cases** (if any)
Keep it concise and helpful for Discord developers!"""
                resp = llm.invoke(prompt)
                return (resp.content if isinstance(resp.content, str) else str(resp.content)).strip()
            except Exception as e:
                logger.warning(f"Bedrock code explanation failed: {e}")

        lines = code.strip().splitlines()
        return (
            f"### 🤖 Clyde Code Breakdown ({language})\n"
            f"• **Length**: {len(lines)} line(s) of {language} code.\n"
            f"• **Summary**: Defines algorithmic logic or utility operations.\n"
            f"• **Tip**: Verify syntax and test edge cases before running in production!"
        )
