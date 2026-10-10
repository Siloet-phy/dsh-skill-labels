/**
 * dsh-skill-labels —— 给技能目录里的每个 skill 加一个中文小标题
 *
 * 让模型看到的技能目录与输入框 `/` 菜单每条都变成：
 *   `html-ppt`: 【写PPT】HTML PPT Studio — author professional ...
 * 也就是「中文小标题 + 原英文描述」。
 *
 * 做法：技能目录的所有出口（`dsh-tool-skill` 的模型目录、`ctx.remote.skills`
 * 背后的 `sessionSkillCatalog`）都走 `SkillRegistry.snapshot()/list()` 这一个
 * 代际点。本插件在 skill 注册表**原型**上包装这两个方法，在结果交付前改写
 * 每条 summary 的 `description`；因此不挑消费者、不需要逐个面接。
 * 包装按对象身份幂等（WeakSet），所以 `list()` 内部再调 `snapshot()` 也只加一次标签。
 *
 * 卸载时恢复原方法（`ctx.effect` 的清理函数）。
 *
 * 标签优先级（后者覆盖前者）：
 *   内置 DEFAULT_LABELS → 包内 labels.json → 用户标签文件 → 行配置 config.labels
 */

import { readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 插件名（loader 行 id 与它对齐）。 */
export const name = 'skill-labels'

/** 依赖 skills 服务；没有它本插件不激活。 */
export const inject = ['skills']

/** 默认排版：中文小标题在前，原描述在后。可用 config.format 改。 */
export const DEFAULT_FORMAT = '【{label}】{description}'

/** 包内标签文件（随包发布，给维护者/社区补标签用）。 */
const PACKAGE_LABEL_FILE = fileURLToPath(new URL('./labels.json', import.meta.url))

/** 用户标签文件的默认位置：升级插件不会覆盖它。 */
const USER_LABEL_FILE = join(homedir(), '.dsh', 'skill-labels.json')

/**
 * 内置中文标签：skill 名 → 一句话功能。
 * 不在表里的技能保持原样，并记一条 debug 日志。
 */
export const DEFAULT_LABELS = {
  'html-ppt': '写PPT',
  'office-docx': '写Word',
  'office-pptx': '写PPTX',
  'office-xlsx': '写Excel',
  'vision-skills': '看图还原界面',
  'dsh-deepread': '精读文章',
  'diagnose-windows-sandbox-acl': '修Windows权限',
  'dsh-badge': '加DSH徽标',
  'agent-experience': '写工具描述',
  'cordis-plugin-development': '写DSH插件',
  'cordis-composition-reference': '查DSH配置',
  'editing-cordis-compositions': '改DSH配置',
}

/** 在原型链上找到第一个自己拥有 key 的对象；找不到返回 undefined。 */
function findOwner(object, key) {
  let node = object
  while (node !== null && node !== undefined) {
    if (Object.hasOwn(node, key) && typeof node[key] === 'function') return node
    node = Object.getPrototypeOf(node)
  }
  return undefined
}

/**
 * 已加过标签的 summary（按对象身份记，保证包装幂等）。
 *
 * 故意放在模块作用域：`list()` 内部会再调 `snapshot()`，同一批 summary 对象会
 * 经过两层包装；万一同一个文件被两行配置各挂一次（两种装法同时存在），
 * 模块级记录也能保证只加一层标签。
 */
const decorated = new WeakSet()

/** 已经提示过「没有中文标签」的技能名，避免每轮都刷日志。 */
const reported = new Set()

/**
 * 一个按 mtime 失效的 JSON 标签表读取器：改文件不必重启、不必重装。
 * @param logger 宿主 logger，只用于报告格式错误。
 * @param path 标签文件绝对路径。
 */
function createLabelFileReader(logger, path) {
  let cached = {}
  let mtime = -1
  return () => {
    let next = -1
    try {
      next = statSync(path).mtimeMs
    } catch {
      return {} // 没有这个文件是正常情况
    }
    if (next === mtime) return cached
    try {
      const parsed = JSON.parse(readFileSync(path, 'utf8'))
      if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
        cached = parsed
        mtime = next
      } else {
        logger.warn(`skill-labels: ${path} 必须是一个 JSON 对象，已忽略`)
        mtime = next
      }
    } catch (error) {
      logger.warn(`skill-labels: 读取 ${path} 失败（${String(error)}），沿用上一次的表`)
      mtime = next
    }
    return cached
  }
}

