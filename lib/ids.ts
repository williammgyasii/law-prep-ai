let counter = 0;

export function createId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  counter = (counter + 1) % 1000;
  return `${timestamp}${random}${counter.toString(36).padStart(2, "0")}`;
}
