export async function listContacts(accessToken: string, pageSize = 100) {
  const res = await fetch(
    `https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses&pageSize=${pageSize}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Contacts list failed: ${res.status}`);
  return res.json();
}
