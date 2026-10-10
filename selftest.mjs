/**
 * dsh-skill-labels 自检：用假注册表跑一遍包装逻辑，不需要装进 DSH。
 * 运行：node selftest.mjs
 *
 * 每个用例都用**独立**的注册表类（独立原型），这样包装不会串到别的用例上——
 * 真实环境里只有一个注册表类，本插件也只挂一次。
 */
import assert from 'node:assert/strict'
import { writeFileSync, utimesSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { apply, DEFAULT_LABELS } from './index.js'

const logger = { debug: () => {}, warn: (message) => console.log('[warn]', message) }

function makeCtx(skills) {
  class FakeRegistry {
    constructor(initial) {
      this.skills = initial
      this.calls = { snapshot: 0, list: 0 }
    }
    async snapshot() {
      this.calls.snapshot += 1
      return { skills: this.skills.map((skill) => ({ ...skill })), complete: true }
    }
    async list() {
      this.calls.list += 1
      // 真实实现就是 this.snapshot() 之后再取 .skills
      return (await this.snapshot()).skills
    }
  }
  const disposers = []
  const ctx = {
    logger,
    skills: new FakeRegistry(skills),
    effect: (fn) => { disposers.push(fn()) },
  }
  return { ctx, registry: ctx.skills, disposeAll: () => disposers.splice(0).forEach((fn) => fn()) }
}

// 1. 基本行为
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
  const dir = mkdtempSync(join(tmpdir(), 'skill-labels-'))
  const userFile = join(dir, 'skill-labels.json')
  try {
    writeFileSync(userFile, JSON.stringify({ 'html-ppt': '第一版' }))
    const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
    apply(ctx, { labelsFile: userFile })
    assert.equal((await registry.snapshot()).skills[0].description, '【第一版】raw')

    writeFileSync(userFile, JSON.stringify({ 'html-ppt': '第二版' }))
    const future = new Date(Date.now() + 2000)
    utimesSync(userFile, future, future)
    assert.equal((await registry.snapshot()).skills[0].description, '【第二版】raw', '改文件后应立刻生效，不用重启')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

// 4. 同一份文件被挂两次（两种装法同时存在）也不能叠加
{
  const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
  apply(ctx, {})
  apply(ctx, {})
  assert.equal((await registry.snapshot()).skills[0].description, `【${DEFAULT_LABELS['html-ppt']}】raw`)
}

// 5. 坏标签文件不能把目录搞挂
{
  const dir = mkdtempSync(join(tmpdir(), 'skill-labels-'))
  const userFile = join(dir, 'skill-labels.json')
  try {
    writeFileSync(userFile, '{ 这不是 JSON')
    const { ctx, registry } = makeCtx([{ name: 'html-ppt', description: 'raw' }])
    apply(ctx, { labelsFile: userFile })
    assert.equal((await registry.snapshot()).skills[0].description, `【${DEFAULT_LABELS['html-ppt']}】raw`, '坏文件应被忽略，退回内置表')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

console.log('selftest: 全部通过 ✅')
