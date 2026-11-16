import Foundation

/// The two "eye" characters for a name.
///
/// Same rules as the core: the first letters of the first and last word, or the
/// first two letters of a single word. Punctuation and emoji are skipped;
/// non-Latin letters are kept. Swift strings are grapheme-clustered already,
/// which is what `Intl.Segmenter` was doing on the web.
public func getInitials(_ name: String) -> String {
  let words = name
    .precomposedStringWithCanonicalMapping
    .split(whereSeparator: { $0.isWhitespace })
    .map(String.init)

  guard !words.isEmpty else { return "?" }

  func firstMeaningful(_ word: String) -> Character? {
    word.first { $0.isLetter || $0.isNumber }
  }

  var heads: [Character] = []
  for word in words {
    if let head = firstMeaningful(word) { heads.append(head) }
  }
  guard !heads.isEmpty else { return "?" }

  let raw: String
  if heads.count >= 2 {
    raw = String(heads[0]) + String(heads[heads.count - 1])
  } else {
    let only = words.first { firstMeaningful($0) != nil } ?? ""
    raw = String(only.filter { $0.isLetter || $0.isNumber }.prefix(2))
  }

  let upper = raw.uppercased()
  return upper.isEmpty ? "?" : upper
}
