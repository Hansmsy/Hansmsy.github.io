---
title: "阿里巴巴实习"
permalink: /experience/alibaba/
author_profile: false
description: "阿里巴巴集团大模型应用算法实习：多轮Planner-Subagent智能体的决策约束、两阶段后训练与Skill自进化闭环。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# 阿里巴巴集团 · 大模型应用算法实习

<div class="talk-meta" markdown="1">
**2026.05 – 2026.09** ｜ 大模型应用算法实习生 ｜ 负责Planner模块与子决策模块的优化
</div>

<div class="paper-tags"><span class="paper-tag">智能体</span><span class="paper-tag">SFT + DPO</span><span class="paper-tag">数据飞轮</span><span class="paper-tag">Skill自进化</span></div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与我的贡献</span>
## 原来的智能体是单轮的：每次运行都要把所有Agent跑一遍

单轮架构里没有任务分解，一次运行会把全部Agent依次执行一遍，并把工具描述与上下文一次性塞进提示词。任务一复杂，延迟与token开销就随Agent数量线性增长，而其中绝大多数Agent对当前这个任务其实是无关的。

## 于是推进多轮Planner-Subagent架构

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">上层</span><span class="pipe-name">Planner</span><span class="pipe-desc">负责任务分解与调度，每轮只决定下一步做什么</span></div>
<div class="pipe-step"><span class="pipe-tag">下层</span><span class="pipe-name">Subagent</span><span class="pipe-desc">只被按需调用，执行具体子任务并回传结果</span></div>
</div>

## 但多轮引入了新问题：所有已确认特征都被塞进上下文

当时的做法是**把所有已确认特征都放进上下文**，交给Planner自己判断下一步看什么。这带来三个后果：

<div class="cards" markdown="1">
<div class="card"><span class="card-t">上下文线性膨胀</span><span class="card-d">上下文规模直接跟已确认特征数挂钩，特征一多就吃满窗口</span></div>
<div class="card"><span class="card-t">决策方差高</span><span class="card-d">大量无判别力的特征淹没关键信息，Planner每轮的选择都不稳定</span></div>
<div class="card"><span class="card-t">无效探索多</span><span class="card-d">看错方向要靠后续轮次纠正，链路被拉长、subagent调用增加</span></div>
</div>

## 我负责的部分

<div class="claim" markdown="1">
我负责**Planner模块**与其中一个**子决策模块**的优化，目标是**减少无效探索**：让Planner在一个受约束的候选集上做选择，而不是面对全部已确认特征。这样上下文规模与特征总数解耦，关键路径的命中率与多轮决策的稳定性也随之提升。
</div>

具体做了三件事：

1. **图谱约束智能体决策**
2. **Planner模型后训练 (SFT + DPO)**
3. **Skill自进化框架设计**

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 图谱约束的决策</span>

旧架构不做选择，每个账户都会把全部subagent执行一遍，代价是延迟与成本。但它同时留下了一份**无缺失的特征矩阵**：每个账户的每个特征都有取值，且配有事后确认的真标签。

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">构建图谱</span><span class="pipe-desc">节点是特征，边权是条件信息增益</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">计算边权</span><span class="pipe-desc">已看过某特征后，再看下一个能消掉多少不确定性</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">检索排序</span><span class="pipe-desc">按单位成本信息量取Top-N进上下文</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 4</span><span class="pipe-name">增量维护</span><span class="pipe-desc">保留1%全量采样，周期性重估</span></div>
</div>

### ① 构建图谱

**节点是一个特征**，背后对应一到多个subagent；**边刻画特征之间的先后价值关系**。数据就是上面那份历史特征矩阵与事后标签，不需要重新跑Agent。

### ② 边权：条件信息增益

设$Y$为事后标签 (是否爬虫)，$X_u$与$X_v$为两个特征：

$$w(u \to v) = H(Y \mid X_u) - H(Y \mid X_u,\, X_v) = I(Y; X_v \mid X_u)$$

简单来说：**已经看过特征$u$之后，再看特征$v$，还能再消掉多少关于标签的不确定性。** 没有判别力的特征、以及与已看过的特征冗余的特征，都会因此落到零附近。

**异常分回退机制**：格内样本不足时该估计会虚高，此时按样本量把权重连续地从信息增益切换到该特征已有的异常分。

$$w(u \to v) = \lambda_{uv}\,\hat{I}(Y; X_v \mid X_u) + (1 - \lambda_{uv})\,\tilde{a}(v)$$

<div class="echo" markdown="1">
<span class="echo-tag">↔ 与我的论文呼应</span>
这与VR-OPD里的正确性门控收缩**结构完全一致**：证据弱时退回一个**已有的、可用的基线**，而不是退回零。VR-OPD退回的是原始OPD，这里退回的是旧风控体系已有的异常分。
</div>

### ③ 检索排序

每个特征背后是一到多个subagent调用，成本差异很大，所以排序用的是**单位成本的信息量**：

$$\mathrm{score}(v) = \frac{I(Y; X_v \mid X_u)}{\mathrm{cost}(v)}$$

「减少无效探索」因此有了精确含义：**用更少的subagent调用达到同样的判别力。**

### ④ 增量维护

反爬属于**对抗场景**，爬虫策略持续演化，今天没有判别力的特征明天可能成为最强特征，因此边权必须周期性重估。

但新架构只执行Top-N，未被选中的特征没有取值、无法用于估计，所以要保留约1%的账户继续走全量路径。

<div class="echo" markdown="1">
<span class="echo-tag">↔ 与我的论文呼应</span>
图谱判定不重要的特征将不再被采集，也就不再有机会被重新评估。这与MCPO里轮次级轨迹剪枝要治的病是同一个——**抑制自我强化的曝光偏置**，只是MCPO作用于策略采样，这里作用于数据采集。
</div>

做法：按固定周期把这1%账户的全量特征与事后标签并入历史数据，重算一遍边权。

图谱本身会变，策略侧也得为此做好准备——这就是下一屏「图谱扰动」的动机。

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
