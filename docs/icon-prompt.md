# 图标设计说明与生成提示词

`icon.svg` 是本仓库自带的图标：**蓝紫渐变的圆角底板 + 一个占据画面高度约 6 成的白色「中」字 + 底边探出头的白色鲸鱼娘（大眼珠配双高光、粉腮红、猫咪嘴，左上方冒着三颗水花）**。

## 为什么是这个构图

- **「中」是主体，不是装饰**：插件市场与插件管理器的列表里图标只有 20–24px，能读出来的只有一个字形。所以「中」占画布高度约 **6 成**、笔画宽度 **46/512（约 9%）**，缩到 24px 仍能辨认。
- **「中」按汉字的真实比例画**：口要**宽大于高**（264×168，约 1.57:1），竖（52 宽）从口的上方与下方各伸出约 1/4 字高。第一版的「口」是个 1:1 的正方块、整字宽高比只有 0.51，看着不像「中」——汉字「中」的字宽约占字高的 0.7–0.8。
- **眼睛要「有灵性」**：用大眼珠 + **两颗白色高光**（左上大、右下小），比单高光更有精神；嘴用猫咪嘴（ω），比一条细弧线更萌。
- **字形和角色之间必须留白**：竖的下端与脑袋之间留出约 50px 空隙，否则缩小时会看成「一根柱子插在脑袋上」。
- **角色不加耳朵/侧鳍**：试过「双马尾式尾鳍」和「头顶小尖鳍」两版，前者像两坨半圆（被吐槽像💩），后者被看成兔耳朵。**只留一个干净的圆脑袋 + 水花**，鲸鱼感交给水花去表达。
- **鲸鱼娘只做辅助**：只占底边约 18% 的高度，提供可爱度（眼睛、腮红、微笑、双马尾式的尾鳍、水花），不跟字形抢面积。放到 20px 时它会退化成一小块白色凸起，正好不干扰字形。
- **不用字体画字**：「中」由两个圆角矩形拼成（口 + 竖，竖上下出头），**不依赖任何字体**，在任何系统上渲染一致。
- **规格**：`512×512` 视图、`viewBox="0 0 512 512"`、约 1.7 KB、无滤镜无位图，符合 DSH 插件管理器对图标的要求（SVG/PNG/JPEG/WebP，≤ 256 KiB，`package.json` 顶层 `icon` 指向它）。

## 已经踩过的四个坑（换图时别再踩）

1. **把「中」塞进鲸鱼身体里**——第一版让鲸鱼身体占满画面、「中」缩在里面，结果「中」只占画布 35% 高度、笔画 32px，列表里完全读不出来。
2. **让脸和字形平分画面**——脸做得越大，「中」就越小；两者都要的结果是两个都看不清。**正确做法是字形占 6 成以上，角色只做边角点缀。**
3. **「口」画成正方形**——汉字「中」的「口」是宽大于高的，画成正方块会显得又瘦又高，不像「中」（第二版的问题）。
4. **给角色加耳朵/侧鳍**——「双马尾式尾鳍」被看成两坨半圆（像💩），「头顶小尖鳍」被看成兔耳朵。**圆脑袋 + 水花最安全**。

想换成 AI 生成的形象（例如更贴「鲸鱼娘」的手绘风），把下面的提示词丢给多模态模型即可；生成结果**替换同名文件** `icon.svg`（或换成 `icon.png` 并同步改 `package.json` 的 `icon` 字段）即可生效。

换图前先用 `docs/icon-preview.html` 自查：用浏览器打开它，就能看到图标在 192 / 96 / 64 / 48 / 32 / 24 / 20 px 下的实际效果，以及插件管理器列表里的排布——**24px 认不出「中」就不要提交**。

## 提示词（中文）

