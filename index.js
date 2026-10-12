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
 * 另外注册一个 `skill_labels` 工具：模型可以直接查「哪些技能还没有中文标签」、
 * 并把标签写进用户标签表（只写标签 JSON，不碰别的文件）。工具注册失败不影响标签功能。
 *
 * 卸载时恢复原方法（`ctx.effect` 的清理函数）。
 *
 * 标签优先级（后者覆盖前者）：
 *   内置 DEFAULT_LABELS → 包内 labels.json → 用户标签文件 → 行配置 config.labels
 */

import { mkdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** 插件名（loader 行 id 与它对齐）。 */
export const name = 'skill-labels'

/** 依赖 skills 服务；没有它本插件不激活。工具那半是可选能力，运行时探测。 */
export const inject = ['skills']

/** 默认排版：中文小标题在前，原描述在后。可用 config.format 改。 */
export const DEFAULT_FORMAT = '【{label}】{description}'

/** 包内标签文件（随包发布，给维护者/社区补标签用）。 */
const PACKAGE_LABEL_FILE = fileURLToPath(new URL('./labels.json', import.meta.url))

/** 用户标签文件的默认位置：升级插件不会覆盖它。 */
const USER_LABEL_FILE = join(homedir(), '.dsh', 'skill-labels.json')

/** 技能名的公开语法（与技能注册表一致）。 */
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** 单条标签的长度上限，避免把一屏撑爆。 */
const MAX_LABEL_LENGTH = 32

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
  // 简历五件套（~/.dsh/skills 或任意来源）——标签按名字匹配，与技能来源无关
  'dig': '挖简历亮点',
  'format': '简历套模板',
  'generate': '生成简历',
  'polish': '润色简历',
  'review': '点评简历',
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

/** 只接受「对象且不是数组」。 */
function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * 读一个标签 JSON 文件。
 * @returns `{ ok: true, table }`；文件不存在算空表；解析失败返回 `{ ok: false, error }`（不覆盖用户数据）。
 */
export function readLabelTable(path) {
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return { ok: true, table: {} }
    return { ok: false, error: `无法读取 ${path}：${String(error)}` }
  }
  try {
    const parsed = JSON.parse(raw)
    if (!isPlainObject(parsed)) return { ok: false, error: `${path} 的内容必须是 JSON 对象` }
    return { ok: true, table: parsed }
  } catch (error) {
    return { ok: false, error: `${path} 不是合法 JSON：${String(error)}` }
  }
}

/**
 * 把补丁合并进用户标签表并原子写回（先写临时文件再改名）。
 * 已有的合法内容一律保留；不合法的新条目跳过并在结果里列出来。
 * @param path 目标文件。
 * @param patch 技能名 → 标签。
 * @returns `{ written, skipped, total, path }`，写入失败抛错。
 */
export function mergeLabelTable(path, patch) {
  if (!isPlainObject(patch)) throw new Error('labels 必须是一个对象：技能名 → 标签')
  const current = readLabelTable(path)
  if (!current.ok) throw new Error(current.error)
  const table = { ...current.table }
  const skipped = []
  let written = 0
  for (const [key, value] of Object.entries(patch)) {
    const name = typeof key === 'string' ? key.trim() : ''
    const label = typeof value === 'string' ? value.replaceAll(/\s+/g, ' ').trim() : ''
    if (!SKILL_NAME.test(name) || label.length === 0 || label.length > MAX_LABEL_LENGTH) {
      skipped.push(name.length > 0 ? name : JSON.stringify(key))
      continue
    }
    if (table[name] !== label) written += 1
    table[name] = label
  }
  const target = path
  mkdirSync(dirname(target), { recursive: true })
  const temp = `${target}.tmp-${process.pid}`
  writeFileSync(temp, `${JSON.stringify(table, null, 2)}\n`, 'utf8')
  renameSync(temp, target)
  return { path: target, written, skipped, total: Object.keys(table).length }
}

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
    mtime = next
    const read = readLabelTable(path)
    if (read.ok) {
      cached = read.table
    } else {
      logger.warn(`skill-labels: ${read.error}，已忽略该文件`)
    }
    return cached
  }
}

/** 把一段说明渲染成模型可读的文本。 */
export function renderLabelReport(value) {
  if (value.action === 'set') {
    const lines = [`已写入 ${value.written} 条标签到 ${value.path}（该表现有 ${value.total} 条）。`]
    if (Array.isArray(value.skipped) && value.skipped.length > 0) {
      lines.push(`跳过 ${value.skipped.length} 条（名字不是 kebab-case 或标签为空/过长）：${value.skipped.join('、')}`)
    }
    lines.push('下一次读取技能目录时生效，无需重启；模型侧目录会在下一个步骤刷新。')
    return lines.join('\n')
  }
  const skills = Array.isArray(value.skills) ? value.skills : []
  const labeled = skills.filter((skill) => typeof skill.label === 'string' && skill.label.length > 0)
  const unlabeled = skills.filter((skill) => !(typeof skill.label === 'string' && skill.label.length > 0))
  const lines = [`技能目录共 ${skills.length} 项：已标注 ${labeled.length} 项，未标注 ${unlabeled.length} 项。`]
  if (labeled.length > 0) {
    lines.push('', '已标注：')
    for (const skill of labeled) lines.push(`- \`${skill.name}\`: ${skill.label}（来源：${skill.source}）`)
  }
  if (unlabeled.length > 0) {
    lines.push('', '未标注（可用 action=set 补上，标签建议 4–7 个汉字）：')
    for (const skill of unlabeled) {
      lines.push(`- \`${skill.name}\`: ${typeof skill.description === 'string' ? skill.description : ''}`)
    }
  }
  return lines.join('\n')
}

