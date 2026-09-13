---
title: "VR-OPD"
permalink: /papers/vropd/
author_profile: false
description: "VR-OPD：利用已有兄弟rollout构造留一基线，以正确性门控调节基线强度，并结合token级影响控制改善在线策略蒸馏。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# VR-OPD: Variance Reduction for On-Policy Distillation with Group Baselines

<div class="talk-meta" markdown="1">
**ICLR 2027 (CCF-A) 在审** ｜ 共同一作
</div>

<div class="paper-tags"><span class="paper-tag">后训练</span><span class="paper-tag">在线策略蒸馏</span><span class="paper-tag">方差缩减</span><span class="paper-tag">训练稳定性</span><span class="paper-tag">推理模型</span></div>

<div class="claim" markdown="1">
**一句话介绍**：利用同一问题下已经采出的多条回答，构造留一基线改善在线蒸馏的梯度估计，再按组内正确性自适应调节基线强度。
</div>

**我的贡献**：提出并设计**正确性门控收缩**，让组级基线在不同组上自适应发挥作用；同质组仍保留原始教师监督。

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与动机</span>
## 在线策略蒸馏：让教师指导学生自己生成的回答

在线策略蒸馏 (On-Policy Distillation, OPD) 的做法是：让学生自己采样rollout，再用教师提供的**稠密token级监督**去优化这些rollout。相比只学习教师预生成的离线答案，它让教师在**学生实际访问到的上下文**上提供指导，有助于缓解师生上下文错配。

## 但是，稠密监督仍然存在采样方差

教师逐token提供监督，并不意味着梯度估计没有噪声。学生采到的回答不同、访问到的前缀不同，得到的蒸馏信号也会变化。我们关注的sampled-token OPD估计器因此存在采样波动，可能造成更新震荡、增加稳定优化的难度。

## 而方差缩减的线索，就在已经采出的兄弟回答中

<div class="claim" markdown="1">
我们的目的是让学生学到**每个token的好与坏**。但一条回答的监督信号中，也可能混着同组兄弟回答共有的成分；当这部分公共信号很强时，当前token自身的好坏差异就容易被淹没。于是，我们用已经采出的兄弟回答估计公共水平，再将它从当前信号中减去，让需要学习的差异更突出，**无需额外生成兄弟回答**。
</div>

由此得到我们的切入点：用同组**其他**回答构造基线，从当前回答的监督信号中减去；希望在保留原始期望梯度的前提下，减少采样波动。接下来要解决的关键问题，就是**为什么必须把当前回答排除在自己的基线之外**。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 留一基线</span>
## 用其他回答估计基线，避免当前回答进入自己的基线

**总的思想：先减去大家共有的部分，再突出当前token自身的好坏。** 同一问题下，兄弟回答可能共享一些行文特征或共同的信号偏移。用同组**其他**兄弟估计这部分公共水平，构造留一基线，再从当前回答的监督信号中减去。这里的“公共能力”指它在监督信号中体现出的公共成分。

下面是组级中心化的**简化示意**，$s_i$表示监督信号，**不是梯度向量**；实际token级聚合以估计器定义为准：

$$b_i = \frac{1}{G-1}\sum_{j \neq i} s_j, \qquad \tilde{s}_i = s_i - b_i$$

<div class="claim" markdown="1">
**为什么留一？** 方差缩减希望保留原始估计器的期望；排除自身，是避免基线依赖当前采样的关键步骤。
</div>

在条件独立等相应假设下，基线项的期望贡献为零；是否降低方差还取决于基线与梯度信号的关系。

<figure class="fig-lg">
  <img src="/images/vropd-idea.png" alt="兄弟rollout留一中心化的概念示意">
  <figcaption><b>概念示意图</b>（非论文实验图）。展示公共偏移被基线消除的直觉；图中的信号方差及「49×」均为示意数值，不代表实测梯度方差，无偏性需满足相应独立性条件。</figcaption>
</figure>

<details markdown="1">
<summary>展开：无偏性直觉，以及与GRPO的区别</summary>
<div class="details-body" markdown="1">

以简化的score-function估计器为例，若有效基线$B$在给定问题$x$后不依赖当前回答$y$，且作为停止梯度的控制变量处理，则：

$$\mathbb{E}[B\nabla_\theta\log\pi_\theta(y\mid x)\mid x] = 0$$

因此从监督信号中减去该基线，可以保持原始期望梯度。门控加入后，需要检查的是**整个有效基线$\lambda_i b_i$**的依赖关系；停止梯度不等于统计独立。留一本身不自动保证整个训练算法无偏。

**与GRPO的区别在设计目标**：这里希望在原始OPD估计器上加入控制变量、保留其期望；GRPO用包含自身的组均值与标准差构造相对优势，并使用裁剪目标，不保证无偏估计原始期望奖励梯度。留一并非OPD专属，RL同样可以使用。

