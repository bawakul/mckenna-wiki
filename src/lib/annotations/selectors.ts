/**
 * Selector Utilities
 * W3C-compliant selector creation and word boundary snapping
 * Used to convert DOM Range to annotation selectors for storage
 */

import type {
  AnnotationSelector,
  TextQuoteSelector,
  TextPositionSelector,
  ParagraphAnchor,
} from '@/lib/types/annotation'
import { SELECTOR_CONTEXT_LENGTH } from '@/lib/types/annotation'

/**
 * Snap a Range to word boundaries (no partial words)
 * Expands start backward and end forward to nearest whitespace
 */
export function snapToWordBoundaries(range: Range): Range {
  const { startContainer, startOffset, endContainer, endOffset } = range

  // Helper: expand offset backward to word start
  function expandToWordStart(node: Node, offset: number): number {
    if (node.nodeType !== Node.TEXT_NODE) return offset
    const text = node.textContent || ''

    // Move backward until whitespace or start
    let newOffset = offset
    while (newOffset > 0 && /\S/.test(text[newOffset - 1])) {
      newOffset--
    }
    return newOffset
  }

  // Helper: expand offset forward to word end
  function expandToWordEnd(node: Node, offset: number): number {
    if (node.nodeType !== Node.TEXT_NODE) return offset
    const text = node.textContent || ''

    // Move forward until whitespace or end
    let newOffset = offset
    while (newOffset < text.length && /\S/.test(text[newOffset])) {
      newOffset++
    }
    return newOffset
  }

  const newRange = document.createRange()
  newRange.setStart(startContainer, expandToWordStart(startContainer, startOffset))
  newRange.setEnd(endContainer, expandToWordEnd(endContainer, endOffset))

  return newRange
}

/**
 * Get text before a Range for prefix context
 * Walks backward from range start, collecting text from text nodes
 */
export function getTextBefore(range: Range, length: number): string {
  const result: string[] = []
  let remaining = length

  // Get text before in the start container
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    const text = range.startContainer.textContent || ''
    const beforeText = text.slice(0, range.startOffset)
    if (beforeText.length >= length) {
      return beforeText.slice(-length)
    }
    result.unshift(beforeText)
    remaining -= beforeText.length
  }

  // Walk backward through previous siblings and parent's previous siblings
  let node: Node | null = range.startContainer
  while (remaining > 0 && node) {
    // Try previous sibling
    let prev: ChildNode | null = node.previousSibling
    while (!prev && node.parentNode) {
      node = node.parentNode
      prev = node.previousSibling
    }

    if (!prev) break
    node = prev

    // Get text from this node (and its children if element)
    const text = node.textContent || ''
    if (text.length >= remaining) {
      result.unshift(text.slice(-remaining))
      remaining = 0
    } else {
      result.unshift(text)
      remaining -= text.length
    }
  }

  return result.join('').slice(-length)
}

/**
 * Get text after a Range for suffix context
 * Walks forward from range end, collecting text from text nodes
 */
export function getTextAfter(range: Range, length: number): string {
  const result: string[] = []
  let remaining = length

  // Get text after in the end container
  if (range.endContainer.nodeType === Node.TEXT_NODE) {
    const text = range.endContainer.textContent || ''
    const afterText = text.slice(range.endOffset)
    if (afterText.length >= length) {
      return afterText.slice(0, length)
    }
    result.push(afterText)
    remaining -= afterText.length
  }

  // Walk forward through next siblings and parent's next siblings
  let node: Node | null = range.endContainer
  while (remaining > 0 && node) {
    // Try next sibling
    let next: ChildNode | null = node.nextSibling
    while (!next && node.parentNode) {
      node = node.parentNode
      next = node.nextSibling
    }

    if (!next) break
    node = next

    // Get text from this node (and its children if element)
    const text = node.textContent || ''
    if (text.length >= remaining) {
      result.push(text.slice(0, remaining))
      remaining = 0
    } else {
      result.push(text)
      remaining -= text.length
    }
  }

  return result.join('').slice(0, length)
}

/**
 * Find paragraph element containing a node
 * Walks up the DOM tree looking for data-paragraph-id attribute
 */
function findParagraphElement(node: Node): Element | null {
  let current: Node | null = node
  while (current) {
    if (current.nodeType === Node.ELEMENT_NODE) {
      const element = current as Element
      if (element.hasAttribute('data-paragraph-id')) {
        return element
      }
    }
    current = current.parentNode
  }
  return null
}

/**
 * Calculate character offset within paragraph text
 * Returns start and end offsets relative to paragraph's full text content
 */
