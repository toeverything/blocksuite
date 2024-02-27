export function normalSizes(
  sizes: number[],
  targetSum: number,
  min: number,
  max: number
) {
  let sum = sizes.reduce((acc, val) => acc + val, 0);
  const diff = targetSum - sum;
  let adjustments = sizes.map(() => diff / sizes.length); // 初始均匀分配调整值

  // 函数用于保证值在指定范围内，同时尝试接近目标和
  const adjustValue = (value: number, adjustment: number) => {
    const newValue = value + adjustment;
    if (newValue < min) {
      return min - value; // 调整到最小值
    }
    if (newValue > max) {
      return max - value; // 调整到最大值
    }
    return adjustment;
  };

  // 是否需要进一步调整的标志
  let needsAdjustment = true;
  while (needsAdjustment) {
    needsAdjustment = false;
    sum = sizes.reduce((acc, cur, idx) => {
      const actualAdjustment = adjustValue(cur, adjustments[idx]);
      sizes[idx] += actualAdjustment; // 应用调整
      return acc + sizes[idx]; // 更新总和
    }, 0);

    const newDiff = targetSum - sum;
    if (Math.abs(newDiff) > 0.5) {
      // 以一定的容忍度判断是否足够接近
      needsAdjustment = true;
      adjustments = sizes.map(() => newDiff / sizes.length);

      // 对调整值进行微调，防止超出界限
      for (let i = 0; i < sizes.length; i++) {
        adjustments[i] = adjustValue(sizes[i], adjustments[i]);
      }
    }
  }

  // 调整失败了
  if (
    sizes.some(size => size < min || size > max) ||
    Math.abs(sizes.reduce((acc, cur) => acc + cur, 0) - targetSum) > 0.5
  ) {
    return sizes.map(() => 100 / sizes.length);
  }

  return sizes;
}
