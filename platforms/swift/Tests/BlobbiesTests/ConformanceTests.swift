import Foundation
import Testing
@testable import Blobbies

/// The Swift port is correct when it reproduces the JavaScript core's output
/// byte-for-byte. The fixture in `packages/core/fixtures/` is the contract.
@Suite("Conformance")
struct ConformanceTests {
  static let fixtureURL: URL = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent() // BlobbiesTests
    .deletingLastPathComponent() // Tests
    .deletingLastPathComponent() // swift
    .deletingLastPathComponent() // platforms
    .deletingLastPathComponent() // repo root
    .appendingPathComponent("packages/core/fixtures/avatar-conformance.json")

  @Test("reproduces every fixture case byte-for-byte")
  func reproducesEveryFixtureCase() throws {
    let data = try Data(contentsOf: Self.fixtureURL)
    guard let root = try JSONSerialization.jsonObject(with: data) as? [String: Any],
      let cases = root["cases"] as? [[String: Any]]
    else {
      Issue.record("fixture is not shaped as expected")
      return
    }
    #expect(cases.count >= 20)

    for testCase in cases {
      let id = testCase["id"] as? String ?? "?"
      let name = testCase["name"] as? String ?? ""
      let options = avatarOptions(from: testCase["options"] as? [String: Any] ?? [:])
      let expected = testCase["expected"] as? [String: Any] ?? [:]

      let body = renderAvatarBody(name, options)
      #expect(body.letters == expected["letters"] as? String, "letters for \(id)")
      #expect(body.prefix == expected["prefix"] as? String, "prefix for \(id)")
      #expect(body.body == expected["body"] as? String, "body for \(id)")
      #expect(renderAvatarSvg(name, options) == expected["svg"] as? String, "svg for \(id)")

      if let traits = expected["traits"] as? [String: Any] {
        #expect(body.traits.color == traits["color"] as? String, "color for \(id)")
        #expect(
          body.traits.shapeIndex == (traits["shapeIndex"] as? NSNumber)?.intValue,
          "shapeIndex for \(id)")
        #expect(
          body.traits.mouthIndex == (traits["mouthIndex"] as? NSNumber)?.intValue,
          "mouthIndex for \(id)")
        #expect(body.traits.cheeks == (traits["cheeks"] as? Bool), "cheeks for \(id)")
        #expect(
          body.traits.backdropDir == (traits["backdropDir"] as? NSNumber)?.intValue,
          "backdropDir for \(id)")
        #expect(
          close(body.traits.rotate, (traits["rotate"] as? NSNumber)?.doubleValue),
          "rotate for \(id)")
        #expect(
          close(body.traits.offsetX, (traits["offsetX"] as? NSNumber)?.doubleValue),
          "offsetX for \(id)")
        #expect(
          close(body.traits.offsetY, (traits["offsetY"] as? NSNumber)?.doubleValue),
          "offsetY for \(id)")
      }

      if let blink = expected["blink"] as? [String: Any] {
        #expect(
          body.blink.interval == (blink["interval"] as? NSNumber)?.doubleValue,
          "interval for \(id)")
        #expect(
          body.blink.delay == (blink["delay"] as? NSNumber)?.doubleValue,
          "delay for \(id)")
        #expect(body.blink.double == (blink["double"] as? Bool), "double for \(id)")
      }
    }
  }

  @Test("getInitials follows the documented rules")
  func initialsFollowTheRules() {
    #expect(getInitials("Sourav Nanda") == "SN")
    #expect(getInitials("Ira") == "IR")
    #expect(getInitials("@souravinsights") == "SO")
    #expect(getInitials("") == "?")
    #expect(getInitials("   ") == "?")
  }
}

/// The rendered bytes are the contract; raw trait doubles only need to agree
/// to floating-point tolerance, since a 1-ULP difference never survives rounding
/// into the SVG.
func close(_ a: Double?, _ b: Double?) -> Bool {
  guard let a, let b else { return a == nil && b == nil }
  return abs(a - b) < 1e-9
}

func avatarOptions(from json: [String: Any]) -> AvatarOptions {
  var options = AvatarOptions()
  options.color = json["color"] as? String
  options.shape = json["shape"] as? String
  options.expression = json["expression"] as? String
  options.blush = json["blush"] as? Bool
  options.tilt = (json["tilt"] as? NSNumber)?.doubleValue
  options.size = (json["size"] as? NSNumber)?.doubleValue
  options.rounded = (json["rounded"] as? Bool) ?? false
  options.className = json["className"] as? String
  options.title = (json["title"] as? Bool) ?? false
  options.palette = json["palette"] as? [String]
  options.variant = (json["variant"] as? NSNumber)?.intValue
  options.animate = json["animate"] as? String
  options.blink = json["blink"] as? Bool
  return options
}
