---
title: "MCPO"
permalink: /papers/mcpo/
author_profile: false
description: "MCPO：首个把模型选择形式化为强化学习问题的工作，用三个互补机制把RL适配到仓库级动作空间。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# MCPO: Masked and Counterfactual Policy Optimization for Agentic Model Selection

<div class="talk-meta" markdown="1">
**AAAI 2027 (CCF-A) 在审** ｜ 第一作者
</div>

<div class="paper-tags"><span class="paper-tag">大模型智能体</span><span class="paper-tag">Agentic RL</span><span class="paper-tag">后训练</span><span class="paper-tag">模型选择</span><span class="paper-tag">奖励设计</span><span class="paper-tag">跨域泛化</span></div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与动机</span>
## 之前的模型选择方法都是train-free的

不论HuggingGPT还是我上一篇HuggingR⁴，做法都是**提示一个冻结的大模型在推理时临时决定**——选择策略本身从不被优化，也无法从自己的决策结果里改进。

## 首次将模型选择形式化成强化学习问题

训练一个紧凑的策略，直接从结果反馈中学习。

<figure class="fig-lg">
  <img src="/images/mcpo-fig1.png" alt="智能体模型选择的问题设定">
  <figcaption><b>Figure 1</b>　智能体模型选择的问题设定。(a) 多轮选择过程：每轮检索候选、收窄到小子集、反思，可进入下一轮或回溯；(b) 单轮内部的微观动作空间。</figcaption>
</figure>

## 但标准RL在这里会失效，有三个问题：

- **动作空间巨大且动态** — 候选以百万计，而且每天都在新增与更新
- **on-policy采样只覆盖热门模型** — 普通的on-policy方法往往只采样到热门模型，长尾候选几乎采不到，导致模型的偏好策略不能被全面学习
- **只学选中的那一条轨迹** — 目前只会学习选到模型这一条轨迹的策略，忽略了另外没选的轨迹

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 方法</span>
## 三个互补机制，把RL适配到仓库级动作空间

<figure>
  <img src="/images/mcpo-fig2.png" alt="MCPO总览">
  <figcaption><b>Figure 2</b>　MCPO总览。(a) 动态身份掩码改变rollout采集时策略看到的模型卡视图；(b) 轮次级轨迹剪枝按概率裁掉早期轮次的轨迹；(c) 反事实优势在组内计算并施加 anti-advantage。</figcaption>
</figure>

### ① 动态身份掩码　Dynamic Identity Masking

在rollout采集阶段**随机遮蔽模型标识符**，迫使策略把决策依据落在**能力元数据**上，而不是记住的名字。

### ② 轮次级轨迹剪枝　Round-wise Trajectory Pruning

检索引擎天生偏向高热度候选，rollout分布因此严重偏斜。剪枝把分布**从早期的热门候选，重新平衡到暴露更稀有候选的后续轮次**——纠正的是探索分布的系统性偏斜，而不是简单加大熵正则。

### ③ 反事实优势估计　Counterfactual Advantage Estimation

在策略梯度里补上**未被选中候选的机会成本**：利用金标签，只要策略在同一候选清单中忽略了更好的模型，就对它施加惩罚。

**关键性质：不需要价值网络。** 反事实优势直接由金标签算出。这与GRPO的组内基线有本质区别——GRPO衡量「这条轨迹比同组其他轨迹好多少」，而反事实优势衡量「**相对于本可以选到的最优候选，你亏了多少**」，是一个带金标签监督的后悔项。
{: .notice--info}

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 实验</span>
## 数据集与评价指标

评测在目前**最大的仓库级模型选择基准**上进行，即 HuggingR⁴ 提出的 ModelSelect-Bench。

- **WR** (Workability Rate) — 任务类型匹配、输入输出格式兼容、可执行
- **RR** (Reasonability Rate) — 在可用模型中进一步要求领域相关且性能靠前
- **CS** (Combined Score) — 综合分
- 两种切分同时报告：**随机 8:2 切分**与**跨域切分**，后者用来检验在未见候选上的泛化

### 主结果

<figure>
  <img src="/images/mcpo-table1.png" alt="Table 1 主结果">
  <figcaption><b>Table 1</b>　主结果。上半为免训练基线（GPT-5.4 与 DeepSeek-V4-pro 驱动），下半为RL方法（Qwen3-1.7B 与 Qwen3-8B 两个底座）。</figcaption>
</figure>

### 消融

<figure>
  <img src="/images/mcpo-table3.png" alt="Table 3 组件消融">
  <figcaption><b>Table 3</b>　组件消融（Qwen3-1.7B）。每个变体从完整MCPO目标中移除一个机制。</figcaption>
</figure>

### 执行验证与推理效率

<figure>
  <img src="/images/mcpo-table2.png" alt="Table 2 执行验证">
  <figcaption><b>Table 2</b>　执行验证。所有列报告通过率，不只看选得对不对，而是**把选出的模型真的跑起来**看能否完成任务。</figcaption>
</figure>

<figure>
  <img src="/images/mcpo-table5.png" alt="Table 5 推理效率">
  <figcaption><b>Table 5</b>　每次查询的推理效率（随机切分）。响应长度为模型生成的平均输出token数。</figcaption>
</figure>

### 超参敏感性、训练动态与选择行为

<figure>
  <img src="/images/mcpo-fig3.png" alt="Figure 3 超参敏感性">
  <figcaption><b>Figure 3</b>　关键超参敏感性（Qwen3-8B）。每次只扫一个参数，其余保持默认。</figcaption>
</figure>

<figure>
  <img src="/images/mcpo-fig4.png" alt="Figure 4 训练动态">
  <figcaption><b>Figure 4</b>　跨域切分下的训练动态（Qwen3-1.7B）。响应长度只统计模型生成的输出token。</figcaption>
</figure>

- **MCPO训练更加稳定** — MCPO的RR快速上升并收敛到明显更高的水平，而GRPO很早就进入平台期、并在低位持续震荡；响应长度也稳定在约780个token，不随训练漂移。
- **MCPO能有效减少奖励黑客的发生** — GRPO的响应长度一路涨破1000个token，但RR反而更低，是典型的「靠拉长轨迹刷分」；MCPO则在**不依赖更长、更冗长轨迹**的前提下提升选择质量。

<figure>
  <img src="/images/mcpo-table4.png" alt="Table 4 选择行为">
  <figcaption><b>Table 4</b>　跨域切分下的选择行为（Qwen3-1.7B）。RTP 指轮次级轨迹剪枝，长尾模型指低热度候选。</figcaption>
</figure>

</div>

<div class="talk-nav" markdown="1">
[← HuggingR⁴](/papers/huggingr4/)　·　[返回主页](/)　·　[GemTalk →](/papers/gemtalk/)
</div>

</div>
