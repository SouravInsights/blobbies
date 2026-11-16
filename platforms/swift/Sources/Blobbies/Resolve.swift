import Foundation

func shapeIndexOf(_ name: String?) -> Int {
  guard let name else { return -1 }
  return BlobData.shapes.firstIndex { $0.name == name } ?? -1
}

func expressionIndexOf(_ key: String?) -> Int {
  guard let key else { return -1 }
  return BlobData.expressions.firstIndex { $0.key == key } ?? -1
}

func expression(at index: Int) -> Expression {
  let n = BlobData.expressions.count
  return BlobData.expressions[((index % n) + n) % n]
}

/// Resolve every seeded decision for a name. Pure and deterministic.
func decideTraits(_ rng: inout Rng, _ palette: [String]) -> BlobTraits {
  let color = palette[Int((rng.next() * Double(palette.count)).rounded(.down)) % palette.count]
  let shapeIndex = Int((rng.next() * Double(BlobData.shapes.count)).rounded(.down))
  let rotate = range(&rng, -3, 3)
  let offsetX = range(&rng, -1, 1)
  let offsetY = range(&rng, -0.35, 0.35)
  let mouthIndex = Int((rng.next() * Double(BlobData.expressions.count)).rounded(.down))
  let cheeks = rng.next() < 0.5
  let backdropDir = Int((rng.next() * 4).rounded(.down))
  return BlobTraits(
    color: color,
    shapeIndex: shapeIndex,
    rotate: rotate,
    offsetX: offsetX,
    offsetY: offsetY,
    mouthIndex: mouthIndex,
    cheeks: cheeks,
    backdropDir: backdropDir
  )
}

/// Apply an explicit look over the seeded traits. Only the fields the look sets
/// change; everything else keeps its seeded value.
public func applyLook(_ base: BlobTraits, _ overrides: AvatarOptions) -> BlobTraits {
  var traits = base
  if let color = overrides.color { traits.color = color }
  let shape = shapeIndexOf(overrides.shape)
  if shape >= 0 { traits.shapeIndex = shape }
  if let tilt = overrides.tilt { traits.rotate = max(-8, min(8, tilt)) }
  let mouth = expressionIndexOf(overrides.expression)
  if mouth >= 0 { traits.mouthIndex = mouth }
  if let blush = overrides.blush { traits.cheeks = blush }
  return traits
}

/// The whole decision pipeline, pure and deterministic.
public func resolveAvatar(_ name: String, _ options: AvatarOptions = AvatarOptions()) -> ResolvedAvatar {
  let safeName = name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? "?" : name
  let variant = options.variant ?? 0
  let seed = variant == 0 ? safeName : "\(safeName)#\(variant)"
  let letters = getInitials(safeName)
  let prefix = "bb-" + String(hashString(seed), radix: 36)

  var rng = createRng(seed)
  let palette: [String]
  if let provided = options.palette, !provided.isEmpty {
    palette = provided
  } else {
    palette = BlobData.palette
  }

  let seeded = decideTraits(&rng, palette)
  let traits = applyLook(seeded, options)

  let blinkRange = options.blinkInterval ?? (2500.0, 6000.0)
  let interval = roundTo(blinkRange.0 + rng.next() * max(0, blinkRange.1 - blinkRange.0))
  let delay = roundTo(rng.next() * interval)
  let double = rng.next() < 0.25

  let clipId = "\(prefix)-c"
  let body =
    renderDiskClip(clipId)
    + renderBackdrop(traits.backdropDir)
    + renderBlob(traits, clipId)
    + renderEyes(letters, traits.mouthIndex)
    + renderBrows(traits.mouthIndex, letters)
    + renderMouth(traits.mouthIndex)

  return ResolvedAvatar(
    name: safeName,
    letters: letters,
    prefix: prefix,
    traits: traits,
    body: body,
    blink: Blink(enabled: false, interval: interval, delay: delay, double: double)
  )
}
