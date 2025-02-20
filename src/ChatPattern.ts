export class ChatPattern {
  pattern: RegExp;

  constructor(pattern: RegExp | string) {
    this.pattern = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  }

  public onMatch(
    message: string,
    callback: (ctx: NonNullable<ReturnType<string['match']>>) => void,
  ) {
    const match = message.match(this.pattern);

    if (match) {
      callback(match);
    }
  }
}
