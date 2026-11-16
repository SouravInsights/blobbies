// swift-tools-version: 6.0
import PackageDescription

// Blobbies for Swift.
//
// The manifest lives at the repository root so Swift Package Manager can resolve
// the package from the repo URL:
//
//   .package(url: "https://github.com/SouravInsights/blobbies.git", from: "0.4.0")
//
// The sources themselves live under `platforms/swift`, alongside the other
// platforms. No dependencies.
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
    .target(name: "Blobbies", path: "platforms/swift/Sources/Blobbies"),
    .executableTarget(
      name: "BlobbiesDemo",
      dependencies: ["Blobbies"],
      path: "platforms/swift/Demo"
    ),
    .testTarget(
      name: "BlobbiesTests",
      dependencies: ["Blobbies"],
      path: "platforms/swift/Tests/BlobbiesTests"
    ),
  ]
)
