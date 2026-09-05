---
title: "阿里巴巴实习"
permalink: /experience/alibaba/
author_profile: false
description: "阿里巴巴集团大模型应用算法实习：多轮Planner-Subagent智能体的决策约束、两阶段后训练与Skill自进化闭环。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# 多轮Planner-Subagent智能体的决策约束与自进化

<div class="talk-meta" markdown="1">
**阿里巴巴集团** ｜ 大模型应用算法实习生 ｜ 2026.05 – 2026.09
</div>

<div class="paper-tags"><span class="paper-tag">多轮智能体</span><span class="paper-tag">Planner-Subagent</span><span class="paper-tag">图谱约束决策</span><span class="paper-tag">SFT + DPO</span><span class="paper-tag">数据飞轮</span><span class="paper-tag">Skill自进化</span></div>

<div class="claim" markdown="1">
本页只讲**可公开的通用方法论与技术取舍**，不含公司内部数据、业务指标与系统实现细节。
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与动机</span>
## 单轮架构在三类问题上有结构性困难

单轮的做法是一次性把工具描述与上下文全部塞进提示词，让模型直接给出决策。任务一复杂，三个问题就同时出现：

<div class="cards" markdown="1">
<div class="card"><span class="card-t">候选动作空间大</span><span class="card-d">可选动作多，一次性决策的方差高</span></div>
<div class="card"><span class="card-t">决策链路长</span><span class="card-d">任务需要多步推进，单轮无法表达步骤间的依赖</span></div>
<div class="card"><span class="card-t">状态持续变化</span><span class="card-d">环境本身在演化，基于静态快照做的规划很快失效</span></div>
</div>

## 于是转向多轮Planner-Subagent协作

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">上层</span><span class="pipe-name">Planner</span><span class="pipe-desc">负责任务分解与调度，决定下一步做什么</span></div>
<div class="pipe-step"><span class="pipe-tag">下层</span><span class="pipe-name">Subagent</span><span class="pipe-desc">负责具体子任务的执行，并把结果回传</span></div>
</div>

我负责其中一个决策模块的构建与优化。下面三个机制，是我认为**可以脱离具体业务复用**的部分。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 图谱约束的决策</span>
## 不让模型在开放空间里自由生成动作，而是在受约束的候选路径中做选择

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">离线归纳</span><span class="pipe-desc">从历史高质量轨迹中归纳出领域图谱</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">增量维护</span><span class="pipe-desc">新的高质量轨迹持续并入，避免图谱僵化</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">检索排序</span><span class="pipe-desc">每步决策检索并排序Top-N可执行路径</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 4</span><span class="pipe-name">收敛选择</span><span class="pipe-desc">开放式动作生成 → 候选路径选择</span></div>
</div>

### 这里的取舍

把动作生成收敛为路径选择，确实**牺牲了一部分理论上限**——图谱覆盖不到的全新路径无法被直接命中。

但在对**错误调用容忍度极低**的场景里，开放生成的方差是不可接受的。所以是主动用可控性换稳定性，并用两个设计对冲覆盖不足：**增量维护**让图谱不僵化，**Top-N候选**而非硬性Top-1剪枝保留了选择空间。

### 这个设计的固有风险

<div class="claim" markdown="1">
图谱从历史**成功**轨迹归纳而来，天然存在**幸存者偏差**：它擅长复现已知的有效模式，但对全新路径的召回能力有限。
</div>

这也正是下一屏「图谱扰动」的动机来源。

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 两阶段后训练</span>
## 后训练最难的不是训练本身，是高质量轨迹从哪来

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">多轨迹采样</span><span class="pipe-desc">对同一任务采样多条候选轨迹</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">自动执行验证</span><span class="pipe-desc">让它们真实执行，用执行结果作为客观标签</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">质量评分</span><span class="pipe-desc">据此筛选出用于SFT与偏好对构造的数据</span></div>
</div>

关键在第二步：标签既不依赖人工主观判断，也不依赖模型自评，而是**来自环境的真实反馈**。

## 为什么是DPO而不是RL

这个问题我被追问过很多次——毕竟我自己的论文做的正是强化学习。答案是场景约束下的取舍，而不是技术上的退让：

- **RL需要高频、低成本的奖励信号**。在论文的模型选择场景里，我可以直接用选择的正确性构造奖励，采样成本可控。
- **但业务场景下，一条完整轨迹必须真实执行才知道好坏**，采样成本与延迟都高一个量级，且线上环境不允许大规模在线探索。
- **DPO只需要离线的偏好对**，正好可以用执行验证的结果来构造，样本效率与工程风险都更可控。

## 把论文里的掩码思想迁移过来

我把 [MCPO](/papers/mcpo/) 里的**掩码**思想迁移到了这里，设计了图谱扰动：训练时对图谱施加扰动以模拟状态漂移，迫使策略去学习**底层能力**，而不是死记特定的路径形态。

<div class="claim" markdown="1">
这个迁移之所以成立，是因为掩码的本质**不依赖强化学习**——它要解决的是「策略记住了表面标识却没学到能力」这个问题，因此可以平移到DPO的数据构造环节。

**真正可复用的不是算法，而是算法背后的问题诊断。**
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">04 ／ Skill自进化闭环</span>
## 让能力持续演进，而不是每次失败都靠人工补规则

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">失败归因</span><span class="pipe-desc">从执行轨迹与失败案例中收集触发信号</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">技能合成</span><span class="pipe-desc">Map-Reduce式分层归纳失败模式</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">批量验证</span><span class="pipe-desc">调度Subagent做自动化回归测试</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 4</span><span class="pipe-name">回归合入</span><span class="pipe-desc">通过验证方可合入统一的技能库</span></div>
</div>

### 为什么要Map-Reduce分层

因为**单个大模型的上下文窗口装不下批量的失败数据**，所以做了角色分离：

- **下游LLM作为Map阶段**：分batch并行处理失败案例，抽取失败模式
- **上游LLM作为Reduce阶段**：只聚合这些已被压缩过的模式，合成或更新技能

这样既绕开了上下文长度限制，也让归纳过程可以并行。

### 验证是强制门控，不是可选项

<div class="claim" markdown="1">
新生成或更新的技能**必须**通过批量回归验证才能部署。跳过验证会直接导致技能退化与行为不可靠——自动化回归在这里是合入前的硬约束，而不是「有空再做」的优化项。
</div>

</div>

<div class="talk-nav" markdown="1">
[返回主页](/)　·　[MCPO →](/papers/mcpo/)
</div>

</div>
