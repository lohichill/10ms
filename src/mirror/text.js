// src/mirror/text.js
// 10ms mirror · text: AST → tiếng người. Chỉ đọc, không chạy, không sửa, không ghi.
// D21 Mirror · D3 (người đọc được là quà) · P4 deterministic.

function expr(n) {
  if (!n) return '?';
  switch (n.type) {
    case 'Number': return 'số ' + n.value;
    case 'String': return '"' + n.value + '"';
    case 'Var':    return 'biến ' + n.name;
    case 'Path':   return n.path;
    case 'Array':
      return n.items.length === 0
        ? 'danh sách rỗng'
        : 'danh sách [' + n.items.map(expr).join(', ') + ']';
    case 'Binary': return expr(n.left) + ' cộng ' + expr(n.right);
    case 'Object':
      return '{' + n.entries.map(e => e.key + ': ' + expr(e.value)).join(', ') + '}';
    case 'Effect': return '@' + n.path;
    default:       return '?';
  }
}

function stmt(n, indent) {
  const pad = '  '.repeat(indent);
  switch (n.type) {
    case 'Assign':
      return pad + 'Đặt ' + n.name + ' = ' + expr(n.value);

    case 'Input':
      return pad + 'Ô nhập cho ' + n.var;

    case 'P':
      return pad + 'Hiển thị ' + expr(n.expr);

    case 'Btn': {
      const lines = [pad + 'Nút "' + n.label + '" khi bấm thì:'];
      for (const s of n.body) lines.push(stmt(s, indent + 1));
      return lines.join('\n');
    }

    case 'Each': {
      const lines = [pad + 'Với mỗi ' + n.var + ' trong ' + expr(n.list) + ' thì:'];
      for (const s of n.body) lines.push(stmt(s, indent + 1));
      return lines.join('\n');
    }

    case 'Page': {
      const lines = [pad + 'Trang ' + (n.path || '/') + ':'];
      for (const s of n.body) lines.push(stmt(s, indent + 1));
      return lines.join('\n');
    }

    case 'On': {
      const what = n.method ? (n.method + ' ' + n.path) : ('mỗi ' + n.every);
      const lines = [pad + 'Khi ' + what + ' thì:'];
      for (const s of n.body) lines.push(stmt(s, indent + 1));
      return lines.join('\n');
    }

    case 'Need':
      return pad + 'Cần ' + n.path + ' là ' + n.ty;

    case 'Reply':
      return pad + 'Trả lời ' + expr(n.value);

    case 'EffectCall':
      return pad + 'Chạm ' + '@' + n.path;

    default:
      return pad + '(không rõ: ' + n.type + ')';
  }
}

// text(ast) → chuỗi nhiều dòng, đọc được bằng mắt người.
function text(ast) {
  if (!ast || ast.type !== 'Program') return '(không phải chương trình)';
  return ast.body.map(n => stmt(n, 0)).join('\n');
}

module.exports = { text };