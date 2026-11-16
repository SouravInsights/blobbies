import Foundation

@inline(__always)
func imul(_ a: UInt32, _ b: UInt32) -> UInt32 { a &* b }

/// `cyrb53`, in 32-bit wrapping arithmetic. Iterating `utf16` (not Unicode
/// scalars) matches JavaScript's `charCodeAt`.
func cyrb53(_ str: String, _ seed: UInt32 = 0) -> UInt32 {
  var h1: UInt32 = 0xdeadbeef ^ seed
  var h2: UInt32 = 0x41c6ce57 ^ seed
  for unit in str.utf16 {
    let ch = UInt32(unit)
    h1 = imul(h1 ^ ch, 2654435761)
    h2 = imul(h2 ^ ch, 1597334677)
  }
  h1 = imul(h1 ^ (h1 >> 16), 2246822507)
  h1 ^= imul(h2 ^ (h2 >> 13), 3266489909)
  h2 = imul(h2 ^ (h2 >> 16), 2246822507)
  h2 ^= imul(h1 ^ (h1 >> 13), 3266489909)
  return h1
}

/// Matches `hashString`: `cyrb53(input, 0) >>> 0`, whose low 32 bits are `h1`.
public func hashString(_ input: String) -> UInt32 { cyrb53(input, 0) }

/// `mulberry32`, seeded. Returns floats in `[0, 1)`.
public struct Rng: Sendable {
  private var a: UInt32

  public init(seed: UInt32) { a = seed }

  public mutating func next() -> Double {
    a = a &+ 0x6d2b79f5
    var t = imul(a ^ (a >> 15), 1 | a)
    t = (t &+ imul(t ^ (t >> 7), 61 | t)) ^ t
    return Double(t ^ (t >> 14)) / 4294967296.0
  }
}

func createRng(_ input: String) -> Rng { Rng(seed: hashString(input)) }

func range(_ rng: inout Rng, _ min: Double, _ max: Double) -> Double {
  min + rng.next() * (max - min)
}
