import { ExcalidrawEmbedConfig } from './excalidraw';
import { GoogleDocsEmbedConfig } from './google-docs';
import { GoogleDriveEmbedConfig } from './google-drive';
import { MiroEmbedConfig } from './miro';
import { SpotifyEmbedConfig } from './spotify';

export const EmbedIframeConfigExtensions = [
  SpotifyEmbedConfig,
  GoogleDriveEmbedConfig,
  MiroEmbedConfig,
  ExcalidrawEmbedConfig,
  GoogleDocsEmbedConfig,
];
