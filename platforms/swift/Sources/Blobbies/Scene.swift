import Foundation

/// A transform op. Serialised into one SVG transform string, and applied
/// directly by the SwiftUI renderer.
public enum TransformOp: Sendable {
  case translate(x: Double, y: Double)
  case rotate(deg: Double)
  case scale(x: Double, y: Double?)
}

public struct ClipDef: Sendable {
  public let id: String
  public let cx: Double
  public let cy: Double
  public let r: Double
}

/// The shared draw tree, mirroring the TypeScript `SceneNode`.
public indirect enum SceneNode: Sendable {
  case defs(ClipDef)
  case group(className: String?, transform: [TransformOp], clipId: String?, children: [SceneNode])
  case circle(cx: Double, cy: Double, r: Double, fill: String)
  case ellipse(cx: Double, cy: Double, rx: Double, ry: Double, fill: String, opacity: Double?)
  case path(
    d: String,
    fill: String?,
    stroke: String?,
    strokeWidth: Double?,
    linecap: String?,
    linejoin: String?,
    transform: [TransformOp]
  )
  case text(
    x: Double,
    y: Double,
    anchor: String,
    fontFamily: String,
    fontSize: Double,
    fontWeight: Double,
    fill: String,
    value: String
  )
}

func transformString(_ ops: [TransformOp]) -> String {
  ops.map { op in
    switch op {
    case let .translate(x, y):
      return "translate(\(jsNumber(x)) \(jsNumber(y)))"
    case let .rotate(deg):
      return "rotate(\(jsNumber(deg)))"
    case let .scale(x, y):
      if let y { return "scale(\(jsNumber(x)) \(jsNumber(y)))" }
      return "scale(\(jsNumber(x)))"
    }
  }.joined(separator: " ")
}

/// Serialise one node. Attribute order matches the JavaScript core exactly.
func serializeNode(_ node: SceneNode) -> String {
  switch node {
  case let .defs(clip):
    return "<defs><clipPath id=\"\(clip.id)\"><circle cx=\"\(jsNumber(clip.cx))\" cy=\"\(jsNumber(clip.cy))\" r=\"\(jsNumber(clip.r))\"/></clipPath></defs>"
  case let .group(className, transform, clipId, children):
    var attrs = ""
    if let className { attrs += " class=\"\(className)\"" }
    if let clipId { attrs += " clip-path=\"url(#\(clipId))\"" }
    if !transform.isEmpty { attrs += " transform=\"\(transformString(transform))\"" }
    return "<g\(attrs)>\(children.map(serializeNode).joined())</g>"
  case let .circle(cx, cy, r, fill):
    return "<circle cx=\"\(jsNumber(cx))\" cy=\"\(jsNumber(cy))\" r=\"\(jsNumber(r))\" fill=\"\(fill)\"/>"
  case let .ellipse(cx, cy, rx, ry, fill, opacity):
    let opacityAttr = opacity.map { " opacity=\"\(jsNumber($0))\"" } ?? ""
    return "<ellipse cx=\"\(jsNumber(cx))\" cy=\"\(jsNumber(cy))\" rx=\"\(jsNumber(rx))\" ry=\"\(jsNumber(ry))\" fill=\"\(fill)\"\(opacityAttr)/>"
  case let .path(d, fill, stroke, strokeWidth, linecap, linejoin, transform):
    var attrs = ""
    if !transform.isEmpty { attrs += " transform=\"\(transformString(transform))\"" }
    attrs += " d=\"\(d)\""
    if let fill { attrs += " fill=\"\(fill)\"" }
    if let stroke { attrs += " stroke=\"\(stroke)\"" }
    if let strokeWidth { attrs += " stroke-width=\"\(jsNumber(strokeWidth))\"" }
    if let linecap { attrs += " stroke-linecap=\"\(linecap)\"" }
    if let linejoin { attrs += " stroke-linejoin=\"\(linejoin)\"" }
    return "<path\(attrs)/>"
  case let .text(x, y, anchor, fontFamily, fontSize, fontWeight, fill, value):
    return "<text x=\"\(jsNumber(x))\" y=\"\(jsNumber(y))\" text-anchor=\"\(anchor)\" font-family=\"\(fontFamily)\" font-size=\"\(jsNumber(fontSize))\" font-weight=\"\(jsNumber(fontWeight))\" fill=\"\(fill)\">\(value)</text>"
  }
}

