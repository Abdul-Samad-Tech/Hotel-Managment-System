function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      headers
        .map((key) => {
          const text = String(row[key] ?? "").replaceAll('"', '""');
          return /[",\n]/.test(text) ? `"${text}"` : text;
        })
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

module.exports = { toCsv };
