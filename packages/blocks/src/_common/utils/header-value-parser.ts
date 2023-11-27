// https://www.rfc-editor.org/rfc/rfc9110#name-field-names

export const getFilenameFromContentDisposition = (header_value: string) => {
  header_value = header_value.trim();
  const quote_indices = [];
  const quote_map = Object.create(null);
  for (let i = 0; i < header_value.length; i++) {
    if (header_value[i] === '"' && header_value[i - 1] !== '\\') {
      quote_indices.push(i);
    }
  }
  let target_index = header_value.indexOf('filename=');
  for (let i = 0; i < quote_indices.length; i += 2) {
    const start = quote_indices[i];
    const end = quote_indices[i + 1];
    quote_map[start] = end;
    if (start < target_index && target_index < end) {
      target_index = header_value.indexOf('filename=', end);
    }
  }
  if (target_index === -1) {
    return undefined;
  }
  if (quote_map[target_index + 9] === undefined) {
    const end_space = header_value.indexOf(' ', target_index);
    return header_value.slice(
      target_index + 9,
      end_space === -1 ? header_value.length : end_space
    );
  }
  return header_value.slice(target_index + 10, quote_map[target_index + 9]);
};