public func serializeScene(_ nodes: [SceneNode]) -> String {
  nodes.map(serializeNode).joined()
}

// MARK: - Builders (mirror packages/core/src/parts.ts)

func diskClipNode(_ id: String) -> SceneNode {
  let b = BlobData.layout.backdrop
  return .defs(ClipDef(id: id, cx: b.cx, cy: b.cy, r: b.r))
}

func backdropNode() -> SceneNode {
  let b = BlobData.layout.backdrop
  return .group(
    className: "bb-backdrop",
    transform: [],
    clipId: nil,
    children: [.circle(cx: b.cx, cy: b.cy, r: b.r, fill: BlobData.backdrop)]
  )
}

func cheekNodes(_ blobCy: Double) -> [SceneNode] {
  BlobData.layout.cheeks.map { cheek in
    .ellipse(
      cx: roundTo(cheek.cx - BlobData.layout.blob.cx),
      cy: roundTo(cheek.cy - blobCy),
      rx: cheek.rx,
      ry: cheek.ry,
      fill: BlobData.blush,
      opacity: BlobData.blushOpacity
    )
  }
}

func blobNode(_ traits: BlobTraits, _ clipId: String?) -> SceneNode {
  let shape = shapeOf(traits)
  let n = directions.count
  let dir = directions[((traits.backdropDir % n) + n) % n]
  let tx = roundTo(BlobData.layout.blob.cx + dir.0 + traits.offsetX)
  let ty = roundTo(BlobData.layout.blob.bottom - shape.ry + dir.1 + traits.offsetY)
  let rot = roundTo(traits.rotate)
  var inner: [SceneNode] = [
    .path(d: eggPath(shape.rx, shape.ry, shape.eb), fill: traits.color, stroke: nil, strokeWidth: nil, linecap: nil, linejoin: nil, transform: [])
  ]
  if traits.cheeks { inner.append(contentsOf: cheekNodes(ty)) }
  return .group(
    className: "bb-blob",
    transform: [],
    clipId: clipId,
    children: [
      .group(
        className: nil,
        transform: [.translate(x: tx, y: ty), .rotate(deg: rot)],
        clipId: nil,
        children: inner
      )
    ]
  )
}

func letterNode(_ char: Character, _ x: Double, _ y: Double, _ scale: Double) -> SceneNode {
  let transform: [TransformOp] = [
    .translate(x: roundTo(x), y: roundTo(y)),
    .scale(x: roundTo(scale, 4), y: nil),
  ]
  let body: SceneNode
  if let d = BlobData.letters[String(char)] {
    body = .path(
      d: d,
      fill: "none",
      stroke: BlobData.ink,
      strokeWidth: BlobData.strokeWidth,
      linecap: "butt",
      linejoin: "round",
      transform: []
    )
  } else {
    body = .text(
      x: 12,
      y: 21,
      anchor: "middle",
      fontFamily: "ui-rounded, 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif",
      fontSize: 22,
      fontWeight: 800,
      fill: BlobData.ink,
      value: escapeXml(String(char))
    )
  }
  return .group(
    className: nil,
    transform: transform,
    clipId: nil,
    children: [.group(className: "bb-eye", transform: [], clipId: nil, children: [body])]
  )
}

