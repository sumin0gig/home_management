import SwiftUI
import WidgetKit

// NOTE: this file belongs to a WidgetKit extension target that does not
// exist yet in the Xcode project — it must be added manually (Xcode ->
// File -> New -> Target -> Widget Extension). See the iOS widget setup
// steps for the full walkthrough.

private let appGroupId = "group.com.homemanagement.widget"
private let storageKey = "ChoreWidget.topChores"
private let choreListDeepLink = URL(string: "homemanagement://chores")

struct ChoreItem: Codable, Identifiable {
  let id: String
  let title: String
  let dueLabel: String
}

struct ChoreEntry: TimelineEntry {
  let date: Date
  let chores: [ChoreItem]
}

struct ChoreProvider: TimelineProvider {
  func placeholder(in context: Context) -> ChoreEntry {
    ChoreEntry(
      date: Date(),
      chores: [ChoreItem(id: "placeholder", title: "화장실 청소", dueLabel: "오늘")]
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (ChoreEntry) -> Void) {
    completion(ChoreEntry(date: Date(), chores: loadChores()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<ChoreEntry>) -> Void) {
    let entry = ChoreEntry(date: Date(), chores: loadChores())
    // The app pushes a fresh snapshot (and calls reloadAllTimelines) whenever
    // chores change, so the widget doesn't need to poll on its own.
    completion(Timeline(entries: [entry], policy: .never))
  }

  private func loadChores() -> [ChoreItem] {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let json = defaults.string(forKey: storageKey),
      let data = json.data(using: .utf8),
      let chores = try? JSONDecoder().decode([ChoreItem].self, from: data)
    else {
      return []
    }
    return chores
  }
}

struct HomeManagementWidgetView: View {
  var entry: ChoreEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("할 일")
        .font(.caption)
        .foregroundStyle(.secondary)

      if entry.chores.isEmpty {
        Text("모든 집안일을 완료했어요")
          .font(.footnote)
      } else {
        ForEach(entry.chores) { chore in
          VStack(alignment: .leading, spacing: 1) {
            Text(chore.title)
              .font(.subheadline)
              .fontWeight(.semibold)
              .lineLimit(1)
            Text(chore.dueLabel)
              .font(.caption2)
              .foregroundStyle(.tint)
          }
        }
      }
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(choreListDeepLink)
  }
}

struct HomeManagementWidget: Widget {
  let kind: String = "HomeManagementWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: ChoreProvider()) { entry in
      HomeManagementWidgetView(entry: entry)
    }
    .configurationDisplayName("집안일")
    .description("가장 빨리 해야 하는 집안일 3개를 보여줍니다.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
