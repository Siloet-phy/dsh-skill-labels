/**
 * dsh-skill-labels 自检：不需要装进 DSH，用假注册表跑一遍全部逻辑。
 * 运行：node selftest.mjs
 *
 * 每个用例都用**独立**的注册表类（独立原型），这样包装不会串到别的用例上——
 * 真实环境里只有一个注册表类，本插件也只挂一次。
 */
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, utimesSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, mergeLabelTable, readLabelTable, renderLabelReport, DEFAULT_LABELS } from './index.js'

const logger = { debug: () => {}, warn: (message) => console.log('[warn]', message) }

/** 造一个临时目录，返回路径与清理函数。 */
function tempDir() {
  const dir = mkdtempSync(join(tmpdir(), 'skill-labels-'))
  return { dir, file: join(dir, 'labels.json'), cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

/** 需要 mtime 变化时把文件时间往前拨。 */
function bumpMtime(file) {
  const future = new Date(Date.now() + 2000)
  utimesSync(file, future, future)
}

function makeCtx(skills, options = {}) {
  class FakeRegistry {
    constructor(initial) {
      this.skills = initial
    }
    async snapshot() {
      return { skills: this.skills.map((skill) => ({ ...skill })), complete: true }
    }
    async list() {
      return (await this.snapshot()).skills
    }
  }
  const disposers = []
  const registered = []
  const ctx = {
    logger,
    skills: new FakeRegistry(skills),
    effect: (fn) => { disposers.push(fn()) },
    get: (service) => service === 'tools' && options.withTools !== false
      ? { register: (tool) => registered.push(tool) }
      : undefined,
  }
  return {
    ctx,
    registry: ctx.skills,
    registered,
    disposeAll: () => disposers.splice(0).forEach((fn) => fn()),
  }
}

// 1. 基本行为：加标签、保留原字段、未知技能不动
{
  const { ctx, registry, disposeAll } = makeCtx([
    { name: 'html-ppt', description: 'HTML PPT Studio — author decks.', invocation: { modelInvocable: true, userInvocable: true } },
    { name: 'nobody-knows-me', description: 'mystery skill' },
  ])
  apply(ctx, {})

  const snapshot = await registry.snapshot()
  assert.equal(snapshot.skills[0].description, `【${DEFAULT_LABELS['html-ppt']}】HTML PPT Studio — author decks.`)
  assert.equal(snapshot.skills[1].description, 'mystery skill', '没标签的技能必须原样保留')
  assert.equal(snapshot.complete, true, '其它字段必须原样保留')

  const list = await registry.list()
  assert.equal(list[0].description, snapshot.skills[0].description, 'list→snapshot 串联时不能叠加两次标签')

  assert.equal(registry.skills[0].description, 'HTML PPT Studio — author decks.', '原对象不能被就地改写')
  assert.equal((await registry.snapshot()).skills[0].description, snapshot.skills[0].description, '重复调用仍只有一层标签')

  disposeAll()
  assert.equal((await registry.snapshot()).skills[0].description, 'HTML PPT Studio — author decks.', '卸载后应恢复未加标签的目录')
}

// 2. 行配置覆盖标签与排版
{
  const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
  apply(ctx, { format: '{label}｜{description}', labels: { 'html-ppt': '做幻灯片' } })
  assert.equal((await registry.snapshot()).skills[0].description, '做幻灯片｜raw')
}

// 3. 用户标签文件按 mtime 懒加载
{
  const { dir, file, cleanup } = tempDir()
  try {
    writeFileSync(file, JSON.stringify({ 'html-ppt': '第一版' }))
    const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
    apply(ctx, { labelsFile: file })
    assert.equal((await registry.snapshot()).skills[0].description, '【第一版】raw')

    writeFileSync(file, JSON.stringify({ 'html-ppt': '第二版' }))
    bumpMtime(file)
    assert.equal((await registry.snapshot()).skills[0].description, '【第二版】raw', '改文件后应立刻生效，不用重启')
  } finally {
    cleanup()
    assert.ok(dir)
  }
}

// 4. 同一份文件被挂两次也不能叠加
{
  const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
  apply(ctx, {})
  apply(ctx, {})
  assert.equal((await registry.snapshot()).skills[0].description, `【${DEFAULT_LABELS['html-ppt']}】raw`)
}

// 5. 坏标签文件不能把目录搞挂
{
  const { file, cleanup } = tempDir()
  try {
    writeFileSync(file, '{ 这不是 JSON')
    const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
    apply(ctx, { labelsFile: file })
    assert.equal((await registry.snapshot()).skills[0].description, `【${DEFAULT_LABELS['html-ppt']}】raw`, '坏文件应被忽略，退回内置表')
  } finally {
    cleanup()
  }
}

// 6. mergeLabelTable：合并写入、保留已有、跳过非法条目
{
  const { file, cleanup } = tempDir()
  try {
    writeFileSync(file, JSON.stringify({ keep: '保留我' }))
    const result = mergeLabelTable(file, {
      'my-skill': '我的技能',
      keep: '保留我',
      'BAD NAME': '非法名字',
      'ok-skill': '',
    })
    assert.equal(result.written, 1, '只有内容变化的条目计入 written')
    assert.deepEqual(result.skipped.sort(), ['BAD NAME', 'ok-skill'])
    assert.equal(result.total, 2)
    const written = JSON.parse(readFileSync(file, 'utf8'))
    assert.deepEqual(written, { keep: '保留我', 'my-skill': '我的技能' })
  } finally {
    cleanup()
  }
}

// 7. readLabelTable：文件不存在算空表；坏 JSON 返回不 ok（避免覆盖用户数据）
{
  const { file, cleanup } = tempDir()
  try {
    assert.deepEqual(readLabelTable(file), { ok: true, table: {} })
    writeFileSync(file, '[1,2,3]')
    assert.equal(readLabelTable(file).ok, false)
    writeFileSync(file, '{oops')
    assert.equal(readLabelTable(file).ok, false)
    assert.throws(() => mergeLabelTable(file, { a: 'b' }), /不是合法 JSON/, '坏文件必须拒绝写入而不是覆盖')
  } finally {
    cleanup()
  }
}

// 8. skill_labels 工具：注册形状、list 输出、set 落盘
{
  const { file, cleanup } = tempDir()
  try {
    const { ctx, registry, registered } = makeCtx(
      [
        { name: 'html-ppt', description: 'HTML PPT Studio — author decks.' },
        { name: 'brand-new-skill', description: 'Something nobody labelled yet.' },
      ],
      { withTools: true },
    )
    apply(ctx, { labelsFile: file })

    assert.equal(registered.length, 1, '应当注册一个工具')
    const tool = registered[0]
    assert.equal(tool.name, 'skill_labels')
    assert.equal(typeof tool.execute, 'function')
    assert.equal(typeof tool.output.render, 'function')
    assert.equal(tool.parameters.required[0], 'action')
    assert.deepEqual(tool.output.schema.required, ['action'])

    // list：已标注 / 未标注都能报出来
    const listed = await tool.execute({ action: 'list' }, {})
    assert.equal(listed.action, 'list')
    const byName = Object.fromEntries(listed.skills.map((skill) => [skill.name, skill]))
    assert.equal(byName['html-ppt'].label, DEFAULT_LABELS['html-ppt'])
    assert.equal(byName['html-ppt'].source, 'builtin')
    assert.equal(byName['brand-new-skill'].label, undefined)
    assert.equal(byName['brand-new-skill'].source, 'none')
    const text = renderLabelReport(listed)
    assert.match(text, /未标注 1 项/)
    assert.match(text, /brand-new-skill/)

    // set：写进用户表，并且目录立刻变（mtime 懒加载 + 幂等包装）
    const set = await tool.execute({ action: 'set', labels: { 'brand-new-skill': '新技能' } }, {})
    assert.equal(set.action, 'set')
    assert.equal(set.written, 1)
    assert.equal(JSON.parse(readFileSync(file, 'utf8'))['brand-new-skill'], '新技能')
    assert.match(renderLabelReport(set), /已写入 1 条标签/)

    const after = await registry.list()
    assert.equal(after[1].description, '【新技能】Something nobody labelled yet.')
  } finally {
    cleanup()
  }
}

// 9. 没有 tools 服务时：只做标签，不报错
{
  const { ctx, registry, registered } = makeCtx([{ name: 'html-ppt', description: 'raw' }], { withTools: false })
  apply(ctx, {})
  assert.equal(registered.length, 0)
  assert.equal((await registry.snapshot()).skills[0].description, `【${DEFAULT_LABELS['html-ppt']}】raw`)
}

console.log('selftest: 全部通过 ✅')
