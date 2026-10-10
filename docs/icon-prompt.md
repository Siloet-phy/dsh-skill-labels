# 图标设计说明与生成提示词

`icon.svg` 是本仓库自带的图标：**蓝色圆角底板 + 白色的鲸鱼娘（尾鳍当耳朵）+ 她身体里的「中」字**。

- 为什么是这个构图：插件市场的小卡片里图标只有 20px 左右，**能读出来的只有「一个中字」**，所以「中」是主体，鲸鱼娘只贡献外轮廓与辨识度。
- 为什么用图形而不是字体：「中」是用两个矩形画出来的（口 + 一竖，竖上下出头），不依赖任何字体，在**任何系统**上渲染都一样。
- 规格：`512×512` 视图、`viewBox="0 0 512 512"`、1.6 KB、无滤镜无位图，符合 DSH 插件管理器对图标的要求（SVG/PNG/JPEG/WebP，≤ 256 KiB，`package.json` 顶层 `icon` 指向它）。

想换成 AI 生成的形象（例如更贴「鲸鱼娘」的手绘风），把下面的提示词丢给多模态模型即可；生成结果**替换同名文件** `icon.svg`（或换成 `icon.png` 并同步改 `package.json` 的 `icon` 字段）即可生效。

## 提示词（中文）

> 你是一名图标设计师。请为我设计一枚 **应用图标**，最终交付 1:1 的正方形图，画面元素极少、小尺寸下依然清晰。
>
> **参考图**：我上传的这张是 DeepSeek 的鲸鱼娘形象（或官方鲸鱼 logo），请**保留她的核心识别特征**（鲸鱼尾鳍、圆润的头部轮廓、蓝白配色），但**大幅简化**：去掉五官细节、阴影、渐变纹理和任何小装饰。
>
> **画面内容**：
> 1. 背景是一个圆角正方形底板，圆角半径约 22%，填充从浅蓝 `#7B93FF` 到深蓝 `#3A54E0` 的对角渐变。
> 2. 底板正中是一只白色的、非常圆润的鲸鱼娘头部轮廓：头顶两侧各一片小尾鳍（像两个耳朵/双马尾），身体右侧伸出一对鲸鱼尾巴，整体占画布高度的 60% 左右，四周留出均匀留白。
> 3. 在她白色的身体正中间，放一个**粗体的中文「中」字**，颜色用深蓝 `#3A54E0`。这个字是画面的视觉焦点，笔画要粗、要正、要能一眼认出。
>
> **风格**：扁平化、圆润、可爱、现代 App 图标；只有蓝白两色（底板的蓝渐变 + 身体的白 + 「中」字的深蓝），不要描边、不要投影、不要文字水印。
>
> **技术规格**：正方形 1:1，导出 512×512 或 1024×1024，**背景透明**（底板本身是圆角方形，圆角之外要透明），另附一份 SVG 矢量版本。
>
> **验收标准**：把图缩到 20×20 像素时，「中」字依然能认出来，整体依然像一个可爱的鲸鱼图标；如果做不到，就继续减少细节、加大「中」字。

## 没有参考图时怎么说

把「参考图」那一段换成：

> **形象自述**：DeepSeek 的鲸鱼娘是一个蓝白配色的可爱鲸鱼拟人形象——圆润的头部、头顶有鲸鱼尾鳍造型的耳朵、友好可爱的表情。请用最简的几何形状还原她最有辨识度的轮廓。

## 生成后的微调话术（按需单独发）

- 「把『中』字再放大 15%，笔画加粗，保持上下出头；鲸鱼轮廓相应加大，四周留白均匀。」
- 「去掉所有细节：不要眼睛、不要腮红、不要高光、不要渐变纹理，只保留轮廓和『中』字。」
- 「背景改成透明 PNG，圆角方形底板保留；另外给我一份同样构图的 SVG。」
- 「蓝色部件统一用 `#3A54E0`，底板渐变用 `#7B93FF → #3A54E0`，白色部分纯白。」（用于对齐 DeepSeek 蓝）
- 「检查一下『中』字：它应该是一个**方框**加上**一竖从方框上下两端各伸出来**。如果笔画不对，请重画这个字，不要用艺术字变形。」

## 提示词（English）

> Design a square 1:1 **app icon**, minimal and readable at 20px. Keep the recognizable features of the attached DeepSeek whale-girl reference (whale flukes, round head silhouette, blue-and-white palette) but simplify heavily: drop facial details, shadows, gradients on the character, and any ornament.
>
> Content: a rounded-square badge (corner radius ≈22%) filled with a diagonal gradient from `#7B93FF` to `#3A54E0`; centered on it, a very round white whale-girl head with a small fluke on each side of the top (like ears) and a whale tail on the right, occupying ~60% of the canvas; in the middle of her white body, a **bold Chinese character「中」** in deep blue `#3A54E0` — the visual focus of the icon.
>
> Style: flat, rounded, cute, modern app icon; blue and white only; no outline, no shadow, no text watermark. Deliver 512×512 (or 1024×1024) **transparent-background** PNG plus an SVG version. Acceptance: at 20×20 the「中」is still legible and the whole thing still reads as a cute whale icon.
