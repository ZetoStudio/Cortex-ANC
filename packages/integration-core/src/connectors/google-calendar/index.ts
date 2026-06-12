export async function listEvents(accessToken: string, timeMin: string, timeMax: string) {
  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100',
  });
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Calendar list failed: ${res.status}`);
  return res.json();
}

export async function getUpcomingEvents(accessToken: string, days = 30) {
  const now = new Date();
  const end = new Date(now.getTime() + days * 86400000);
  return listEvents(accessToken, now.toISOString(), end.toISOString());
}
