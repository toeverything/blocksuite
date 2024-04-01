import {
  ApolloClient,
  gql,
  HttpLink,
  InMemoryCache,
  type NormalizedCacheObject,
} from '@apollo/client/core';

const GET_COPILOT_HISTORIES = gql`
  query getCopilotHistories(
    $workspaceId: String!
    $docId: String
    $options: QueryChatHistoriesInput
  ) {
    currentUser {
      copilot(workspaceId: $workspaceId) {
        histories(docId: $docId, options: $options) {
          sessionId
          tokens
          messages {
            role
            content
            attachments
            createdAt
          }
        }
      }
    }
  }
`;

const GET_ANONYMOUS_COPILOT_HISTORIES = gql`
  query getCopilotAnonymousHistories(
    $workspaceId: String!
    $docId: String
    $options: QueryChatHistoriesInput
  ) {
    copilotAnonymous(workspaceId: $workspaceId) {
      histories(docId: $docId, options: $options) {
        sessionId
        tokens
        messages {
          role
          content
          attachments
          createdAt
        }
      }
    }
  }
`;

const GET_COPILOT_SESSIONS = gql`
  query getCopilotSessions($workspaceId: String!) {
    currentUser {
      copilot(workspaceId: $workspaceId) {
        chats
        actions
      }
    }
  }
`;

const GET_ANONYMOUS_COPILOT_SESSIONS = gql`
  query getCopilotAnonymousSessions($workspaceId: String!) {
    copilotAnonymous(workspaceId: $workspaceId) {
      chats
      actions
    }
  }
`;

const CREATE_COPILOT_SESSIONS = gql`
  mutation createCopilotSession($options: CreateChatSessionInput!) {
    createCopilotSession(options: $options)
  }
`;

export class CopilotClient {
  private graphQLClient: ApolloClient<NormalizedCacheObject>;

  constructor(readonly backendUrl: string = 'https://affine.fail') {
    this.graphQLClient = new ApolloClient({
      link: new HttpLink({
        uri: `${backendUrl}/graphql`,
      }),
      cache: new InMemoryCache(),
    });
  }

  async createSession(options: {
    workspaceId: string;
    docId: string;
    action: boolean;
    model: string;
    promptName: string;
  }) {
    const res = await this.graphQLClient.mutate({
      mutation: CREATE_COPILOT_SESSIONS,
      variables: {
        options,
      },
    });
    return res.data.createCopilotSession as string;
  }

  async getSessions(workspaceId: string) {
    const res = await this.graphQLClient.query({
      query: GET_COPILOT_SESSIONS,
      variables: {
        workspaceId,
      },
    });
    return res.data.currentUser.copilot as {
      actions: string[];
      chats: string[];
    };
  }

  async getAnonymousSessions(workspaceId: string) {
    const res = await this.graphQLClient.query({
      query: GET_ANONYMOUS_COPILOT_SESSIONS,
      variables: {
        workspaceId,
      },
    });
    return res.data.copilotAnonymous as { actions: string[]; chats: string[] };
  }

  async getHistories(
    workspaceId: string,
    docId?: string,
    options?: {
      action?: boolean;
      limit?: number;
      sessionId?: string;
      skip?: number;
    }
  ) {
    const res = await this.graphQLClient.query({
      query: GET_COPILOT_HISTORIES,
      variables: {
        workspaceId,
        docId,
        options,
      },
    });
    return res.data.currentUser.copilot.histories as {
      sessionId: string;
      tokens: number;
      messages: {
        content: string;
        createdAt: string;
        role: 'user' | 'assistant';
      }[];
    }[];
  }

  async getAnonymousHistories(
    workspaceId: string,
    docId?: string,
    options?: {
      action?: boolean;
      limit?: number;
      sessionId?: string;
      skip?: number;
    }
  ) {
    const res = await this.graphQLClient.query({
      query: GET_ANONYMOUS_COPILOT_HISTORIES,
      variables: {
        workspaceId,
        docId,
        options,
      },
    });

    return res.data.copilotAnonymous.histories as {
      sessionId: string;
      tokens: number;
      messages: {
        content: string;
        createdAt: string;
        role: 'user' | 'assistant';
      }[];
    }[];
  }

  async textToText(text: string, sessionId: string) {
    const res = await fetch(
      `${this.backendUrl}/api/copilot/chat/${sessionId}?message=${text}`
    );
    if (!res.ok) return;
    return res.text();
  }

  textToTextStream(text: string, sessionId: string) {
    return new EventSource(
      `${this.backendUrl}/api/copilot/chat/${sessionId}/stream?message=${text}`
    );
  }
}
