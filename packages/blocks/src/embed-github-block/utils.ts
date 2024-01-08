import { assertExists } from '@blocksuite/global/utils';
import { nothing } from 'lit';

import type { EmbedGithubBlockComponent } from './embed-github-block.js';
import type {
  EmbedGithubBlockUrlData,
  EmbedGithubModel,
} from './embed-github-model.js';
import {
  GithubIssueClosedFailureIcon,
  GithubIssueClosedSuccessIcon,
  GithubIssueOpenIcon,
  GithubPRClosedIcon,
  GithubPRDraftIcon,
  GithubPRMergedIcon,
  GithubPROpenIcon,
} from './styles.js';

interface AffineLinkPreviewResponseData {
  url: string;
  title?: string;
  siteName?: string;
  description?: string;
  images?: string[];
  mediaType?: string;
  contentType?: string;
  charset?: string;
  videos?: string[];
  favicons?: string[];
}

export async function queryEmbedGithubData(
  embedGithubModel: EmbedGithubModel
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const [githubApiData, openGraphData] = await Promise.all([
    queryEmbedGithubApiData(embedGithubModel),
    queryEmbedGithubOpenGraphData(embedGithubModel.url),
  ]);
  return { ...githubApiData, ...openGraphData };
}

export async function queryEmbedGithubApiData(
  embedGithubModel: EmbedGithubModel
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const { owner, repo, type, githubId } = embedGithubModel;
  let githubApiData: Partial<EmbedGithubBlockUrlData> = {};

  // github's public api has a rate limit of 60 requests per hour
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/${
    type === 'issue' ? 'issues' : 'pulls'
  }/${githubId}`;

  const githubApiResponse = await fetch(apiUrl, { cache: 'no-cache' }).catch(
    () => null
  );
  if (githubApiResponse && githubApiResponse.ok) {
    const githubApiJson = await githubApiResponse.json();
    const { state, state_reason, draft, merged, created_at, assignees } =
      githubApiJson;

    const assigneeLogins = assignees.map(
      (assignee: { login: string }) => assignee.login
    );

    let status = state;
    if (merged) {
      status = 'merged';
    } else if (state === 'open' && draft) {
      status = 'draft';
    }

    githubApiData = {
      status,
      statusReason: state_reason,
      createdAt: created_at,
      assignees: assigneeLogins,
    };
  }

  return githubApiData;
}

export async function queryEmbedGithubOpenGraphData(url: string) {
  const response = await fetch(
    'https://affine-worker.toeverything.workers.dev/api/worker/link-preview',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
      }),
    }
  ).catch(() => null);
  if (!response || !response.ok) return {};
  const data: AffineLinkPreviewResponseData = await response.json();
  return {
    title: getStringFromHTML(data.title ?? ''),
    description: getStringFromHTML(data.description ?? ''),
    icon: data.favicons?.[0],
    image: data.images?.[0],
  };
}

export async function refreshEmbedGithubUrlData(
  embedGithubElement: EmbedGithubBlockComponent
) {
  embedGithubElement.loading = true;

  const queryUrlData = embedGithubElement.service?.queryUrlData;
  assertExists(queryUrlData);
  const githubUrlData = await queryUrlData(embedGithubElement.model);

  const {
    image = null,
    status = null,
    statusReason = null,
    title = null,
    description = null,
    createdAt = null,
    assignees = null,
  } = githubUrlData;

  embedGithubElement.page.updateBlock(embedGithubElement.model, {
    image,
    status,
    statusReason,
    title,
    description,
    createdAt,
    assignees,
  });

  embedGithubElement.loading = false;
}

export async function refreshEmbedGithubStatus(
  embedGithubElement: EmbedGithubBlockComponent
) {
  const queryApiData = embedGithubElement.service?.queryApiData;
  assertExists(queryApiData);
  const githubApiData = await queryApiData(embedGithubElement.model);

  if (!githubApiData.status) return;

  embedGithubElement.page.updateBlock(embedGithubElement.model, {
    status: githubApiData.status,
  });
}

export function getGithubStatusIcon(
  type: 'issue' | 'pr',
  status: string,
  statusReason: string | null
) {
  if (type === 'issue') {
    if (status === 'open') {
      return GithubIssueOpenIcon;
    } else if (status === 'closed' && statusReason === 'completed') {
      return GithubIssueClosedSuccessIcon;
    } else if (status === 'closed' && statusReason === 'not_planned') {
      return GithubIssueClosedFailureIcon;
    } else {
      return nothing;
    }
  } else if (type === 'pr') {
    if (status === 'open') {
      return GithubPROpenIcon;
    } else if (status === 'draft') {
      return GithubPRDraftIcon;
    } else if (status === 'merged') {
      return GithubPRMergedIcon;
    } else if (status === 'closed') {
      return GithubPRClosedIcon;
    }
  }
  return nothing;
}

function getStringFromHTML(html: string) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}
