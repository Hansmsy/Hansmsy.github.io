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
<div class="card"><span class="card-t">显式驱动</span><span class="card-d">用3DMM或blendshape系数直接驱动。强度可控，但表情是「贴」上去的，参考脸与驱动音频的情感一冲突就会崩</span></div>
<div class="card"><span class="card-t">隐式驱动</span><span class="card-d">从音频里学一个情感嵌入。画质自然协调，但强度被锁在训练集的平均水平上，调不动</span></div>
</div>

<figure class="fig-lg">
  <img src="/images/gem-fig1.jpg" alt="Figure 1 问题动机">
  <figcaption><b>Figure 1</b>　上排：参考脸是Sad、驱动音频是Very happy时发生<b>情感冲突</b>，已有方法给出不协调的面部；下排：已有方法只能给出平均情感强度，本方法可以<b>连续调节强度</b>。左侧为已有方法，右侧为本方法。</figcaption>
</figure>

## 但是有两个问题：

- **情感冲突** — 参考脸的情感与驱动音频要求的情感不一致时，显式驱动会生成五官互相打架的面部
- **强度不可调** — 隐式表征把「哪种情感」和「多强」缠在一起，一旦去动强度，情感类别本身就会漂移

## 核心洞察：方向编码类别，幅度编码强度

把隐式情感特征拆成两个正交的部分来看——**方向决定「是哪一种情感」，幅度决定「这个情感有多强」**。

<div class="claim" markdown="1">
可控性问题因此变成一个很清晰的目标：**只校准幅度，绝不旋转方向。**
</div>

这与LLM里RMSNorm的思路是同构的：先归一化把尺度剥离，再用一个增益重新注入尺度。区别是GemTalk的「增益」不是自由学习的参数，而是**由显式面部几何提供的、有物理意义的强度先验**。

</div>

<div class="slide" markdown="1">
<span class="slide-no">02 ／ 方法</span>
## GemTalk整体框架

<figure class="fig-lg">
  <img src="/images/gem-fig2.png" alt="Figure 2 GemTalk整体框架">
  <figcaption><b>Figure 2</b>　三个部分：(a) <b>隐式情感表征</b>，V-AEP把音频投射到情感空间；(b) <b>显式几何表征</b>，D-GPG基于扩散预测面部混合系数；(c) <b>融合</b>，GEM把二者结合，内部是 GCA → GAA 的串联，调制结果经cross attention注入扩散U-Net的中间层（图中红线）。</figcaption>
</figure>

GEM (Geometry-guided Emotion Modulation) 是全文的核心模块，由两个子模块串联，外加一个约束与两个策略。

### ① 球面归一化

先把隐式特征投影到单位球面上——**剥离幅度、只留方向**。幅度信息之后由几何先验单独注入。

### ② GCA　几何感知上下文聚合

Geometry-aware Context Aggregation。以几何先验作key与value，检索与当前几何状态匹配的**强度上下文**。也就是说「该用多大幅度」不是凭空生成的，而是**从显式几何里查出来的**。

### ③ GAA　几何仿射适配器

Geometric Affine Adapter。把GCA的上下文投影成一对仿射参数——缩放 $\gamma$ 与偏移 $\beta$——对球面归一化后的特征 $\hat{f}$ 做调制：

$$(1 + \gamma) \odot \hat{f} + \beta$$

调制结果注入扩散U-Net中间层，经交叉注意力确保只在几何相关区域生效。

### ④ 方向一致性损失

仅靠归一化并不能保证方向在调制中不被破坏。方向一致性损失把特征方向显式「锁死」，让幅度可以自由缩放而情感类别保持稳定——这是「连续可控而不改变情感语义」的关键约束。

### ⑤ 训练与推理策略

这块是我负责的部分。

<div class="pipe" markdown="1">
<div class="pipe-step"><span class="pipe-tag">训练</span><span class="pipe-name">冲突感知训练</span><span class="pipe-desc">显式几何与隐式表征在训练中会给出互相冲突的监督信号，用采样机制缓解冲突，避免模型在两种信号间摇摆</span></div>
<div class="pipe-step"><span class="pipe-tag">推理</span><span class="pipe-name">自适应帧间平滑</span><span class="pipe-desc">区域感知的平滑：直接整帧平滑会丢细节，因此仅在需要时触发、且只作用于相关区域</span></div>
<div class="pipe-step"><span class="pipe-tag">推理</span><span class="pipe-name">连续强度控制</span><span class="pipe-desc">通过编辑面部混合系数连续调节强度，配合classifier-free guidance增强可控性</span></div>
</div>

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

最后两行是整张表里最值得指的对比：同样都用了GEM，少了方向一致性损失，Acc<sub>emo</sub>从59.258**崩到32.851**。没有这个约束，仿射调制会把方向一起转掉，情感类别就漂了。

<figure class="fig-lg">
  <img src="/images/gem-fig4.jpg" alt="Figure 4 消融的可视化结果">
  <figcaption><b>Figure 4</b>　(a) 编辑混合系数实现<b>连续强度控制</b>，开心程度逐步递增，过渡平滑且无身份丢失；(b) 有无LECM与GEM的注意力图对比；(c) 情感冲突情形下的对比，以及隐式表征的分布可视化。</figcaption>
</figure>

### 用户研究

<figure>
  <img src="/images/gem-table3.png" alt="Table 3 用户研究">
  <figcaption><b>Table 3</b>　域外数据上的用户研究结果。最后一行 GemTalk+Smooth 为开启自适应帧间平滑的版本。</figcaption>
</figure>

最后一行是我那个平滑策略的直接证据：Smoothness从3.691提到**3.839**（成为次优），代价是其余三项各降一点点。所以它在论文里是**可选开关**，而不是默认开启——追求时序观感时打开，追求单帧保真时关掉。

</div>

<div class="talk-nav" markdown="1">
[← MCPO](/papers/mcpo/)　·　[返回主页](/)　·　[VR-OPD →](/papers/vropd/)
</div>

</div>
