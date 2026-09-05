---
title: "GemTalk"
permalink: /papers/gemtalk/
author_profile: false
description: "GemTalk：几何引导的情感调制，让情感说话人脸生成的强度连续可控而不牺牲画质。ACM MM 2026 录用。"
---

<p style="margin-bottom:1.2em"><a href="/">← 返回主页</a></p>

# Geometry-guided Emotion Modulation for Controllable and Photorealistic Emotional Talking Face Generation

Chenggong Hu\*, **Shaoyin Ma**\*, Yi Wang, Li Sun, Mingli Song, Jie Song

**ACM MM 2026 (CCF-A) 已录用** ｜ 共同一作 (\*) ｜ [[arXiv:2608.00663]](https://arxiv.org/abs/2608.00663)

<div class="paper-tags"><span class="paper-tag">扩散模型</span><span class="paper-tag">可控生成</span><span class="paper-tag">说话人脸生成</span><span class="paper-tag">多模态</span><span class="paper-tag">情感强度控制</span></div>

---

## 一句话概括

情感说话人脸生成长期面临**可控性与真实感难以兼顾**的矛盾。GemTalk提出**几何引导的情感调制** (GEM)：用显式的面部混合系数去调制隐式表征、赋予其几何感知能力，从而实现情感强度**连续可控而不牺牲画质**。

## 核心洞察：方向编码类别，幅度编码强度

![显式与隐式驱动的矛盾](/images/gem-motiv.jpg)

**Figure 1**　问题动机。上排：当参考脸是「Sad」而驱动音频是「Very happy」时发生**情感冲突**，显式驱动方法产生**不协调的面部**，而本方法得到协调且情感准确的结果；下排：从平均情感强度到**连续情感强度控制**的对比，左侧为已有方法、右侧为本方法。
{: .notice}

这项工作最关键的想法，是把隐式情感特征拆成两个正交的部分来理解：

| 分量 | 决定什么 |
| :-- | :-- |
| **方向 Direction** | 「是哪一种情感」——情感类别的语义身份 |
| **幅度 Amplitude** | 「这个情感有多强」——表达的物理强度 |

一旦接受这个分解，可控性问题就变成了一个清晰的目标：**只校准幅度，绝不旋转方向。** 调节强度时若方向被扰动，情感类别就会漂移 (开心变成惊讶)；而若幅度不可调，强度就只能在离散档位间跳变。GemTalk的做法是先把隐式特征投影到单位球面上完成归一化——**剥离幅度、保留方向**——再由几何先验单独提供幅度信息。

**一个便于理解的类比。** 这与LLM中RMSNorm的思路是同构的：先做归一化把尺度信息剥离出去，再用一个可学习的增益重新注入尺度。区别在于GemTalk的「增益」不是自由学习的参数，而是**由显式面部几何提供的、具有物理意义的强度先验**。
{: .notice--info}

## 方法：GEM模块

![GemTalk整体框架](/images/gem-arch.jpg)

**Figure 2**　GemTalk整体框架，分三个部分：(a) **隐式情感表征**——Vision-guided Audio Emotion Projection (V-AEP)，把音频投射到情感空间；(b) **显式几何表征**——基于扩散的几何先验生成器 (D-GPG)，预测面部混合系数；(c) **融合**——GEM将二者结合，内部可以看到 **GCA → GAA** 的串联结构，调制后的结果经cross attention**注入扩散U-Net的中间层** (图中红线连接处)。
{: .notice}

GEM (Geometry-guided Emotion Modulation) 由两个子模块串联组成：

### GCA　几何感知上下文聚合

Geometry-aware Context Aggregation。以几何先验作为key与value，去检索与当前几何状态相匹配的**强度上下文**，聚合出几何感知的上下文矩阵。也就是说，「该用多大的幅度」这件事不是凭空生成的，而是**从显式几何中查出来的**。

### GAA　几何仿射适配器

Geometric Affine Adapter。把GCA得到的上下文投影为一对仿射参数——缩放 $\gamma$ 与偏移 $\beta$——对球面归一化后的特征 $\hat{f}$ 做仿射调制：

$$(1 + \gamma) \odot \hat{f} + \beta$$

调制结果再注入扩散U-Net的中间层，通过交叉注意力确保只在几何相关区域生效。

### Directional Consistency Loss

仅靠归一化并不能保证方向在调制过程中不被破坏。因此引入**方向一致性损失**，显式地把特征方向「锁死」，使幅度可以自由缩放而情感类别保持稳定。这是「连续可控而不改变情感语义」的关键约束。

## 训练与推理策略

- **Conflict-aware Training Strategy (冲突感知训练)**：显式几何与隐式表征在训练中可能给出互相冲突的监督信号，该策略通过采样机制缓解二者的冲突，避免模型在两种信号间摇摆。
- **Adaptive Inter-frame Smoothing Strategy (自适应帧间平滑)**：一种区域感知的帧间平滑策略。直接对整帧做平滑会损失细节，因此仅在需要时触发、且只作用于相关区域，在保证时序连贯的同时不牺牲清晰度。
- **推理期的连续强度控制**：通过**编辑面部混合系数**即可连续调节情感强度，过渡平滑、不产生身份丢失或面部不协调。训练中配合classifier-free guidance (条件以一定概率被丢弃) 以增强可控性。

## 主要结果

在两组数据集上评测：**HDTF** (无情感标注) 与 **MEAD (Front) + RAVDESS (Speech)** 聚合情感数据集。指标包含视频质量 (FVD、FID)、唇音同步 (Sync-C、Sync-D)、情感保真 (E-FID) 与情感准确率 (Acc<sub>emo</sub>%)。

| 数据集 | FVD ↓ | FID ↓ | Sync-C ↑ | Sync-D ↓ | E-FID ↓ | Acc<sub>emo</sub>% ↑ |
| :-- | --: | --: | --: | --: | --: | --: |
| HDTF (无情感) | **216.138** | 23.136 | 7.819 | **7.449** | **1.386** | — |
| MEAD + RAVDESS | **334.937** | 31.625 | 7.027 | 8.283 | 2.392 | **59.258** |

论文对比结论的原文口径如下：

- 在 **MEAD + RAVDESS** 聚合情感数据集上，GemTalk在**多数指标上优于**近期各方法，仅在FID上排名第二；**情感准确率Acc<sub>emo</sub>较次优方法提升3.33%，FVD降低20.84**。
- 在无情感的 **HDTF** 数据集上，**Sync-D与E-FID保持领先**，FVD在非情感方法中**排名第二**。

此处严格采用论文正文的表述与本方法的绝对指标值，未做二次换算。相对提升百分比与绝对差值的口径容易混淆，涉及具体比较时建议直接参照论文Table 1。
{: .notice--warning}

![与SOTA方法的定性对比](/images/gem-compare.jpg)

**Figure 3**　在**域外数据**上与SOTA方法的定性对比。每行为不同方法，最右侧为参考图像与目标情感音频。
{: .notice}

## 消融要点

![连续强度控制与消融](/images/gem-intensity.jpg)

**Figure 4**　消融的可视化结果。(a) **通过编辑混合系数实现连续强度控制**——开心程度逐步递增，过渡平滑且**无身份丢失或不协调**；向下调混合系数则接近无情感。(b) 带注意力图的对比：有/无LECM与GEM的差异。(c) 情感冲突情形下的对比，以及不同情形下隐式表征的分布可视化。
{: .notice}

消融实验验证了几何引导的情感调制确实增强了隐式表征：GEM在**不损害唇音同步精度**的前提下提升了Acc<sub>emo</sub>%；对于中性情感数据，也未牺牲唇同步精度与视觉质量。这一点很重要——它说明情感可控性的引入是**增量的**，而不是以牺牲基础生成质量为代价换来的。

## 我的贡献

本文为**共同一作**。我主要参与了几何引导调制机制的设计讨论与实验验证部分。具体分工与各作者贡献可在交流中说明。

## 与研究主线的关系

这条工作与我的模型选择主线在方法论上是相通的——**都是先找到问题的正确分解方式，再针对分解后的结构设计机制**。在GemTalk里，这个分解是「方向 / 幅度」；在HuggingR⁴与MCPO里，则分别是「检索 / 推理」与「记名字 / 学能力」。
{: .notice--success}

---

<p><a href="/papers/mcpo/">← MCPO</a>　·　<a href="/">返回主页</a>　·　<a href="/papers/vropd/">VR-OPD →</a></p>
