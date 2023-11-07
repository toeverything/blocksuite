import type { BaseBlockModel, Page } from '@blocksuite/store';
import { html } from 'lit';

import type { NoteBlockModel, SurfaceBlockModel } from '../models.js';
import { DEFAULT_NOTE_HEIGHT } from '../page-block/edgeless/utils/consts.js';
import { deserializeXYWH, serializeXYWH } from '../surface-block/utils/xywh.js';
import { type SurfaceRefBlockModel } from './surface-ref-model.js';

export function getSurfaceBlock(page: Page) {
  return (
    (page.getBlockByFlavour('affine:surface')[0] as SurfaceBlockModel) ?? null
  );
}

/**
 * Merge to notes into target
 * @param target The target note
 * @param notes The notes to merge
 * @param place Where to place the notes
 * @param reverse Whether to reverse the order of the children
 */
export function mergeNote(
  target: NoteBlockModel,
  notes: NoteBlockModel[],
  place: 'before' | 'after' = 'after',
  reverse: boolean = false
) {
  const children = notes.reduce<BaseBlockModel[]>(
    (result, note) => result.concat(note.children),
    [] as BaseBlockModel[]
  );

  if (reverse) {
    children.reverse();
  }

  target.page.moveBlocks(
    children,
    target,
    target.children[target.children.length - 1] ?? null,
    place === 'before'
  );
  notes.forEach(note => target.page.deleteBlock(note));
}

export function mergeable(notes: NoteBlockModel[]) {
  return notes.every((current, idx) => {
    const next = notes[idx + 1];
    if (current.flavour !== 'affine:note') return false;
    if (next === undefined) return true;

    const currentXYWH = deserializeXYWH(current.xywh);
    const nextXYWH = deserializeXYWH(next.xywh);

    return (
      current.background === next.background &&
      currentXYWH[0] === nextXYWH[0] &&
      currentXYWH[2] === nextXYWH[2]
    );
  });
}

export function mergePreviouse(note: NoteBlockModel) {
  const parent = note.page.getParent(note);
  const idx = parent?.children.indexOf(note);

  if (!parent || !idx) return note;

  const target = parent.children[idx - 1] as NoteBlockModel;

  mergeNote(target, [note]);

  return target;
}

export function mergeableWithPrevios(note: NoteBlockModel) {
  const parent = note.page.getParent(note);

  if (!parent) return false;

  const idx = parent.children.indexOf(note);

  return (
    parent.children[idx - 1] &&
    mergeable([parent.children[idx - 1] as NoteBlockModel, note])
  );
}

export function mergeNext(note: NoteBlockModel) {
  const parent = note.page.getParent(note);
  const idx = parent?.children.indexOf(note);

  if (!parent || idx === undefined || idx === parent.children.length)
    return note;

  const target = parent.children[idx + 1] as NoteBlockModel;

  mergeNote(note, [target]);

  return note;
}

export function mergeableWithNext(note: NoteBlockModel) {
  const parent = note.page.getParent(note);

  if (!parent) return false;

  const idx = parent.children.indexOf(note);

  return (
    parent.children[idx + 1] &&
    mergeable([note, parent.children[idx + 1] as NoteBlockModel])
  );
}

type MergealeNote = {
  mergeDirection: 'prev' | 'next';
  id: string;
};

export function getNotesMergeInfo(blocks: SurfaceRefBlockModel[]) {
  const mergeableNotes: MergealeNote[] = [];

  blocks.forEach(block => {
    if (!block.page.getParent(block.id)) {
      return;
    }

    const note = block.page.getParent(block.id) as NoteBlockModel;
    const idx = note.children.indexOf(block);

    if (idx === 0 && mergeableWithPrevios(note)) {
      mergeableNotes.push({
        id: note.id,
        mergeDirection: 'prev',
      });
    } else if (idx === note.children.length - 1 && mergeableWithNext(note)) {
      mergeableNotes.push({
        id: note.id,
        mergeDirection: 'next',
      });
    }
  });

  return mergeableNotes;
}

export function mergeNotes(page: Page, mergeableNotes: MergealeNote[]) {
  mergeableNotes.forEach(({ id, mergeDirection }) => {
    if (mergeDirection === 'prev') {
      const block = page.getBlockById(id) as NoteBlockModel;
      block && mergePreviouse(block);
    } else if (mergeDirection === 'next') {
      const block = page.getBlockById(id) as NoteBlockModel;
      block && mergeNext(block);
    }
  });
}

