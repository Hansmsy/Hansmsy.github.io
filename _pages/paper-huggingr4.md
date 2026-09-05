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
<span class="slide-no">01 ／ 背景与动机</span>
## 一个好的智能体往往都有一个好的工具库

现在的智能体多少都有自己独有的工具：

<div class="cards" markdown="1">
<div class="card"><span class="card-t">编码智能体</span><span class="card-d">Claude Code、Qoder 这类——读代码、改文件、跑测试</span></div>
<div class="card"><span class="card-t">淘宝电商智能体</span><span class="card-d">读购物车、比价、查物流</span></div>
<div class="card"><span class="card-t">办公智能体</span><span class="card-d">WorkBuddy 这类——写文档、做总结、排日程</span></div>
</div>

<div class="claim" markdown="1">
但它们都只在**自己的领域**里表现好——一旦跳出领域就迅速变差，因为工具库本身是**专用**的。
</div>

## 那能不能给它一个足够完备的工具库？

我的选择是 **Hugging Face**：把整个模型仓库当成工具库，让一个大模型去调用里面的所有模型，来完成用户各式各样的日常问题。

200万+模型，天然覆盖视觉 / 语言 / 音频 / 多模态，覆盖多个通用与专业领域（法律、医学、数学、教育、监管）。

## 但是有三个问题：

- **规模巨大** — 候选数以百万计，不是一组固定的API工具
- **持续变化** — 每天都在新增与更新，静态的选择策略很快就过时
- **元数据经常缺失** — 模型卡残缺或含噪，遮蔽了查询到模型的映射

<div class="claim" markdown="1">
沿用之前的做法——把全部模型卡直接注入prompt——在这个规模下彻底失效。所以我提出了 **HuggingR⁴**：一个渐进式迭代的选择智能体。
</div>

<figure class="fig-lg">
  <img src="/images/r4-prompt.jpg" alt="直接提示与HuggingR⁴的对比">
  <figcaption><b>Figure 1</b>　同一个查询，左边把全部描述塞进提示词，右边经多轮推理逐步收窄。</figcaption>
</figure>

这三个特性共同导致三类结构性困难，它们分别对应后续三个阶段的设计目标：

- **信息不对称** — 元数据残缺含噪，查询到模型卡的映射被遮蔽
- **计算不可行** — 候选基数太大，对全部描述做一次大模型推理在成本上不可行
- **语义漂移** — 用户口语与模型卡的技术粒度之间存在距离，需多轮分解才能对齐

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 方法</span>
## 把一次性检索重构为迭代推理：推理 → 检索 → 精炼 → 反思

<figure>
  <img src="/images/r4-workflow.png" alt="HuggingR⁴完整工作流">
  <figcaption><b>Figure 2</b>　完整工作流，实例是「为法文书封图片选OCR模型」。上半是Stage I的三轮推理–检索循环，约束逐步从「OCR能力」→「训练集含书封」→「需法语能力」收窄；左下是Stage II读取完整模型卡做精炼；右下是Stage III自反思的两个分支——通过则输出，不通过则<b>回溯</b>。</figcaption>
</figure>

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STAGE I</span><span class="pipe-name">推理 Reasoning</span><span class="pipe-desc">分解意图，合成检索策略</span></div>
<div class="pipe-step"><span class="pipe-tag">STAGE I</span><span class="pipe-name">检索 Retrieval</span><span class="pipe-desc">双流检索，多轮收窄候选</span></div>
<div class="pipe-step"><span class="pipe-tag">STAGE II</span><span class="pipe-name">精炼 Refinement</span><span class="pipe-desc">读完整模型卡，细粒度裁决</span></div>
<div class="pipe-step"><span class="pipe-tag">STAGE III</span><span class="pipe-name">反思 Reflection</span><span class="pipe-desc">零信任审计，不通过就前滑重来</span></div>
</div>

框架里五个关键设计：

### ① 语义蒸馏

原始模型卡里大量内容是没有信息量的——URL、冗余引用、机构模板话术。语义蒸馏把这些剪掉并**规范化技术规格**，让后续推理在高密度的语义表示上进行。这是**从源头抑制提示膨胀**，而不是事后压缩。

### ② 双流检索

针对元数据稀疏，同时维护两路嵌入：

- **直接流** — 编码完整的蒸馏描述，捕捉宽泛的功能语义
- **元数据流** — 用结构化属性，优先满足语言 / 数据集 / 许可证这类**硬约束**

单靠直接流会漏掉硬约束，单靠元数据流会被残缺的元数据带偏，所以两路并行。

### ③ 改进的多查询增强

