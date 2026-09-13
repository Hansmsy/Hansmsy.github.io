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

**核心思路**：用历史数据估计每项检查的判断价值，再结合调用成本，给Planner提供少量值得检查的候选。

### ① 构建图谱

**节点是一个特征**，背后对应一到多个subagent；**边权表示知道一个特征后，再查另一个特征的额外判断价值**。数据就是上面那份历史特征矩阵与事后标签，不需要重新跑Agent。事后真标签用于离线估计检查价值，在线分析新账户时并不知道其真标签。

### ② 第一轮：用信息增益确定起始候选

第一轮还没有已检查的特征，因此先估计每个特征单独能提供多少判断信息。设$Y$为事后标签（是否爬虫），$X_v$为候选特征：

$$I(Y; X_v) = H(Y) - H(Y \mid X_v)$$

直观来说：**还没有检查时，知道特征$v$，平均能减少多少关于账户标签的不确定性。** 再结合调用成本排序，将Top-N候选交给Planner选择，作为分析的起点。

### ③ 后续轮次：用条件信息增益衡量新增价值

已经获得检查结果后，重点变成下一项检查还能补充多少信息。用$X_u$表示已检查特征，$X_v$表示候选特征，两两边权定义为：

$$w(u \to v) = H(Y \mid X_u) - H(Y \mid X_u,\, X_v) = I(Y; X_v \mid X_u)$$

简单来说：**已经知道特征$u$之后，再知道特征$v$，平均还能消掉多少关于标签的不确定性。** 这个边权衡量的是历史数据上的额外判断价值。

例如，已经检查请求频率后，再查高度重复的频率指标，新增信息可能很少；而检查访问时间是否呈固定间隔，可能提供新的判断证据。没有新增判别信息的候选，其条件信息增益就会接近零。

**异常分回退机制**：格内样本不足时该估计会虚高，此时按样本量把权重连续地从信息增益切换到该特征已有的异常分。

$$w(u \to v) = \lambda_{uv}\,\hat{I}(Y; X_v \mid X_u) + (1 - \lambda_{uv})\,\tilde{a}(v)$$

<div class="echo" markdown="1">
<span class="echo-tag">↔ 与我的论文呼应</span>
这与VR-OPD里的正确性门控收缩**结构完全一致**：证据弱时退回一个**已有的、可用的基线**，而不是退回零。VR-OPD退回的是原始OPD，这里退回的是旧风控体系已有的异常分。
</div>

### ④ 按成本排序

每个特征背后是一到多个subagent调用，成本差异很大，所以排序用的是**单位成本的信息量**：

$$\mathrm{score}(v) = \frac{I(Y; X_v \mid X_u)}{\mathrm{cost}(v)}$$

第一轮使用$I(Y; X_v)/\mathrm{cost}(v)$；后续轮次使用条件信息增益衡量额外价值。每轮将Top-N候选送入上下文，由Planner选择并调用对应的subagent，获取结果后进入下一轮。

「减少无效探索」因此有了精确含义：**用更少的subagent调用达到同样的判别力。**

### ⑤ 增量维护

反爬属于**对抗场景**，爬虫策略持续演化，今天没有判别力的特征明天可能成为最强特征，因此边权必须周期性重估。

但新架构只执行被选中的检查，未被选中的特征没有取值、无法用于估计，所以要保留约1%的账户继续走全量路径。

<div class="echo" markdown="1">
<span class="echo-tag">↔ 与我的论文呼应</span>
图谱判定不重要的特征将不再被采集，也就不再有机会被重新评估。这与MCPO里轮次级轨迹剪枝要治的病是同一个——**抑制自我强化的曝光偏置**，只是MCPO作用于策略采样，这里作用于数据采集。
</div>

做法：按固定周期把这1%账户的全量特征与事后标签并入历史数据，重算一遍边权。

图谱本身会变，策略侧也得为此做好准备——这就是下一屏「图谱扰动」的动机。

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 两阶段后训练</span>
## 建立拒绝采样数据飞轮

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">多轨迹采样</span><span class="pipe-desc">对同一任务采样多条候选轨迹</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">真实执行</span><span class="pipe-desc">每条轨迹真实跑一遍，拿到执行结果</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">打分与拒绝</span><span class="pipe-desc">结果错的直接丢弃，其余按覆盖率与节点数打分</span></div>
</div>

评分分两层：**最终判断是否正确是硬门槛**，错的直接丢弃；通过门槛的再看两项——**关键路径覆盖率**越高越好，**运行节点个数**越少越好。前者衡量看得准不准，后者衡量看得省不省。

打分既不依赖人工主观判断，也不依赖模型自评，而是**来自真实执行结果**。

## SFT数据与DPO正负样本对

高分轨迹直接作为**SFT数据**；同一任务下的高分与低分轨迹配成**DPO的正负样本对**。两个阶段用的是同一份采样，只是取用方式不同。

## 把论文里的掩码思想迁移过来

我把 [MCPO](/papers/mcpo/) 里的**掩码**思想迁移到了这里，设计了图谱扰动：训练时对图谱施加扰动以模拟状态漂移，迫使策略去学习**底层能力**，而不是死记特定的路径形态。

掩码要解决的是「策略记住了表面标识而没学到能力」，**这个问题与用什么算法优化无关**，所以能从RL平移到DPO的数据构造。

</div>

<div class="slide" markdown="1">
<span class="slide-no">04 ／ Skill自进化闭环</span>
## 由人工业务知识驱动的Skill自进化迭代循环

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

</div>

<div class="slide" markdown="1">
<span class="slide-no">05 ／ 最终结果</span>

<div class="stats" markdown="1">
<div class="stat"><span class="stat-num">24<small>%</small></span><span class="stat-lab">端到端任务耗时<br>降低</span></div>
<div class="stat"><span class="stat-num">4.07<small>%</small></span><span class="stat-lab">四项核心业务指标<br>平均提升</span></div>
</div>

</div>

<div class="talk-nav" markdown="1">
[返回主页](/)　·　[MCPO →](/papers/mcpo/)
</div>

</div>
