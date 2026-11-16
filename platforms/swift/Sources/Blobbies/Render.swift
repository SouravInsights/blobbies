import Foundation

func escapeXml(_ value: String) -> String {
  var s = value
  s = s.replacingOccurrences(of: "&", with: "&amp;")
  s = s.replacingOccurrences(of: "<", with: "&lt;")
  s = s.replacingOccurrences(of: ">", with: "&gt;")
  s = s.replacingOccurrences(of: "\"", with: "&quot;")
  s = s.replacingOccurrences(of: "'", with: "&apos;")
  return s
}

private let directions: [(Double, Double)] = [(-1, -0.35), (1, -0.35), (-1, 0.35), (1, 0.35)]

func shapeOf(_ traits: BlobTraits) -> ShapeGeometry {
  let n = BlobData.shapes.count
  return BlobData.shapes[((traits.shapeIndex % n) + n) % n]
}

/// Egg curve fitted to the reference coloured-layer width profile.
func eggPath(_ rx: Double, _ ry: Double, _ eb: Double) -> String {
  let wy = ry * eb
  let top = -ry
  let bot = ry
  let ctlTop = wy + (top - wy) * 0.7
  let ctlBot = wy + (bot - wy) * 0.55
  let kxt = 0.5
  let kxb = 0.55
  return "M\(rs(rx)) \(rs(wy))"
    + "C\(rs(rx)) \(rs(ctlTop)) \(rs(rx * kxt)) \(rs(top)) 0 \(rs(top))"
    + "C\(rs(-rx * kxt)) \(rs(top)) \(rs(-rx)) \(rs(ctlTop)) \(rs(-rx)) \(rs(wy))"
    + "C\(rs(-rx)) \(rs(ctlBot)) \(rs(-rx * kxb)) \(rs(bot)) 0 \(rs(bot))"
    + "C\(rs(rx * kxb)) \(rs(bot)) \(rs(rx)) \(rs(ctlBot)) \(rs(rx)) \(rs(wy))Z"
}

func renderBackdrop(_ dir: Int) -> String {
  let b = BlobData.layout.backdrop
  return "<g class=\"bb-backdrop\"><circle cx=\"\(jsNumber(b.cx))\" cy=\"\(jsNumber(b.cy))\" r=\"\(jsNumber(b.r))\" fill=\"\(BlobData.backdrop)\"/></g>"
}

func renderDiskClip(_ id: String) -> String {
  let b = BlobData.layout.backdrop
  return "<defs><clipPath id=\"\(id)\"><circle cx=\"\(jsNumber(b.cx))\" cy=\"\(jsNumber(b.cy))\" r=\"\(jsNumber(b.r))\"/></clipPath></defs>"
}

func renderCheeks(_ blobCy: Double) -> String {
  BlobData.layout.cheeks.map { cheek in
    "<ellipse cx=\"\(rs(cheek.cx - BlobData.layout.blob.cx))\" cy=\"\(rs(cheek.cy - blobCy))\" rx=\"\(jsNumber(cheek.rx))\" ry=\"\(jsNumber(cheek.ry))\" fill=\"\(BlobData.blush)\" opacity=\"\(jsNumber(BlobData.blushOpacity))\"/>"
  }.joined()
}

func renderBlob(_ traits: BlobTraits, _ clipId: String?) -> String {
  let shape = shapeOf(traits)
  let n = directions.count
  let dir = directions[((traits.backdropDir % n) + n) % n]
  let tx = roundTo(BlobData.layout.blob.cx + dir.0 + traits.offsetX)
  let ty = roundTo(BlobData.layout.blob.bottom - shape.ry + dir.1 + traits.offsetY)
  let rot = roundTo(traits.rotate)
  let cheeks = traits.cheeks ? renderCheeks(ty) : ""
  let clip = clipId.map { " clip-path=\"url(#\($0))\"" } ?? ""
  return "<g class=\"bb-blob\"\(clip)><g transform=\"translate(\(jsNumber(tx)) \(jsNumber(ty))) rotate(\(jsNumber(rot)))\"><path d=\"\(eggPath(shape.rx, shape.ry, shape.eb))\" fill=\"\(traits.color)\"/>\(cheeks)</g></g>"
}

func renderLetter(_ char: Character, _ x: Double, _ y: Double, _ scale: Double) -> String {
  let transform = "translate(\(rs(x)) \(rs(y))) scale(\(jsNumber(roundTo(scale, 4))))"
  let body: String
  if let d = BlobData.letters[String(char)] {
    body = "<path d=\"\(d)\" fill=\"none\" stroke=\"\(BlobData.ink)\" stroke-width=\"\(jsNumber(BlobData.strokeWidth))\" stroke-linecap=\"butt\" stroke-linejoin=\"round\"/>"
  } else {
    body = "<text x=\"12\" y=\"21\" text-anchor=\"middle\" font-family=\"ui-rounded, 'Nunito', 'Segoe UI', system-ui, -apple-system, sans-serif\" font-size=\"22\" font-weight=\"800\" fill=\"\(BlobData.ink)\">\(escapeXml(String(char)))</text>"
  }
  return "<g transform=\"\(transform)\"><g class=\"bb-eye\">\(body)</g></g>"
}