function getOffsetInParagraph(
  range: Range,
  paragraph: Element
): { start: number; end: number } {
  const paragraphText = paragraph.textContent || ''
  const rangeText = range.toString()

  // Find where the range text appears in the paragraph
  // This handles the common case where selection is within a single paragraph
  const startOffset = paragraphText.indexOf(rangeText)

  if (startOffset >= 0) {
    return {
      start: startOffset,
      end: startOffset + rangeText.length,
    }
  }

  // Fallback: use TreeWalker for more precise calculation
  // This handles edge cases with inline elements, marks, etc.
  const treeWalker = document.createTreeWalker(
    paragraph,
    NodeFilter.SHOW_TEXT,
    null
  )

  let charCount = 0
  let startPos = 0
  let endPos = 0
  let foundStart = false
  let foundEnd = false

  let textNode = treeWalker.nextNode()
  while (textNode && (!foundStart || !foundEnd)) {
    const nodeText = textNode.textContent || ''

    if (!foundStart && textNode === range.startContainer) {
      startPos = charCount + range.startOffset
      foundStart = true
    }

    if (!foundEnd && textNode === range.endContainer) {
      endPos = charCount + range.endOffset
      foundEnd = true
    }

    charCount += nodeText.length
    textNode = treeWalker.nextNode()
  }

  return { start: startPos, end: endPos }
}

/**
 * Calculate character position from container start
 * Used for TextPositionSelector
 */
function calculateTextPosition(
  node: Node,
  offset: number,
  container: Element
): number {
  const treeWalker = document.createTreeWalker(
    container,
    NodeFilter.SHOW_TEXT,
    null
  )

  let charCount = 0
  let textNode = treeWalker.nextNode()

  while (textNode) {
    if (textNode === node) {
      return charCount + offset
    }
    charCount += (textNode.textContent || '').length
    textNode = treeWalker.nextNode()
  }

  // Fallback if node not found
  return offset
}

/**
 * Create W3C-compliant hybrid selector from DOM Range
 * Returns selector with multiple strategies for robust re-anchoring
 */
export function createSelectorFromRange(
  range: Range,
  transcriptContainer: HTMLElement
): {
  selector: AnnotationSelector
  startParagraphId: number
  endParagraphId: number
} {
  const exact = range.toString()

  // Create TextQuoteSelector with surrounding context
  const quoteSelector: TextQuoteSelector = {
    type: 'TextQuoteSelector',
    exact,
    prefix: getTextBefore(range, SELECTOR_CONTEXT_LENGTH),
    suffix: getTextAfter(range, SELECTOR_CONTEXT_LENGTH),
  }

  // Create TextPositionSelector (character offset from container start)
  // This is fragile but useful as fast-path
  const positionSelector: TextPositionSelector = {
    type: 'TextPositionSelector',
    start: calculateTextPosition(
      range.startContainer,
      range.startOffset,
      transcriptContainer
    ),
    end: calculateTextPosition(
      range.endContainer,
      range.endOffset,
      transcriptContainer
    ),
  }

  // Create ParagraphAnchor(s)
  const startPara = findParagraphElement(range.startContainer)
  const endPara = findParagraphElement(range.endContainer)

  const paragraphAnchors: ParagraphAnchor[] = []

  // Parse paragraph IDs, defaulting to 0 if not found
  const startParagraphId = startPara
    ? parseInt(startPara.getAttribute('data-paragraph-id') || '0', 10)
    : 0
  const endParagraphId = endPara
    ? parseInt(endPara.getAttribute('data-paragraph-id') || '0', 10)
    : 0

  // Add start paragraph anchor
  if (startPara) {
    const offsets = getOffsetInParagraph(range, startPara)
    paragraphAnchors.push({
      type: 'ParagraphAnchor',
      paragraphId: startParagraphId,
      startOffset: offsets.start,
      endOffset: offsets.end,
    })
  }

  // If selection spans multiple paragraphs, add end paragraph anchor
  if (endPara && endPara !== startPara) {
    const endOffsets = getOffsetInParagraph(range, endPara)
    paragraphAnchors.push({
      type: 'ParagraphAnchor',
      paragraphId: endParagraphId,
      startOffset: 0, // Selection continues from start of this paragraph
      endOffset: endOffsets.end,
    })
  }

  const selector: AnnotationSelector = {
    type: 'RangeSelector',
    refinedBy: [quoteSelector, positionSelector, ...paragraphAnchors],
  }

  return {
    selector,
    startParagraphId,
    endParagraphId,
  }
}
