export function enumLabel<TKey extends string>(t: (key: TKey) => string, enumName: string, value: string): string {
  // Enum values arrive as runtime strings, so we cast the dotted key back to the translator's key union.
  return t(`${enumName}.${value}` as TKey);
}
