// Turns an unknown error into a short, safe message for API responses.
// Prisma validation/query errors embed the whole request (including base64 photos) and file paths,
// so they are logged on the server and replaced with a generic message.
export function safeErrorMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : '';
  if (!message) return fallback;
  if (/Invalid `.*` invocation|Prisma|prisma/.test(message) || message.length > 300) {
    console.error(fallback, message.slice(0, 2000));
    return `${fallback} Please try again, and contact support if it keeps happening.`;
  }
  return message;
}