不是只用用户原句去检索，而是**生成语义多样的查询变体**再拼接检索。用户的一句话往往只覆盖需求的一个侧面，多个变体能把召回面撑开，对含噪元数据的鲁棒性也更好。

### ④ 失败溯洄

公开仓库的元数据常常缺失甚至误导，**检索阶段的错误如果流到精炼阶段，后面再怎么算都是错的**。所以在元数据约束检索完成后，系统把它的结果集与直接流样本做语义密度比较，若偏离超过阈值 $\theta$，就判定为**元数据诱发的失败**并触发溯洄——迫使推理智能体改写查询合成策略，把错误挡在精炼阶段之前。

### ⑤ 滑动窗口

<figure>
  <img src="/images/r4-window.png" alt="滑动窗口策略">
  <figcaption><b>Figure 4</b>　滑动窗口策略。仓库被看作一排按初始语义相似度降序排列的候选，每个方块是一个模型——<b>方块的颜色编码的是系统对该模型卡的访问权限</b>：无访问 / 仅模型ID / 完整模型卡 / 已选中。</figcaption>
</figure>

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">STEP 1</span><span class="pipe-name">冻结</span><span class="pipe-desc">当前窗口标记为「已耗尽」，缓存进推理历史，避免重复处理</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 2</span><span class="pipe-name">前滑</span><span class="pipe-desc">窗口在全局排序列表上向前滑动 $N$ 个位置（图中的 <code>K += N</code>）</span></div>
<div class="pipe-step"><span class="pipe-tag">STEP 3</span><span class="pipe-name">递归恢复</span><span class="pipe-desc">重新进入 Stage I，但此时已带着<b>先前失败轨迹</b>的上下文</span></div>
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 为什么能扩展</span>
## 上下文消耗被封顶在窗口内，式子里不含仓库规模

<div class="claim" markdown="1">
$$\text{直接提示：} O(\lvert D \rvert \cdot L) \qquad \Longrightarrow \qquad \text{HuggingR}^4\text{：} O(N \cdot L)$$
</div>

- $N$ = 窗口大小（默认 **3**），$L$ = 模型卡平均长度，$\lvert D \rvert$ = 仓库规模
- 高保真的大模型分析**只发生在窗口内的 $N$ 个候选**上
- 因为 $N \ll \lvert D \rvert$，同时也规避了长上下文的 lost-in-the-middle
- **式中不含 $\lvert D \rvert$ —— 所以计算成本与仓库规模在结构上解耦**

<figure>
  <img src="/images/r4-token.png" alt="token开销对比">
  <figcaption><b>Figure 3</b>　token消耗随候选数的变化（对数坐标）。蓝线（直接提示）与橙线（HuggingGPT）持续上升，红线（HuggingR⁴）与绿线（仅检索变体）几乎水平。30候选时四个点分别是 61,512 / 8,878 / 2,344 / 344 —— <b>斜率差就是 $O(\lvert D \rvert \cdot L)$ 与 $O(N \cdot L)$ 的可视化</b>。</figcaption>
</figure>

在30个候选时，token较直接提示减少 **85.6%**；而随着候选数继续增长，这个差距还会拉大——因为一边是常数，一边是线性。

</div>

<div class="slide" markdown="1">
<span class="slide-no">04 ／ 实验</span>
## 数据集与评价指标

为支撑严格评测，我们构建了配套基准 **ModelSelect-Bench**：

<div class="stats" markdown="1">
<div class="stat"><span class="stat-num">14,399</span><span class="stat-lab">用户请求<br>单任务1,016 + 多任务13,383</span></div>
<div class="stat"><span class="stat-num">37</span><span class="stat-lab">任务类别<br>覆盖视觉 / 语言 / 音频</span></div>
<div class="stat"><span class="stat-num">5</span><span class="stat-lab">领域专家<br>交叉审核</span></div>
</div>

- 多任务场景由单任务请求组合而成，每个含 2–5 个任务
- 审核标准三条：**领域一致性、语义连贯性、技术可行性**，不过任一条则修订或丢弃
- 与依赖数据集元特征、需离线训练、任务覆盖通常只 1–3 类的数据驱动方法相比，这种**查询驱动**范式让非专家能用自然语言表达需求，也能无缝对接持续更新的社区

两项指标都由领域专家逐条标注：

- **Workability** — 任务类型匹配 + 输入输出格式兼容 + 可在Hub或本地执行，**三条全满足**才计1分
- **Reasonability** — 在可用模型中，进一步要求训练数据领域相关，且性能进入候选内top-5
- 难度参照：平均每条请求只有 **8.3** 个可用模型、**2.1** 个合理模型

### 主结果

