import React, { useState } from "react";

function formatSQL(input) {
  if (!input) return "";

  let indentLevel = 0;
  const indent = () => "    ".repeat(indentLevel);
  const result = [];

  // Protect string literals (VERY IMPORTANT)
  const stringLiterals = [];
  input = input.replace(/N?'[^']*'/g, (match) => {
    stringLiterals.push(match);
    return `__STR_${stringLiterals.length - 1}__`;
  });

  const batches = input.split(/^GO\s*$/gim);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    let batch = batches[batchIndex].trim();
    if (!batch) continue;

    // Normalize spacing
    batch = batch.replace(/\r/g, "");

    // Break important keywords into lines
    batch = batch
      .replace(/\bBEGIN\b/gi, "\nBEGIN\n")
      .replace(/\bEND\b/gi, "\nEND\n")
      .replace(/\bIF\b/gi, "\nIF")
      .replace(/\bELSE\b/gi, "\nELSE\n")
      .replace(/\bMERGE\b/gi, "\nMERGE")
      .replace(/\bUSING\b/gi, "\nUSING")
      .replace(/\bWHEN MATCHED\b/gi, "\nWHEN MATCHED")
      .replace(/\bWHEN NOT MATCHED\b/gi, "\nWHEN NOT MATCHED")
      .replace(/\bINSERT\b/gi, "\nINSERT")
      .replace(/\bUPDATE\b/gi, "\nUPDATE")
      .replace(/\bSELECT\b/gi, "\nSELECT")
      .replace(/\bFROM\b/gi, "\nFROM")
      .replace(/\bWHERE\b/gi, "\nWHERE")
      .replace(/\bJOIN\b/gi, "\nJOIN")
      .replace(/\bON\b/gi, "\nON")
      .replace(/\bSET\b/gi, "\nSET")
      .replace(/\bVALUES\b/gi, "\nVALUES")
      .replace(/\bOUTPUT\b/gi, "\nOUTPUT")
      .replace(/\bDECLARE\b/gi, "\nDECLARE")
      .replace(/\bEXEC\b/gi, "\nEXEC")
      .replace(/\bWITH\b/gi, "\nWITH")
      .replace(/;/g, ";\n");

    let lines = batch.split("\n").map(l => l.trim()).filter(Boolean);

    let insideCreateType = false;

    for (let line of lines) {

      // Restore strings
      line = line.replace(/__STR_(\d+)__/g, (_, i) => stringLiterals[i]);

      // Detect CREATE TYPE TABLE block
      if (/CREATE\s+TYPE.*AS\s+TABLE/i.test(line)) {
        insideCreateType = true;
        result.push(indent() + line);
        continue;
      }

      if (insideCreateType) {
        if (line.includes("(")) {
          result.push(indent() + "(");
          indentLevel++;
          continue;
        }

        if (line.includes(")")) {
          indentLevel--;
          result.push(indent() + ")");
          insideCreateType = false;
          continue;
        }

        // Format columns
        result.push(indent() + line.replace(/,\s*/g, ","));
        continue;
      }

      // Handle END (reduce before printing)
      if (/^END\b/i.test(line)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      // Handle ELSE (same level as IF)
      if (/^ELSE\b/i.test(line)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      result.push(indent() + line);

      // Increase indent after BEGIN / IF / WITH / MERGE
      if (
        /^BEGIN\b/i.test(line) ||
        /^IF\b/i.test(line) ||
        /^WITH\b/i.test(line) ||
        /^MERGE\b/i.test(line)
      ) {
        indentLevel++;
      }

      // Special: WHEN MATCHED / NOT MATCHED
      if (/^WHEN\b/i.test(line)) {
        indentLevel++;
      }

      // Reduce indent after INSERT/UPDATE blocks in MERGE
      if (/^OUTPUT\b/i.test(line)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }
    }

    result.push("GO");
    result.push("");
  }

  return result.join("\n").trim();
}

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const handleFormat = () => {
    setOutput(formatSQL(input));
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-primary" />
      <div className="ambient ambient-secondary" />
      <div className="grid-overlay" />

      <section className="formatter">
        <div className="script-section">
          <div className="section-header">
            <span>Input Script</span>
          </div>
          <textarea
            aria-label="Input script"
            placeholder="Paste SQL..."
            spellCheck="false"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>

        <div className="button-section">
          <button className="primary-action" type="button" onClick={handleFormat}>
            Format
          </button>
          <button className="secondary-action" type="button" onClick={handleCopy} disabled={!output}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <div className="script-section">
          <div className="section-header">
            <span>Output Script</span>
          </div>
          <textarea
            aria-label="Output script"
            placeholder="Formatted SQL..."
            readOnly
            spellCheck="false"
            value={output}
          />
        </div>
      </section>
    </main>
  );
}
