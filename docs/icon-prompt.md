# 图标设计说明与生成提示词

`icon.svg` 是本仓库自带的图标：**蓝紫渐变的圆角底板 + 一个占据画面高度约 2/3 的白色「中」字 + 底边探出头的白色鲸鱼娘（有眼睛、腮红、微笑和两片小尾鳍）**。

## 为什么是这个构图

- **「中」是主体，不是装饰**：插件市场与插件管理器的列表里图标只有 20–24px，能读出来的只有一个字形。所以「中」占画布高度约 **64%**、笔画宽度 **48/512（约 9.4%）**，字腔开口留到 1.5 倍笔画宽，缩到 24px 仍能辨认。
- **鲸鱼娘只做辅助**：只占底边约 15% 的高度，提供可爱度（眼睛、腮红、微笑、小尾鳍），不跟字形抢面积。放到 20px 时它会退化成一个小小的白色凸起，正好不干扰字形。
- **不用字体画字**：「中」由两个圆角矩形拼成（口 + 竖，竖上下出头），**不依赖任何字体**，在任何系统上渲染一致。
- **规格**：`512×512` 视图、`viewBox="0 0 512 512"`、约 1.6 KB、无滤镜无位图，符合 DSH 插件管理器对图标的要求（SVG/PNG/JPEG/WebP，≤ 256 KiB，`package.json` 顶层 `icon` 指向它）。

## 已经踩过的两个坑（换图时别再踩）

1. **把「中」塞进鲸鱼身体里**——第一版让鲸鱼身体占满画面、「中」缩在里面，结果「中」只占画布 35% 高度、笔画 32px，列表里完全读不出来。
2. **让脸和字形平分画面**——脸做得越大，「中」就越小；两者都要的结果是两个都看不清。**正确做法是字形占 60% 以上，角色只做边角点缀。**

想换成 AI 生成的形象（例如更贴「鲸鱼娘」的手绘风），把下面的提示词丢给多模态模型即可；生成结果**替换同名文件** `icon.svg`（或换成 `icon.png` 并同步改 `package.json` 的 `icon` 字段）即可生效。

## 提示词（中文）

> 你是一名图标设计师。请为我设计一枚 **应用图标**，最终交付 1:1 的正方形图，**画面只有一个视觉主体**，缩到 24px 依然清晰。
>
> **参考图**：我上传的这张是 DeepSeek 的鲸鱼娘形象（或官方鲸鱼 logo），请**保留她的核心识别特征**（鲸鱼尾鳍、圆润的头部轮廓、蓝白配色），但**大幅简化**：去掉五官细节、阴影、渐变纹理和任何小装饰。
>
> **画面内容**：
> 1. 背景是一个圆角正方形底板，圆角半径约 23%，填充从浅蓝紫 `#8FA8FF` 到深蓝 `#334FD2` 的对角渐变。
> 2. 底板正中是一个**白色、粗体、占画布高度约 64% 的中文「中」字**——它是整个图标的视觉主体：口要方正、笔画约为画布宽度的 9%（即足够粗）、竖要从口的上方和下方各伸出一段，字腔开口清晰不糊。**不要把这个字放进任何角色身体里面，直接放在底板上，保证对比度。**
> 3. 「中」的下方、底板底边处，**只露出鲸鱼娘的头**：一个很圆的白色小脑袋顶在底边上，约占画布高度 15%，有两只圆圆的眼睛、粉色腮红和一个小小的微笑，头顶两侧各竖一片小尾鳍。
>
> **风格**：扁平化、圆润、可爱、现代 App 图标；只有蓝、白、粉三色，不要描边、不要投影、不要文字水印。
>
> **技术规格**：正方形 1:1，导出 512×512 或 1024×1024，**背景透明**（圆角之外要透明），另附一份 SVG 矢量版本。
>
> **验收标准**：把图缩到 **24×24 像素**时，「中」字必须还能一眼认出来；缩到 20px 时至少能看成「一个清晰的字形 + 底边一小块可爱的白色」。做不到就继续放大「中」、缩小鲸鱼娘。

## 没有参考图时怎么说

把「参考图」那一段换成：

> **形象自述**：DeepSeek 的鲸鱼娘是一个蓝白配色的可爱鲸鱼拟人形象——圆润的头部、头顶有鲸鱼尾鳍造型的耳朵、友好可爱的表情。请用最简的几何形状还原她最有辨识度的轮廓。

## 生成后的微调话术（按需单独发）

- 「把『中』字放大到占画布高度 2/3，笔画再加粗一档，字腔别糊；鲸鱼娘相应缩小到只露底边一小块。」
- 「不要把这个字放进鲸鱼身体里，直接放在蓝色底板上，保持白字蓝底的高对比。」
- 「鲸鱼娘只要可爱：圆眼睛、粉色腮红、小微笑、头顶两片小尾鳍，不要别的细节。」
- 「背景改成透明 PNG，圆角方形底板保留；另外给我一份同样构图的 SVG。」
- 「蓝色统一用 `#5B78F2`，底板渐变用 `#8FA8FF → #334FD2`，白色部分纯白，腮红用 `#FFA6C9`。」
- 「检查一下『中』字：它应该是一个**方框**加上**一竖从方框上下两端各伸出来**。如果笔画不对，请重画这个字，不要用艺术字变形。」

## 提示词（English）

> Design a square 1:1 **app icon** with **one visual subject**, still readable at 24px. Keep the recognizable features of the attached DeepSeek whale-girl reference (whale flukes, round head silhouette, blue-and-white palette) but simplify heavily: drop facial details, shadows, gradients on the character, and any ornament.
>
> Content: (1) a rounded-square badge (corner radius ≈23%) filled with a diagonal gradient from `#8FA8FF` to `#334FD2`; (2) centered on it, a **bold white Chinese character「中」occupying ~64% of the canvas height** — the visual subject of the icon: square box, strokes about 9% of the canvas width, vertical stroke extending above and below the box, open counters. Place the glyph directly on the badge — never inside a character's body — so contrast stays high; (3) at the bottom edge, only the **head of a cute white whale-girl peeks out**: a small round head (~15% of the canvas height) with round eyes, pink blush, a tiny smile, and two small flukes on top.
>
> Style: flat, rounded, cute, modern app icon; blue, white and pink only; no outline, no shadow, no text watermark. Deliver 512×512 (or 1024×1024) **transparent-background** PNG plus an SVG version. Acceptance: at **24×24** the「中」must still be immediately legible; at 20×20 it should read as a clear glyph plus a small cute white bump at the bottom edge. If not, enlarge the glyph and shrink the mascot.
