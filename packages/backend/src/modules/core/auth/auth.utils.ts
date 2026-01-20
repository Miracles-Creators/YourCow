export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) {
    return {};
  }

  return header.split(";").reduce<Record<string, string>>((acc, cookie) => {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (!rawName) {
      return acc;
    }
    acc[decodeURIComponent(rawName)] = decodeURIComponent(rawValue.join("="));
    return acc;
  }, {});
}
