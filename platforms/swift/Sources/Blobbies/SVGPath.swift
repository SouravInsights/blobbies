#if canImport(SwiftUI)
import SwiftUI

/// A small SVG path parser.
///
/// The core's paths are stored as SVG `d` strings, which is the right
/// interchange format: compact, already precise, and shared with the web. To
/// draw natively, SwiftUI needs a `Path`, so this parses the `d` once. It
/// supports the commands the core actually emits — `M L H V C Q T A Z`, absolute
/// and relative — including elliptical arcs, which the letter glyphs use.
enum SVGPathParser {
  static func path(from d: String) -> Path {
    var path = Path()
    var scanner = Scanner(d)
    var command: Character = "M"
    var x = 0.0, y = 0.0
    var startX = 0.0, startY = 0.0
    var lastCubic: (Double, Double)?
    var lastQuad: (Double, Double)?

    func num() -> Double { scanner.nextNumber() ?? 0 }

    while !scanner.atEnd {
      scanner.skipSeparators()
      if scanner.atEnd { break }
      if let next = scanner.peekCommand() {
        command = next
        scanner.advance()
      }
      let rel = command.isLowercase

      switch Character(String(command).uppercased()) {
      case "M":
        let nx = num(), ny = num()
        x = rel ? x + nx : nx
        y = rel ? y + ny : ny
        path.move(to: CGPoint(x: x, y: y))
        startX = x; startY = y
        command = rel ? "l" : "L"
        lastCubic = nil; lastQuad = nil
      case "L":
        let nx = num(), ny = num()
        x = rel ? x + nx : nx
        y = rel ? y + ny : ny
        path.addLine(to: CGPoint(x: x, y: y))
        lastCubic = nil; lastQuad = nil
      case "H":
        let nx = num()
        x = rel ? x + nx : nx
        path.addLine(to: CGPoint(x: x, y: y))
        lastCubic = nil; lastQuad = nil
      case "V":
        let ny = num()
        y = rel ? y + ny : ny
        path.addLine(to: CGPoint(x: x, y: y))
        lastCubic = nil; lastQuad = nil
      case "C":
        let x1 = num(), y1 = num(), x2 = num(), y2 = num(), nx = num(), ny = num()
        let c1 = (rel ? x + x1 : x1, rel ? y + y1 : y1)
        let c2 = (rel ? x + x2 : x2, rel ? y + y2 : y2)
        let p = (rel ? x + nx : nx, rel ? y + ny : ny)
        path.addCurve(
          to: CGPoint(x: p.0, y: p.1),
          control1: CGPoint(x: c1.0, y: c1.1),
          control2: CGPoint(x: c2.0, y: c2.1)
        )
        lastCubic = c2; lastQuad = nil
        x = p.0; y = p.1
      case "S":
        let x2 = num(), y2 = num(), nx = num(), ny = num()
        let c1 = lastCubic.map { (2 * x - $0.0, 2 * y - $0.1) } ?? (x, y)
        let c2 = (rel ? x + x2 : x2, rel ? y + y2 : y2)
        let p = (rel ? x + nx : nx, rel ? y + ny : ny)
        path.addCurve(
          to: CGPoint(x: p.0, y: p.1),
          control1: CGPoint(x: c1.0, y: c1.1),
          control2: CGPoint(x: c2.0, y: c2.1)
        )
        lastCubic = c2; lastQuad = nil
        x = p.0; y = p.1
      case "Q":
        let x1 = num(), y1 = num(), nx = num(), ny = num()
        let c = (rel ? x + x1 : x1, rel ? y + y1 : y1)
        let p = (rel ? x + nx : nx, rel ? y + ny : ny)
        path.addQuadCurve(to: CGPoint(x: p.0, y: p.1), control: CGPoint(x: c.0, y: c.1))
        lastQuad = c; lastCubic = nil
        x = p.0; y = p.1
      case "T":
        let nx = num(), ny = num()
        let c = lastQuad.map { (2 * x - $0.0, 2 * y - $0.1) } ?? (x, y)
        let p = (rel ? x + nx : nx, rel ? y + ny : ny)
        path.addQuadCurve(to: CGPoint(x: p.0, y: p.1), control: CGPoint(x: c.0, y: c.1))
        lastQuad = c; lastCubic = nil
        x = p.0; y = p.1
      case "A":
        let rx = num(), ry = num(), rotation = num()
        let largeArc = num() != 0, sweep = num() != 0
        let nx = num(), ny = num()
        let p = (rel ? x + nx : nx, rel ? y + ny : ny)
        addArc(
          &path,
          from: (x, y),
          to: p,
          rx: rx,
          ry: ry,
          rotationDeg: rotation,
          largeArc: largeArc,
          sweep: sweep
        )
        x = p.0; y = p.1
        lastCubic = nil; lastQuad = nil
      case "Z":
        path.closeSubpath()
        x = startX; y = startY
        lastCubic = nil; lastQuad = nil
      default:
        _ = scanner.nextNumber()
      }
    }
    return path
  }

  // MARK: - Elliptical arc → cubic béziers

