export function toPascalCase(s: string) {
  return s
    .split(' ')
    .map((v) => {
      if (v.length == 0) return v;
      return v[0].toUpperCase() + v.slice(1, v.length);
    })
    .join(' ');
}
