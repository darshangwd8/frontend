import { FrontendContentNode } from '@/frontend-node-types'

export function hasVisibleContent(content: FrontendContentNode[]): boolean {
  const text = extractText(content)
  return text.trim().length > 0
}

function extractText(content: FrontendContentNode[]): string {
  return content
    .map((node) => {
      if (node.type == 'math') return node.formula
      if (Object.hasOwn(node, 'text')) {
        return node.text
      } else {
        return extractText(node.children ?? [])
      }
    })
    .join('')
}
