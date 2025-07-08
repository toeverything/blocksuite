import { openFileOrFiles, openSingleFileWith } from '@blocksuite/affine-shared/utils';
import { type SlashMenuConfig } from '@blocksuite/affine-widget-slash-menu';
import { ExportToPdfIcon, FileIcon } from '@blocksuite/icons/lit';

import { addSiblingAttachmentBlocks } from '../utils';
import { AttachmentTooltip, DicomTooltip, PDFTooltip } from './tooltips';
import JSZip from 'jszip';
import { uuidv4 } from '@blocksuite/store';
import { ImageIcon } from '@blocksuite/icons/lit';

import { svg } from 'lit';
declare var decoder: any;


// Define the DCMFileIcon as a function that returns an SVG template
export function DCMFileIcon() {
  return svg`
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.75 4C7.75 2.20508 9.20508 0.75 11 0.75H27C27.1212 0.75 27.2375 0.798159 27.3232 0.883885L38.1161 11.6768C38.2018 11.7625 38.25 11.8788 38.25 12V36C38.25 37.7949 36.7949 39.25 35 39.25H11C9.20507 39.25 7.75 37.7949 7.75 36V4Z"
        stroke="#D0D5DD"
        stroke-width="1.5"
        fill="none"
      />
      <rect x="1" y="18" width="26" height="16" rx="2" fill="#7F56D9" />
      <text
        x="14"
        y="30"
        font-size="10"
        font-family="Arial, sans-serif"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
      >
        DCM
      </text>
    </svg>
  `;
}

export const attachmentSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'Attachment',
      description: 'Attach a file to document.',
      icon: FileIcon(),
      tooltip: {
        figure: AttachmentTooltip,
        caption: 'Attachment',
      },
      searchAlias: ['file'],
      group: '4_Content & Media@3',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('affine:attachment'),
      action: ({ std, model }) => {
        (async () => {
          const file = await openSingleFileWith();
          if (!file) return;

          await addSiblingAttachmentBlocks(std, [file], model);
          if (model.text?.length === 0) {
            std.store.deleteBlock(model);
          }
        })().catch(console.error);
      },
    },
    {
      name: 'DICOM',
      description: 'Insert Dicoms.',
      icon: DCMFileIcon(),
      tooltip: {
        figure: DicomTooltip,
        caption: 'DICOM',
      },
      group: '4_Content & Media@11',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('affine:attachment'),
      action: async ({ std, model  }) => {
        const files = await openFileOrFiles({
          multiple: true
        });
        if (!files) return;
        if (files.length === 0) return;
        const studyManager = decoder.CoreApi.createStudy();
        await decoder.CoreApi.createSeriesFromFiles(studyManager, files);
        const guid = uuidv4();
        const zipFileName = guid + '.dicomdir';
        const zip = new JSZip();
        const blob = await zip.generateAsync({ type: 'blob'});
        const zipFile = new File([blob], zipFileName, { type: "application/dicomdir" });
        await addSiblingAttachmentBlocks(std,[zipFile],model);
        if (model.text?.length === 0) {
            std.store.deleteBlock(model);
        }
      },
    },
    {
      name: 'PDF',
      description: 'Upload a PDF to document.',
      icon: ExportToPdfIcon(),
      tooltip: {
        figure: PDFTooltip,
        caption: 'PDF',
      },
      group: '4_Content & Media@4',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('affine:attachment'),
      action: ({ std, model }) => {
        (async () => {
          const file = await openSingleFileWith();
          if (!file) return;

          await addSiblingAttachmentBlocks(std, [file], model);
          if (model.text?.length === 0) {
            std.store.deleteBlock(model);
          }
        })().catch(console.error);
      },
    },
  ],
};
