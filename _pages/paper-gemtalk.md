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
**我的贡献**：负责**冲突感知训练策略**与**自适应帧间平滑**，分别改善参考图与音频情感冲突时的情感跟随，以及长视频生成的时序稳定性。
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

这块是我负责的部分，重点是下面两个机制。

#### 1. 冲突感知训练：减少参考表情泄漏

**问题**：参考图既提供身份，也带有静态表情。参考脸在笑、驱动音频却悲伤时，模型可能直接复制参考图表情，或者生成“悲伤的眼睛＋微笑的嘴”，导致情感不准确、面部不协调。

**做法**：在GEM训练阶段主动构造参考图与音频情感不一致的样本，让参考表情不再成为可靠的情感答案。

1. 保持参考图的身份输入，从不同情感类别采样驱动音频。
2. 默认以**0.9**的概率构造情感冲突组合，保留**0.1**的情感一致组合。
3. 使用扩散训练目标，让模型更多依赖音频情感表征与几何条件，减少照搬参考表情的捷径。

**关键点**：改变的是训练数据的采样方式；0.9是冲突样本的构造概率，不是推理时随机改变情感的概率，也不是额外损失的权重。

**讲解重点**：参考图提供身份与外观，驱动条件提供目标情感；通过训练时制造冲突，改善两类信息的分工。

<figure>
  <img src="/images/gem-fig5.jpg" alt="Figure 5 冲突感知训练策略的消融">
  <figcaption><b>Figure 5</b>　冲突感知训练策略的消融。</figcaption>
</figure>

#### 2. 自适应帧间平滑：检测异常变化，保护关键运动

**问题**：长视频滑动窗口生成可能出现背景闪烁和细微面部抖动。直接平均整张图，会模糊嘴部发音与眼部运动，损害唇音同步和自然表情。

**做法**：推理时使用**2帧窗口**，分别处理背景与相对稳定的面部区域，仅在检测到异常变化时平滑。

1. 提取相邻两帧的背景掩码；从面部掩码中排除**嘴部与眼部**，得到安全平滑区域。
2. 取两帧对应区域掩码的**交集**，只在两帧都属于该区域的位置计算外观差异。
3. 阈值由**真实视频的正常帧间变化统计**确定；超过阈值时，只对交集区域进行两帧平均，保留其他区域。

**为什么取交集**：头部移动或掩码边界漂移时，同一像素可能从背景变成脸。交集减少不同区域被混合的机会，降低边界伪影。

**讲解重点**：这是区域感知、按需触发的推理后处理；重点降低异常闪烁，同时保护口型和眼部动态。平滑度与其他生成质量的取舍见后面的用户研究。

<details markdown="1">
<summary>展开：附录中的中间帧插入策略</summary>
<div class="details-body" markdown="1">

附录还提供区域受限的中间帧插入：用相邻帧对应掩码交集内的平均结果构造过渡帧。触发平滑时，策略以**50%／50%**的概率选择当前帧区域平均或插入中间帧，帮助缓解突变。

</div>
</details>

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
