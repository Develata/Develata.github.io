---
layout: page
title: 多目标追踪
description: 多目标追踪（MOT）任务：短暂标记目标，在多个相同物体持续移动后重新选择它们。
sidebar: false
injectTitle: false
---

<MultipleObjectTracking />

<BrainTrainingNotes>
  <template #explanation>
    多目标追踪（Multiple Object Tracking, MOT）要求在目标标记消失后持续更新若干运动物体的身份。对象数、目标数、速度、持续时间与拥挤程度共同决定当前任务难度。
  </template>
  <template #evidence>
    MOT 是研究动态视觉注意的成熟实验范式，但一轮结果只描述当前刺激与设备条件下的目标选择表现。这里不输出“动态注意力年龄”、一般注意容量或临床结论。综述入口：Meyerhoff, Papenmeier & Huff (2017), <a href="https://pubmed.ncbi.nlm.nih.gov/28584953/" target="_blank" rel="noreferrer">Multiple object tracking: A tutorial review</a>。
  </template>
  <template #practice>
    固定对象数、目标数、速度和输入设备后再比较多次记录。页面切到后台会作废当前轮；系统设置减少动态效果时，运动仍是任务本身，只会在主动点击开始后播放。
  </template>
</BrainTrainingNotes>
