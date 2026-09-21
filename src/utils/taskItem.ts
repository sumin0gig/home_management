// TaskItem.content는 문자열 하나뿐이라, 첫 줄은 제목 나머지 줄은 설명으로 나눠서 쓴다.
export function splitTaskItemContent(content: string): {
  title: string;
  description: string | null;
} {
  const [firstLine, ...rest] = content.trim().split(/\r?\n/);
  const description = rest.join('\n').trim();
  return {
    title: firstLine.trim(),
    description: description.length > 0 ? description : null,
  };
}
