function calculateColumnWidths(rows: string[][]): number[] {
  return rows[0].map((_, colIndex) =>
    Math.max(...rows.map(row => (row[colIndex] || '').length))
  );
}

function formatRow(
  row: string[],
  columnWidths: number[],
  isHeader: boolean
): string {
  const cells = row.map((cell, colIndex) =>
    cell.padEnd(columnWidths[colIndex], ' ')
  );
  const rowString = `| ${cells.join(' | ')} |`;
  return isHeader
    ? `${rowString}\n${formatSeparator(columnWidths)}`
    : rowString;
}

function formatSeparator(columnWidths: number[]): string {
  const separator = columnWidths.map(width => '-'.repeat(width)).join(' | ');
  return `| ${separator} |`;
}

export function formatTable(rows: string[][]): string {
  const columnWidths = calculateColumnWidths(rows);
  const formattedRows = rows.map((row, index) =>
    formatRow(row, columnWidths, index === 0)
  );
  return formattedRows.join('\n');
}
