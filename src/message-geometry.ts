export function messageGeometry(
  constraint: number,
  widestLine: number,
  lastLine: number,
  dateWidth: number,
  rtl = false,
) {
  // ChatMessageDateAndStatusNode.swift:1011–1033, no-reactions branch.
  const inline = !rtl && lastLine + dateWidth + 6 <= constraint;
  return {
    inline,
    width: Math.min(
      constraint,
      Math.ceil(Math.max(widestLine, inline ? lastLine + dateWidth + 6 : dateWidth) + 1),
    ),
    dateRowHeight: inline ? 0 : 13,
  };
}
