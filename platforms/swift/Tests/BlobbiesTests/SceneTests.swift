import Foundation
import Testing
@testable import Blobbies

/// The scene is the shared draw tree the SwiftUI view renders. It must describe
/// exactly the same avatar as the string renderer, or the two would drift.
@Suite("Scene")
struct SceneTests {
  @Test("the scene serialises to the same body as the string renderer")
  func sceneMatchesTheStringRenderer() throws {
    let data = try Data(contentsOf: ConformanceTests.fixtureURL)
    let root = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    let cases = root?["cases"] as? [[String: Any]] ?? []
    #expect(cases.count >= 20)

    for testCase in cases {
      let id = testCase["id"] as? String ?? "?"
      let name = testCase["name"] as? String ?? ""
      let options = avatarOptions(from: testCase["options"] as? [String: Any] ?? [:])
      let scene = buildScene(name, options)
      let body = resolveAvatar(name, options).body
      #expect(serializeScene(scene) == body, "scene for \(id)")
    }
  }
}