struct EyeLayout {
  let boxW: Double
  let gap: Double
  let left: Double
  let top: Double
  let single: Bool
  let centers: [Double]
}

func eyeLayout(_ letters: String, _ shift: EyeShift?) -> EyeLayout {
  let eyes = BlobData.layout.eyes
  let boxW = BlobData.letterBoxWidth * eyes.scale
  let boxH = BlobData.letterBoxHeight * eyes.scale
  let padding = BlobData.letterBoxWidth - (BlobData.inkWidth + BlobData.strokeWidth)
  let gap = eyes.visualGap - padding * eyes.scale
  let single = letters.count < 2
  let total = single ? boxW : boxW * 2 + gap
  let left = eyes.cx - total / 2 + (shift?.x ?? 0)
  let top = eyes.cy - boxH / 2 + (shift?.y ?? 0)
  let centers = single ? [left + boxW / 2] : [left + boxW / 2, left + boxW + gap + boxW / 2]
  return EyeLayout(boxW: boxW, gap: gap, left: left, top: top, single: single, centers: centers)
}

func renderEyes(_ letters: String, _ index: Int?) -> String {
  let chars = Array(letters)
  let expr = index.map { expression(at: $0) }
  let layout = eyeLayout(letters, expr?.eye)
  let eyes = BlobData.layout.eyes
  let boxW = layout.boxW
  let boxH = BlobData.letterBoxHeight * eyes.scale

  func eyeAt(_ char: Character, _ x: Double, _ side: String) -> String {
    let cell = renderLetter(char, x, layout.top, eyes.scale)
    guard let expr, expr.squint == side else { return cell }
    let cx = x + boxW / 2
    let cy = layout.top + boxH / 2
    return "<g transform=\"translate(\(rs(cx)) \(rs(cy))) scale(1 0.4) translate(\(rs(-cx)) \(rs(-cy)))\">\(cell)</g>"
  }

  var cells: [String] = []
  cells.append(eyeAt(chars.first ?? "?", layout.left, "l"))
  if !layout.single {
    cells.append(eyeAt(chars.count > 1 ? chars[1] : "?", layout.left + boxW + layout.gap, "r"))
  }
  return "<g class=\"bb-eyes\">\(cells.joined())</g>"
}

func browPath(_ style: String, _ ex: Double, _ y: Double, _ side: String) -> String {
  let h = 5.0
  let inner = side == "l" ? ex + h : ex - h
  let outer = side == "l" ? ex - h : ex + h
  switch style {
  case "flat":
    return "M\(jsNumber(ex - h)) \(jsNumber(y))L\(jsNumber(ex + h)) \(jsNumber(y))"
  case "raised":
    return "M\(jsNumber(ex - h)) \(jsNumber(y + 1))Q\(jsNumber(ex)) \(jsNumber(y - 3)) \(jsNumber(ex + h)) \(jsNumber(y + 1))"
  case "angry":
    return "M\(jsNumber(outer)) \(jsNumber(y - 2.2))L\(jsNumber(inner)) \(jsNumber(y + 2.2))"
  case "determined":
    return "M\(jsNumber(outer)) \(jsNumber(y - 1.2))L\(jsNumber(inner)) \(jsNumber(y + 1.2))"
  case "annoyed":
    return "M\(jsNumber(outer)) \(jsNumber(y - 0.2))L\(jsNumber(inner)) \(jsNumber(y + 1.5))"
  case "sad", "worried":
    return "M\(jsNumber(outer)) \(jsNumber(y + 2.2))L\(jsNumber(inner)) \(jsNumber(y - 2.2))"
  case "cocky":
    return side == "r"
      ? "M\(jsNumber(ex - h)) \(jsNumber(y + 1))Q\(jsNumber(ex)) \(jsNumber(y - 3.6)) \(jsNumber(ex + h)) \(jsNumber(y + 1))"
      : "M\(jsNumber(ex - h)) \(jsNumber(y))L\(jsNumber(ex + h)) \(jsNumber(y))"
  case "confused":
    return side == "l"
      ? "M\(jsNumber(ex - h)) \(jsNumber(y + 1))Q\(jsNumber(ex)) \(jsNumber(y - 3.6)) \(jsNumber(ex + h)) \(jsNumber(y + 1))"
      : "M\(jsNumber(ex - h)) \(jsNumber(y - 2.2))L\(jsNumber(ex + h)) \(jsNumber(y + 2.2))"
  default:
    return ""
  }
}

func renderBrows(_ index: Int, _ letters: String) -> String {
  let expr = expression(at: index)
  if expr.brow == "none" { return "" }
  let layout = eyeLayout(letters, expr.eye)
  let y = layout.top - 6
  let paths = layout.centers.enumerated()
    .map { browPath(expr.brow, $0.element, y, $0.offset == 0 ? "l" : "r") }
    .filter { !$0.isEmpty }
  if paths.isEmpty { return "" }
  let body = paths.map {
    "<path d=\"\($0)\" fill=\"none\" stroke=\"\(BlobData.ink)\" stroke-width=\"3.4\" stroke-linecap=\"round\"/>"
  }.joined()
  return "<g class=\"bb-brows\">\(body)</g>"
}

