export function scopeTemplateCss(css: string, scope: string): string {
  return css.replace(/(^|\{|\})\s*([^@\{\}][^\{\}]*)\{/g, (_match, prefix: string, selectorGroup: string) => {
    const scoped = selectorGroup
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean)
      .map((selector) => {
        if (selector === 'body' || selector === 'html' || selector === ':root') return scope
        if (/^(body|html|:root)\b/.test(selector)) {
          return `${scope} ${selector.replace(/^(body|html|:root)\s*/, '')}`.trim()
        }
        if (selector.startsWith(scope)) return selector
        return `${scope} ${selector}`
      })
      .join(', ')

    return `${prefix} ${scoped} {`
  })
}