func eyesNode(_ letters: String, _ index: Int?) -> SceneNode {
  let chars = Array(letters)
  let expr = index.map { expression(at: $0) }
  let layout = eyeLayout(letters, expr?.eye)
  let eyes = BlobData.layout.eyes
  let boxW = layout.boxW
  let boxH = BlobData.letterBoxHeight * eyes.scale

  func eyeAt(_ char: Character, _ x: Double, _ side: String) -> SceneNode {
    let cell = letterNode(char, x, layout.top, eyes.scale)
    guard let expr, expr.squint == side else { return cell }
    let cx = x + boxW / 2
    let cy = layout.top + boxH / 2
    return .group(
      className: nil,
      transform: [
        .translate(x: roundTo(cx), y: roundTo(cy)),
        .scale(x: 1, y: 0.4),
        .translate(x: roundTo(-cx), y: roundTo(-cy)),
      ],
      clipId: nil,
      children: [cell]
    )
  }

  var cells: [SceneNode] = [eyeAt(chars.first ?? "?", layout.left, "l")]
  if !layout.single {
    cells.append(eyeAt(chars.count > 1 ? chars[1] : "?", layout.left + boxW + layout.gap, "r"))
  }
  return .group(className: "bb-eyes", transform: [], clipId: nil, children: cells)
}

func browsNode(_ index: Int, _ letters: String) -> SceneNode? {
  let expr = expression(at: index)
  if expr.brow == "none" { return nil }
  let layout = eyeLayout(letters, expr.eye)
  let y = layout.top - 6
  let children: [SceneNode] = layout.centers.enumerated()
    .map { browPath(expr.brow, $0.element, y, $0.offset == 0 ? "l" : "r") }
    .filter { !$0.isEmpty }
    .map { .path(d: $0, fill: "none", stroke: BlobData.ink, strokeWidth: 3.4, linecap: "round", linejoin: nil, transform: []) }
  return children.isEmpty ? nil : .group(className: "bb-brows", transform: [], clipId: nil, children: children)
}

func mouthNode(_ index: Int) -> SceneNode {
  let def = expression(at: index)
  let cx = BlobData.layout.mouth.cx
  let cy = BlobData.layout.mouth.cy
  var children: [SceneNode] = []

  switch def.mouth {
  case let .half(rx, ry, tongue):
    children.append(.path(
      d: "M\(jsNumber(-rx)) 0 A\(jsNumber(rx)) \(jsNumber(ry)) 0 0 0 \(jsNumber(rx)) 0 Z",
      fill: BlobData.ink, stroke: nil, strokeWidth: nil, linecap: nil, linejoin: nil,
      transform: [.translate(x: cx, y: cy)]
    ))
    if tongue {
      children.append(.path(
        d: "M-3.8 2.5 Q0 13 3.8 2.5 Z",
        fill: BlobData.blush, stroke: nil, strokeWidth: nil, linecap: nil, linejoin: nil,
        transform: [.translate(x: cx, y: cy)]
      ))
    }
  case let .circle(dx, dy, r):
    children.append(.circle(cx: cx + dx, cy: cy + dy, r: r, fill: BlobData.ink))
  case let .ellipse(dx, dy, rx, ry):
    children.append(.ellipse(cx: cx + dx, cy: cy + dy, rx: rx, ry: ry, fill: BlobData.ink, opacity: nil))
  case let .stroke(d, width, tongue):
    children.append(.path(
      d: d, fill: "none", stroke: BlobData.ink, strokeWidth: width, linecap: "round", linejoin: "round",
      transform: [.translate(x: cx, y: cy)]
    ))
    if tongue {
      children.append(.path(
        d: "M-2.7 2 Q0 8.4 2.7 2 Z",
        fill: BlobData.blush, stroke: nil, strokeWidth: nil, linecap: nil, linejoin: nil,
        transform: [.translate(x: cx, y: cy)]
      ))
    }
  }
  return .group(className: "bb-mouth", transform: [], clipId: nil, children: children)
}

/// The whole draw tree for a name. The SwiftUI view renders this directly.
public func buildScene(_ name: String, _ options: AvatarOptions = AvatarOptions()) -> [SceneNode] {
  let resolved = resolveAvatar(name, options)
  let clipId = "\(resolved.prefix)-c"
  var nodes: [SceneNode] = [
    diskClipNode(clipId),
    backdropNode(),
    blobNode(resolved.traits, clipId),
    eyesNode(resolved.letters, resolved.traits.mouthIndex),
  ]
  if let brows = browsNode(resolved.traits.mouthIndex, resolved.letters) { nodes.append(brows) }
  nodes.append(mouthNode(resolved.traits.mouthIndex))
  return nodes
}
