import Foundation

/// `Math.round` rounds half toward +∞; Swift's `rounded()` rounds half away
/// from zero. They differ on `-0.5`, so the port uses the JavaScript rule.
@inline(__always)
func jsMathRound(_ x: Double) -> Double {
  (x + 0.5).rounded(.down)
}

/// Matches the core's `round(value, decimals = 2)`.
func roundTo(_ value: Double, _ decimals: Int = 2) -> Double {
  let factor = pow(10.0, Double(decimals))
  return jsMathRound(value * factor) / factor
}

/// Matches JavaScript's `String(number)`: integers print without a trailing
/// `.0`, and `-0` prints as `0`. Everything else is the shortest round-trip
/// form, which Swift and JavaScript already agree on.
func jsNumber(_ x: Double) -> String {
  if x == 0 { return "0" }
  var s = String(x)
  if s.hasSuffix(".0") { s.removeLast(2) }
  return s
}

/// Round to two places and format the way JavaScript would.
@inline(__always)
func rs(_ x: Double) -> String { jsNumber(roundTo(x)) }
