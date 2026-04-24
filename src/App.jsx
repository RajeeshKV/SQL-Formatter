import React, { useState } from "react";

function formatSQL(input) {
  if (!input) return "";

  // Normalize
  let sql = input
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .replace(/\s*GO\s*/gi, "\nGO\n");

  const lines = [];
  let indentLevel = 0;
  const indent = () => "    ".repeat(indentLevel);

  const tokens = sql.split("\n");

  for (let raw of tokens) {
    let line = raw.trim();
    if (!line) continue;

    // Handle GO
    if (/^GO$/i.test(line)) {
      lines.push("GO");
      lines.push("");
      continue;
    }

    // Expand BEGIN/END blocks
    line = line
      .replace(/\bBEGIN\b/gi, "\nBEGIN\n")
      .replace(/\bEND\b/gi, "\nEND\n");

    const subLines = line.split("\n").map(l => l.trim()).filter(Boolean);

    for (let sub of subLines) {

      // Decrease before END
      if (/^END\b/i.test(sub)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      // CREATE TYPE special handling
      if (/CREATE TYPE/i.test(sub) && /AS TABLE\(/i.test(sub)) {
        sub = sub.replace(/\(/, "\n(\n");
        indentLevel++;
      }

      // Break columns inside TYPE
      if (indentLevel > 0 && sub.includes(",") && sub.includes("[")) {
        sub = sub.split(",").join(",\n" + indent());
      }

      // MERGE formatting
      sub = sub
        .replace(/\bUSING\b/gi, "\nUSING")
        .replace(/\bWHEN MATCHED\b/gi, "\nWHEN MATCHED")
        .replace(/\bWHEN NOT MATCHED\b/gi, "\nWHEN NOT MATCHED")
        .replace(/\bUPDATE SET\b/gi, "\nUPDATE SET\n")
        .replace(/\bINSERT\b/gi, "\nINSERT")
        .replace(/\bVALUES\b/gi, "\nVALUES");

      // Break SET columns
      if (/SET/i.test(sub) && sub.includes(",")) {
        sub = sub.replace(/,/g, ",\n" + indent());
      }

      lines.push(indent() + sub);

      // Increase after BEGIN
      if (/^BEGIN\b/i.test(sub)) {
        indentLevel++;
      }

      // Close TYPE block
      if (/^\)$/i.test(sub)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }
    }
  }

  return lines.join("\n").trim();
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
