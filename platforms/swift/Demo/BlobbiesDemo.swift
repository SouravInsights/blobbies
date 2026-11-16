#if os(macOS) || os(iOS)
import SwiftUI
import Blobbies

/// A tiny SwiftUI app for eyeballing the avatars on a real screen.
///
///     swift run BlobbiesDemo
///
/// Opens a window with a grid of avatars, all blinking. Change the names or the
/// options to see how the looks differ.
@main
struct BlobbiesDemoApp: App {
  var body: some Scene {
    WindowGroup {
      DemoGrid()
    }
  }
}

private struct DemoGrid: View {
  private let names = [
    "Sourav Nanda",
    "Ira",
    "Ada Lovelace",
    "Grace Hopper",
    "田中太郎",
    "😀",
    "",
    "Zed 9",
  ]

  private let expressions = ["smile", "smirk", "wink", "angry", "cat", "shy"]

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 28) {
        Text("Blobbies")
          .font(.largeTitle.bold())

        Text("Same name, same avatar — drawn natively with Canvas.")
          .foregroundStyle(.secondary)

        LazyVGrid(columns: [GridItem(.adaptive(minimum: 108), spacing: 20)], spacing: 24) {
          ForEach(names, id: \.self) { name in
            VStack(spacing: 8) {
              BlobbiesAvatar(name, AvatarOptions(size: 96, animate: "blink"))
              Text(name.isEmpty ? "(empty)" : name)
                .font(.caption)
                .lineLimit(1)
            }
          }
        }

        Text("Moods")
          .font(.headline)

        LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), spacing: 16)], spacing: 20) {
          ForEach(expressions, id: \.self) { expression in
            VStack(spacing: 8) {
              BlobbiesAvatar(
                "Ira",
                AvatarOptions(expression: expression, size: 72, animate: "blink")
              )
              Text(expression).font(.caption)
            }
          }
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      .padding(32)
    }
    .frame(minWidth: 480, minHeight: 520)
  }
}
#endif
