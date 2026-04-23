import React, { useState } from "react";

function formatSQL(input) {
  if (!input) return "";

  let sql = input.replace(/\s+/g, " ").trim();
  let indentLevel = 0;
  const indent = () => "    ".repeat(indentLevel);
  const result = [];

  const batches = sql.split(/\bGO\b/i);

  for (let batch of batches) {
    batch = batch.trim();
    if (!batch) continue;

    batch = batch
      .replace(/\bBEGIN\b/gi, "\nBEGIN\n")
      .replace(/\bEND\b/gi, "\nEND\n")
      .replace(/;/g, ";\n");

    const lines = batch.split("\n").map((line) => line.trim()).filter(Boolean);

    for (let line of lines) {
      if (/^END/i.test(line)) indentLevel = Math.max(indentLevel - 1, 0);

      result.push(indent() + line);

      if (/^BEGIN/i.test(line)) indentLevel++;
    }

    result.push("GO", "");
  }

  return result.join("\n").trimEnd();
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
