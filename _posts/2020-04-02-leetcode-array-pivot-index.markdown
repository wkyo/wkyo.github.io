---
layout: post
title: Leetcode - 寻找数组的中心索引
categories: algorithm
tags:
  - leetcode
  - algorithm
  - array
---

给定一个整数类型的数组 `nums`，寻找该数组的中心索引。数组中心索引的左侧所有元素相加的和等于右侧所有元素相加的和。如果数组不存在中心索引，则返回 `-1`；如果数组有多个中心索引，则返回最左侧的中心索引。

# 示例

示例1:

输入: `nums = [1, 7, 3, 6, 5, 6]`，输出: `3`。索引3 (nums[3] = 6) 的左侧数之和(1 + 7 + 3 = 11)，与右侧数之和(5 + 6 = 11)相等。同时, 3 也是第一个符合要求的中心索引。

示例2:

输入: `nums = [1, 2, 3]`，输出: `-1`。该数组中不存在满足此条件的中心索引。

示例3：

输入: `nums = [1, 0]`，输出: `0`。索引0 (nums[0] = 1) 的左侧数之和为0（其左侧不存在任何数字），与右侧数之和(0 = 0)相等。

# 解题思路

寻找一个中心索引，以使得左右两边的数字之和相等，即对于某一个索引 $i$  使得 $x_1+x_2+⋯+x_{i−1}=x_{i+1}+x_{i+2}+⋯+x_n$ 。由于这里是求解最左侧中心索引，一个自然而然的想法便是，首先从右至左求解出每个索引 $i$  的右侧之和 $R_i = \sum_{k=i+1}^n{x_k} = x_{i+1} + R_{i+1}$ 。随后从左至右依次求解索引 $i$  的左侧之和 $L_i = \sum_{k=0}^{i-1}{x_k} = x_{i-1} + R_{i-1}$ ，若 $L_i = R_i$ ，则找到了最左侧的中心索引。

```py
def pivotIndex(self, nums: List[int]) -> int:
    length = len(nums)

    right_sum_array = [0] * length
    # sum from right to left
    idx = length - 2  # keep last position, ignore first position
    while idx >= 0:
        right_sum_array[idx] = nums[idx + 1] + right_sum_array[idx + 1]
        idx -= 1

    # sum from left to right
    idx = 0
    left_sum = 0
    while idx < length:

        if left_sum == right_sum_array[idx]:
            return idx
        left_sum += nums[idx]

        idx += 1
    return -1
```
