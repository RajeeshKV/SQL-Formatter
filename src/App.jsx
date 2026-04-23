import React, { useState } from "react";

function formatSQL(input) {
  if (!input) return "";

  let sql = input.replace(/\s+/g, " ").trim();
  let indentLevel = 0;
  const indent = () => "    ".repeat(indentLevel);
  let result = [];

  const batches = sql.split(/\bGO\b/i);

  for (let batch of batches) {
    batch = batch.trim();
    if (!batch) continue;

    batch = batch
      .replace(/\bBEGIN\b/gi, "\nBEGIN\n")
      .replace(/\bEND\b/gi, "\nEND\n")
      .replace(/;/g, ";\n");

    const lines = batch.split("\n").map(l => l.trim()).filter(Boolean);

    for (let line of lines) {
      if (/^END/i.test(line)) indentLevel = Math.max(indentLevel - 1, 0);

      result.push(indent() + line);

      if (/^BEGIN/i.test(line)) indentLevel++;
    }

    result.push("GO", "");
  }

  return result.join("\n");
}

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");

  return (
    <div style={{ padding: 20 }}>
      <h2>SQL Formatter</h2>

      <textarea
        placeholder="Paste SQL..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{ width: "100%", height: 200 }}
      />

      <br /><br />

      <button onClick={() => setOutput(formatSQL(input))}>
        Format
      </button>
      <button onClick={() => navigator.clipboard.writeText(output)}>
        Copy
      </button>

      <br /><br />

      <textarea
        value={output}
        readOnly
        style={{ width: "100%", height: 200 }}
      />
    </div>
  );
}
