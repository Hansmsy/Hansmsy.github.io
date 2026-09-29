---
title: "阿里巴巴实习"
permalink: /experience/alibaba/
author_profile: false
description: "阿里巴巴集团大模型算法实习：多轮Planner-Subagent智能体的决策约束、两阶段后训练与Skill自进化闭环。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# 阿里巴巴集团 · 大模型算法实习

<div class="talk-meta" markdown="1">
**阿里安全部-账户行为算法团队** ｜ **2026.05 – 2026.09** ｜ 大模型算法实习生 ｜ 负责Planner模块与子决策模块的优化
</div>

<div class="paper-tags"><span class="paper-tag">智能体</span><span class="paper-tag">SFT + DPO</span><span class="paper-tag">数据飞轮</span><span class="paper-tag">Skill自进化</span></div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">工作总览</span>
<figure class="exp-overview">
  <img src="{{ '/images/alibaba-overview.png' | relative_url }}" alt="账户行为分析智能体工作总览：图谱增强决策、策略冷启动与双重帕累托前沿自进化机制">
</figure>
</div>

<div class="slide" markdown="1">
<span class="slide-no">智能体架构</span>
<figure class="exp-overview">
  <img src="{{ '/images/alibaba-agent-architecture.png' | relative_url }}?v=df686b9" alt="用户信息与指令输入Planner，Planner按需调度多个Subagent，每个Subagent配置多个Skill与Tool，执行结果与证据回传用于多轮决策，满足终止条件后输出标签">
</figure>
</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与目标</span>
## 业务背景：账户行为分析

面向淘天账户行为分析场景，智能体需要综合用户的多维信息，输出**四项业务标签**，为账户风险判断提供依据。在强对抗环境下，账户行为与异常模式持续变化，系统既要保证分析质量，也要控制执行耗时与调用成本。

原有系统采用**单轮Agent架构**，每个账户都执行全部Subagent，缺少按需选择与动态规划能力。为减少冗余调用，推动系统向**多轮Planner-Subagent协作范式**演进：由Planner根据当前证据规划下一步，按需调度Subagent，并结合返回结果继续决策。

## 核心问题：如何让多轮决策高效、稳定且持续适应业务

多轮架构赋予了系统选择能力，也对规划策略提出了新的要求：

<div class="cards" markdown="1">
<div class="card"><span class="card-t">候选空间大，探索成本高</span><span class="card-d">候选动作与上下文信息繁杂，Planner难以识别高价值路径，容易产生无效探索与冗余调用。</span></div>
<div class="card"><span class="card-t">决策链路长，策略不稳定</span><span class="card-d">多轮决策依赖前序证据与执行反馈，需要通过高质量轨迹训练，建立稳定的规划与选择能力。</span></div>
<div class="card"><span class="card-t">业务持续变化，策略需要更新</span><span class="card-d">对抗行为与业务状态不断变化，需要从失败案例中定位问题，持续优化模型与Harness。</span></div>
</div>

## 工作目标：从决策约束到持续自进化

<div class="claim" markdown="1">
我负责**Planner模块与子决策模块的优化**，围绕分析质量、执行效率与业务适应性，推进三项工作：**先约束决策空间，再完成策略冷启动，最后建立持续自进化闭环**。
</div>

1. **图谱增强决策**：为Planner提供高价值候选路径，减少无效探索与错误调用，降低任务耗时。
2. **策略冷启动**：构建高质量轨迹数据，通过SFT + DPO两阶段后训练与图谱扰动，提升多轮规划能力及对业务变化的适应性。
3. **双重帕累托前沿自进化机制**：建立失败定位、模型与Harness分路优化及版本筛选流程，兼顾正常与异常账户的分析质量。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 图谱约束的决策</span>

### 动机：让Planner知道下一步值得查什么

账户分析涉及大量候选特征与Subagent。全量执行成本高，直接让Planner自由探索又容易重复检查、偏离关键路径。因此，需要把历史业务经验转化为**可检索的决策图谱**，为每轮规划提供少量高价值候选。

### 做法：离线建图，在线筛选，持续更新

