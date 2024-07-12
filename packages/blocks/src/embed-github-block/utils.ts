import { assertExists } from '@blocksuite/global/utils';
import { nothing } from 'lit';

import type { LinkPreviewer } from '../_common/embed-block-helper/index.js';
import type { EmbedGithubBlockComponent } from './embed-github-block.js';
import type {
  EmbedGithubBlockUrlData,
  EmbedGithubModel,
} from './embed-github-model.js';

import { isAbortError } from '../_common/utils/helper.js';
import {
  GithubIssueClosedFailureIcon,
  GithubIssueClosedSuccessIcon,
  GithubIssueOpenIcon,
  GithubPRClosedIcon,
  GithubPRDraftIcon,
  GithubPRMergedIcon,
  GithubPROpenIcon,
} from './styles.js';

export async function queryEmbedGithubData(
  embedGithubModel: EmbedGithubModel,
  linkPreviewer: LinkPreviewer,
  signal?: AbortSignal
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const [githubApiData, openGraphData] = await Promise.all([
    queryEmbedGithubApiData(embedGithubModel, signal),
    linkPreviewer.query(embedGithubModel.url, signal),
  ]);
  return { ...githubApiData, ...openGraphData };
}

export async function queryEmbedGithubApiData(
  embedGithubModel: EmbedGithubModel,
  signal?: AbortSignal
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const { githubId, githubType, owner, repo } = embedGithubModel;
  let githubApiData: Partial<EmbedGithubBlockUrlData> = {};

  // github's public api has a rate limit of 60 requests per hour
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/${
    githubType === 'issue' ? 'issues' : 'pulls'
  }/${githubId}`;

  const githubApiResponse = await fetch(apiUrl, {
    cache: 'no-cache',
    signal,
  }).catch(() => null);

  if (githubApiResponse && githubApiResponse.ok) {
    const githubApiJson = await githubApiResponse.json();
    const { assignees, created_at, draft, merged, state, state_reason } =
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
      assignees: assigneeLogins,
      createdAt: created_at,
      status,
      statusReason: state_reason,
    };
  }

  return githubApiData;
}

export async function refreshEmbedGithubUrlData(
  embedGithubElement: EmbedGithubBlockComponent,
  signal?: AbortSignal
): Promise<void> {
  let image = null,
    status = null,
    statusReason = null,
    title = null,
    description = null,
    createdAt = null,
    assignees = null;

  try {
    embedGithubElement.loading = true;

    const queryUrlData = embedGithubElement.service?.queryUrlData;
    assertExists(queryUrlData);

    const githubUrlData = await queryUrlData(embedGithubElement.model);
    ({
      assignees = null,
      createdAt = null,
      description = null,
      image = null,
      status = null,
      statusReason = null,
      title = null,
    } = githubUrlData);

    if (signal?.aborted) return;

    embedGithubElement.doc.updateBlock(embedGithubElement.model, {
      assignees,
      createdAt,
      description,
      image,
      status,
      statusReason,
      title,
    });
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return;
    throw Error;
  } finally {
    embedGithubElement.loading = false;
  }
}

export async function refreshEmbedGithubStatus(
  embedGithubElement: EmbedGithubBlockComponent,
  signal?: AbortSignal
) {
  const queryApiData = embedGithubElement.service?.queryApiData;
  assertExists(queryApiData);
  const githubApiData = await queryApiData(embedGithubElement.model, signal);

  if (!githubApiData.status || signal?.aborted) return;

  embedGithubElement.doc.updateBlock(embedGithubElement.model, {
    assignees: githubApiData.assignees,
    createdAt: githubApiData.createdAt,
    status: githubApiData.status,
    statusReason: githubApiData.statusReason,
  });
}

export function getGithubStatusIcon(
  type: 'issue' | 'pr',
  status: string,
  statusReason: null | string
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
