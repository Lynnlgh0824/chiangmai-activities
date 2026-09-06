// _selftest-cdn-fallback.cjs — 模拟 CDN 失败/成功，验证 cache 兜底
const fs = require('fs');
const path = require('path');

// 把 app.js 里的 require('./utils/cache') 替成 global.cache，避免 ESM 解析
const rawCode = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const code = rawCode.replace(/require\(['"]\.\/utils\/cache['"]\)/g, 'global.__cache');

let pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ✓ ' + name); }
  else { fail++; console.log('  ✗ ' + name, extra !== undefined ? ' → ' + JSON.stringify(extra) : ''); }
}

// 通用执行器：注入 mock → eval app.js → 跑 onLaunch → 等异步 → 检查
function runScenario(name, opts) {
  console.log('\n[' + name + ']');
  let capturedApp = null;
  global.App = function(o) { capturedApp = o; };
  global.__cache = {
    get: () => opts.cacheData || null,
    set: (k, v) => { global._lastCacheSet = { k, v }; },
    remove: () => {}, clear: () => {}
  };
  global.wx = {
    getAccountInfoSync: () => ({ miniProgram: { envVersion: 'release' } }),
    getStorageSync: (k) => {
      if (k && k.includes('activities')) return opts.cacheData ? { data: opts.cacheData, expire: Date.now() + 999999 } : '';
      return '';
    },
    setStorageSync: global.__cache.set,
    removeStorageSync: () => {},
    getStorageInfoSync: () => ({ keys: [] }),
    request: opts.requestMock || function({ fail }) { setTimeout(() => fail({ errMsg: 'fail' }), 0); }
  };
  global.getApp = () => ({ globalData: {} });

  // 清掉之前的状态
  delete global._lastCacheSet;
  eval(code);

  capturedApp.globalData = { activities: [], categories: [], _readyCallbacks: [], _ready: false };
  capturedApp.onLaunch();

  return new Promise(resolve => setTimeout(() => {
    Object.assign(capturedApp.globalData, opts.assert);
    resolve(capturedApp.globalData);
  }, 50));
}

(async () => {
  // ========== 场景 1：CDN 成功 + 无缓存（首次访问） ==========
  let gd = await runScenario('场景 1: CDN 成功 + 无缓存（首次访问）', {
    cacheData: null,
    requestMock: function({ success }) {
      setTimeout(() => success({ statusCode: 200, data: [
        { id: 'a', title: 'online1', category: '市集' },
        { id: 'b', title: 'online2', category: '瑜伽' }
      ] }), 0);
    }
  });
  ok('CDN 成功：_ready=true', gd._ready === true);
  ok('CDN 成功：activities 加载', gd.activities.length === 2);
  ok('CDN 成功：categories 含「全部」+ 子分类', gd.categories.includes('全部') && gd.categories.includes('市集') && gd.categories.includes('瑜伽'));
  ok('CDN 成功：缓存写入被触发', global._lastCacheSet && global._lastCacheSet.k && global._lastCacheSet.k.includes('activities'));

  // ========== 场景 2：CDN 失败 + 有缓存（兜底） ==========
  gd = await runScenario('场景 2: CDN 失败 + 有缓存（兜底）', {
    cacheData: [{ id: 'cached', title: 'cached-item', category: '冥想' }],
    requestMock: function({ fail }) { setTimeout(() => fail({ errMsg: 'request:fail timeout' }), 0); }
  });
  ok('CDN 失败 + 有缓存：_ready=true（兜底成功）', gd._ready === true);
  ok('CDN 失败 + 有缓存：activities 用缓存', gd.activities.length === 1 && gd.activities[0].title === 'cached-item');
  ok('CDN 失败 + 有缓存：categories 来自缓存', gd.categories.includes('冥想'));

  // ========== 场景 3：CDN 失败 + 无缓存（首次访问完全断网） ==========
  gd = await runScenario('场景 3: CDN 失败 + 无缓存（首次完全断网）', {
    cacheData: null,
    requestMock: function({ fail }) { setTimeout(() => fail({ errMsg: 'request:fail timeout' }), 0); }
  });
  ok('CDN 失败 + 无缓存：_ready=false（页面需自己处理超时）', gd._ready === false);
  ok('CDN 失败 + 无缓存：activities 为空', gd.activities.length === 0);

  // ========== 场景 4：CDN 返回 503 + 有缓存（服务器挂掉） ==========
  gd = await runScenario('场景 4: CDN 返回 503 + 有缓存（服务器挂掉）', {
    cacheData: [{ id: 'cached2', title: 'cached-server-down', category: '运动' }],
    requestMock: function({ success }) { setTimeout(() => success({ statusCode: 503, data: 'Service Unavailable' }), 0); }
  });
  ok('CDN 503 + 有缓存：_ready=true', gd._ready === true);
  ok('CDN 503 + 有缓存：仍用缓存', gd.activities.length === 1 && gd.activities[0].title === 'cached-server-down');

  // ========== 场景 5：CDN 返回包装格式 {success,data,pagination} ==========
  gd = await runScenario('场景 5: CDN 返回包装格式（兼容旧 API）', {
    cacheData: null,
    requestMock: function({ success }) {
      setTimeout(() => success({ statusCode: 200, data: { success: true, data: [{ id: 'wrap', title: 'wrapped', category: '舞蹈' }] } }), 0);
    }
  });
  ok('包装格式：解析 .data 字段', gd.activities.length === 1 && gd.activities[0].title === 'wrapped');

  console.log('\n==== 结果 ====');
  console.log(`PASS=${pass} FAIL=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
