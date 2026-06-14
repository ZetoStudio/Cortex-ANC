export async function listTaskLists(accessToken: string) {
  const res = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Tasks lists failed: ${res.status}`);
  return res.json();
}

export async function listTasks(accessToken: string, taskListId: string) {
  const res = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Tasks list failed: ${res.status}`);
  return res.json();
}
