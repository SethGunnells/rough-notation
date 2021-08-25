import {
  Rect,
  RoughAnnotationConfig,
  RoughAnnotation,
  SVG_NS
} from './model.js'
import { changeDrawnPercentage, renderAnnotation } from './render.js'

type AnnotationState = 'unattached' | 'not-showing' | 'showing'

const max = (a: number, b: number) => (a > b ? a : b)
const min = (a: number, b: number) => (a < b ? a : b)

class RoughAnnotationImpl implements RoughAnnotation {
  private _state: AnnotationState = 'unattached'
  private _config: RoughAnnotationConfig

  private _e: HTMLElement | HTMLElement[]
  private _svg?: SVGSVGElement

  constructor(e: HTMLElement | HTMLElement[], config: RoughAnnotationConfig) {
    this._e = e
    this._config = config
    this.attach()
  }

  get iterations() {
    return this._config.iterations
  }
  set iterations(value) {
    this._config.iterations = value
  }

  get color() {
    return this._config.color
  }
  set color(value) {
    if (this._config.color !== value) {
      this._config.color = value
      this.refresh()
    }
  }

  get seed() {
    return this._config.seed
  }
  set seed(value) {
    if (this._config.seed !== value) {
      this._config.seed = value
      this.refresh()
    }
  }

  get strokeWidth() {
    return this._config.strokeWidth
  }
  set strokeWidth(value) {
    if (this._config.strokeWidth !== value) {
      this._config.strokeWidth = value
      this.refresh()
    }
  }

  get padding() {
    return this._config.padding
  }
  set padding(value) {
    if (this._config.padding !== value) {
      this._config.padding = value
      this.refresh()
    }
  }

  get roughness() {
    return this._config.roughness
  }
  set roughness(value) {
    if (this._config.roughness !== value) {
      this._config.roughness = value
      this.refresh()
    }
  }

  private getSingleElement() {
    return Array.isArray(this._e) ? this._e[0] : this._e
  }

  private getBoundsForElements() {
    if (!Array.isArray(this._e)) return this._e.getBoundingClientRect()
    const pos = this._e.reduce(
      (bounds, e) => {
        const rect = e.getBoundingClientRect()
        bounds.left = min(bounds.left, rect.left)
        bounds.top = min(bounds.top, rect.top)
        bounds.right = max(bounds.right, rect.right)
        bounds.bottom = max(bounds.bottom, rect.bottom)
        return bounds
      },
      { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity }
    )
    return {
      left: pos.left,
      x: pos.left,
      top: pos.top,
      y: pos.top,
      width: pos.right - pos.left,
      height: pos.bottom - pos.top
    }
  }

  private attach() {
    if (this._state !== 'unattached' || !this.getSingleElement().parentElement)
      return

    const svg = (this._svg = document.createElementNS(SVG_NS, 'svg'))
    svg.setAttribute('class', 'rough-annotation')
    const style = svg.style
    style.position = 'absolute'
    style.top = '0'
    style.left = '0'
    style.overflow = 'visible'
    style.pointerEvents = 'none'
    style.width = '100px'
    style.height = '100px'
    const prepend = this._config.type === 'highlight'
    const host = this._config.host
    if (host) {
      if (prepend) host.prepend(svg)
      else host.append(svg)
    } else {
      this.getSingleElement().insertAdjacentElement(
        prepend ? 'beforebegin' : 'afterend',
        svg
      )
    }
    this._state = 'not-showing'

    // ensure e is positioned
    if (!prepend) return
    const es = Array.isArray(this._e) ? this._e : [this._e]
    es.forEach(e => {
      const computedPos = window.getComputedStyle(e).position
      const unpositioned = !computedPos || computedPos === 'static'
      if (!unpositioned) return
      e.style.position = 'relative'
    })
  }

  isShowing(): boolean {
    return this._state !== 'not-showing'
  }

  private pendingRefresh?: Promise<void>
  private refresh() {
    if (this.isShowing() && !this.pendingRefresh) {
      this.pendingRefresh = Promise.resolve().then(() => {
        if (this.isShowing()) {
          this.show()
        }
        delete this.pendingRefresh
      })
    }
  }

  setPercentageDrawn(percentage: number): void {
    if (!this._svg) return
    changeDrawnPercentage(this._svg, percentage)
  }

  show(): void {
    switch (this._state) {
      case 'unattached':
        break
      case 'showing':
        this.hide()
        if (this._svg) {
          this.render(this._svg)
        }
        break
      case 'not-showing':
        this.attach()
        if (this._svg) {
          this.render(this._svg)
        }
        break
    }
  }

  hide(): void {
    if (this._svg) {
      while (this._svg.lastChild) {
        this._svg.removeChild(this._svg.lastChild)
      }
    }
    this._state = 'not-showing'
  }

  remove(): void {
    if (this._svg && this._svg.parentElement) {
      this._svg.parentElement.removeChild(this._svg)
    }
    this._svg = undefined
    this._state = 'unattached'
  }

  private render(svg: SVGSVGElement) {
    let config = this._config
    const rects = this.rects()
    for (let i = 0; i < rects.length; i++) {
      renderAnnotation(svg, rects[i], config)
    }
    this._state = 'showing'
  }

  private rects(): Rect[] {
    const ret: Rect[] = []
    if (this._svg) {
      if (this._config.multiline) {
        const elementRects = this.getSingleElement().getClientRects()
        for (let i = 0; i < elementRects.length; i++) {
          ret.push(this.svgRect(this._svg, elementRects[i]))
        }
      } else {
        ret.push(this.svgRect(this._svg))
      }
    }
    return ret
  }

  private svgRect(svg: SVGSVGElement, rect?: DOMRect): Rect {
    const rect1 = svg.getBoundingClientRect()
    const rect2 = rect ? rect : this.getBoundsForElements()
    return {
      x: (rect2.x || rect2.left) - (rect1.x || rect1.left),
      y: (rect2.y || rect2.top) - (rect1.y || rect1.top),
      w: rect2.width,
      h: rect2.height
    }
  }
}

export function annotate(
  element: HTMLElement | HTMLElement[],
  config: RoughAnnotationConfig
): RoughAnnotation {
  return new RoughAnnotationImpl(element, config)
}
