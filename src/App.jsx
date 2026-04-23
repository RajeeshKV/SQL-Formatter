import React, { useState } from "react";

function formatSQL(input) {
  if (!input) return "";

  let indentLevel = 0;
  const indent = () => "    ".repeat(indentLevel);
  const result = [];

  // Split by GO while preserving comments
  const batches = input.split(/^GO\s*$/gim);

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    let batch = batches[batchIndex];
    batch = batch.trim();
    if (!batch) continue;

    const lines = batch.split("\n");

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Preserve full comment lines as-is
      if (/^--/.test(line) || /^\/\*/.test(line) || /\*\/$/.test(line)) {
        result.push(indent() + line);
        continue;
      }

      // Extract inline comment if present
      let inlineComment = "";
      if (line.includes("--")) {
        const parts = line.split("--");
        line = parts[0].trim();
        inlineComment = " -- " + parts.slice(1).join("--").trim();
      }

      // Check for END before formatting to adjust indent first
      if (/^END\b/i.test(line)) {
        indentLevel = Math.max(indentLevel - 1, 0);
      }

      // Add newlines before all major SQL keywords
      let formatted = line
        .replace(/\b(BEGIN|END|SELECT|FROM|WHERE|INNER\s+JOIN|LEFT\s+JOIN|RIGHT\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|ORDER\s+BY|GROUP\s+BY|HAVING|VALUES|INSERT\s+INTO|INSERT|UPDATE|DELETE|ALTER|CREATE|DROP|UNION|UNION\s+ALL|EXCEPT|INTERSECT|ON|AND|OR|CASE|WHEN|THEN|ELSE|AS)\b/gi, "\n$1")
        .replace(/;(?!-)/g, ";\n");

      const subLines = formatted.split("\n").map(l => l.trim()).filter(Boolean);

      for (let subLine of subLines) {
        // Add inline comment back to the last line if present
        if (inlineComment && subLine === subLines[subLines.length - 1]) {
          result.push(indent() + subLine + inlineComment);
        } else {
          result.push(indent() + subLine);
        }
      }

      // Check for BEGIN after adding to adjust indent
      if (/^BEGIN\b/i.test(line)) {
        indentLevel++;
      }
    }

    // Add GO statement with proper spacing
    if (batchIndex < batches.length - 1 || batch.trim()) {
      result.push("GO");
    }
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
