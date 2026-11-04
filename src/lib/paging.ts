/** Slice a list into fixed-size pages, clamping the requested page. */
export const pageSlice = <T>(items: T[], page: number, size: number) => {
  const total = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, total - 1);
  return {
    total,
    current,
    items: items.slice(current * size, current * size + size),
    offset: current * size,
  };
};
