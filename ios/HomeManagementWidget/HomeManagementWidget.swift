import SwiftUI
import WidgetKit

// NOTE: this file belongs to a WidgetKit extension target that does not
// exist yet in the Xcode project — it must be added manually (Xcode ->
// File -> New -> Target -> Widget Extension). See the iOS widget setup
// steps for the full walkthrough.

private let appGroupId = "group.com.homemanagement.widget"
private let storageKey = "TaskWidget.topTasks"
private let taskListDeepLink = URL(string: "homemanagement://tasks")

struct TaskItem: Codable, Identifiable {
  let id: String
  let title: String
  let dueLabel: String
}

struct TaskEntry: TimelineEntry {
  let date: Date
  let tasks: [TaskItem]
}

struct TaskProvider: TimelineProvider {
  func placeholder(in context: Context) -> TaskEntry {
    TaskEntry(
      date: Date(),
      tasks: [TaskItem(id: "placeholder", title: "화장실 청소", dueLabel: "오늘")]
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (TaskEntry) -> Void) {
    completion(TaskEntry(date: Date(), tasks: loadTasks()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<TaskEntry>) -> Void) {
    let entry = TaskEntry(date: Date(), tasks: loadTasks())
    // The app pushes a fresh snapshot (and calls reloadAllTimelines) whenever
    // tasks change, so the widget doesn't need to poll on its own.
    completion(Timeline(entries: [entry], policy: .never))
  }

  private func loadTasks() -> [TaskItem] {
    guard
      let defaults = UserDefaults(suiteName: appGroupId),
      let json = defaults.string(forKey: storageKey),
      let data = json.data(using: .utf8),
      let tasks = try? JSONDecoder().decode([TaskItem].self, from: data)
    else {
      return []
    }
    return tasks
  }
}

struct HomeManagementWidgetView: View {
  var entry: TaskEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("할 일")
        .font(.caption)
        .foregroundStyle(.secondary)

      if entry.tasks.isEmpty {
        Text("모든 집안일을 완료했어요")
          .font(.footnote)
      } else {
        ForEach(entry.tasks) { task in
          VStack(alignment: .leading, spacing: 1) {
            Text(task.title)
              .font(.subheadline)
              .fontWeight(.semibold)
              .lineLimit(1)
            Text(task.dueLabel)
              .font(.caption2)
              .foregroundStyle(.tint)
          }
        }
      }
    }
    .padding()
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(taskListDeepLink)
  }
}

struct HomeManagementWidget: Widget {
  let kind: String = "HomeManagementWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: TaskProvider()) { entry in
      HomeManagementWidgetView(entry: entry)
    }
    .configurationDisplayName("집안일")
    .description("가장 빨리 해야 하는 집안일 3개를 보여줍니다.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
