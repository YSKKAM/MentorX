const tokenBlacklist = new Set<string>();

export const BlacklistService = {
  add(token: string) {
    tokenBlacklist.add(token);
  },
  isBlacklisted(token: string): boolean {
    return tokenBlacklist.has(token);
  },
};