</div>
</details>

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 我的贡献</span>
## 正确性门控收缩：不同组，不必使用同样强的基线

**进一步的问题：什么时候值得减去公共成分？** 我们用组内正确性作为判断线索，区分更偏“行文驱动”的信号差异与更有“结果驱动”证据的信号差异，并据此调节留一中心化的强度。

**全对或全错：更偏行文驱动的判断线索。** 组内没有结果上的对错对比，token监督的差异可能更多体现行文方式，而缺少区分正确与错误回答的组内证据。此时不必强行做留一中心化，而是减弱基线作用，保留更多原始教师监督。

**有对有错：更有结果驱动的证据。** 组内出现了正确与错误回答的对比，更值得用留一中心化减去共有成分，突出可能与结果相关的token信号。因此增强基线作用，让这些差异更清楚地进入学习过程。

这是一种**门控的设计直觉**：全对或全错并不能证明信号与结果无关，混合组也不能证明每个token的差异都由结果决定；我们利用的是正确性提供的组内证据。

<div class="echo" markdown="1">
<span class="echo-tag">与DAPO的联系</span>
借鉴DAPO通过正确性甄别同质组的思路。但OPD在全对或全错的组中仍有教师token监督，因此采用**连续调节基线强度**，替代直接过滤整组。两者改变的对象不同：一个调节基线，一个筛选训练组。
</div>

**这一部分的重点**：让方差缩减根据组内证据自适应发挥作用，同时避免对同质组过度中心化。

</div>

<div class="slide" markdown="1">
<span class="slide-no">04 ／ 完整方法</span>
## 组级基线与token级影响控制，处理两个层次的波动

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">构造基线</span><span class="pipe-name">组内留一</span><span class="pipe-desc">用其他兄弟回答的信息，避免自身进入基线</span></div>
<div class="pipe-step"><span class="pipe-tag">调节强度</span><span class="pipe-name">正确性门控</span><span class="pipe-desc">按组内正确性混杂程度决定减去多少基线</span></div>
<div class="pipe-step"><span class="pipe-tag">控制尾部</span><span class="pipe-name">有界token影响控制</span><span class="pipe-desc">对极端高影响token重加权，减少少数token主导更新</span></div>
</div>

**GIC的作用**：组级中心化之后，仍可能存在极端token影响，进一步用有界重加权控制尾部。该操作的影响需单独分析，不能直接沿用留一基线的无偏性结论。

| 变体 | 组内留一 + 正确性门控 | GIC |
| :-- | :--: | :--: |
| VR-OPD (Group CV) | ✓ | — |
| VR-OPD (full) | ✓ | ✓ |

分别报告这两个变体，观察组级基线与token级稳定器的效果；Group CV包含两个组件，其结果不能单独归因于门控。

</div>

<div class="slide" markdown="1">
<span class="slide-no">05 ／ 实验与边界</span>
## 两组师生、八个基准，域内与域外宏平均均有提升

训练数据为**DAPO-Math-17K**。域内评测数学推理，域外评测通用推理迁移。

<div class="stats" markdown="1">
<div class="stat"><span class="stat-num">+1.6～2.0</span><span class="stat-lab">域内宏平均提升<br>full相对标准OPD，百分点</span></div>
<div class="stat"><span class="stat-num">+2.3～2.6</span><span class="stat-lab">域外宏平均提升<br>full相对标准OPD，百分点</span></div>
</div>

| 师生配置 | 域内平均：OPD → full | 域外平均：OPD → full |
| :-- | :-- | :-- |
| Skywork-OR1-Math-7B → R1-Distill-Qwen-1.5B | 39.8 → **41.8** | 18.2 → **20.8** |
| Qwen3-32B → Qwen3-4B-Base | 38.4 → **40.0** | 53.1 → **55.4** |

<figure>
  <img src="/images/vropd-table1.png" alt="VR-OPD两组师生配置的主结果">
  <figcaption><b>Table 1</b>　标准OPD、Group CV和full的对比。粗体最优、下划线次优；汇总数字来自各组宏平均。</figcaption>
</figure>

**结果支持的结论**：完整方法在两组配置下都改善域内与域外宏平均性能；单项指标并非全部最优。

<details markdown="1">
<summary>展开：基准、评价口径与结论边界</summary>
<div class="details-body" markdown="1">

- **域内六项**：MATH-500、Olympiad、Minerva、AIME24、AMC、AIME25。
- **域外两项**：ARC-C、MMLU-Pro。
- AIME24、AIME25、AMC报告Avg@32，其余报告Pass@1；Avg.为各组指标的宏平均。
- 方差缩减利用的是已有组采样；不意味着整个训练过程没有计算或存储开销。
- 域外提升不能单独证明减少过拟合，梯度方差与训练稳定性还需相应测量支持。

</div>
</details>

</div>

<div class="talk-nav" markdown="1">
[← GemTalk](/papers/gemtalk/)　·　[返回主页](/)
</div>

</div>
