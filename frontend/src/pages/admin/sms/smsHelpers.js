export function getCharStats(message) {
  const charLength = message.length;
  // Any character outside ASCII forces the Unicode SMS encoding (70/67 chars per part).
  const isUnicode = Array.from(message).some((ch) => ch.codePointAt(0) > 0x7f);
  const maxSingle = isUnicode ? 70 : 160;
  const parts = charLength <= maxSingle ? 1 : Math.ceil(charLength / (isUnicode ? 67 : 153));
  return { charLength, isUnicode, maxSingle, parts };
}
