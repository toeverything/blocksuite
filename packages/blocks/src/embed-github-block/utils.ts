import { assertExists } from '@blocksuite/global/utils';
import { nothing } from 'lit';

import { queryLinkPreview } from '../_common/embed-block-helper/index.js';
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

export async function queryEmbedGithubData(
  embedGithubModel: EmbedGithubModel
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const [githubApiData, openGraphData] = await Promise.all([
    queryEmbedGithubApiData(embedGithubModel),
    queryLinkPreview(embedGithubModel.url),
  ]);
  return { ...githubApiData, ...openGraphData };
}

export async function queryEmbedGithubApiData(
  embedGithubModel: EmbedGithubModel
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const { owner, repo, githubType, githubId } = embedGithubModel;
  let githubApiData: Partial<EmbedGithubBlockUrlData> = {};

  // github's public api has a rate limit of 60 requests per hour
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/${
    githubType === 'issue' ? 'issues' : 'pulls'
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