/**
 * 给技能目录里的每条 summary 前缀中文小标题。
 *
 * @param ctx 宿主上下文（需要 `skills` 服务与 `logger`）。
 * @param config 行配置：`format`、`labels`（名→标签）、`labelsFile`（用户标签文件路径，`false` 关闭）。
 */
export function apply(ctx, config = {}) {
  const format = typeof config?.format === 'string' && config.format.includes('{description}')
    ? config.format
    : DEFAULT_FORMAT
  const configLabels = config?.labels !== null && typeof config?.labels === 'object' ? config.labels : {}

  const readPackageLabels = createLabelFileReader(ctx.logger, PACKAGE_LABEL_FILE)
  const userFile = config?.labelsFile === false
    ? undefined
    : typeof config?.labelsFile === 'string' ? config.labelsFile : USER_LABEL_FILE
  const readUserLabels = userFile === undefined ? () => ({}) : createLabelFileReader(ctx.logger, userFile)

  const labelsFor = () => ({ ...DEFAULT_LABELS, ...readPackageLabels(), ...readUserLabels(), ...configLabels })
  const lookup = (labelTable, skillName) => {
    const value = labelTable[skillName]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }

  /** 已加过标签的对象（按身份记，保证幂等）。 */
  const decorate = (labelTable, skill) => {
    if (skill === null || typeof skill !== 'object') return skill
    if (decorated.has(skill)) return skill
    if (typeof skill.description !== 'string') return skill
    const label = lookup(labelTable, skill.name)
    if (label === undefined) {
      if (typeof skill.name === 'string' && !reported.has(skill.name)) {
        reported.add(skill.name)
        ctx.logger.debug(`skill-labels: skill "${skill.name}" 没有中文标签，可用 labels.json 或 config.labels 补上`)
      }
      return skill
    }
    const next = {
      ...skill,
      description: format.replaceAll('{label}', label).replaceAll('{description}', skill.description),
    }
    decorated.add(next)
    return next
  }

  const mapOut = (value) => {
    const labelTable = labelsFor()
    if (Array.isArray(value)) return value.map((skill) => decorate(labelTable, skill))
    if (value !== null && typeof value === 'object' && Array.isArray(value.skills)) {
      return { ...value, skills: value.skills.map((skill) => decorate(labelTable, skill)) }
    }
    return value
  }

  const registry = ctx.skills
  const restores = []
  const wrapped = []
  for (const method of ['snapshot', 'list']) {
    const owner = findOwner(registry, method)
    if (owner === undefined) {
      ctx.logger.warn(`skill-labels: skills.${method}() 不存在，跳过包装`)
      continue
    }
    const original = owner[method]
    const wrapper = async function (...args) {
      return mapOut(await original.apply(this, args))
    }
    owner[method] = wrapper
    wrapped.push(method)
    restores.push(() => {
      if (owner[method] === wrapper) owner[method] = original
    })
  }

  if (restores.length === 0) {
    ctx.logger.warn('skill-labels: 没有包装到任何技能目录方法，技能列表不会出现中文标签')
    return
  }
  ctx.logger.debug(`skill-labels: 已包装 skills.${wrapped.join('() / ')}()`)
  ctx.effect(() => () => {
    for (const restore of restores.reverse()) restore()
  }, 'skill-labels: restore registry methods')
}
