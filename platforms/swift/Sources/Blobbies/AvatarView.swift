#if canImport(SwiftUI)
import SwiftUI

/// A Blobbies avatar, drawn natively in SwiftUI.
///
/// It walks the shared scene and draws each shape with `Canvas`, so there is no
/// web view and no image decoding. The blink runs off `TimelineView`, scaling
/// the `.bb-eye` group about its own centre.
///
///     BlobbiesAvatar("Sourav Nanda", AvatarOptions(size: 64, animate: "blink"))
///
public struct BlobbiesAvatar: View {
  private let name: String
  private let options: AvatarOptions
  private let scene: [SceneNode]
  private let blink: Blink

  public init(_ name: String, _ options: AvatarOptions = AvatarOptions()) {
    self.name = name
    self.options = options
    self.scene = buildScene(name, options)
    self.blink = resolveAvatar(name, options).blink
  }

  public var body: some View {
    let size = options.size ?? 48
    TimelineView(.animation) { timeline in
      Canvas { context, canvasSize in
        var ctx = context
        let scale = min(canvasSize.width, canvasSize.height) / 100
        ctx.scaleBy(x: scale, y: scale)
        if options.rounded {
          ctx.clip(to: circlePath(cx: 50, cy: 50, r: 50))
        }
        let blinkValue = wantsBlink(options) ? Self.blinkScale(at: timeline.date, blink: blink) : 1
        draw(scene, into: &ctx, .identity, blink: blinkValue)
      }
    }
    .frame(width: size, height: size)
    .accessibilityLabel(name)
  }

  // MARK: - Drawing

  private func draw(
    _ nodes: [SceneNode],
    into context: inout GraphicsContext,
    _ transform: CGAffineTransform,
    blink: Double
  ) {
    for node in nodes {
      drawNode(node, into: &context, transform, blink: blink)
    }
  }

  private func drawNode(
    _ node: SceneNode,
    into context: inout GraphicsContext,
    _ transform: CGAffineTransform,
    blink: Double
  ) {
    switch node {
    case .defs:
      break

    case let .group(className, ops, clipId, children):
      var local = transform.concatenating(Self.matrix(ops))
      if className == "bb-eye", blink != 1 {
        local = local.concatenating(Self.scaleYAbout(blink, cx: 12, cy: 12))
      }
      var sub = context
      if clipId != nil {
        sub.clip(to: circlePath(cx: 50, cy: 50, r: 50).applying(local))
      }
      for child in children {
        drawNode(child, into: &sub, local, blink: blink)
      }

    case let .circle(cx, cy, r, fill):
      context.fill(circlePath(cx: cx, cy: cy, r: r).applying(transform), with: .color(Self.color(fill)))

    case let .ellipse(cx, cy, rx, ry, fill, opacity):
      let path = ellipsePath(cx: cx, cy: cy, rx: rx, ry: ry).applying(transform)
      context.fill(path, with: .color(Self.color(fill).opacity(opacity ?? 1)))

    case let .path(d, fill, stroke, strokeWidth, _, _, ops):
      let path = SVGPathParser.path(from: d).applying(transform.concatenating(Self.matrix(ops)))
      if let fill, fill != "none" {
        context.fill(path, with: .color(Self.color(fill)))
      }
      if let stroke, let strokeWidth {
        context.stroke(path, with: .color(Self.color(stroke)), lineWidth: strokeWidth)
      }

    case let .text(x, y, _, _, fontSize, _, fill, value):
      var resolved = context.resolve(Text(value).font(.system(size: fontSize, weight: .heavy)))
      resolved.shading = .color(Self.color(fill))
      context.draw(resolved, at: CGPoint(x: x, y: y), anchor: .center)
    }
  }

  // MARK: - Helpers

  private static func matrix(_ ops: [TransformOp]) -> CGAffineTransform {
    ops.reduce(CGAffineTransform.identity) { acc, op in
      switch op {
      case let .translate(x, y):
        return acc.concatenating(CGAffineTransform(translationX: x, y: y))
      case let .rotate(deg):
        return acc.concatenating(CGAffineTransform(rotationAngle: deg * .pi / 180))
      case let .scale(x, y):
        return acc.concatenating(CGAffineTransform(scaleX: x, y: y ?? x))
      }
    }
  }

  private static func scaleYAbout(_ s: Double, cx: Double, cy: Double) -> CGAffineTransform {
    CGAffineTransform.identity
      .concatenating(CGAffineTransform(translationX: cx, y: cy))
      .concatenating(CGAffineTransform(scaleX: 1, y: s))
      .concatenating(CGAffineTransform(translationX: -cx, y: -cy))
  }

  private func circlePath(cx: Double, cy: Double, r: Double) -> Path {
    Path(ellipseIn: CGRect(x: cx - r, y: cy - r, width: r * 2, height: r * 2))
  }

  private func ellipsePath(cx: Double, cy: Double, rx: Double, ry: Double) -> Path {
    Path(ellipseIn: CGRect(x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2))
  }

  private static func color(_ hex: String) -> Color {
    var value = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if value.hasPrefix("#") { value.removeFirst() }
    guard value.count == 6, let int = UInt64(value, radix: 16) else { return .black }
    return Color(
      red: Double((int >> 16) & 0xFF) / 255,
      green: Double((int >> 8) & 0xFF) / 255,
      blue: Double(int & 0xFF) / 255
    )
  }

  /// The CSS blink, sampled for the current time: a quick dip near the end of
  /// each interval, following the same 92% / 95% / 100% keyframes.
  static func blinkScale(at date: Date, blink: Blink) -> Double {
    let period = max(0.4, blink.interval / 1000)
    let elapsed = date.timeIntervalSinceReferenceDate
    let phase = elapsed.truncatingRemainder(dividingBy: period) / period

    func dip(_ p: Double) -> Double {
      if p < 0.92 { return 1 }
      if p < 0.95 { return 1 + (0.1 - 1) * ((p - 0.92) / 0.03) }
      return 0.1 + (1 - 0.1) * ((p - 0.95) / 0.05)
    }

    if blink.double {
      let half = phase < 0.5 ? phase * 2 : (phase - 0.5) * 2
      return dip(half)
    }
    return dip(phase)
  }
}
#endif
