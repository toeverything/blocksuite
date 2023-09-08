export class StringBuilder {
  private buffer = '';

  write(text: string) {
    this.buffer += text;
  }

  clear() {
    this.buffer = '';
  }

  toString() {
    return this.buffer;
  }
}
