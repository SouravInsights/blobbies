import CoreGraphics

/// Convert scene transform ops into a Core Graphics transform.
///
/// The subtle part: `CGAffineTransform.concatenating` composes so that
/// `a.concatenating(b)` applies **`a` first, then `b`** — the opposite of
/// matrix-product order. SVG applies the *rightmost* op first, so each new op
/// must be concatenated ahead of the accumulated one, not after it.
///
/// Getting this backwards is why the eyes moved instead of closing: the blink
/// was scaling about the wrong origin.
func cgMatrix(_ ops: [TransformOp]) -> CGAffineTransform {
  ops.reduce(CGAffineTransform.identity) { acc, op in
    let step: CGAffineTransform
    switch op {
    case let .translate(x, y):
      step = CGAffineTransform(translationX: x, y: y)
    case let .rotate(deg):
      step = CGAffineTransform(rotationAngle: deg * .pi / 180)
    case let .scale(x, y):
      step = CGAffineTransform(scaleX: x, y: y ?? x)
    }
    return step.concatenating(acc)
  }
}

/// Scale about a point, so `(cx, cy)` stays put. A vertical blink is this with
/// `s < 1` on the eye's own centre.
func cgScaleYAbout(_ s: Double, cx: Double, cy: Double) -> CGAffineTransform {
  CGAffineTransform(translationX: -cx, y: -cy)
    .concatenating(CGAffineTransform(scaleX: 1, y: s))
    .concatenating(CGAffineTransform(translationX: cx, y: cy))
}
