// swift-tools-version: 6.0
import PackageDescription

// Blobbies for Swift. The deterministic decisions, ported; the drawing, ported;
// and a conformance test that proves the output matches the JavaScript core
// byte-for-byte. No dependencies.
let package = Package(
  name: "Blobbies",
  platforms: [
    .iOS(.v15),
    .macOS(.v12),
    .tvOS(.v15),
    .watchOS(.v8),
    .visionOS(.v1),
  ],
  products: [
    .library(name: "Blobbies", targets: ["Blobbies"]),
  ],
  targets: [
    .target(name: "Blobbies"),
    .testTarget(name: "BlobbiesTests", dependencies: ["Blobbies"]),
  ]
)
