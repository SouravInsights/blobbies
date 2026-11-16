import Foundation

/// The blink keyframes, shared with the web and React Native.
///
/// These are the exact numbers in the core's `buildBlinkStyle`:
///
///   single:  0%,92%,100% → scaleY(1);  95% → scaleY(.1)
///   double:  0%,72%,100% → scaleY(1);  75% → scaleY(.1); 78% → scaleY(1); 81% → scaleY(.1)
///
/// with the CSS `ease-in-out` curve, an initial `delay`, and a repeat every
/// `interval`. Every platform reimplements these; none invents its own.
enum BlinkAnimation {
  static let single: [(phase: Double, scaleY: Double)] = [
    (0, 1), (0.92, 1), (0.95, 0.1), (1, 1),
  ]

  static let double: [(phase: Double, scaleY: Double)] = [
    (0, 1), (0.72, 1), (0.75, 0.1), (0.78, 1), (0.81, 0.1), (1, 1),
  ]

  static func keyframes(isDouble: Bool) -> [(phase: Double, scaleY: Double)] {
    isDouble ? double : single
  }

  /// CSS `ease-in-out` = cubic-bezier(0.42, 0, 0.58, 1).
  static func easeInOut(_ x: Double) -> Double {
    let x1 = 0.42, y1 = 0.0, x2 = 0.58, y2 = 1.0
    let cx = 3 * x1
    let bx = 3 * (x2 - x1) - cx
    let ax = 1 - cx - bx
    let cy = 3 * y1
    let by = 3 * (y2 - y1) - cy
    let ay = 1 - cy - by

    func sampleX(_ t: Double) -> Double { ((ax * t + bx) * t + cx) * t }
    func sampleY(_ t: Double) -> Double { ((ay * t + by) * t + cy) * t }
    func sampleDX(_ t: Double) -> Double { (3 * ax * t + 2 * bx) * t + cx }

    var t = x
    for _ in 0..<8 {
      let d = sampleDX(t)
      if abs(d) < 1e-6 { break }
      t -= (sampleX(t) - x) / d
    }
    t = min(1, max(0, t))
    return sampleY(t)
  }

  /// The eye scale at a point in the cycle, `0 <= phase <= 1`.
  static func scale(atPhase phase: Double, isDouble: Bool) -> Double {
    let frames = keyframes(isDouble: isDouble)
    for i in 0..<(frames.count - 1) {
      let p0 = frames[i]
      let p1 = frames[i + 1]
      if phase <= p1.phase {
        let local = p1.phase == p0.phase ? 1 : (phase - p0.phase) / (p1.phase - p0.phase)
        return p0.scaleY + (p1.scaleY - p0.scaleY) * easeInOut(local)
      }
    }
    return 1
  }

  /// The eye scale given seconds since the avatar appeared.
  static func scale(elapsed: Double, blink: Blink) -> Double {
    let delay = blink.delay / 1000
    if elapsed < delay { return 1 }
    let interval = max(0.4, blink.interval / 1000)
    let sinceStart = elapsed - delay
    let phase = sinceStart.truncatingRemainder(dividingBy: interval) / interval
    return scale(atPhase: phase, isDouble: blink.double)
  }
}
