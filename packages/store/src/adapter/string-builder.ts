export class StringBuilder {
  private buffer = '';

  write(text: string) {
    this.buffer += text;
  }

  toString() {
    return this.buffer;
  }
}