/**
 * Split the notes at the position of surface-ref block
 */
export function splitNotesAtRefBlock(refBlocks: SurfaceRefBlockModel[]) {
  refBlocks.forEach(refBlock => {
    const note = refBlock.page.getParent(refBlock) as NoteBlockModel;
    splitNote(note, note.children.indexOf(refBlock));
  });
}

export function splitNote(noteModel: NoteBlockModel, idx: number) {
  const { page } = noteModel;
  const [x, y, w] = deserializeXYWH(noteModel.xywh);
  const slicedBlocks = noteModel.children.slice(idx + 1);
  const slicedNoteProps = {
    flavour: 'affine:note',
    background: noteModel.background,
    xywh: serializeXYWH(x, y + DEFAULT_NOTE_HEIGHT, w, DEFAULT_NOTE_HEIGHT),
  };

  const [slicedNoteId] = page.addSiblingBlocks(noteModel, [slicedNoteProps]);
  page.moveBlocks(
    slicedBlocks,
    page.getBlockById(slicedNoteId) as NoteBlockModel
  );

  return page.getBlockById(slicedNoteId);
}

export const noContentPlaceholder = html`
  <svg
    width="182"
    height="182"
    viewBox="0 0 182 182"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="37.645"
      y="37.6452"
      width="106.71"
      height="106.71"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M91 144.234L37.7664 91.0003L91 37.7666L144.234 91.0003L91 144.234Z"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M90.564 37.352C99.4686 32.1345 109.836 29.1436 120.902 29.1436C154.093 29.1436 181 56.0502 181 89.2413C181 113.999 166.03 135.259 144.648 144.466"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M144.465 90.707C149.683 99.6117 152.674 109.979 152.674 121.045C152.674 154.236 125.767 181.143 92.5759 181.143C67.8187 181.143 46.5579 166.173 37.3516 144.791"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M91.436 144.465C82.5314 149.683 72.1639 152.674 61.0978 152.674C27.9068 152.674 1.0001 125.767 1.0001 92.576C1.00011 67.8188 15.9701 46.558 37.3519 37.3518"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M37.3518 91.436C32.1342 82.5314 29.1433 72.1639 29.1433 61.0978C29.1433 27.9067 56.05 1.00002 89.241 1.00001C113.998 1.00001 135.259 15.97 144.465 37.3518"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M37.3518 37.3521L144.648 144.649"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path
      d="M144.648 37.3521L37.3518 144.649"
      stroke="#D2D2D2"
      stroke-width="0.586319"
    />
    <path d="M91 37.3521V144.649" stroke="#D2D2D2" stroke-width="0.586319" />
    <path d="M144.648 91L37.3518 91" stroke="#D2D2D2" stroke-width="0.586319" />
    <ellipse cx="144.355" cy="37.645" rx="4.39739" ry="4.3974" fill="#5B5B5B" />
    <ellipse
      cx="144.355"
      cy="144.355"
      rx="4.39739"
      ry="4.3974"
      fill="#5B5B5B"
    />
    <ellipse
      cx="144.355"
      cy="90.9999"
      rx="4.39739"
      ry="4.3974"
      fill="#5B5B5B"
    />
    <ellipse cx="37.645" cy="37.645" rx="4.39739" ry="4.3974" fill="#5B5B5B" />
    <ellipse cx="37.645" cy="144.355" rx="4.39739" ry="4.3974" fill="#5B5B5B" />
    <ellipse cx="37.645" cy="90.9999" rx="4.39739" ry="4.3974" fill="#5B5B5B" />
    <ellipse
      cx="90.9999"
      cy="37.6451"
      rx="4.3974"
      ry="4.39739"
      transform="rotate(-90 90.9999 37.6451)"
      fill="#5B5B5B"
    />
    <ellipse
      cx="90.9999"
      cy="90.4136"
      rx="4.3974"
      ry="4.39739"
      transform="rotate(-90 90.9999 90.4136)"
      fill="#5B5B5B"
    />
    <ellipse
      cx="90.9999"
      cy="144.356"
      rx="4.3974"
      ry="4.39739"
      transform="rotate(-90 90.9999 144.356)"
      fill="#5B5B5B"
    />
  </svg>
`;