  private static func addArc(
    _ path: inout Path,
    from p0: (Double, Double),
    to p1: (Double, Double),
    rx rxIn: Double,
    ry ryIn: Double,
    rotationDeg: Double,
    largeArc: Bool,
    sweep: Bool
  ) {
    var rx = abs(rxIn), ry = abs(ryIn)
    if rx == 0 || ry == 0 {
      path.addLine(to: CGPoint(x: p1.0, y: p1.1))
      return
    }
    let phi = rotationDeg * .pi / 180
    let dx2 = (p0.0 - p1.0) / 2
    let dy2 = (p0.1 - p1.1) / 2
    let x1p = cos(phi) * dx2 + sin(phi) * dy2
    let y1p = -sin(phi) * dx2 + cos(phi) * dy2

    let lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if lambda > 1 {
      let s = sqrt(lambda)
      rx *= s
      ry *= s
    }

    let sign: Double = largeArc != sweep ? 1 : -1
    let numerator = max(0, rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p)
    let denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    let coef = denominator == 0 ? 0 : sign * sqrt(numerator / denominator)
    let cxp = coef * (rx * y1p / ry)
    let cyp = coef * (-ry * x1p / rx)
    let cx = cos(phi) * cxp - sin(phi) * cyp + (p0.0 + p1.0) / 2
    let cy = sin(phi) * cxp + cos(phi) * cyp + (p0.1 + p1.1) / 2

    func angle(_ ux: Double, _ uy: Double, _ vx: Double, _ vy: Double) -> Double {
      let dot = ux * vx + uy * vy
      let len = sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy))
      guard len != 0 else { return 0 }
      var a = acos(max(-1, min(1, dot / len)))
      if ux * vy - uy * vx < 0 { a = -a }
      return a
    }

    let ux = (x1p - cxp) / rx
    let uy = (y1p - cyp) / ry
    let vx = (-x1p - cxp) / rx
    let vy = (-y1p - cyp) / ry
    let theta1 = angle(1, 0, ux, uy)
    var delta = angle(ux, uy, vx, vy)
    if !sweep, delta > 0 { delta -= 2 * .pi }
    if sweep, delta < 0 { delta += 2 * .pi }

    let segments = max(1, Int(ceil(abs(delta) / (.pi / 2))))
    let segDelta = delta / Double(segments)
    var t = theta1

    func point(_ angle: Double) -> (Double, Double) {
      let px = rx * cos(angle), py = ry * sin(angle)
      return (cos(phi) * px - sin(phi) * py + cx, sin(phi) * px + cos(phi) * py + cy)
    }

    func derivative(_ angle: Double) -> (Double, Double) {
      let px = -rx * sin(angle), py = ry * cos(angle)
      return (cos(phi) * px - sin(phi) * py, sin(phi) * px + cos(phi) * py)
    }

    for _ in 0..<segments {
      let t2 = t + segDelta
      let alpha = 4.0 / 3.0 * tan(segDelta / 4)
      let start = point(t), end = point(t2)
      let d1 = derivative(t), d2 = derivative(t2)
      path.addCurve(
        to: CGPoint(x: end.0, y: end.1),
        control1: CGPoint(x: start.0 + alpha * d1.0, y: start.1 + alpha * d1.1),
        control2: CGPoint(x: end.0 - alpha * d2.0, y: end.1 - alpha * d2.1)
      )
      t = t2
    }
  }

  // MARK: - Scanner

  private struct Scanner {
    private let chars: [Character]
    private var index = 0

    init(_ string: String) { chars = Array(string) }

    var atEnd: Bool { index >= chars.count }

    mutating func skipSeparators() {
      while index < chars.count {
        let c = chars[index]
        if c == " " || c == "," || c == "\n" || c == "\t" || c == "\r" {
          index += 1
        } else {
          break
        }
      }
    }

    mutating func peekCommand() -> Character? {
      skipSeparators()
      guard index < chars.count, chars[index].isLetter else { return nil }
      return chars[index]
    }

    mutating func advance() { index += 1 }

    mutating func nextNumber() -> Double? {
      skipSeparators()
      var text = ""
      if index < chars.count, chars[index] == "-" || chars[index] == "+" {
        text.append(chars[index])
        index += 1
      }
      var sawDigit = false
      while index < chars.count, chars[index].isNumber {
        text.append(chars[index])
        index += 1
        sawDigit = true
      }
      if index < chars.count, chars[index] == "." {
        text.append(chars[index])
        index += 1
        while index < chars.count, chars[index].isNumber {
          text.append(chars[index])
          index += 1
          sawDigit = true
        }
      }
      if sawDigit, index < chars.count, (chars[index] == "e" || chars[index] == "E") {
        text.append(chars[index])
        index += 1
        if index < chars.count, chars[index] == "-" || chars[index] == "+" {
          text.append(chars[index])
          index += 1
        }
        while index < chars.count, chars[index].isNumber {
          text.append(chars[index])
          index += 1
        }
      }
      return sawDigit ? Double(text) : nil
    }
  }
}
#endif
