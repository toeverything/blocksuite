import { describe, expect, it } from 'vitest';

import { BinaryHeap } from './heap.js';

const scoreFunction = (element: number) => element;

describe('heap', () => {
  it('should push elements and maintain the min-heap property', () => {
    const heap = new BinaryHeap<number>(scoreFunction);
    heap.push(4);
    heap.push(3);
    heap.push(1);
    heap.push(5);
    heap.push(2);
    expect(heap.size()).toBe(5);
    expect(heap.pop()).toBe(1);
  });

  it('should pop elements while maintaining the min-heap property', () => {
    const heap = new BinaryHeap<number>(scoreFunction);
    heap.push(4);
    heap.push(3);
    heap.push(1);
    heap.push(5);
    heap.push(2);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(2);
    expect(heap.pop()).toBe(3);
    expect(heap.pop()).toBe(4);
    expect(heap.pop()).toBe(5);
  });

  it('should remove elements while maintaining the min-heap property', () => {
    const heap = new BinaryHeap<number>(scoreFunction);
    heap.push(4);
    heap.push(3);
    heap.push(1);
    heap.push(5);
    heap.push(2);
    heap.remove(3);
    expect(heap.size()).toBe(4);
    expect(heap.pop()).toBe(1);
    expect(heap.pop()).toBe(2);
    expect(heap.pop()).toBe(4);
  });

  it('should rescore elements and maintain the min-heap property', () => {
    const heap = new BinaryHeap<number>(scoreFunction);
    heap.push(4);
    heap.push(3);
    heap.push(1);
    heap.push(5);
    heap.push(2);
    const elementToUpdate = 1;
    const updatedElement = 6;
    heap.remove(elementToUpdate);
    heap.push(updatedElement);
    expect(heap.size()).toBe(5);
    expect(heap.pop()).toBe(2);
    expect(heap.pop()).toBe(3);
    expect(heap.pop()).toBe(4);
    expect(heap.pop()).toBe(5);
    expect(heap.pop()).toBe(6);
  });
});
