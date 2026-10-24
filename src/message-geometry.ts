export function messageGeometry(
  constraint: number,
  widestLine: number,
  lastLine: number,
  dateWidth: number,
  rtl = false,
) {
  // ChatMessageDateAndStatusNode.swift:1011–1033, no-reactions branch.
  const inline = !rtl && lastLine + dateWidth <= constraint;
  return {
    inline,
    width: Math.min(
      constraint,
      Math.ceil(Math.max(widestLine, inline ? lastLine + dateWidth : dateWidth) + 1),
    ),
    dateRowHeight: inline ? 0 : 13,
  };
}

export function maximumMessageWidth(screenWidth: number) {
  const fill = screenWidth <= 500 ? screenWidth - 36 : Math.floor(screenWidth * 0.85);
  // BubbleItemNode subtracts 3 edge insets + tail (15), then adds tail (6).
  return Math.max(40, fill - 9);
}