<div class="stats" markdown="1">
<div class="stat"><span class="stat-num">93.01<small>%</small></span><span class="stat-lab">Workability<br>较SOTA +17.81</span></div>
<div class="stat"><span class="stat-num">84.25<small>%</small></span><span class="stat-lab">Reasonability<br>较SOTA +23.13</span></div>
<div class="stat"><span class="stat-num">6.9<small>×</small></span><span class="stat-lab">token消耗<br>降低倍数</span></div>
</div>

<figure>
  <img src="/images/r4-table1.png" alt="Table 1 主结果">
  <figcaption><b>Table 1</b>　十个底座上的对比。三组分别是 HuggingGPT（基线）、HuggingR⁴*（去掉精炼与反思的纯检索变体）、HuggingR⁴（完整）。</figcaption>
</figure>

三条值得主动讲的读法：

- **最好成绩在 GPT-5.4 上**：93.01 / 84.25，较同底座的 HuggingGPT（75.20 / 61.12）绝对提升 **17.81** 与 **23.13** 个百分点
- **增益来自框架，不是底座** — Qwen2.5-7B 这种小开源模型也从 56.59 / 41.83 提到 85.73 / 76.31，绝对提升 **29.14** 与 **34.48** 个点；GPT-4o-mini 上的提升更是 **26.51** 与 **33.25**
- **中间那一列是关键对照** — HuggingR⁴* 只做检索就已经大幅超过 HuggingGPT，说明前四个设计各自有效；而从 HuggingR⁴* 到 HuggingR⁴ 又有一次跃升，那是精炼与反思带来的

### 消融

<figure>
  <img src="/images/r4-table6.png" alt="Table 6 模块消融">
  <figcaption><b>Table 6</b>　逐模块消融（GPT-4o-mini + text-embedding-3-large）。上半组以纯检索变体 HuggingR⁴* 为基准，下半组以完整 HuggingR⁴ 为基准。</figcaption>
</figure>

三个模块分工清晰，**不该用同一把尺子衡量**：

<div class="cards" markdown="1">
<div class="card"><span class="card-delta">RR −4.80</span><span class="card-t">失败溯洄</span><span class="card-d">精炼阶段前的最大精度贡献者，专治元数据缺失导致的错配</span></div>
<div class="card"><span class="card-delta">WR −6.70</span><span class="card-t">自反思</span><span class="card-d">主要拦功能性不匹配，与它审计张量约束 / 许可 / 硬件的职责一致</span></div>
<div class="card"><span class="card-delta">约 −1</span><span class="card-t">滑动窗口</span><span class="card-d"><b>效率组件而非精度组件</b>：以约1个点换取成本与仓库规模完全解耦</span></div>
</div>

滑动窗口这条尤其要讲清楚——移除它精度几乎不掉，但token会从常数变成线性。**它的价值不在这张精度表里。**

<details markdown="1">
<summary>展开：关键超参与取值理由</summary>
<div class="details-body" markdown="1">

窗口 $N=3$、检索候选 $k=5$、多查询 $K=4$、失败溯洄阈值 $\theta=80\%$、嵌入 text-embedding-3-large、结果取 3 次独立运行平均。

<figure>
  <img src="/images/r4-table7.png" alt="Table 7 超参敏感性">
  <figcaption><b>Table 7</b>　窗口大小 $N$ 与检索候选数 $k$ 的影响。</figcaption>
</figure>

$N$ 的性能峰值其实不在默认值上，但 $N$ 直接乘在 $O(N \cdot L)$ 上——多处理一整份完整模型卡只换来零点几个点，所以默认取 3 作为效率与性能的平衡点。$k$ 则是先升后降，超过峰值后候选池噪声过多反而下降。

</div>
</details>

</div>

<div class="slide" markdown="1">
<span class="slide-no">05 ／ 局限</span>
## 三个我自己认为还没解决的问题

- **多任务仍有明显回落** — 85.03 / 75.73 对比单任务的 92.03 / 82.46。瓶颈在任务规划与依赖编排，这块我们直接沿用了 HuggingGPT，没有改进。
- **对底座的推理风格敏感** — Claude-Sonnet-4 在反思阶段**过度分析**，筛得太严而淘汰了本该合适的候选；Qwen3-235B 则在 Stage I **迭代过多难收敛**。反思的严格度目前由底座「性格」决定，而不是一个可控参数——这是我认为最值得形式化的问题。
- **规模验证靠的是结构而非实测** — token 恒定的趋势实验里确立了，但可扩展性的主要依据是 $O(N \cdot L)$ 这个结构性保证，不是在超大仓库上的端到端实测。

</div>

<div class="talk-nav" markdown="1">
[← 返回主页](/)　·　[MCPO →](/papers/mcpo/)
</div>

</div>