/**
 * 注册 `skill_labels` 工具：让模型自己查/补中文标签。
 * 任何一步失败都只记日志，绝不影响标签渲染功能。
 */
function registerLabelTool(ctx, options) {
  const tools = typeof ctx.get === 'function' ? ctx.get('tools') : undefined
  if (tools === undefined || typeof tools.register !== 'function') {
    ctx.logger.debug('skill-labels: 本 profile 没有 tools 服务，skill_labels 工具未注册')
    return
  }

  /** 标签来源：按优先级从低到高查，返回最后一个命中的表名。 */
  const sourceOf = (tables, skillName) => {
    let source = 'none'
    for (const [key, table] of Object.entries(tables)) {
      const value = table[skillName]
      if (typeof value === 'string' && value.length > 0) source = key
    }
    return source
  }

  const tool = {
    name: 'skill_labels',
    description: [
      '查看或维护技能列表的中文标签。',
      "action='list'：列出当前技能目录里每个技能的中文标签、标签来源，以及还没有标签的技能（附描述）。",
      "action='set'：把 {技能名: 标签} 合并写入用户标签表（默认 ~/.dsh/skill-labels.json），改完下一次读技能目录即生效，无需重启。",
      '用户要求「给技能加/改中文标签」「哪些技能还没标签」时用它。标签建议 4–7 个汉字，能一眼看出技能用途。',
    ].join(' '),
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['action'],
      properties: {
        action: {
          type: 'string',
          enum: ['list', 'set'],
          description: 'list=查看标签与未标注清单；set=写入标签',
        },
        labels: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: '仅 action=set：技能名 → 中文短标签，例如 {"my-skill":"我的技能"}',
        },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['action'],
        properties: {
          action: { type: 'string', required: true },
          path: { type: 'string' },
          written: { type: 'number' },
          total: { type: 'number' },
          skipped: { type: 'array', items: { type: 'string' } },
          skills: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name'],
              properties: {
                name: { type: 'string', required: true },
                label: { type: 'string' },
                source: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => [{ type: 'text', text: renderLabelReport(value) }],
    },
    async execute(args, exec) {
      if (args.action === 'set') {
        const result = mergeLabelTable(options.userFile, args.labels)
        return {
          action: 'set',
          path: result.path,
          written: result.written,
          total: result.total,
          skipped: result.skipped,
        }
      }
      const lookup = {
        cwd: exec?.agent?.session?.header?.cwd,
        signal: exec?.signal,
        scope: exec?.agent,
      }
      const summaries = await ctx.skills.list(lookup)
      const tables = options.labelTables()
      const skills = summaries.map((skill) => {
        const label = tables.config?.[skill.name] ?? tables.user?.[skill.name] ?? tables.package?.[skill.name] ?? tables.builtin?.[skill.name]
        const source = sourceOf(tables, skill.name)
        const summary = { name: skill.name, source }
        if (typeof label === 'string' && label.length > 0) summary.label = label
        if (typeof skill.description === 'string') {
          summary.description = skill.description.length > 160 ? `${skill.description.slice(0, 160)}…` : skill.description
        }
        return summary
      })
      return { action: 'list', skills }
    },
  }

  try {
    tools.register(tool)
    ctx.logger.debug('skill-labels: 已注册 skill_labels 工具')
  } catch (error) {
    ctx.logger.warn(`skill-labels: skill_labels 工具注册失败（${String(error)}），标签功能不受影响`)
  }
}

/**
 * 给技能目录里的每条 summary 前缀中文小标题。
 *
 * @param ctx 宿主上下文（需要 `skills` 服务与 `logger`）。
 * @param config 行配置：`format`、`labels`（名→标签）、`labelsFile`（用户标签表路径，`false` 关闭）。
 */
export function apply(ctx, config = {}) {
  const format = typeof config?.format === 'string' && config.format.includes('{description}')
    ? config.format
    : DEFAULT_FORMAT
  const configLabels = isPlainObject(config?.labels) ? config.labels : {}

  const readPackageLabels = createLabelFileReader(ctx.logger, PACKAGE_LABEL_FILE)
  const userFile = config?.labelsFile === false
    ? undefined
    : typeof config?.labelsFile === 'string' ? config.labelsFile : USER_LABEL_FILE
  const readUserLabels = userFile === undefined ? () => ({}) : createLabelFileReader(ctx.logger, userFile)

  const labelTables = () => ({
    builtin: DEFAULT_LABELS,
    package: readPackageLabels(),
    user: readUserLabels(),
    config: configLabels,
  })
  const labelsFor = () => ({ ...DEFAULT_LABELS, ...readPackageLabels(), ...readUserLabels(), ...configLabels })
  const lookup = (labelTable, skillName) => {
    const value = labelTable[skillName]
    return typeof value === 'string' && value.length > 0 ? value : undefined
  }

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
  } else {
    ctx.logger.debug(`skill-labels: 已包装 skills.${wrapped.join('() / ')}()`)
    ctx.effect(() => () => {
      for (const restore of restores.reverse()) restore()
    }, 'skill-labels: restore registry methods')
  }

  registerLabelTool(ctx, { userFile: userFile ?? USER_LABEL_FILE, labelTables })
}

/** 已加过标签的 summary（按对象身份记，保证包装幂等）。 */
const decorated = new WeakSet()

/** 已经提示过「没有中文标签」的技能名，避免每轮都刷日志。 */
const reported = new Set()
