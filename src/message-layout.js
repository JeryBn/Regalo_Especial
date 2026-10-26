// Wrap without splitting words; prefer a sentence or clause boundary between pages.
export function paginateMessage(text, measure, maxWidth = 860, maxLines = 3) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wrap = list => {
    const lines = []; let line = '';
    for (const word of list) {
      const next = line ? `${line} ${word}` : word;
      if (line && measure(next) > maxWidth) { lines.push(line); line = word; }
      else line = next;
    }
    if (line) lines.push(line);
    return lines;
  };
  const pages = []; let offset = 0;
  while (offset < words.length) {
    let count = 1;
    while (offset + count < words.length && wrap(words.slice(offset, offset + count + 1)).length <= maxLines) count++;
    if (offset + count < words.length) {
      for (let end = count; end >= Math.ceil(count * .55); end--) {
        if (/[.!?;,:…][”"')]*$/.test(words[offset + end - 1])) { count = end; break; }
      }
    }
    pages.push(wrap(words.slice(offset, offset + count)));
    offset += count;
  }
  return pages;
}