func renderMouth(_ index: Int) -> String {
  let def = expression(at: index)
  let cx = BlobData.layout.mouth.cx
  let cy = BlobData.layout.mouth.cy
  var body = ""

  switch def.mouth {
  case let .half(rx, ry, tongue):
    body = "<path transform=\"translate(\(jsNumber(cx)) \(jsNumber(cy)))\" d=\"M\(jsNumber(-rx)) 0 A\(jsNumber(rx)) \(jsNumber(ry)) 0 0 0 \(jsNumber(rx)) 0 Z\" fill=\"\(BlobData.ink)\"/>"
    if tongue {
      body += "<path transform=\"translate(\(jsNumber(cx)) \(jsNumber(cy)))\" d=\"M-3.8 2.5 Q0 13 3.8 2.5 Z\" fill=\"\(BlobData.blush)\"/>"
    }
  case let .circle(dx, dy, r):
    body = "<circle cx=\"\(jsNumber(cx + dx))\" cy=\"\(jsNumber(cy + dy))\" r=\"\(jsNumber(r))\" fill=\"\(BlobData.ink)\"/>"
  case let .ellipse(dx, dy, rx, ry):
    body = "<ellipse cx=\"\(jsNumber(cx + dx))\" cy=\"\(jsNumber(cy + dy))\" rx=\"\(jsNumber(rx))\" ry=\"\(jsNumber(ry))\" fill=\"\(BlobData.ink)\"/>"
  case let .stroke(d, width, tongue):
    body = "<path transform=\"translate(\(jsNumber(cx)) \(jsNumber(cy)))\" d=\"\(d)\" fill=\"none\" stroke=\"\(BlobData.ink)\" stroke-width=\"\(jsNumber(width))\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>"
    if tongue {
      body += "<path transform=\"translate(\(jsNumber(cx)) \(jsNumber(cy)))\" d=\"M-2.7 2 Q0 8.4 2.7 2 Z\" fill=\"\(BlobData.blush)\"/>"
    }
  }

  return "<g class=\"bb-mouth\">\(body)</g>"
}

func buildBlinkStyle(_ prefix: String, _ interval: Double, _ delay: Double, _ double: Bool) -> String {
  let name = "\(prefix)-blink"
  let keyframes = double
    ? "0%,72%,100%{transform:scaleY(1)}75%{transform:scaleY(.1)}78%{transform:scaleY(1)}81%{transform:scaleY(.1)}"
    : "0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}"
  return "<style>"
    + ".\(prefix) .bb-eye{transform-box:fill-box;transform-origin:center;animation:\(name) \(jsNumber(interval))ms ease-in-out \(jsNumber(delay))ms infinite}"
    + "@keyframes \(name){\(keyframes)}"
    + "@media (prefers-reduced-motion:reduce){.\(prefix) .bb-eye{animation:none}}"
    + "</style>"
}

public func wantsBlink(_ options: AvatarOptions) -> Bool {
  if options.blink == false { return false }
  if options.blink == true { return true }
  return options.animate == "blink" || options.animate == "all"
}

public func wantsFollow(_ options: AvatarOptions) -> Bool {
  if options.follow == false { return false }
  if options.follow == true { return true }
  return options.animate == "follow" || options.animate == "all"
}

/// Inner markup for the avatar (layers + optional scoped blink style).
public func renderAvatarBody(_ name: String, _ options: AvatarOptions = AvatarOptions()) -> ResolvedAvatar {
  let resolved = resolveAvatar(name, options)
  let blinkOn = wantsBlink(options)
  let style = blinkOn
    ? buildBlinkStyle(resolved.prefix, resolved.blink.interval, resolved.blink.delay, resolved.blink.double)
    : ""
  return ResolvedAvatar(
    name: resolved.name,
    letters: resolved.letters,
    prefix: resolved.prefix,
    traits: resolved.traits,
    body: resolved.body + style,
    blink: Blink(enabled: blinkOn, interval: resolved.blink.interval, delay: resolved.blink.delay, double: resolved.blink.double)
  )
}

/// Full standalone SVG string. Works as an image or inside SwiftUI.
public func renderAvatarSvg(_ name: String, _ options: AvatarOptions = AvatarOptions()) -> String {
  let resolved = renderAvatarBody(name, options)
  let size = options.size ?? 48
  var classes = ["bb", resolved.prefix]
  if let className = options.className, !className.isEmpty { classes.append(className) }
  let style = options.rounded ? " style=\"border-radius:50%\"" : ""
  let title = options.title ? "<title>\(escapeXml(resolved.name))</title>" : ""
  return "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\" role=\"img\" aria-label=\"\(escapeXml(resolved.name))\" width=\"\(escapeXml(jsNumber(size)))\" height=\"\(escapeXml(jsNumber(size)))\" class=\"\(classes.joined(separator: " "))\"\(style)>\(title)\(resolved.body)</svg>"
}
