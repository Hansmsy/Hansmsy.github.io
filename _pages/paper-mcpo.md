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

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与动机</span>
## 上一篇让选择变得可解，但那个选择策略是冻结的

HuggingR⁴ 用渐进式推理解决了「百万级模型库里怎么选得起」，但它和所有已有方法一样，靠的是**冻结的大模型 + 提示词**——策略本身从不被优化。

<div class="claim" markdown="1">
选择过程明明有优劣，为什么要让它永远停在冻结的提示上？**能不能让它从自己的决策反馈里学？**
</div>

## 那就把模型选择形式化成强化学习问题

这是**首个**这么做的工作：训练一个紧凑的策略，直接从结果反馈中学习，而不是在推理时靠提示临时决定。

<figure class="fig-lg">
  <img src="/images/mcpo-fig1.png" alt="智能体模型选择的问题设定">
  <figcaption><b>Figure 1</b>　智能体模型选择的问题设定。(a) 多轮选择过程：每轮检索候选、收窄到小子集、反思，可进入下一轮或回溯；(b) 单轮内部的微观动作空间。</figcaption>
</figure>

## 但是标准RL在这里会失效，有三个问题：

- **动作空间过大且不稳定** — 候选池以百万计且每天在变，远超传统RL算法能处理的规模
- **策略会去记名字** — 与其学能力判断，不如背下哪些模型名管用；一旦遇到没见过的候选就废了
- **梯度只奖励已选动作** — 对「同一候选清单里明明有更好的却没选」这件事，标准策略梯度没有任何惩罚

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

<details markdown="1">
<summary>展开：超参敏感性、训练动态与选择行为</summary>
<div class="details-body" markdown="1">

<figure>
  <img src="/images/mcpo-fig3.png" alt="Figure 3 超参敏感性">
  <figcaption><b>Figure 3</b>　关键超参敏感性（Qwen3-8B）。每次只扫一个参数，其余保持默认。</figcaption>
</figure>

<figure>
  <img src="/images/mcpo-fig4.png" alt="Figure 4 训练动态">
  <figcaption><b>Figure 4</b>　跨域切分下的训练动态（Qwen3-1.7B）。响应长度只统计模型生成的输出token。</figcaption>
</figure>

<figure>
  <img src="/images/mcpo-table4.png" alt="Table 4 选择行为">
  <figcaption><b>Table 4</b>　跨域切分下的选择行为（Qwen3-1.7B）。RTP 指轮次级轨迹剪枝，长尾模型指低热度候选。</figcaption>
</figure>

</div>
</details>

</div>

<div class="slide" markdown="1">
<span class="slide-no">04 ／ 与HuggingR⁴的关系</span>
## 同一条主线上的连续两步

- **HuggingR⁴ 解决「可解」** — 不训练，用渐进式推理让百万级模型库上的选择变得可行，并把token开销与库规模解耦
- **MCPO 解决「可学」** — 把冻结的提示换成可优化的策略，从自身决策反馈中持续改进

<div class="claim" markdown="1">
MCPO 的实验里，**最强的免训练基线正是我自己的上一篇工作 HuggingR⁴**。同一个基准、同一套指标，唯一的变量就是「选择策略是冻结的，还是学出来的」。
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">05 ／ 局限</span>
## 两个还没解决的问题

- **候选库持续演化下的增量更新** — 现在的策略是在一个时间切片的候选池上训练的，库每天都在增删，如何低成本地增量更新而不重训，还没有解决。
- **依赖金标签构造反事实优势** — 反事实优势的监督信号来自金标签，这在有标注的基准上成立，但在缺少金标签的真实场景里如何近似，仍是开放问题。

</div>

<div class="talk-nav" markdown="1">
[← HuggingR⁴](/papers/huggingr4/)　·　[返回主页](/)　·　[GemTalk →](/papers/gemtalk/)
</div>

</div>
