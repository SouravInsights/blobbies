import Foundation

/// Data shapes emitted from `manifest.json`. Nothing here is hand-maintained.
public struct ShapeGeometry: Sendable {
  public let name: String
  public let rx: Double
  public let ry: Double
  public let eb: Double
}

/// An eye nudge, in viewBox units — a side-eye or a glance.
public struct EyeShift: Sendable {
  public let x: Double
  public let y: Double
}

/// A mouth is one of four primitive kinds. Which one is data from the core.
public enum Mouth: Sendable {
  case half(rx: Double, ry: Double, tongue: Bool)
  case circle(dx: Double, dy: Double, r: Double)
  case ellipse(dx: Double, dy: Double, rx: Double, ry: Double)
  case stroke(d: String, width: Double, tongue: Bool)
}

/// A mood: a mouth plus the brows that carry the feeling.
public struct Expression: Sendable {
  public let key: String
  public let name: String
  public let mouth: Mouth
  public let brow: String
  public let eye: EyeShift?
  public let squint: String?
}

/// The fixed layout of the 100×100 viewBox.
public struct Layout: Sendable {
  public struct Backdrop: Sendable { public let cx, cy, r: Double }
  public struct Blob: Sendable { public let cx, bottom: Double }
  public struct Eyes: Sendable { public let cx, cy, scale, visualGap: Double }
  public struct Mouth: Sendable { public let cx, cy: Double }
  public struct Cheek: Sendable { public let cx, cy, rx, ry: Double }

  public let backdrop: Backdrop
  public let blob: Blob
  public let eyes: Eyes
  public let mouth: Mouth
  public let cheeks: [Cheek]
}

/// Every seeded decision behind a face — the portable record.
public struct BlobTraits: Sendable, Equatable {
  public var color: String
  public var shapeIndex: Int
  public var rotate: Double
  public var offsetX: Double
  public var offsetY: Double
  public var mouthIndex: Int
  public var cheeks: Bool
  public var backdropDir: Int
}

public struct Blink: Sendable, Equatable {
  public var enabled: Bool
  public var interval: Double
  public var delay: Double
  public var double: Bool
}

public struct ResolvedAvatar: Sendable {
  public let name: String
  public let letters: String
  public let prefix: String
  public let traits: BlobTraits
  /// Inner markup (layers + optional scoped blink style) for a wrapper that
  /// owns the outer `<svg>`.
  public let body: String
  public let blink: Blink
}

/// The options a caller can pass. The fields mirror `AvatarOptions` in the
/// TypeScript core; `animate` is the string form (`"all"`, `"blink"`,
/// `"follow"`).
public struct AvatarOptions: Sendable {
  public var color: String?
  public var shape: String?
  public var expression: String?
  public var blush: Bool?
  public var tilt: Double?
  public var size: Double?
  public var rounded: Bool
  public var className: String?
  public var title: Bool
  public var palette: [String]?
  public var variant: Int?
  public var animate: String?
  public var blink: Bool?
  public var blinkInterval: (Double, Double)?
  public var follow: Bool?
  public var followRange: Double?
  public var smoothing: Double?
  public var idleTimeout: Double?
  public var paused: Bool?
  public var respectReducedMotion: Bool?
  public var wink: Bool?
  public var glance: Bool?
  public var surprise: Bool?

  public init(
    color: String? = nil,
    shape: String? = nil,
    expression: String? = nil,
    blush: Bool? = nil,
    tilt: Double? = nil,
    size: Double? = nil,
    rounded: Bool = false,
    className: String? = nil,
    title: Bool = false,
    palette: [String]? = nil,
    variant: Int? = nil,
    animate: String? = nil,
    blink: Bool? = nil,
    blinkInterval: (Double, Double)? = nil,
    follow: Bool? = nil,
    followRange: Double? = nil,
    smoothing: Double? = nil,
    idleTimeout: Double? = nil,
    paused: Bool? = nil,
    respectReducedMotion: Bool? = nil,
    wink: Bool? = nil,
    glance: Bool? = nil,
    surprise: Bool? = nil
  ) {
    self.color = color
    self.shape = shape
    self.expression = expression
    self.blush = blush
    self.tilt = tilt
    self.size = size
    self.rounded = rounded
    self.className = className
    self.title = title
    self.palette = palette
    self.variant = variant
    self.animate = animate
    self.blink = blink
    self.blinkInterval = blinkInterval
    self.follow = follow
    self.followRange = followRange
    self.smoothing = smoothing
    self.idleTimeout = idleTimeout
    self.paused = paused
    self.respectReducedMotion = respectReducedMotion
    self.wink = wink
    self.glance = glance
    self.surprise = surprise
  }
}
