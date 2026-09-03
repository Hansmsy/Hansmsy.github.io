---
permalink: /
title: ""
excerpt: ""
author_profile: true
redirect_from: 
  - /about/
  - /about.html
---

<span class='anchor' id='about-me'></span>

你好，我是**马韶胤 (Shaoyin Ma)**，浙江大学 <img src='images/zju-logo.png' alt='Zhejiang University' style='height: 1.5em; vertical-align: -0.42em;'> 软件工程专业硕士在读 (2024 – 2027)。

我目前的研究兴趣在：**当可调用的工具与模型空间是开放、海量且持续演化的，智能体如何做出可靠决策**？我认为这个问题可以拆成三个递进的层次：先让选择**可解**，再让选择**可学**，最后让学习过程**更稳**。

目前已发表NLP顶会一作×1 (EMNLP 2026)、CCF-A共同一作×1 (ACM MM 2026)，另有CCF-A在投×2 (AAAI 2027、ICLR 2027)。

📮 可以在这里联系我：mashaoyin@zju.edu.cn

<span style="display: inline-block; background: #d1453b; color: #fff; font-size: 0.72em; font-weight: 700; line-height: 1; letter-spacing: 0.04em; padding: 0.24em 0.45em; border-radius: 0.25em; vertical-align: 0.14em;">NEW</span> <span style="color: #d1453b; font-weight: 700;">我目前正在寻找秋招的正式工作机会，如果您有合适的岗位，欢迎随时联系我。</span>

