/**
 * RTL (Right-to-Left) utilities for BlockSuite
 * Provides text direction detection, alignment conversion, and RTL-aware utilities
 */

/**
 * Character ranges for RTL detection
 * Based on Unicode bidirectional algorithm
 */
const RS_LTR_CHARS =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF' +
  '\u2C00-\uFB1C\uFDFE-\uFE6F\uFEFD-\uFFFF';
const RS_RTL_CHARS = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';

/**
 * Regular expression to detect RTL text
 */
const RE_RTL_CHECK = new RegExp(`^[^${RS_LTR_CHARS}]*[${RS_RTL_CHARS}]`);

/**
 * Text alignment options
 */
export enum TextAlign {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
}

/**
 * Text direction options
 */
export enum TextDirection {
  LTR = 'ltr',
  RTL = 'rtl',
  Auto = 'auto',
}

/**
 * RTL-aware text alignment mapping
 */
export const RTL_ALIGNMENT_MAP: Record<TextAlign, Record<TextDirection, TextAlign>> = {
  [TextAlign.Left]: {
    [TextDirection.LTR]: TextAlign.Left,
    [TextDirection.RTL]: TextAlign.Right,
    [TextDirection.Auto]: TextAlign.Left,
  },
  [TextAlign.Right]: {
    [TextDirection.LTR]: TextAlign.Right,
    [TextDirection.RTL]: TextAlign.Left,
    [TextDirection.Auto]: TextAlign.Right,
  },
  [TextAlign.Center]: {
    [TextDirection.LTR]: TextAlign.Center,
    [TextDirection.RTL]: TextAlign.Center,
    [TextDirection.Auto]: TextAlign.Center,
  },
  [TextAlign.Justify]: {
    [TextDirection.LTR]: TextAlign.Justify,
    [TextDirection.RTL]: TextAlign.Justify,
    [TextDirection.Auto]: TextAlign.Justify,
  },
};

/**
 * Detects if text contains RTL characters
 * @param text - The text to analyze
 * @returns true if text contains RTL characters
 */
export function isRTL(text: string): boolean {
  if (!text || text.length === 0) return false;
  return RE_RTL_CHECK.test(text);
}

/**
 * Detects the text direction based on the first character
 * @param text - The text to analyze
 * @returns The text direction based on the first character
 */
export function getTextDirection(text: string): TextDirection {
  if (!text || text.length === 0) return TextDirection.LTR;
  
  // Check if the first non-whitespace character is RTL
  const trimmedText = text.trim();
  if (trimmedText.length === 0) return TextDirection.LTR;
  
  const firstChar = trimmedText[0];
  return isRTL(firstChar) ? TextDirection.RTL : TextDirection.LTR;
}

/**
 * Converts text alignment to RTL-aware alignment
 * @param alignment - The original text alignment
 * @param direction - The text direction
 * @returns RTL-aware text alignment
 */
export function getRTLAlignment(
  alignment: TextAlign,
  direction: TextDirection
): TextAlign {
  return RTL_ALIGNMENT_MAP[alignment][direction];
}

/**
 * Gets the CSS text-align value for RTL-aware alignment
 * @param alignment - The text alignment
 * @param direction - The text direction
 * @returns CSS text-align value
 */
export function getRTLTextAlign(
  alignment: TextAlign,
  direction: TextDirection
): string {
  const rtlAlignment = getRTLAlignment(alignment, direction);
  return rtlAlignment;
}

/**
 * Gets the CSS direction value
 * @param direction - The text direction
 * @returns CSS direction value
 */
export function getCSSDirection(direction: TextDirection): string {
  return direction === TextDirection.RTL ? 'rtl' : 'ltr';
}

/**
 * Checks if a text alignment should be mirrored in RTL
 * @param alignment - The text alignment
 * @returns true if alignment should be mirrored
 */
export function shouldMirrorAlignment(alignment: TextAlign): boolean {
  return alignment === TextAlign.Left || alignment === TextAlign.Right;
}

/**
 * Gets the mirrored text alignment for RTL
 * @param alignment - The original text alignment
 * @returns Mirrored text alignment
 */
export function getMirroredAlignment(alignment: TextAlign): TextAlign {
  switch (alignment) {
    case TextAlign.Left:
      return TextAlign.Right;
    case TextAlign.Right:
      return TextAlign.Left;
    case TextAlign.Center:
    case TextAlign.Justify:
      return alignment;
    default:
      return alignment;
  }
}

/**
 * Creates RTL-aware CSS properties for text alignment
 * @param alignment - The text alignment
 * @param direction - The text direction
 * @returns CSS properties object
 */
export function getRTLTextAlignCSS(
  alignment: TextAlign,
  direction: TextDirection
): Record<string, string> {
  const rtlAlignment = getRTLAlignment(alignment, direction);
  const cssDirection = getCSSDirection(direction);
  
  return {
    'text-align': rtlAlignment,
    'direction': cssDirection,
  };
}

/**
 * Detects if text contains mixed LTR/RTL content
 * @param text - The text to analyze
 * @returns true if text contains both LTR and RTL characters
 */
export function isMixedDirection(text: string): boolean {
  if (!text || text.length === 0) return false;
  
  const hasRTL = RE_RTL_CHECK.test(text);
  const hasLTR = new RegExp(`[${RS_LTR_CHARS}]`).test(text);
  
  return hasRTL && hasLTR;
}

/**
 * Splits text into directionally uniform segments
 * @param text - The text to segment
 * @returns Array of text segments with their directions
 */
export function segmentByDirection(text: string): Array<{
  text: string;
  direction: TextDirection;
}> {
  if (!text || text.length === 0) return [];
  
  const segments: Array<{ text: string; direction: TextDirection }> = [];
  let currentSegment = '';
  let currentDirection: TextDirection | null = null;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charDirection = isRTL(char) ? TextDirection.RTL : TextDirection.LTR;
    
    if (currentDirection === null) {
      currentDirection = charDirection;
      currentSegment = char;
    } else if (currentDirection === charDirection) {
      currentSegment += char;
    } else {
      // Direction changed, push current segment and start new one
      segments.push({
        text: currentSegment,
        direction: currentDirection,
      });
      currentSegment = char;
      currentDirection = charDirection;
    }
  }
  
  // Push the last segment
  if (currentSegment.length > 0 && currentDirection !== null) {
    segments.push({
      text: currentSegment,
      direction: currentDirection,
    });
  }
  
  return segments;
}

/**
 * RTL-aware text truncation
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @param direction - Text direction
 * @returns Truncated text with appropriate ellipsis
 */
export function truncateRTLText(
  text: string,
  maxLength: number,
  direction: TextDirection = TextDirection.Auto
): string {
  if (text.length <= maxLength) return text;
  
  const actualDirection = direction === TextDirection.Auto 
    ? getTextDirection(text) 
    : direction;
  
  const ellipsis = actualDirection === TextDirection.RTL ? '...' : '...';
  const truncated = text.slice(0, maxLength - ellipsis.length);
  
  return actualDirection === TextDirection.RTL 
    ? ellipsis + truncated
    : truncated + ellipsis;
}
