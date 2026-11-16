#if canImport(SwiftUI)
import SwiftUI
import Testing
@testable import Blobbies

@Suite("SVG path")
struct SVGPathTests {
  @Test("parses every glyph and gives a sane bounding box")
  func parsesEveryGlyph() {
    for (char, d) in BlobData.letters {
      let box = SVGPathParser.path(from: d).boundingRect
      #expect(box.width >= 0, "width for \(char)")
      #expect(box.height > 0, "height for \(char)")
      #expect(box.minX > -3 && box.maxX < 27, "x range for \(char): \(box)")
      #expect(box.minY > -3 && box.maxY < 27, "y range for \(char): \(box)")
    }
  }

  @Test("handles arcs and quadratics")
  func handlesArcsAndQuadratics() {
    let arc = SVGPathParser.path(from: "M12 2 A8 10 0 1 0 12 22 A8 10 0 1 0 12 2")
    #expect(arc.boundingRect.width > 10)
    #expect(arc.boundingRect.height > 15)

    let quad = SVGPathParser.path(from: "M-6.5 1 Q0 4.5 6.5 1")
    #expect(quad.boundingRect.width > 12)
  }
}
#endif