# 🔥 最近动态
- *2026.08*：&nbsp;📄 我与合作者在虚拟人脸情感迁移方向的论文已上传至arXiv ([arXiv:2608.00663](https://arxiv.org/abs/2608.00663))。
- *2026.07*：&nbsp;🎉🎉 **HuggingR⁴** 被 **EMNLP 2026 Main Conference** 接收 (第一作者)。
- *2026.06*：&nbsp;🎓 **HuggingR⁴**被滑铁卢大学 <img src='images/uwaterloo-logo.png' alt='University of Waterloo' style='height: 1.3em; vertical-align: -0.3em;'> Renée J. Miller教授选为研究生课程[CS 848](https://rjmillerlab.github.io/CS848.Summer.2026/W7.html)的必读论文，并在课堂上作专题研讨，我感到十分荣幸。
- *2026.05*：&nbsp;💻 我加入**阿里巴巴集团** <img src='images/alibaba-logo.png' alt='Alibaba' style='height: 1em; vertical-align: -0.14em;'> 实习，方向为大模型应用算法，负责构建并优化账户行为分析智能体。
- *2026.05*：&nbsp;🎉🎉 **GemTalk** 被 **ACM MM 2026** 接收 (共同一作)。
- *2025.11*：&nbsp;📄 我在开放状态下智能体优化方向的论文已上传至arXiv ([arXiv:2511.18715](https://arxiv.org/abs/2511.18715))。
- *2025.06*：&nbsp;💻 我加入**中国南方电网** <img src='images/csg-logo.png' alt='China Southern Power Grid' style='height: 1.3em; vertical-align: -0.3em;'> 担任算法实习生，参与电网作业人员安全智能防控项目。

# 🧭 研究主线

| 层次 | 问题 | 工作 |
| :-- | :-- | :-- |
| **01 让选择可解** | 选择在计算上根本不可行 | **HuggingR⁴**：把一次性检索重构为迭代推理，滑动窗口把上下文消耗封顶为 `O(N·L)`，式子里不含仓库规模，于是计算成本与库规模在结构上解耦 |
| **02 让选择可学** | 选择策略一直是冻结的，从不改进 | **MCPO**：首次把模型选择形式化为强化学习问题，用动态身份掩码、轮次级轨迹剪枝、反事实优势对症下药 |
| **03 让训练更稳** | 后训练本身梯度方差高、优化不稳 | **VR-OPD**：兄弟rollout本来就已经采好了，用组内leave-one-out基线在保持期望梯度不变的前提下缩减方差 |
{: .thread-table}

# 📝 论文

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">EMNLP 2026</div><img src='images/r4-workflow.png' alt="HuggingR4" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[HuggingR⁴: A Progressive Reasoning Framework for Discovering Optimal Model Companions](https://arxiv.org/abs/2511.18715)

**Shaoyin Ma**, Chenggong Hu, Huiqiong Wang, Li Sun, Mingli Song, Jie Song

**EMNLP 2026 Main Conference (NLP顶会)** ｜ 第一作者 ｜ [[arXiv]](https://arxiv.org/abs/2511.18715)
- 首个把仓库级模型选择**从一次性检索重构为迭代推理**的框架，四个阶段协同：Reasoning→Retrieval→Refinement→Reflection。
- 构建含**14,399条**用户请求、覆盖**37个**任务类别的大规模评测基准。
- Workability **92.03%**、Reasonability **82.46%**，分别领先当时SOTA **26.51%** 与 **33.25%**，同时token消耗降为 **1/6.9**。
- 被滑铁卢大学Renée J. Miller教授列为研究生课程[CS 848 (Summer 2026)](https://rjmillerlab.github.io/CS848.Summer.2026/W7.html)的必读论文。
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">ACM MM 2026</div><img src='images/gem-arch.jpg' alt="GemTalk" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

[Geometry-guided Emotion Modulation for Controllable and Photorealistic Emotional Talking Face Generation](https://arxiv.org/abs/2608.00663)

Chenggong Hu\*, **Shaoyin Ma**\*, Yi Wang, Li Sun, Mingli Song, Jie Song

**ACM MM 2026** ｜ 共同一作 (\*) ｜ [[arXiv]](https://arxiv.org/abs/2608.00663)
- 解决情感说话人脸生成中「可控性与真实感难以兼顾」的矛盾。
- 核心洞察：把隐式情感特征拆成两个正交部分——**方向编码情感类别、幅度编码表达强度**。
- 因此只要**只校准幅度、绝不旋转方向**，就能让强度连续可控而不损失画质。
</div>
</div>

<div class='paper-box'><div class='paper-box-image'><div><div class="badge">AAAI 2027</div><img src='images/mcpo-arch.png' alt="MCPO" width="100%"></div></div>
<div class='paper-box-text' markdown="1">

MCPO: Masked and Counterfactual Policy Optimization for Agentic Model Selection

**Shaoyin Ma**, et al.

**AAAI 2027 在投** ｜ 第一作者
- **首次把模型选择形式化为一个可学的强化学习问题**。
- 标准RL在仓库级动作空间会失效，用三个机制对症下药：**动态身份掩码**治身份依赖、**轮次级轨迹剪枝**治曝光偏置、**反事实优势**治缺乏后悔感知 (且无需价值网络)。
- Qwen3-8B取得 **84.25** 综合分 (SOTA)，跨域 **79.99**。
</div>
</div>

- VR-OPD: Variance Reduction for On-Policy Distillation with Group Baselines，**ICLR 2027 在投**，共同一作。抓住一个被浪费掉的方差缩减来源：group-sampled的OPD本来就已经采了多条兄弟rollout，却被彼此独立处理；改用组内leave-one-out基线后，8个基准全面优于标准OPD，域内 **+1.6~2.0 pts**、域外 **+2.3~2.6 pts**。

# 🎖 荣誉与奖项
- 国家发明专利 ×2
- 蓝桥杯Python程序设计 国家二等奖
- 中国机器人及人工智能大赛 国家三等奖
- 本科院系排名前 **3%**

# 📖 教育背景
- *2024.09 - 2027.06*，**浙江大学** 软件学院，软件工程，工学硕士
- *2020.09 - 2024.06*，**河南大学** 软件学院，软件工程 (卓越计划)，工学学士

# 💻 实习经历
- *2026.05 - 2026.09*，**阿里巴巴集团**，大模型应用算法实习生。推动智能体由单轮架构演进至多轮Planner-Subagent协作范式，负责其中一个决策模块；沉淀了图谱约束的决策、SFT + DPO两阶段后训练、Skill自进化闭环三个可复用机制。

# 🛠 专业技能
- **大模型后训练**：熟悉verl、LLaMA-Factory、ms-swift、vLLM与Hugging Face生态；具备SFT / DPO / RL / OPD实践经验
- **数据与评测**：后训练数据构建、拒绝采样数据飞轮设计、万级评测基准搭建、奖励设计与LLM-as-Judge
- **智能体**：熟悉LangChain、LangGraph；多轮智能体设计、Harness与上下文工程、RAG与向量检索
- **基础与工具**：熟悉Transformer与主流大模型结构设计；Python (熟练)、C/C++、PyTorch，可独立完成模型训练与优化
