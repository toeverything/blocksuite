export class ClipItem {
  constructor(public readonly mimeType: string, public readonly data: string) {}

  hasData() {
    return this.data !== null && this.data !== undefined;
  }
}
