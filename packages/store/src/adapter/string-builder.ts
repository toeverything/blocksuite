export class StringBuilder {
  private buffer = '';

  write(text: string) {
    this.buffer += text;
    console.log(text);
  }

  clear() {
    this.buffer = '';
  }

  toString() {
    return this.buffer;
  }
}