> 你是一名图标设计师。请为我设计一枚 **应用图标**，最终交付 1:1 的正方形图，**画面只有一个视觉主体**，缩到 24px 依然清晰。
>
> **参考图**：我上传的这张是 DeepSeek 的鲸鱼娘形象（或官方鲸鱼 logo），请**保留她的核心识别特征**（鲸鱼尾鳍、圆润的头部轮廓、蓝白配色），但**大幅简化**：去掉五官细节、阴影、渐变纹理和任何小装饰。
>
> **画面内容**：
> 1. 背景是一个圆角正方形底板，圆角半径约 23%，填充从浅蓝紫 `#8FA8FF` 到深蓝 `#334FD2` 的对角渐变。
> 2. 底板正中是一个**白色、粗体、占画布高度约 64% 的中文「中」字**——它是整个图标的视觉主体：**「口」要明显宽大于高（约 1.5:1）**、笔画约为画布宽度的 9%（即足够粗）、竖要从口的上方和下方各伸出一段，字腔开口清晰不糊。**不要把这个字放进任何角色身体里面，直接放在底板上，保证对比度。**
> 3. 「中」的下方、底板底边处，**只露出鲸鱼娘的头**：一个很圆的白色小脑袋顶在底边上，约占画布高度 17%；**眼睛要大而有灵性**——大眼珠配两颗白色高光（左上大、右下小），粉色腮红，猫咪嘴（ω 形）；头顶左上方冒出三颗由小到大的水花。**不要给她加耳朵、侧鳍或尾巴**，轮廓保持干净的一个圆。
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
- 「检查『中』的比例：**「口」要宽大于高**（大约 1.5 比 1），竖从口上下各伸出约 1/4 字高——不要画成正方块。」
- 「不要把这个字放进鲸鱼身体里，直接放在蓝色底板上，保持白字蓝底的高对比。」
- 「眼睛要大而有灵性：大眼珠 + 左上大高光 + 右下小高光；嘴用猫咪嘴（ω），别用一条细弧线。」
- 「角色轮廓只要一个干净的圆脑袋，**不要加耳朵、侧鳍、双马尾或尾巴**（那些会被看成兔耳朵或两坨半圆）。」
- 「竖的下端和脑袋之间留出明显空隙（约画布高度的 10%），别让竖线看起来插在脑袋上。」
- 「背景改成透明 PNG，圆角方形底板保留；另外给我一份同样构图的 SVG。」
- 「蓝色统一用 `#5B78F2`，底板渐变用 `#8FA8FF → #334FD2`，白色部分纯白，腮红用 `#FFA6C9`。」
- 「检查一下『中』字：它应该是一个**方框**加上**一竖从方框上下两端各伸出来**。如果笔画不对，请重画这个字，不要用艺术字变形。」

## 提示词（English）

> Design a square 1:1 **app icon** with **one visual subject**, still readable at 24px. Keep the recognizable features of the attached DeepSeek whale-girl reference (whale flukes, round head silhouette, blue-and-white palette) but simplify heavily: drop facial details, shadows, gradients on the character, and any ornament.
>
> Content: (1) a rounded-square badge (corner radius ≈23%) filled with a diagonal gradient from `#8FA8FF` to `#334FD2`; (2) centered on it, a **bold white Chinese character「中」occupying ~60% of the canvas height** — the visual subject of the icon: **the box (口) must be clearly wider than tall (≈1.5:1)**, strokes about 9% of the canvas width, the vertical stroke extending above and below the box, open counters. Place the glyph directly on the badge — never inside a character's body — so contrast stays high, and leave a clear gap (~10% of the canvas height) between the bottom of the vertical stroke and the mascot's head; (3) at the bottom edge, only the **head of a cute white whale-girl peeks out**: a clean round dome (~17% of the canvas height) with **big lively eyes (large dark pupils plus two white catchlights — one big upper-left, one small lower-right)**, pink blush, a **cat mouth (ω shape)**, and three rising water droplets at her upper left. **No ears, no side fins, no twin tails, no tail** — keep the silhouette one clean round shape.
>
> Style: flat, rounded, cute, modern app icon; blue, white and pink only; no outline, no shadow, no text watermark. Deliver 512×512 (or 1024×1024) **transparent-background** PNG plus an SVG version. Acceptance: at **24×24** the「中」must still be immediately legible; at 20×20 it should read as a clear glyph plus a small cute white bump at the bottom edge. If not, enlarge the glyph and shrink the mascot.
