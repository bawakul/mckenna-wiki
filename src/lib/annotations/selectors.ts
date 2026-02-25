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
 * Collect all paragraph elements (data-paragraph-id) between startPara and endPara
 * Walks the DOM forward from startPara, collecting paragraphs strictly between
 * startPara and endPara (exclusive of both endpoints).
 *
 * In the virtualized reader, each paragraph is wrapped in its own absolutely-positioned
 * div (the virtualizer item wrapper). So paragraphs are NOT siblings — we must walk
 * up to a shared ancestor (the virtualizer container) and search within it.
 */
function getAllParagraphsBetween(startPara: Element, endPara: Element): Element[] {
  // Find the virtualized container (or nearest common ancestor with all paragraphs)
  const container = startPara.closest('[data-virtualized-container]')
    ?? startPara.closest('[class*="max-w"]')?.parentElement
  if (!container) return []

  const startId = parseInt(startPara.getAttribute('data-paragraph-id') || '0', 10)
  const endId = parseInt(endPara.getAttribute('data-paragraph-id') || '0', 10)

  // Query all paragraph elements in document order within the container
  const allParagraphs = container.querySelectorAll('[data-paragraph-id]')
  const result: Element[] = []
  let inRange = false

  for (const el of allParagraphs) {
    const id = parseInt(el.getAttribute('data-paragraph-id') || '0', 10)
    if (id === startId) {
      inRange = true
      continue
    }
    if (id === endId) break
    if (inRange) result.push(el)
  }

  return result
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
 * Returns start and end offsets relative to the <p> element's text content only.
 *
 * The wrapper div[data-paragraph-id] contains timestamp <span> and speaker <div>
 * as siblings to <p>. Scoping to the <p> element excludes those from offset
 * calculation, ensuring stored offsets match the user's selected text.
 */
function getOffsetInParagraph(
  range: Range,
  paragraph: Element
): { start: number; end: number } {
  // Scope to <p> element to exclude timestamp and speaker label text from offsets
  const textElement = paragraph.querySelector('p') ?? paragraph
  const paragraphText = textElement.textContent || ''

  // Check if the range's start and end containers are both in this paragraph
  const startInParagraph = paragraph.contains(range.startContainer)
  const endInParagraph = paragraph.contains(range.endContainer)

  // For multi-paragraph selections, handle partial paragraphs:
  // - Start paragraph: from selection start to end of paragraph text
  // - End paragraph: from 0 to selection end
  if (startInParagraph && !endInParagraph) {
    // This is the START paragraph of a multi-paragraph selection
    const startPos = getNodeOffsetInElement(range.startContainer, range.startOffset, textElement)
    return { start: startPos, end: paragraphText.length }
  }

  if (!startInParagraph && endInParagraph) {
    // This is the END paragraph of a multi-paragraph selection
    const endPos = getNodeOffsetInElement(range.endContainer, range.endOffset, textElement)
    return { start: 0, end: endPos }
  }

  // Single-paragraph selection: both start and end are in this paragraph
  const rangeText = range.toString()

  // Fast path: find where the range text appears in the paragraph
  const startOffset = paragraphText.indexOf(rangeText)
  if (startOffset >= 0) {
    return {
      start: startOffset,
      end: startOffset + rangeText.length,
    }
  }

  // Fallback: use TreeWalker for more precise calculation
  const treeWalker = document.createTreeWalker(
    textElement,
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
 * Calculate character offset of a node+offset within a root element's text content.
 * Walks text nodes in the root until we find the target node.
 */
function getNodeOffsetInElement(node: Node, offset: number, root: Element): number {
  const treeWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let charCount = 0
  let textNode = treeWalker.nextNode()

  while (textNode) {
    if (textNode === node) {
      return charCount + offset
    }
    charCount += (textNode.textContent || '').length
    textNode = treeWalker.nextNode()
  }

  // If the node is an element (not text), offset refers to child index
  // Walk to find the character position
  if (node.nodeType === Node.ELEMENT_NODE) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
    let count = 0
    let tn = walker.nextNode()
    while (tn) {
      if (node.contains(tn)) {
        // Found a text node inside the target element
        return count + Math.min(offset, (tn.textContent || '').length)
      }
      count += (tn.textContent || '').length
      tn = walker.nextNode()
    }
  }

  return offset
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

  // Add middle paragraph anchors (full-span) for multi-paragraph selections
  if (endPara && endPara !== startPara && startPara) {
    const middleParagraphs = getAllParagraphsBetween(startPara, endPara)
    for (const middlePara of middleParagraphs) {
      const middleId = parseInt(middlePara.getAttribute('data-paragraph-id') || '0', 10)
      const textElement = middlePara.querySelector('p')
      const textLength = textElement?.textContent?.length ?? middlePara.textContent?.length ?? 0
      paragraphAnchors.push({
        type: 'ParagraphAnchor',
        paragraphId: middleId,
        startOffset: 0,
        endOffset: textLength,
      })
    }
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
