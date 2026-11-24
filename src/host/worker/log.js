// src/host/worker/log.js
// 10ms host · log: sổ hiệu ứng @. Ghi + phát lại. P4 · D15.
// Thuần trong RAM. Không fetch, không I/O thật.

function d13(expected, fix, seed) {
  const e = new Error('replay');
  e.detail = { error: 'replay', pos: { line: 1, col: 1 }, expected, fix, seed };
  return e;
}

function createLog() {
  const entries = [];

  function record(kind, args, result) {
    entries.push({
      seq: entries.length,
      kind,
      args: JSON.parse(JSON.stringify(args == null ? null : args)),
      result: JSON.parse(JSON.stringify(result == null ? null : result)),
    });
  }

  // replay(script): chạy script, mỗi lần gọi driver.call() đọc từ sổ.
  // Cùng sổ + cùng input → cùng output (P4).
  function replay(script, seed = 0) {
    let cursor = 0;
    const driver = {
      call(kind, args) {
        const e = entries[cursor];
        if (!e) {
          throw d13(
            'a log entry #' + cursor + ' for ' + kind + '(' + JSON.stringify(args) + ')',
            'run program once with fresh store to build the log first',
            seed
          );
        }
        if (e.kind !== kind || JSON.stringify(e.args) !== JSON.stringify(args)) {
          throw d13(
            'entry #' + cursor + ' = ' + e.kind + '(' + JSON.stringify(e.args) + ')',
            'align script with log; entry #' + cursor + ' says ' + JSON.stringify(e),
            seed
          );
        }
        cursor++;
        return e.result;
      },
    };
    const result = script(driver);
    return { result, consumed: cursor, total: entries.length };
  }

  function snapshot() { return JSON.parse(JSON.stringify(entries)); }
  function size()     { return entries.length; }
  function clear()    { entries.length = 0; }

  return { record, replay, snapshot, size, clear };
}

module.exports = { createLog };