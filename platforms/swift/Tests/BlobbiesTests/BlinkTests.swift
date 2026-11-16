import Testing
@testable import Blobbies

/// The Swift blink must match the web's CSS keyframes exactly.
@Suite("Blink")
struct BlinkTests {
  @Test("single: open until 92%, dip to 0.1 at 95%, back at 100%")
  func single() {
    #expect(BlinkAnimation.scale(atPhase: 0, isDouble: false) == 1)
    #expect(BlinkAnimation.scale(atPhase: 0.5, isDouble: false) == 1)
    #expect(BlinkAnimation.scale(atPhase: 0.92, isDouble: false) == 1)
    #expect(abs(BlinkAnimation.scale(atPhase: 0.95, isDouble: false) - 0.1) < 1e-3)
    #expect(abs(BlinkAnimation.scale(atPhase: 1, isDouble: false) - 1) < 1e-3)
  }

  @Test("double: dips at 75% and 81%, open at 78%")
  func double() {
    #expect(abs(BlinkAnimation.scale(atPhase: 0.75, isDouble: true) - 0.1) < 1e-3)
    #expect(abs(BlinkAnimation.scale(atPhase: 0.78, isDouble: true) - 1) < 1e-3)
    #expect(abs(BlinkAnimation.scale(atPhase: 0.81, isDouble: true) - 0.1) < 1e-3)
  }
}
