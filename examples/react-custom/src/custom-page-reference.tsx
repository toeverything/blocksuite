import { AffineReference } from '@blocksuite/blocks';
import { useState, useEffect } from 'react';

// This function generates a random color in hex format
const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16);
};

// Custom hook that changes color smoothly over time
const useRandomColor = (interval = 1000) => {
  const [color, setColor] = useState(generateRandomColor());

  useEffect(() => {
    const colorInterval = setInterval(() => {
      setColor(generateRandomColor());
    }, interval);

    return () => clearInterval(colorInterval);
  }, [interval]);

  return color;
};

export const CustomPageReference = ({
  reference,
}: {
  reference: AffineReference;
}) => {
  const [title, setTitle] = useState(reference.title);

  useEffect(() => {
    const refId = reference.delta.attributes?.reference?.pageId;
    if (refId) {
      const t =
        reference.doc.collection.meta.docMetas.find(m => m.id === refId)
          ?.title ?? 'title';
      setTitle(t);
    }
  }, [
    reference.delta.attributes?.reference?.pageId,
    reference.doc.collection.meta.docMetas,
  ]);

  return (
    <span
      style={{
        backgroundColor: useRandomColor(1000),
        transition: 'background-color 1s',
        padding: '0 0.5em',
      }}
    >
      📜 {title}
    </span>
  );
};
