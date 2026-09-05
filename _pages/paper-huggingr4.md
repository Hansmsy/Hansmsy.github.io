---
title: "HuggingR⁴"
permalink: /papers/huggingr4/
author_profile: false
description: "HuggingR⁴：首个把仓库级模型选择从一次性检索重构为迭代推理的框架，EMNLP 2026 Main Conference 录用。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# HuggingR⁴: A Progressive Reasoning Framework for Discovering Optimal Model Companions

<div class="talk-authors" markdown="1">
**Shaoyin Ma**, Chenggong Hu, Huiqiong Wang, Li Sun, Mingli Song, Jie Song
</div>

<div class="talk-meta" markdown="1">
**EMNLP 2026 Main Conference** ｜ 第一作者 ｜ [arXiv:2511.18715](https://arxiv.org/abs/2511.18715) ｜ [PDF](https://arxiv.org/pdf/2511.18715)<br>
<span style="color:#c53030">入选滑铁卢大学Renée J. Miller教授研究生课程 <a href="https://rjmillerlab.github.io/CS848.Summer.2026/W7.html">CS 848</a> 必读论文，并作课堂专题研讨</span>
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 任务</span>
## 智能体要从200万个模型里挑工具，而这件事目前做不到

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">INPUT</span><span class="pipe-name">自然语言请求</span><span class="pipe-desc">「帮我识别这张法文书封上的字」</span></div>
<div class="pipe-step"><span class="pipe-tag">REPOSITORY</span><span class="pipe-name">Hugging Face</span><span class="pipe-desc">200万+候选，持续演化，元数据不全</span></div>
<div class="pipe-step"><span class="pipe-tag">OUTPUT</span><span class="pipe-name">最优模型</span><span class="pipe-desc">能跑、格式对、领域匹配</span></div>
</div>

和调用一组**固定的API工具**完全不同——候选是海量的、每天在变的、描述还残缺。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 痛点</span>
## 已有做法把所有模型描述塞进提示词，于是token爆炸且还选错

<div class="stats" markdown="1">
<div class="stat stat--bad"><span class="stat-num">61,512</span><span class="stat-lab">直接提示消耗的token<br>而且选错了</span></div>
<div class="stat"><span class="stat-num">8,934</span><span class="stat-lab">HuggingR⁴消耗的token<br>并且选对了</span></div>
</div>

<figure>
  <img src="/images/r4-prompt.jpg" alt="直接提示与HuggingR⁴的对比">
  <figcaption><b>Figure 1</b>　同一个查询，左边把全部描述塞进提示词，右边经多轮推理逐步收窄。</figcaption>
</figure>

三个结构性困难：

- **信息不对称** — 元数据残缺含噪，遮蔽了查询到模型卡的映射
- **计算不可行** — 候选基数太大，「对全部描述做一次大模型推理」根本跑不动
- **语义漂移** — 用户口语和模型卡的技术粒度之间，需要多轮才能对齐

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 核心主张</span>

<div class="claim" markdown="1">
不要把模型选择当作**一次性检索**，把它当作**迭代推理过程**。
</div>

## 推理 → 检索 → 精炼 → 反思，四阶段渐进收敛

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STAGE I</span><span class="pipe-name">推理 Reasoning</span><span class="pipe-desc">分解意图，合成检索策略</span></div>
<div class="pipe-step"><span class="pipe-tag">STAGE I</span><span class="pipe-name">检索 Retrieval</span><span class="pipe-desc">双流检索，多轮收窄候选</span></div>
<div class="pipe-step"><span class="pipe-tag">STAGE II</span><span class="pipe-name">精炼 Refinement</span><span class="pipe-desc">读完整模型卡，细粒度裁决</span></div>
<div class="pipe-step"><span class="pipe-tag">STAGE III</span><span class="pipe-name">反思 Reflection</span><span class="pipe-desc">零信任审计，不通过就前滑重来</span></div>
</div>

<figure>
  <img src="/images/r4-workflow.png" alt="HuggingR⁴完整工作流">
  <figcaption><b>Figure 2</b>　完整工作流，实例是「为法文书封图片选OCR模型」。上半是Stage I的三轮推理–检索循环，约束逐步从「OCR能力」→「训练集含书封」→「需法语能力」收窄；右下是Stage III自反思的两个分支——通过则输出，不通过则<b>回溯至Stage I</b>。</figcaption>
</figure>

<details markdown="1">
<summary>展开：三个阶段各自的关键设计</summary>
<div class="details-body" markdown="1">

**Stage I 的四个设计**

- **模型卡语义蒸馏** — 剪除URL、冗余引用、机构模板话术，规范化技术规格，从源头抑制提示膨胀
- **意图分解与查询合成** — 功能分解 (高层需求 → 「低延迟」「量化」等技术约束)、词表映射 (口语 ↔ 仓库术语)、策略选择
- **双流自适应检索** — 直接流编码完整蒸馏描述抓宽泛功能语义；元数据流用结构化属性优先满足语言 / 数据集 / 许可证等硬约束；再以多查询增强生成语义多样的变体
- **失败追溯与回溯** — 比较元数据检索结果与直接流样本的语义密度，偏离超过 $\theta$ 判为元数据诱发失败，触发回溯改写查询策略，**阻止检索错误传播到精炼阶段**

**Stage II** — 从「找到相关的」转向「找到最优的」。纯嵌入检索分不清那些高层描述相似、但量化格式 / 库依赖 / 边缘性能迥异的模型。候选收窄到 $N$ 个后，精炼智能体拿到**完整模型卡**，沿技术兼容性、性能基准、指令契合度三轴交叉验证。

**Stage III** — Stage I 只在标识与蒸馏元数据上推理，可能停在「看起来合适、但缺少深层文档里那个具体功能」的局部最优。反思做一次**零信任审计**（张量约束、许可限制、硬件要求）。失败时不终止，而是：冻结当前窗口 → 窗口前滑 $N$ 位 → 带着**失败轨迹的上下文**重新进入 Stage I。

</div>
</details>

</div>

<div class="slide" markdown="1">
<span class="slide-no">04 ／ 为什么能扩展</span>
## 上下文消耗被封顶在窗口内，式子里不含仓库规模

<div class="claim" markdown="1">
$$\text{直接提示：} O(\lvert D \rvert \cdot L) \qquad \Longrightarrow \qquad \text{HuggingR}^4\text{：} O(N \cdot L)$$
</div>

- $N$ = 窗口大小（默认 **3**），$L$ = 模型卡平均长度，$\lvert D \rvert$ = 仓库规模
- 高保真的大模型分析**只发生在窗口内的 $N$ 个候选**上
- 因为 $N \ll \lvert D \rvert$，同时也规避了长上下文的 lost-in-the-middle
- **式中不含 $\lvert D \rvert$ —— 所以计算成本与仓库规模在结构上解耦**

这是整篇工作可扩展性的**唯一来源**，也是我认为最值得讲的一点。

</div>

<div class="slide" markdown="1">
<span class="slide-no">05 ／ 结果</span>
## 同一底座下，两项指标绝对提升26.51与33.25个百分点

<div class="stats" markdown="1">
<div class="stat"><span class="stat-num">92.03<small>%</small></span><span class="stat-lab">Workability<br>基线 65.52</span></div>
<div class="stat"><span class="stat-num">82.46<small>%</small></span><span class="stat-lab">Reasonability<br>基线 49.21</span></div>
<div class="stat"><span class="stat-num">−85.6<small>%</small></span><span class="stat-lab">token开销<br>较直接提示</span></div>
</div>

指标口径（都由领域专家逐条标注）：

- **Workability** — 任务类型匹配 + 输入输出格式兼容 + 可执行，**三条全满足**才计1分
- **Reasonability** — 在可用模型中，进一步要求训练数据领域相关且性能进入候选内top-5
- 难度参照：平均每条请求只有 **8.3** 个可用模型、**2.1** 个合理模型

三条值得主动讲的读法：

- **增益来自框架，不是底座** — Qwen2.5-7B 这种小开源模型也从 56.59 → 85.73，绝对提升 **29.14** 个点
- **token是恒定的** — 直接提示与 HuggingGPT 随候选数**线性增长**，HuggingR⁴ **几乎水平**
- 在 9 个不同底座上都稳定有效，最均衡的是 GPT-4o-mini

<figure>
  <img src="/images/r4-token.png" alt="token开销对比">
  <figcaption><b>Figure 3</b>　token消耗随候选数的变化（对数坐标）。蓝线（直接提示）与橙线（HuggingGPT）持续上升，红线（HuggingR⁴）与绿线（仅检索变体）几乎水平。30候选时四个点分别是 61,512 / 8,878 / 2,344 / 344 —— <b>斜率差就是 $O(\lvert D \rvert \cdot L)$ 与 $O(N \cdot L)$ 的可视化</b>。</figcaption>
</figure>

<details markdown="1">
<summary>展开：9个底座的完整对比表 + 多任务场景</summary>
<div class="details-body" markdown="1">

单任务数据集，基线为 HuggingGPT，同一底座下对比，「–」表示 API 不支持：

| LLM底座 | HuggingGPT WR | HuggingGPT RR | HuggingR⁴ WR | HuggingR⁴ RR |
| :-- | --: | --: | --: | --: |
| GPT-4o-mini | 65.52 | 49.21 | **92.03** | **82.46** |
| GPT-4o | 75.20 | 60.70 | 91.14 | 82.09 |
| GPT-4.1-mini | 66.44 | 50.79 | 91.04 | 82.38 |
| GPT-4.1 | 74.80 | 60.73 | 91.43 | **83.86** |
| Qwen3-235b-a22b | 72.54 | 58.46 | 86.90 | 77.85 |
| Claude-Sonnet-4 | 78.64 | 64.86 | 90.85 | 81.59 |
| Deepseek-R1 | 78.94 | 66.83 | – | – |
| Gemini-2.5-Flash | 81.20 | 68.50 | – | – |
| Qwen2.5-7b | 56.59 | 41.83 | 85.73 | 76.31 |

多任务场景（GPT-4o-mini + text-embedding-3-large，任务规划沿用 HuggingGPT 方案）：

| 方法 | Workability | Reasonability |
| :-- | --: | --: |
| HuggingGPT | 68.08 | 51.44 |
| HuggingR⁴* (仅检索) | 78.27 | 69.86 |
| **HuggingR⁴** | **85.03** | **75.73** |

**关键超参**：窗口 $N=3$、检索候选 $k=5$、多查询 $K=4$、失败追溯阈值 $\theta=80\%$、嵌入 text-embedding-3-large、结果取 3 次独立运行平均。

$N$ 的性能峰值其实在 $N=4$ (92.35 / 83.07)，但 $N$ 直接乘在 $O(N \cdot L)$ 上——多处理一整份模型卡只换来约 0.3 个点，所以默认取 3。$k$ 先升后降，$k=5$ 是真峰值，再大候选池噪声过多。

</div>
</details>

</div>

<div class="slide" markdown="1">
<span class="slide-no">06 ／ 消融</span>
## 三个模块各治一种病，不该用同一把尺子衡量

<div class="cards" markdown="1">
<div class="card"><span class="card-delta">RR −4.80</span><span class="card-t">失败追溯</span><span class="card-d">精炼阶段前的最大精度贡献者，专治元数据缺失导致的错配</span></div>
<div class="card"><span class="card-delta">WR −6.70</span><span class="card-t">自反思</span><span class="card-d">主要拦功能性不匹配，与它审计张量约束 / 许可 / 硬件的职责一致</span></div>
<div class="card"><span class="card-delta">约 −1</span><span class="card-t">滑动窗口</span><span class="card-d"><b>效率组件而非精度组件</b>：以约1个点换取成本与仓库规模完全解耦</span></div>
</div>

滑动窗口这条尤其要讲清楚——移除它精度几乎不掉，但 token 会从常数变成线性。**它的价值不在精度表里。**

<details markdown="1">
<summary>展开：完整消融表</summary>
<div class="details-body" markdown="1">

GPT-4o-mini + text-embedding-3-large。HuggingR⁴* 为移除精炼与反思的纯检索变体：

| 配置 | Workability | Reasonability |
| :-- | --: | --: |
| **HuggingR⁴\*** | 84.77 | 75.56 |
| 　w/o 多查询增强 | 82.94 | 71.63 |
| 　w/o 语义蒸馏 | 81.36 | 71.26 |
| 　w/o 元数据流 | 78.97 | 69.82 |
| **HuggingR⁴** | **92.03** | **82.46** |
| 　w/o 失败追溯 | 88.09 | 77.66 |
| 　w/o 自反思 | 85.33 | 80.21 |
| 　w/o 滑动窗口 | 90.98 | 81.30 |

</div>
</details>

</div>

<div class="slide" markdown="1">
<span class="slide-no">07 ／ 基准</span>
## 顺手建了这个方向上目前最大的评测基准

<div class="stats" markdown="1">
<div class="stat"><span class="stat-num">14,399</span><span class="stat-lab">用户请求<br>单任务1,016 + 多任务13,383</span></div>
<div class="stat"><span class="stat-num">37</span><span class="stat-lab">任务类别<br>覆盖视觉 / 语言 / 音频</span></div>
<div class="stat"><span class="stat-num">5</span><span class="stat-lab">领域专家<br>交叉审核</span></div>
</div>

- 多任务场景由单任务请求组合而成，每个含 2–5 个任务
- 三条审核标准：**领域一致性、语义连贯性、技术可行性**，不过任一条则修订或丢弃
- 与数据驱动方法相比，这种**查询驱动**范式的好处：非专家能用自然语言表达需求、可无缝对接持续更新的社区、任务覆盖面广（已有方法通常只 1–3 类）

</div>

<div class="slide" markdown="1">
<span class="slide-no">08 ／ 局限</span>
## 三个我自己认为还没解决的问题

- **多任务仍有明显回落** — 85.03 / 75.73 对比单任务的 92.03 / 82.46。瓶颈在任务规划与依赖编排，这块我们直接沿用了 HuggingGPT，没有改进。
- **对底座的推理风格敏感** — Claude-Sonnet-4 在反思阶段**过度分析**，筛得太严而淘汰了本该合适的候选；Qwen3-235B 则在 Stage I **迭代过多难收敛**。反思的严格度目前由底座「性格」决定，而不是一个可控参数——这是我认为最值得形式化的问题。
- **规模验证靠的是结构而非实测** — token 恒定的趋势实验里确立了，但可扩展性的主要依据是 $O(N \cdot L)$ 这个结构性保证，不是在超大仓库上的端到端实测。

</div>

<div class="talk-nav" markdown="1">
[← 返回主页](/)　·　[MCPO →](/papers/mcpo/)
</div>

</div>
