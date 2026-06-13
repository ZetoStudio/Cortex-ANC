import { getValidAccessToken } from '../auth/connected-accounts';

export type LiveGitHubCommit = {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
  repo: string;
};

export type LiveGitHubPr = {
  number: number;
  title: string;
  repo: string;
  author: string;
  url: string;
  createdAt: string;
};

function ghHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/** Live GitHub: recent commits + open PRs across connected repos. */
export async function fetchLiveGitHubContext(tenantId: string): Promise<string> {
  const token = await getValidAccessToken('github', tenantId);
  if (!token) return '';

  const headers = ghHeaders(token);
  const lines: string[] = [];

  try {
    const reposRes = await fetch(
      'https://api.github.com/user/repos?per_page=15&sort=pushed&affiliation=owner,collaborator,organization_member',
      { headers, signal: AbortSignal.timeout(12_000) },
    );
    if (!reposRes.ok) return '';

    const repos = (await reposRes.json()) as Array<{ full_name: string; pushed_at?: string }>;
    if (!repos.length) return '';

    lines.push(`Connected GitHub — ${repos.length} repos accessible.`);

    // Latest commit across top 5 recently pushed repos
    const commits: LiveGitHubCommit[] = [];
    for (const repo of repos.slice(0, 5)) {
      const res = await fetch(`https://api.github.com/repos/${repo.full_name}/commits?per_page=3`, {
        headers,
        signal: AbortSignal.timeout(8_000),
      });
      if (!res.ok) continue;
      const items = (await res.json()) as Array<{
        sha: string;
        html_url: string;
        commit: { message: string; author?: { name?: string; date?: string } };
      }>;
      for (const c of items) {
        commits.push({
          sha: c.sha.slice(0, 7),
          message: c.commit.message.split('\n')[0] ?? 'Commit',
          author: c.commit.author?.name ?? 'Unknown',
          date: c.commit.author?.date ?? '',
          url: c.html_url,
          repo: repo.full_name,
        });
      }
    }

    commits.sort((a, b) => (b.date > a.date ? 1 : -1));
    if (commits.length) {
      lines.push('\nMOST RECENT COMMITS (live):');
      for (const [i, c] of commits.slice(0, 5).entries()) {
        lines.push(
          `[github] ${i === 0 ? 'LATEST' : `#${i + 1}`} | ${c.repo} | ${c.date} | ${c.author}\n"${c.message}" (${c.sha})`,
        );
      }
    }

    // Open PRs across top 10 repos
    const openPrs: LiveGitHubPr[] = [];
    for (const repo of repos.slice(0, 10)) {
      const res = await fetch(
        `https://api.github.com/repos/${repo.full_name}/pulls?state=open&per_page=10&sort=updated`,
        { headers, signal: AbortSignal.timeout(8_000) },
      );
      if (!res.ok) continue;
      const prs = (await res.json()) as Array<{
        number: number;
        title: string;
        html_url: string;
        created_at: string;
        user?: { login?: string };
      }>;
      for (const pr of prs) {
        openPrs.push({
          number: pr.number,
          title: pr.title,
          repo: repo.full_name,
          author: pr.user?.login ?? 'Unknown',
          url: pr.html_url,
          createdAt: pr.created_at,
        });
      }
    }

    openPrs.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));
    lines.push(`\nOPEN PULL REQUESTS (live, ${openPrs.length} total):`);
    if (openPrs.length === 0) {
      lines.push('[github] No open PRs found across your repos.');
    } else {
      for (const pr of openPrs.slice(0, 15)) {
        lines.push(
          `[github] PR #${pr.number} | ${pr.repo} | ${pr.author} | ${pr.createdAt}\n"${pr.title}"`,
        );
      }
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}
