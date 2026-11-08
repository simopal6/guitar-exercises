import type { BoxPattern } from '../../components/scale-box/pattern'

export interface ScalePattern extends BoxPattern {
  id: string
  /** Groups every pattern sharing the same physical box/root — a "shape" can offer more than one scale. */
  shapeId: string
  scaleId: string
  /** The shape's own name, shown when picking a shape (e.g. "Scala maggiore (1)"). Identical for every pattern sharing a `shapeId`. */
  label: string
  /** The scale's name within this shape, shown when picking a scale inside an already-chosen shape (e.g. "Ionian"). */
  scaleLabel: string
  /**
   * Where the root sits within the 4-fret standard box, as a row offset from
   * the box's lowest fret: 0 = root is the box's first (lowest) fret, 3 =
   * root is the box's last (highest) fret. This is a property of the shape
   * itself (which finger naturally lands on the root), NOT something
   * derivable from the root fret alone — e.g. an "E-shape" box typically has
   * the root on row 2, while an "A-shape" box has it on row 4.
   */
  rootOffsetInBox: number
}
