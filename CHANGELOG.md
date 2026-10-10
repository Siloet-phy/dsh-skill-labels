# Changelog

本文件记录 dsh-skill-labels 的所有值得注意的变更。
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-10-12

首个公开版本。

- 在技能目录的每个 skill 描述前加上中文小标题（默认排版 `【小标题】原描述`）
- 同时作用于模型技能目录（`dsh-tool-skill`）与输入框 `/` 菜单（`skills/list`）
- 内置 12 条标签；支持包内 `labels.json`、用户标签文件 `~/.dsh/skill-labels.json`、行配置 `config.labels` 三级覆盖
- 标签文件按 mtime 懒加载，改完即生效，无需重启或重装
- 零依赖、零配置、不联网；只改写 `description`，不碰技能正文与调用策略
- 卸载时恢复注册表原方法
