---
title: "GemTalk"
permalink: /papers/gemtalk/
author_profile: false
description: "GemTalk：几何引导的情感调制，让情感说话人脸生成的强度连续可控而不牺牲画质。ACM MM 2026 录用。"
---

<div class="talk" markdown="1">

<div class="talk-head" markdown="1">

# Geometry-guided Emotion Modulation for Controllable and Photorealistic Emotional Talking Face Generation

<div class="talk-meta" markdown="1">
**ACM MM 2026 (CCF-A) 已录用** ｜ 共同一作 (\*) ｜ [[arXiv:2608.00663]](https://arxiv.org/abs/2608.00663)
</div>

<div class="paper-tags"><span class="paper-tag">扩散模型</span><span class="paper-tag">可控生成</span><span class="paper-tag">说话人脸生成</span><span class="paper-tag">多模态</span><span class="paper-tag">情感强度控制</span></div>

<div class="claim" markdown="1">
**我的贡献**：负责训练与推理策略：1、冲突感知训练策略；2、自适应帧间平滑；3、推理期通过编辑面部混合系数实现的连续强度控制。
</div>

</div>

<div class="slide" markdown="1">
<span class="slide-no">01 ／ 背景与动机</span>
## 目前情感说话人脸生成有两条路线：显式驱动与隐式驱动

<div class="cards" markdown="1">
<div class="card"><span class="card-t">显式驱动</span><span class="card-d">用3DMM或blendshape系数控制面部运动。便于调节，但可能损失高频纹理，或产生形变与身份偏移</span></div>
<div class="card"><span class="card-t">隐式驱动</span><span class="card-d">从音频中学习情感特征，引导生成自然画面；缺少细粒度几何信息时，表情强度往往难以连续控制</span></div>
</div>

<figure class="fig-lg">
  <img src="/images/gem-fig1.jpg" alt="Figure 1 问题动机">
  <figcaption><b>Figure 1</b>　上排：参考脸是Sad、驱动音频是Very happy时发生<b>情感冲突</b>，已有方法给出不协调的面部；下排：已有方法只能给出平均情感强度，本方法可以<b>连续调节强度</b>。左侧为已有方法，右侧为本方法。</figcaption>
</figure>

## 但是有两个问题：

- **情感冲突** — 参考脸与驱动音频的情感不一致时，模型可能照搬参考表情，造成情感不准确或面部不协调
- **强度不可调** — 隐式特征的幅度缺少与面部形变强度的明确对应，直接调制还可能改变情感语义

## 核心洞察：方向编码类别，幅度编码强度

我们的建模思路是：**保留隐式特征方向承载的情感语义，通过几何先验让特征幅度与面部动作强度建立联系**。

<div class="claim" markdown="1">
可控性的目标是：**用几何信息校准幅度，同时约束方向变化，减少情感语义漂移。**
</div>

这借鉴了RMSNorm分离方向与尺度的思路：先归一化，再重新调制尺度。GemTalk使用L2归一化，并由**可学习的适配器根据显式面部几何动态生成缩放与偏移参数**。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 方法</span>
## GemTalk整体框架

<figure class="fig-lg">
  <img src="/images/gem-fig2.png" alt="Figure 2 GemTalk整体框架">
  <figcaption><b>Figure 2</b>　三个部分：(a) <b>隐式情感表征</b>，V-AEP把音频投射到情感空间；(b) <b>显式几何表征</b>，D-GPG基于扩散预测面部混合系数；(c) <b>融合</b>，GEM把二者结合，内部是 GCA → GAA 的串联，调制结果经cross attention注入扩散U-Net的中间层（图中红线）。</figcaption>
</figure>

GEM (Geometry-guided Emotion Modulation) 是全文的核心模块，由GCA与GAA串联，并结合方向一致性约束；训练与推理策略进一步改善情感跟随、连续控制和时序稳定性。

### ① 球面归一化

先把隐式特征投影到单位球面上——**剥离幅度、只留方向**。幅度信息之后由几何先验单独注入。

### ② GCA　几何感知上下文聚合

Geometry-aware Context Aggregation。以几何先验作key与value，检索与当前几何状态匹配的**强度上下文**。也就是说「该用多大幅度」不是凭空生成的，而是**从显式几何里查出来的**。

### ③ GAA　几何仿射适配器

Geometric Affine Adapter。把GCA的上下文投影成一对仿射参数——缩放 $\gamma$ 与偏移 $\beta$——对球面归一化后的特征 $\hat{f}$ 做调制：

$$(1 + \gamma) \odot \hat{f} + \beta$$

调制结果经交叉注意力注入扩散U-Net中间层，引导模型关注与当前情感和几何条件相关的面部区域。

### ④ 方向一致性损失

仅靠归一化并不能保证调制后方向不变。方向一致性损失以调制前后特征的余弦相似度构造软约束，鼓励保留情感语义，同时允许幅度随几何条件调整。

### ⑤ 训练与推理策略

这块是我负责的部分。

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">训练</span><span class="pipe-name">冲突感知训练</span><span class="pipe-desc">采样情感不一致的参考图与驱动音频，缓解参考表情泄漏，让模型学习跟随音频情感</span></div>
<div class="pipe-step"><span class="pipe-tag">推理</span><span class="pipe-name">自适应帧间平滑</span><span class="pipe-desc">检测异常帧间变化后，对背景与稳定面部区域进行平滑，保护嘴部和眼部运动</span></div>
<div class="pipe-step"><span class="pipe-tag">推理</span><span class="pipe-name">连续强度控制</span><span class="pipe-desc">按比例缩放与目标情感相关的面部混合系数，通过GEM传递强度变化，并限制系数范围</span></div>
</div>

**冲突感知训练**：默认以0.9的概率构造情感冲突样本，减少模型直接复制参考图表情的捷径。

**自适应帧间平滑**：阈值来自真实视频的帧间变化统计，平滑仅作用于相邻帧区域掩码的交集，并排除面部中的嘴部与眼部区域。

**连续强度控制**：根据平均幅度与高激活频率选出与目标情感相关的10个系数，采用比例缩放和范围裁剪，在调节强度时保留动作之间的相对关系。

<figure>
  <img src="/images/gem-fig5.jpg" alt="Figure 5 冲突感知训练策略的消融">
  <figcaption><b>Figure 5</b>　冲突感知训练策略的消融。</figcaption>
</figure>

</div>

<div class="slide" markdown="1">
<span class="slide-no">03 ／ 实验</span>
## 数据集与指标

两组设置：**HDTF**（无情感标注）与 **MEAD (Front) + RAVDESS (Speech)** 聚合情感数据集。指标覆盖视频质量 (FVD、FID)、唇音同步 (Sync-C、Sync-D)、情感保真 (E-FID) 与情感准确率 (Acc<sub>emo</sub>%)。

### 主结果

<figure>
  <img src="/images/gem-table1.png" alt="Table 1 主结果">
  <figcaption><b>Table 1</b>　两组数据集上的定量对比。上半组为非情感说话人脸方法，中间组为情感说话人脸方法，末行为GemTalk。粗体为最优、下划线为次优。</figcaption>
</figure>

### 定性对比

<figure class="fig-lg">
  <img src="/images/gem-fig3.jpg" alt="Figure 3 与SOTA方法的定性对比">
  <figcaption><b>Figure 3</b>　<b>域外数据</b>上与SOTA方法的定性对比。每行一个方法，最右为参考图像与目标情感音频。</figcaption>
</figure>

### 消融

<figure>
  <img src="/images/gem-table2.png" alt="Table 2 逐组件消融">
  <figcaption><b>Table 2</b>　MEAD+RAVDESS上的定量消融，从M1（无情感骨干）开始逐步叠加各组件。$\mathcal{L}_{\text{dcl}}$ 即方向一致性损失。</figcaption>
</figure>

最后两行是关键对比：同样使用GEM，加入方向一致性损失后，Acc<sub>emo</sub>从32.851%提高到**59.258%**，支持该约束有助于减少调制过程中的情感语义漂移。

<figure class="fig-lg">
  <img src="/images/gem-fig4.jpg" alt="Figure 4 消融的可视化结果">
  <figcaption><b>Figure 4</b>　(a) 编辑混合系数实现<b>连续强度控制</b>，开心程度逐步递增，过渡平滑且无身份丢失；(b) 有无LECM与GEM的注意力图对比；(c) 情感冲突情形下的对比，以及隐式表征的分布可视化。</figcaption>
</figure>

### 用户研究

<figure>
  <img src="/images/gem-table3.png" alt="Table 3 用户研究">
  <figcaption><b>Table 3</b>　域外数据上的用户研究结果。最后一行 GemTalk+Smooth 为开启自适应帧间平滑的版本。</figcaption>
</figure>

最后一行展示平滑策略的效果取舍：Smoothness从3.691提高到**3.839**（次优），情感、唇音同步与身份一致性评分略有下降，因此是否启用需权衡时序流畅度与其他生成质量指标。

</div>

<div class="talk-nav" markdown="1">
[← MCPO](/papers/mcpo/)　·　[返回主页](/)　·　[VR-OPD →](/papers/vropd/)
</div>

</div>
