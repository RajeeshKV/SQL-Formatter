import React, { useMemo, useState } from "react";

const sampleSQL = `CREATE PROCEDURE GetCustomerOrders
AS
BEGIN
SELECT c.CustomerId, c.Name, o.OrderId, o.Total
FROM Customers c
INNER JOIN Orders o ON o.CustomerId = c.CustomerId
WHERE o.Status = 'Open';
END
GO`;

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
      .replace(/\b(SELECT|FROM|WHERE|INNER JOIN|LEFT JOIN|RIGHT JOIN|FULL JOIN|ORDER BY|GROUP BY|HAVING|VALUES|SET)\b/gi, "\n$1")
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
  const [input, setInput] = useState(sampleSQL);
  const [output, setOutput] = useState(() => formatSQL(sampleSQL));
  const [copied, setCopied] = useState(false);

  const stats = useMemo(() => {
    const batches = output ? (output.match(/\bGO\b/g) || []).length : 0;
    const lines = output ? output.split("\n").filter(Boolean).length : 0;
    const chars = output.length;

    return { batches, lines, chars };
  }, [output]);

  const handleFormat = () => {
    setOutput(formatSQL(input));
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="app-shell">
      <div className="ambient ambient-primary" />
      <div className="ambient ambient-secondary" />
      <div className="ambient ambient-tertiary" />
      <div className="grid-overlay" />

      <nav className="topbar">
        <a className="brand" href="/">
          <span>SQL</span>
          <span>.Formatter</span>
        </a>
        <div className="nav-actions" aria-label="Formatter actions">
          <button className="ghost-icon" type="button" onClick={() => setInput("")} aria-label="Clear input">
            <span className="material-symbols-outlined">delete</span>
          </button>
          <button className="resume-button" type="button" onClick={() => setInput(sampleSQL)}>
            Sample
            <span className="material-symbols-outlined">data_object</span>
          </button>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Odessa Developer Utility</span>
          <h1>
            SQL Formatter.
            <br />
            <span>Clean.</span>
            <br />
            Precise.
          </h1>
          <p>
            Paste rough SQL, normalize the batch structure, and copy a cleaner
            script with the same dark engineering theme as the reference portfolio.
          </p>
        </div>

        <aside className="terminal-card" aria-label="Formatter status">
          <div className="terminal-header">
            <span />
            <span />
            <span />
            <strong>formatter - ready</strong>
          </div>
          <div className="terminal-lines">
            <p className="cmd">&gt; sql-formatter --theme portfolio</p>
            <p className="status">Material surface tokens loaded</p>
            <p className="output">Input lines: {input.split("\n").filter(Boolean).length}</p>
            <p className="success">Output batches: {stats.batches}</p>
          </div>
        </aside>
      </section>

      <section className="workspace" aria-label="SQL formatter workspace">
        <div className="panel input-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Source SQL</span>
              <h2>Paste Script</h2>
            </div>
            <span className="counter">{input.length} chars</span>
          </div>
          <textarea
            aria-label="Source SQL"
            placeholder="Paste SQL..."
            spellCheck="false"
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
        </div>

        <div className="controls">
          <button className="primary-action" type="button" onClick={handleFormat}>
            Format SQL
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button className="secondary-action" type="button" onClick={handleCopy} disabled={!output}>
            {copied ? "Copied" : "Copy"}
            <span className="material-symbols-outlined">{copied ? "done" : "content_copy"}</span>
          </button>
        </div>

        <div className="panel output-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-label">Formatted Output</span>
              <h2>Clean Script</h2>
            </div>
            <div className="stats">
              <span>{stats.lines} lines</span>
              <span>{stats.chars} chars</span>
            </div>
          </div>
          <textarea aria-label="Formatted SQL" readOnly spellCheck="false" value={output} />
        </div>
      </section>
    </main>
  );
}
