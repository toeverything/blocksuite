import { assertExists } from '@blocksuite/global/utils';
import { nothing } from 'lit';

import { queryUrlDataFromAffineWorker } from '../bookmark-block/utils.js';
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

export type QueryUrlData = (
  embedGithubModel: EmbedGithubModel
) => Promise<Partial<EmbedGithubBlockUrlData>>;

export async function queryEmbedGithubData(
  embedGithubModel: EmbedGithubModel
): Promise<Partial<EmbedGithubBlockUrlData>> {
  const { owner, repo, type, githubId, url } = embedGithubModel;
  let urlData: Partial<EmbedGithubBlockUrlData> = {};

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/${
    type === 'issue' ? 'issues' : 'pulls'
  }/${githubId}`;

  const githubApiResponse = await fetch(apiUrl).catch(() => null);
  if (githubApiResponse && githubApiResponse.ok) {
    const githubApiData = await githubApiResponse.json();
    const { state, state_reason, draft, merged, created_at, assignees } =
      githubApiData;
    const assigneeLogins = assignees.map(
      (assignee: { login: string }) => assignee.login
    );
    let status = state;
    if (merged) {
      status = 'merged';
    } else if (state === 'open' && draft) {
      status = 'draft';
    }
    urlData = {
      status,
      statusReason: state_reason,
      createdAt: created_at,
      assignees: assigneeLogins,
    };
  }

  const linkResponseData = await queryUrlDataFromAffineWorker(url);
  urlData = { ...urlData, ...linkResponseData };

  return urlData;
}

// Result is boolean used to record whether the meta data is crawled
export async function refreshEmbedGithubUrlData(
  embedGithubElement: EmbedGithubBlockComponent
) {
  embedGithubElement.loading = true;

  const queryUrlData = embedGithubElement.service?.queryUrlData;
  assertExists(queryUrlData);

  const metaData = await queryUrlData(embedGithubElement.model);
  const {
    image = null,
    status = null,
    statusReason = null,
    title = null,
    description = null,
    createdAt = null,
    assignees = null,
  } = metaData;

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
