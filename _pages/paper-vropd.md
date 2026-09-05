---
title: "VR-OPD"
permalink: /papers/vropd/
author_profile: false
description: "VR-OPD：用组内leave-one-out基线为在线策略蒸馏缩减梯度方差，在保持期望梯度不变的前提下提升稳定性与泛化。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# VR-OPD: Variance Reduction for On-Policy Distillation with Group Baselines

<div class="talk-meta" markdown="1">
**ICLR 2027 (CCF-A) 在审** ｜ 共同一作
</div>

<div class="paper-tags"><span class="paper-tag">后训练</span><span class="paper-tag">在线策略蒸馏</span><span class="paper-tag">方差缩减</span><span class="paper-tag">训练稳定性</span><span class="paper-tag">推理模型</span></div>

<div class="claim" markdown="1">
**我的贡献**：提出并设计了**正确性门控收缩**。思路借鉴DAPO按组内正确率甄别退化组的做法：DAPO靠动态采样把全对或全错的组直接丢弃，我把这个「丢弃」改造成「**连续收缩**」，让基线强度随组内证据强弱平滑退化，而不是二值地要或不要。
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与动机</span>
## 在线策略蒸馏已经是推理模型后训练的核心范式

在线策略蒸馏 (OPD) 的做法是：让学生自己采样rollout，再用教师提供的**稠密token级监督**去优化这些rollout。相比在教师数据上做离线蒸馏，它查询的是学生自己分布上探索到的上下文，能缓解曝光偏置与师生上下文错配。

## 但是有一个问题：梯度方差高、优化不稳

sampled-token的OPD估计器梯度方差偏大，优化过程震荡，通常需要反复调整学习率才能维持训练稳定。

## 而方差缩减的来源已经存在于现有采样之中

<div class="claim" markdown="1">
在group-sampled的OPD中，同一prompt已采出多条兄弟rollout，但标准的稠密token估计器对它们作**独立处理**：教师奖励被分别施加到每条轨迹上，兄弟轨迹间的相关性未被利用。而这一相关性正是一个**无需额外采样开销**的方差缩减来源。
</div>

<figure class="fig-lg">
  <img src="/images/vropd-idea.png" alt="VR-OPD核心思想示意">
  <figcaption><b>示意图</b>（原创绘制，非论文插图，数值为示意）。(a) 组采样OPD的设定：同一prompt已采出 $G$ 条兄弟rollout，教师提供稠密token监督，但标准做法把它们各自独立打分；(b) 每条rollout的信号里混着一个巨大的prompt级公共偏移（橙色虚线为各组均值），总方差被这个偏移主导；(c) 组内留一中心化把公共偏移消掉，<b>同一y轴刻度</b>下几乎压平。</figcaption>
</figure>

由此得到的做法很直接：用同组**其他**兄弟构造一个基线，从当前轨迹的信号中减去。关键在于**把自身排除在其基线之外**，否则基线与被评估轨迹相关，会引入偏差。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 方法</span>
## 三个组件

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">组级</span><span class="pipe-name">组内留一中心化</span><span class="pipe-desc">用同组其他rollout构造基线，在保持期望梯度不变的前提下缩减方差</span></div>
<div class="pipe-step"><span class="pipe-tag">组级</span><span class="pipe-name">正确性门控收缩</span><span class="pipe-desc">按组内正确性的混杂程度调节基线强度，避免同质组被过度中心化</span></div>
<div class="pipe-step"><span class="pipe-tag">token级</span><span class="pipe-name">有界影响控制</span><span class="pipe-desc">对残余的极端token梯度做有界重加权，防止个别token主导整次更新</span></div>
</div>

### ① 组内留一中心化

从当前rollout的token级信号里，减去由同组其他兄弟算出的均值。设组内第 $i$ 条轨迹的信号为 $g_i$，则

$$b_i = \frac{1}{G-1}\sum_{j \neq i} g_j, \qquad \hat{g}_i = g_i - b_i$$

因为基线与当前轨迹条件独立，**期望梯度不变而方差下降**——经典的control variate思路，但此前没有被用在token级的OPD估计器上。

### ② 正确性门控收缩

纯留一基线有一个失效场景：**一组兄弟全对或全错时**，组内几乎没有差异，此时强行中心化会把有用的信号一起减掉。

所以用**组内正确性的混杂度**去调度基线强度（收缩系数 $\lambda$）：组内分歧大时基线强度高，组内同质时收缩基线、退回接近原始OPD。这是自适应的，而不是固定系数。

### ③ 有界token影响控制 (GIC)

即使做了组中心化，token级仍会出现**影响力极端的尾部**：个别token的梯度量级远超其他，单独主导整个更新方向。GIC作为有界影响的安全阀，对这些高影响token重加权，截住影响力的尾部，而不改变整体优化方向。

论文把 **VR-OPD (Group CV)** 定义为「只有留一基线 + 正确性门控收缩、不含GIC」的变体，**VR-OPD (full)** 则加上GIC。这个拆分让「组级基线」与「token级稳定器」的贡献可以分开衡量。

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 实验</span>
## 数据集与指标

**两组师生配置**、共**8个基准**。域内为数学推理 (MATH-500、Olympiad、Minerva、AIME24、AMC、AIME25)，域外为通用推理迁移 (ARC-C、MMLU-Pro)。域内除AIME24 / AIME25 / AMC报告Avg@32外均为Pass@1，域外为Pass@1，Avg. 为组内宏平均。训练数据为DAPO-Math-17K。

### 主结果

<figure>
  <img src="/images/vropd-table1.png" alt="Table 1 主结果">
  <figcaption><b>Table 1</b>　两组师生配置下的域内与域外结果。上半组为 Skywork-OR1-Math-7B → DeepSeek-R1-Distill-Qwen-1.5B，下半组为 Qwen3-32B → Qwen3-4B-Base。粗体最优、下划线次优。</figcaption>
</figure>

一个值得主动讲的现象：**域外增益始终大于域内增益**（+2.3~2.6 对 +1.6~2.0）。这不是巧合——方差缩减带来的是更稳定的优化轨迹，而过拟合往往正是不稳定优化的副产物。我们不是在数学题上练得更狠，而是让训练过程本身更健康，因此泛化能力跟着受益。

</div>

<div class="talk-nav" markdown="1">
[← GemTalk](/papers/gemtalk/)　·　[返回主页](/)
</div>

</div>
