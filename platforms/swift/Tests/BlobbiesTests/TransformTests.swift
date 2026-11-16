#if canImport(CoreGraphics)
import CoreGraphics
import Testing
@testable import Blobbies

/// `CGAffineTransform.concatenating` composes receiver-first, which is the
/// opposite of SVG. These pin the two transforms that were wrong: the eye
/// positioning, and the blink origin.
@Suite("Transforms")
struct TransformTests {
  @Test("SVG order: the rightmost op applies first")
  func svgOrder() {
    // translate(10 0) scale(2) must scale first, then translate.
    let m = cgMatrix([.translate(x: 10, y: 0), .scale(x: 2, y: nil)])
    let p = CGPoint(x: 1, y: 0).applying(m)
    #expect(abs(p.x - 12) < 1e-9)
    #expect(abs(p.y) < 1e-9)
  }

  @Test("scaleYAbout keeps its centre fixed")
  func scaleAboutKeepsCentre() {
    let m = cgScaleYAbout(0.5, cx: 12, cy: 12)
    let centre = CGPoint(x: 12, y: 12).applying(m)
    #expect(abs(centre.x - 12) < 1e-9)
    #expect(abs(centre.y - 12) < 1e-9)
    // The bottom edge moves up toward the centre, which is what a blink is.
    let bottom = CGPoint(x: 12, y: 22).applying(m)
    #expect(abs(bottom.y - 17) < 1e-9)
  }
}
#endif