1. **构建特征图谱**：利用历史全量执行轨迹与事后标签建图。节点代表特征，对应具体Subagent；有向边表示已知一个特征后，检查另一个特征还能带来多少额外判断信息。
2. **逐轮约束候选**：第一轮看单个特征的信息增益，后续轮次看新增信息，并结合调用成本排序。将Top-N候选交给Planner选择，执行后根据反馈进入下一轮，减少重复检查与无效探索。
3. **保持图谱有效**：样本不足时结合已有异常分回退；保留少量全量探索数据，周期性更新边权，让暂时未被选中的特征仍有机会重新进入候选集。

<figure class="exp-overview">
  <img src="{{ '/images/alibaba-graph-examples.svg' | relative_url }}?v=2" alt="圆形节点图谱：从已确定的请求频率向外扩展，以绿色节点和粗箭头突出访问间隔、行为序列等高增益检测候选，以灰色虚线表示低增益候选">
  <figcaption>从已确定特征向外扩展，优先筛选新增增益较高的检测特征。节点名称与增益高低仅作示意，图中展示部分连接。</figcaption>
</figure>

### 增益怎么理解：多查一项，能减少多少不确定性

例如，已经知道请求频率后，再查相近的频率指标可能帮助不大，而访问间隔可以补充新的判断证据。**增益由历史样本上的平均不确定性变化估计**，再结合执行成本衡量检查价值；线上不需要知道当前账户的真实标签。

<figure class="exp-overview">
  <img src="{{ '/images/alibaba-information-gain.svg' | relative_url }}?v=1" alt="假设已知请求频率后的平均不确定性为0.60 bit，检查重复频率指标后为0.55，增益0.05；检查访问间隔后为0.25，增益0.35。示例成本均为1，因此优先访问间隔">
  <figcaption>数值均为示例，非业务实验结果。后续轮次用特征间的两两条件增益估计新增价值。</figcaption>
</figure>

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 策略冷启动</span>
<figure class="exp-overview">
  <img src="{{ '/images/alibaba-policy-warm-start.png' | relative_url }}?v=20260929-v2" alt="策略冷启动流程：左侧Max教师优质轨迹用于SFT，右侧SFT后的27B采样构建DPO偏好对，比较结果正确性、关键路径SOP覆盖情况和执行成本">
</figure>

### 动机：建立稳定的多轮规划策略

图谱提供了候选范围，Planner仍需要学会如何选择检测路径、利用执行反馈以及适时终止。以**Qwen3.8-27B**为学生模型，采用**教师示范SFT + 学生轨迹DPO**完成策略冷启动。

### 教师示范：筛选Max优质轨迹进行SFT

使用**Qwen-3.8 Max**生成多轮规划与工具调用轨迹，经真实执行验证后，筛选判断正确、证据充分、调用有效的轨迹训练27B，使其掌握任务规划与执行流程。失败轨迹不进入SFT示范集。

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">教师示范</span><span class="pipe-desc">Max生成轨迹，经执行验证后筛选SFT数据</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">学生采样</span><span class="pipe-desc">SFT后的27B对同一任务采样多条轨迹</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">偏好优化</span><span class="pipe-desc">依据执行结果构建偏好对，进行DPO训练</span></div>
</div>

### 学生采样：围绕自身决策构建DPO偏好对

由**完成SFT后的27B**在同一任务、同一初始环境下采样多条轨迹，分别执行并比较结果，构建chosen / rejected偏好对。以学生自身轨迹为主，让训练覆盖其实际会遇到的错误与低效路径。

偏好判定以**真实执行结果**为主要依据：

1. **先比较正确性与证据充分性**：优先判断正确、关键证据完整的轨迹，将有学习价值的误判、漏判或关键调用失败轨迹保留为rejected。
2. **质量相当时再比较成本**：优先冗余调用更少、耗时更低的轨迹，避免策略通过减少必要检查来追求低成本。
3. **筛除模糊偏好，补充难例**：质量差异不明确时不强行配对；学生全部失败时，可由Max生成或修正轨迹，经执行验证后补充chosen。Max辅助评审，模型来源本身不决定优劣。

### 图谱扰动：适应业务变化

迁移本人论文 [MCPO](/papers/mcpo/) 的掩码思想，在训练数据构造中引入**图谱扰动**，模拟业务状态变化，减少策略对固定路径的依赖。同一偏好对使用一致的初始图谱与环境条件，保证轨迹之间的比较有效。

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
