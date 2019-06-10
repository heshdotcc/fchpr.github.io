'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var sirv = _interopDefault(require('sirv'));
var polka = _interopDefault(require('polka'));
var compression = _interopDefault(require('compression'));
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var Stream = _interopDefault(require('stream'));
var http = _interopDefault(require('http'));
var Url = _interopDefault(require('url'));
var https = _interopDefault(require('https'));
var zlib = _interopDefault(require('zlib'));

function sendJson(res, json) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', `max-age=${5 * 60 * 1e3}`); // 5 minutes

  res.end(JSON.stringify(json));
}

function notFound(res) {
  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'not found' }));
}

function __extends(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
var ParseError = /** @class */ (function (_super) {
    __extends(ParseError, _super);
    function ParseError(message, pos, loc) {
        var _this = _super.call(this, message) || this;
        _this.pos = pos;
        _this.loc = loc;
        return _this;
    }
    return ParseError;
}(Error));

function extract_frontmatter(markdown) {
	const match = /---\r?\n([\s\S]+?)\r?\n---/.exec(markdown);
	const frontMatter = match[1];
	const content = markdown.slice(match[0].length);

	const metadata = {};
	frontMatter.split('\n').forEach(pair => {
		const colonIndex = pair.indexOf(':');
		metadata[pair.slice(0, colonIndex).trim()] = pair
			.slice(colonIndex + 1)
			.trim();
	});

	return { metadata, content };
}


// links renderer
function link_renderer (href, title, text) {
	let target_attr = '';
	let title_attr = '';

	if(href.startsWith("http")) {
		target_attr = ' target="_blank"';
	}

	if(title !== null) {
		title_attr = ` title="${title}"`;
	}

	return `<a href="${href}"${target_attr}${title_attr}>${text}</a>`;
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var marked = createCommonjsModule(function (module, exports) {
(function(root) {

/**
 * Block-Level Grammar
 */

var block = {
  newline: /^\n+/,
  code: /^( {4}[^\n]+\n*)+/,
  fences: noop,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
  nptable: noop,
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  list: /^( {0,3})(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  html: '^ {0,3}(?:' // optional indentation
    + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
    + '|comment[^\\n]*(\\n+|$)' // (2)
    + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
    + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
    + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
    + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
    + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
    + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
    + ')',
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  table: noop,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  text: /^[^\n]+/
};

block._label = /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/;
block._title = /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/;
block.def = edit(block.def)
  .replace('label', block._label)
  .replace('title', block._title)
  .getRegex();

block.bullet = /(?:[*+-]|\d{1,9}\.)/;
block.item = /^( *)(bull) ?[^\n]*(?:\n(?!\1bull ?)[^\n]*)*/;
block.item = edit(block.item, 'gm')
  .replace(/bull/g, block.bullet)
  .getRegex();

block.list = edit(block.list)
  .replace(/bull/g, block.bullet)
  .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
  .replace('def', '\\n+(?=' + block.def.source + ')')
  .getRegex();

block._tag = 'address|article|aside|base|basefont|blockquote|body|caption'
  + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
  + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
  + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
  + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
  + '|track|ul';
block._comment = /<!--(?!-?>)[\s\S]*?-->/;
block.html = edit(block.html, 'i')
  .replace('comment', block._comment)
  .replace('tag', block._tag)
  .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
  .getRegex();

block.paragraph = edit(block.paragraph)
  .replace('hr', block.hr)
  .replace('heading', block.heading)
  .replace('lheading', block.lheading)
  .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
  .getRegex();

block.blockquote = edit(block.blockquote)
  .replace('paragraph', block.paragraph)
  .getRegex();

/**
 * Normal Block Grammar
 */

block.normal = merge({}, block);

/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ {0,3}(`{3,}|~{3,})([^`\n]*)\n(?:|([\s\S]*?)\n)(?: {0,3}\1[~`]* *(?:\n+|$)|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = edit(block.paragraph)
  .replace('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  .getRegex();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
});

/**
 * Pedantic grammar
 */

block.pedantic = merge({}, block.normal, {
  html: edit(
    '^ *(?:comment *(?:\\n|\\s*$)'
    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
    .replace('comment', block._comment)
    .replace(/tag/g, '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
});

/**
 * Block Lexer
 */

function Lexer(options) {
  this.tokens = [];
  this.tokens.links = Object.create(null);
  this.options = options || marked.defaults;
  this.rules = block.normal;

  if (this.options.pedantic) {
    this.rules = block.pedantic;
  } else if (this.options.gfm) {
    if (this.options.tables) {
      this.rules = block.tables;
    } else {
      this.rules = block.gfm;
    }
  }
}

/**
 * Expose Block Rules
 */

Lexer.rules = block;

/**
 * Static Lex Method
 */

Lexer.lex = function(src, options) {
  var lexer = new Lexer(options);
  return lexer.lex(src);
};

/**
 * Preprocessing
 */

Lexer.prototype.lex = function(src) {
  src = src
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, '    ')
    .replace(/\u00a0/g, ' ')
    .replace(/\u2424/g, '\n');

  return this.token(src, true);
};

/**
 * Lexing
 */

Lexer.prototype.token = function(src, top) {
  src = src.replace(/^ +$/gm, '');
  var next,
      loose,
      cap,
      bull,
      b,
      item,
      listStart,
      listItems,
      t,
      space,
      i,
      tag,
      l,
      isordered,
      istask,
      ischecked;

  while (src) {
    // newline
    if (cap = this.rules.newline.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[0].length > 1) {
        this.tokens.push({
          type: 'space'
        });
      }
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      cap = cap[0].replace(/^ {4}/gm, '');
      this.tokens.push({
        type: 'code',
        text: !this.options.pedantic
          ? rtrim(cap, '\n')
          : cap
      });
      continue;
    }

    // fences (gfm)
    if (cap = this.rules.fences.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'code',
        lang: cap[2] ? cap[2].trim() : cap[2],
        text: cap[3] || ''
      });
      continue;
    }

    // heading
    if (cap = this.rules.heading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[1].length,
        text: cap[2]
      });
      continue;
    }

    // table no leading pipe (gfm)
    if (cap = this.rules.nptable.exec(src)) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length);

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(item.cells[i], item.header.length);
        }

        this.tokens.push(item);

        continue;
      }
    }

    // hr
    if (cap = this.rules.hr.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'hr'
      });
      continue;
    }

    // blockquote
    if (cap = this.rules.blockquote.exec(src)) {
      src = src.substring(cap[0].length);

      this.tokens.push({
        type: 'blockquote_start'
      });

      cap = cap[0].replace(/^ *> ?/gm, '');

      // Pass `top` to keep the current
      // "toplevel" state. This is exactly
      // how markdown.pl works.
      this.token(cap, top);

      this.tokens.push({
        type: 'blockquote_end'
      });

      continue;
    }

    // list
    if (cap = this.rules.list.exec(src)) {
      src = src.substring(cap[0].length);
      bull = cap[2];
      isordered = bull.length > 1;

      listStart = {
        type: 'list_start',
        ordered: isordered,
        start: isordered ? +bull : '',
        loose: false
      };

      this.tokens.push(listStart);

      // Get each top-level item.
      cap = cap[0].match(this.rules.item);

      listItems = [];
      next = false;
      l = cap.length;
      i = 0;

      for (; i < l; i++) {
        item = cap[i];

        // Remove the list item's bullet
        // so it is seen as the next token.
        space = item.length;
        item = item.replace(/^ *([*+-]|\d+\.) */, '');

        // Outdent whatever the
        // list item contains. Hacky.
        if (~item.indexOf('\n ')) {
          space -= item.length;
          item = !this.options.pedantic
            ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
            : item.replace(/^ {1,4}/gm, '');
        }

        // Determine whether the next list item belongs here.
        // Backpedal if it does not belong in this list.
        if (i !== l - 1) {
          b = block.bullet.exec(cap[i + 1])[0];
          if (bull.length > 1 ? b.length === 1
            : (b.length > 1 || (this.options.smartLists && b !== bull))) {
            src = cap.slice(i + 1).join('\n') + src;
            i = l - 1;
          }
        }

        // Determine whether item is loose or not.
        // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
        // for discount behavior.
        loose = next || /\n\n(?!\s*$)/.test(item);
        if (i !== l - 1) {
          next = item.charAt(item.length - 1) === '\n';
          if (!loose) loose = next;
        }

        if (loose) {
          listStart.loose = true;
        }

        // Check for task list items
        istask = /^\[[ xX]\] /.test(item);
        ischecked = undefined;
        if (istask) {
          ischecked = item[1] !== ' ';
          item = item.replace(/^\[[ xX]\] +/, '');
        }

        t = {
          type: 'list_item_start',
          task: istask,
          checked: ischecked,
          loose: loose
        };

        listItems.push(t);
        this.tokens.push(t);

        // Recurse.
        this.token(item, false);

        this.tokens.push({
          type: 'list_item_end'
        });
      }

      if (listStart.loose) {
        l = listItems.length;
        i = 0;
        for (; i < l; i++) {
          listItems[i].loose = true;
        }
      }

      this.tokens.push({
        type: 'list_end'
      });

      continue;
    }

    // html
    if (cap = this.rules.html.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: this.options.sanitize
          ? 'paragraph'
          : 'html',
        pre: !this.options.sanitizer
          && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
        text: cap[0]
      });
      continue;
    }

    // def
    if (top && (cap = this.rules.def.exec(src))) {
      src = src.substring(cap[0].length);
      if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
      tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
      if (!this.tokens.links[tag]) {
        this.tokens.links[tag] = {
          href: cap[2],
          title: cap[3]
        };
      }
      continue;
    }

    // table (gfm)
    if (cap = this.rules.table.exec(src)) {
      item = {
        type: 'table',
        header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
        align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
        cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
      };

      if (item.header.length === item.align.length) {
        src = src.substring(cap[0].length);

        for (i = 0; i < item.align.length; i++) {
          if (/^ *-+: *$/.test(item.align[i])) {
            item.align[i] = 'right';
          } else if (/^ *:-+: *$/.test(item.align[i])) {
            item.align[i] = 'center';
          } else if (/^ *:-+ *$/.test(item.align[i])) {
            item.align[i] = 'left';
          } else {
            item.align[i] = null;
          }
        }

        for (i = 0; i < item.cells.length; i++) {
          item.cells[i] = splitCells(
            item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
            item.header.length);
        }

        this.tokens.push(item);

        continue;
      }
    }

    // lheading
    if (cap = this.rules.lheading.exec(src)) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'heading',
        depth: cap[2] === '=' ? 1 : 2,
        text: cap[1]
      });
      continue;
    }

    // top-level paragraph
    if (top && (cap = this.rules.paragraph.exec(src))) {
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'paragraph',
        text: cap[1].charAt(cap[1].length - 1) === '\n'
          ? cap[1].slice(0, -1)
          : cap[1]
      });
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      // Top-level should never reach here.
      src = src.substring(cap[0].length);
      this.tokens.push({
        type: 'text',
        text: cap[0]
      });
      continue;
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return this.tokens;
};

/**
 * Inline-Level Grammar
 */

var inline = {
  escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
  url: noop,
  tag: '^comment'
    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
  link: /^!?\[(label)\]\(href(?:\s+(title))?\s*\)/,
  reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
  nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
  strong: /^__([^\s_])__(?!_)|^\*\*([^\s*])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
  em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_|[^\spunctuation])|^_([^\s_][\s\S]*?[^\s])_(?!_|[^\spunctuation])|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
  code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  br: /^( {2,}|\\)\n(?!\s*$)/,
  del: noop,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*]|\b_|$)|[^ ](?= {2,}\n))|(?= {2,}\n))/
};

// list of punctuation marks from common mark spec
// without ` and ] to workaround Rule 17 (inline code blocks/links)
inline._punctuation = '!"#$%&\'()*+,\\-./:;<=>?@\\[^_{|}~';
inline.em = edit(inline.em).replace(/punctuation/g, inline._punctuation).getRegex();

inline._escapes = /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g;

inline._scheme = /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/;
inline._email = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/;
inline.autolink = edit(inline.autolink)
  .replace('scheme', inline._scheme)
  .replace('email', inline._email)
  .getRegex();

inline._attribute = /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/;

inline.tag = edit(inline.tag)
  .replace('comment', block._comment)
  .replace('attribute', inline._attribute)
  .getRegex();

inline._label = /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|`(?!`)|[^\[\]\\`])*?/;
inline._href = /\s*(<(?:\\[<>]?|[^\s<>\\])*>|[^\s\x00-\x1f]*)/;
inline._title = /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/;

inline.link = edit(inline.link)
  .replace('label', inline._label)
  .replace('href', inline._href)
  .replace('title', inline._title)
  .getRegex();

inline.reflink = edit(inline.reflink)
  .replace('label', inline._label)
  .getRegex();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
  strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
  em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
  link: edit(/^!?\[(label)\]\((.*?)\)/)
    .replace('label', inline._label)
    .getRegex(),
  reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
    .replace('label', inline._label)
    .getRegex()
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
  escape: edit(inline.escape).replace('])', '~|])').getRegex(),
  _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
  url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
  _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
  del: /^~+(?=\S)([\s\S]*?\S)~+/,
  text: /^(`+|[^`])(?:[\s\S]*?(?:(?=[\\<!\[`*~]|\b_|https?:\/\/|ftp:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))|(?= {2,}\n|[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))/
});

inline.gfm.url = edit(inline.gfm.url, 'i')
  .replace('email', inline.gfm._extended_email)
  .getRegex();
/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
  br: edit(inline.br).replace('{2,}', '*').getRegex(),
  text: edit(inline.gfm.text).replace(/\{2,\}/g, '*').getRegex()
});

/**
 * Inline Lexer & Compiler
 */

function InlineLexer(links, options) {
  this.options = options || marked.defaults;
  this.links = links;
  this.rules = inline.normal;
  this.renderer = this.options.renderer || new Renderer();
  this.renderer.options = this.options;

  if (!this.links) {
    throw new Error('Tokens array requires a `links` property.');
  }

  if (this.options.pedantic) {
    this.rules = inline.pedantic;
  } else if (this.options.gfm) {
    if (this.options.breaks) {
      this.rules = inline.breaks;
    } else {
      this.rules = inline.gfm;
    }
  }
}

/**
 * Expose Inline Rules
 */

InlineLexer.rules = inline;

/**
 * Static Lexing/Compiling Method
 */

InlineLexer.output = function(src, links, options) {
  var inline = new InlineLexer(links, options);
  return inline.output(src);
};

/**
 * Lexing/Compiling
 */

InlineLexer.prototype.output = function(src) {
  var out = '',
      link,
      text,
      href,
      title,
      cap,
      prevCapZero;

  while (src) {
    // escape
    if (cap = this.rules.escape.exec(src)) {
      src = src.substring(cap[0].length);
      out += escape(cap[1]);
      continue;
    }

    // tag
    if (cap = this.rules.tag.exec(src)) {
      if (!this.inLink && /^<a /i.test(cap[0])) {
        this.inLink = true;
      } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
        this.inLink = false;
      }
      if (!this.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = true;
      } else if (this.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
        this.inRawBlock = false;
      }

      src = src.substring(cap[0].length);
      out += this.options.sanitize
        ? this.options.sanitizer
          ? this.options.sanitizer(cap[0])
          : escape(cap[0])
        : cap[0];
      continue;
    }

    // link
    if (cap = this.rules.link.exec(src)) {
      var lastParenIndex = findClosingBracket(cap[2], '()');
      if (lastParenIndex > -1) {
        var linkLen = cap[0].length - (cap[2].length - lastParenIndex) - (cap[3] || '').length;
        cap[2] = cap[2].substring(0, lastParenIndex);
        cap[0] = cap[0].substring(0, linkLen).trim();
        cap[3] = '';
      }
      src = src.substring(cap[0].length);
      this.inLink = true;
      href = cap[2];
      if (this.options.pedantic) {
        link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);

        if (link) {
          href = link[1];
          title = link[3];
        } else {
          title = '';
        }
      } else {
        title = cap[3] ? cap[3].slice(1, -1) : '';
      }
      href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
      out += this.outputLink(cap, {
        href: InlineLexer.escapes(href),
        title: InlineLexer.escapes(title)
      });
      this.inLink = false;
      continue;
    }

    // reflink, nolink
    if ((cap = this.rules.reflink.exec(src))
        || (cap = this.rules.nolink.exec(src))) {
      src = src.substring(cap[0].length);
      link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
      link = this.links[link.toLowerCase()];
      if (!link || !link.href) {
        out += cap[0].charAt(0);
        src = cap[0].substring(1) + src;
        continue;
      }
      this.inLink = true;
      out += this.outputLink(cap, link);
      this.inLink = false;
      continue;
    }

    // strong
    if (cap = this.rules.strong.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.strong(this.output(cap[4] || cap[3] || cap[2] || cap[1]));
      continue;
    }

    // em
    if (cap = this.rules.em.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]));
      continue;
    }

    // code
    if (cap = this.rules.code.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.codespan(escape(cap[2].trim(), true));
      continue;
    }

    // br
    if (cap = this.rules.br.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.br();
      continue;
    }

    // del (gfm)
    if (cap = this.rules.del.exec(src)) {
      src = src.substring(cap[0].length);
      out += this.renderer.del(this.output(cap[1]));
      continue;
    }

    // autolink
    if (cap = this.rules.autolink.exec(src)) {
      src = src.substring(cap[0].length);
      if (cap[2] === '@') {
        text = escape(this.mangle(cap[1]));
        href = 'mailto:' + text;
      } else {
        text = escape(cap[1]);
        href = text;
      }
      out += this.renderer.link(href, null, text);
      continue;
    }

    // url (gfm)
    if (!this.inLink && (cap = this.rules.url.exec(src))) {
      if (cap[2] === '@') {
        text = escape(cap[0]);
        href = 'mailto:' + text;
      } else {
        // do extended autolink path validation
        do {
          prevCapZero = cap[0];
          cap[0] = this.rules._backpedal.exec(cap[0])[0];
        } while (prevCapZero !== cap[0]);
        text = escape(cap[0]);
        if (cap[1] === 'www.') {
          href = 'http://' + text;
        } else {
          href = text;
        }
      }
      src = src.substring(cap[0].length);
      out += this.renderer.link(href, null, text);
      continue;
    }

    // text
    if (cap = this.rules.text.exec(src)) {
      src = src.substring(cap[0].length);
      if (this.inRawBlock) {
        out += this.renderer.text(cap[0]);
      } else {
        out += this.renderer.text(escape(this.smartypants(cap[0])));
      }
      continue;
    }

    if (src) {
      throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
    }
  }

  return out;
};

InlineLexer.escapes = function(text) {
  return text ? text.replace(InlineLexer.rules._escapes, '$1') : text;
};

/**
 * Compile Link
 */

InlineLexer.prototype.outputLink = function(cap, link) {
  var href = link.href,
      title = link.title ? escape(link.title) : null;

  return cap[0].charAt(0) !== '!'
    ? this.renderer.link(href, title, this.output(cap[1]))
    : this.renderer.image(href, title, escape(cap[1]));
};

/**
 * Smartypants Transformations
 */

InlineLexer.prototype.smartypants = function(text) {
  if (!this.options.smartypants) return text;
  return text
    // em-dashes
    .replace(/---/g, '\u2014')
    // en-dashes
    .replace(/--/g, '\u2013')
    // opening singles
    .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
    // closing singles & apostrophes
    .replace(/'/g, '\u2019')
    // opening doubles
    .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
    // closing doubles
    .replace(/"/g, '\u201d')
    // ellipses
    .replace(/\.{3}/g, '\u2026');
};

/**
 * Mangle Links
 */

InlineLexer.prototype.mangle = function(text) {
  if (!this.options.mangle) return text;
  var out = '',
      l = text.length,
      i = 0,
      ch;

  for (; i < l; i++) {
    ch = text.charCodeAt(i);
    if (Math.random() > 0.5) {
      ch = 'x' + ch.toString(16);
    }
    out += '&#' + ch + ';';
  }

  return out;
};

/**
 * Renderer
 */

function Renderer(options) {
  this.options = options || marked.defaults;
}

Renderer.prototype.code = function(code, infostring, escaped) {
  var lang = (infostring || '').match(/\S*/)[0];
  if (this.options.highlight) {
    var out = this.options.highlight(code, lang);
    if (out != null && out !== code) {
      escaped = true;
      code = out;
    }
  }

  if (!lang) {
    return '<pre><code>'
      + (escaped ? code : escape(code, true))
      + '</code></pre>';
  }

  return '<pre><code class="'
    + this.options.langPrefix
    + escape(lang, true)
    + '">'
    + (escaped ? code : escape(code, true))
    + '</code></pre>\n';
};

Renderer.prototype.blockquote = function(quote) {
  return '<blockquote>\n' + quote + '</blockquote>\n';
};

Renderer.prototype.html = function(html) {
  return html;
};

Renderer.prototype.heading = function(text, level, raw, slugger) {
  if (this.options.headerIds) {
    return '<h'
      + level
      + ' id="'
      + this.options.headerPrefix
      + slugger.slug(raw)
      + '">'
      + text
      + '</h'
      + level
      + '>\n';
  }
  // ignore IDs
  return '<h' + level + '>' + text + '</h' + level + '>\n';
};

Renderer.prototype.hr = function() {
  return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
};

Renderer.prototype.list = function(body, ordered, start) {
  var type = ordered ? 'ol' : 'ul',
      startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
  return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
};

Renderer.prototype.listitem = function(text) {
  return '<li>' + text + '</li>\n';
};

Renderer.prototype.checkbox = function(checked) {
  return '<input '
    + (checked ? 'checked="" ' : '')
    + 'disabled="" type="checkbox"'
    + (this.options.xhtml ? ' /' : '')
    + '> ';
};

Renderer.prototype.paragraph = function(text) {
  return '<p>' + text + '</p>\n';
};

Renderer.prototype.table = function(header, body) {
  if (body) body = '<tbody>' + body + '</tbody>';

  return '<table>\n'
    + '<thead>\n'
    + header
    + '</thead>\n'
    + body
    + '</table>\n';
};

Renderer.prototype.tablerow = function(content) {
  return '<tr>\n' + content + '</tr>\n';
};

Renderer.prototype.tablecell = function(content, flags) {
  var type = flags.header ? 'th' : 'td';
  var tag = flags.align
    ? '<' + type + ' align="' + flags.align + '">'
    : '<' + type + '>';
  return tag + content + '</' + type + '>\n';
};

// span level renderer
Renderer.prototype.strong = function(text) {
  return '<strong>' + text + '</strong>';
};

Renderer.prototype.em = function(text) {
  return '<em>' + text + '</em>';
};

Renderer.prototype.codespan = function(text) {
  return '<code>' + text + '</code>';
};

Renderer.prototype.br = function() {
  return this.options.xhtml ? '<br/>' : '<br>';
};

Renderer.prototype.del = function(text) {
  return '<del>' + text + '</del>';
};

Renderer.prototype.link = function(href, title, text) {
  href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
  if (href === null) {
    return text;
  }
  var out = '<a href="' + escape(href) + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += '>' + text + '</a>';
  return out;
};

Renderer.prototype.image = function(href, title, text) {
  href = cleanUrl(this.options.sanitize, this.options.baseUrl, href);
  if (href === null) {
    return text;
  }

  var out = '<img src="' + href + '" alt="' + text + '"';
  if (title) {
    out += ' title="' + title + '"';
  }
  out += this.options.xhtml ? '/>' : '>';
  return out;
};

Renderer.prototype.text = function(text) {
  return text;
};

/**
 * TextRenderer
 * returns only the textual part of the token
 */

function TextRenderer() {}

// no need for block level renderers

TextRenderer.prototype.strong =
TextRenderer.prototype.em =
TextRenderer.prototype.codespan =
TextRenderer.prototype.del =
TextRenderer.prototype.text = function (text) {
  return text;
};

TextRenderer.prototype.link =
TextRenderer.prototype.image = function(href, title, text) {
  return '' + text;
};

TextRenderer.prototype.br = function() {
  return '';
};

/**
 * Parsing & Compiling
 */

function Parser(options) {
  this.tokens = [];
  this.token = null;
  this.options = options || marked.defaults;
  this.options.renderer = this.options.renderer || new Renderer();
  this.renderer = this.options.renderer;
  this.renderer.options = this.options;
  this.slugger = new Slugger();
}

/**
 * Static Parse Method
 */

Parser.parse = function(src, options) {
  var parser = new Parser(options);
  return parser.parse(src);
};

/**
 * Parse Loop
 */

Parser.prototype.parse = function(src) {
  this.inline = new InlineLexer(src.links, this.options);
  // use an InlineLexer with a TextRenderer to extract pure text
  this.inlineText = new InlineLexer(
    src.links,
    merge({}, this.options, {renderer: new TextRenderer()})
  );
  this.tokens = src.reverse();

  var out = '';
  while (this.next()) {
    out += this.tok();
  }

  return out;
};

/**
 * Next Token
 */

Parser.prototype.next = function() {
  return this.token = this.tokens.pop();
};

/**
 * Preview Next Token
 */

Parser.prototype.peek = function() {
  return this.tokens[this.tokens.length - 1] || 0;
};

/**
 * Parse Text Tokens
 */

Parser.prototype.parseText = function() {
  var body = this.token.text;

  while (this.peek().type === 'text') {
    body += '\n' + this.next().text;
  }

  return this.inline.output(body);
};

/**
 * Parse Current Token
 */

Parser.prototype.tok = function() {
  switch (this.token.type) {
    case 'space': {
      return '';
    }
    case 'hr': {
      return this.renderer.hr();
    }
    case 'heading': {
      return this.renderer.heading(
        this.inline.output(this.token.text),
        this.token.depth,
        unescape(this.inlineText.output(this.token.text)),
        this.slugger);
    }
    case 'code': {
      return this.renderer.code(this.token.text,
        this.token.lang,
        this.token.escaped);
    }
    case 'table': {
      var header = '',
          body = '',
          i,
          row,
          cell,
          j;

      // header
      cell = '';
      for (i = 0; i < this.token.header.length; i++) {
        cell += this.renderer.tablecell(
          this.inline.output(this.token.header[i]),
          { header: true, align: this.token.align[i] }
        );
      }
      header += this.renderer.tablerow(cell);

      for (i = 0; i < this.token.cells.length; i++) {
        row = this.token.cells[i];

        cell = '';
        for (j = 0; j < row.length; j++) {
          cell += this.renderer.tablecell(
            this.inline.output(row[j]),
            { header: false, align: this.token.align[j] }
          );
        }

        body += this.renderer.tablerow(cell);
      }
      return this.renderer.table(header, body);
    }
    case 'blockquote_start': {
      body = '';

      while (this.next().type !== 'blockquote_end') {
        body += this.tok();
      }

      return this.renderer.blockquote(body);
    }
    case 'list_start': {
      body = '';
      var ordered = this.token.ordered,
          start = this.token.start;

      while (this.next().type !== 'list_end') {
        body += this.tok();
      }

      return this.renderer.list(body, ordered, start);
    }
    case 'list_item_start': {
      body = '';
      var loose = this.token.loose;
      var checked = this.token.checked;
      var task = this.token.task;

      if (this.token.task) {
        body += this.renderer.checkbox(checked);
      }

      while (this.next().type !== 'list_item_end') {
        body += !loose && this.token.type === 'text'
          ? this.parseText()
          : this.tok();
      }
      return this.renderer.listitem(body, task, checked);
    }
    case 'html': {
      // TODO parse inline content if parameter markdown=1
      return this.renderer.html(this.token.text);
    }
    case 'paragraph': {
      return this.renderer.paragraph(this.inline.output(this.token.text));
    }
    case 'text': {
      return this.renderer.paragraph(this.parseText());
    }
    default: {
      var errMsg = 'Token with "' + this.token.type + '" type was not found.';
      if (this.options.silent) {
        console.log(errMsg);
      } else {
        throw new Error(errMsg);
      }
    }
  }
};

/**
 * Slugger generates header id
 */

function Slugger () {
  this.seen = {};
}

/**
 * Convert string to unique id
 */

Slugger.prototype.slug = function (value) {
  var slug = value
    .toLowerCase()
    .trim()
    .replace(/[\u2000-\u206F\u2E00-\u2E7F\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g, '')
    .replace(/\s/g, '-');

  if (this.seen.hasOwnProperty(slug)) {
    var originalSlug = slug;
    do {
      this.seen[originalSlug]++;
      slug = originalSlug + '-' + this.seen[originalSlug];
    } while (this.seen.hasOwnProperty(slug));
  }
  this.seen[slug] = 0;

  return slug;
};

/**
 * Helpers
 */

function escape(html, encode) {
  if (encode) {
    if (escape.escapeTest.test(html)) {
      return html.replace(escape.escapeReplace, function (ch) { return escape.replacements[ch]; });
    }
  } else {
    if (escape.escapeTestNoEncode.test(html)) {
      return html.replace(escape.escapeReplaceNoEncode, function (ch) { return escape.replacements[ch]; });
    }
  }

  return html;
}

escape.escapeTest = /[&<>"']/;
escape.escapeReplace = /[&<>"']/g;
escape.replacements = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

escape.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
escape.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;

function unescape(html) {
  // explicitly match decimal, hex, and named HTML entities
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, function(_, n) {
    n = n.toLowerCase();
    if (n === 'colon') return ':';
    if (n.charAt(0) === '#') {
      return n.charAt(1) === 'x'
        ? String.fromCharCode(parseInt(n.substring(2), 16))
        : String.fromCharCode(+n.substring(1));
    }
    return '';
  });
}

function edit(regex, opt) {
  regex = regex.source || regex;
  opt = opt || '';
  return {
    replace: function(name, val) {
      val = val.source || val;
      val = val.replace(/(^|[^\[])\^/g, '$1');
      regex = regex.replace(name, val);
      return this;
    },
    getRegex: function() {
      return new RegExp(regex, opt);
    }
  };
}

function cleanUrl(sanitize, base, href) {
  if (sanitize) {
    try {
      var prot = decodeURIComponent(unescape(href))
        .replace(/[^\w:]/g, '')
        .toLowerCase();
    } catch (e) {
      return null;
    }
    if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
      return null;
    }
  }
  if (base && !originIndependentUrl.test(href)) {
    href = resolveUrl(base, href);
  }
  try {
    href = encodeURI(href).replace(/%25/g, '%');
  } catch (e) {
    return null;
  }
  return href;
}

function resolveUrl(base, href) {
  if (!baseUrls[' ' + base]) {
    // we can ignore everything in base after the last slash of its path component,
    // but we might need to add _that_
    // https://tools.ietf.org/html/rfc3986#section-3
    if (/^[^:]+:\/*[^/]*$/.test(base)) {
      baseUrls[' ' + base] = base + '/';
    } else {
      baseUrls[' ' + base] = rtrim(base, '/', true);
    }
  }
  base = baseUrls[' ' + base];

  if (href.slice(0, 2) === '//') {
    return base.replace(/:[\s\S]*/, ':') + href;
  } else if (href.charAt(0) === '/') {
    return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
  } else {
    return base + href;
  }
}
var baseUrls = {};
var originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function noop() {}
noop.exec = noop;

function merge(obj) {
  var i = 1,
      target,
      key;

  for (; i < arguments.length; i++) {
    target = arguments[i];
    for (key in target) {
      if (Object.prototype.hasOwnProperty.call(target, key)) {
        obj[key] = target[key];
      }
    }
  }

  return obj;
}

function splitCells(tableRow, count) {
  // ensure that every cell-delimiting pipe has a space
  // before it to distinguish it from an escaped pipe
  var row = tableRow.replace(/\|/g, function (match, offset, str) {
        var escaped = false,
            curr = offset;
        while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
        if (escaped) {
          // odd number of slashes means | is escaped
          // so we leave it alone
          return '|';
        } else {
          // add space before unescaped |
          return ' |';
        }
      }),
      cells = row.split(/ \|/),
      i = 0;

  if (cells.length > count) {
    cells.splice(count);
  } else {
    while (cells.length < count) cells.push('');
  }

  for (; i < cells.length; i++) {
    // leading or trailing whitespace is ignored per the gfm spec
    cells[i] = cells[i].trim().replace(/\\\|/g, '|');
  }
  return cells;
}

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
function rtrim(str, c, invert) {
  if (str.length === 0) {
    return '';
  }

  // Length of suffix matching the invert condition.
  var suffLen = 0;

  // Step left until we fail to match the invert condition.
  while (suffLen < str.length) {
    var currChar = str.charAt(str.length - suffLen - 1);
    if (currChar === c && !invert) {
      suffLen++;
    } else if (currChar !== c && invert) {
      suffLen++;
    } else {
      break;
    }
  }

  return str.substr(0, str.length - suffLen);
}

function findClosingBracket(str, b) {
  if (str.indexOf(b[1]) === -1) {
    return -1;
  }
  var level = 0;
  for (var i = 0; i < str.length; i++) {
    if (str[i] === '\\') {
      i++;
    } else if (str[i] === b[0]) {
      level++;
    } else if (str[i] === b[1]) {
      level--;
      if (level < 0) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Marked
 */

function marked(src, opt, callback) {
  // throw error in case of non string input
  if (typeof src === 'undefined' || src === null) {
    throw new Error('marked(): input parameter is undefined or null');
  }
  if (typeof src !== 'string') {
    throw new Error('marked(): input parameter is of type '
      + Object.prototype.toString.call(src) + ', string expected');
  }

  if (callback || typeof opt === 'function') {
    if (!callback) {
      callback = opt;
      opt = null;
    }

    opt = merge({}, marked.defaults, opt || {});

    var highlight = opt.highlight,
        tokens,
        pending,
        i = 0;

    try {
      tokens = Lexer.lex(src, opt);
    } catch (e) {
      return callback(e);
    }

    pending = tokens.length;

    var done = function(err) {
      if (err) {
        opt.highlight = highlight;
        return callback(err);
      }

      var out;

      try {
        out = Parser.parse(tokens, opt);
      } catch (e) {
        err = e;
      }

      opt.highlight = highlight;

      return err
        ? callback(err)
        : callback(null, out);
    };

    if (!highlight || highlight.length < 3) {
      return done();
    }

    delete opt.highlight;

    if (!pending) return done();

    for (; i < tokens.length; i++) {
      (function(token) {
        if (token.type !== 'code') {
          return --pending || done();
        }
        return highlight(token.text, token.lang, function(err, code) {
          if (err) return done(err);
          if (code == null || code === token.text) {
            return --pending || done();
          }
          token.text = code;
          token.escaped = true;
          --pending || done();
        });
      })(tokens[i]);
    }

    return;
  }
  try {
    if (opt) opt = merge({}, marked.defaults, opt);
    return Parser.parse(Lexer.lex(src, opt), opt);
  } catch (e) {
    e.message += '\nPlease report this to https://github.com/markedjs/marked.';
    if ((opt || marked.defaults).silent) {
      return '<p>An error occurred:</p><pre>'
        + escape(e.message + '', true)
        + '</pre>';
    }
    throw e;
  }
}

/**
 * Options
 */

marked.options =
marked.setOptions = function(opt) {
  merge(marked.defaults, opt);
  return marked;
};

marked.getDefaults = function () {
  return {
    baseUrl: null,
    breaks: false,
    gfm: true,
    headerIds: true,
    headerPrefix: '',
    highlight: null,
    langPrefix: 'language-',
    mangle: true,
    pedantic: false,
    renderer: new Renderer(),
    sanitize: false,
    sanitizer: null,
    silent: false,
    smartLists: false,
    smartypants: false,
    tables: true,
    xhtml: false
  };
};

marked.defaults = marked.getDefaults();

/**
 * Expose
 */

marked.Parser = Parser;
marked.parser = Parser.parse;

marked.Renderer = Renderer;
marked.TextRenderer = TextRenderer;

marked.Lexer = Lexer;
marked.lexer = Lexer.lex;

marked.InlineLexer = InlineLexer;
marked.inlineLexer = InlineLexer.output;

marked.Slugger = Slugger;

marked.parse = marked;

{
  module.exports = marked;
}
})(commonjsGlobal || (typeof window !== 'undefined' ? window : commonjsGlobal));
});

function get_posts() {
	return fs
		.readdirSync('content/blog')
		.filter(file => path.extname(file) === '.md')
		.map(file => {
			const match = /^(\d+-\d+-\d+)-(.+)\.md$/.exec(file);
			if (!match) throw new Error(`Invalid filename '${file}'`);

			const [, pubdate, slug] = match;

			const markdown = fs.readFileSync(`content/blog/${file}`, 'utf-8');

			const { content, metadata } = extract_frontmatter(markdown);

			const date = new Date(`${pubdate} EDT`); // cheeky hack
			metadata.pubdate = pubdate;
			metadata.dateString = date.toDateString();

			const renderer = new marked.Renderer();

			renderer.link = link_renderer;

			const html = marked(
				content.replace(/^\t+/gm, match => match.split('\t').join('  ')),
				{ renderer }
			);

			return {
				html,
				metadata,
				slug
			};
		})
		.sort((a, b) => a.metadata.pubdate < b.metadata.pubdate ? 1 : -1);
}

let json;

function get(req, res) {
	if (!json || undefined !== 'production') {
		json = get_posts()
			.filter(post => !post.metadata.draft)
			.map(post => {
				return {
					slug: post.slug,
					metadata: post.metadata
				};
			});
	}

	sendJson(res, json);
}

var route_0 = /*#__PURE__*/Object.freeze({
  get: get
});

let lookup;

function get$1(req, res) {
	if (!lookup || undefined !== 'production') {
		lookup = new Map();
		get_posts().forEach(post => {
			lookup.set(post.slug, post);
		});
	}

	if (lookup.has(req.params.slug)) {
		sendJson(res, lookup.get(req.params.slug));
	} else {
		notFound(res);
	}
}

var route_1 = /*#__PURE__*/Object.freeze({
  get: get$1
});

function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

function run_all(fns) {
	fns.forEach(run);
}

function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
}

let current_component;

function set_current_component(component) {
	current_component = component;
}

function get_current_component() {
	if (!current_component) throw new Error(`Function called outside component initialization`);
	return current_component;
}

function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

function setContext(key, context) {
	get_current_component().$$.context.set(key, context);
}

const escaped = {
	'"': '&quot;',
	"'": '&#39;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;'
};

function escape$1(html) {
	return String(html).replace(/["'&<>]/g, match => escaped[match]);
}

function each(items, fn) {
	let str = '';
	for (let i = 0; i < items.length; i += 1) {
		str += fn(items[i], i);
	}
	return str;
}

const missing_component = {
	$$render: () => ''
};

function validate_component(component, name) {
	if (!component || !component.$$render) {
		if (name === 'svelte:component') name += ' this={...}';
		throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
	}

	return component;
}

let on_destroy;

function create_ssr_component(fn) {
	function $$render(result, props, bindings, slots) {
		const parent_component = current_component;

		const $$ = {
			on_destroy,
			context: new Map(parent_component ? parent_component.$$.context : []),

			// these will be immediately discarded
			on_mount: [],
			before_render: [],
			after_render: [],
			callbacks: blank_object()
		};

		set_current_component({ $$ });

		const html = fn(result, props, bindings, slots);

		set_current_component(parent_component);
		return html;
	}

	return {
		render: (props = {}, options = {}) => {
			on_destroy = [];

			const result = { head: '', css: new Set() };
			const html = $$render(result, props, {}, options);

			run_all(on_destroy);

			return {
				html,
				css: {
					code: Array.from(result.css).map(css => css.code).join('\n'),
					map: null // TODO
				},
				head: result.head
			};
		},

		$$render
	};
}

/* src/routes/index.svelte generated by Svelte v3.0.0-beta.28 */

const css = {
	code: "h1.svelte-1kk9opm,figure.svelte-1kk9opm,p.svelte-1kk9opm{text-align:center;margin:0 auto}h1.svelte-1kk9opm{font-size:2.8em;text-transform:uppercase;font-weight:700;margin:0 0 0.5em 0}figure.svelte-1kk9opm{margin:0 0 1em 0}img.svelte-1kk9opm{width:100%;max-width:400px;margin:0 0 1em 0}p.svelte-1kk9opm{margin:1em auto}@media(min-width: 480px){h1.svelte-1kk9opm{font-size:4em}}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<style>\\n\\th1, figure, p {\\n\\t\\ttext-align: center;\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.8em;\\n\\t\\ttext-transform: uppercase;\\n\\t\\tfont-weight: 700;\\n\\t\\tmargin: 0 0 0.5em 0;\\n\\t}\\n\\n\\tfigure {\\n\\t\\tmargin: 0 0 1em 0;\\n\\t}\\n\\n\\timg {\\n\\t\\twidth: 100%;\\n\\t\\tmax-width: 400px;\\n\\t\\tmargin: 0 0 1em 0;\\n\\t}\\n\\n\\tp {\\n\\t\\tmargin: 1em auto;\\n\\t}\\n\\n\\t@media (min-width: 480px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 4em;\\n\\t\\t}\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>Sapper project template</title>\\n</svelte:head>\\n\\n<h1>Great success!</h1>\\n\\n<figure>\\n\\t<img alt='Borat' src='great-success.png'>\\n\\t<figcaption>HIGH FIVE!</figcaption>\\n</figure>\\n\\n<p><strong>Try editing this file (routes/index.html) to test live reloading.</strong></p>\"],\"names\":[],\"mappings\":\"AACC,iBAAE,CAAE,qBAAM,CAAE,CAAC,eAAC,CAAC,AACd,UAAU,CAAE,MAAM,CAClB,MAAM,CAAE,CAAC,CAAC,IAAI,AACf,CAAC,AAED,EAAE,eAAC,CAAC,AACH,SAAS,CAAE,KAAK,CAChB,cAAc,CAAE,SAAS,CACzB,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,AACpB,CAAC,AAED,MAAM,eAAC,CAAC,AACP,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,AAClB,CAAC,AAED,GAAG,eAAC,CAAC,AACJ,KAAK,CAAE,IAAI,CACX,SAAS,CAAE,KAAK,CAChB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,AAClB,CAAC,AAED,CAAC,eAAC,CAAC,AACF,MAAM,CAAE,GAAG,CAAC,IAAI,AACjB,CAAC,AAED,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,EAAE,eAAC,CAAC,AACH,SAAS,CAAE,GAAG,AACf,CAAC,AACF,CAAC\"}"
};

const Index = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	$$result.css.add(css);

	return `${($$result.head += `<title>Sapper project template</title>`, "")}

	<h1 class="svelte-1kk9opm">Great success!</h1>

	<figure class="svelte-1kk9opm">
		<img alt="Borat" src="great-success.png" class="svelte-1kk9opm">
		<figcaption>HIGH FIVE!</figcaption>
	</figure>

	<p class="svelte-1kk9opm"><strong>Try editing this file (routes/index.html) to test live reloading.</strong></p>`;
});

/* src/routes/about.svelte generated by Svelte v3.0.0-beta.28 */

const About = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${($$result.head += `<title>About</title>`, "")}

	<h1>About this site</h1>

	<p>This is the 'about' page. There's not much here.</p>`;
});

/* src/routes/admin.svelte generated by Svelte v3.0.0-beta.28 */

const Admin = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	return `${($$result.head += `<link href="admin/config.yml" type="text/yaml" rel="cms-config-url"><script src="https://unpkg.com/netlify-cms@^2.0.0/dist/netlify-cms.js"></script>`, "")}`;
});

/* src/routes/blog/index.svelte generated by Svelte v3.0.0-beta.28 */

const css$1 = {
	code: "ul.svelte-1frg2tf{margin:0 0 1em 0;line-height:1.5}",
	map: "{\"version\":3,\"file\":\"index.svelte\",\"sources\":[\"index.svelte\"],\"sourcesContent\":[\"<script context=\\\"module\\\">\\n\\texport function preload({ params, query }) {\\n\\t\\treturn this.fetch(`blog.json`).then(r => r.json()).then(posts => {\\n\\t\\t\\treturn { posts };\\n\\t\\t});\\n\\t}\\n</script>\\n\\n<script>\\n\\texport let posts;\\n</script>\\n\\n<style>\\n\\tul {\\n\\t\\tmargin: 0 0 1em 0;\\n\\t\\tline-height: 1.5;\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>Blog</title>\\n</svelte:head>\\n\\n<h1>Recent posts</h1>\\n\\n<ul>\\n\\t{#each posts as post}\\n\\t\\t<!-- we're using the non-standard `rel=prefetch` attribute to\\n\\t\\t\\t\\ttell Sapper to load the data for the page as soon as\\n\\t\\t\\t\\tthe user hovers over the link or taps it, instead of\\n\\t\\t\\t\\twaiting for the 'click' event -->\\n\\t\\t<li><a rel='prefetch' href='blog/{post.slug}'>{post.metadata.title}</a></li>\\n\\t{/each}\\n</ul>\"],\"names\":[],\"mappings\":\"AAaC,EAAE,eAAC,CAAC,AACH,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,GAAG,CAAC,CAAC,CACjB,WAAW,CAAE,GAAG,AACjB,CAAC\"}"
};

function preload({ params, query }) {
	return this.fetch(`blog.json`).then(r => r.json()).then(posts => {
		return { posts };
	});
}

const Index$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { posts } = $$props;

	if ($$props.posts === void 0 && $$bindings.posts && posts !== void 0) $$bindings.posts(posts);

	$$result.css.add(css$1);

	return `${($$result.head += `<title>Blog</title>`, "")}

	<h1>Recent posts</h1>

	<ul class="svelte-1frg2tf">
		${each(posts, (post) => `
			<li><a rel="prefetch" href="blog/${escape$1(post.slug)}">${escape$1(post.metadata.title)}</a></li>`)}
	</ul>`;
});

/* src/routes/blog/[slug].svelte generated by Svelte v3.0.0-beta.28 */

const css$2 = {
	code: ".content.svelte-gnxal1 h2{font-size:1.4em;font-weight:500}.content.svelte-gnxal1 pre{background-color:#f9f9f9;box-shadow:inset 1px 1px 5px rgba(0,0,0,0.05);padding:0.5em;border-radius:2px;overflow-x:auto}.content.svelte-gnxal1 pre code{background-color:transparent;padding:0}.content.svelte-gnxal1 ul{line-height:1.5}.content.svelte-gnxal1 li{margin:0 0 0.5em 0}",
	map: "{\"version\":3,\"file\":\"[slug].svelte\",\"sources\":[\"[slug].svelte\"],\"sourcesContent\":[\"<script context=\\\"module\\\">\\n\\texport async function preload({ params, query }) {\\n\\t\\t// the `slug` parameter is available because\\n\\t\\t// this file is called [slug].html\\n\\t\\tconst res = await this.fetch(`blog/${params.slug}.json`);\\n\\t\\tconst data = await res.json();\\n\\n\\t\\tif (res.status === 200) {\\n\\t\\t\\treturn { post: data };\\n\\t\\t} else {\\n\\t\\t\\tthis.error(res.status, data.message);\\n\\t\\t}\\n\\t}\\n</script>\\n\\n<script>\\n\\texport let post;\\n</script>\\n\\n<style>\\n\\t/*\\n\\t\\tBy default, CSS is locally scoped to the component,\\n\\t\\tand any unused styles are dead-code-eliminated.\\n\\t\\tIn this page, Svelte can't know which elements are\\n\\t\\tgoing to appear inside the {{{post.html}}} block,\\n\\t\\tso we have to use the :global(...) modifier to target\\n\\t\\tall elements inside .content\\n\\t*/\\n\\t.content :global(h2) {\\n\\t\\tfont-size: 1.4em;\\n\\t\\tfont-weight: 500;\\n\\t}\\n\\n\\t.content :global(pre) {\\n\\t\\tbackground-color: #f9f9f9;\\n\\t\\tbox-shadow: inset 1px 1px 5px rgba(0,0,0,0.05);\\n\\t\\tpadding: 0.5em;\\n\\t\\tborder-radius: 2px;\\n\\t\\toverflow-x: auto;\\n\\t}\\n\\n\\t.content :global(pre) :global(code) {\\n\\t\\tbackground-color: transparent;\\n\\t\\tpadding: 0;\\n\\t}\\n\\n\\t.content :global(ul) {\\n\\t\\tline-height: 1.5;\\n\\t}\\n\\n\\t.content :global(li) {\\n\\t\\tmargin: 0 0 0.5em 0;\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>{post.metadata.title}</title>\\n</svelte:head>\\n\\n<h1>{post.metadata.title}</h1>\\n\\n<div class='content'>\\n\\t{@html post.html}\\n</div>\"],\"names\":[],\"mappings\":\"AA4BC,sBAAQ,CAAC,AAAQ,EAAE,AAAE,CAAC,AACrB,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,GAAG,AACjB,CAAC,AAED,sBAAQ,CAAC,AAAQ,GAAG,AAAE,CAAC,AACtB,gBAAgB,CAAE,OAAO,CACzB,UAAU,CAAE,KAAK,CAAC,GAAG,CAAC,GAAG,CAAC,GAAG,CAAC,KAAK,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,IAAI,CAAC,CAC9C,OAAO,CAAE,KAAK,CACd,aAAa,CAAE,GAAG,CAClB,UAAU,CAAE,IAAI,AACjB,CAAC,AAED,sBAAQ,CAAC,AAAQ,GAAG,AAAC,CAAC,AAAQ,IAAI,AAAE,CAAC,AACpC,gBAAgB,CAAE,WAAW,CAC7B,OAAO,CAAE,CAAC,AACX,CAAC,AAED,sBAAQ,CAAC,AAAQ,EAAE,AAAE,CAAC,AACrB,WAAW,CAAE,GAAG,AACjB,CAAC,AAED,sBAAQ,CAAC,AAAQ,EAAE,AAAE,CAAC,AACrB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,AACpB,CAAC\"}"
};

async function preload$1({ params, query }) {
	// the `slug` parameter is available because
	// this file is called [slug].html
	const res = await this.fetch(`blog/${params.slug}.json`);
	const data = await res.json();

	if (res.status === 200) {
		return { post: data };
	} else {
		this.error(res.status, data.message);
	}
}

const Slug = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { post } = $$props;

	if ($$props.post === void 0 && $$bindings.post && post !== void 0) $$bindings.post(post);

	$$result.css.add(css$2);

	return `${($$result.head += `<title>${escape$1(post.metadata.title)}</title>`, "")}

	<h1>${escape$1(post.metadata.title)}</h1>

	<div class="content svelte-gnxal1">
		${post.html}
	</div>`;
});

var netlifyIdentity = createCommonjsModule(function (module, exports) {
!function(e,t){module.exports=t();}("undefined"!=typeof self?self:commonjsGlobal,function(){return function(e){function t(r){if(n[r])return n[r].exports;var o=n[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,t),o.l=!0,o.exports}var n={};return t.m=e,t.c=n,t.d=function(e,n,r){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:r});},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="/",t(t.s=9)}([function(e,t,n){function r(e,t){var n,r,o,i,a=A;for(i=arguments.length;i-- >2;)k.push(arguments[i]);for(t&&null!=t.children&&(k.length||k.push(t.children),delete t.children);k.length;)if((r=k.pop())&&void 0!==r.pop)for(i=r.length;i--;)k.push(r[i]);else"boolean"==typeof r&&(r=null),(o="function"!=typeof e)&&(null==r?r="":"number"==typeof r?r+="":"string"!=typeof r&&(o=!1)),o&&n?a[a.length-1]+=r:a===A?a=[r]:a.push(r),n=o;var s=new E;return s.nodeName=e,s.children=a,s.attributes=null==t?void 0:t,s.key=null==t?void 0:t.key,void 0!==L.vnode&&L.vnode(s),s}function o(e,t){for(var n in t)e[n]=t[n];return e}function i(e,t){return r(e.nodeName,o(o({},e.attributes),t),arguments.length>2?[].slice.call(arguments,2):e.children)}function a(e){!e._dirty&&(e._dirty=!0)&&1==C.push(e)&&(L.debounceRendering||S)(s);}function s(){var e,t=C;for(C=[];e=t.pop();)e._dirty&&v(e);}function u(e,t,n){return "string"==typeof t||"number"==typeof t?void 0!==e.splitText:"string"==typeof t.nodeName?!e._componentConstructor&&c(e,t.nodeName):n||e._componentConstructor===t.nodeName}function c(e,t){return e.normalizedNodeName===t||e.nodeName.toLowerCase()===t.toLowerCase()}function M(e){var t=o({},e.attributes);t.children=e.children;var n=e.nodeName.defaultProps;if(void 0!==n)for(var r in n)void 0===t[r]&&(t[r]=n[r]);return t}function l(e,t){var n=t?document.createElementNS("http://www.w3.org/2000/svg",e):document.createElement(e);return n.normalizedNodeName=e,n}function p(e){var t=e.parentNode;t&&t.removeChild(e);}function f(e,t,n,r,o){if("className"===t&&(t="class"),"key"===t);else if("ref"===t)n&&n(null),r&&r(e);else if("class"!==t||o)if("style"===t){if(r&&"string"!=typeof r&&"string"!=typeof n||(e.style.cssText=r||""),r&&"object"==typeof r){if("string"!=typeof n)for(var i in n)i in r||(e.style[i]="");for(var i in r)e.style[i]="number"==typeof r[i]&&!1===U.test(i)?r[i]+"px":r[i];}}else if("dangerouslySetInnerHTML"===t)r&&(e.innerHTML=r.__html||"");else if("o"==t[0]&&"n"==t[1]){var a=t!==(t=t.replace(/Capture$/,""));t=t.toLowerCase().substring(2),r?n||e.addEventListener(t,y,a):e.removeEventListener(t,y,a),(e._listeners||(e._listeners={}))[t]=r;}else if("list"!==t&&"type"!==t&&!o&&t in e){try{e[t]=null==r?"":r;}catch(e){}null!=r&&!1!==r||"spellcheck"==t||e.removeAttribute(t);}else{var s=o&&t!==(t=t.replace(/^xlink:?/,""));null==r||!1===r?s?e.removeAttributeNS("http://www.w3.org/1999/xlink",t.toLowerCase()):e.removeAttribute(t):"function"!=typeof r&&(s?e.setAttributeNS("http://www.w3.org/1999/xlink",t.toLowerCase(),r):e.setAttribute(t,r));}else e.className=r||"";}function y(e){return this._listeners[e.type](L.event&&L.event(e)||e)}function N(){for(var e;e=Q.pop();)L.afterMount&&L.afterMount(e),e.componentDidMount&&e.componentDidMount();}function g(e,t,n,r,o,i){_++||(Y=null!=o&&void 0!==o.ownerSVGElement,P=null!=e&&!("__preactattr_"in e));var a=d(e,t,n,r,i);return o&&a.parentNode!==o&&o.appendChild(a),--_||(P=!1,i||N()),a}function d(e,t,n,r,o){var i=e,a=Y;if(null!=t&&"boolean"!=typeof t||(t=""),"string"==typeof t||"number"==typeof t)return e&&void 0!==e.splitText&&e.parentNode&&(!e._component||o)?e.nodeValue!=t&&(e.nodeValue=t):(i=document.createTextNode(t),e&&(e.parentNode&&e.parentNode.replaceChild(i,e),h(e,!0))),i.__preactattr_=!0,i;var s=t.nodeName;if("function"==typeof s)return m(e,t,n,r);if(Y="svg"===s||"foreignObject"!==s&&Y,s+="",(!e||!c(e,s))&&(i=l(s,Y),e)){for(;e.firstChild;)i.appendChild(e.firstChild);e.parentNode&&e.parentNode.replaceChild(i,e),h(e,!0);}var u=i.firstChild,M=i.__preactattr_,p=t.children;if(null==M){M=i.__preactattr_={};for(var f=i.attributes,y=f.length;y--;)M[f[y].name]=f[y].value;}return !P&&p&&1===p.length&&"string"==typeof p[0]&&null!=u&&void 0!==u.splitText&&null==u.nextSibling?u.nodeValue!=p[0]&&(u.nodeValue=p[0]):(p&&p.length||null!=u)&&D(i,p,n,r,P||null!=M.dangerouslySetInnerHTML),T(i,t.attributes,M),Y=a,i}function D(e,t,n,r,o){var i,a,s,c,M,l=e.childNodes,f=[],y={},N=0,g=0,D=l.length,j=0,T=t?t.length:0;if(0!==D)for(var z=0;D>z;z++){var b=l[z],w=b.__preactattr_,v=T&&w?b._component?b._component.__key:w.key:null;null!=v?(N++,y[v]=b):(w||(void 0!==b.splitText?!o||b.nodeValue.trim():o))&&(f[j++]=b);}if(0!==T)for(var z=0;T>z;z++){c=t[z],M=null;var v=c.key;if(null!=v)N&&void 0!==y[v]&&(M=y[v],y[v]=void 0,N--);else if(j>g)for(i=g;j>i;i++)if(void 0!==f[i]&&u(a=f[i],c,o)){M=a,f[i]=void 0,i===j-1&&j--,i===g&&g++;break}M=d(M,c,n,r),s=l[z],M&&M!==e&&M!==s&&(null==s?e.appendChild(M):M===s.nextSibling?p(s):e.insertBefore(M,s));}if(N)for(var z in y)void 0!==y[z]&&h(y[z],!1);for(;j>=g;)void 0!==(M=f[j--])&&h(M,!1);}function h(e,t){var n=e._component;n?x(n):(null!=e.__preactattr_&&e.__preactattr_.ref&&e.__preactattr_.ref(null),!1!==t&&null!=e.__preactattr_||p(e),j(e));}function j(e){for(e=e.lastChild;e;){var t=e.previousSibling;h(e,!0),e=t;}}function T(e,t,n){var r;for(r in n)t&&null!=t[r]||null==n[r]||f(e,r,n[r],n[r]=void 0,Y);for(r in t)"children"===r||"innerHTML"===r||r in n&&t[r]===("value"===r||"checked"===r?e[r]:n[r])||f(e,r,n[r],n[r]=t[r],Y);}function z(e,t,n){var r,o=B.length;for(e.prototype&&e.prototype.render?(r=new e(t,n),O.call(r,t,n)):(r=new O(t,n),r.constructor=e,r.render=b);o--;)if(B[o].constructor===e)return r.nextBase=B[o].nextBase,B.splice(o,1),r;return r}function b(e,t,n){return this.constructor(e,n)}function w(e,t,n,r,o){e._disable||(e._disable=!0,e.__ref=t.ref,e.__key=t.key,delete t.ref,delete t.key,void 0===e.constructor.getDerivedStateFromProps&&(!e.base||o?e.componentWillMount&&e.componentWillMount():e.componentWillReceiveProps&&e.componentWillReceiveProps(t,r)),r&&r!==e.context&&(e.prevContext||(e.prevContext=e.context),e.context=r),e.prevProps||(e.prevProps=e.props),e.props=t,e._disable=!1,0!==n&&(1!==n&&!1===L.syncComponentUpdates&&e.base?a(e):v(e,1,o)),e.__ref&&e.__ref(e));}function v(e,t,n,r){if(!e._disable){var i,a,s,u=e.props,c=e.state,l=e.context,p=e.prevProps||u,f=e.prevState||c,y=e.prevContext||l,d=e.base,D=e.nextBase,j=d||D,T=e._component,b=!1,m=y;if(e.constructor.getDerivedStateFromProps&&(c=o(o({},c),e.constructor.getDerivedStateFromProps(u,c)),e.state=c),d&&(e.props=p,e.state=f,e.context=y,2!==t&&e.shouldComponentUpdate&&!1===e.shouldComponentUpdate(u,c,l)?b=!0:e.componentWillUpdate&&e.componentWillUpdate(u,c,l),e.props=u,e.state=c,e.context=l),e.prevProps=e.prevState=e.prevContext=e.nextBase=null,e._dirty=!1,!b){i=e.render(u,c,l),e.getChildContext&&(l=o(o({},l),e.getChildContext())),d&&e.getSnapshotBeforeUpdate&&(m=e.getSnapshotBeforeUpdate(p,f));var O,I,E=i&&i.nodeName;if("function"==typeof E){var k=M(i);a=T,a&&a.constructor===E&&k.key==a.__key?w(a,k,1,l,!1):(O=a,e._component=a=z(E,k,l),a.nextBase=a.nextBase||D,a._parentComponent=e,w(a,k,0,l,!1),v(a,1,n,!0)),I=a.base;}else s=j,O=T,O&&(s=e._component=null),(j||1===t)&&(s&&(s._component=null),I=g(s,i,l,n||!d,j&&j.parentNode,!0));if(j&&I!==j&&a!==T){var A=j.parentNode;A&&I!==A&&(A.replaceChild(I,j),O||(j._component=null,h(j,!1)));}if(O&&x(O),e.base=I,I&&!r){for(var S=e,U=e;U=U._parentComponent;)(S=U).base=I;I._component=S,I._componentConstructor=S.constructor;}}for(!d||n?Q.unshift(e):b||(e.componentDidUpdate&&e.componentDidUpdate(p,f,m),L.afterUpdate&&L.afterUpdate(e));e._renderCallbacks.length;)e._renderCallbacks.pop().call(e);_||r||N();}}function m(e,t,n,r){for(var o=e&&e._component,i=o,a=e,s=o&&e._componentConstructor===t.nodeName,u=s,c=M(t);o&&!u&&(o=o._parentComponent);)u=o.constructor===t.nodeName;return o&&u&&(!r||o._component)?(w(o,c,3,n,r),e=o.base):(i&&!s&&(x(i),e=a=null),o=z(t.nodeName,c,n),e&&!o.nextBase&&(o.nextBase=e,a=null),w(o,c,1,n,r),e=o.base,a&&e!==a&&(a._component=null,h(a,!1))),e}function x(e){L.beforeUnmount&&L.beforeUnmount(e);var t=e.base;e._disable=!0,e.componentWillUnmount&&e.componentWillUnmount(),e.base=null;var n=e._component;n?x(n):t&&(t.__preactattr_&&t.__preactattr_.ref&&t.__preactattr_.ref(null),e.nextBase=t,p(t),B.push(e),j(t)),e.__ref&&e.__ref(null);}function O(e,t){this._dirty=!0,this.context=t,this.props=e,this.state=this.state||{},this._renderCallbacks=[];}function I(e,t,n){return g(n,e,{},!1,t,!1)}Object.defineProperty(t,"__esModule",{value:!0}),n.d(t,"h",function(){return r}),n.d(t,"createElement",function(){return r}),n.d(t,"cloneElement",function(){return i}),n.d(t,"Component",function(){return O}),n.d(t,"render",function(){return I}),n.d(t,"rerender",function(){return s}),n.d(t,"options",function(){return L});var E=function(){},L={},k=[],A=[],S="function"==typeof Promise?Promise.resolve().then.bind(Promise.resolve()):setTimeout,U=/acit|ex(?:s|g|n|p|$)|rph|ows|mnc|ntw|ine[ch]|zoo|^ord/i,C=[],Q=[],_=0,Y=!1,P=!1,B=[];o(O.prototype,{setState:function(e,t){this.prevState||(this.prevState=this.state),this.state=o(o({},this.state),"function"==typeof e?e(this.state,this.props):e),t&&this._renderCallbacks.push(t),a(this);},forceUpdate:function(e){e&&this._renderCallbacks.push(e),v(this,2);},render:function(){}}),t.default={h:r,createElement:r,cloneElement:i,Component:O,render:I,rerender:s,options:L};},function(e,t,n){(function(e){function n(e,t){function n(){this.constructor=e;}tn(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n);}function r(e){return e.interceptors&&e.interceptors.length>0}function o(e,t){var n=e.interceptors||(e.interceptors=[]);return n.push(t),Oe(function(){var e=n.indexOf(t);-1!==e&&n.splice(e,1);})}function i(e,t){var n=vt();try{var r=e.interceptors;if(r)for(var o=0,i=r.length;i>o&&(t=r[o](t),me(!t||t.type,"Intercept handlers should return nothing or a change object"),t);o++);return t}finally{mt(n);}}function a(e){return e.changeListeners&&e.changeListeners.length>0}function s(e,t){var n=e.changeListeners||(e.changeListeners=[]);return n.push(t),Oe(function(){var e=n.indexOf(t);-1!==e&&n.splice(e,1);})}function u(e,t){var n=vt(),r=e.changeListeners;if(r){r=r.slice();for(var o=0,i=r.length;i>o;o++)r[o](t);mt(n);}}function c(){return !!Vn.spyListeners.length}function M(e){if(Vn.spyListeners.length)for(var t=Vn.spyListeners,n=0,r=t.length;r>n;n++)t[n](e);}function l(e){M(Ae({},e,{spyReportStart:!0}));}function p(e){M(e?Ae({},e,an):an);}function f(e){return Vn.spyListeners.push(e),Oe(function(){var t=Vn.spyListeners.indexOf(e);-1!==t&&Vn.spyListeners.splice(t,1);})}function y(){return "function"==typeof Symbol&&Symbol.iterator||"@@iterator"}function N(e){me(!0!==e[sn],"Illegal state: cannot recycle array as iterator"),Ce(e,sn,!0);var t=-1;return Ce(e,"next",function(){return t++,{done:t>=this.length,value:this.length>t?this[t]:void 0}}),e}function g(e,t){Ce(e,y(),t);}function d(e){return {enumerable:!1,configurable:!1,get:function(){return this.get(e)},set:function(t){this.set(e,t);}}}function D(e){Object.defineProperty(pn.prototype,""+e,d(e));}function h(e){for(var t=cn;e>t;t++)D(t);cn=e;}function j(e){return Le(e)&&yn(e.$mobx)}function T(e){return Dn[e]}function z(e,t){me("function"==typeof t,T("m026")),me("string"==typeof e&&e.length>0,"actions should have valid names, got: '"+e+"'");var n=function(){return b(e,t,this,arguments)};return n.originalFn=t,n.isMobxAction=!0,n}function b(e,t,n,r){var o=w(e,t,n,r);try{return t.apply(n,r)}finally{v(o);}}function w(e,t,n,r){var o=c()&&!!e,i=0;if(o){i=Date.now();var a=r&&r.length||0,s=Array(a);if(a>0)for(var u=0;a>u;u++)s[u]=r[u];l({type:"action",name:e,fn:t,object:n,arguments:s});}var M=vt();return ct(),{prevDerivation:M,prevAllowStateChanges:I(!0),notifySpy:o,startTime:i}}function v(e){E(e.prevAllowStateChanges),Mt(),mt(e.prevDerivation),e.notifySpy&&p({time:Date.now()-e.startTime});}function m(e){me(null===Vn.trackingDerivation,T("m028")),Vn.strictMode=e,Vn.allowStateChanges=!e;}function x(){return Vn.strictMode}function O(e,t){var n,r=I(e);try{n=t();}finally{E(r);}return n}function I(e){var t=Vn.allowStateChanges;return Vn.allowStateChanges=e,t}function E(e){Vn.allowStateChanges=e;}function L(e,t,n,r,o){function i(i,a,s,u,c){if(void 0===c&&(c=0),me(o||S(arguments),"This function is a decorator, but it wasn't invoked like a decorator"),s){Se(i,"__mobxLazyInitializers")||Ue(i,"__mobxLazyInitializers",i.__mobxLazyInitializers&&i.__mobxLazyInitializers.slice()||[]);var M=s.value,l=s.initializer;return i.__mobxLazyInitializers.push(function(t){e(t,a,l?l.call(t):M,u,s);}),{enumerable:r,configurable:!0,get:function(){return !0!==this.__mobxDidRunLazyInitializers&&A(this),t.call(this,a)},set:function(e){!0!==this.__mobxDidRunLazyInitializers&&A(this),n.call(this,a,e);}}}var p={enumerable:r,configurable:!0,get:function(){return this.__mobxInitializedProps&&!0===this.__mobxInitializedProps[a]||k(this,a,void 0,e,u,s),t.call(this,a)},set:function(t){this.__mobxInitializedProps&&!0===this.__mobxInitializedProps[a]?n.call(this,a,t):k(this,a,t,e,u,s);}};return (3>arguments.length||5===arguments.length&&3>c)&&Object.defineProperty(i,a,p),p}return o?function(){if(S(arguments))return i.apply(null,arguments);var e=arguments,t=arguments.length;return function(n,r,o){return i(n,r,o,e,t)}}:i}function k(e,t,n,r,o,i){Se(e,"__mobxInitializedProps")||Ue(e,"__mobxInitializedProps",{}),e.__mobxInitializedProps[t]=!0,r(e,t,n,o,i);}function A(e){!0!==e.__mobxDidRunLazyInitializers&&e.__mobxLazyInitializers&&(Ue(e,"__mobxDidRunLazyInitializers",!0),e.__mobxDidRunLazyInitializers&&e.__mobxLazyInitializers.forEach(function(t){return t(e)}));}function S(e){return (2===e.length||3===e.length)&&"string"==typeof e[1]}function U(e){return function(t,n,r){if(r&&"function"==typeof r.value)return r.value=z(e,r.value),r.enumerable=!1,r.configurable=!0,r;if(void 0!==r&&void 0!==r.get)throw Error("[mobx] action is not expected to be used with getters");return hn(e).apply(this,arguments)}}function C(e,t,n){var r="string"==typeof e?e:e.name||"<unnamed action>",o="function"==typeof e?e:t,i="function"==typeof e?t:n;return me("function"==typeof o,T("m002")),me(0===o.length,T("m003")),me("string"==typeof r&&r.length>0,"actions should have valid names, got: '"+r+"'"),b(r,o,i,void 0)}function Q(e){return "function"==typeof e&&!0===e.isMobxAction}function _(e,t,n){var r=function(){return b(t,n,e,arguments)};r.isMobxAction=!0,Ue(e,t,r);}function Y(e,t){return P(e,t)}function P(e,t,n,r){if(e===t)return 0!==e||1/e==1/t;if(null==e||null==t)return !1;if(e!==e)return t!==t;var o=void 0===e?"undefined":en(e);return ("function"===o||"object"===o||"object"==(void 0===t?"undefined":en(t)))&&B(e,t,n,r)}function B(e,t,n,r){e=R(e),t=R(t);var o=zn.call(e);if(o!==zn.call(t))return !1;switch(o){case"[object RegExp]":case"[object String]":return ""+e==""+t;case"[object Number]":return +e!=+e?+t!=+t:0==+e?1/+e==1/t:+e==+t;case"[object Date]":case"[object Boolean]":return +e==+t;case"[object Symbol]":return "undefined"!=typeof Symbol&&Symbol.valueOf.call(e)===Symbol.valueOf.call(t)}var i="[object Array]"===o;if(!i){if("object"!=(void 0===e?"undefined":en(e))||"object"!=(void 0===t?"undefined":en(t)))return !1;var a=e.constructor,s=t.constructor;if(a!==s&&!("function"==typeof a&&a instanceof a&&"function"==typeof s&&s instanceof s)&&"constructor"in e&&"constructor"in t)return !1}n=n||[],r=r||[];for(var u=n.length;u--;)if(n[u]===e)return r[u]===t;if(n.push(e),r.push(t),i){if((u=e.length)!==t.length)return !1;for(;u--;)if(!P(e[u],t[u],n,r))return !1}else{var c,M=Object.keys(e);if(u=M.length,Object.keys(t).length!==u)return !1;for(;u--;)if(c=M[u],!G(t,c)||!P(e[c],t[c],n,r))return !1}return n.pop(),r.pop(),!0}function R(e){return j(e)?e.peek():Yn(e)?e.entries():Re(e)?He(e.entries()):e}function G(e,t){return Object.prototype.hasOwnProperty.call(e,t)}function H(e,t){return e===t}function Z(e,t){return Y(e,t)}function V(e,t){return Pe(e,t)||H(e,t)}function W(e,t,n){function r(){i(s);}var o,i,a;"string"==typeof e?(o=e,i=t,a=n):(o=e.name||"Autorun@"+we(),i=e,a=t),me("function"==typeof i,T("m004")),me(!1===Q(i),T("m005")),a&&(i=i.bind(a));var s=new er(o,function(){this.track(r);});return s.schedule(),s.getDisposer()}function J(e,t,n,r){var o,i,a,s;return "string"==typeof e?(o=e,i=t,a=n,s=r):(o="When@"+we(),i=e,a=t,s=n),W(o,function(e){if(i.call(s)){e.dispose();var t=vt();a.call(s),mt(t);}})}function F(e,t,n,r){function o(){a(M);}var i,a,s,u;"string"==typeof e?(i=e,a=t,s=n,u=r):(i=e.name||"AutorunAsync@"+we(),a=e,s=t,u=n),me(!1===Q(a),T("m006")),void 0===s&&(s=1),u&&(a=a.bind(u));var c=!1,M=new er(i,function(){c||(c=!0,setTimeout(function(){c=!1,M.isDisposed||M.track(o);},s));});return M.schedule(),M.getDisposer()}function $(e,t,n){function r(){if(!c.isDisposed){var n=!1;c.track(function(){var t=e(c);n=a||!u(i,t),i=t;}),a&&o.fireImmediately&&t(i,c),a||!0!==n||t(i,c),a&&(a=!1);}}arguments.length>3&&ve(T("m007")),ye(e)&&ve(T("m008"));var o;o="object"===(void 0===n?"undefined":en(n))?n:{},o.name=o.name||e.name||t.name||"Reaction@"+we(),o.fireImmediately=!0===n||!0===o.fireImmediately,o.delay=o.delay||0,o.compareStructural=o.compareStructural||o.struct||!1,t=Tn(o.name,o.context?t.bind(o.context):t),o.context&&(e=e.bind(o.context));var i,a=!0,s=!1,u=o.equals?o.equals:o.compareStructural||o.struct?bn.structural:bn.default,c=new er(o.name,function(){a||1>o.delay?r():s||(s=!0,setTimeout(function(){s=!1,r();},o.delay));});return c.schedule(),c.getDisposer()}function q(e,t){if(ae(e)&&e.hasOwnProperty("$mobx"))return e.$mobx;me(Object.isExtensible(e),T("m035")),ke(e)||(t=(e.constructor.name||"ObservableObject")+"@"+we()),t||(t="ObservableObject@"+we());var n=new mn(e,t);return Ce(e,"$mobx",n),n}function X(e,t,n,r){if(e.values[t]&&!vn(e.values[t]))return me("value"in n,"The property "+t+" in "+e.name+" is already observable, cannot redefine it as computed property"),void(e.target[t]=n.value);if("value"in n)if(ye(n.value)){var o=n.value;K(e,t,o.initialValue,o.enhancer);}else Q(n.value)&&!0===n.value.autoBind?_(e.target,t,n.value.originalFn):vn(n.value)?te(e,t,n.value):K(e,t,n.value,r);else ee(e,t,n.get,n.set,bn.default,!0);}function K(e,t,n,o){if(_e(e.target,t),r(e)){var a=i(e,{object:e.target,name:t,type:"add",newValue:n});if(!a)return;n=a.newValue;}n=(e.values[t]=new gn(n,o,e.name+"."+t,!1)).value,Object.defineProperty(e.target,t,ne(t)),ie(e,e.target,t,n);}function ee(e,t,n,r,o,i){i&&_e(e.target,t),e.values[t]=new wn(n,e.target,o,e.name+"."+t,r),i&&Object.defineProperty(e.target,t,re(t));}function te(e,t,n){n.name=e.name+"."+t,n.scope||(n.scope=e.target),e.values[t]=n,Object.defineProperty(e.target,t,re(t));}function ne(e){return xn[e]||(xn[e]={configurable:!0,enumerable:!0,get:function(){return this.$mobx.values[e].get()},set:function(t){oe(this,e,t);}})}function re(e){return On[e]||(On[e]={configurable:!0,enumerable:!1,get:function(){return this.$mobx.values[e].get()},set:function(t){return this.$mobx.values[e].set(t)}})}function oe(e,t,n){var o=e.$mobx,s=o.values[t];if(r(o)){var M=i(o,{type:"update",object:e,name:t,newValue:n});if(!M)return;n=M.newValue;}if((n=s.prepareNewValue(n))!==Nn){var f=a(o),y=c(),M=f||y?{type:"update",object:e,oldValue:s.value,name:t,newValue:n}:null;y&&l(M),s.setNewValue(n),f&&u(o,M),y&&p();}}function ie(e,t,n,r){var o=a(e),i=c(),s=o||i?{type:"add",object:t,name:n,newValue:r}:null;i&&l(s),o&&u(e,s),i&&p();}function ae(e){return !!Le(e)&&(A(e),In(e.$mobx))}function se(e,t){if(null===e||void 0===e)return !1;if(void 0!==t){if(j(e)||Yn(e))throw Error(T("m019"));if(ae(e)){var n=e.$mobx;return n.values&&!!n.values[t]}return !1}return ae(e)||!!e.$mobx||on(e)||rr(e)||vn(e)}function ue(e){return me(!!e,":("),L(function(t,n,r,o,i){_e(t,n),me(!i||!i.get,T("m022")),K(q(t,void 0),n,r,e);},function(e){var t=this.$mobx.values[e];if(void 0!==t)return t.get()},function(e,t){oe(this,e,t);},!0,!1)}function ce(e){for(var t=[],n=1;arguments.length>n;n++)t[n-1]=arguments[n];return le(e,ge,t)}function Me(e){for(var t=[],n=1;arguments.length>n;n++)t[n-1]=arguments[n];return le(e,De,t)}function le(e,t,n){me(arguments.length>=2,T("m014")),me("object"===(void 0===e?"undefined":en(e)),T("m015")),me(!Yn(e),T("m016")),n.forEach(function(e){me("object"===(void 0===e?"undefined":en(e)),T("m017")),me(!se(e),T("m018"));});for(var r=q(e),o={},i=n.length-1;i>=0;i--){var a=n[i];for(var s in a)if(!0!==o[s]&&Se(a,s)){if(o[s]=!0,e===a&&!Qe(e,s))continue;var u=Object.getOwnPropertyDescriptor(a,s);X(r,s,u,t);}}return e}function pe(e){if(void 0===e&&(e=void 0),"string"==typeof arguments[1])return En.apply(null,arguments);if(me(1>=arguments.length,T("m021")),me(!ye(e),T("m020")),se(e))return e;var t=ge(e,void 0,void 0);return t!==e?t:Cn.box(e)}function fe(e){ve("Expected one or two arguments to observable."+e+". Did you accidentally try to use observable."+e+" as decorator?");}function ye(e){return "object"===(void 0===e?"undefined":en(e))&&null!==e&&!0===e.isMobxModifierDescriptor}function Ne(e,t){return me(!ye(t),"Modifiers cannot be nested"),{isMobxModifierDescriptor:!0,initialValue:t,enhancer:e}}function ge(e,t,n){return ye(e)&&ve("You tried to assign a modifier wrapped value to a collection, please define modifiers when creating the collection, not when modifying it"),se(e)?e:Array.isArray(e)?Cn.array(e,n):ke(e)?Cn.object(e,n):Re(e)?Cn.map(e,n):e}function de(e,t,n){return ye(e)&&ve("You tried to assign a modifier wrapped value to a collection, please define modifiers when creating the collection, not when modifying it"),void 0===e||null===e?e:ae(e)||j(e)||Yn(e)?e:Array.isArray(e)?Cn.shallowArray(e,n):ke(e)?Cn.shallowObject(e,n):Re(e)?Cn.shallowMap(e,n):ve("The shallow modifier / decorator can only used in combination with arrays, objects and maps")}function De(e){return e}function he(e,t,n){if(Y(e,t))return t;if(se(e))return e;if(Array.isArray(e))return new pn(e,he,n);if(Re(e))return new _n(e,he,n);if(ke(e)){var r={};return q(r,n),le(r,he,[e]),r}return e}function je(e,t){return Y(e,t)?t:e}function Te(e,t){void 0===t&&(t=void 0),ct();try{return e.apply(t)}finally{Mt();}}function ze(e){return xe("`mobx.map` is deprecated, use `new ObservableMap` or `mobx.observable.map` instead"),Cn.map(e)}function be(){return "undefined"!=typeof window?window:e}function we(){return ++Vn.mobxGuid}function ve(e,t){throw me(!1,e,t),"X"}function me(e,t,n){if(!e)throw Error("[mobx] Invariant failed: "+t+(n?" in '"+n+"'":""))}function xe(e){return -1===Bn.indexOf(e)&&(Bn.push(e),console.error("[mobx] Deprecated: "+e),!0)}function Oe(e){var t=!1;return function(){if(!t)return t=!0,e.apply(this,arguments)}}function Ie(e){var t=[];return e.forEach(function(e){-1===t.indexOf(e)&&t.push(e);}),t}function Ee(e,t,n){return void 0===t&&(t=100),void 0===n&&(n=" - "),e?e.slice(0,t).join(n)+(e.length>t?" (... and "+(e.length-t)+"more)":""):""}function Le(e){return null!==e&&"object"===(void 0===e?"undefined":en(e))}function ke(e){if(null===e||"object"!==(void 0===e?"undefined":en(e)))return !1;var t=Object.getPrototypeOf(e);return t===Object.prototype||null===t}function Ae(){for(var e=arguments[0],t=1,n=arguments.length;n>t;t++){var r=arguments[t];for(var o in r)Se(r,o)&&(e[o]=r[o]);}return e}function Se(e,t){return Gn.call(e,t)}function Ue(e,t,n){Object.defineProperty(e,t,{enumerable:!1,writable:!0,configurable:!0,value:n});}function Ce(e,t,n){Object.defineProperty(e,t,{enumerable:!1,writable:!1,configurable:!0,value:n});}function Qe(e,t){var n=Object.getOwnPropertyDescriptor(e,t);return !n||!1!==n.configurable&&!1!==n.writable}function _e(e,t){me(Qe(e,t),"Cannot make property '"+t+"' observable, it is not configurable and writable in the target object");}function Ye(e,t){var n="isMobX"+e;return t.prototype[n]=!0,function(e){return Le(e)&&!0===e[n]}}function Pe(e,t){return "number"==typeof e&&"number"==typeof t&&isNaN(e)&&isNaN(t)}function Be(e){return Array.isArray(e)||j(e)}function Re(e){return void 0!==be().Map&&e instanceof be().Map}function Ge(e){return ke(e)?Object.keys(e):Array.isArray(e)?e.map(function(e){return e[0]}):Re(e)?Array.from(e.keys()):Yn(e)?e.keys():ve("Cannot get keys from "+e)}function He(e){for(var t=[];;){var n=e.next();if(n.done)break;t.push(n.value);}return t}function Ze(){return "function"==typeof Symbol&&Symbol.toPrimitive||"@@toPrimitive"}function Ve(e){return null===e?null:"object"===(void 0===e?"undefined":en(e))?""+e:e}function We(){Jn=!0,be().__mobxInstanceCount--;}function Je(){xe("Using `shareGlobalState` is not recommended, use peer dependencies instead. See https://github.com/mobxjs/mobx/issues/1082 for details."),Wn=!0;var e=be(),t=Vn;if(e.__mobservableTrackingStack||e.__mobservableViewStack)throw Error("[mobx] An incompatible version of mobservable is already loaded.");if(e.__mobxGlobal&&e.__mobxGlobal.version!==t.version)throw Error("[mobx] An incompatible version of mobx is already loaded.");e.__mobxGlobal?Vn=e.__mobxGlobal:e.__mobxGlobal=t;}function Fe(){return Vn}function $e(){Vn.resetId++;var e=new Zn;for(var t in e)-1===Hn.indexOf(t)&&(Vn[t]=e[t]);Vn.allowStateChanges=!Vn.strictMode;}function qe(e,t){if("object"===(void 0===e?"undefined":en(e))&&null!==e){if(j(e))return me(void 0===t,T("m036")),e.$mobx.atom;if(Yn(e)){var n=e;if(void 0===t)return qe(n._keys);var r=n._data[t]||n._hasMap[t];return me(!!r,"the entry '"+t+"' does not exist in the observable map '"+Ke(e)+"'"),r}if(A(e),ae(e)){if(!t)return ve("please specify a property");var r=e.$mobx.values[t];return me(!!r,"no observable property '"+t+"' found on the observable object '"+Ke(e)+"'"),r}if(on(e)||vn(e)||rr(e))return e}else if("function"==typeof e&&rr(e.$mobx))return e.$mobx;return ve("Cannot obtain atom from "+e)}function Xe(e,t){return me(e,"Expecting some object"),void 0!==t?Xe(qe(e,t)):on(e)||vn(e)||rr(e)?e:Yn(e)?e:(A(e),e.$mobx?e.$mobx:void me(!1,"Cannot obtain administration from "+e))}function Ke(e,t){var n;return n=void 0!==t?qe(e,t):ae(e)||Yn(e)?Xe(e):qe(e),n.name}function et(e,t){return tt(qe(e,t))}function tt(e){var t={name:e.name};return e.observing&&e.observing.length>0&&(t.dependencies=Ie(e.observing).map(tt)),t}function nt(e,t){return rt(qe(e,t))}function rt(e){var t={name:e.name};return ot(e)&&(t.observers=it(e).map(rt)),t}function ot(e){return e.observers&&e.observers.length>0}function it(e){return e.observers}function at(e,t){var n=e.observers.length;n&&(e.observersIndexes[t.__mapid]=n),e.observers[n]=t,e.lowestObserverState>t.dependenciesState&&(e.lowestObserverState=t.dependenciesState);}function st(e,t){if(1===e.observers.length)e.observers.length=0,ut(e);else{var n=e.observers,r=e.observersIndexes,o=n.pop();if(o!==t){var i=r[t.__mapid]||0;i?r[o.__mapid]=i:delete r[o.__mapid],n[i]=o;}delete r[t.__mapid];}}function ut(e){e.isPendingUnobservation||(e.isPendingUnobservation=!0,Vn.pendingUnobservations.push(e));}function ct(){Vn.inBatch++;}function Mt(){if(0==--Vn.inBatch){St();for(var e=Vn.pendingUnobservations,t=0;e.length>t;t++){var n=e[t];n.isPendingUnobservation=!1,0===n.observers.length&&n.onBecomeUnobserved();}Vn.pendingUnobservations=[];}}function lt(e){var t=Vn.trackingDerivation;null!==t?t.runId!==e.lastAccessedBy&&(e.lastAccessedBy=t.runId,t.newObserving[t.unboundDepsCount++]=e):0===e.observers.length&&ut(e);}function pt(e){if(e.lowestObserverState!==qn.STALE){e.lowestObserverState=qn.STALE;for(var t=e.observers,n=t.length;n--;){var r=t[n];r.dependenciesState===qn.UP_TO_DATE&&(r.isTracing!==Xn.NONE&&Nt(r,e),r.onBecomeStale()),r.dependenciesState=qn.STALE;}}}function ft(e){if(e.lowestObserverState!==qn.STALE){e.lowestObserverState=qn.STALE;for(var t=e.observers,n=t.length;n--;){var r=t[n];r.dependenciesState===qn.POSSIBLY_STALE?r.dependenciesState=qn.STALE:r.dependenciesState===qn.UP_TO_DATE&&(e.lowestObserverState=qn.UP_TO_DATE);}}}function yt(e){if(e.lowestObserverState===qn.UP_TO_DATE){e.lowestObserverState=qn.POSSIBLY_STALE;for(var t=e.observers,n=t.length;n--;){var r=t[n];r.dependenciesState===qn.UP_TO_DATE&&(r.dependenciesState=qn.POSSIBLY_STALE,r.isTracing!==Xn.NONE&&Nt(r,e),r.onBecomeStale());}}}function Nt(e,t){if(console.log("[mobx.trace] '"+e.name+"' is invalidated due to a change in: '"+t.name+"'"),e.isTracing===Xn.BREAK){var n=[];gt(et(e),n,1),Function("debugger;\n/*\nTracing '"+e.name+"'\n\nYou are entering this break point because derivation '"+e.name+"' is being traced and '"+t.name+"' is now forcing it to update.\nJust follow the stacktrace you should now see in the devtools to see precisely what piece of your code is causing this update\nThe stackframe you are looking for is at least ~6-8 stack-frames up.\n\n"+(e instanceof wn?""+e.derivation:"")+"\n\nThe dependencies for this derivation are:\n\n"+n.join("\n")+"\n*/\n    ")();}}function gt(e,t,n){if(t.length>=1e3)return void t.push("(and many more)");t.push(""+Array(n).join("\t")+e.name),e.dependencies&&e.dependencies.forEach(function(e){return gt(e,t,n+1)});}function dt(e){return e instanceof Kn}function Dt(e){switch(e.dependenciesState){case qn.UP_TO_DATE:return !1;case qn.NOT_TRACKING:case qn.STALE:return !0;case qn.POSSIBLY_STALE:for(var t=vt(),n=e.observing,r=n.length,o=0;r>o;o++){var i=n[o];if(vn(i)){try{i.get();}catch(e){return mt(t),!0}if(e.dependenciesState===qn.STALE)return mt(t),!0}}return xt(e),mt(t),!1}}function ht(){return null!==Vn.trackingDerivation}function jt(e){var t=e.observers.length>0;Vn.computationDepth>0&&t&&ve(T("m031")+e.name),!Vn.allowStateChanges&&t&&ve(T(Vn.strictMode?"m030a":"m030b")+e.name);}function Tt(e,t,n){xt(e),e.newObserving=Array(e.observing.length+100),e.unboundDepsCount=0,e.runId=++Vn.runId;var r=Vn.trackingDerivation;Vn.trackingDerivation=e;var o;try{o=t.call(n);}catch(e){o=new Kn(e);}return Vn.trackingDerivation=r,zt(e),o}function zt(e){for(var t=e.observing,n=e.observing=e.newObserving,r=qn.UP_TO_DATE,o=0,i=e.unboundDepsCount,a=0;i>a;a++){var s=n[a];0===s.diffValue&&(s.diffValue=1,o!==a&&(n[o]=s),o++),s.dependenciesState>r&&(r=s.dependenciesState);}for(n.length=o,e.newObserving=null,i=t.length;i--;){var s=t[i];0===s.diffValue&&st(s,e),s.diffValue=0;}for(;o--;){var s=n[o];1===s.diffValue&&(s.diffValue=0,at(s,e));}r!==qn.UP_TO_DATE&&(e.dependenciesState=r,e.onBecomeStale());}function bt(e){var t=e.observing;e.observing=[];for(var n=t.length;n--;)st(t[n],e);e.dependenciesState=qn.NOT_TRACKING;}function wt(e){var t=vt(),n=e();return mt(t),n}function vt(){var e=Vn.trackingDerivation;return Vn.trackingDerivation=null,e}function mt(e){Vn.trackingDerivation=e;}function xt(e){if(e.dependenciesState!==qn.UP_TO_DATE){e.dependenciesState=qn.UP_TO_DATE;for(var t=e.observing,n=t.length;n--;)t[n].lowestObserverState=qn.UP_TO_DATE;}}function Ot(e){return console.log(e),e}function It(e){return xe("`whyRun` is deprecated in favor of `trace`"),e=Lt(arguments),e?vn(e)||rr(e)?Ot(e.whyRun()):ve(T("m025")):Ot(T("m024"))}function Et(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];var n=!1;"boolean"==typeof e[e.length-1]&&(n=e.pop());var r=Lt(e);if(!r)return ve("'trace(break?)' can only be used inside a tracked computed value or a Reaction. Consider passing in the computed value or reaction explicitly");r.isTracing===Xn.NONE&&console.log("[mobx.trace] '"+r.name+"' tracing enabled"),r.isTracing=n?Xn.BREAK:Xn.LOG;}function Lt(e){switch(e.length){case 0:return Vn.trackingDerivation;case 1:return qe(e[0]);case 2:return qe(e[0],e[1])}}function kt(e){me(this&&this.$mobx&&rr(this.$mobx),"Invalid `this`"),me(!this.$mobx.errorHandler,"Only one onErrorHandler can be registered"),this.$mobx.errorHandler=e;}function At(e){return Vn.globalReactionErrorHandlers.push(e),function(){var t=Vn.globalReactionErrorHandlers.indexOf(e);0>t||Vn.globalReactionErrorHandlers.splice(t,1);}}function St(){Vn.inBatch>0||Vn.isRunningReactions||nr(Ut);}function Ut(){Vn.isRunningReactions=!0;for(var e=Vn.pendingReactions,t=0;e.length>0;){++t===tr&&(console.error("Reaction doesn't converge to a stable state after "+tr+" iterations. Probably there is a cycle in the reactive function: "+e[0]),e.splice(0));for(var n=e.splice(0),r=0,o=n.length;o>r;r++)n[r].runReaction();}Vn.isRunningReactions=!1;}function Ct(e){var t=nr;nr=function(n){return e(function(){return t(n)})};}function Qt(e){return xe("asReference is deprecated, use observable.ref instead"),Cn.ref(e)}function _t(e){return xe("asStructure is deprecated. Use observable.struct, computed.struct or reaction options instead."),Cn.struct(e)}function Yt(e){return xe("asFlat is deprecated, use observable.shallow instead"),Cn.shallow(e)}function Pt(e){return xe("asMap is deprecated, use observable.map or observable.shallowMap instead"),Cn.map(e||{})}function Bt(e){return L(function(t,n,r,o,i){me(void 0!==i,T("m009")),me("function"==typeof i.get,T("m010")),ee(q(t,""),n,i.get,i.set,e,!1);},function(e){var t=this.$mobx.values[e];if(void 0!==t)return t.get()},function(e,t){this.$mobx.values[e].set(t);},!1,!1)}function Rt(e,t){if(null===e||void 0===e)return !1;if(void 0!==t){if(!1===ae(e))return !1;if(!e.$mobx.values[t])return !1;var n=qe(e,t);return vn(n)}return vn(e)}function Gt(e,t,n,r){return "function"==typeof n?Zt(e,t,n,r):Ht(e,t,n)}function Ht(e,t,n){return Xe(e).observe(t,n)}function Zt(e,t,n,r){return Xe(e,t).observe(n,r)}function Vt(e,t,n){return "function"==typeof n?Jt(e,t,n):Wt(e,t)}function Wt(e,t){return Xe(e).intercept(t)}function Jt(e,t,n){return Xe(e,t).intercept(n)}function Ft(e,t){return ht()||console.warn(T("m013")),ar(e,{context:t}).get()}function $t(e,t,n){function r(r){return t&&n.push([e,r]),r}if(void 0===t&&(t=!0),void 0===n&&(n=[]),se(e)){if(t&&null===n&&(n=[]),t&&null!==e&&"object"===(void 0===e?"undefined":en(e)))for(var o=0,i=n.length;i>o;o++)if(n[o][0]===e)return n[o][1];if(j(e)){var a=r([]),s=e.map(function(e){return $t(e,t,n)});a.length=s.length;for(var o=0,i=s.length;i>o;o++)a[o]=s[o];return a}if(ae(e)){var a=r({});for(var u in e)a[u]=$t(e[u],t,n);return a}if(Yn(e)){var c=r({});return e.forEach(function(e,r){return c[r]=$t(e,t,n)}),c}if(dn(e))return $t(e.get(),t,n)}return e}function qt(e,t){me("function"==typeof e&&2>e.length,"createTransformer expects a function that accepts one argument");var r={},o=Vn.resetId,i=function(o){function i(t,n){var r=o.call(this,function(){return e(n)},void 0,bn.default,"Transformer-"+e.name+"-"+t,void 0)||this;return r.sourceIdentifier=t,r.sourceObject=n,r}return n(i,o),i.prototype.onBecomeUnobserved=function(){var e=this.value;o.prototype.onBecomeUnobserved.call(this),delete r[this.sourceIdentifier],t&&t(e,this.sourceObject);},i}(wn);return function(e){o!==Vn.resetId&&(r={},o=Vn.resetId);var t=Xt(e),n=r[t];return n?n.get():(n=r[t]=new i(t,e),n.get())}}function Xt(e){if("string"==typeof e||"number"==typeof e)return e;if(null===e||"object"!==(void 0===e?"undefined":en(e)))throw Error("[mobx] transform expected some kind of object or primitive value, got: "+e);var t=e.$transformId;return void 0===t&&(t=we(),Ue(e,"$transformId",t)),t}function Kt(e,t,n){var r;if(Yn(e)||j(e)||dn(e))r=Xe(e);else{if(!ae(e))return ve("Expected observable map, object or array as first array");if("string"!=typeof t)return ve("InterceptReads can only be used with a specific property, not with an object in general");r=Xe(e,t);}return void 0!==r.dehancer?ve("An intercept reader was already established"):(r.dehancer="function"==typeof t?t:n,function(){r.dehancer=void 0;})}Object.defineProperty(t,"__esModule",{value:!0});var en="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},tn=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t;}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n]);},nn=function(){function e(e){void 0===e&&(e="Atom@"+we()),this.name=e,this.isPendingUnobservation=!0,this.observers=[],this.observersIndexes={},this.diffValue=0,this.lastAccessedBy=0,this.lowestObserverState=qn.NOT_TRACKING;}return e.prototype.onBecomeUnobserved=function(){},e.prototype.reportObserved=function(){lt(this);},e.prototype.reportChanged=function(){ct(),pt(this),Mt();},e.prototype.toString=function(){return this.name},e}(),rn=function(e){function t(t,n,r){void 0===t&&(t="Atom@"+we()),void 0===n&&(n=Rn),void 0===r&&(r=Rn);var o=e.call(this,t)||this;return o.name=t,o.onBecomeObservedHandler=n,o.onBecomeUnobservedHandler=r,o.isPendingUnobservation=!1,o.isBeingTracked=!1,o}return n(t,e),t.prototype.reportObserved=function(){return ct(),e.prototype.reportObserved.call(this),this.isBeingTracked||(this.isBeingTracked=!0,this.onBecomeObservedHandler()),Mt(),!!Vn.trackingDerivation},t.prototype.onBecomeUnobserved=function(){this.isBeingTracked=!1,this.onBecomeUnobservedHandler();},t}(nn),on=Ye("Atom",nn),an={spyReportEnd:!0},sn="__$$iterating",un=function(){var e=!1,t={};return Object.defineProperty(t,"0",{set:function(){e=!0;}}),Object.create(t)[0]=1,!1===e}(),cn=0,Mn=function(){function e(){}return e}();!function(e,t){void 0!==Object.setPrototypeOf?Object.setPrototypeOf(e.prototype,t):void 0!==e.prototype.__proto__?e.prototype.__proto__=t:e.prototype=t;}(Mn,Array.prototype),Object.isFrozen(Array)&&["constructor","push","shift","concat","pop","unshift","replace","find","findIndex","splice","reverse","sort"].forEach(function(e){Object.defineProperty(Mn.prototype,e,{configurable:!0,writable:!0,value:Array.prototype[e]});});var ln=function(){function e(e,t,n,r){this.array=n,this.owned=r,this.values=[],this.lastKnownLength=0,this.interceptors=null,this.changeListeners=null,this.atom=new nn(e||"ObservableArray@"+we()),this.enhancer=function(n,r){return t(n,r,e+"[..]")};}return e.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},e.prototype.dehanceValues=function(e){return void 0!==this.dehancer?e.map(this.dehancer):e},e.prototype.intercept=function(e){return o(this,e)},e.prototype.observe=function(e,t){return void 0===t&&(t=!1),t&&e({object:this.array,type:"splice",index:0,added:this.values.slice(),addedCount:this.values.length,removed:[],removedCount:0}),s(this,e)},e.prototype.getArrayLength=function(){return this.atom.reportObserved(),this.values.length},e.prototype.setArrayLength=function(e){if("number"!=typeof e||0>e)throw Error("[mobx.array] Out of range: "+e);var t=this.values.length;if(e!==t)if(e>t){for(var n=Array(e-t),r=0;e-t>r;r++)n[r]=void 0;this.spliceWithArray(t,0,n);}else this.spliceWithArray(e,t-e);},e.prototype.updateArrayLength=function(e,t){if(e!==this.lastKnownLength)throw Error("[mobx] Modification exception: the internal structure of an observable array was changed. Did you use peek() to change it?");this.lastKnownLength+=t,t>0&&e+t+1>cn&&h(e+t+1);},e.prototype.spliceWithArray=function(e,t,n){var o=this;jt(this.atom);var a=this.values.length;if(void 0===e?e=0:e>a?e=a:0>e&&(e=Math.max(0,a+e)),t=1===arguments.length?a-e:void 0===t||null===t?0:Math.max(0,Math.min(t,a-e)),void 0===n&&(n=[]),r(this)){var s=i(this,{object:this.array,type:"splice",index:e,removedCount:t,added:n});if(!s)return Pn;t=s.removedCount,n=s.added;}n=n.map(function(e){return o.enhancer(e,void 0)}),this.updateArrayLength(a,n.length-t);var u=this.spliceItemsIntoValues(e,t,n);return 0===t&&0===n.length||this.notifyArraySplice(e,n,u),this.dehanceValues(u)},e.prototype.spliceItemsIntoValues=function(e,t,n){if(1e4>n.length)return (o=this.values).splice.apply(o,[e,t].concat(n));var r=this.values.slice(e,e+t);return this.values=this.values.slice(0,e).concat(n,this.values.slice(e+t)),r;var o;},e.prototype.notifyArrayChildUpdate=function(e,t,n){var r=!this.owned&&c(),o=a(this),i=o||r?{object:this.array,type:"update",index:e,newValue:t,oldValue:n}:null;r&&l(i),this.atom.reportChanged(),o&&u(this,i),r&&p();},e.prototype.notifyArraySplice=function(e,t,n){var r=!this.owned&&c(),o=a(this),i=o||r?{object:this.array,type:"splice",index:e,removed:n,added:t,removedCount:n.length,addedCount:t.length}:null;r&&l(i),this.atom.reportChanged(),o&&u(this,i),r&&p();},e}(),pn=function(e){function t(t,n,r,o){void 0===r&&(r="ObservableArray@"+we()),void 0===o&&(o=!1);var i=e.call(this)||this,a=new ln(r,n,i,o);return Ce(i,"$mobx",a),t&&t.length&&i.spliceWithArray(0,0,t),un&&Object.defineProperty(a.array,"0",fn),i}return n(t,e),t.prototype.intercept=function(e){return this.$mobx.intercept(e)},t.prototype.observe=function(e,t){return void 0===t&&(t=!1),this.$mobx.observe(e,t)},t.prototype.clear=function(){return this.splice(0)},t.prototype.concat=function(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];return this.$mobx.atom.reportObserved(),Array.prototype.concat.apply(this.peek(),e.map(function(e){return j(e)?e.peek():e}))},t.prototype.replace=function(e){return this.$mobx.spliceWithArray(0,this.$mobx.values.length,e)},t.prototype.toJS=function(){return this.slice()},t.prototype.toJSON=function(){return this.toJS()},t.prototype.peek=function(){return this.$mobx.atom.reportObserved(),this.$mobx.dehanceValues(this.$mobx.values)},t.prototype.find=function(e,t,n){void 0===n&&(n=0);var r=this.findIndex.apply(this,arguments);return -1===r?void 0:this.get(r)},t.prototype.findIndex=function(e,t,n){void 0===n&&(n=0);for(var r=this.peek(),o=r.length,i=n;o>i;i++)if(e.call(t,r[i],i,this))return i;return -1},t.prototype.splice=function(e,t){for(var n=[],r=2;arguments.length>r;r++)n[r-2]=arguments[r];switch(arguments.length){case 0:return [];case 1:return this.$mobx.spliceWithArray(e);case 2:return this.$mobx.spliceWithArray(e,t)}return this.$mobx.spliceWithArray(e,t,n)},t.prototype.spliceWithArray=function(e,t,n){return this.$mobx.spliceWithArray(e,t,n)},t.prototype.push=function(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];var n=this.$mobx;return n.spliceWithArray(n.values.length,0,e),n.values.length},t.prototype.pop=function(){return this.splice(Math.max(this.$mobx.values.length-1,0),1)[0]},t.prototype.shift=function(){return this.splice(0,1)[0]},t.prototype.unshift=function(){for(var e=[],t=0;arguments.length>t;t++)e[t]=arguments[t];var n=this.$mobx;return n.spliceWithArray(0,0,e),n.values.length},t.prototype.reverse=function(){var e=this.slice();return e.reverse.apply(e,arguments)},t.prototype.sort=function(){var e=this.slice();return e.sort.apply(e,arguments)},t.prototype.remove=function(e){var t=this.$mobx.dehanceValues(this.$mobx.values).indexOf(e);return t>-1&&(this.splice(t,1),!0)},t.prototype.move=function(e,t){function n(e){if(0>e)throw Error("[mobx.array] Index out of bounds: "+e+" is negative");var t=this.$mobx.values.length;if(e>=t)throw Error("[mobx.array] Index out of bounds: "+e+" is not smaller than "+t)}if(n.call(this,e),n.call(this,t),e!==t){var r,o=this.$mobx.values;r=t>e?o.slice(0,e).concat(o.slice(e+1,t+1),[o[e]],o.slice(t+1)):o.slice(0,t).concat([o[e]],o.slice(t,e),o.slice(e+1)),this.replace(r);}},t.prototype.get=function(e){var t=this.$mobx;if(t){if(t.values.length>e)return t.atom.reportObserved(),t.dehanceValue(t.values[e]);console.warn("[mobx.array] Attempt to read an array index ("+e+") that is out of bounds ("+t.values.length+"). Please check length first. Out of bound indices will not be tracked by MobX");}},t.prototype.set=function(e,t){var n=this.$mobx,o=n.values;if(o.length>e){jt(n.atom);var a=o[e];if(r(n)){var s=i(n,{type:"update",object:this,index:e,newValue:t});if(!s)return;t=s.newValue;}t=n.enhancer(t,a);t!==a&&(o[e]=t,n.notifyArrayChildUpdate(e,t,a));}else{if(e!==o.length)throw Error("[mobx.array] Index out of bounds, "+e+" is larger than "+o.length);n.spliceWithArray(e,0,[t]);}},t}(Mn);g(pn.prototype,function(){return N(this.slice())}),Object.defineProperty(pn.prototype,"length",{enumerable:!1,configurable:!0,get:function(){return this.$mobx.getArrayLength()},set:function(e){this.$mobx.setArrayLength(e);}}),["every","filter","forEach","indexOf","join","lastIndexOf","map","reduce","reduceRight","slice","some","toString","toLocaleString"].forEach(function(e){var t=Array.prototype[e];me("function"==typeof t,"Base function not defined on Array prototype: '"+e+"'"),Ue(pn.prototype,e,function(){return t.apply(this.peek(),arguments)});}),function(e,t){for(var n=0;t.length>n;n++)Ue(e,t[n],e[t[n]]);}(pn.prototype,["constructor","intercept","observe","clear","concat","get","replace","toJS","toJSON","peek","find","findIndex","splice","spliceWithArray","push","pop","set","shift","unshift","reverse","sort","remove","move","toString","toLocaleString"]);var fn=d(0);h(1e3);var yn=Ye("ObservableArrayAdministration",ln),Nn={},gn=function(e){function t(t,n,r,o){void 0===r&&(r="ObservableValue@"+we()),void 0===o&&(o=!0);var i=e.call(this,r)||this;return i.enhancer=n,i.hasUnreportedChange=!1,i.dehancer=void 0,i.value=n(t,void 0,r),o&&c()&&M({type:"create",object:i,newValue:i.value}),i}return n(t,e),t.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},t.prototype.set=function(e){var t=this.value;if((e=this.prepareNewValue(e))!==Nn){var n=c();n&&l({type:"update",object:this,newValue:e,oldValue:t}),this.setNewValue(e),n&&p();}},t.prototype.prepareNewValue=function(e){if(jt(this),r(this)){var t=i(this,{object:this,type:"update",newValue:e});if(!t)return Nn;e=t.newValue;}return e=this.enhancer(e,this.value,this.name),this.value!==e?e:Nn},t.prototype.setNewValue=function(e){var t=this.value;this.value=e,this.reportChanged(),a(this)&&u(this,{type:"update",object:this,newValue:e,oldValue:t});},t.prototype.get=function(){return this.reportObserved(),this.dehanceValue(this.value)},t.prototype.intercept=function(e){return o(this,e)},t.prototype.observe=function(e,t){return t&&e({object:this,type:"update",newValue:this.value,oldValue:void 0}),s(this,e)},t.prototype.toJSON=function(){return this.get()},t.prototype.toString=function(){return this.name+"["+this.value+"]"},t.prototype.valueOf=function(){return Ve(this.get())},t}(nn);gn.prototype[Ze()]=gn.prototype.valueOf;var dn=Ye("ObservableValue",gn),Dn={m001:"It is not allowed to assign new values to @action fields",m002:"`runInAction` expects a function",m003:"`runInAction` expects a function without arguments",m004:"autorun expects a function",m005:"Warning: attempted to pass an action to autorun. Actions are untracked and will not trigger on state changes. Use `reaction` or wrap only your state modification code in an action.",m006:"Warning: attempted to pass an action to autorunAsync. Actions are untracked and will not trigger on state changes. Use `reaction` or wrap only your state modification code in an action.",m007:"reaction only accepts 2 or 3 arguments. If migrating from MobX 2, please provide an options object",m008:"wrapping reaction expression in `asReference` is no longer supported, use options object instead",m009:"@computed can only be used on getter functions, like: '@computed get myProps() { return ...; }'. It looks like it was used on a property.",m010:"@computed can only be used on getter functions, like: '@computed get myProps() { return ...; }'",m011:"First argument to `computed` should be an expression. If using computed as decorator, don't pass it arguments",m012:"computed takes one or two arguments if used as function",m013:"[mobx.expr] 'expr' should only be used inside other reactive functions.",m014:"extendObservable expected 2 or more arguments",m015:"extendObservable expects an object as first argument",m016:"extendObservable should not be used on maps, use map.merge instead",m017:"all arguments of extendObservable should be objects",m018:"extending an object with another observable (object) is not supported. Please construct an explicit propertymap, using `toJS` if need. See issue #540",m019:"[mobx.isObservable] isObservable(object, propertyName) is not supported for arrays and maps. Use map.has or array.length instead.",m020:"modifiers can only be used for individual object properties",m021:"observable expects zero or one arguments",m022:"@observable can not be used on getters, use @computed instead",m024:"whyRun() can only be used if a derivation is active, or by passing an computed value / reaction explicitly. If you invoked whyRun from inside a computation; the computation is currently suspended but re-evaluating because somebody requested its value.",m025:"whyRun can only be used on reactions and computed values",m026:"`action` can only be invoked on functions",m028:"It is not allowed to set `useStrict` when a derivation is running",m029:"INTERNAL ERROR only onBecomeUnobserved shouldn't be called twice in a row",m030a:"Since strict-mode is enabled, changing observed observable values outside actions is not allowed. Please wrap the code in an `action` if this change is intended. Tried to modify: ",m030b:"Side effects like changing state are not allowed at this point. Are you trying to modify state from, for example, the render function of a React component? Tried to modify: ",m031:"Computed values are not allowed to cause side effects by changing observables that are already being observed. Tried to modify: ",m032:"* This computation is suspended (not in use by any reaction) and won't run automatically.\n\tDidn't expect this computation to be suspended at this point?\n\t  1. Make sure this computation is used by a reaction (reaction, autorun, observer).\n\t  2. Check whether you are using this computation synchronously (in the same stack as they reaction that needs it).",m033:"`observe` doesn't support the fire immediately property for observable maps.",m034:"`mobx.map` is deprecated, use `new ObservableMap` or `mobx.observable.map` instead",m035:"Cannot make the designated object observable; it is not extensible",m036:"It is not possible to get index atoms from arrays",m037:'Hi there! I\'m sorry you have just run into an exception.\nIf your debugger ends up here, know that some reaction (like the render() of an observer component, autorun or reaction)\nthrew an exception and that mobx caught it, to avoid that it brings the rest of your application down.\nThe original cause of the exception (the code that caused this reaction to run (again)), is still in the stack.\n\nHowever, more interesting is the actual stack trace of the error itself.\nHopefully the error is an instanceof Error, because in that case you can inspect the original stack of the error from where it was thrown.\nSee `error.stack` property, or press the very subtle "(...)" link you see near the console.error message that probably brought you here.\nThat stack is more interesting than the stack of this console.error itself.\n\nIf the exception you see is an exception you created yourself, make sure to use `throw new Error("Oops")` instead of `throw "Oops"`,\nbecause the javascript environment will only preserve the original stack trace in the first form.\n\nYou can also make sure the debugger pauses the next time this very same exception is thrown by enabling "Pause on caught exception".\n(Note that it might pause on many other, unrelated exception as well).\n\nIf that all doesn\'t help you out, feel free to open an issue https://github.com/mobxjs/mobx/issues!\n',m038:"Missing items in this list?\n    1. Check whether all used values are properly marked as observable (use isObservable to verify)\n    2. Make sure you didn't dereference values too early. MobX observes props, not primitives. E.g: use 'person.name' instead of 'name' in your computation.\n"},hn=L(function(e,t,n,r){Ue(e,t,Tn(r&&1===r.length?r[0]:n.name||t||"<unnamed action>",n));},function(e){return this[e]},function(){me(!1,T("m001"));},!1,!0),jn=L(function(e,t,n){_(e,t,n);},function(e){return this[e]},function(){me(!1,T("m001"));},!1,!1),Tn=function(e,t){return 1===arguments.length&&"function"==typeof e?z(e.name||"<unnamed action>",e):2===arguments.length&&"function"==typeof t?z(e,t):1===arguments.length&&"string"==typeof e?U(e):U(t).apply(null,arguments)};Tn.bound=function(e){if("function"==typeof e){var t=z("<not yet bound action>",e);return t.autoBind=!0,t}return jn.apply(null,arguments)};var zn=Object.prototype.toString,bn={identity:H,structural:Z,default:V},wn=function(){function e(e,t,n,r,o){this.derivation=e,this.scope=t,this.equals=n,this.dependenciesState=qn.NOT_TRACKING,this.observing=[],this.newObserving=null,this.isPendingUnobservation=!1,this.observers=[],this.observersIndexes={},this.diffValue=0,this.runId=0,this.lastAccessedBy=0,this.lowestObserverState=qn.UP_TO_DATE,this.unboundDepsCount=0,this.__mapid="#"+we(),this.value=new Kn(null),this.isComputing=!1,this.isRunningSetter=!1,this.isTracing=Xn.NONE,this.name=r||"ComputedValue@"+we(),o&&(this.setter=z(r+"-setter",o));}return e.prototype.onBecomeStale=function(){yt(this);},e.prototype.onBecomeUnobserved=function(){bt(this),this.value=void 0;},e.prototype.get=function(){me(!this.isComputing,"Cycle detected in computation "+this.name,this.derivation),0===Vn.inBatch?(ct(),Dt(this)&&(this.isTracing!==Xn.NONE&&console.log("[mobx.trace] '"+this.name+"' is being read outside a reactive context and doing a full recompute"),this.value=this.computeValue(!1)),Mt()):(lt(this),Dt(this)&&this.trackAndCompute()&&ft(this));var e=this.value;if(dt(e))throw e.cause;return e},e.prototype.peek=function(){var e=this.computeValue(!1);if(dt(e))throw e.cause;return e},e.prototype.set=function(e){if(this.setter){me(!this.isRunningSetter,"The setter of computed value '"+this.name+"' is trying to update itself. Did you intend to update an _observable_ value, instead of the computed property?"),this.isRunningSetter=!0;try{this.setter.call(this.scope,e);}finally{this.isRunningSetter=!1;}}else me(!1,"[ComputedValue '"+this.name+"'] It is not possible to assign a new value to a computed value.");},e.prototype.trackAndCompute=function(){c()&&M({object:this.scope,type:"compute",fn:this.derivation});var e=this.value,t=this.dependenciesState===qn.NOT_TRACKING,n=this.value=this.computeValue(!0);return t||dt(e)||dt(n)||!this.equals(e,n)},e.prototype.computeValue=function(e){this.isComputing=!0,Vn.computationDepth++;var t;if(e)t=Tt(this,this.derivation,this.scope);else try{t=this.derivation.call(this.scope);}catch(e){t=new Kn(e);}return Vn.computationDepth--,this.isComputing=!1,t},e.prototype.observe=function(e,t){var n=this,r=!0,o=void 0;return W(function(){var i=n.get();if(!r||t){var a=vt();e({type:"update",object:n,newValue:i,oldValue:o}),mt(a);}r=!1,o=i;})},e.prototype.toJSON=function(){return this.get()},e.prototype.toString=function(){return this.name+"["+this.derivation+"]"},e.prototype.valueOf=function(){return Ve(this.get())},e.prototype.whyRun=function(){var e=!!Vn.trackingDerivation,t=Ie(this.isComputing?this.newObserving:this.observing).map(function(e){return e.name}),n=Ie(it(this).map(function(e){return e.name}));return "\nWhyRun? computation '"+this.name+"':\n * Running because: "+(e?"[active] the value of this computation is needed by a reaction":this.isComputing?"[get] The value of this computed was requested outside a reaction":"[idle] not running at the moment")+"\n"+(this.dependenciesState===qn.NOT_TRACKING?T("m032"):" * This computation will re-run if any of the following observables changes:\n    "+Ee(t)+"\n    "+(this.isComputing&&e?" (... or any observable accessed during the remainder of the current run)":"")+"\n    "+T("m038")+"\n\n  * If the outcome of this computation changes, the following observers will be re-run:\n    "+Ee(n)+"\n")},e}();wn.prototype[Ze()]=wn.prototype.valueOf;var vn=Ye("ComputedValue",wn),mn=function(){function e(e,t){this.target=e,this.name=t,this.values={},this.changeListeners=null,this.interceptors=null;}return e.prototype.observe=function(e,t){return me(!0!==t,"`observe` doesn't support the fire immediately property for observable objects."),s(this,e)},e.prototype.intercept=function(e){return o(this,e)},e}(),xn={},On={},In=Ye("ObservableObjectAdministration",mn),En=ue(ge),Ln=ue(de),kn=ue(De),An=ue(he),Sn=ue(je),Un={box:function(e,t){return arguments.length>2&&fe("box"),new gn(e,ge,t)},shallowBox:function(e,t){return arguments.length>2&&fe("shallowBox"),new gn(e,De,t)},array:function(e,t){return arguments.length>2&&fe("array"),new pn(e,ge,t)},shallowArray:function(e,t){return arguments.length>2&&fe("shallowArray"),new pn(e,De,t)},map:function(e,t){return arguments.length>2&&fe("map"),new _n(e,ge,t)},shallowMap:function(e,t){return arguments.length>2&&fe("shallowMap"),new _n(e,De,t)},object:function(e,t){arguments.length>2&&fe("object");var n={};return q(n,t),ce(n,e),n},shallowObject:function(e,t){arguments.length>2&&fe("shallowObject");var n={};return q(n,t),Me(n,e),n},ref:function(){return 2>arguments.length?Ne(De,arguments[0]):kn.apply(null,arguments)},shallow:function(){return 2>arguments.length?Ne(de,arguments[0]):Ln.apply(null,arguments)},deep:function(){return 2>arguments.length?Ne(ge,arguments[0]):En.apply(null,arguments)},struct:function(){return 2>arguments.length?Ne(he,arguments[0]):An.apply(null,arguments)}},Cn=pe;Object.keys(Un).forEach(function(e){return Cn[e]=Un[e]}),Cn.deep.struct=Cn.struct,Cn.ref.struct=function(){return 2>arguments.length?Ne(je,arguments[0]):Sn.apply(null,arguments)};var Qn={},_n=function(){function e(e,t,n){void 0===t&&(t=ge),void 0===n&&(n="ObservableMap@"+we()),this.enhancer=t,this.name=n,this.$mobx=Qn,this._data=Object.create(null),this._hasMap=Object.create(null),this._keys=new pn(void 0,De,this.name+".keys()",!0),this.interceptors=null,this.changeListeners=null,this.dehancer=void 0,this.merge(e);}return e.prototype._has=function(e){return void 0!==this._data[e]},e.prototype.has=function(e){return !!this.isValidKey(e)&&(e=""+e,this._hasMap[e]?this._hasMap[e].get():this._updateHasMapEntry(e,!1).get())},e.prototype.set=function(e,t){this.assertValidKey(e),e=""+e;var n=this._has(e);if(r(this)){var o=i(this,{type:n?"update":"add",object:this,newValue:t,name:e});if(!o)return this;t=o.newValue;}return n?this._updateValue(e,t):this._addValue(e,t),this},e.prototype.delete=function(e){var t=this;if(this.assertValidKey(e),e=""+e,r(this)){var n=i(this,{type:"delete",object:this,name:e});if(!n)return !1}if(this._has(e)){var o=c(),s=a(this),n=s||o?{type:"delete",object:this,oldValue:this._data[e].value,name:e}:null;return o&&l(n),Te(function(){t._keys.remove(e),t._updateHasMapEntry(e,!1),t._data[e].setNewValue(void 0),t._data[e]=void 0;}),s&&u(this,n),o&&p(),!0}return !1},e.prototype._updateHasMapEntry=function(e,t){var n=this._hasMap[e];return n?n.setNewValue(t):n=this._hasMap[e]=new gn(t,De,this.name+"."+e+"?",!1),n},e.prototype._updateValue=function(e,t){var n=this._data[e];if((t=n.prepareNewValue(t))!==Nn){var r=c(),o=a(this),i=o||r?{type:"update",object:this,oldValue:n.value,name:e,newValue:t}:null;r&&l(i),n.setNewValue(t),o&&u(this,i),r&&p();}},e.prototype._addValue=function(e,t){var n=this;Te(function(){var r=n._data[e]=new gn(t,n.enhancer,n.name+"."+e,!1);t=r.value,n._updateHasMapEntry(e,!0),n._keys.push(e);});var r=c(),o=a(this),i=o||r?{type:"add",object:this,name:e,newValue:t}:null;r&&l(i),o&&u(this,i),r&&p();},e.prototype.get=function(e){return e=""+e,this.dehanceValue(this.has(e)?this._data[e].get():void 0)},e.prototype.dehanceValue=function(e){return void 0!==this.dehancer?this.dehancer(e):e},e.prototype.keys=function(){return N(this._keys.slice())},e.prototype.values=function(){return N(this._keys.map(this.get,this))},e.prototype.entries=function(){var e=this;return N(this._keys.map(function(t){return [t,e.get(t)]}))},e.prototype.forEach=function(e,t){var n=this;this.keys().forEach(function(r){return e.call(t,n.get(r),r,n)});},e.prototype.merge=function(e){var t=this;return Yn(e)&&(e=e.toJS()),Te(function(){ke(e)?Object.keys(e).forEach(function(n){return t.set(n,e[n])}):Array.isArray(e)?e.forEach(function(e){return t.set(e[0],e[1])}):Re(e)?e.forEach(function(e,n){return t.set(n,e)}):null!==e&&void 0!==e&&ve("Cannot initialize map from "+e);}),this},e.prototype.clear=function(){var e=this;Te(function(){wt(function(){e.keys().forEach(e.delete,e);});});},e.prototype.replace=function(e){var t=this;return Te(function(){var n=Ge(e);t.keys().filter(function(e){return -1===n.indexOf(e)}).forEach(function(e){return t.delete(e)}),t.merge(e);}),this},Object.defineProperty(e.prototype,"size",{get:function(){return this._keys.length},enumerable:!0,configurable:!0}),e.prototype.toJS=function(){var e=this,t={};return this.keys().forEach(function(n){return t[n]=e.get(n)}),t},e.prototype.toJSON=function(){return this.toJS()},e.prototype.isValidKey=function(e){return null!==e&&void 0!==e&&("string"==typeof e||"number"==typeof e||"boolean"==typeof e)},e.prototype.assertValidKey=function(e){if(!this.isValidKey(e))throw Error("[mobx.map] Invalid key: '"+e+"', only strings, numbers and booleans are accepted as key in observable maps.")},e.prototype.toString=function(){var e=this;return this.name+"[{ "+this.keys().map(function(t){return t+": "+e.get(t)}).join(", ")+" }]"},e.prototype.observe=function(e,t){return me(!0!==t,T("m033")),s(this,e)},e.prototype.intercept=function(e){return o(this,e)},e}();g(_n.prototype,function(){return this.entries()});var Yn=Ye("ObservableMap",_n),Pn=[];Object.freeze(Pn);var Bn=[],Rn=function(){},Gn=Object.prototype.hasOwnProperty,Hn=["mobxGuid","resetId","spyListeners","strictMode","runId"],Zn=function(){function e(){this.version=5,this.trackingDerivation=null,this.computationDepth=0,this.runId=0,this.mobxGuid=0,this.inBatch=0,this.pendingUnobservations=[],this.pendingReactions=[],this.isRunningReactions=!1,this.allowStateChanges=!0,this.strictMode=!1,this.resetId=0,this.spyListeners=[],this.globalReactionErrorHandlers=[];}return e}(),Vn=new Zn,Wn=!1,Jn=!1,Fn=!1,$n=be();$n.__mobxInstanceCount?($n.__mobxInstanceCount++,setTimeout(function(){Wn||Jn||Fn||(Fn=!0,console.warn("[mobx] Warning: there are multiple mobx instances active. This might lead to unexpected results. See https://github.com/mobxjs/mobx/issues/1082 for details."));},1)):$n.__mobxInstanceCount=1;var qn;!function(e){e[e.NOT_TRACKING=-1]="NOT_TRACKING",e[e.UP_TO_DATE=0]="UP_TO_DATE",e[e.POSSIBLY_STALE=1]="POSSIBLY_STALE",e[e.STALE=2]="STALE";}(qn||(t.IDerivationState=qn={}));var Xn;!function(e){e[e.NONE=0]="NONE",e[e.LOG=1]="LOG",e[e.BREAK=2]="BREAK";}(Xn||(Xn={}));var Kn=function(){function e(e){this.cause=e;}return e}(),er=function(){function e(e,t){void 0===e&&(e="Reaction@"+we()),this.name=e,this.onInvalidate=t,this.observing=[],this.newObserving=[],this.dependenciesState=qn.NOT_TRACKING,this.diffValue=0,this.runId=0,this.unboundDepsCount=0,this.__mapid="#"+we(),this.isDisposed=!1,this._isScheduled=!1,this._isTrackPending=!1,this._isRunning=!1,this.isTracing=Xn.NONE;}return e.prototype.onBecomeStale=function(){this.schedule();},e.prototype.schedule=function(){this._isScheduled||(this._isScheduled=!0,Vn.pendingReactions.push(this),St());},e.prototype.isScheduled=function(){return this._isScheduled},e.prototype.runReaction=function(){this.isDisposed||(ct(),this._isScheduled=!1,Dt(this)&&(this._isTrackPending=!0,this.onInvalidate(),this._isTrackPending&&c()&&M({object:this,type:"scheduled-reaction"})),Mt());},e.prototype.track=function(e){ct();var t,n=c();n&&(t=Date.now(),l({object:this,type:"reaction",fn:e})),this._isRunning=!0;var r=Tt(this,e,void 0);this._isRunning=!1,this._isTrackPending=!1,this.isDisposed&&bt(this),dt(r)&&this.reportExceptionInDerivation(r.cause),n&&p({time:Date.now()-t}),Mt();},e.prototype.reportExceptionInDerivation=function(e){var t=this;if(this.errorHandler)return void this.errorHandler(e,this);var n="[mobx] Encountered an uncaught exception that was thrown by a reaction or observer component, in: '"+this,r=T("m037");console.error(n||r,e),c()&&M({type:"error",message:n,error:e,object:this}),Vn.globalReactionErrorHandlers.forEach(function(n){return n(e,t)});},e.prototype.dispose=function(){this.isDisposed||(this.isDisposed=!0,this._isRunning||(ct(),bt(this),Mt()));},e.prototype.getDisposer=function(){var e=this.dispose.bind(this);return e.$mobx=this,e.onError=kt,e},e.prototype.toString=function(){return "Reaction["+this.name+"]"},e.prototype.whyRun=function(){var e=Ie(this._isRunning?this.newObserving:this.observing).map(function(e){return e.name});return "\nWhyRun? reaction '"+this.name+"':\n * Status: ["+(this.isDisposed?"stopped":this._isRunning?"running":this.isScheduled()?"scheduled":"idle")+"]\n * This reaction will re-run if any of the following observables changes:\n    "+Ee(e)+"\n    "+(this._isRunning?" (... or any observable accessed during the remainder of the current run)":"")+"\n\t"+T("m038")+"\n"},e.prototype.trace=function(e){void 0===e&&(e=!1),Et(this,e);},e}(),tr=100,nr=function(e){return e()},rr=Ye("Reaction",er),or=Bt(bn.default),ir=Bt(bn.structural),ar=function(e,t){if("string"==typeof t)return or.apply(null,arguments);me("function"==typeof e,T("m011")),me(3>arguments.length,T("m012"));var n="object"===(void 0===t?"undefined":en(t))?t:{};return n.setter="function"==typeof t?t:n.setter,new wn(e,n.context,n.equals?n.equals:n.compareStructural||n.struct?bn.structural:bn.default,n.name||e.name||"",n.setter)};ar.struct=ir,ar.equals=Bt;var sr={allowStateChanges:O,deepEqual:Y,getAtom:qe,getDebugName:Ke,getDependencyTree:et,getAdministration:Xe,getGlobalState:Fe,getObserverTree:nt,interceptReads:Kt,isComputingDerivation:ht,isSpyEnabled:c,onReactionError:At,reserveArrayBuffer:h,resetGlobalState:$e,isolateGlobalState:We,shareGlobalState:Je,spyReport:M,spyReportEnd:p,spyReportStart:l,setReactionScheduler:Ct},ur={Reaction:er,untracked:wt,Atom:rn,BaseAtom:nn,useStrict:m,isStrictModeEnabled:x,spy:f,comparer:bn,asReference:Qt,asFlat:Yt,asStructure:_t,asMap:Pt,isModifierDescriptor:ye,isObservableObject:ae,isBoxedObservable:dn,isObservableArray:j,ObservableMap:_n,isObservableMap:Yn,map:ze,transaction:Te,observable:Cn,computed:ar,isObservable:se,isComputed:Rt,extendObservable:ce,extendShallowObservable:Me,observe:Gt,intercept:Vt,autorun:W,autorunAsync:F,when:J,reaction:$,action:Tn,isAction:Q,runInAction:C,expr:Ft,toJS:$t,createTransformer:qt,whyRun:It,isArrayLike:Be,extras:sr},cr=!1;for(var Mr in ur)!function(e){var t=ur[e];Object.defineProperty(ur,e,{get:function(){return cr||(cr=!0,console.warn("Using default export (`import mobx from 'mobx'`) is deprecated and won’t work in mobx@4.0.0\nUse `import * as mobx from 'mobx'` instead")),t}});}(Mr);"object"===("undefined"==typeof __MOBX_DEVTOOLS_GLOBAL_HOOK__?"undefined":en(__MOBX_DEVTOOLS_GLOBAL_HOOK__))&&__MOBX_DEVTOOLS_GLOBAL_HOOK__.injectMobx({spy:f,extras:sr}),t.extras=sr,t.Reaction=er,t.untracked=wt,t.IDerivationState=qn,t.Atom=rn,t.BaseAtom=nn,t.useStrict=m,t.isStrictModeEnabled=x,t.spy=f,t.comparer=bn,t.asReference=Qt,t.asFlat=Yt,t.asStructure=_t,t.asMap=Pt,t.isModifierDescriptor=ye,t.isObservableObject=ae,t.isBoxedObservable=dn,t.isObservableArray=j,t.ObservableMap=_n,t.isObservableMap=Yn,t.map=ze,t.transaction=Te,t.observable=Cn,t.computed=ar,t.isObservable=se,t.isComputed=Rt,t.extendObservable=ce,t.extendShallowObservable=Me,t.observe=Gt,t.intercept=Vt,t.autorun=W,t.autorunAsync=F,t.when=J,t.reaction=$,t.action=Tn,t.isAction=Q,t.runInAction=C,t.expr=Ft,t.toJS=$t,t.createTransformer=qt,t.whyRun=It,t.trace=Et,t.isArrayLike=Be,t.default=ur;}).call(t,n(10));},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0}),t.Provider=t.inject=t.connect=t.useStaticRendering=t.Observer=t.observer=void 0;var r=n(3);Object.defineProperty(t,"observer",{enumerable:!0,get:function(){return r.observer}}),Object.defineProperty(t,"Observer",{enumerable:!0,get:function(){return r.Observer}}),Object.defineProperty(t,"useStaticRendering",{enumerable:!0,get:function(){return r.useStaticRendering}});var o=n(11);Object.defineProperty(t,"connect",{enumerable:!0,get:function(){return o.connect}});var i=n(5);Object.defineProperty(t,"inject",{enumerable:!0,get:function(){return i.inject}});var a=n(13);Object.defineProperty(t,"Provider",{enumerable:!0,get:function(){return a.Provider}});var s=n(1);if(!n(0).Component)throw Error("mobx-preact requires Preact to be available");if(!s.extras)throw Error("mobx-preact requires mobx to be available")},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!==(void 0===t?"undefined":y(t))&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+(void 0===t?"undefined":y(t)));e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}function a(e){j=e;}function s(e){var t=d.extras.getGlobalState().allowStateChanges;return d.extras.getGlobalState().allowStateChanges=e,t}function u(e){d.extras.getGlobalState().allowStateChanges=e;}function c(e,t,n,r,o){var i=s(e),a=void 0;try{a=t(n,r,o);}finally{u(i);}return a}function M(e,t){var n=arguments.length>2&&void 0!==arguments[2]&&arguments[2],r=e[t],o=z[t];e[t]=r?!0===n?function(){o.apply(this,arguments),r.apply(this,arguments);}:function(){r.apply(this,arguments),o.apply(this,arguments);}:o;}function l(e,t){if(null==e||null==t||"object"!==(void 0===e?"undefined":g(e))||"object"!==(void 0===t?"undefined":g(t)))return e!==t;var n=Object.keys(e);if(n.length!==Object.keys(t).length)return !0;for(var r=void 0,o=n.length-1;r=n[o];o--)if(t[r]!==e[r])return !0;return !1}function p(e){if(arguments.length>1&&T.warn('Mobx observer: Using observer to inject stores is not supported. Use `@connect(["store1", "store2"]) ComponentClass instead or preferably, use `@inject("store1", "store2") @observer ComponentClass` or `inject("store1", "store2")(observer(componentClass))``'),!0===e.isMobxInjector&&T.warn("Mobx observer: You are trying to use 'observer' on a component that already has 'inject'. Please apply 'observer' before applying 'inject'"),(0, h.isStateless)(e)){var t,n;return p((n=t=function(t){function n(){return r(this,n),o(this,(n.__proto__||Object.getPrototypeOf(n)).apply(this,arguments))}return i(n,t),N(n,[{key:"render",value:function(){return e.call(this,this.props,this.context)}}]),n}(D.Component),t.displayName=(0, h.makeDisplayName)(e),n))}if(!e)throw Error("Please pass a valid component to 'observer'");return f(e.prototype||e),e.isMobXReactObserver=!0,e}function f(e){M(e,"componentWillMount",!0),M(e,"componentDidMount"),e.shouldComponentUpdate||(e.shouldComponentUpdate=z.shouldComponentUpdate);}var y="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};Object.defineProperty(t,"__esModule",{value:!0}),t.Observer=void 0;var N=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),g="function"==typeof Symbol&&"symbol"===y(Symbol.iterator)?function(e){return void 0===e?"undefined":y(e)}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":void 0===e?"undefined":y(e)};t.useStaticRendering=a,t.observer=p;var d=n(1),D=n(0),h=n(4),j=!1,T=console,z={componentWillMount:function(){function e(e){var t=this[e],n=new d.Atom("reactive "+e);Object.defineProperty(this,e,{configurable:!0,enumerable:!0,get:function(){return n.reportObserved(),t},set:function(e){!o&&l(t,e)?(t=e,r=!0,n.reportChanged(),r=!1):t=e;}});}var t=this;if(!0!==j){var n=(0, h.makeDisplayName)(this),r=!1,o=!1;e.call(this,"props"),e.call(this,"state");var i=this.render.bind(this),a=null,s=!1,u=function(){return a=new d.Reaction(n+".render()",function(){if(!s&&(s=!0,"function"==typeof t.componentWillReact&&t.componentWillReact(),!0!==t.__$mobxIsUnmounted)){var e=!0;try{o=!0,r||D.Component.prototype.forceUpdate.call(t),e=!1;}finally{o=!1,e&&a.dispose();}}}),a.reactComponent=t,M.$mobx=a,t.render=M,M(t.props,t.state,t.context)},M=function(e,t,n){s=!1;var r=void 0,o=void 0;if(a.track(function(){try{o=c(!1,i,e,t,n);}catch(e){r=e;}}),r)throw r;return o};this.render=u;}},componentWillUnmount:function(){!0!==j&&(this.render.$mobx&&this.render.$mobx.dispose(),this.__$mobxIsUnmounted=!0);},componentDidMount:function(){},componentDidUpdate:function(){},shouldComponentUpdate:function(e,t){return j&&T.warn("[mobx-preact] It seems that a re-rendering of a React component is triggered while in static (server-side) mode. Please make sure components are rendered only once server-side."),this.state!==t||l(this.props,e)}};(t.Observer=p(function(e){return e.children[0]()})).displayName="Observer";},function(e,t,n){function r(e){return !(e.prototype&&e.prototype.render||i.Component.isPrototypeOf(e))}function o(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},n=t.prefix,r=void 0===n?"":n,o=t.suffix,i=void 0===o?"":o;return r+(e.displayName||e.name||e.constructor&&e.constructor.name||"<component>")+i}Object.defineProperty(t,"__esModule",{value:!0}),t.isStateless=r,t.makeDisplayName=o;var i=n(0);},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!==(void 0===t?"undefined":c(t))&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+(void 0===t?"undefined":c(t)));e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}function a(e,t,n){var a,s,u=n?"-with-"+n:"",c=(0, N.makeDisplayName)(t,{prefix:"inject-",suffix:u}),p=(s=a=function(n){function a(){return r(this,a),o(this,(a.__proto__||Object.getPrototypeOf(a)).apply(this,arguments))}return i(a,n),M(a,[{key:"render",value:function(){var n={};for(var r in this.props)this.props.hasOwnProperty(r)&&(n[r]=this.props[r]);var o=e(this.context.mobxStores||{},n,this.context)||{};for(var i in o)n[i]=o[i];return (0, l.h)(t,n)}}]),a}(l.Component),a.displayName=c,s);return (0, f.default)(p,t),p.wrappedComponent=t,Object.defineProperties(p,g),p}function s(e){return function(t,n){return e.forEach(function(e){if(!(e in n)){if(!(e in t))throw Error("MobX injector: Store '"+e+"' is not available! Make sure it is provided by some Provider");n[e]=t[e];}}),n}}function u(){var e=void 0;if("function"==typeof arguments[0])return e=arguments[0],function(t){var n=a(e,t);return n.isMobxInjector=!1,n=(0, y.observer)(n),n.isMobxInjector=!0,n};for(var t=[],n=0;arguments.length>n;n++)t[n]=arguments[n];return e=s(t),function(n){return a(e,n,t.join("-"))}}var c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};Object.defineProperty(t,"__esModule",{value:!0});var M=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();t.inject=u;var l=n(0),p=n(12),f=function(e){return e&&e.__esModule?e:{default:e}}(p),y=n(3),N=n(4),g={isMobxInjector:{value:!0,writable:!0,configurable:!0,enumerable:!0}};},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.JSONHTTPError=t.TextHTTPError=t.HTTPError=t.getPagination=void 0;var a=Object.assign||function(e){for(var t=1;arguments.length>t;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r]);}return e},s=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=n(15);Object.defineProperty(t,"getPagination",{enumerable:!0,get:function(){return u.getPagination}});var c=t.HTTPError=function(e){function t(e){r(this,t);var n=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e.statusText));return n.name=n.constructor.name,"function"==typeof Error.captureStackTrace?Error.captureStackTrace(n,n.constructor):n.stack=Error(e.statusText).stack,n.status=e.status,n}return i(t,e),t}(function(e){function t(){var t=Reflect.construct(e,Array.from(arguments));return Object.setPrototypeOf(t,Object.getPrototypeOf(this)),t}return t.prototype=Object.create(e.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),Object.setPrototypeOf?Object.setPrototypeOf(t,e):t.__proto__=e,t}(Error)),M=t.TextHTTPError=function(e){function t(e,n){r(this,t);var i=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return i.data=n,i}return i(t,e),t}(c),l=t.JSONHTTPError=function(e){function t(e,n){r(this,t);var i=o(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return i.json=n,i}return i(t,e),t}(c);t.default=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:"",n=arguments[1];r(this,e),this.apiURL=t,this.apiURL.match(/\/[^\/]?/)&&(this._sameOrigin=!0),this.defaultHeaders=n&&n.defaultHeaders||{};}return s(e,[{key:"headers",value:function(){return a({},this.defaultHeaders,{"Content-Type":"application/json"},arguments.length>0&&void 0!==arguments[0]?arguments[0]:{})}},{key:"parseJsonResponse",value:function(e){return e.json().then(function(t){if(!e.ok)return Promise.reject(new l(e,t));var n=(0, u.getPagination)(e);return n?{pagination:n,items:t}:t})}},{key:"request",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{},r=this.headers(n.headers||{});return this._sameOrigin&&(n.credentials=n.credentials||"same-origin"),fetch(this.apiURL+e,a({},n,{headers:r})).then(function(e){var n=e.headers.get("Content-Type");return n&&n.match(/json/)?t.parseJsonResponse(e):e.ok?e.text().then(function(){}):e.text().then(function(t){return Promise.reject(new M(e,t))})})}}]),e}();},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(0);t.default=function(e){function t(){return r(this,t),o(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return i(t,e),a(t,[{key:"render",value:function(){var e=this.props,t=e.saving,n=e.text,r=e.saving_text;return (0, s.h)("button",{type:"submit",className:"btn"+(t?" saving":"")},t?r||"Saving":n||"Save")}}]),t}(s.Component);},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(0),u={confirm:{type:"success",text:"A confirmation message was sent to your email, click the link there to continue."},password_mail:{type:"success",text:"We've sent a recovery email to your account, follow the link there to reset your password."},email_changed:{type:"sucess",text:"Your email address has been updated!"},verfication_error:{type:"error",text:"There was an error verifying your account. Please try again or contact an administrator."},signup_disabled:{type:"error",text:"Public signups are disabled. Contact an administrator and ask for an invite."}};t.default=function(e){function t(){return r(this,t),o(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return i(t,e),a(t,[{key:"render",value:function(){var e=this.props.type,t=u[e];return (0, s.h)("div",{className:"flashMessage "+t.type},(0, s.h)("span",null,t.text))}}]),t}(s.Component);},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function o(e){var t=arguments;(b[e]||[]).forEach(function(e){e.apply(e,Array.prototype.slice.call(t,1));});}function i(e,t){var n="";for(var r in t)n+=r+": "+t[r]+"; ";e?e.setAttribute("style",n):m=n;}function a(e){var t=x[document.location.host.split(":").shift()],n=t&&localStorage.getItem("netlifySiteURL");if(e)return new y.default({APIUrl:e,setCookie:!t});if(t&&n){var r=[n];return n.match(/\/$/)||r.push("/"),r.push(".netlify/identity"),new y.default({APIUrl:r.join(""),setCookie:!t})}return t?null:new y.default({setCookie:!t})}function s(){var e=(document.location.hash||"").replace(/^#\/?/,"");if(e){var t=e.match(L);t&&(D.default.verifyToken(t[1],t[2]),document.location.hash="");e.match(k)&&(D.default.openModal("signup"),document.location.hash="");if(e.match(A)){var n={};e.split("&").forEach(function(e){var t=e.split("="),r=c(t,2);n[r[0]]=r[1];}),document.location.hash="",D.default.openModal("login"),D.default.completeExternalLogin(n);}}}function u(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=e.APIUrl,n=e.logo,r=void 0===n||n,o=document.querySelectorAll("[data-netlify-identity-menu],[data-netlify-identity-button]");Array.prototype.slice.call(o).forEach(function(e){var t=null===e.getAttribute("data-netlify-identity-menu")?"button":"menu";(0, M.render)((0, M.h)(p.Provider,{store:D.default},(0, M.h)(j.default,{mode:t,text:e.innerText.trim()})),e,null);}),D.default.init(a(t)),D.default.modal.logo=r,I=document.createElement("iframe"),I.id="netlify-identity-widget",I.onload=function(){var e=I.contentDocument.createElement("style");e.innerHTML=""+z.default,I.contentDocument.head.appendChild(e),O=(0, M.render)((0, M.h)(p.Provider,{store:D.default},(0, M.h)(g.default,null)),I.contentDocument.body,O),s();},i(I,E),I.src="about:blank",(e.container?document.querySelector(e.container):document.body).appendChild(I),m&&(I.setAttribute("style",m),m=null);}Object.defineProperty(t,"__esModule",{value:!0});var c=function(){function e(e,t){var n=[],r=!0,o=!1,i=void 0;try{for(var a,s=e[Symbol.iterator]();!(r=(a=s.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{!r&&s.return&&s.return();}finally{if(o)throw i}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}(),M=n(0),l=n(1),p=n(2),f=n(14),y=r(f),N=n(18),g=r(N),d=n(24),D=r(d),h=n(25),j=r(h),T=n(26),z=r(T),b={},w={login:!0,signup:!0,error:!0},v={on:function(e,t){b[e]=b[e]||[],b[e].push(t);},open:function(e){if(e=e||"login",!w[e])throw Error("Invalid action for open: "+e);D.default.openModal(D.default.user?"user":e);},close:function(){D.default.closeModal();},currentUser:function(){return D.default.gotrue&&D.default.gotrue.currentUser()},logout:function(){return D.default.logout()},get gotrue(){return D.default.gotrue||D.default.openModal("login"),D.default.gotrue},init:function(e){u(e);},store:D.default},m=null,x={localhost:!0,"127.0.0.1":!0,"0.0.0.0":!0},O=void 0,I=void 0,E={position:"fixed",top:0,left:0,border:"none",width:"100%",height:"100%",overflow:"visible",background:"transparent",display:"none","z-index":99};(0, l.observe)(D.default.modal,"isOpen",function(){D.default.settings||D.default.loadSettings(),i(I,Object.assign({},E,{display:D.default.modal.isOpen?"block !important":"none"})),D.default.modal.isOpen?o("open",D.default.modal.page):o("close");}),(0, l.observe)(D.default,"siteURL",function(){localStorage.setItem("netlifySiteURL",D.default.siteURL),D.default.init(a(),!0);}),(0, l.observe)(D.default,"user",function(){D.default.user?o("login",D.default.user):o("logout");}),(0, l.observe)(D.default,"gotrue",function(){D.default.gotrue&&o("init",D.default.gotrue.currentUser());}),(0, l.observe)(D.default,"error",function(){o("error",D.default.error);});var L=/(confirmation|invite|recovery|email_change)_token=([^&]+)/,k=/error=access_denied&error_description=403/,A=/access_token=/;t.default=v;},function(e){var t,n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};t=function(){return this}();try{t=t||Function("return this")()||(0, eval)("this");}catch(e){"object"===("undefined"==typeof window?"undefined":n(window))&&(t=window);}e.exports=t;},function(e,t,n){function r(e,t){if("string"==typeof e)throw Error("Store names should be provided as array");return Array.isArray(e)?t?i.inject.apply(null,e)(r(t)):function(t){return r(e,t)}:(0, o.observer)(e)}Object.defineProperty(t,"__esModule",{value:!0}),t.connect=r;var o=n(3),i=n(5);},function(e){function t(e,M,l){if("string"!=typeof M){if(c){var p=u(M);p&&p!==c&&t(e,p,l);}var f=i(M);a&&(f=f.concat(a(M)));for(var y=0;f.length>y;++y){var N=f[y];if(!(n[N]||r[N]||l&&l[N])){var g=s(M,N);try{o(e,N,g);}catch(e){}}}return e}return e}var n={childContextTypes:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},r={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},o=Object.defineProperty,i=Object.getOwnPropertyNames,a=Object.getOwnPropertySymbols,s=Object.getOwnPropertyDescriptor,u=Object.getPrototypeOf,c=u&&u(Object);e.exports=t;},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!==(void 0===t?"undefined":a(t))&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+(void 0===t?"undefined":a(t)));e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}var a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e};Object.defineProperty(t,"__esModule",{value:!0}),t.Provider=void 0;var s=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=n(0),c={children:!0,key:!0,ref:!0},M=console;t.Provider=function(e){function t(){return r(this,t),o(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return i(t,e),s(t,[{key:"render",value:function(e){var t=e.children;return t.length>1?(0, u.h)("div",null," ",t," "):t[0]}},{key:"getChildContext",value:function(){var e={},t=this.context.mobxStores;if(t)for(var n in t)e[n]=t[n];for(var r in this.props)c[r]||"suppressChangedStoreWarning"===r||(e[r]=this.props[r]);return {mobxStores:e}}},{key:"componentWillReceiveProps",value:function(e){if(Object.keys(e).length!==Object.keys(this.props).length&&M.warn("MobX Provider: The set of provided stores has changed. Please avoid changing stores as the change might not propagate to all children"),!e.suppressChangedStoreWarning)for(var t in e)c[t]||this.props[t]===e[t]||M.warn("MobX Provider: Provided store '"+t+"' has changed. Please avoid replacing stores as the change might not propagate to all children");}}]),t}(u.Component);},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var i=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),a=n(6),s=r(a),u=n(16),c=r(u),M=/^http:\/\//,l="/.netlify/identity",p=function(){function e(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=t.APIUrl,r=void 0===n?l:n,i=t.audience,a=void 0===i?"":i,u=t.setCookie,c=void 0!==u&&u;o(this,e),r.match(M)&&console.warn("Warning:\n\nDO NOT USE HTTP IN PRODUCTION FOR GOTRUE EVER!\nGoTrue REQUIRES HTTPS to work securely."),a&&(this.audience=a),this.setCookie=c,this.api=new s.default(r);}return i(e,[{key:"_request",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};t.headers=t.headers||{};var n=t.audience||this.audience;return n&&(t.headers["X-JWT-AUD"]=n),this.api.request(e,t).catch(function(e){return e instanceof a.JSONHTTPError&&e.json&&(e.json.msg?e.message=e.json.msg:e.json.error&&(e.message=e.json.error+": "+e.json.error_description)),Promise.reject(e)})}},{key:"settings",value:function(){return this._request("/settings")}},{key:"signup",value:function(e,t,n){return this._request("/signup",{method:"POST",body:JSON.stringify({email:e,password:t,data:n})})}},{key:"login",value:function(e,t,n){var r=this;return this._setRememberHeaders(n),this._request("/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=password&username="+encodeURIComponent(e)+"&password="+encodeURIComponent(t)}).then(function(e){return c.default.removeSavedSession(),r.createUser(e,n)})}},{key:"loginExternalUrl",value:function(e){return this.api.apiURL+"/authorize?provider="+e}},{key:"confirm",value:function(e,t){return this._setRememberHeaders(t),this.verify("signup",e,t)}},{key:"requestPasswordRecovery",value:function(e){return this._request("/recover",{method:"POST",body:JSON.stringify({email:e})})}},{key:"recover",value:function(e,t){return this._setRememberHeaders(t),this.verify("recovery",e,t)}},{key:"acceptInvite",value:function(e,t,n){var r=this;return this._setRememberHeaders(n),this._request("/verify",{method:"POST",body:JSON.stringify({token:e,password:t,type:"signup"})}).then(function(e){return r.createUser(e,n)})}},{key:"acceptInviteExternalUrl",value:function(e,t){return this.api.apiURL+"/authorize?provider="+e+"&invite_token="+t}},{key:"createUser",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]&&arguments[1];return this._setRememberHeaders(t),new c.default(this.api,e,this.audience).getUserData().then(function(e){return t&&e._saveSession(),e})}},{key:"currentUser",value:function(){var e=c.default.recoverSession(this.api);return e&&this._setRememberHeaders(e._fromStorage),e}},{key:"verify",value:function(e,t,n){var r=this;return this._setRememberHeaders(n),this._request("/verify",{method:"POST",body:JSON.stringify({token:t,type:e})}).then(function(e){return r.createUser(e,n)})}},{key:"_setRememberHeaders",value:function(e){this.setCookie&&(this.api.defaultHeaders=this.api.defaultHeaders||{},this.api.defaultHeaders["X-Use-Cookie"]=e?"1":"session");}}]),e}();t.default=p,"undefined"!=typeof window&&(window.GoTrue=p);},function(e,t){function n(e){var t=e.headers.get("Link"),n={};if(null==t)return null;t=t.split(",");for(var o=e.headers.get("X-Total-Count"),i=0,a=t.length;a>i;i++){var s=t[i].replace(/(^\s*|\s*$)/,""),u=s.split(";"),c=r(u,2),M=c[0],l=c[1],p=M.match(/page=(\d+)/),f=p&&parseInt(p[1],10);l.match(/last/)?n.last=f:l.match(/next/)?n.next=f:l.match(/prev/)?n.prev=f:l.match(/first/)&&(n.first=f);}return n.last=Math.max(n.last||0,n.prev&&n.prev+1||0),n.current=n.next?n.next-1:n.last||1,n.total=o?parseInt(o,10):null,n}Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){var n=[],r=!0,o=!1,i=void 0;try{for(var a,s=e[Symbol.iterator]();!(r=(a=s.next()).done)&&(n.push(a.value),!t||n.length!==t);r=!0);}catch(e){o=!0,i=e;}finally{try{!r&&s.return&&s.return();}finally{if(o)throw i}}return n}return function(t,n){if(Array.isArray(t))return t;if(Symbol.iterator in Object(t))return e(t,n);throw new TypeError("Invalid attempt to destructure non-iterable instance")}}();t.getPagination=n;},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e){var t=e.replace(/-/g,"+").replace(/_/g,"/");switch(t.length%4){case 0:break;case 2:t+="==";break;case 3:t+="=";break;default:throw"Illegal base64url string!"}var n=window.atob(t);try{return decodeURIComponent(escape(n))}catch(e){return n}}Object.defineProperty(t,"__esModule",{value:!0});var a=Object.assign||function(e){for(var t=1;arguments.length>t;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r]);}return e},s=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=n(6),c=r(u),M=n(17),l=r(M),p={},f=null,y={api:1,token:1,audience:1,url:1},N={api:1};t.default=function(){function e(t,n,r){o(this,e),this.api=t,this.url=t.apiURL,this.audience=r,this._processTokenResponse(n),f=this;}return s(e,[{key:"update",value:function(e){var t=this;return this._request("/user",{method:"PUT",body:JSON.stringify(e)}).then(function(e){return t._saveUserData(e)._refreshSavedSession()})}},{key:"jwt",value:function(e){var t=this.tokenDetails(),n=t.expires_at,r=t.refresh_token,o=t.access_token;return e||n-6e4<Date.now()?this._refreshToken(r):Promise.resolve(o)}},{key:"logout",value:function(){return this._request("/logout",{method:"POST"}).then(this.clearSession.bind(this)).catch(this.clearSession.bind(this))}},{key:"_refreshToken",value:function(e){var t=this;return p[e]?p[e]:p[e]=this.api.request("/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"grant_type=refresh_token&refresh_token="+e}).then(function(n){return delete p[e],t._processTokenResponse(n),t._refreshSavedSession(),t.token.access_token}).catch(function(n){return delete p[e],t.clearSession(),Promise.reject(n)})}},{key:"_request",value:function(e){var t=this,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};n.headers=n.headers||{};var r=n.audience||this.audience;return r&&(n.headers["X-JWT-AUD"]=r),this.jwt().then(function(r){return t.api.request(e,a({headers:Object.assign(n.headers,{Authorization:"Bearer "+r})},n)).catch(function(e){return e instanceof u.JSONHTTPError&&e.json&&(e.json.msg?e.message=e.json.msg:e.json.error&&(e.message=e.json.error+": "+e.json.error_description)),Promise.reject(e)})})}},{key:"getUserData",value:function(){return this._request("/user").then(this._saveUserData.bind(this)).then(this._refreshSavedSession.bind(this))}},{key:"_saveUserData",value:function(t,n){for(var r in t)r in e.prototype||r in y||(this[r]=t[r]);return n&&(this._fromStorage=!0),this}},{key:"_processTokenResponse",value:function(e){this.token=e;var t=void 0;try{t=JSON.parse(i(e.access_token.split(".")[1])),this.token.expires_at=1e3*t.exp;}catch(t){console.error(Error("Gotrue-js: Failed to parse tokenResponse claims: "+JSON.stringify(e)));}}},{key:"_refreshSavedSession",value:function(){return localStorage.getItem("gotrue.user")&&this._saveSession(),this}},{key:"_saveSession",value:function(){return localStorage.setItem("gotrue.user",JSON.stringify(this._details)),this}},{key:"tokenDetails",value:function(){return this.token}},{key:"clearSession",value:function(){e.removeSavedSession(),this.token=null,f=null;}},{key:"admin",get:function(){return new l.default(this)}},{key:"_details",get:function(){var t={};for(var n in this)n in e.prototype||n in N||(t[n]=this[n]);return t}}],[{key:"removeSavedSession",value:function(){localStorage.removeItem("gotrue.user");}},{key:"recoverSession",value:function(t){if(f)return f;var n=localStorage.getItem("gotrue.user");if(n)try{var r=JSON.parse(n),o=r.url,i=r.token,a=r.audience;if(!o||!i)return null;return new e(t||new c.default(o,{}),i,a)._saveUserData(r,!0)}catch(e){return console.error(Error("Gotrue-js: Error recovering session: "+e)),null}return null}}]),e}();},function(e,t){function n(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}Object.defineProperty(t,"__esModule",{value:!0});var r=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}();t.default=function(){function e(t){n(this,e),this.user=t;}return r(e,[{key:"listUsers",value:function(e){return this.user._request("/admin/users",{method:"GET",audience:e})}},{key:"getUser",value:function(e){return this.user._request("/admin/users/"+e.id)}},{key:"updateUser",value:function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};return this.user._request("/admin/users/"+e.id,{method:"PUT",body:JSON.stringify(t)})}},{key:"createUser",value:function(e,t){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:{};return n.email=e,n.password=t,this.user._request("/admin/users",{method:"POST",body:JSON.stringify(n)})}},{key:"deleteUser",value:function(e){return this.user._request("/admin/users/"+e.id,{method:"DELETE"})}}]),e}();},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var s,u=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),c=n(0),M=n(2),l=n(19),p=r(l),f=n(20),y=r(f),N=n(21),g=r(N),d=n(22),D=r(d),h=n(23),j=r(h),T=n(8),z=r(T),b={login:!0,signup:!0},w={login:{login:!0,button:"Log in",button_saving:"Logging in",email:!0,password:!0,link:"amnesia",link_text:"Forgot password?",providers:!0},signup:{signup:!0,button:"Sign up",button_saving:"Signing Up",name:!0,email:!0,password:!0,providers:!0},amnesia:{title:"Recover password",button:"Send recovery email",button_saving:"Sending recovery email",email:!0,link:"login",link_text:"Never mind"},recovery:{title:"Recover password",button:"Update password",button_saving:"Updating password",password:!0,link:"login",link_text:"Never mind"},invite:{title:"Complete your signup",button:"Sign up",button_saving:"Signing Up",password:!0,providers:!0},user:{title:"Logged in"}};t.default=(0, M.connect)(["store"])(s=function(e){function t(){var e,n,r,a;o(this,t);for(var s=arguments.length,u=Array(s),c=0;s>c;c++)u[c]=arguments[c];return n=r=i(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),r.handleClose=function(){return r.props.store.closeModal()},r.handlePage=function(e){return r.props.store.openModal(e)},r.handleLogout=function(){return r.props.store.logout()},r.handleSiteURL=function(e){return r.props.store.setSiteURL(e)},r.handleExternalLogin=function(e){return r.props.store.externalLogin(e)},r.handleUser=function(e){var t=e.name,n=e.email,o=e.password,i=r.props.store;switch(i.modal.page){case"login":i.login(n,o);break;case"signup":i.signup(t,n,o);break;case"amnesia":i.requestPasswordRecovery(n);break;case"invite":i.acceptInvite(o);break;case"recovery":i.updatePassword(o);}},a=n,i(r,a)}return a(t,e),u(t,[{key:"renderBody",value:function(){var e=this.props.store;if(!e.gotrue)return (0, c.h)(y.default,{onSiteURL:this.handleSiteURL});if(e.settings)return e.user?(0, c.h)(g.default,{user:e.user,saving:e.saving,onLogout:this.handleLogout}):"signup"===e.modal.page&&e.settings.disable_signup?(0, c.h)(z.default,{type:"signup_disabled"}):(0, c.h)(D.default,{page:w[e.modal.page]||{},message:e.message,saving:e.saving,onSubmit:this.handleUser})}},{key:"renderProviders",value:function(){var e=this.props.store;if(!e.gotrue||!e.settings)return null;if("signup"===e.modal.page&&e.settings.disable_signup)return null;if(!(w[e.modal.page]||{}).providers)return null;var t=["Google","GitHub","GitLab","BitBucket","SAML"].filter(function(t){return e.settings.external[t.toLowerCase()]});return t.length?(0, c.h)(j.default,{providers:t,labels:e.settings.external_labels||{},onLogin:this.handleExternalLogin}):null}},{key:"render",value:function(){var e=this,t=this.props.store,n=b[t.modal.page],r=t.settings&&!t.settings.disable_signup,o=w[t.modal.page]||{},i=function(){return e.handlePage(o.link)};return (0, c.h)("div",null,(0, c.h)(p.default,{page:o,error:t.error,showHeader:n,showSignup:r,devSettings:!t.gotrue,loading:!t.error&&t.gotrue&&!t.settings,isOpen:t.modal.isOpen,onPage:this.handlePage,onClose:this.handleClose,logo:t.modal.logo},this.renderBody(),this.renderProviders(),!t.user&&o.link&&t.gotrue&&(0, c.h)("button",{onclick:i,className:"btnLink forgotPasswordLink"},o.link_text)))}}]),t}(c.Component))||s;},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}function a(e){return e.json&&e.json.error_description||e.message||""+e}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var s=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=n(0);t.default=function(e){function t(){var e,n,i,a;r(this,t);for(var s=arguments.length,u=Array(s),c=0;s>c;c++)u[c]=arguments[c];return n=i=o(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),i.handleClose=function(e){e.preventDefault(),i.props.onClose();},i.blockEvent=function(e){e.stopPropagation();},i.linkHandler=function(e){return function(t){t.preventDefault(),i.props.onPage(e);}},a=n,o(i,a)}return i(t,e),s(t,[{key:"render",value:function(){var e=this.props,t=e.page,n=e.error,r=e.loading,o=e.showHeader,i=e.showSignup,s=e.devSettings,c=e.isOpen,M=e.children,l=e.logo;return (0, u.h)("div",{className:"modalContainer",role:"dialog","aria-hidden":""+(r||!c),onClick:this.handleClose},(0, u.h)("div",{className:"modalDialog"+(r?" visuallyHidden":""),onClick:this.blockEvent},(0, u.h)("div",{className:"modalContent"},(0, u.h)("button",{onclick:this.handleClose,className:"btn btnClose"},(0, u.h)("span",{className:"visuallyHidden"},"Close")),o&&(0, u.h)("div",{className:"header"},i&&(0, u.h)("button",{className:"btn btnHeader "+(t.signup?"active":""),onclick:this.linkHandler("signup")},"Sign up"),!s&&(0, u.h)("button",{className:"btn btnHeader "+(t.login?"active":""),onclick:this.linkHandler("login")},"Log in")),t.title&&(0, u.h)("div",{className:"header"},(0, u.h)("button",{className:"btn btnHeader active"},t.title)),s&&(0, u.h)("div",{className:"header"},(0, u.h)("button",{className:"btn btnHeader active"},"Development Settings")),n&&(0, u.h)("div",{className:"flashMessage error"},(0, u.h)("span",null,a(n))),M)),l&&(0, u.h)("a",{href:"https://www.netlify.com",className:"callOut"+(r?" visuallyHidden":"")},(0, u.h)("span",{className:"netlifyLogo"}),"Coded by Netlify"))}}]),t}(u.Component);},function(e,t,n){function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function i(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function a(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var s=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=n(0);t.default=function(e){function t(e){o(this,t);var n=i(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.handleInput=function(e){n.setState(r({},e.target.name,e.target.value));},n.handleSiteURL=function(e){e.preventDefault(),n.props.onSiteURL(n.state.url);},n.state={url:""},n}return a(t,e),s(t,[{key:"render",value:function(){var e=this.state.url;return (0, u.h)("form",{onsubmit:this.handleSiteURL,className:"form"},(0, u.h)("div",{className:"flashMessage"},"Looks like you're running a local server. Please let us know the URL of your Netlify site."),(0, u.h)("div",{className:"formGroup"},(0, u.h)("label",null,(0, u.h)("span",{className:"visuallyHidden"},"Enter your Netlify Site URL"),(0, u.h)("input",{className:"formControl",type:"url",name:"url",value:e,placeholder:"URL of your Netlify site",autocapitalize:"off",required:!0,oninput:this.handleInput}),(0, u.h)("div",{className:"inputFieldIcon inputFieldUrl"}))),(0, u.h)("button",{type:"submit",className:"btn"},"Set site's URL"))}}]),t}(u.Component);},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(0),u=n(7),c=function(e){return e&&e.__esModule?e:{default:e}}(u);t.default=function(e){function t(){var e,n,i,a;r(this,t);for(var s=arguments.length,u=Array(s),c=0;s>c;c++)u[c]=arguments[c];return n=i=o(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),i.handleLogout=function(e){e.preventDefault(),i.props.onLogout();},a=n,o(i,a)}return i(t,e),a(t,[{key:"render",value:function(){var e=this.props,t=e.user,n=e.saving;return (0, s.h)("form",{onSubmit:this.handleLogout,className:"form "+(n?"disabled":"")},(0, s.h)("p",{className:"infoText"},"Logged in as ",(0, s.h)("br",null),(0, s.h)("span",{className:"infoTextEmail"},t.user_metadata.full_name||t.user_metadata.name||t.email)),(0, s.h)(c.default,{saving:n,text:"Log out",saving_text:"Logging out"}))}}]),t}(s.Component);},function(e,t,n){function r(e){return e&&e.__esModule?e:{default:e}}function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function a(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function s(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var u=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),c=n(0),M=n(8),l=r(M),p=n(7),f=r(p);t.default=function(e){function t(e){i(this,t);var n=a(this,(t.__proto__||Object.getPrototypeOf(t)).call(this,e));return n.handleInput=function(e){n.setState(o({},e.target.name,e.target.value));},n.handleLogin=function(e){e.preventDefault(),n.props.onSubmit(n.state);},n.state={name:"",email:"",password:""},n}return s(t,e),u(t,[{key:"render",value:function(){var e=this.props,t=e.page,n=e.message,r=e.saving,o=this.state,i=o.name,a=o.email,s=o.password;return (0, c.h)("form",{onsubmit:this.handleLogin,className:"form "+(r?"disabled":"")},n&&(0, c.h)(l.default,{type:n}),t.name&&(0, c.h)("div",{className:"formGroup"},(0, c.h)("label",null,(0, c.h)("span",{className:"visuallyHidden"},"Enter your name"),(0, c.h)("input",{className:"formControl",type:"name",name:"name",value:i,placeholder:"Name",autocapitalize:"off",required:!0,oninput:this.handleInput}),(0, c.h)("div",{className:"inputFieldIcon inputFieldName"}))),t.email&&(0, c.h)("div",{className:"formGroup"},(0, c.h)("label",null,(0, c.h)("span",{className:"visuallyHidden"},"Enter your email"),(0, c.h)("input",{className:"formControl",type:"email",name:"email",value:a,placeholder:"Email",autocapitalize:"off",required:!0,oninput:this.handleInput}),(0, c.h)("div",{className:"inputFieldIcon inputFieldEmail"}))),t.password&&(0, c.h)("div",{className:"formGroup"},(0, c.h)("label",null,(0, c.h)("span",{className:"visuallyHidden"},"Enter your password"),(0, c.h)("input",{className:"formControl",type:"password",name:"password",value:s,placeholder:"Password",required:!0,oninput:this.handleInput}),(0, c.h)("div",{className:"inputFieldIcon inputFieldPassword"}))),(0, c.h)(f.default,{saving:r,text:t.button,saving_text:t.button_saving}))}}]),t}(c.Component);},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0}),t.default=void 0;var a=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),s=n(0),u=function(e){function t(){var e,n,i,a;r(this,t);for(var s=arguments.length,u=Array(s),c=0;s>c;c++)u[c]=arguments[c];return n=i=o(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),i.handleLogin=function(e){e.preventDefault(),i.props.onLogin(i.props.provider.toLowerCase());},a=n,o(i,a)}return i(t,e),a(t,[{key:"render",value:function(){var e=this.props;return (0, s.h)("button",{onClick:this.handleLogin,className:"provider"+e.provider+" btn btnProvider"},"Continue with ",e.label)}}]),t}(s.Component);t.default=function(e){function t(){return r(this,t),o(this,(t.__proto__||Object.getPrototypeOf(t)).apply(this,arguments))}return i(t,e),a(t,[{key:"getLabel",value:function(e){var t=e.toLowerCase();return t in this.props.labels?this.props.labels[t]:e}},{key:"render",value:function(){var e=this,t=this.props,n=t.providers,r=t.onLogin;return (0, s.h)("div",{className:"providersGroup"},(0, s.h)("hr",{className:"hr"}),n.map(function(t){return (0, s.h)(u,{key:t,provider:t,label:e.getLabel(t),onLogin:r})}))}}]),t}(s.Component);},function(e,t,n){Object.defineProperty(t,"__esModule",{value:!0});var r=n(1),o=(0, r.observable)({user:null,recovered_user:null,message:null,settings:null,gotrue:null,error:null,siteURL:null,remember:!0,saving:!1,invite_token:null,email_change_token:null,modal:{page:"login",isOpen:!1,logo:!0}});o.startAction=(0, r.action)(function(){o.saving=!0,o.error=null,o.message=null;}),o.setError=(0, r.action)(function(e){o.saving=!1,o.error=e;}),o.init=(0, r.action)(function(e,t){e&&(o.gotrue=e,(o.user=e.currentUser())&&(o.modal.page="user")),t&&o.loadSettings();}),o.loadSettings=(0, r.action)(function(){o.settings||o.gotrue&&o.gotrue.settings().then((0, r.action)(function(e){return o.settings=e})).catch((0, r.action)(function(){o.error=Error("Failed to load settings from "+o.gotrue.api.apiURL);}));}),o.setSiteURL=(0, r.action)(function(e){o.siteURL=e;}),o.login=(0, r.action)(function(e,t){return o.startAction(),o.gotrue.login(e,t,o.remember).then((0, r.action)(function(e){o.user=e,o.modal.page="user",o.invite_token=null,o.email_change_token&&o.doEmailChange(),o.saving=!1;})).catch(o.setError)}),o.externalLogin=(0, r.action)(function(e){o.error=null,o.message=null;var t=o.invite_token?o.gotrue.acceptInviteExternalUrl(e,o.invite_token):o.gotrue.loginExternalUrl(e);window.location.href=t;}),o.completeExternalLogin=(0, r.action)(function(e){o.startAction(),o.gotrue.createUser(e,o.remember).then(function(e){o.user=e,o.modal.page="user",o.saving=!1;}).catch(o.setError);}),o.signup=(0, r.action)(function(e,t,n){return o.startAction(),o.gotrue.signup(t,n,{full_name:e}).then((0, r.action)(function(){o.settings.autoconfirm?o.login(t,n,o.remember):o.message="confirm",o.saving=!1;})).catch(o.setError)}),o.logout=(0, r.action)(function(){if(o.user)return o.startAction(),o.user.logout().then((0, r.action)(function(){o.user=null,o.modal.page="login",o.saving=!1;})).catch(o.setError);o.modal.page="login",o.saving=!1;}),o.updatePassword=(0, r.action)(function(e){o.startAction(),(o.recovered_user||o.user).update({password:e}).then(function(e){o.user=e,o.recovered_user=null,o.modal.page="user",o.saving=!1;}).catch(o.setError);}),o.acceptInvite=(0, r.action)(function(e){o.startAction(),o.gotrue.acceptInvite(o.invite_token,e,o.remember).then(function(e){o.saving=!1,o.invite_token=null,o.user=e,o.modal.page="user";}).catch(o.setError);}),o.doEmailChange=(0, r.action)(function(){return o.startAction(),o.user.update({email_change_token:o.email_change_token}).then((0, r.action)(function(e){o.user=e,o.email_change_token=null,o.message="email_changed",o.saving=!1;})).catch(o.setError)}),o.verifyToken=(0, r.action)(function(e,t){var n=o.gotrue;switch(o.modal.isOpen=!0,e){case"confirmation":o.startAction(),o.modal.page="signup",n.confirm(t,o.remember).then((0, r.action)(function(e){o.user=e,o.saving=!1;})).catch((0, r.action)(function(e){console.error(e),o.message="verfication_error",o.modal.page="signup",o.saving=!1;}));break;case"email_change":o.email_change_token=t,o.modal.page="message",o.user?o.doEmailChange():o.modal.page="login";break;case"invite":o.modal.page=e,o.invite_token=t;break;case"recovery":o.startAction(),o.modal.page=e,o.gotrue.recover(t,o.remember).then(function(e){o.saving=!1,o.recovered_user=e;}).catch(function(e){o.saving=!1,o.error=e,o.modal.page="login";});break;default:o.error="Unkown token type";}}),o.requestPasswordRecovery=(0, r.action)(function(e){o.startAction(),o.gotrue.requestPasswordRecovery(e).then((0, r.action)(function(){o.message="password_mail",o.saving=!1;})).catch(o.setError);}),o.openModal=(0, r.action)(function(e){o.modal.page=e,o.modal.isOpen=!0;}),o.closeModal=(0, r.action)(function(){o.modal.isOpen=!1,o.error=null,o.message=null,o.saving=!1;}),t.default=o;},function(e,t,n){function r(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function o(e,t){if(!e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return !t||"object"!=typeof t&&"function"!=typeof t?e:t}function i(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function, not "+typeof t);e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}),t&&(Object.setPrototypeOf?Object.setPrototypeOf(e,t):e.__proto__=t);}Object.defineProperty(t,"__esModule",{value:!0});var a,s=function(){function e(e,t){for(var n=0;t.length>n;n++){var r=t[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(e,r.key,r);}}return function(t,n,r){return n&&e(t.prototype,n),r&&e(t,r),t}}(),u=n(0);t.default=(0, n(2).connect)(["store"])(a=function(e){function t(){var e,n,i,a;r(this,t);for(var s=arguments.length,u=Array(s),c=0;s>c;c++)u[c]=arguments[c];return n=i=o(this,(e=t.__proto__||Object.getPrototypeOf(t)).call.apply(e,[this].concat(u))),i.handleSignup=function(e){e.preventDefault(),i.props.store.openModal("signup");},i.handleLogin=function(e){e.preventDefault(),i.props.store.openModal("login");},i.handleLogout=function(e){e.preventDefault(),i.props.store.openModal("user");},i.handleButton=function(e){e.preventDefault(),i.props.store.openModal(i.props.store.user?"user":"login");},a=n,o(i,a)}return i(t,e),s(t,[{key:"render",value:function(){var e=this.props.store.user;return "button"===this.props.mode?(0, u.h)("a",{className:"netlify-identity-button",href:"#",onClick:this.handleButton},this.props.text||(e?"Log out":"Log in")):e?(0, u.h)("ul",{className:"netlify-identity-menu"},(0, u.h)("li",{className:"netlify-identity-item netlify-identity-user-details"},"Logged in as"," ",(0, u.h)("span",{className:"netlify-identity-user"},e.user_metadata.name||e.email)),(0, u.h)("li",{className:"netlify-identity-item"},(0, u.h)("a",{className:"netlify-identity-logout",href:"#",onClick:this.handleLogout},"Log out"))):(0, u.h)("ul",{className:"netlify-identity-menu"},(0, u.h)("li",{className:"netlify-identity-item"},(0, u.h)("a",{className:"netlify-identity-signup",href:"#",onClick:this.handleSignup},"Sign up")),(0, u.h)("li",{className:"netlify-identity-item"},(0, u.h)("a",{className:"netlify-identity-login",href:"#",onClick:this.handleLogin},"Log in")))}}]),t}(u.Component))||a;},function(e,t,n){t=e.exports=n(27)(!1),t.push([e.i,'::-webkit-input-placeholder {\n  /* Chrome/Opera/Safari */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n::-moz-placeholder {\n  /* Firefox 19+ */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n:-ms-input-placeholder {\n  /* IE 10+ */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n:-moz-placeholder {\n  /* Firefox 18- */\n  color: #a3a9ac;\n  font-weight: 500;\n}\n\n.modalContainer {\n  position: absolute;\n  top: 0;\n  left: 0;\n  width: 100%;\n  min-height: 100%;\n  overflow-x: hidden;\n  overflow-y: auto;\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 14px;\n  line-height: 1.5;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n  -webkit-box-align: center;\n      -ms-flex-align: center;\n          align-items: center;\n  z-index: 99999;\n}\n\n.modalContainer::before {\n  content: "";\n  display: block;\n  position: fixed;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  background-color: #fff;\n  z-index: -1;\n}\n\n.modalDialog {\n  -webkit-box-flex: 1;\n      -ms-flex-positive: 1;\n          flex-grow: 1;\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  -webkit-box-orient: vertical;\n  -webkit-box-direction: normal;\n      -ms-flex-direction: column;\n          flex-direction: column;\n  width: 100%;\n}\n\n.modalContent {\n  position: relative;\n  padding: 32px;\n  opacity: 0;\n  -webkit-transform: translateY(10px) scale(1);\n          transform: translateY(10px) scale(1);\n  background: #fff;\n}\n\n[aria-hidden="false"] .modalContent {\n    -webkit-animation: bouncyEntrance 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);\n            animation: bouncyEntrance 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);\n    -webkit-animation-fill-mode: forwards;\n            animation-fill-mode: forwards;\n  }\n\n@-webkit-keyframes bouncyEntrance {\n  0% {\n    opacity: 0;\n    -webkit-transform: translateY(10px) scale(0.9);\n            transform: translateY(10px) scale(0.9);\n  }\n\n  100% {\n    opacity: 1;\n    -webkit-transform: translateY(0) scale(1);\n            transform: translateY(0) scale(1);\n  }\n}\n\n@keyframes bouncyEntrance {\n  0% {\n    opacity: 0;\n    -webkit-transform: translateY(10px) scale(0.9);\n            transform: translateY(10px) scale(0.9);\n  }\n\n  100% {\n    opacity: 1;\n    -webkit-transform: translateY(0) scale(1);\n            transform: translateY(0) scale(1);\n  }\n}\n\n@media (min-width: 480px) {\n  .modalContainer::before {\n    background-color: rgb(14, 30, 37);\n    -webkit-animation: fadeIn 0.1s ease-in;\n            animation: fadeIn 0.1s ease-in;\n    -webkit-animation-fill-mode: forwards;\n            animation-fill-mode: forwards;\n  }\n\n  .modalDialog {\n    max-width: 364px;\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n  }\n\n  .modalContent {\n    background: #fff;\n    -webkit-box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .07),\n      0 12px 32px 0 rgba(14, 30, 37, .1);\n            box-shadow: 0 4px 12px 0 rgba(0, 0, 0, .07),\n      0 12px 32px 0 rgba(14, 30, 37, .1);\n    border-radius: 8px;\n    margin-top: 32px;\n  }\n}\n\n@-webkit-keyframes fadeIn {\n  0% {\n    opacity: 0;\n  }\n\n  100% {\n    opacity: 0.67;\n  }\n}\n\n@keyframes fadeIn {\n  0% {\n    opacity: 0;\n  }\n\n  100% {\n    opacity: 0.67;\n  }\n}\n\n.flashMessage {\n  text-align: center;\n  color: rgb(14, 30, 37);\n  font-weight: 500;\n  font-size: 14px;\n  background-color: #f2f3f3;\n  padding: 6px;\n  border-radius: 4px;\n  opacity: 0.7;\n  -webkit-transition: opacity 0.2s linear;\n  transition: opacity 0.2s linear;\n}\n\n.flashMessage:hover,\n.flashMessage:focus {\n  opacity: 1;\n}\n\n.error {\n  color: #fa3946;\n  background-color: #fceef0;\n  opacity: 1;\n}\n\n.error span::before {\n  content: "";\n  display: inline-block;\n  position: relative;\n  top: 3px;\n  margin-right: 4px;\n  width: 16px;\n  height: 16px;\n  background: no-repeat center center;\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4KICA8cGF0aCBmaWxsPSIjRkEzOTQ2IiBkPSJNOCwxLjMzMzMzMzMzIEMxMS42NzYsMS4zMzMzMzMzMyAxNC42NjY2NjY3LDQuMzI0IDE0LjY2NjY2NjcsOCBDMTQuNjY2NjY2NywxMS42NzYgMTEuNjc2LDE0LjY2NjY2NjcgOCwxNC42NjY2NjY3IEM0LjMyNCwxNC42NjY2NjY3IDEuMzMzMzMzMzMsMTEuNjc2IDEuMzMzMzMzMzMsOCBDMS4zMzMzMzMzMyw0LjMyNCA0LjMyNCwxLjMzMzMzMzMzIDgsMS4zMzMzMzMzMyBaIE04LDAgQzMuNTgyLDAgMCwzLjU4MiAwLDggQzAsMTIuNDE4IDMuNTgyLDE2IDgsMTYgQzEyLjQxOCwxNiAxNiwxMi40MTggMTYsOCBDMTYsMy41ODIgMTIuNDE4LDAgOCwwIFogTTcuMTI2NjY2NjcsNS4wMTczMzMzMyBDNy4wNjA2NjY2Nyw0LjQ3OTMzMzMzIDcuNDc4NjY2NjcsNCA4LjAyNTMzMzMzLDQgQzguNTM5MzMzMzMsNCA4Ljk0MzMzMzMzLDQuNDUwNjY2NjcgOC44Nzg2NjY2Nyw0Ljk2NzMzMzMzIEw4LjM3NCw5LjAwMjY2NjY3IEM4LjM1MDY2NjY3LDkuMTkxMzMzMzMgOC4xOSw5LjMzMzMzMzMzIDgsOS4zMzMzMzMzMyBDNy44MSw5LjMzMzMzMzMzIDcuNjQ5MzMzMzMsOS4xOTEzMzMzMyA3LjYyNTMzMzMzLDkuMDAyNjY2NjcgTDcuMTI2NjY2NjcsNS4wMTczMzMzMyBMNy4xMjY2NjY2Nyw1LjAxNzMzMzMzIFogTTgsMTIuMTY2NjY2NyBDNy41NCwxMi4xNjY2NjY3IDcuMTY2NjY2NjcsMTEuNzkzMzMzMyA3LjE2NjY2NjY3LDExLjMzMzMzMzMgQzcuMTY2NjY2NjcsMTAuODczMzMzMyA3LjU0LDEwLjUgOCwxMC41IEM4LjQ2LDEwLjUgOC44MzMzMzMzMywxMC44NzMzMzMzIDguODMzMzMzMzMsMTEuMzMzMzMzMyBDOC44MzMzMzMzMywxMS43OTMzMzMzIDguNDYsMTIuMTY2NjY2NyA4LDEyLjE2NjY2NjcgWiIvPgo8L3N2Zz4K);\n}\n\n.success {\n}\n\n.disabled {\n  opacity: 0.38;\n  pointer-events: none;\n}\n\n.infoText {\n  text-align: center;\n  margin: 32px 0;\n}\n\n.infoTextEmail {\n  font-size: 16px;\n  font-weight: 500;\n}\n\n.saving {\n  background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABQCAMAAACeYYN3AAAAxlBMVEUAAAD////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////DTx3aAAAAQnRSTlMAAQIDBAUGBwgJCgsMDQ4PEBESExQVFhcYGRobHB0eHyAhIiMkJSYnKCkqKywtLi8wMTIzNDU2Nzg5Ojs8PT4/QEGgjKRfAAACk0lEQVR4AYXQDXP5WhAG8CUhiSQqSv4RRRMVL1Fa1VZf3PL9v9Tde9wc9M8+P8/M7s6czJiHgNIvVCJO6YiAMlAiWckASiQrm4bJMZTDrmbBIEC9qpgVjp6n4B+oyEwCzKrMQBVaQIlkpmXZln1dhQB+49gOh5dLexlV6MhsAqyazEQVugCqsOK5nsQmwPWZ53ucvyczSGb4l9T9OsdnLgFOXVZFFd4AqEKrIasR4AdBI2hw1GR6VzMwSWY2A60ZNDl6KnUC3KbMRhXeAqhCpyXzCAjarNVucdqXVEhWaRfCdsj5vQcE1EOZQ7Jy+EcUlklWi2Q3BLQ6nagTcTra2Y0qrHZirRN3OOezTUAjvq4bd7suqpDfSGJUoXcnCwiIerIqqlC96vf6HD1ZsUcE3PYH/QGnrx3uYnqoQn4l6aMK/XtZi4BuIrNIZqVJkiapkhx37Y6AcDgcpsNU44Nz3OuoQn4jSVGFNw+ykID+SGaTzM5G2YiTFVM73AMConE2zjhj7XAXs4EqHE/4d12GKgwmsoiAZCpzSObMptPZdHZVSkCc5/ksnym8cPRUmiQzpvNcmedzTl4o7qlBsuZc1iVg9ChDFdYWshEBveV/FssFZ/l7Z7eowsfl0/JJ4UXj43A/ogpbT7IeAZNnWQ1VuJJNCBi8HKxeVhw9tRaq8JkfrV/WHDULxb1CFbbX7HX9yllfck9A/ipzSea+yeYEJO+yEFX4tim8b94VXjj/zzdU4Z/NmY/NB+fkTglYfMg8knmfsiUBD1+yCFX4+X309f3FOds/UYVR8fH2e6vwovExIuB5K/NJ5v8jWxGQ/chiVOF2d+pn98M5zt3WJFm83+/2O4UXjprabkzAWn+o56k9qvBfX4hMaM+SxOMAAAAASUVORK5CYII=);\n  background-repeat: repeat-x;\n  background-size: contain;\n  background-origin: border-box;\n  background-position: 0% 0%;\n  -webkit-animation: loading 20s linear infinite;\n          animation: loading 20s linear infinite;\n  pointer-events: none;\n}\n\n.saving::after {\n  content: "\\2026";\n}\n\n@-webkit-keyframes loading {\n  0% {\n    background-position: 0% 0%;\n  }\n\n  100% {\n    background-position: 700% 0%;\n  }\n}\n\n@keyframes loading {\n  0% {\n    background-position: 0% 0%;\n  }\n\n  100% {\n    background-position: 700% 0%;\n  }\n}\n\n.btn {\n  display: block;\n  position: relative;\n  width: 100%;\n  height: auto;\n  margin: 14px 0 0;\n  padding: 6px;\n  outline: 0;\n  cursor: pointer;\n  border: 2px solid rgb(14, 30, 37);\n  border-radius: 4px;\n  background-color: #2d3b41;\n  color: #fff;\n  -webkit-transition: background-color 0.2s ease;\n  transition: background-color 0.2s ease;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  text-align: center;\n  text-decoration: none;\n  white-space: nowrap;\n}\n\n.btn:hover,\n.btn:focus {\n  background-color: rgb(14, 30, 37);\n  text-decoration: none;\n}\n\n.btnClose {\n  position: absolute;\n  top: 0;\n  right: 0;\n  margin: 0;\n  padding: 0;\n  border: 0;\n  width: 24px;\n  height: 24px;\n  border-radius: 50%;\n  margin: 6px;\n  background: #fff;\n  color: #a3a9ac;\n}\n\n.btnClose::before {\n  content: "\\D7";\n  font-size: 25px;\n  line-height: 9px;\n}\n\n.btnClose:hover,\n.btnClose:focus {\n  background: #e9ebeb;\n  color: rgb(14, 30, 37);\n}\n\n.header {\n  display: -webkit-box;\n  display: -ms-flexbox;\n  display: flex;\n  margin-top: -8px;\n  margin-bottom: 32px;\n}\n\n.btnHeader {\n  font-size: 16px;\n  line-height: 24px;\n  background: #fff;\n  color: #a3a9ac;\n  border: 0;\n  border-bottom: 2px solid #e9ebeb;\n  border-radius: 4px 4px 0 0;\n  margin: 0;\n}\n\n.btnHeader:focus,\n.btnHeader.active {\n  background: #fff;\n  color: rgb(14, 30, 37);\n  border-color: rgb(14, 30, 37);\n  font-weight: 700;\n}\n\n.btnHeader:not(:only-child):hover {\n  background-color: #e9ebeb;\n  color: rgb(14, 30, 37);\n}\n\n.btnHeader:only-child {\n  cursor: auto;\n}\n\n.btnLink {\n  display: block;\n  position: relative;\n  width: auto;\n  height: auto;\n  margin: 14px auto 0;\n  padding: 6px;\n  padding-bottom: 0;\n  outline: 0;\n  cursor: pointer;\n  color: rgb(14, 30, 37);\n  border: none;\n  border-bottom: 2px solid #e9ebeb;\n  border-radius: 0;\n  background-color: inherit;\n  -webkit-transition: border-color 0.2s ease;\n  transition: border-color 0.2s ease;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,\n    Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  text-align: center;\n  white-space: nowrap;\n}\n\n.btnLink:hover,\n.btnLink:focus {\n  background-color: inherit;\n  border-color: #a3a9ac;\n}\n\n.form {\n}\n\n.formGroup {\n  position: relative;\n  margin-top: 14px;\n}\n\n.formControl {\n  -webkit-box-sizing: border-box;\n          box-sizing: border-box;\n  display: block;\n  width: 100%;\n  height: 40px;\n  margin: 0;\n  padding: 6px 12px 6px 34px;\n  border: 2px solid #e9ebeb;\n  border-radius: 4px;\n  background: #fff;\n  color: rgb(14, 30, 37);\n  -webkit-box-shadow: none;\n          box-shadow: none;\n  font-size: 14px;\n  font-weight: 500;\n  line-height: 24px;\n  -webkit-transition: -webkit-box-shadow ease-in-out 0.15s;\n  transition: -webkit-box-shadow ease-in-out 0.15s;\n  transition: box-shadow ease-in-out 0.15s;\n  transition: box-shadow ease-in-out 0.15s, -webkit-box-shadow ease-in-out 0.15s;\n  -webkit-appearance: none;\n  -moz-appearance: none;\n}\n\n.inputFieldIcon {\n  position: absolute;\n  top: 12px;\n  left: 12px;\n  display: inline-block;\n  width: 16px;\n  height: 16px;\n  background-repeat: no-repeat;\n  background-position: center;\n  pointer-events: none;\n}\n\n.inputFieldName {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTgsNyBDNi4zNDMxNDU3NSw3IDUsNS42NTY4NTQyNSA1LDQgQzUsMi4zNDMxNDU3NSA2LjM0MzE0NTc1LDEgOCwxIEM5LjY1Njg1NDI1LDEgMTEsMi4zNDMxNDU3NSAxMSw0IEMxMSw1LjY1Njg1NDI1IDkuNjU2ODU0MjUsNyA4LDcgWiBNOCwxNSBMMS41LDE1IEMxLjUsMTEuMTM0MDA2OCA0LjQxMDE0OTEzLDggOCw4IEMxMS41ODk4NTA5LDggMTQuNSwxMS4xMzQwMDY4IDE0LjUsMTUgTDgsMTUgWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEgLTEpIi8+PC9zdmc+);\n}\n\n.inputFieldEmail {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxMSIgdmlld0JveD0iMCAwIDE2IDExIj4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0xLjE3MDczMTcxLDMgQzAuNTIyMTQ2MzQxLDMgMy45MDI0NTk4N2UtMDgsMy41NDUxMTA4MSAzLjkwMjQ1OTg3ZS0wOCw0LjIyMjIyMTU0IEwzLjkwMjQ1OTg3ZS0wOCwxMi43Nzc3Nzg1IEMzLjkwMjQ1OTg3ZS0wOCwxMy40NTQ4ODkyIDAuNTIyMTQ2MzQxLDE0IDEuMTcwNzMxNzEsMTQgTDE0LjgyOTI2ODMsMTQgQzE1LjQ3Nzg1MzcsMTQgMTYsMTMuNDU0ODg5MiAxNiwxMi43Nzc3Nzg1IEwxNiw0LjIyMjIyMTU0IEMxNiwzLjU0NTExMDgxIDE1LjQ3Nzg1MzcsMyAxNC44MjkyNjgzLDMgTDEuMTcwNzMxNzEsMyBaIE0yLjMzNzQyMTE5LDUuMDAxODY1NjYgQzIuNDU3NTExNzUsNC45ODk1NTIxNCAyLjU2MDcxNDU3LDUuMDM5MzM5OCAyLjYzNjM1OTg1LDUuMTE3Mjg0MzcgTDcuNDgyNjA2MTcsMTAuMTEzMjU0NSBDNy43ODQ0ODgyMiwxMC40MjQ3NDU1IDguMjAzMjc4MjksMTAuNDI0NzY2IDguNTA1ODk2MTksMTAuMTEzMjU0NSBMMTMuMzYzNjQwMiw1LjExNzI4NDM3IEMxMy41MDUxMjU1LDQuOTcxMjA0OTkgMTMuNzUyOTc3OSw0Ljk4MTg5NzIzIDEzLjg4MzkyMjIsNS4xMzk3MzYwMiBDMTQuMDE0ODY2NSw1LjI5NzU3NDgxIDE0LjAwNTI4MjEsNS41NzQwNzQ4OCAxMy44NjM3OTY3LDUuNzIwMTU0MjYgTDExLjExNTg2MDYsOC41NDg0MTE1MiBMMTMuODU4MDU3MSwxMS4yNjc2NDY5IEMxNC4wMjE3ODM1LDExLjQwMzE5ODIgMTQuMDQ4OTM2MywxMS43MDE0OTMyIDEzLjkxMjk4ODIsMTEuODcwOTg4OCBDMTMuNzc3MDQwMSwxMi4wNDA1MDQ5IDEzLjUwODI4OTcsMTIuMDQzNDE5MSAxMy4zNjkzOTgyLDExLjg3Njk0MDQgTDEwLjU3NTQ3MTUsOS4xMDYzOTg2MiBMOS4wMDYwNTI3NSwxMC43MTYxMjQ0IEM4LjQzNDk0MTk1LDExLjMwNDAzMzQgNy41NTMzMDI4NiwxMS4zMDUxNjIxIDYuOTgyNDY4LDEwLjcxNjEyNDQgTDUuNDI0NTI4NSw5LjEwNjM5ODYyIEwyLjYzMDYwMTgzLDExLjg3Njk0MDQgQzIuNDkxNzEwMzMsMTIuMDQzNDM5NyAyLjIyMjk1OTg4LDEyLjA0MDUyNTUgMi4wODcwMTE3OCwxMS44NzA5ODg4IEMxLjk1MTA2MzY3LDExLjcwMTQ5MzIgMS45NzgyMTY1LDExLjQwMzE5ODIgMi4xNDE5NDI5LDExLjI2NzY0NjkgTDQuODg0MTM5MzksOC41NDg0MTE1MiBMMi4xMzYyMDMyOCw1LjcyMDE1NDI2IEMyLjAyODcxNDE0LDUuNjE2MjI4MTYgMS45ODM1NTE0MSw1LjQzODk1NDUzIDIuMDI1OTkxNSw1LjI4NzQ5ODI1IEMyLjA2ODQxMzE5LDUuMTM2MDYyNDkgMi4xOTYwMjc4MSw1LjAxOTAyMjQ5IDIuMzM3NDIxMTksNS4wMDE4NjU2NiBaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgwIC0zKSIvPjwvc3ZnPg==);\n}\n\n.inputFieldPassword {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMiIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDEyIDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0yLjQ0NTkxMDQ1LDMuNjQzMDg0MjcgQzIuNDQ1OTEwMzgsMi42NzY2MjEzNyAyLjgxODk3NTQ2LDEuNzQ5NzYzOTMgMy40ODI5OTUxOCwxLjA2NjUxMDUyIEM0LjE0NzAxNDksMC4zODMyNTcxMTEgNS4wNDc1NjY0MywtMC4wMDAzOTMwNDg2MTggNS45ODY0NDEwNSwzLjAyMTc0MDY5ZS0wNyBMNi4xMTc1MTg0NywzLjAyMTc0MDY5ZS0wNyBDOC4wNjkyOTIwNSwwLjAwMjQ1Mjc4Mzg0IDkuNjUwNzAwMTMsMS42MzA5OTI4MyA5LjY1MjI4NzQyLDMuNjQwMTE4NzkgTDkuNjUyMjg3NDIsNC42NzgwMzQ0NSBDOS4xMzk1MDEwNSw0LjcwMzI0MDk4IDguNjM2Nzk3NTYsNC43NDYyNDAzNCA4LjEzMTIxMzI1LDQuODAxMTAxNiBMOC4xMzEyMTMyNSwzLjY0MzA4NDI3IEM4LjEzMTIxMzI1LDIuNDk2NjM0MjkgNy4yMjgzNjE2LDEuNTY3MjUyOTUgNi4xMTQ2Mzc2NCwxLjU2NzI1Mjk1IEw1Ljk4MzU2MDIzLDEuNTY3MjUyOTUgQzQuODY5ODM2MjgsMS41NjcyNTI5NSAzLjk2Njk4NDYyLDIuNDk2NjM0MjkgMy45NjY5ODQ2MiwzLjY0MzA4NDI3IEwzLjk2Njk4NDYyLDMuOTYwMzg5OTEgQzMuOTY3NTc5ODgsNC4zNTY0OTE4MiAzLjY3NzAzNTY1LDQuNjg4ODc1OTUgMy4yOTQzMTI2Miw0LjcyOTkzMDI0IEwzLjI3ODQ2ODEsNC43Mjk5MzAyNCBDMy4wNjYyNDA5Miw0Ljc1MzUwMjk2IDIuODU0MjgyODcsNC42ODMxMDg3IDIuNjk1NDU2MTMsNC41MzYzMDM3NiBDMi41MzY2Mjk0LDQuMzg5NDk4ODIgMi40NDU5MDUzMyw0LjE4MDEyMTMzIDIuNDQ1OTEwNDUsMy45NjAzODk5MSBMMi40NDU5MTA0NSwzLjY0MzA4NDI3IFogTTExLjQxNjY2Niw3LjExNTY1MzUyIEwxMS40MTY2NjYsMTIuNjkwNzQzMyBDMTEuNDE3MDQwOCwxMy4wODMxMTQzIDExLjE0NTkyMDMsMTMuNDIwMTM3MSAxMC43NzEzNjE4LDEzLjQ5MjkwMzkgTDEwLjI5MDI2NDQsMTMuNTg2MzE2MyBDOC44NzYwNzU2NCwxMy44NjE1OTU5IDcuNDM5OTcxMzMsMTQuMDAwMDkzNyA2LjAwMDcyMDA1LDEzLjk5OTk5OTggQzQuNTYwOTg3NTgsMTQuMDAwMTg2MiAzLjEyNDM5Njg0LDEzLjg2MTY4OCAxLjcwOTczNTI0LDEzLjU4NjMxNjMgTDEuMjI4NjM3OTIsMTMuNDkyOTAzOSBDMC44NTQwNzk0MDcsMTMuNDIwMTM3MSAwLjU4Mjk1ODg2NywxMy4wODMxMTQzIDAuNTgzMzMzNzIyLDEyLjY5MDc0MzMgTDAuNTgzMzMzNzIyLDcuMTE1NjUzNTIgQzAuNTgyOTU4ODY3LDYuNzIzMjgyNTYgMC44NTQwNzk0MDcsNi4zODYyNTk4MSAxLjIyODYzNzkyLDYuMzEzNDkyOTkgTDEuMjk5MjE4MDYsNi4zMDAxNDgzNiBDNC40MDU5OTg0Nyw1LjY5NTEyMTY3IDcuNTk1NDQxNjIsNS42OTUxMjE2NyAxMC43MDIyMjIsNi4zMDAxNDgzNiBMMTAuNzcyODAyMiw2LjMxMzQ5Mjk5IEMxMS4xNDY3ODgsNi4zODY4ODY0NSAxMS40MTcxNzE2LDYuNzIzNzQ1MTYgMTEuNDE2NjY2LDcuMTE1NjUzNTIgWiIvPjwvc3ZnPg==);\n}\n\n.inputFieldUrl {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNCIgdmlld0JveD0iMCAwIDE0IDE0Ij4gIDxwYXRoIGZpbGw9IiNBM0E5QUMiIGQ9Ik0xMCw1IEMxMCwzLjg5NTQzMDUgOS4xMDQ1Njk1LDMgOCwzIEM2Ljg5NTQzMDUsMyA2LDMuODk1NDMwNSA2LDUgTTQsMTAgTDQsMTEgTDYsMTEgTDYsMTAgQzYsOS40NDc3MTUyNSA1LjU1MjI4NDc1LDkgNSw5IEM0LjQ0NzcxNTI1LDkgNCw5LjQ0NzcxNTI1IDQsMTAgWiBNMTIsMTAgQzEyLDkuNDQ3NzE1MjUgMTEuNTUyMjg0Nyw5IDExLDkgQzEwLjQ0NzcxNTMsOSAxMCw5LjQ0NzcxNTI1IDEwLDEwIEwxMCwxMSBMMTIsMTEgTDEyLDEwIFogTTYsNiBMNiw1IEw0LDUgTDQsNiBDNCw2LjU1MjI4NDc1IDQuNDQ3NzE1MjUsNyA1LDcgQzUuNTUyMjg0NzUsNyA2LDYuNTUyMjg0NzUgNiw2IFogTTEwLDYgQzEwLDYuNTUyMjg0NzUgMTAuNDQ3NzE1Myw3IDExLDcgQzExLjU1MjI4NDcsNyAxMiw2LjU1MjI4NDc1IDEyLDYgTDEyLDUgTDEwLDUgTDEwLDYgWiBNNCw1IEM0LDIuNzkwODYxIDUuNzkwODYxLDEgOCwxIEMxMC4yMDkxMzksMSAxMiwyLjc5MDg2MSAxMiw1IEw0LDUgWiBNNCwxMSBMMTIsMTEgQzEyLDEzLjIwOTEzOSAxMC4yMDkxMzksMTUgOCwxNSBDNS43OTA4NjEsMTUgNCwxMy4yMDkxMzkgNCwxMSBaIE0xMCwxMSBMNiwxMSBDNiwxMi4xMDQ1Njk1IDYuODk1NDMwNSwxMyA4LDEzIEM5LjEwNDU2OTUsMTMgMTAsMTIuMTA0NTY5NSAxMCwxMSBaIE04LDExIEM3LjQ0NzcxNTI1LDExIDcsMTAuNTUyMjg0NyA3LDEwIEw3LDYgQzcsNS40NDc3MTUyNSA3LjQ0NzcxNTI1LDUgOCw1IEM4LjU1MjI4NDc1LDUgOSw1LjQ0NzcxNTI1IDksNiBMOSwxMCBDOSwxMC41NTIyODQ3IDguNTUyMjg0NzUsMTEgOCwxMSBaIiB0cmFuc2Zvcm09InJvdGF0ZSg0NSA4LjcwNyA2LjI5MykiLz48L3N2Zz4=);\n}\n\n.formLabel {\n}\n\n.hr {\n  border: 0;\n  border-top: 2px solid #e9ebeb;\n  margin: 32px 0 -1px;\n  text-align: center;\n  overflow: visible;\n}\n\n.hr::before {\n  content: "or";\n  position: relative;\n  display: inline-block;\n  font-size: 12px;\n  font-weight: 800;\n  line-height: 1;\n  text-transform: uppercase;\n  background-color: #fff;\n  color: rgb(14, 30, 37);\n  padding: 4px;\n  top: -11px;\n}\n\n.btnProvider {\n  padding-left: 40px;\n  padding-right: 40px;\n}\n\n.btnProvider::before {\n  content: "";\n  position: absolute;\n  display: inline-block;\n  vertical-align: middle;\n  width: 32px;\n  height: 40px;\n  background-repeat: no-repeat;\n  background-position: left center;\n  top: -2px;\n  left: 14px;\n}\n\n.providerGoogle {\n  background-color: #4285f4;\n  border-color: #366dc7;\n}\n\n.providerGoogle:hover,\n.providerGoogle:focus {\n  background-color: #366dc7;\n}\n\n.providerGitHub {\n  background-color: #333;\n  border-color: #000;\n}\n\n.providerGitHub:hover,\n.providerGitHub:focus {\n  background-color: #000;\n}\n\n.providerGitLab {\n  background-color: #e24329;\n  border-color: #b03320;\n}\n\n.providerGitLab:hover,\n.providerGitLab:focus {\n  background-color: #b03320;\n}\n\n.providerBitbucket {\n  background-color: #205081;\n  border-color: #14314f;\n}\n\n.providerBitbucket:hover,\n.providerBitbucket:focus {\n  background-color: #14314f;\n}\n\n.providerGoogle:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMyIgaGVpZ2h0PSIxMiIgdmlld0JveD0iMCAwIDEzIDEyIj4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEuNDg4IC0yKSI+ICAgIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPiAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik0wLjY1MjczNDM3NSwzLjI5NTI4MjQ0IEMwLjIzNzk4NDM3NSw0LjEwNTgzMjA2IDIuODQyMTcwOTRlLTE0LDUuMDE2MDQ1OCAyLjg0MjE3MDk0ZS0xNCw1Ljk3OTM4OTMxIEMyLjg0MjE3MDk0ZS0xNCw2Ljk0MjczMjgyIDAuMjM3OTg0Mzc1LDcuODUyOTAwNzYgMC42NTI3MzQzNzUsOC42NjM0NTAzOCBDMS42NTkwNDY4NywxMC42MTY3MDIzIDMuNzI2MDkzNzUsMTEuOTU4Nzc4NiA2LjExOTUzMTI1LDExLjk1ODc3ODYgQzcuNzcxNzgxMjUsMTEuOTU4Nzc4NiA5LjE1ODg1OTM3LDExLjQyNzI1MTkgMTAuMTcyMDE1NiwxMC41MTA0NDI3IEMxMS4zMjc5MDYyLDkuNDY3MzU4NzggMTEuOTk0MjgxMiw3LjkzMjY0MTIyIDExLjk5NDI4MTIsNi4xMTIyNTk1NCBDMTEuOTk0MjgxMiw1LjYyMDYyNTk1IDExLjk1MzQ1MzEsNS4yNjE4NjI2IDExLjg2NTA5MzcsNC44ODk4MTY3OSBMNi4xMTk1MzEyNSw0Ljg4OTgxNjc5IEw2LjExOTUzMTI1LDcuMTA4ODA5MTYgTDkuNDkyMDQ2ODcsNy4xMDg4MDkxNiBDOS40MjQwNzgxMiw3LjY2MDI1OTU0IDkuMDU2OTA2MjUsOC40OTA3MzI4MiA4LjI0MDk1MzEyLDkuMDQ4Nzc4NjMgQzcuNzI0MjAzMTIsOS40MDA5MDA3NiA3LjAzMDY0MDYyLDkuNjQ2NzE3NTYgNi4xMTk1MzEyNSw5LjY0NjcxNzU2IEM0LjUwMTI2NTYyLDkuNjQ2NzE3NTYgMy4xMjc3ODEyNSw4LjYwMzY3OTM5IDIuNjM4MTcxODcsNy4xNjE5ODQ3MyBMMi42Mjg3MTIwNSw3LjE2Mjc2OTU5IEMyLjUwNTM0MTU4LDYuNzk3Mjk0NjggMi40MzQyMTg3NSw2LjM4MTEyMjg1IDIuNDM0MjE4NzUsNS45NzkzODkzMSBDMi40MzQyMTg3NSw1LjU2NzQ1MDM4IDIuNTA4OTg0MzgsNS4xNjg4Mzk2OSAyLjYzMTM3NSw0Ljc5Njc5Mzg5IEMzLjEyNzc4MTI1LDMuMzU1MDk5MjQgNC41MDEyNjU2MiwyLjMxMjAxNTI3IDYuMTE5NTMxMjUsMi4zMTIwMTUyNyBDNy4yNjg2MjUsMi4zMTIwMTUyNyA4LjA0Mzc1LDIuNzk3MDA3NjMgOC40ODU3MzQzNywzLjIwMjMwNTM0IEwxMC4yMTI3OTY5LDEuNTU0NjQxMjIgQzkuMTUyMTA5MzcsMC41OTEyOTc3MSA3Ljc3MTc4MTI1LDguODgxNzg0MmUtMTYgNi4xMTk1MzEyNSw4Ljg4MTc4NDJlLTE2IEMzLjcyNjA5Mzc1LDguODgxNzg0MmUtMTYgMS42NTkwNDY4NywxLjM0MjAzMDUzIDAuNjUyNzM0Mzc1LDMuMjk1MjgyNDQgTDAuNjUyNzM0Mzc1LDMuMjk1MjgyNDQgWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMiAyKSIvPiAgPC9nPjwvc3ZnPg==);\n}\n\n.providerGitHub:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE2IDE2Ij4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+ICAgIDxyZWN0IHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIvPiAgICA8cGF0aCBmaWxsPSIjRkZGRkZGIiBmaWxsLXJ1bGU9Im5vbnplcm8iIGQ9Ik04LjAwMDA2NjI1LDAgQzMuNTgyMzMwNzksMCAwLDMuNjcyMzE1ODUgMCw4LjIwMjUzNzczIEMwLDExLjgyNjYzMzggMi4yOTIyNjI0OCwxNC45MDEyOTUgNS40NzA5MzM1NiwxNS45ODU5MDIzIEM1Ljg3MDc1MTM5LDE2LjA2MTgzMTUgNi4wMTc1MzY3NSwxNS44MDc5NjQyIDYuMDE3NTM2NzUsMTUuNTkxMzE0NCBDNi4wMTc1MzY3NSwxNS4zOTU3MTgzIDYuMDEwMTE3OTksMTQuNzQ5NTcyMiA2LjAwNjY3MzU2LDE0LjA2NDE3MTEgQzMuNzgxMDQ3NDEsMTQuNTYwMzYwMiAzLjMxMTQxMzc5LDEzLjA5NjM3ODEgMy4zMTE0MTM3OSwxMy4wOTYzNzgxIEMyLjk0NzQ5NzQsMTIuMTQ4MjgwNiAyLjQyMzE1MDUsMTEuODk2MTc5IDIuNDIzMTUwNSwxMS44OTYxNzkgQzEuNjk3MzA0OTEsMTEuMzg3MDg2IDIuNDc3ODYzNzksMTEuMzk3NTQ0OSAyLjQ3Nzg2Mzc5LDExLjM5NzU0NDkgQzMuMjgxMjA4ODcsMTEuNDU1NDA4NyAzLjcwNDIxMDMxLDEyLjI0MjgxODcgMy43MDQyMTAzMSwxMi4yNDI4MTg3IEM0LjQxNzczNTQ3LDEzLjQ5NjgwNjcgNS41NzU3MjM0NiwxMy4xMzQyNzQ4IDYuMDMyMjQxNzgsMTIuOTI0Njg4MiBDNi4xMDQwNDQ3MiwxMi4zOTQ1NDE0IDYuMzExMzcyNDQsMTIuMDMyNjg4NyA2LjU0MDE2MTQ0LDExLjgyNzg1NjIgQzQuNzYzMjM3NDQsMTEuNjIwNDQyOCAyLjg5NTMwMTE5LDEwLjkxNzExMjEgMi44OTUzMDExOSw3Ljc3NDEyNzk5IEMyLjg5NTMwMTE5LDYuODc4NTk2ODggMy4yMDc4MTYxOCw2LjE0Njg3NzU3IDMuNzE5NTc3NzMsNS41NzI0NDk5OSBDMy42MzY1MTQxNyw1LjM2NTg1MTY2IDMuMzYyNjgyNjgsNC41MzE1ODAxNyAzLjc5NzA3NzIxLDMuNDAxNzQxMzMgQzMuNzk3MDc3MjEsMy40MDE3NDEzMyA0LjQ2ODg3MTg4LDMuMTgxMjg4MjcgNS45OTc2NjUwNyw0LjI0MjUzMjY3IEM2LjYzNTgxMDQ0LDQuMDYwNzkxMzQgNy4zMjAxOTA0NCwzLjk2OTY0OTAyIDguMDAwMDY2MjUsMy45NjY1MjQ5MiBDOC42Nzk5NDIwNiwzLjk2OTY0OTAyIDkuMzY0ODUyLDQuMDYwNzkxMzQgMTAuMDA0MTg5Niw0LjI0MjUzMjY3IEMxMS41MzExMjgxLDMuMTgxMjg4MjcgMTIuMjAxOTk1NCwzLjQwMTc0MTMzIDEyLjIwMTk5NTQsMy40MDE3NDEzMyBDMTIuNjM3NDQ5OCw0LjUzMTU4MDE3IDEyLjM2MzQ4NTgsNS4zNjU4NTE2NiAxMi4yODA0MjIzLDUuNTcyNDQ5OTkgQzEyLjc5MzM3NjEsNi4xNDY4Nzc1NyAxMy4xMDM3NzE0LDYuODc4NTk2ODggMTMuMTAzNzcxNCw3Ljc3NDEyNzk5IEMxMy4xMDM3NzE0LDEwLjkyNDU4MjggMTEuMjMyMjU4MywxMS42MTgyNjk2IDkuNDUwODMwMDYsMTEuODIxMzM2MyBDOS43Mzc3NzY4NywxMi4wNzU4ODI5IDkuOTkzNDU4ODcsMTIuNTc1MDYwMiA5Ljk5MzQ1ODg3LDEzLjM0MDMyOTggQzkuOTkzNDU4ODcsMTQuNDM3ODQxMSA5Ljk4NDE4NTUsMTUuMzIxMTQ3MyA5Ljk4NDE4NTUsMTUuNTkxMzE0NCBDOS45ODQxODU1LDE1LjgwOTU5NDIgMTAuMTI4MTg4NywxNi4wNjUzNjMxIDEwLjUzMzcwMzEsMTUuOTg0ODE1NiBDMTMuNzEwNjUyLDE0Ljg5ODk4NTggMTYsMTEuODI1NDExMyAxNiw4LjIwMjUzNzczIEMxNiwzLjY3MjMxNTg1IDEyLjQxODE5OTIsMCA4LjAwMDA2NjI1LDAgWiBNMi45OTYyODQ5NiwxMS42ODQ2ODgyIEMyLjk3ODY2NTQxLDExLjcyNTQzNzMgMi45MTYxMzU5MSwxMS43Mzc2NjIxIDIuODU5MTcwNDgsMTEuNzA5NjgxIEMyLjgwMTE0NTIyLDExLjY4MjkyMjMgMi43Njg1NTU3MSwxMS42MjczNjc2IDIuNzg3MzY3NTUsMTEuNTg2NDgyNyBDMi44MDQ1ODk2NSwxMS41NDQ1MTEgMi44NjcyNTE2MiwxMS41MzI4Mjk1IDIuOTI1MTQ0MzksMTEuNTYwOTQ2NSBDMi45ODMzMDIxNCwxMS41ODc3MDUxIDMuMDE2NDIxNTcsMTEuNjQzODAzMSAyLjk5NjI4NDk2LDExLjY4NDY4ODIgWiBNMy4zODk3OTkzMiwxMi4wNDQ3MDI0IEMzLjM1MTY0NTc0LDEyLjA4MDk2OTEgMy4yNzcwNjA3NywxMi4wNjQxMjYxIDMuMjI2NDU0MjYsMTIuMDA2ODA1NyBDMy4xNzQxMjU1NSwxMS45NDk2MjEgMy4xNjQzMjIyMSwxMS44NzMxNDg0IDMuMjAzMDA1NywxMS44MzYzMzgyIEMzLjI0MjM1MTU5LDExLjgwMDA3MTUgMy4zMTQ2ODQ0NSwxMS44MTcwNTAzIDMuMzY3MTQ1NjQsMTEuODc0MjM1IEMzLjQxOTQ3NDMyLDExLjkzMjA5ODggMy40Mjk2NzUxMiwxMi4wMDgwMjgxIDMuMzg5Nzk5MzIsMTIuMDQ0NzAyNCBaIE0zLjY1OTc2NTA4LDEyLjUwNTMyODMgQzMuNjEwNzQ4MzMsMTIuNTQwMjM2OCAzLjUzMDU5OTI5LDEyLjUwNzUwMTUgMy40ODEwNTI2MSwxMi40MzQ1NjA2IEMzLjQzMjAzNTgzLDEyLjM2MTYxOTUgMy40MzIwMzU4MywxMi4yNzQxNDQ2IDMuNDgyMTEyNDQsMTIuMjM5MTAwMyBDMy41MzE3OTE1NywxMi4yMDQwNTYgMy42MTA3NDgzMywxMi4yMzU1Njg4IDMuNjYwOTU3MzgsMTIuMzA3OTY2NSBDMy43MDk4NDE2OCwxMi4zODIxMjk5IDMuNzA5ODQxNjgsMTIuNDY5NjA0OCAzLjY1OTc2NTA4LDEyLjUwNTMyODMgWiBNNC4xMTYzMzQ5NSwxMy4wMzg3OTgxIEM0LjA3MjQ4NDgyLDEzLjA4ODM3NjQgMy45NzkwODgwMiwxMy4wNzUwNjUgMy45MTA3Mjk0OCwxMy4wMDc0MjE0IEMzLjg0MDc4MTI0LDEyLjk0MTI3MTggMy44MjEzMDcwMSwxMi44NDc0MTI5IDMuODY1Mjg5NjMsMTIuNzk3ODM0NyBDMy45MDk2Njk2NiwxMi43NDgxMjA3IDQuMDAzNTk2MzksMTIuNzYyMTExMyA0LjA3MjQ4NDgyLDEyLjgyOTIxMTYgQzQuMTQxOTAzMTYsMTIuODk1MjI1MyA0LjE2MzA5OTYsMTIuOTg5NzYzNCA0LjExNjMzNDk1LDEzLjAzODc5ODEgWiBNNC43MDY0MDcxOSwxMy4yMTg4OTE2IEM0LjY4NzA2NTQ2LDEzLjI4MzEzOTUgNC41OTcxMTMwNiwxMy4zMTIzNDMgNC41MDY0OTgyNywxMy4yODUwNDExIEM0LjQxNjAxNTk3LDEzLjI1NjkyNDIgNC4zNTY3OTg0MiwxMy4xODE2NzQxIDQuMzc1MDgwMzYsMTMuMTE2NzQ3IEM0LjM5Mzg5MjE5LDEzLjA1MjA5MTcgNC40ODQyNDIwMSwxMy4wMjE2NjU2IDQuNTc1NTE5MTgsMTMuMDUwODY5MiBDNC42NjU4NjkwMSwxMy4wNzg4NTAzIDQuNzI1MjE5MDUsMTMuMTUzNTU3MSA0LjcwNjQwNzE5LDEzLjIxODg5MTYgWiBNNS4zNzc5MzQxOSwxMy4yOTUyODI1IEM1LjM4MDE4NjI5LDEzLjM2MjkyNjEgNS4zMDMzNDkxOSwxMy40MTkwMjQxIDUuMjA4MjMwMTgsMTMuNDIwMjQ2NyBDNS4xMTI1ODEyNSwxMy40MjI0MiA1LjAzNTIxNDI1LDEzLjM2NzY4MDMgNS4wMzQxNTQ0MiwxMy4zMDExMjMyIEM1LjAzNDE1NDQyLDEzLjIzMjgwMDUgNS4xMDkyNjkzLDEzLjE3NzI0NTggNS4yMDQ5MTgyMywxMy4xNzU2MTU4IEM1LjMwMDAzNzI2LDEzLjE3MzcxNDIgNS4zNzc5MzQxOSwxMy4yMjgwNDY0IDUuMzc3OTM0MTksMTMuMjk1MjgyNSBaIE02LjAzNzYzNDE5LDEzLjI2OTM1NDggQzYuMDQ5MDI3MjksMTMuMzM1MzY4NSA1Ljk4MjkyMDg4LDEzLjQwMzE0NzkgNS44ODg0NjQyNSwxMy40MjEyMTM0IEM1Ljc5NTU5NzM2LDEzLjQzODU5OTcgNS43MDk2MTkyOSwxMy4zOTc4NTA1IDUuNjk3ODI4NzcsMTMuMzMyMzgwMiBDNS42ODYzMDMyMiwxMy4yNjQ3MzY1IDUuNzUzNjAxOTEsMTMuMTk2OTU3MSA1Ljg0NjMzNjMzLDEzLjE3OTQzNSBDNS45NDA5MjU0NCwxMy4xNjI1OTIgNi4wMjU1Nzg3MiwxMy4yMDIyNTQ1IDYuMDM3NjM0MTksMTMuMjY5MzU0OCBaIi8+ICA8L2c+PC9zdmc+);\n}\n\n.providerGitLab:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxMyIgdmlld0JveD0iMCAwIDE0IDEzIj4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEgLTIpIj4gICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+ICAgIDxwYXRoIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgZD0iTTcuMDA0MDkzMzYsMTIuOTQ5MjQzMyBMNC40MjgwOTMzMyw0Ljk5NzI4MjU0IEw5LjU4MDA5MzM2LDQuOTk3MjgyNTQgTDcuMDA0MDkzMzYsMTIuOTQ5MjQzMyBaIE03LjAwNDA5MzM2LDEyLjk0OTIzIEwwLjgxNzg5MzMzMyw0Ljk5NzI2OTE3IEw0LjQyODA5MzMzLDQuOTk3MjY5MTcgTDcuMDA0MDkzMzYsMTIuOTQ5MjMgWiBNMC44MTc4OTk5OTksNC45OTcyODkyMyBMNy4wMDQwOTk5OCwxMi45NDkyNSBMMC4yMjg4MzMzMzMsOC4wMTE4ODA4IEMwLjA0MTksNy44NzU2NzE1MiAtMC4wMzYzLDcuNjM0MjEyNyAwLjAzNTEsNy40MTM4MTcxMiBMMC44MTc4OTk5OTksNC45OTcyODkyMyBaIE0wLjgxNzg5OTk5OSw0Ljk5NzI5NTkxIEwyLjM2OTM2NjY3LDAuMjA3OTA0NzE0IEMyLjQ0OTE2NjY3LC0wLjAzODUwMjM1ODggMi43OTY3NjY2NywtMC4wMzg1NjkyMjY1IDIuODc2NTY2NjcsMC4yMDc5MDQ3MTQgTDQuNDI4MSw0Ljk5NzI5NTkxIEwwLjgxNzg5OTk5OSw0Ljk5NzI5NTkxIFogTTcuMDA0MDkzMzYsMTIuOTQ5MjMgTDkuNTgwMDkzMzYsNC45OTcyNjkxNyBMMTMuMTkwMjkzMyw0Ljk5NzI2OTE3IEw3LjAwNDA5MzM2LDEyLjk0OTIzIFogTTEzLjE5MDI5MzMsNC45OTcyODkyMyBMMTMuOTczMDkzMyw3LjQxMzgxNzEyIEMxNC4wNDQ0OTMzLDcuNjM0MjEyNyAxMy45NjYyOTM0LDcuODc1NjcxNTIgMTMuNzc5MzYsOC4wMTE4ODA4IEw3LjAwNDA5MzM2LDEyLjk0OTI1IEwxMy4xOTAyOTMzLDQuOTk3Mjg5MjMgWiBNMTMuMTkwMjkzMyw0Ljk5NzI5NTkxIEw5LjU4MDA5MzM2LDQuOTk3Mjk1OTEgTDExLjEzMTYyNjcsMC4yMDc5MDQ3MTQgQzExLjIxMTQyNjcsLTAuMDM4NTY5MjI2NSAxMS41NTkwMjY3LC0wLjAzODUwMjM1ODggMTEuNjM4ODI2NywwLjIwNzkwNDcxNCBMMTMuMTkwMjkzMyw0Ljk5NzI5NTkxIFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDEgMikiLz4gIDwvZz48L3N2Zz4=);\n}\n\n.providerBitbucket:before {\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNCIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDE0IDE2Ij4gIDxnIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTEpIj4gICAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2Ii8+ICAgIDxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtcnVsZT0ibm9uemVybyIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMSkiPiAgICAgIDxwYXRoIGQ9Ik03LDIuNDk4OTQxODdlLTA3IEw3LDIuNDk4OTQxODdlLTA3IEMzLjE1NzIxMjI5LDIuNDk4OTQxODdlLTA3IDAuMDAwNjM2NTM1NDM1LDEuMDIwODQ0MjQgMC4wMDA2MzY1MzU0MzUsMi4zMTM5MTM1OSBDMC4wMDA2MzY1MzU0MzUsMi42NTQxOTUxMyAwLjgyNDA5MTAyMyw3LjQ4NjE5MiAxLjE2NzE5NzE3LDkuMzkxNzY3NTkgQzEuMzA0NDM5MzcsMTAuMjc2NDk5OSAzLjU2ODkzOTUzLDExLjUwMTUxMyA3LDExLjUwMTUxMyBMNywxMS41MDE1MTMgQzEwLjQzMTA2MDIsMTEuNTAxNTEzIDEyLjYyNjkzODYsMTAuMjc2NDk5OSAxMi44MzI4MDMyLDkuMzkxNzY3NTkgQzEzLjE3NTkwODYsNy40ODYxOTIgMTMuOTk5MzYzMiwyLjY1NDE5NTEzIDEzLjk5OTM2MzIsMi4zMTM5MTM1OSBDMTMuOTMwNzQyMSwxLjAyMDg0NDI0IDEwLjg0Mjc4NzQsMi40OTg5NDE4N2UtMDcgNywyLjQ5ODk0MTg3ZS0wNyBMNywyLjQ5ODk0MTg3ZS0wNyBaIE03LDkuOTM2MjE4MzEgQzUuNzY0ODE4MjgsOS45MzYyMTgzMSA0LjgwNDEyMTI2LDguOTgzNDI5ODYgNC44MDQxMjEyNiw3Ljc1ODQxNjcxIEM0LjgwNDEyMTI2LDYuNTMzNDAzNTUgNS43NjQ4MTgyOCw1LjU4MDYxNTk3IDcsNS41ODA2MTU5NyBDOC4yMzUxODExMiw1LjU4MDYxNTk3IDkuMTk1ODc4NCw2LjUzMzQwMzU1IDkuMTk1ODc4NCw3Ljc1ODQxNjcxIEM5LjE5NTg3ODQsOC45MTUzNzM3MiA4LjIzNTE4MTEyLDkuOTM2MjE4MzEgNyw5LjkzNjIxODMxIEw3LDkuOTM2MjE4MzEgWiBNNywyLjk5NDQ3NjY3IEM0LjUyOTYzNjIyLDIuOTk0NDc2NjcgMi41Mzk2MjExLDIuNTg2MTM4OTUgMi41Mzk2MjExLDIuMDQxNjg4ODYgQzIuNTM5NjIxMSwxLjQ5NzIzODE1IDQuNTI5NjM2MjIsMS4wODg5MDA0MyA3LDEuMDg4OTAwNDMgQzkuNDcwMzYyODQsMS4wODg5MDA0MyAxMS40NjAzNzg2LDEuNDk3MjM4MTUgMTEuNDYwMzc4NiwyLjA0MTY4ODg2IEMxMS40NjAzNzg2LDIuNTg2MTM4OTUgOS40NzAzNjI4NCwyLjk5NDQ3NjY3IDcsMi45OTQ0NzY2NyBMNywyLjk5NDQ3NjY3IFoiLz4gICAgICA8cGF0aCBkPSJNMTIuMDY0NTA5NiwxMS4yMjkyODc2IEMxMS45MjcyNjY3LDExLjIyOTI4NzYgMTEuODU4NjQ1NywxMS4yOTczNDM4IDExLjg1ODY0NTcsMTEuMjk3MzQzOCBDMTEuODU4NjQ1NywxMS4yOTczNDM4IDEwLjE0MzExNTYsMTIuNjU4NDcgNy4wNTUxNjA5MywxMi42NTg0NyBDMy45NjcyMDY4NywxMi42NTg0NyAyLjI1MTY3NjE2LDExLjI5NzM0MzggMi4yNTE2NzYxNiwxMS4yOTczNDM4IEMyLjI1MTY3NjE2LDExLjI5NzM0MzggMi4xMTQ0MzM5NSwxMS4yMjkyODc2IDIuMDQ1ODEyODUsMTEuMjI5Mjg3NiBDMS45MDg1NzAwMiwxMS4yMjkyODc2IDEuNzcxMzI3ODEsMTEuMjk3MzQzOCAxLjc3MTMyNzgxLDExLjUwMTUxMyBMMS43NzEzMjc4MSwxMS41Njk1NjkyIEMyLjA0NTgxMjg1LDEyLjk5ODc1MTYgMi4yNTE2NzYxNiwxNC4wMTk1OTU2IDIuMjUxNjc2MTYsMTQuMTU1NzA3OSBDMi40NTc1NDAwOSwxNS4xNzY1NTI1IDQuNTE2MTc2MzIsMTUuOTkzMjI4IDYuOTg2NTM5ODIsMTUuOTkzMjI4IEw2Ljk4NjUzOTgyLDE1Ljk5MzIyOCBDOS40NTY5MDMzMSwxNS45OTMyMjggMTEuNTE1NTM5NSwxNS4xNzY1NTI1IDExLjcyMTQwMzUsMTQuMTU1NzA3OSBDMTEuNzIxNDAzNSwxNC4wMTk1OTU2IDExLjkyNzI2NjcsMTIuOTk4NzUxNiAxMi4yMDE3NTE4LDExLjU2OTU2OTIgTDEyLjIwMTc1MTgsMTEuNTAxNTEzIEMxMi4yNzAzNzI5LDExLjM2NTQgMTIuMjAxNzUxOCwxMS4yMjkyODc2IDEyLjA2NDUwOTYsMTEuMjI5Mjg3NiBMMTIuMDY0NTA5NiwxMS4yMjkyODc2IFoiLz4gICAgICA8ZWxsaXBzZSBjeD0iNyIgY3k9IjcuNjkiIHJ4PSIxLjA5OCIgcnk9IjEuMDg5Ii8+ICAgIDwvZz4gIDwvZz48L3N2Zz4=);\n}\n\n.callOut {\n  display: block;\n  padding: 32px;\n  font-size: 14px;\n  font-weight: 500;\n  text-decoration: none;\n  color: #a3a9ac;\n  text-align: center;\n}\n\n.callOut:after {\n  content: " \\2665";\n  -webkit-transition: color 4s ease;\n  transition: color 4s ease;\n}\n\n.callOut:hover:after {\n  color: red;\n}\n\n.callOut .netlifyLogo {\n  display: block;\n  margin: auto;\n  width: 32px;\n  height: 32px;\n  margin-bottom: 8px;\n  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4gIDxkZWZzPiAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImEiIGN5PSIwJSIgcj0iMTAwJSIgZng9IjUwJSIgZnk9IjAlIiBncmFkaWVudFRyYW5zZm9ybT0ibWF0cml4KDAgMSAtMS4xNTE4NSAwIC41IC0uNSkiPiAgICAgIDxzdG9wIHN0b3AtY29sb3I9IiMyMEM2QjciIG9mZnNldD0iMCUiLz4gICAgICA8c3RvcCBzdG9wLWNvbG9yPSIjNEQ5QUJGIiBvZmZzZXQ9IjEwMCUiLz4gICAgPC9yYWRpYWxHcmFkaWVudD4gIDwvZGVmcz4gIDxwYXRoIGZpbGw9InVybCgjYSkiIGZpbGwtcnVsZT0iZXZlbm9kZCIgZD0iTTIyLjk4MDYyMywxMS42MjYyMzc3IEMyMi44NzE3MTA3LDExLjUwNTEzMDYgMjIuNzM1NTcwNCwxMS4zOTc0Nzk4IDIyLjU3MjIwMjEsMTEuMzE2NzQxOCBDMjIuNTU4NTg4MSwxMS4zMTY3NDE4IDIyLjU0NDk3NCwxMS4yODk4MjkxIDIyLjUzMTM2LDExLjI3NjM3MjcgTDIzLjE3MTIxOTQsNy4zNjA1NzY2MSBDMjMuMTcxMjE5NCw3LjMzMzY2MzkyIDIzLjE4NDgzMzQsNy4zMjAyMDc1OCAyMy4xOTg0NDc1LDcuMzIwMjA3NTggTDIzLjIxMjA2MTUsNy4zMjAyMDc1OCBDMjMuMjEyMDYxNSw3LjMyMDIwNzU4IDIzLjIyNTY3NTUsNy4zMjAyMDc1OCAyMy4yMzkyODk2LDcuMzMzNjYzOTIgTDI2LjE2NjMwNiwxMC4yMjY3Nzc5IEMyNi4xNzk5MiwxMC4yNDAyMzQzIDI2LjE3OTkyLDEwLjI1MzY5MDYgMjYuMTc5OTIsMTAuMjY3MTQ2OSBDMjYuMTc5OTIsMTAuMjgwNjAzMyAyNi4xNjYzMDYsMTAuMjk0MDU5NiAyNi4xNTI2OTE5LDEwLjMwNzUxNiBMMjMuMDIxNDY1MSwxMS42Mzk2OTQgTDIzLjAwNzg1MSwxMS42Mzk2OTQgQzIyLjk5NDIzNywxMS42Mzk2OTQgMjIuOTk0MjM3LDExLjYzOTY5NCAyMi45ODA2MjMsMTEuNjI2MjM3NyBaIE0xNi4zNTA1NzM2LDkuNDU5NzM4MSBDMTYuMzIzMzQ1Myw5LjE5MDYxMjc0IDE2LjIyODA0NjMsOC45MjE0ODczOCAxNi4wNzgyOTA2LDguNjkyNzMwODMgQzE2LjA2NDY3NjUsOC42NzkyNzQ1NiAxNi4wNjQ2NzY1LDguNjUyMzYyMDIgMTYuMDc4MjkwNiw4LjYyNTQ0OTQ5IEwxOS4zNTkzMDEsMy41Mzg5ODAyMiBDMTkuMzU5MzAxLDMuNTI1NTIzOTUgMTkuMzcyOTE1MSwzLjUxMjA2NzY4IDE5LjM4NjUyOTMsMy41MTIwNjc2OCBDMTkuNDAwMTQzNCwzLjUxMjA2NzY4IDE5LjQwMDE0MzQsMy41MTIwNjc2OCAxOS40MTM3NTc2LDMuNTI1NTIzOTUgTDIyLjMyNzE4NTgsNi40MTg2MjE1NSBDMjIuMzQwOCw2LjQzMjA3NzgyIDIyLjM0MDgsNi40NDU1MzQwOSAyMi4zNDA4LDYuNDU4OTkwMzUgTDIxLjU3ODQwNzYsMTEuMTgyMTQwNCBDMjEuNTc4NDA3NiwxMS4yMDkwNTI5IDIxLjU2NDc5MzQsMTEuMjIyNTA5MiAyMS41NTExNzkzLDExLjIyMjUwOTIgQzIxLjM3NDE5NTMsMTEuMjc2MzM0MyAyMS4yMTA4MjU1LDExLjM1NzA3MTkgMjEuMDc0Njg0LDExLjQ2NDcyMiBDMjEuMDc0Njg0LDExLjQ3ODE3ODMgMjEuMDYxMDY5OCwxMS40NzgxNzgzIDIxLjAzMzg0MTUsMTEuNDc4MTc4MyBMMTYuMzc3ODAxOSw5LjUwMDEwNjkgQzE2LjM2NDE4NzgsOS40ODY2NTA2MyAxNi4zNTA1NzM2LDkuNDczMTk0MzcgMTYuMzUwNTczNiw5LjQ1OTczODEgWiBNMjYuOTgzMTkwNywxMS4wMjA3NjY5IEwzMS45Nzk1Nzg4LDE1Ljk3MjY2NCBDMzIuMDA2ODA3MSwxNS45ODYxMjAyIDMyLjAwNjgwNzEsMTYuMDI2NDg4OSAzMS45Nzk1Nzg4LDE2LjAyNjQ4ODkgTDMxLjk1MjM1MDUsMTYuMDUzNDAxNCBDMzEuOTUyMzUwNSwxNi4wNjY4NTc3IDMxLjkzODczNjQsMTYuMDY2ODU3NyAzMS45MTE1MDgxLDE2LjA2Njg1NzcgTDIzLjU1MjQyODMsMTIuNTI3ODY2IEMyMy41Mzg4MTQxLDEyLjUyNzg2NiAyMy41MjUyLDEyLjUwMDk1MzUgMjMuNTI1MiwxMi40ODc0OTczIEMyMy41MjUyLDEyLjQ3NDA0MSAyMy41Mzg4MTQxLDEyLjQ2MDU4NDggMjMuNTUyNDI4MywxMi40NDcxMjg2IEwyNi45NTU5NjI0LDExLjAwNzMxMDcgQzI2Ljk1NTk2MjQsMTEuMDA3MzEwNyAyNi45Njk1NzY1LDExLjAwNzMxMDcgMjYuOTgzMTkwNywxMS4wMjA3NjY5IFogTTIzLjEzMDQzNjMsMTMuMzg5MDg4MSBMMzEuMTQ5MTg1OCwxNi43ODAwNzYxIEMzMS4xNjI4LDE2Ljc5MzUzMjQgMzEuMTYyOCwxNi44MDY5ODg3IDMxLjE2MjgsMTYuODIwNDQ1IEMzMS4xNjI4LDE2LjgzMzkwMTMgMzEuMTYyOCwxNi44NDczNTc2IDMxLjE0OTE4NTgsMTYuODYwODEzOSBMMjYuNzEwOTY0NSwyMS4yNjEwMjQ1IEMyNi43MTA5NjQ1LDIxLjI3NDQ4MDggMjYuNjk3MzUwMywyMS4yNzQ0ODA4IDI2LjY3MDEyMiwyMS4yNzQ0ODA4IEwyMS44MjM0NzU0LDIwLjI2NTI1ODIgQzIxLjc5NjI0NywyMC4yNjUyNTgyIDIxLjc4MjYzMjksMjAuMjUxODAxOSAyMS43ODI2MzI5LDIwLjIyNDg4OTMgQzIxLjc0MTc5MDMsMTkuODQ4MTEyOCAyMS41NjQ4MDYsMTkuNTExNzA1MyAyMS4yNjUyOTQyLDE5LjI4Mjk0ODEgQzIxLjI1MTY4LDE5LjI2OTQ5MTggMjEuMjUxNjgsMTkuMjU2MDM1NSAyMS4yNTE2OCwxOS4yNDI1NzkyIEwyMi4xMDkzNzMxLDEzLjk4MTE2NTMgQzIyLjEwOTM3MzEsMTMuOTU0MjUyNyAyMi4xMzY2MDE0LDEzLjk0MDc5NjQgMjIuMTUwMjE1NiwxMy45NDA3OTY0IEMyMi41MzE0MTI1LDEzLjg4Njk3MTIgMjIuODU4MTUyNywxMy42OTg1ODMgMjMuMDc1OTc5NiwxMy40MDI1NDQ0IEMyMy4wODk1OTM3LDEzLjM4OTA4ODEgMjMuMTAzMjA3OSwxMy4zODkwODgxIDIzLjEzMDQzNjMsMTMuMzg5MDg4MSBaIE0xNi4xNDYzNzksMTAuNDI4Njg1OSBMMjAuNTMwMTMxNywxMi4yODU2NTMyIEMyMC41NDM3NDU5LDEyLjI5OTEwOTUgMjAuNTU3MzYsMTIuMzEyNTY1OCAyMC41NTczNiwxMi4zMzk0NzgzIEMyMC41NDM3NDU5LDEyLjQwNjc1OTggMjAuNTMwMTMxNywxMi40ODc0OTc1IDIwLjUzMDEzMTcsMTIuNTY4MjM1MiBMMjAuNTMwMTMxNywxMi42MzU1MTY2IEwyMC41MzAxMzE3LDEyLjY4OTM0MTcgQzIwLjUzMDEzMTcsMTIuNzAyNzk4IDIwLjUxNjUxNzYsMTIuNzE2MjU0MyAyMC41MDI5MDM0LDEyLjcyOTcxMDYgQzIwLjUwMjkwMzQsMTIuNzI5NzEwNiAxMC44Nzc3MDcyLDE2LjgzMzg3NzUgMTAuODY0MDkzLDE2LjgzMzg3NzUgQzEwLjg1MDQ3ODksMTYuODMzODc3NSAxMC44MzY4NjQ3LDE2LjgzMzg3NzUgMTAuODIzMjUwNiwxNi44MjA0MjEyIEMxMC44MDk2MzY1LDE2LjgwNjk2NDkgMTAuODA5NjM2NSwxNi43ODAwNTI0IDEwLjgyMzI1MDYsMTYuNzY2NTk2MSBMMTQuNDMwOTk3NCwxMS4xODIyMzc4IEMxNC40NDQ2MTE2LDExLjE2ODc4MTUgMTQuNDU4MjI1NywxMS4xNTUzMjUzIDE0LjQ4NTQ1NCwxMS4xNTUzMjUzIEMxNC41ODA3NTMsMTEuMTY4NzgxNSAxNC42NjI0Mzc4LDExLjE4MjIzNzggMTQuNzQ0MTIyNiwxMS4xODIyMzc4IEMxNS4yODg2ODgyLDExLjE4MjIzNzggMTUuNzkyNDExMywxMC45MTMxMTIxIDE2LjA5MTkyMjQsMTAuNDU1NTk4NCBDMTYuMTA1NTM2NSwxMC40NDIxNDIyIDE2LjExOTE1MDcsMTAuNDI4Njg1OSAxNi4xNDYzNzksMTAuNDI4Njg1OSBaIE0yMS41NTExNDI5LDIxLjE4MDI0MzMgTDI1LjgxMjM3MTcsMjIuMDU0OTA1MyBDMjUuODI1OTg1OSwyMi4wNTQ5MDUzIDI1LjgzOTYsMjIuMDY4MzYxNiAyNS44Mzk2LDIyLjEwODczMDcgQzI1LjgzOTYsMjIuMTIyMTg3IDI1LjgzOTYsMjIuMTM1NjQzMyAyNS44MjU5ODU5LDIyLjE0OTA5OTcgTDE5LjkxNzQ0NDksMjguMDAyNjA3MiBDMTkuOTE3NDQ0OSwyOC4wMTYwNjM2IDE5LjkwMzgzMDcsMjguMDE2MDYzNiAxOS44OTAyMTY2LDI4LjAxNjA2MzYgTDE5Ljg2Mjk4ODMsMjguMDE2MDYzNiBDMTkuODQ5Mzc0MSwyOC4wMDI2MDcyIDE5LjgzNTc2LDI3Ljk4OTE1MDkgMTkuODM1NzYsMjcuOTYyMjM4MiBMMjAuODU2ODIxMiwyMS42OTE1ODQxIEMyMC44NTY4MjEyLDIxLjY3ODEyNzggMjAuODcwNDM1NCwyMS42NTEyMTUxIDIwLjg4NDA0OTUsMjEuNjUxMjE1MSBDMjEuMTI5MTA0MiwyMS41NTcwMjA4IDIxLjMzMzMxNjUsMjEuMzk1NTQ0NyAyMS40OTY2ODYzLDIxLjE5MzY5OTYgQzIxLjUxMDMwMDQsMjEuMTkzNjk5NiAyMS41MjM5MTQ2LDIxLjE4MDI0MzMgMjEuNTUxMTQyOSwyMS4xODAyNDMzIFogTTE5LjA0NjE2NzksMjAuNjgyNDAzIEMxOS4xNTUwODE0LDIxLjA5OTU0ODcgMTkuNDU0NTkzMywyMS40NjI4NjkyIDE5Ljg2MzAxODcsMjEuNjI0MzQ0OSBDMTkuODkwMjQ3MSwyMS42Mzc4MDEyIDE5Ljg5MDI0NzEsMjEuNjY0NzEzOSAxOS44NjMwMTg3LDIxLjY2NDcxMzkgQzE5Ljg2MzAxODcsMjEuNjY0NzEzOSAxOC42MjQxMjgzLDI5LjIxMzcwNTQgMTguNjI0MTI4MywyOS4yMjcxNjE3IEwxOC4xODg0NzQ2LDI5LjY1Nzc2MzcgQzE4LjE4ODQ3NDYsMjkuNjcxMjIwMSAxOC4xNzQ4NjA0LDI5LjY3MTIyMDEgMTguMTYxMjQ2MiwyOS42NzEyMjAxIEMxOC4xNDc2MzIsMjkuNjcxMjIwMSAxOC4xNDc2MzIsMjkuNjcxMjIwMSAxOC4xMzQwMTc4LDI5LjY1Nzc2MzcgTDEwLjk0NTczMDYsMTkuMjY5NDkwMSBDMTAuOTMyMTE2NSwxOS4yNTYwMzM4IDEwLjkzMjExNjUsMTkuMjI5MTIxMiAxMC45NDU3MzA2LDE5LjIxNTY2NDkgQzEwLjk4NjU3MzIsMTkuMTYxODM5NiAxMS4wMTM4MDE1LDE5LjEwODAxNDQgMTEuMDU0NjQ0MSwxOS4wNDA3MzI4IEMxMS4wNjgyNTgzLDE5LjAyNzI3NjUgMTEuMDgxODcyNCwxOS4wMTM4MjAyIDExLjEwOTEwMDgsMTkuMDEzODIwMiBMMTkuMDA1MzI1NCwyMC42NDIwMzQxIEMxOS4wMzI1NTM3LDIwLjY1NTQ5MDQgMTkuMDQ2MTY3OSwyMC42Njg5NDY3IDE5LjA0NjE2NzksMjAuNjgyNDAzIFogTTExLjMxMzM2NDcsMTguMDk4NzI4NiBDMTEuMjg2MTM2NSwxOC4wOTg3Mjg2IDExLjI3MjUyMjQsMTguMDg1MjcyNCAxMS4yNzI1MjI0LDE4LjA1ODM1OTggQzExLjI3MjUyMjQsMTcuOTUwNzA5NiAxMS4yNDUyOTQxLDE3Ljg1NjUxNTcgMTEuMjMxNjgsMTcuNzQ4ODY1NCBDMTEuMjMxNjgsMTcuNzIxOTUyOSAxMS4yMzE2OCwxNy43MDg0OTY2IDExLjI1ODkwODIsMTcuNjk1MDQwMyBDMTEuMjU4OTA4MiwxNy42OTUwNDAzIDIwLjkzODU0NTksMTMuNTYzOTYzNSAyMC45NTIxNiwxMy41NjM5NjM1IEMyMC45NTIxNiwxMy41NjM5NjM1IDIwLjk2NTc3NDEsMTMuNTYzOTYzNSAyMC45NzkzODgyLDEzLjU3NzQxOTcgQzIxLjA0NzQ1ODgsMTMuNjQ0NzAxMSAyMS4xMDE5MTUzLDEzLjY4NTA2OTkgMjEuMTU2MzcxOCwxMy43MjU0Mzg4IEMyMS4xODM2LDEzLjcyNTQzODggMjEuMTgzNiwxMy43NTIzNTEzIDIxLjE4MzYsMTMuNzY1ODA3NiBMMjAuMzM5NTI0NywxOC45NDY0NzQxIEMyMC4zMzk1MjQ3LDE4Ljk3MzM4NjYgMjAuMzI1OTEwNiwxOC45ODY4NDI5IDIwLjI5ODY4MjQsMTguOTg2ODQyOSBDMTkuODM1ODAyNCwxOS4wMTM3NTU0IDE5LjQyNzM3ODgsMTkuMjgyODgxIDE5LjE5NTkzODgsMTkuNjg2NTY5MyBDMTkuMTgyMzI0NywxOS43MDAwMjU1IDE5LjE2ODcxMDYsMTkuNzEzNDgxOCAxOS4xNDE0ODI0LDE5LjcxMzQ4MTggTDExLjMxMzM2NDcsMTguMDk4NzI4NiBaIE03Ljg2ODk3NzU4LDE5LjE4ODcyOTEgQzcuOTA5ODIwMywxOS4yNTYwMTExIDcuOTUwNjYzMDMsMTkuMzA5ODM2NyA3Ljk5MTUwNTc2LDE5LjM2MzY2MjMgQzguMDA1MTIsMTkuMzc3MTE4NyA4LjAwNTEyLDE5LjM5MDU3NTEgOC4wMDUxMiwxOS4zOTA1NzUxIEw2LjEzOTk2ODc5LDIyLjI4MzcwMDcgQzYuMTI2MzU0NTUsMjIuMjk3MTU3MSA2LjExMjc0MDMsMjIuMzEwNjEzNSA2LjA5OTEyNjA2LDIyLjMxMDYxMzUgQzYuMDk5MTI2MDYsMjIuMzEwNjEzNSA2LjA4NTUxMTgyLDIyLjMxMDYxMzUgNi4wNzE4OTc1OCwyMi4yOTcxNTcxIEw0LjQyNDU3NDI0LDIwLjY2ODkzMjkgQzQuNDEwOTYsMjAuNjU1NDc2NSA0LjQxMDk2LDIwLjY0MjAyMDEgNC40MTA5NiwyMC42Mjg1NjM3IEM0LjQxMDk2LDIwLjYxNTEwNzMgNC40MjQ1NzQyNCwyMC42MDE2NTA5IDQuNDM4MTg4NDgsMjAuNjAxNjUwOSBMNy44MTQ1MjA2MSwxOS4xNjE4MTYzIEw3LjgyODEzNDg1LDE5LjE2MTgxNjMgQzcuODQxNzQ5MDksMTkuMTYxODE2MyA3Ljg1NTM2MzMzLDE5LjE3NTI3MjcgNy44Njg5Nzc1OCwxOS4xODg3MjkxIFogTTEwLjE4MzMxOTEsMTkuODYxNTU3OSBDMTAuMTk2OTMzMiwxOS44NjE1NTc5IDEwLjIxMDU0NzMsMTkuODc1MDE0MiAxMC4yMjQxNjE0LDE5Ljg4ODQ3MDYgTDE3LjQzOTYyOTQsMzAuMzU3NDg3OCBDMTcuNDUzMjQzNSwzMC4zNzA5NDQxIDE3LjQ1MzI0MzUsMzAuMzk3ODU2NyAxNy40Mzk2Mjk0LDMwLjQxMTMxMzEgTDE1Ljg2MDM5NDksMzEuOTg1NzAyNSBDMTUuODYwMzk0OSwzMS45OTkxNTg5IDE1Ljg0Njc4MDgsMzEuOTk5MTU4OSAxNS44MDU5Mzg2LDMxLjk4NTcwMjUgTDYuNzkzNDEwNTcsMjMuMDY0MTYyMiBDNi43Nzk3OTY0OCwyMy4wNTA3MDU4IDYuNzc5Nzk2NDgsMjMuMDIzNzkzMiA2LjgwNzAyNDY2LDIyLjk5Njg4MDYgTDguNzY3NDUzNzEsMTkuOTU1NzUyMiBDOC43ODEwNjc4LDE5Ljk0MjI5NTggOC43OTQ2ODE4OSwxOS45Mjg4Mzk1IDguODIxOTEwMDcsMTkuOTI4ODM5NSBDOS4wMjYxMjE0MywxOS45OTYxMjExIDkuMjE2NzE4NywyMC4wMjMwMzM4IDkuNDIwOTMwMDYsMjAuMDIzMDMzOCBDOS42Nzk1OTc3OCwyMC4wMjMwMzM4IDkuOTI0NjUxNDEsMTkuOTY5MjA4NSAxMC4xODMzMTkxLDE5Ljg2MTU1NzkgWiBNOC45OTg5MTg1NiwxNi40MDMyMzIyIEM4Ljk4NTMwNDM5LDE2LjQwMzIzMjIgOC45NzE2OTAyMiwxNi4zODk3NzU5IDguOTU4MDc2MDQsMTYuMzc2MzE5NiBMNS4wOTE2NTA2MywxMC43MzgxMzg4IEM1LjA3ODAzNjQ2LDEwLjcyNDY4MjUgNS4wNzgwMzY0NiwxMC42OTc3NyA1LjA5MTY1MDYzLDEwLjY4NDMxMzcgTDguNTYzMjY1LDcuMjM5NTA2MzMgQzguNTYzMjY1LDcuMjI2MDUwMDYgOC41NzY4NzkxNyw3LjIyNjA1MDA2IDguNjA0MTA3NTIsNy4yMjYwNTAwNiBDOC42MDQxMDc1Miw3LjIzOTUwNjMzIDEyLjcwMTk3MzksOC45NjE5MTAwMiAxMy4xNjQ4NTU4LDkuMTYzNzU0MiBDMTMuMTc4NDcsOS4xNzcyMTA0OCAxMy4xOTIwODQyLDkuMTkwNjY2NzYgMTMuMTkyMDg0Miw5LjIxNzU3OTMyIEMxMy4xNjQ4NTU4LDkuMzM4Njg1ODMgMTMuMTUxMjQxNiw5LjQ1OTc5MjM0IDEzLjE1MTI0MTYsOS41ODA4OTg4NCBDMTMuMTUxMjQxNiw5Ljk5ODA0MzQ5IDEzLjMxNDYxMTcsMTAuMzg4Mjc1NiAxMy42MDA1MDk0LDEwLjY4NDMxMzcgQzEzLjYxNDEyMzUsMTAuNjk3NzcgMTMuNjE0MTIzNSwxMC43MjQ2ODI1IDEzLjYwMDUwOTQsMTAuNzM4MTM4OCBMOS45NTE5MTA3NCwxNi4zODk3NzU5IEM5LjkzODI5NjU3LDE2LjQwMzIzMjIgOS45MjQ2ODIzOSwxNi40MTY2ODg1IDkuODk3NDU0MDUsMTYuNDE2Njg4NSBDOS43NDc2OTgxMywxNi4zNzYzMTk2IDkuNTg0MzI4MDQsMTYuMzQ5NDA3MSA5LjQzNDU3MjEzLDE2LjM0OTQwNzEgQzkuMjk4NDMwMzksMTYuMzQ5NDA3MSA5LjE0ODY3NDQ4LDE2LjM3NjMxOTYgOC45OTg5MTg1NiwxNi40MDMyMzIyIFogTTEzLjY2ODYwMTksOC4zNTY0MjAzNCBDMTMuNDkxNjE4Niw4LjI3NTY4MTk4IDkuMzUyOTMzMjQsNi41MjYzNTA4MyA5LjM1MjkzMzI0LDYuNTI2MzUwODMgQzkuMzM5MzE5MTQsNi41MTI4OTQ0NCA5LjMyNTcwNTA1LDYuNTEyODk0NDQgOS4zMzkzMTkxNCw2LjQ4NTk4MTY1IEM5LjMzOTMxOTE0LDYuNDcyNTI1MjYgOS4zMzkzMTkxNCw2LjQ1OTA2ODg2IDkuMzUyOTMzMjQsNi40NDU2MTI0NyBMMTUuODMzMjQzMiwwLjAxMzQ1NjM5MzUgQzE1LjgzMzI0MzIsMCAxNS44NDY4NTczLDAgMTUuODYwNDcxNCwwIEMxNS44NzQwODU1LDAgMTUuODc0MDg1NSwwIDE1Ljg4NzY5OTYsMC4wMTM0NTYzOTM1IEwxOC42Nzg1ODk0LDIuNzcyMDE3MDUgQzE4LjY5MjIwMzUsMi43ODU0NzM0NSAxOC42OTIyMDM1LDIuODEyMzg2MjMgMTguNjc4NTg5NCwyLjgyNTg0MjYzIEwxNS4zMTU5MDc2LDguMDMzNDY2OSBDMTUuMzAyMjkzNSw4LjA0NjkyMzI5IDE1LjI4ODY3OTQsOC4wNjAzNzk2OSAxNS4yNjE0NTEyLDguMDYwMzc5NjkgQzE1LjA4NDQ2NzksOC4wMDY1NTQxMSAxNC45MDc0ODQ3LDcuOTc5NjQxMzMgMTQuNzMwNTAxNCw3Ljk3OTY0MTMzIEMxNC4zNjI5MjA4LDcuOTc5NjQxMzMgMTMuOTk1MzQwMiw4LjExNDIwNTI2IDEzLjcwOTQ0NDIsOC4zNDI5NjM5NSBDMTMuNjk1ODMwMSw4LjM1NjQyMDM0IDEzLjY5NTgzMDEsOC4zNTY0MjAzNCAxMy42Njg2MDE5LDguMzU2NDIwMzQgWiBNNy43ODcyODk5NSwxNy4zMzE3NTExIEM3Ljc3MzY3NTgxLDE3LjM0NTIwNzQgNy43NjAwNjE2NywxNy4zNTg2NjM3IDcuNzQ2NDQ3NTIsMTcuMzU4NjYzNyBMMC4wNDA4NDI0Mjk4LDE1Ljc0MzkwOCBDMC4wMTM2MTQxNDMzLDE1Ljc0MzkwOCAwLDE1LjczMDQ1MTcgMCwxNS43MTY5OTU0IEMwLDE1LjcwMzUzOTEgMCwxNS42OTAwODI4IDAuMDEzNjE0MTQzMywxNS42NzY2MjY1IEw0LjMxNTY4MzQyLDExLjQyNDQzNjMgQzQuMzE1NjgzNDIsMTEuNDEwOTgwMSA0LjMyOTI5NzU2LDExLjQxMDk4MDEgNC4zNDI5MTE3MSwxMS40MTA5ODAxIEM0LjM3MDEzOTk5LDExLjQyNDQzNjMgNC4zNzAxMzk5OSwxMS40MjQ0MzYzIDQuMzgzNzU0MTMsMTEuNDM3ODkyNiBDNC4zODM3NTQxMywxMS40NTEzNDg5IDguMDczMTg2OTYsMTYuNzgwMDQyOSA4LjExNDAyOTM5LDE2LjgzMzg2ODEgQzguMTI3NjQzNTQsMTYuODQ3MzI0NCA4LjEyNzY0MzU0LDE2Ljg3NDIzNyA4LjExNDAyOTM5LDE2Ljg4NzY5MzMgQzcuOTkxNTAyMSwxNy4wMjIyNTYzIDcuODY4OTc0ODEsMTcuMTcwMjc1NSA3Ljc4NzI4OTk1LDE3LjMzMTc1MTEgWiBNNy4zNTE1NTc4MywxOC4yNDY3NDY0IEM3LjM3ODc4NTk0LDE4LjI0Njc0NjQgNy4zOTI0LDE4LjI2MDIwMjcgNy4zOTI0LDE4LjI4NzExNTEgQzcuMzkyNCwxOC4zMDA1NzEzIDcuMzc4Nzg1OTQsMTguMzE0MDI3NSA3LjM1MTU1NzgzLDE4LjM0MDkzOTkgTDMuNjM0OTIsMTkuOTE1MzE2NSBDMy42MzQ5MiwxOS45MTUzMTY1IDMuNjIxMzA1OTQsMTkuOTE1MzE2NSAzLjYwNzY5MTg4LDE5LjkwMTg2MDMgTDAuNjI2MjEzMTg1LDE2Ljk0MTQ5NDEgQzAuNjEyNTk5MTI3LDE2LjkyODAzNzggMC41OTg5ODUwNjksMTYuOTAxMTI1NCAwLjYxMjU5OTEyNywxNi44ODc2NjkyIEMwLjYyNjIxMzE4NSwxNi44NzQyMTMgMC42Mzk4MjcyNDMsMTYuODYwNzU2OCAwLjY2NzA1NTM1OSwxNi44NjA3NTY4IEw3LjM1MTU1NzgzLDE4LjI0Njc0NjQgWiIvPjwvc3ZnPg==);\n}\n\n.visuallyHidden {\n  border: 0;\n  clip: rect(0 0 0 0);\n  height: 1px;\n  margin: -1px;\n  overflow: hidden;\n  padding: 0;\n  position: absolute;\n  width: 1px;\n  #fff-space: nowrap;\n}\n',""]);},function(e){function t(e,t){var r=e[1]||"",o=e[3];if(!o)return r;if(t&&"function"==typeof btoa){var i=n(o);return [r].concat(o.sources.map(function(e){return "/*# sourceURL="+o.sourceRoot+e+" */"})).concat([i]).join("\n")}return ""+r}function n(e){return "/*# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(unescape(encodeURIComponent(JSON.stringify(e))))+" */"}e.exports=function(e){var n=[];return n.toString=function(){return this.map(function(n){var r=t(n,e);return n[2]?"@media "+n[2]+"{"+r+"}":r}).join("")},n.i=function(e,t){"string"==typeof e&&(e=[[null,e,""]]);for(var r={},o=0;this.length>o;o++){var i=this[o][0];"number"==typeof i&&(r[i]=!0);}for(o=0;e.length>o;o++){var a=e[o];"number"==typeof a[0]&&r[a[0]]||(t&&!a[2]?a[2]=t:t&&(a[2]="("+a[2]+") and ("+t+")"),n.push(a));}},n};}]).default});

});

var netlifyIdentity$1 = unwrapExports(netlifyIdentity);
var netlifyIdentity_1 = netlifyIdentity.netlifyIdentity;

/* src/components/Nav.svelte generated by Svelte v3.0.0-beta.28 */

const css$3 = {
	code: "nav.svelte-pe774b{border-bottom:1px solid rgba(170,30,30,0.1);font-weight:300;padding:0 1em;display:flex;flex-direction:row;justify-content:space-between;align-items:center}ul.svelte-pe774b{margin:0;padding:0}ul.svelte-pe774b::after{content:'';display:block;clear:both}li.svelte-pe774b{display:block;float:left}.selected.svelte-pe774b{position:relative;display:inline-block}.selected.svelte-pe774b::after{position:absolute;content:'';width:calc(100% - 1em);height:2px;background-color:rgb(170,30,30);display:block;bottom:-1px}a.svelte-pe774b{text-decoration:none;padding:1em 0.5em;display:block}",
	map: "{\"version\":3,\"file\":\"Nav.svelte\",\"sources\":[\"Nav.svelte\"],\"sourcesContent\":[\"<script>\\n\\texport let segment;\\n\\texport let isAdmin;\\n</script>\\n\\n<nav>\\n\\t<ul>\\n\\t\\t<li><a class:selected='{segment === undefined}' href='.'>home</a></li>\\n\\t\\t<li><a class:selected='{segment === \\\"about\\\"}' href='about'>about</a></li>\\n\\n\\t\\t<!-- for the blog link, we're using rel=prefetch so that Sapper prefetches\\n\\t\\t     the blog data when we hover over the link or tap it on a touchscreen -->\\n\\t\\t<li><a rel=prefetch class:selected='{segment === \\\"blog\\\"}' href='blog'>blog</a></li>\\n\\n\\t\\t{#if isAdmin}\\n\\t\\t<li><a rel=prefetch href='admin/#/' class:selected='{segment === \\\"admin\\\"}'>admin</a></li>\\n\\t\\t{/if}\\n\\t</ul>\\n\\n\\t<div data-netlify-identity-button></div>\\n</nav>\\n\\n<style>\\n\\tnav {\\n\\t\\tborder-bottom: 1px solid rgba(170,30,30,0.1);\\n\\t\\tfont-weight: 300;\\n\\t\\tpadding: 0 1em;\\n\\t\\tdisplay: flex;\\n\\t\\tflex-direction: row;\\n\\t\\tjustify-content: space-between;\\n\\t\\talign-items: center;\\n\\t}\\n\\n\\tul {\\n\\t\\tmargin: 0;\\n\\t\\tpadding: 0;\\n\\t}\\n\\n\\t/* clearfix */\\n\\tul::after {\\n\\t\\tcontent: '';\\n\\t\\tdisplay: block;\\n\\t\\tclear: both;\\n\\t}\\n\\n\\tli {\\n\\t\\tdisplay: block;\\n\\t\\tfloat: left;\\n\\t}\\n\\n\\t.selected {\\n\\t\\tposition: relative;\\n\\t\\tdisplay: inline-block;\\n\\t}\\n\\n\\t.selected::after {\\n\\t\\tposition: absolute;\\n\\t\\tcontent: '';\\n\\t\\twidth: calc(100% - 1em);\\n\\t\\theight: 2px;\\n\\t\\tbackground-color: rgb(170,30,30);\\n\\t\\tdisplay: block;\\n\\t\\tbottom: -1px;\\n\\t}\\n\\n\\ta {\\n\\t\\ttext-decoration: none;\\n\\t\\tpadding: 1em 0.5em;\\n\\t\\tdisplay: block;\\n\\t}\\n</style>\"],\"names\":[],\"mappings\":\"AAuBC,GAAG,cAAC,CAAC,AACJ,aAAa,CAAE,GAAG,CAAC,KAAK,CAAC,KAAK,GAAG,CAAC,EAAE,CAAC,EAAE,CAAC,GAAG,CAAC,CAC5C,WAAW,CAAE,GAAG,CAChB,OAAO,CAAE,CAAC,CAAC,GAAG,CACd,OAAO,CAAE,IAAI,CACb,cAAc,CAAE,GAAG,CACnB,eAAe,CAAE,aAAa,CAC9B,WAAW,CAAE,MAAM,AACpB,CAAC,AAED,EAAE,cAAC,CAAC,AACH,MAAM,CAAE,CAAC,CACT,OAAO,CAAE,CAAC,AACX,CAAC,AAGD,gBAAE,OAAO,AAAC,CAAC,AACV,OAAO,CAAE,EAAE,CACX,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,EAAE,cAAC,CAAC,AACH,OAAO,CAAE,KAAK,CACd,KAAK,CAAE,IAAI,AACZ,CAAC,AAED,SAAS,cAAC,CAAC,AACV,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,YAAY,AACtB,CAAC,AAED,uBAAS,OAAO,AAAC,CAAC,AACjB,QAAQ,CAAE,QAAQ,CAClB,OAAO,CAAE,EAAE,CACX,KAAK,CAAE,KAAK,IAAI,CAAC,CAAC,CAAC,GAAG,CAAC,CACvB,MAAM,CAAE,GAAG,CACX,gBAAgB,CAAE,IAAI,GAAG,CAAC,EAAE,CAAC,EAAE,CAAC,CAChC,OAAO,CAAE,KAAK,CACd,MAAM,CAAE,IAAI,AACb,CAAC,AAED,CAAC,cAAC,CAAC,AACF,eAAe,CAAE,IAAI,CACrB,OAAO,CAAE,GAAG,CAAC,KAAK,CAClB,OAAO,CAAE,KAAK,AACf,CAAC\"}"
};

const Nav = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { segment, isAdmin } = $$props;

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);
	if ($$props.isAdmin === void 0 && $$bindings.isAdmin && isAdmin !== void 0) $$bindings.isAdmin(isAdmin);

	$$result.css.add(css$3);

	return `<nav class="svelte-pe774b">
		<ul class="svelte-pe774b">
			<li class="svelte-pe774b"><a href="." class="${[`svelte-pe774b`, segment === undefined ? "selected" : ""].join(' ').trim() }">home</a></li>
			<li class="svelte-pe774b"><a href="about" class="${[`svelte-pe774b`, segment === "about" ? "selected" : ""].join(' ').trim() }">about</a></li>


			<li class="svelte-pe774b"><a rel="prefetch" href="blog" class="${[`svelte-pe774b`, segment === "blog" ? "selected" : ""].join(' ').trim() }">blog</a></li>

			${ isAdmin ? `<li class="svelte-pe774b"><a rel="prefetch" href="admin/#/" class="${[`svelte-pe774b`, segment === "admin" ? "selected" : ""].join(' ').trim() }">admin</a></li>` : `` }
		</ul>

		<div data-netlify-identity-button></div>
	</nav>`;
});

/* src/routes/_layout.svelte generated by Svelte v3.0.0-beta.28 */

const css$4 = {
	code: "nav+main.svelte-1w0ypdc{position:relative;max-width:56em;background-color:white;padding:2em;margin:0 auto;box-sizing:border-box}",
	map: "{\"version\":3,\"file\":\"_layout.svelte\",\"sources\":[\"_layout.svelte\"],\"sourcesContent\":[\"<svelte:head>\\n\\t<script src=\\\"https://identity.netlify.com/v1/netlify-identity-widget.js\\\"></script>\\n</svelte:head>\\n\\n<script>\\n\\timport netlifyIdentity from 'netlify-identity-widget';\\n\\timport { onMount } from 'svelte';\\n\\timport Nav from '../components/Nav.svelte';\\n\\n\\texport let segment;\\n\\n\\tlet currentUser;\\n\\n\\tonMount(() => {\\n\\t\\tcurrentUser = netlifyIdentity.currentUser();\\n\\n\\t\\tnetlify.on('login', user => currentUser = user);\\n\\t\\tnetlify.on('logout', () => currentUser = undefined);\\n\\t});\\n</script>\\n\\n<style>\\n\\tnav + main {\\n\\t\\tposition: relative;\\n\\t\\tmax-width: 56em;\\n\\t\\tbackground-color: white;\\n\\t\\tpadding: 2em;\\n\\t\\tmargin: 0 auto;\\n\\t\\tbox-sizing: border-box;\\n\\t}\\n</style>\\n\\n{#if segment !== 'admin'}\\n<Nav {segment} isAdmin={currentUser && currentUser.admin}/>\\n{/if}\\n\\n<main>\\n\\t<slot></slot>\\n</main>\"],\"names\":[],\"mappings\":\"AAsBC,GAAG,CAAG,IAAI,eAAC,CAAC,AACX,QAAQ,CAAE,QAAQ,CAClB,SAAS,CAAE,IAAI,CACf,gBAAgB,CAAE,KAAK,CACvB,OAAO,CAAE,GAAG,CACZ,MAAM,CAAE,CAAC,CAAC,IAAI,CACd,UAAU,CAAE,UAAU,AACvB,CAAC\"}"
};

const Layout = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	

	let { segment } = $$props;

	let currentUser;

	onMount(() => {
		currentUser = netlifyIdentity$1.currentUser();

		netlify.on('login', user => currentUser = user);
		netlify.on('logout', () => currentUser = undefined);
	});

	if ($$props.segment === void 0 && $$bindings.segment && segment !== void 0) $$bindings.segment(segment);

	$$result.css.add(css$4);

	return `${($$result.head += `<script src="https://identity.netlify.com/v1/netlify-identity-widget.js"></script>`, "")}





	${ segment !== 'admin' ? `${validate_component(Nav, 'Nav').$$render($$result, {
		segment: segment,
		isAdmin: currentUser && currentUser.admin
	}, {}, {})}` : `` }

	<main class="svelte-1w0ypdc">
		${$$slots.default ? $$slots.default() : ``}
	</main>`;
});

/* src/routes/_error.svelte generated by Svelte v3.0.0-beta.28 */

const css$5 = {
	code: "h1.svelte-8od9u6,p.svelte-8od9u6{margin:0 auto}h1.svelte-8od9u6{font-size:2.8em;font-weight:700;margin:0 0 0.5em 0}p.svelte-8od9u6{margin:1em auto}@media(min-width: 480px){h1.svelte-8od9u6{font-size:4em}}",
	map: "{\"version\":3,\"file\":\"_error.svelte\",\"sources\":[\"_error.svelte\"],\"sourcesContent\":[\"<script>\\n\\texport let status;\\n\\texport let error;\\n\\n\\tconst dev = undefined === 'development';\\n</script>\\n\\n<style>\\n\\th1, p {\\n\\t\\tmargin: 0 auto;\\n\\t}\\n\\n\\th1 {\\n\\t\\tfont-size: 2.8em;\\n\\t\\tfont-weight: 700;\\n\\t\\tmargin: 0 0 0.5em 0;\\n\\t}\\n\\n\\tp {\\n\\t\\tmargin: 1em auto;\\n\\t}\\n\\n\\t@media (min-width: 480px) {\\n\\t\\th1 {\\n\\t\\t\\tfont-size: 4em;\\n\\t\\t}\\n\\t}\\n</style>\\n\\n<svelte:head>\\n\\t<title>{status}</title>\\n</svelte:head>\\n\\n<h1>{status}</h1>\\n\\n<p>{error.message}</p>\\n\\n{#if dev && error.stack}\\n\\t<pre>{error.stack}</pre>\\n{/if}\\n\"],\"names\":[],\"mappings\":\"AAQC,gBAAE,CAAE,CAAC,cAAC,CAAC,AACN,MAAM,CAAE,CAAC,CAAC,IAAI,AACf,CAAC,AAED,EAAE,cAAC,CAAC,AACH,SAAS,CAAE,KAAK,CAChB,WAAW,CAAE,GAAG,CAChB,MAAM,CAAE,CAAC,CAAC,CAAC,CAAC,KAAK,CAAC,CAAC,AACpB,CAAC,AAED,CAAC,cAAC,CAAC,AACF,MAAM,CAAE,GAAG,CAAC,IAAI,AACjB,CAAC,AAED,MAAM,AAAC,YAAY,KAAK,CAAC,AAAC,CAAC,AAC1B,EAAE,cAAC,CAAC,AACH,SAAS,CAAE,GAAG,AACf,CAAC,AACF,CAAC\"}"
};

const Error$1 = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	let { status, error } = $$props;

	if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
	if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);

	$$result.css.add(css$5);

	return `${($$result.head += `<title>${escape$1(status)}</title>`, "")}

	<h1 class="svelte-8od9u6">${escape$1(status)}</h1>

	<p class="svelte-8od9u6">${escape$1(error.message)}</p>

	${ `` }`;
});

// This file is generated by Sapper — do not edit it!

const d = decodeURIComponent;

const manifest = {
	server_routes: [
		{
			// blog/index.json.js
			pattern: /^\/blog.json$/,
			handlers: route_0,
			params: () => ({})
		},

		{
			// blog/[slug].json.js
			pattern: /^\/blog\/([^\/]+?).json$/,
			handlers: route_1,
			params: match => ({ slug: d(match[1]) })
		}
	],

	pages: [
		{
			// index.svelte
			pattern: /^\/?$/,
			parts: [
				{ name: "index", file: "index.svelte", component: Index }
			]
		},

		{
			// about.svelte
			pattern: /^\/about\/?$/,
			parts: [
				{ name: "about", file: "about.svelte", component: About }
			]
		},

		{
			// admin.svelte
			pattern: /^\/admin\/?$/,
			parts: [
				{ name: "admin", file: "admin.svelte", component: Admin }
			]
		},

		{
			// blog/index.svelte
			pattern: /^\/blog\/?$/,
			parts: [
				{ name: "blog", file: "blog/index.svelte", component: Index$1, preload: preload }
			]
		},

		{
			// blog/[slug].svelte
			pattern: /^\/blog\/([^\/]+?)\/?$/,
			parts: [
				null,
				{ name: "blog_$slug", file: "blog/[slug].svelte", component: Slug, preload: preload$1, params: match => ({ slug: d(match[1]) }) }
			]
		}
	],

	root: Layout,
	root_preload: () => {},
	error: Error$1
};

const build_dir = "__sapper__/build";

function writable(value, start = noop) {
	let stop;
	const subscribers = [];

	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (!stop) return; // not ready
			subscribers.forEach(s => s[1]());
			subscribers.forEach(s => s[0](value));
		}
	}

	function update(fn) {
		set(fn(value));
	}

	function subscribe(run, invalidate = noop) {
		const subscriber = [run, invalidate];
		subscribers.push(subscriber);
		if (subscribers.length === 1) stop = start(set) || noop;
		run(value);

		return () => {
			const index = subscribers.indexOf(subscriber);
			if (index !== -1) subscribers.splice(index, 1);
			if (subscribers.length === 0) stop();
		};
	}

	return { set, update, subscribe };
}

const stores = {
	preloading: writable(false),
	page: writable(null)
};

const CONTEXT_KEY = {};

/* src/node_modules/@sapper/internal/App.svelte generated by Svelte v3.0.0-beta.28 */

const App = create_ssr_component(($$result, $$props, $$bindings, $$slots) => {
	

	let { session, error, status, segments, level0, level1 = null } = $$props;

	setContext(CONTEXT_KEY, session);

	if ($$props.session === void 0 && $$bindings.session && session !== void 0) $$bindings.session(session);
	if ($$props.error === void 0 && $$bindings.error && error !== void 0) $$bindings.error(error);
	if ($$props.status === void 0 && $$bindings.status && status !== void 0) $$bindings.status(status);
	if ($$props.segments === void 0 && $$bindings.segments && segments !== void 0) $$bindings.segments(segments);
	if ($$props.level0 === void 0 && $$bindings.level0 && level0 !== void 0) $$bindings.level0(level0);
	if ($$props.level1 === void 0 && $$bindings.level1 && level1 !== void 0) $$bindings.level1(level1);

	return `


	${validate_component(Layout, 'Layout').$$render($$result, Object.assign({ segment: segments[0] }, level0.props), {}, {
		default: () => `
		${ error ? `${validate_component(Error$1, 'Error').$$render($$result, { error: error, status: status }, {}, {})}` : `${validate_component(((level1.component) || missing_component), 'svelte:component').$$render($$result, Object.assign(level1.props), {}, {})}` }
	`
	})}`;
});

const IGNORE = '__SAPPER__IGNORE__';

function get_server_route_handler(routes) {
	async function handle_route(route, req, res, next) {
		req.params = route.params(route.pattern.exec(req.path));

		const method = req.method.toLowerCase();
		// 'delete' cannot be exported from a module because it is a keyword,
		// so check for 'del' instead
		const method_export = method === 'delete' ? 'del' : method;
		const handle_method = route.handlers[method_export];
		if (handle_method) {
			if (process.env.SAPPER_EXPORT) {
				const { write, end, setHeader } = res;
				const chunks = [];
				const headers = {};

				// intercept data so that it can be exported
				res.write = function(chunk) {
					chunks.push(Buffer.from(chunk));
					write.apply(res, arguments);
				};

				res.setHeader = function(name, value) {
					headers[name.toLowerCase()] = value;
					setHeader.apply(res, arguments);
				};

				res.end = function(chunk) {
					if (chunk) chunks.push(Buffer.from(chunk));
					end.apply(res, arguments);

					process.send({
						__sapper__: true,
						event: 'file',
						url: req.url,
						method: req.method,
						status: res.statusCode,
						type: headers['content-type'],
						body: Buffer.concat(chunks).toString()
					});
				};
			}

			const handle_next = (err) => {
				if (err) {
					res.statusCode = 500;
					res.end(err.message);
				} else {
					process.nextTick(next);
				}
			};

			try {
				await handle_method(req, res, handle_next);
			} catch (err) {
				handle_next(err);
			}
		} else {
			// no matching handler for method
			process.nextTick(next);
		}
	}

	return function find_route(req, res, next) {
		if (req[IGNORE]) return next();

		for (const route of routes) {
			if (route.pattern.test(req.path)) {
				handle_route(route, req, res, next);
				return;
			}
		}

		next();
	};
}

/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module exports.
 * @public
 */

var parse_1 = parse;
var serialize_1 = serialize;

/**
 * Module variables.
 * @private
 */

var decode = decodeURIComponent;
var encode = encodeURIComponent;
var pairSplitRegExp = /; */;

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

function parse(str, options) {
  if (typeof str !== 'string') {
    throw new TypeError('argument str must be a string');
  }

  var obj = {};
  var opt = options || {};
  var pairs = str.split(pairSplitRegExp);
  var dec = opt.decode || decode;

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i];
    var eq_idx = pair.indexOf('=');

    // skip things that don't look like key=value
    if (eq_idx < 0) {
      continue;
    }

    var key = pair.substr(0, eq_idx).trim();
    var val = pair.substr(++eq_idx, pair.length).trim();

    // quoted values
    if ('"' == val[0]) {
      val = val.slice(1, -1);
    }

    // only assign once
    if (undefined == obj[key]) {
      obj[key] = tryDecode(val, dec);
    }
  }

  return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

function serialize(name, val, options) {
  var opt = options || {};
  var enc = opt.encode || encode;

  if (typeof enc !== 'function') {
    throw new TypeError('option encode is invalid');
  }

  if (!fieldContentRegExp.test(name)) {
    throw new TypeError('argument name is invalid');
  }

  var value = enc(val);

  if (value && !fieldContentRegExp.test(value)) {
    throw new TypeError('argument val is invalid');
  }

  var str = name + '=' + value;

  if (null != opt.maxAge) {
    var maxAge = opt.maxAge - 0;
    if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
    str += '; Max-Age=' + Math.floor(maxAge);
  }

  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError('option domain is invalid');
    }

    str += '; Domain=' + opt.domain;
  }

  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError('option path is invalid');
    }

    str += '; Path=' + opt.path;
  }

  if (opt.expires) {
    if (typeof opt.expires.toUTCString !== 'function') {
      throw new TypeError('option expires is invalid');
    }

    str += '; Expires=' + opt.expires.toUTCString();
  }

  if (opt.httpOnly) {
    str += '; HttpOnly';
  }

  if (opt.secure) {
    str += '; Secure';
  }

  if (opt.sameSite) {
    var sameSite = typeof opt.sameSite === 'string'
      ? opt.sameSite.toLowerCase() : opt.sameSite;

    switch (sameSite) {
      case true:
        str += '; SameSite=Strict';
        break;
      case 'lax':
        str += '; SameSite=Lax';
        break;
      case 'strict':
        str += '; SameSite=Strict';
        break;
      default:
        throw new TypeError('option sameSite is invalid');
    }
  }

  return str;
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

function tryDecode(str, decode) {
  try {
    return decode(str);
  } catch (e) {
    return str;
  }
}

var cookie = {
	parse: parse_1,
	serialize: serialize_1
};

var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';
var reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
var escaped$1 = {
    '<': '\\u003C',
    '>': '\\u003E',
    '/': '\\u002F',
    '\\': '\\\\',
    '\b': '\\b',
    '\f': '\\f',
    '\n': '\\n',
    '\r': '\\r',
    '\t': '\\t',
    '\0': '\\0',
    '\u2028': '\\u2028',
    '\u2029': '\\u2029'
};
var objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join('\0');
function devalue(value) {
    var counts = new Map();
    function walk(thing) {
        if (typeof thing === 'function') {
            throw new Error("Cannot stringify a function");
        }
        if (counts.has(thing)) {
            counts.set(thing, counts.get(thing) + 1);
            return;
        }
        counts.set(thing, 1);
        if (!isPrimitive(thing)) {
            var type = getType(thing);
            switch (type) {
                case 'Number':
                case 'String':
                case 'Boolean':
                case 'Date':
                case 'RegExp':
                    return;
                case 'Array':
                    thing.forEach(walk);
                    break;
                case 'Set':
                case 'Map':
                    Array.from(thing).forEach(walk);
                    break;
                default:
                    var proto = Object.getPrototypeOf(thing);
                    if (proto !== Object.prototype &&
                        proto !== null &&
                        Object.getOwnPropertyNames(proto).sort().join('\0') !== objectProtoOwnPropertyNames) {
                        throw new Error("Cannot stringify arbitrary non-POJOs");
                    }
                    if (Object.getOwnPropertySymbols(thing).length > 0) {
                        throw new Error("Cannot stringify POJOs with symbolic keys");
                    }
                    Object.keys(thing).forEach(function (key) { return walk(thing[key]); });
            }
        }
    }
    walk(value);
    var names = new Map();
    Array.from(counts)
        .filter(function (entry) { return entry[1] > 1; })
        .sort(function (a, b) { return b[1] - a[1]; })
        .forEach(function (entry, i) {
        names.set(entry[0], getName(i));
    });
    function stringify(thing) {
        if (names.has(thing)) {
            return names.get(thing);
        }
        if (isPrimitive(thing)) {
            return stringifyPrimitive(thing);
        }
        var type = getType(thing);
        switch (type) {
            case 'Number':
            case 'String':
            case 'Boolean':
                return "Object(" + stringify(thing.valueOf()) + ")";
            case 'RegExp':
                return thing.toString();
            case 'Date':
                return "new Date(" + thing.getTime() + ")";
            case 'Array':
                var members = thing.map(function (v, i) { return i in thing ? stringify(v) : ''; });
                var tail = thing.length === 0 || (thing.length - 1 in thing) ? '' : ',';
                return "[" + members.join(',') + tail + "]";
            case 'Set':
            case 'Map':
                return "new " + type + "([" + Array.from(thing).map(stringify).join(',') + "])";
            default:
                var obj = "{" + Object.keys(thing).map(function (key) { return safeKey(key) + ":" + stringify(thing[key]); }).join(',') + "}";
                var proto = Object.getPrototypeOf(thing);
                if (proto === null) {
                    return Object.keys(thing).length > 0
                        ? "Object.assign(Object.create(null)," + obj + ")"
                        : "Object.create(null)";
                }
                return obj;
        }
    }
    var str = stringify(value);
    if (names.size) {
        var params_1 = [];
        var statements_1 = [];
        var values_1 = [];
        names.forEach(function (name, thing) {
            params_1.push(name);
            if (isPrimitive(thing)) {
                values_1.push(stringifyPrimitive(thing));
                return;
            }
            var type = getType(thing);
            switch (type) {
                case 'Number':
                case 'String':
                case 'Boolean':
                    values_1.push("Object(" + stringify(thing.valueOf()) + ")");
                    break;
                case 'RegExp':
                    values_1.push(thing.toString());
                    break;
                case 'Date':
                    values_1.push("new Date(" + thing.getTime() + ")");
                    break;
                case 'Array':
                    values_1.push("Array(" + thing.length + ")");
                    thing.forEach(function (v, i) {
                        statements_1.push(name + "[" + i + "]=" + stringify(v));
                    });
                    break;
                case 'Set':
                    values_1.push("new Set");
                    statements_1.push(name + "." + Array.from(thing).map(function (v) { return "add(" + stringify(v) + ")"; }).join('.'));
                    break;
                case 'Map':
                    values_1.push("new Map");
                    statements_1.push(name + "." + Array.from(thing).map(function (_a) {
                        var k = _a[0], v = _a[1];
                        return "set(" + stringify(k) + ", " + stringify(v) + ")";
                    }).join('.'));
                    break;
                default:
                    values_1.push(Object.getPrototypeOf(thing) === null ? 'Object.create(null)' : '{}');
                    Object.keys(thing).forEach(function (key) {
                        statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
                    });
            }
        });
        statements_1.push("return " + str);
        return "(function(" + params_1.join(',') + "){" + statements_1.join(';') + "}(" + values_1.join(',') + "))";
    }
    else {
        return str;
    }
}
function getName(num) {
    var name = '';
    do {
        name = chars[num % chars.length] + name;
        num = ~~(num / chars.length) - 1;
    } while (num >= 0);
    return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
    return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
    if (typeof thing === 'string')
        return stringifyString(thing);
    if (thing === void 0)
        return 'void 0';
    if (thing === 0 && 1 / thing < 0)
        return '-0';
    var str = String(thing);
    if (typeof thing === 'number')
        return str.replace(/^(-)?0\./, '$1.');
    return str;
}
function getType(thing) {
    return Object.prototype.toString.call(thing).slice(8, -1);
}
function safeKey(key) {
    return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : JSON.stringify(key);
}
function safeProp(key) {
    return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + JSON.stringify(key) + "]";
}
function stringifyString(str) {
    var result = '"';
    for (var i = 0; i < str.length; i += 1) {
        var char = str.charAt(i);
        var code = char.charCodeAt(0);
        if (char === '"') {
            result += '\\"';
        }
        else if (char in escaped$1) {
            result += escaped$1[char];
        }
        else if (code >= 0xd800 && code <= 0xdfff) {
            var next = str.charCodeAt(i + 1);
            // If this is the beginning of a [high, low] surrogate pair,
            // add the next two characters, otherwise escape
            if (code <= 0xdbff && (next >= 0xdc00 && next <= 0xdfff)) {
                result += char + str[++i];
            }
            else {
                result += "\\u" + code.toString(16).toUpperCase();
            }
        }
        else {
            result += char;
        }
    }
    result += '"';
    return result;
}

// Based on https://github.com/tmpvar/jsdom/blob/aa85b2abf07766ff7bf5c1f6daafb3726f2f2db5/lib/jsdom/living/blob.js
// (MIT licensed)

const BUFFER = Symbol('buffer');
const TYPE = Symbol('type');

class Blob {
	constructor() {
		this[TYPE] = '';

		const blobParts = arguments[0];
		const options = arguments[1];

		const buffers = [];

		if (blobParts) {
			const a = blobParts;
			const length = Number(a.length);
			for (let i = 0; i < length; i++) {
				const element = a[i];
				let buffer;
				if (element instanceof Buffer) {
					buffer = element;
				} else if (ArrayBuffer.isView(element)) {
					buffer = Buffer.from(element.buffer, element.byteOffset, element.byteLength);
				} else if (element instanceof ArrayBuffer) {
					buffer = Buffer.from(element);
				} else if (element instanceof Blob) {
					buffer = element[BUFFER];
				} else {
					buffer = Buffer.from(typeof element === 'string' ? element : String(element));
				}
				buffers.push(buffer);
			}
		}

		this[BUFFER] = Buffer.concat(buffers);

		let type = options && options.type !== undefined && String(options.type).toLowerCase();
		if (type && !/[^\u0020-\u007E]/.test(type)) {
			this[TYPE] = type;
		}
	}
	get size() {
		return this[BUFFER].length;
	}
	get type() {
		return this[TYPE];
	}
	slice() {
		const size = this.size;

		const start = arguments[0];
		const end = arguments[1];
		let relativeStart, relativeEnd;
		if (start === undefined) {
			relativeStart = 0;
		} else if (start < 0) {
			relativeStart = Math.max(size + start, 0);
		} else {
			relativeStart = Math.min(start, size);
		}
		if (end === undefined) {
			relativeEnd = size;
		} else if (end < 0) {
			relativeEnd = Math.max(size + end, 0);
		} else {
			relativeEnd = Math.min(end, size);
		}
		const span = Math.max(relativeEnd - relativeStart, 0);

		const buffer = this[BUFFER];
		const slicedBuffer = buffer.slice(relativeStart, relativeStart + span);
		const blob = new Blob([], { type: arguments[2] });
		blob[BUFFER] = slicedBuffer;
		return blob;
	}
}

Object.defineProperties(Blob.prototype, {
	size: { enumerable: true },
	type: { enumerable: true },
	slice: { enumerable: true }
});

Object.defineProperty(Blob.prototype, Symbol.toStringTag, {
	value: 'Blob',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * fetch-error.js
 *
 * FetchError interface for operational errors
 */

/**
 * Create FetchError instance
 *
 * @param   String      message      Error message for human
 * @param   String      type         Error type for machine
 * @param   String      systemError  For Node.js system error
 * @return  FetchError
 */
function FetchError(message, type, systemError) {
  Error.call(this, message);

  this.message = message;
  this.type = type;

  // when err.type is `system`, err.code contains system error code
  if (systemError) {
    this.code = this.errno = systemError.code;
  }

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

FetchError.prototype = Object.create(Error.prototype);
FetchError.prototype.constructor = FetchError;
FetchError.prototype.name = 'FetchError';

let convert;
try {
	convert = require('encoding').convert;
} catch (e) {}

const INTERNALS = Symbol('Body internals');

// fix an issue where "PassThrough" isn't a named export for node <10
const PassThrough = Stream.PassThrough;

/**
 * Body mixin
 *
 * Ref: https://fetch.spec.whatwg.org/#body
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
function Body(body) {
	var _this = this;

	var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
	    _ref$size = _ref.size;

	let size = _ref$size === undefined ? 0 : _ref$size;
	var _ref$timeout = _ref.timeout;
	let timeout = _ref$timeout === undefined ? 0 : _ref$timeout;

	if (body == null) {
		// body is undefined or null
		body = null;
	} else if (typeof body === 'string') ; else if (isURLSearchParams(body)) ; else if (body instanceof Blob) ; else if (Buffer.isBuffer(body)) ; else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') ; else if (ArrayBuffer.isView(body)) ; else if (body instanceof Stream) ; else {
		// none of the above
		// coerce to string
		body = String(body);
	}
	this[INTERNALS] = {
		body,
		disturbed: false,
		error: null
	};
	this.size = size;
	this.timeout = timeout;

	if (body instanceof Stream) {
		body.on('error', function (err) {
			const error = err.name === 'AbortError' ? err : new FetchError(`Invalid response body while trying to fetch ${_this.url}: ${err.message}`, 'system', err);
			_this[INTERNALS].error = error;
		});
	}
}

Body.prototype = {
	get body() {
		return this[INTERNALS].body;
	},

	get bodyUsed() {
		return this[INTERNALS].disturbed;
	},

	/**
  * Decode response as ArrayBuffer
  *
  * @return  Promise
  */
	arrayBuffer() {
		return consumeBody.call(this).then(function (buf) {
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
		});
	},

	/**
  * Return raw response as Blob
  *
  * @return Promise
  */
	blob() {
		let ct = this.headers && this.headers.get('content-type') || '';
		return consumeBody.call(this).then(function (buf) {
			return Object.assign(
			// Prevent copying
			new Blob([], {
				type: ct.toLowerCase()
			}), {
				[BUFFER]: buf
			});
		});
	},

	/**
  * Decode response as json
  *
  * @return  Promise
  */
	json() {
		var _this2 = this;

		return consumeBody.call(this).then(function (buffer) {
			try {
				return JSON.parse(buffer.toString());
			} catch (err) {
				return Body.Promise.reject(new FetchError(`invalid json response body at ${_this2.url} reason: ${err.message}`, 'invalid-json'));
			}
		});
	},

	/**
  * Decode response as text
  *
  * @return  Promise
  */
	text() {
		return consumeBody.call(this).then(function (buffer) {
			return buffer.toString();
		});
	},

	/**
  * Decode response as buffer (non-spec api)
  *
  * @return  Promise
  */
	buffer() {
		return consumeBody.call(this);
	},

	/**
  * Decode response as text, while automatically detecting the encoding and
  * trying to decode to UTF-8 (non-spec api)
  *
  * @return  Promise
  */
	textConverted() {
		var _this3 = this;

		return consumeBody.call(this).then(function (buffer) {
			return convertBody(buffer, _this3.headers);
		});
	}

};

// In browsers, all properties are enumerable.
Object.defineProperties(Body.prototype, {
	body: { enumerable: true },
	bodyUsed: { enumerable: true },
	arrayBuffer: { enumerable: true },
	blob: { enumerable: true },
	json: { enumerable: true },
	text: { enumerable: true }
});

Body.mixIn = function (proto) {
	for (const name of Object.getOwnPropertyNames(Body.prototype)) {
		// istanbul ignore else: future proof
		if (!(name in proto)) {
			const desc = Object.getOwnPropertyDescriptor(Body.prototype, name);
			Object.defineProperty(proto, name, desc);
		}
	}
};

/**
 * Consume and convert an entire Body to a Buffer.
 *
 * Ref: https://fetch.spec.whatwg.org/#concept-body-consume-body
 *
 * @return  Promise
 */
function consumeBody() {
	var _this4 = this;

	if (this[INTERNALS].disturbed) {
		return Body.Promise.reject(new TypeError(`body used already for: ${this.url}`));
	}

	this[INTERNALS].disturbed = true;

	if (this[INTERNALS].error) {
		return Body.Promise.reject(this[INTERNALS].error);
	}

	// body is null
	if (this.body === null) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is string
	if (typeof this.body === 'string') {
		return Body.Promise.resolve(Buffer.from(this.body));
	}

	// body is blob
	if (this.body instanceof Blob) {
		return Body.Promise.resolve(this.body[BUFFER]);
	}

	// body is buffer
	if (Buffer.isBuffer(this.body)) {
		return Body.Promise.resolve(this.body);
	}

	// body is ArrayBuffer
	if (Object.prototype.toString.call(this.body) === '[object ArrayBuffer]') {
		return Body.Promise.resolve(Buffer.from(this.body));
	}

	// body is ArrayBufferView
	if (ArrayBuffer.isView(this.body)) {
		return Body.Promise.resolve(Buffer.from(this.body.buffer, this.body.byteOffset, this.body.byteLength));
	}

	// istanbul ignore if: should never happen
	if (!(this.body instanceof Stream)) {
		return Body.Promise.resolve(Buffer.alloc(0));
	}

	// body is stream
	// get ready to actually consume the body
	let accum = [];
	let accumBytes = 0;
	let abort = false;

	return new Body.Promise(function (resolve, reject) {
		let resTimeout;

		// allow timeout on slow response body
		if (_this4.timeout) {
			resTimeout = setTimeout(function () {
				abort = true;
				reject(new FetchError(`Response timeout while trying to fetch ${_this4.url} (over ${_this4.timeout}ms)`, 'body-timeout'));
			}, _this4.timeout);
		}

		// handle stream errors
		_this4.body.on('error', function (err) {
			if (err.name === 'AbortError') {
				// if the request was aborted, reject with this Error
				abort = true;
				reject(err);
			} else {
				// other errors, such as incorrect content-encoding
				reject(new FetchError(`Invalid response body while trying to fetch ${_this4.url}: ${err.message}`, 'system', err));
			}
		});

		_this4.body.on('data', function (chunk) {
			if (abort || chunk === null) {
				return;
			}

			if (_this4.size && accumBytes + chunk.length > _this4.size) {
				abort = true;
				reject(new FetchError(`content size at ${_this4.url} over limit: ${_this4.size}`, 'max-size'));
				return;
			}

			accumBytes += chunk.length;
			accum.push(chunk);
		});

		_this4.body.on('end', function () {
			if (abort) {
				return;
			}

			clearTimeout(resTimeout);

			try {
				resolve(Buffer.concat(accum));
			} catch (err) {
				// handle streams that have accumulated too much data (issue #414)
				reject(new FetchError(`Could not create Buffer from response body for ${_this4.url}: ${err.message}`, 'system', err));
			}
		});
	});
}

/**
 * Detect buffer encoding and convert to target encoding
 * ref: http://www.w3.org/TR/2011/WD-html5-20110113/parsing.html#determining-the-character-encoding
 *
 * @param   Buffer  buffer    Incoming buffer
 * @param   String  encoding  Target encoding
 * @return  String
 */
function convertBody(buffer, headers) {
	if (typeof convert !== 'function') {
		throw new Error('The package `encoding` must be installed to use the textConverted() function');
	}

	const ct = headers.get('content-type');
	let charset = 'utf-8';
	let res, str;

	// header
	if (ct) {
		res = /charset=([^;]*)/i.exec(ct);
	}

	// no charset in content type, peek at response body for at most 1024 bytes
	str = buffer.slice(0, 1024).toString();

	// html5
	if (!res && str) {
		res = /<meta.+?charset=(['"])(.+?)\1/i.exec(str);
	}

	// html4
	if (!res && str) {
		res = /<meta[\s]+?http-equiv=(['"])content-type\1[\s]+?content=(['"])(.+?)\2/i.exec(str);

		if (res) {
			res = /charset=(.*)/i.exec(res.pop());
		}
	}

	// xml
	if (!res && str) {
		res = /<\?xml.+?encoding=(['"])(.+?)\1/i.exec(str);
	}

	// found charset
	if (res) {
		charset = res.pop();

		// prevent decode issues when sites use incorrect encoding
		// ref: https://hsivonen.fi/encoding-menu/
		if (charset === 'gb2312' || charset === 'gbk') {
			charset = 'gb18030';
		}
	}

	// turn raw buffers into a single utf-8 buffer
	return convert(buffer, 'UTF-8', charset).toString();
}

/**
 * Detect a URLSearchParams object
 * ref: https://github.com/bitinn/node-fetch/issues/296#issuecomment-307598143
 *
 * @param   Object  obj     Object to detect by type or brand
 * @return  String
 */
function isURLSearchParams(obj) {
	// Duck-typing as a necessary condition.
	if (typeof obj !== 'object' || typeof obj.append !== 'function' || typeof obj.delete !== 'function' || typeof obj.get !== 'function' || typeof obj.getAll !== 'function' || typeof obj.has !== 'function' || typeof obj.set !== 'function') {
		return false;
	}

	// Brand-checking and more duck-typing as optional condition.
	return obj.constructor.name === 'URLSearchParams' || Object.prototype.toString.call(obj) === '[object URLSearchParams]' || typeof obj.sort === 'function';
}

/**
 * Clone body given Res/Req instance
 *
 * @param   Mixed  instance  Response or Request instance
 * @return  Mixed
 */
function clone(instance) {
	let p1, p2;
	let body = instance.body;

	// don't allow cloning a used body
	if (instance.bodyUsed) {
		throw new Error('cannot clone body after it is used');
	}

	// check that body is a stream and not form-data object
	// note: we can't clone the form-data object without having it as a dependency
	if (body instanceof Stream && typeof body.getBoundary !== 'function') {
		// tee instance body
		p1 = new PassThrough();
		p2 = new PassThrough();
		body.pipe(p1);
		body.pipe(p2);
		// set instance body to teed body and return the other teed body
		instance[INTERNALS].body = p1;
		body = p2;
	}

	return body;
}

/**
 * Performs the operation "extract a `Content-Type` value from |object|" as
 * specified in the specification:
 * https://fetch.spec.whatwg.org/#concept-bodyinit-extract
 *
 * This function assumes that instance.body is present.
 *
 * @param   Mixed  instance  Response or Request instance
 */
function extractContentType(instance) {
	const body = instance.body;

	// istanbul ignore if: Currently, because of a guard in Request, body
	// can never be null. Included here for completeness.

	if (body === null) {
		// body is null
		return null;
	} else if (typeof body === 'string') {
		// body is string
		return 'text/plain;charset=UTF-8';
	} else if (isURLSearchParams(body)) {
		// body is a URLSearchParams
		return 'application/x-www-form-urlencoded;charset=UTF-8';
	} else if (body instanceof Blob) {
		// body is blob
		return body.type || null;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return null;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return null;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return null;
	} else if (typeof body.getBoundary === 'function') {
		// detect form data input from form-data module
		return `multipart/form-data;boundary=${body.getBoundary()}`;
	} else {
		// body is stream
		// can't really do much about this
		return null;
	}
}

/**
 * The Fetch Standard treats this as if "total bytes" is a property on the body.
 * For us, we have to explicitly get it with a function.
 *
 * ref: https://fetch.spec.whatwg.org/#concept-body-total-bytes
 *
 * @param   Body    instance   Instance of Body
 * @return  Number?            Number of bytes, or null if not possible
 */
function getTotalBytes(instance) {
	const body = instance.body;

	// istanbul ignore if: included for completion

	if (body === null) {
		// body is null
		return 0;
	} else if (typeof body === 'string') {
		// body is string
		return Buffer.byteLength(body);
	} else if (isURLSearchParams(body)) {
		// body is URLSearchParams
		return Buffer.byteLength(String(body));
	} else if (body instanceof Blob) {
		// body is blob
		return body.size;
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		return body.length;
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		return body.byteLength;
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		return body.byteLength;
	} else if (body && typeof body.getLengthSync === 'function') {
		// detect form data input from form-data module
		if (body._lengthRetrievers && body._lengthRetrievers.length == 0 || // 1.x
		body.hasKnownLength && body.hasKnownLength()) {
			// 2.x
			return body.getLengthSync();
		}
		return null;
	} else {
		// body is stream
		// can't really do much about this
		return null;
	}
}

/**
 * Write a Body to a Node.js WritableStream (e.g. http.Request) object.
 *
 * @param   Body    instance   Instance of Body
 * @return  Void
 */
function writeToStream(dest, instance) {
	const body = instance.body;


	if (body === null) {
		// body is null
		dest.end();
	} else if (typeof body === 'string') {
		// body is string
		dest.write(body);
		dest.end();
	} else if (isURLSearchParams(body)) {
		// body is URLSearchParams
		dest.write(Buffer.from(String(body)));
		dest.end();
	} else if (body instanceof Blob) {
		// body is blob
		dest.write(body[BUFFER]);
		dest.end();
	} else if (Buffer.isBuffer(body)) {
		// body is buffer
		dest.write(body);
		dest.end();
	} else if (Object.prototype.toString.call(body) === '[object ArrayBuffer]') {
		// body is ArrayBuffer
		dest.write(Buffer.from(body));
		dest.end();
	} else if (ArrayBuffer.isView(body)) {
		// body is ArrayBufferView
		dest.write(Buffer.from(body.buffer, body.byteOffset, body.byteLength));
		dest.end();
	} else {
		// body is stream
		body.pipe(dest);
	}
}

// expose Promise
Body.Promise = global.Promise;

/**
 * headers.js
 *
 * Headers class offers convenient helpers
 */

const invalidTokenRegex = /[^\^_`a-zA-Z\-0-9!#$%&'*+.|~]/;
const invalidHeaderCharRegex = /[^\t\x20-\x7e\x80-\xff]/;

function validateName(name) {
	name = `${name}`;
	if (invalidTokenRegex.test(name)) {
		throw new TypeError(`${name} is not a legal HTTP header name`);
	}
}

function validateValue(value) {
	value = `${value}`;
	if (invalidHeaderCharRegex.test(value)) {
		throw new TypeError(`${value} is not a legal HTTP header value`);
	}
}

/**
 * Find the key in the map object given a header name.
 *
 * Returns undefined if not found.
 *
 * @param   String  name  Header name
 * @return  String|Undefined
 */
function find(map, name) {
	name = name.toLowerCase();
	for (const key in map) {
		if (key.toLowerCase() === name) {
			return key;
		}
	}
	return undefined;
}

const MAP = Symbol('map');
class Headers {
	/**
  * Headers class
  *
  * @param   Object  headers  Response headers
  * @return  Void
  */
	constructor() {
		let init = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

		this[MAP] = Object.create(null);

		if (init instanceof Headers) {
			const rawHeaders = init.raw();
			const headerNames = Object.keys(rawHeaders);

			for (const headerName of headerNames) {
				for (const value of rawHeaders[headerName]) {
					this.append(headerName, value);
				}
			}

			return;
		}

		// We don't worry about converting prop to ByteString here as append()
		// will handle it.
		if (init == null) ; else if (typeof init === 'object') {
			const method = init[Symbol.iterator];
			if (method != null) {
				if (typeof method !== 'function') {
					throw new TypeError('Header pairs must be iterable');
				}

				// sequence<sequence<ByteString>>
				// Note: per spec we have to first exhaust the lists then process them
				const pairs = [];
				for (const pair of init) {
					if (typeof pair !== 'object' || typeof pair[Symbol.iterator] !== 'function') {
						throw new TypeError('Each header pair must be iterable');
					}
					pairs.push(Array.from(pair));
				}

				for (const pair of pairs) {
					if (pair.length !== 2) {
						throw new TypeError('Each header pair must be a name/value tuple');
					}
					this.append(pair[0], pair[1]);
				}
			} else {
				// record<ByteString, ByteString>
				for (const key of Object.keys(init)) {
					const value = init[key];
					this.append(key, value);
				}
			}
		} else {
			throw new TypeError('Provided initializer must be an object');
		}
	}

	/**
  * Return combined header value given name
  *
  * @param   String  name  Header name
  * @return  Mixed
  */
	get(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key === undefined) {
			return null;
		}

		return this[MAP][key].join(', ');
	}

	/**
  * Iterate over all headers
  *
  * @param   Function  callback  Executed for each item with parameters (value, name, thisArg)
  * @param   Boolean   thisArg   `this` context for callback function
  * @return  Void
  */
	forEach(callback) {
		let thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;

		let pairs = getHeaders(this);
		let i = 0;
		while (i < pairs.length) {
			var _pairs$i = pairs[i];
			const name = _pairs$i[0],
			      value = _pairs$i[1];

			callback.call(thisArg, value, name, this);
			pairs = getHeaders(this);
			i++;
		}
	}

	/**
  * Overwrite header values given name
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	set(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		this[MAP][key !== undefined ? key : name] = [value];
	}

	/**
  * Append a value onto existing header
  *
  * @param   String  name   Header name
  * @param   String  value  Header value
  * @return  Void
  */
	append(name, value) {
		name = `${name}`;
		value = `${value}`;
		validateName(name);
		validateValue(value);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			this[MAP][key].push(value);
		} else {
			this[MAP][name] = [value];
		}
	}

	/**
  * Check for header name existence
  *
  * @param   String   name  Header name
  * @return  Boolean
  */
	has(name) {
		name = `${name}`;
		validateName(name);
		return find(this[MAP], name) !== undefined;
	}

	/**
  * Delete all header values given name
  *
  * @param   String  name  Header name
  * @return  Void
  */
	delete(name) {
		name = `${name}`;
		validateName(name);
		const key = find(this[MAP], name);
		if (key !== undefined) {
			delete this[MAP][key];
		}
	}

	/**
  * Return raw headers (non-spec api)
  *
  * @return  Object
  */
	raw() {
		return this[MAP];
	}

	/**
  * Get an iterator on keys.
  *
  * @return  Iterator
  */
	keys() {
		return createHeadersIterator(this, 'key');
	}

	/**
  * Get an iterator on values.
  *
  * @return  Iterator
  */
	values() {
		return createHeadersIterator(this, 'value');
	}

	/**
  * Get an iterator on entries.
  *
  * This is the default iterator of the Headers object.
  *
  * @return  Iterator
  */
	[Symbol.iterator]() {
		return createHeadersIterator(this, 'key+value');
	}
}
Headers.prototype.entries = Headers.prototype[Symbol.iterator];

Object.defineProperty(Headers.prototype, Symbol.toStringTag, {
	value: 'Headers',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Headers.prototype, {
	get: { enumerable: true },
	forEach: { enumerable: true },
	set: { enumerable: true },
	append: { enumerable: true },
	has: { enumerable: true },
	delete: { enumerable: true },
	keys: { enumerable: true },
	values: { enumerable: true },
	entries: { enumerable: true }
});

function getHeaders(headers) {
	let kind = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'key+value';

	const keys = Object.keys(headers[MAP]).sort();
	return keys.map(kind === 'key' ? function (k) {
		return k.toLowerCase();
	} : kind === 'value' ? function (k) {
		return headers[MAP][k].join(', ');
	} : function (k) {
		return [k.toLowerCase(), headers[MAP][k].join(', ')];
	});
}

const INTERNAL = Symbol('internal');

function createHeadersIterator(target, kind) {
	const iterator = Object.create(HeadersIteratorPrototype);
	iterator[INTERNAL] = {
		target,
		kind,
		index: 0
	};
	return iterator;
}

const HeadersIteratorPrototype = Object.setPrototypeOf({
	next() {
		// istanbul ignore if
		if (!this || Object.getPrototypeOf(this) !== HeadersIteratorPrototype) {
			throw new TypeError('Value of `this` is not a HeadersIterator');
		}

		var _INTERNAL = this[INTERNAL];
		const target = _INTERNAL.target,
		      kind = _INTERNAL.kind,
		      index = _INTERNAL.index;

		const values = getHeaders(target, kind);
		const len = values.length;
		if (index >= len) {
			return {
				value: undefined,
				done: true
			};
		}

		this[INTERNAL].index = index + 1;

		return {
			value: values[index],
			done: false
		};
	}
}, Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]())));

Object.defineProperty(HeadersIteratorPrototype, Symbol.toStringTag, {
	value: 'HeadersIterator',
	writable: false,
	enumerable: false,
	configurable: true
});

/**
 * Export the Headers object in a form that Node.js can consume.
 *
 * @param   Headers  headers
 * @return  Object
 */
function exportNodeCompatibleHeaders(headers) {
	const obj = Object.assign({ __proto__: null }, headers[MAP]);

	// http.request() only supports string as Host header. This hack makes
	// specifying custom Host header possible.
	const hostHeaderKey = find(headers[MAP], 'Host');
	if (hostHeaderKey !== undefined) {
		obj[hostHeaderKey] = obj[hostHeaderKey][0];
	}

	return obj;
}

/**
 * Create a Headers object from an object of headers, ignoring those that do
 * not conform to HTTP grammar productions.
 *
 * @param   Object  obj  Object of headers
 * @return  Headers
 */
function createHeadersLenient(obj) {
	const headers = new Headers();
	for (const name of Object.keys(obj)) {
		if (invalidTokenRegex.test(name)) {
			continue;
		}
		if (Array.isArray(obj[name])) {
			for (const val of obj[name]) {
				if (invalidHeaderCharRegex.test(val)) {
					continue;
				}
				if (headers[MAP][name] === undefined) {
					headers[MAP][name] = [val];
				} else {
					headers[MAP][name].push(val);
				}
			}
		} else if (!invalidHeaderCharRegex.test(obj[name])) {
			headers[MAP][name] = [obj[name]];
		}
	}
	return headers;
}

const INTERNALS$1 = Symbol('Response internals');

// fix an issue where "STATUS_CODES" aren't a named export for node <10
const STATUS_CODES = http.STATUS_CODES;

/**
 * Response class
 *
 * @param   Stream  body  Readable stream
 * @param   Object  opts  Response options
 * @return  Void
 */
class Response {
	constructor() {
		let body = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
		let opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		Body.call(this, body, opts);

		const status = opts.status || 200;

		this[INTERNALS$1] = {
			url: opts.url,
			status,
			statusText: opts.statusText || STATUS_CODES[status],
			headers: new Headers(opts.headers)
		};
	}

	get url() {
		return this[INTERNALS$1].url;
	}

	get status() {
		return this[INTERNALS$1].status;
	}

	/**
  * Convenience property representing if the request ended normally
  */
	get ok() {
		return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
	}

	get statusText() {
		return this[INTERNALS$1].statusText;
	}

	get headers() {
		return this[INTERNALS$1].headers;
	}

	/**
  * Clone this response
  *
  * @return  Response
  */
	clone() {
		return new Response(clone(this), {
			url: this.url,
			status: this.status,
			statusText: this.statusText,
			headers: this.headers,
			ok: this.ok
		});
	}
}

Body.mixIn(Response.prototype);

Object.defineProperties(Response.prototype, {
	url: { enumerable: true },
	status: { enumerable: true },
	ok: { enumerable: true },
	statusText: { enumerable: true },
	headers: { enumerable: true },
	clone: { enumerable: true }
});

Object.defineProperty(Response.prototype, Symbol.toStringTag, {
	value: 'Response',
	writable: false,
	enumerable: false,
	configurable: true
});

const INTERNALS$2 = Symbol('Request internals');

// fix an issue where "format", "parse" aren't a named export for node <10
const parse_url = Url.parse;
const format_url = Url.format;

const streamDestructionSupported = 'destroy' in Stream.Readable.prototype;

/**
 * Check if a value is an instance of Request.
 *
 * @param   Mixed   input
 * @return  Boolean
 */
function isRequest(input) {
	return typeof input === 'object' && typeof input[INTERNALS$2] === 'object';
}

function isAbortSignal(signal) {
	const proto = signal && typeof signal === 'object' && Object.getPrototypeOf(signal);
	return !!(proto && proto.constructor.name === 'AbortSignal');
}

/**
 * Request class
 *
 * @param   Mixed   input  Url or Request instance
 * @param   Object  init   Custom options
 * @return  Void
 */
class Request {
	constructor(input) {
		let init = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		let parsedURL;

		// normalize input
		if (!isRequest(input)) {
			if (input && input.href) {
				// in order to support Node.js' Url objects; though WHATWG's URL objects
				// will fall into this branch also (since their `toString()` will return
				// `href` property anyway)
				parsedURL = parse_url(input.href);
			} else {
				// coerce input to a string before attempting to parse
				parsedURL = parse_url(`${input}`);
			}
			input = {};
		} else {
			parsedURL = parse_url(input.url);
		}

		let method = init.method || input.method || 'GET';
		method = method.toUpperCase();

		if ((init.body != null || isRequest(input) && input.body !== null) && (method === 'GET' || method === 'HEAD')) {
			throw new TypeError('Request with GET/HEAD method cannot have body');
		}

		let inputBody = init.body != null ? init.body : isRequest(input) && input.body !== null ? clone(input) : null;

		Body.call(this, inputBody, {
			timeout: init.timeout || input.timeout || 0,
			size: init.size || input.size || 0
		});

		const headers = new Headers(init.headers || input.headers || {});

		if (init.body != null) {
			const contentType = extractContentType(this);
			if (contentType !== null && !headers.has('Content-Type')) {
				headers.append('Content-Type', contentType);
			}
		}

		let signal = isRequest(input) ? input.signal : null;
		if ('signal' in init) signal = init.signal;

		if (signal != null && !isAbortSignal(signal)) {
			throw new TypeError('Expected signal to be an instanceof AbortSignal');
		}

		this[INTERNALS$2] = {
			method,
			redirect: init.redirect || input.redirect || 'follow',
			headers,
			parsedURL,
			signal
		};

		// node-fetch-only options
		this.follow = init.follow !== undefined ? init.follow : input.follow !== undefined ? input.follow : 20;
		this.compress = init.compress !== undefined ? init.compress : input.compress !== undefined ? input.compress : true;
		this.counter = init.counter || input.counter || 0;
		this.agent = init.agent || input.agent;
	}

	get method() {
		return this[INTERNALS$2].method;
	}

	get url() {
		return format_url(this[INTERNALS$2].parsedURL);
	}

	get headers() {
		return this[INTERNALS$2].headers;
	}

	get redirect() {
		return this[INTERNALS$2].redirect;
	}

	get signal() {
		return this[INTERNALS$2].signal;
	}

	/**
  * Clone this request
  *
  * @return  Request
  */
	clone() {
		return new Request(this);
	}
}

Body.mixIn(Request.prototype);

Object.defineProperty(Request.prototype, Symbol.toStringTag, {
	value: 'Request',
	writable: false,
	enumerable: false,
	configurable: true
});

Object.defineProperties(Request.prototype, {
	method: { enumerable: true },
	url: { enumerable: true },
	headers: { enumerable: true },
	redirect: { enumerable: true },
	clone: { enumerable: true },
	signal: { enumerable: true }
});

/**
 * Convert a Request to Node.js http request options.
 *
 * @param   Request  A Request instance
 * @return  Object   The options object to be passed to http.request
 */
function getNodeRequestOptions(request) {
	const parsedURL = request[INTERNALS$2].parsedURL;
	const headers = new Headers(request[INTERNALS$2].headers);

	// fetch step 1.3
	if (!headers.has('Accept')) {
		headers.set('Accept', '*/*');
	}

	// Basic fetch
	if (!parsedURL.protocol || !parsedURL.hostname) {
		throw new TypeError('Only absolute URLs are supported');
	}

	if (!/^https?:$/.test(parsedURL.protocol)) {
		throw new TypeError('Only HTTP(S) protocols are supported');
	}

	if (request.signal && request.body instanceof Stream.Readable && !streamDestructionSupported) {
		throw new Error('Cancellation of streamed requests with AbortSignal is not supported in node < 8');
	}

	// HTTP-network-or-cache fetch steps 2.4-2.7
	let contentLengthValue = null;
	if (request.body == null && /^(POST|PUT)$/i.test(request.method)) {
		contentLengthValue = '0';
	}
	if (request.body != null) {
		const totalBytes = getTotalBytes(request);
		if (typeof totalBytes === 'number') {
			contentLengthValue = String(totalBytes);
		}
	}
	if (contentLengthValue) {
		headers.set('Content-Length', contentLengthValue);
	}

	// HTTP-network-or-cache fetch step 2.11
	if (!headers.has('User-Agent')) {
		headers.set('User-Agent', 'node-fetch/1.0 (+https://github.com/bitinn/node-fetch)');
	}

	// HTTP-network-or-cache fetch step 2.15
	if (request.compress && !headers.has('Accept-Encoding')) {
		headers.set('Accept-Encoding', 'gzip,deflate');
	}

	if (!headers.has('Connection') && !request.agent) {
		headers.set('Connection', 'close');
	}

	// HTTP-network fetch step 4.2
	// chunked encoding is handled by Node.js

	return Object.assign({}, parsedURL, {
		method: request.method,
		headers: exportNodeCompatibleHeaders(headers),
		agent: request.agent
	});
}

/**
 * abort-error.js
 *
 * AbortError interface for cancelled requests
 */

/**
 * Create AbortError instance
 *
 * @param   String      message      Error message for human
 * @return  AbortError
 */
function AbortError(message) {
  Error.call(this, message);

  this.type = 'aborted';
  this.message = message;

  // hide custom error implementation details from end-users
  Error.captureStackTrace(this, this.constructor);
}

AbortError.prototype = Object.create(Error.prototype);
AbortError.prototype.constructor = AbortError;
AbortError.prototype.name = 'AbortError';

// fix an issue where "PassThrough", "resolve" aren't a named export for node <10
const PassThrough$1 = Stream.PassThrough;
const resolve_url = Url.resolve;

/**
 * Fetch function
 *
 * @param   Mixed    url   Absolute url or Request instance
 * @param   Object   opts  Fetch options
 * @return  Promise
 */
function fetch$1(url, opts) {

	// allow custom promise
	if (!fetch$1.Promise) {
		throw new Error('native promise missing, set fetch.Promise to your favorite alternative');
	}

	Body.Promise = fetch$1.Promise;

	// wrap http.request into fetch
	return new fetch$1.Promise(function (resolve, reject) {
		// build request object
		const request = new Request(url, opts);
		const options = getNodeRequestOptions(request);

		const send = (options.protocol === 'https:' ? https : http).request;
		const signal = request.signal;

		let response = null;

		const abort = function abort() {
			let error = new AbortError('The user aborted a request.');
			reject(error);
			if (request.body && request.body instanceof Stream.Readable) {
				request.body.destroy(error);
			}
			if (!response || !response.body) return;
			response.body.emit('error', error);
		};

		if (signal && signal.aborted) {
			abort();
			return;
		}

		const abortAndFinalize = function abortAndFinalize() {
			abort();
			finalize();
		};

		// send request
		const req = send(options);
		let reqTimeout;

		if (signal) {
			signal.addEventListener('abort', abortAndFinalize);
		}

		function finalize() {
			req.abort();
			if (signal) signal.removeEventListener('abort', abortAndFinalize);
			clearTimeout(reqTimeout);
		}

		if (request.timeout) {
			req.once('socket', function (socket) {
				reqTimeout = setTimeout(function () {
					reject(new FetchError(`network timeout at: ${request.url}`, 'request-timeout'));
					finalize();
				}, request.timeout);
			});
		}

		req.on('error', function (err) {
			reject(new FetchError(`request to ${request.url} failed, reason: ${err.message}`, 'system', err));
			finalize();
		});

		req.on('response', function (res) {
			clearTimeout(reqTimeout);

			const headers = createHeadersLenient(res.headers);

			// HTTP fetch step 5
			if (fetch$1.isRedirect(res.statusCode)) {
				// HTTP fetch step 5.2
				const location = headers.get('Location');

				// HTTP fetch step 5.3
				const locationURL = location === null ? null : resolve_url(request.url, location);

				// HTTP fetch step 5.5
				switch (request.redirect) {
					case 'error':
						reject(new FetchError(`redirect mode is set to error: ${request.url}`, 'no-redirect'));
						finalize();
						return;
					case 'manual':
						// node-fetch-specific step: make manual redirect a bit easier to use by setting the Location header value to the resolved URL.
						if (locationURL !== null) {
							// handle corrupted header
							try {
								headers.set('Location', locationURL);
							} catch (err) {
								// istanbul ignore next: nodejs server prevent invalid response headers, we can't test this through normal request
								reject(err);
							}
						}
						break;
					case 'follow':
						// HTTP-redirect fetch step 2
						if (locationURL === null) {
							break;
						}

						// HTTP-redirect fetch step 5
						if (request.counter >= request.follow) {
							reject(new FetchError(`maximum redirect reached at: ${request.url}`, 'max-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 6 (counter increment)
						// Create a new Request object.
						const requestOpts = {
							headers: new Headers(request.headers),
							follow: request.follow,
							counter: request.counter + 1,
							agent: request.agent,
							compress: request.compress,
							method: request.method,
							body: request.body,
							signal: request.signal
						};

						// HTTP-redirect fetch step 9
						if (res.statusCode !== 303 && request.body && getTotalBytes(request) === null) {
							reject(new FetchError('Cannot follow redirect with body being a readable stream', 'unsupported-redirect'));
							finalize();
							return;
						}

						// HTTP-redirect fetch step 11
						if (res.statusCode === 303 || (res.statusCode === 301 || res.statusCode === 302) && request.method === 'POST') {
							requestOpts.method = 'GET';
							requestOpts.body = undefined;
							requestOpts.headers.delete('content-length');
						}

						// HTTP-redirect fetch step 15
						resolve(fetch$1(new Request(locationURL, requestOpts)));
						finalize();
						return;
				}
			}

			// prepare response
			res.once('end', function () {
				if (signal) signal.removeEventListener('abort', abortAndFinalize);
			});
			let body = res.pipe(new PassThrough$1());

			const response_options = {
				url: request.url,
				status: res.statusCode,
				statusText: res.statusMessage,
				headers: headers,
				size: request.size,
				timeout: request.timeout
			};

			// HTTP-network fetch step 12.1.1.3
			const codings = headers.get('Content-Encoding');

			// HTTP-network fetch step 12.1.1.4: handle content codings

			// in following scenarios we ignore compression support
			// 1. compression support is disabled
			// 2. HEAD request
			// 3. no Content-Encoding header
			// 4. no content response (204)
			// 5. content not modified response (304)
			if (!request.compress || request.method === 'HEAD' || codings === null || res.statusCode === 204 || res.statusCode === 304) {
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// For Node v6+
			// Be less strict when decoding compressed responses, since sometimes
			// servers send slightly invalid responses that are still accepted
			// by common browsers.
			// Always using Z_SYNC_FLUSH is what cURL does.
			const zlibOptions = {
				flush: zlib.Z_SYNC_FLUSH,
				finishFlush: zlib.Z_SYNC_FLUSH
			};

			// for gzip
			if (codings == 'gzip' || codings == 'x-gzip') {
				body = body.pipe(zlib.createGunzip(zlibOptions));
				response = new Response(body, response_options);
				resolve(response);
				return;
			}

			// for deflate
			if (codings == 'deflate' || codings == 'x-deflate') {
				// handle the infamous raw deflate response from old servers
				// a hack for old IIS and Apache servers
				const raw = res.pipe(new PassThrough$1());
				raw.once('data', function (chunk) {
					// see http://stackoverflow.com/questions/37519828
					if ((chunk[0] & 0x0F) === 0x08) {
						body = body.pipe(zlib.createInflate());
					} else {
						body = body.pipe(zlib.createInflateRaw());
					}
					response = new Response(body, response_options);
					resolve(response);
				});
				return;
			}

			// otherwise, use response as-is
			response = new Response(body, response_options);
			resolve(response);
		});

		writeToStream(req, request);
	});
}
/**
 * Redirect code matching
 *
 * @param   Number   code  Status code
 * @return  Boolean
 */
fetch$1.isRedirect = function (code) {
	return code === 301 || code === 302 || code === 303 || code === 307 || code === 308;
};

// expose Promise
fetch$1.Promise = global.Promise;

function get_page_handler(
	manifest,
	session_getter
) {
	const get_build_info = (assets => () => assets)(JSON.parse(fs.readFileSync(path.join(build_dir, 'build.json'), 'utf-8')));

	const template = (str => () => str)(read_template(build_dir));

	const has_service_worker = fs.existsSync(path.join(build_dir, 'service-worker.js'));

	const { server_routes, pages } = manifest;
	const error_route = manifest.error;

	function handle_error(req, res, statusCode, error) {
		handle_page({
			pattern: null,
			parts: [
				{ name: null, component: error_route }
			]
		}, req, res, statusCode, error || new Error('Unknown error in preload function'));
	}

	async function handle_page(page, req, res, status = 200, error = null) {
		const is_service_worker_index = req.path === '/service-worker-index.html';
		const build_info




 = get_build_info();

		res.setHeader('Content-Type', 'text/html');
		res.setHeader('Cache-Control', 'max-age=600');

		// preload main.js and current route
		// TODO detect other stuff we can preload? images, CSS, fonts?
		let preloaded_chunks = Array.isArray(build_info.assets.main) ? build_info.assets.main : [build_info.assets.main];
		if (!error && !is_service_worker_index) {
			page.parts.forEach(part => {
				if (!part) return;

				// using concat because it could be a string or an array. thanks webpack!
				preloaded_chunks = preloaded_chunks.concat(build_info.assets[part.name]);
			});
		}

		if (build_info.bundler === 'rollup') {
			// TODO add dependencies and CSS
			const link = preloaded_chunks
				.filter(file => file && !file.match(/\.map$/))
				.map(file => `<${req.baseUrl}/client/${file}>;rel="modulepreload"`)
				.join(', ');

			res.setHeader('Link', link);
		} else {
			const link = preloaded_chunks
				.filter(file => file && !file.match(/\.map$/))
				.map((file) => {
					const as = /\.css$/.test(file) ? 'style' : 'script';
					return `<${req.baseUrl}/client/${file}>;rel="preload";as="${as}"`;
				})
				.join(', ');

			res.setHeader('Link', link);
		}

		const session = session_getter(req, res);

		let redirect;
		let preload_error;

		const preload_context = {
			redirect: (statusCode, location) => {
				if (redirect && (redirect.statusCode !== statusCode || redirect.location !== location)) {
					throw new Error(`Conflicting redirects`);
				}
				location = location.replace(/^\//g, ''); // leading slash (only)
				redirect = { statusCode, location };
			},
			error: (statusCode, message) => {
				preload_error = { statusCode, message };
			},
			fetch: (url, opts) => {
				const parsed = new Url.URL(url, `http://127.0.0.1:${process.env.PORT}${req.baseUrl ? req.baseUrl + '/' :''}`);

				if (opts) {
					opts = Object.assign({}, opts);

					const include_cookies = (
						opts.credentials === 'include' ||
						opts.credentials === 'same-origin' && parsed.origin === `http://127.0.0.1:${process.env.PORT}`
					);

					if (include_cookies) {
						opts.headers = Object.assign({}, opts.headers);

						const cookies = Object.assign(
							{},
							cookie.parse(req.headers.cookie || ''),
							cookie.parse(opts.headers.cookie || '')
						);

						const set_cookie = res.getHeader('Set-Cookie');
						(Array.isArray(set_cookie) ? set_cookie : [set_cookie]).forEach(str => {
							const match = /([^=]+)=([^;]+)/.exec(str);
							if (match) cookies[match[1]] = match[2];
						});

						const str = Object.keys(cookies)
							.map(key => `${key}=${cookies[key]}`)
							.join('; ');

						opts.headers.cookie = str;
					}
				}

				return fetch$1(parsed.href, opts);
			}
		};

		let preloaded;
		let match;
		let params;

		try {
			const root_preloaded = manifest.root_preload
				? manifest.root_preload.call(preload_context, {
					path: req.path,
					query: req.query,
					params: {}
				})
				: {};

			match = error ? null : page.pattern.exec(req.path);


			let toPreload = [root_preloaded];
			if (!is_service_worker_index) {
				toPreload = toPreload.concat(page.parts.map(part => {
					if (!part) return null;

					// the deepest level is used below, to initialise the store
					params = part.params ? part.params(match) : {};

					return part.preload
						? part.preload.call(preload_context, {
							path: req.path,
							query: req.query,
							params
						}, session)
						: {};
				}));
			}

			preloaded = await Promise.all(toPreload);
		} catch (err) {
			preload_error = { statusCode: 500, message: err };
			preloaded = []; // appease TypeScript
		}

		try {
			if (redirect) {
				const location = Url.resolve(req.baseUrl || '/', redirect.location);

				res.statusCode = redirect.statusCode;
				res.setHeader('Location', location);
				res.end();

				return;
			}

			if (preload_error) {
				handle_error(req, res, preload_error.statusCode, preload_error.message);
				return;
			}

			const segments = req.path.split('/').filter(Boolean);

			// TODO make this less confusing
			const layout_segments = [segments[0]];
			let l = 1;

			page.parts.forEach((part, i) => {
				layout_segments[l] = segments[i + 1];
				if (!part) return null;
				l++;
			});

			const props = {
				segments: layout_segments,
				status: error ? status : 200,
				error: error ? error instanceof Error ? error : { message: error } : null,
				session: writable(session),
				level0: {
					props: preloaded[0]
				},
				level1: {
					segment: segments[0],
					props: {}
				}
			};

			if (!is_service_worker_index) {
				let l = 1;
				for (let i = 0; i < page.parts.length; i += 1) {
					const part = page.parts[i];
					if (!part) continue;

					props[`level${l++}`] = {
						component: part.component,
						props: preloaded[i + 1],
						segment: segments[i]
					};
				}
			}

			stores.page.set({
				path: req.path,
				query: req.query,
				params: params
			});

			const { html, head, css } = App.render(props);

			const serialized = {
				preloaded: `[${preloaded.map(data => try_serialize(data)).join(',')}]`,
				session: session && try_serialize(session, err => {
					throw new Error(`Failed to serialize session data: ${err.message}`);
				})
			};

			let script = `__SAPPER__={${[
				error && `error:1`,
				`baseUrl:"${req.baseUrl}"`,
				serialized.preloaded && `preloaded:${serialized.preloaded}`,
				serialized.session && `session:${serialized.session}`
			].filter(Boolean).join(',')}};`;

			if (has_service_worker) {
				script += `if('serviceWorker' in navigator)navigator.serviceWorker.register('${req.baseUrl}/service-worker.js');`;
			}

			const file = [].concat(build_info.assets.main).filter(file => file && /\.js$/.test(file))[0];
			const main = `${req.baseUrl}/client/${file}`;

			if (build_info.bundler === 'rollup') {
				if (build_info.legacy_assets) {
					const legacy_main = `${req.baseUrl}/client/legacy/${build_info.legacy_assets.main}`;
					script += `(function(){try{eval("async function x(){}");var main="${main}"}catch(e){main="${legacy_main}"};var s=document.createElement("script");try{new Function("if(0)import('')")();s.src=main;s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main",main);}document.head.appendChild(s);}());`;
				} else {
					script += `var s=document.createElement("script");try{new Function("if(0)import('')")();s.src="${main}";s.type="module";s.crossOrigin="use-credentials";}catch(e){s.src="${req.baseUrl}/client/shimport@${build_info.shimport}.js";s.setAttribute("data-main","${main}")}document.head.appendChild(s)`;
				}
			} else {
				script += `</script><script src="${main}">`;
			}

			let styles;

			// TODO make this consistent across apps
			// TODO embed build_info in placeholder.ts
			if (build_info.css && build_info.css.main) {
				const css_chunks = new Set();
				if (build_info.css.main) css_chunks.add(build_info.css.main);
				page.parts.forEach(part => {
					if (!part) return;
					const css_chunks_for_part = build_info.css.chunks[part.file];

					if (css_chunks_for_part) {
						css_chunks_for_part.forEach(file => {
							css_chunks.add(file);
						});
					}
				});

				styles = Array.from(css_chunks)
					.map(href => `<link rel="stylesheet" href="client/${href}">`)
					.join('');
			} else {
				styles = (css && css.code ? `<style>${css.code}</style>` : '');
			}

			// users can set a CSP nonce using res.locals.nonce
			const nonce_attr = (res.locals && res.locals.nonce) ? ` nonce="${res.locals.nonce}"` : '';

			const body = template()
				.replace('%sapper.base%', () => `<base href="${req.baseUrl}/">`)
				.replace('%sapper.scripts%', () => `<script${nonce_attr}>${script}</script>`)
				.replace('%sapper.html%', () => html)
				.replace('%sapper.head%', () => `<noscript id='sapper-head-start'></noscript>${head}<noscript id='sapper-head-end'></noscript>`)
				.replace('%sapper.styles%', () => styles);

			res.statusCode = status;
			res.end(body);
		} catch(err) {
			console.log(err);
			if (error) {
				// we encountered an error while rendering the error page — oops
				res.statusCode = 500;
				res.end(`<pre>${escape_html(err.message)}</pre>`);
			} else {
				handle_error(req, res, 500, err);
			}
		}
	}

	return function find_route(req, res, next) {
		if (req[IGNORE]) return next();

		if (req.path === '/service-worker-index.html') {
			const homePage = pages.find(page => page.pattern.test('/'));
			handle_page(homePage, req, res);
			return;
		}

		if (!server_routes.some(route => route.pattern.test(req.path))) {
			for (const page of pages) {
				if (page.pattern.test(req.path)) {
					handle_page(page, req, res);
					return;
				}
			}
		}

		handle_error(req, res, 404, 'Not found');
	};
}

function read_template(dir = build_dir) {
	return fs.readFileSync(`${dir}/template.html`, 'utf-8');
}

function try_serialize(data, fail) {
	try {
		return devalue(data);
	} catch (err) {
		if (fail) fail(err);
		return null;
	}
}

function escape_html(html) {
	const chars = {
		'"' : 'quot',
		"'": '#39',
		'&': 'amp',
		'<' : 'lt',
		'>' : 'gt'
	};

	return html.replace(/["'&<>]/g, c => `&${chars[c]};`);
}

var mime_raw = "application/andrew-inset\t\t\tez\napplication/applixware\t\t\t\taw\napplication/atom+xml\t\t\t\tatom\napplication/atomcat+xml\t\t\t\tatomcat\napplication/atomsvc+xml\t\t\t\tatomsvc\napplication/ccxml+xml\t\t\t\tccxml\napplication/cdmi-capability\t\t\tcdmia\napplication/cdmi-container\t\t\tcdmic\napplication/cdmi-domain\t\t\t\tcdmid\napplication/cdmi-object\t\t\t\tcdmio\napplication/cdmi-queue\t\t\t\tcdmiq\napplication/cu-seeme\t\t\t\tcu\napplication/davmount+xml\t\t\tdavmount\napplication/docbook+xml\t\t\t\tdbk\napplication/dssc+der\t\t\t\tdssc\napplication/dssc+xml\t\t\t\txdssc\napplication/ecmascript\t\t\t\tecma\napplication/emma+xml\t\t\t\temma\napplication/epub+zip\t\t\t\tepub\napplication/exi\t\t\t\t\texi\napplication/font-tdpfr\t\t\t\tpfr\napplication/gml+xml\t\t\t\tgml\napplication/gpx+xml\t\t\t\tgpx\napplication/gxf\t\t\t\t\tgxf\napplication/hyperstudio\t\t\t\tstk\napplication/inkml+xml\t\t\t\tink inkml\napplication/ipfix\t\t\t\tipfix\napplication/java-archive\t\t\tjar\napplication/java-serialized-object\t\tser\napplication/java-vm\t\t\t\tclass\napplication/javascript\t\t\t\tjs\napplication/json\t\t\t\tjson map\napplication/jsonml+json\t\t\t\tjsonml\napplication/lost+xml\t\t\t\tlostxml\napplication/mac-binhex40\t\t\thqx\napplication/mac-compactpro\t\t\tcpt\napplication/mads+xml\t\t\t\tmads\napplication/marc\t\t\t\tmrc\napplication/marcxml+xml\t\t\t\tmrcx\napplication/mathematica\t\t\t\tma nb mb\napplication/mathml+xml\t\t\t\tmathml\napplication/mbox\t\t\t\tmbox\napplication/mediaservercontrol+xml\t\tmscml\napplication/metalink+xml\t\t\tmetalink\napplication/metalink4+xml\t\t\tmeta4\napplication/mets+xml\t\t\t\tmets\napplication/mods+xml\t\t\t\tmods\napplication/mp21\t\t\t\tm21 mp21\napplication/mp4\t\t\t\t\tmp4s\napplication/msword\t\t\t\tdoc dot\napplication/mxf\t\t\t\t\tmxf\napplication/octet-stream\tbin dms lrf mar so dist distz pkg bpk dump elc deploy\napplication/oda\t\t\t\t\toda\napplication/oebps-package+xml\t\t\topf\napplication/ogg\t\t\t\t\togx\napplication/omdoc+xml\t\t\t\tomdoc\napplication/onenote\t\t\t\tonetoc onetoc2 onetmp onepkg\napplication/oxps\t\t\t\toxps\napplication/patch-ops-error+xml\t\t\txer\napplication/pdf\t\t\t\t\tpdf\napplication/pgp-encrypted\t\t\tpgp\napplication/pgp-signature\t\t\tasc sig\napplication/pics-rules\t\t\t\tprf\napplication/pkcs10\t\t\t\tp10\napplication/pkcs7-mime\t\t\t\tp7m p7c\napplication/pkcs7-signature\t\t\tp7s\napplication/pkcs8\t\t\t\tp8\napplication/pkix-attr-cert\t\t\tac\napplication/pkix-cert\t\t\t\tcer\napplication/pkix-crl\t\t\t\tcrl\napplication/pkix-pkipath\t\t\tpkipath\napplication/pkixcmp\t\t\t\tpki\napplication/pls+xml\t\t\t\tpls\napplication/postscript\t\t\t\tai eps ps\napplication/prs.cww\t\t\t\tcww\napplication/pskc+xml\t\t\t\tpskcxml\napplication/rdf+xml\t\t\t\trdf\napplication/reginfo+xml\t\t\t\trif\napplication/relax-ng-compact-syntax\t\trnc\napplication/resource-lists+xml\t\t\trl\napplication/resource-lists-diff+xml\t\trld\napplication/rls-services+xml\t\t\trs\napplication/rpki-ghostbusters\t\t\tgbr\napplication/rpki-manifest\t\t\tmft\napplication/rpki-roa\t\t\t\troa\napplication/rsd+xml\t\t\t\trsd\napplication/rss+xml\t\t\t\trss\napplication/rtf\t\t\t\t\trtf\napplication/sbml+xml\t\t\t\tsbml\napplication/scvp-cv-request\t\t\tscq\napplication/scvp-cv-response\t\t\tscs\napplication/scvp-vp-request\t\t\tspq\napplication/scvp-vp-response\t\t\tspp\napplication/sdp\t\t\t\t\tsdp\napplication/set-payment-initiation\t\tsetpay\napplication/set-registration-initiation\t\tsetreg\napplication/shf+xml\t\t\t\tshf\napplication/smil+xml\t\t\t\tsmi smil\napplication/sparql-query\t\t\trq\napplication/sparql-results+xml\t\t\tsrx\napplication/srgs\t\t\t\tgram\napplication/srgs+xml\t\t\t\tgrxml\napplication/sru+xml\t\t\t\tsru\napplication/ssdl+xml\t\t\t\tssdl\napplication/ssml+xml\t\t\t\tssml\napplication/tei+xml\t\t\t\ttei teicorpus\napplication/thraud+xml\t\t\t\ttfi\napplication/timestamped-data\t\t\ttsd\napplication/vnd.3gpp.pic-bw-large\t\tplb\napplication/vnd.3gpp.pic-bw-small\t\tpsb\napplication/vnd.3gpp.pic-bw-var\t\t\tpvb\napplication/vnd.3gpp2.tcap\t\t\ttcap\napplication/vnd.3m.post-it-notes\t\tpwn\napplication/vnd.accpac.simply.aso\t\taso\napplication/vnd.accpac.simply.imp\t\timp\napplication/vnd.acucobol\t\t\tacu\napplication/vnd.acucorp\t\t\t\tatc acutc\napplication/vnd.adobe.air-application-installer-package+zip\tair\napplication/vnd.adobe.formscentral.fcdt\t\tfcdt\napplication/vnd.adobe.fxp\t\t\tfxp fxpl\napplication/vnd.adobe.xdp+xml\t\t\txdp\napplication/vnd.adobe.xfdf\t\t\txfdf\napplication/vnd.ahead.space\t\t\tahead\napplication/vnd.airzip.filesecure.azf\t\tazf\napplication/vnd.airzip.filesecure.azs\t\tazs\napplication/vnd.amazon.ebook\t\t\tazw\napplication/vnd.americandynamics.acc\t\tacc\napplication/vnd.amiga.ami\t\t\tami\napplication/vnd.android.package-archive\t\tapk\napplication/vnd.anser-web-certificate-issue-initiation\tcii\napplication/vnd.anser-web-funds-transfer-initiation\tfti\napplication/vnd.antix.game-component\t\tatx\napplication/vnd.apple.installer+xml\t\tmpkg\napplication/vnd.apple.mpegurl\t\t\tm3u8\napplication/vnd.aristanetworks.swi\t\tswi\napplication/vnd.astraea-software.iota\t\tiota\napplication/vnd.audiograph\t\t\taep\napplication/vnd.blueice.multipass\t\tmpm\napplication/vnd.bmi\t\t\t\tbmi\napplication/vnd.businessobjects\t\t\trep\napplication/vnd.chemdraw+xml\t\t\tcdxml\napplication/vnd.chipnuts.karaoke-mmd\t\tmmd\napplication/vnd.cinderella\t\t\tcdy\napplication/vnd.claymore\t\t\tcla\napplication/vnd.cloanto.rp9\t\t\trp9\napplication/vnd.clonk.c4group\t\t\tc4g c4d c4f c4p c4u\napplication/vnd.cluetrust.cartomobile-config\t\tc11amc\napplication/vnd.cluetrust.cartomobile-config-pkg\tc11amz\napplication/vnd.commonspace\t\t\tcsp\napplication/vnd.contact.cmsg\t\t\tcdbcmsg\napplication/vnd.cosmocaller\t\t\tcmc\napplication/vnd.crick.clicker\t\t\tclkx\napplication/vnd.crick.clicker.keyboard\t\tclkk\napplication/vnd.crick.clicker.palette\t\tclkp\napplication/vnd.crick.clicker.template\t\tclkt\napplication/vnd.crick.clicker.wordbank\t\tclkw\napplication/vnd.criticaltools.wbs+xml\t\twbs\napplication/vnd.ctc-posml\t\t\tpml\napplication/vnd.cups-ppd\t\t\tppd\napplication/vnd.curl.car\t\t\tcar\napplication/vnd.curl.pcurl\t\t\tpcurl\napplication/vnd.dart\t\t\t\tdart\napplication/vnd.data-vision.rdz\t\t\trdz\napplication/vnd.dece.data\t\t\tuvf uvvf uvd uvvd\napplication/vnd.dece.ttml+xml\t\t\tuvt uvvt\napplication/vnd.dece.unspecified\t\tuvx uvvx\napplication/vnd.dece.zip\t\t\tuvz uvvz\napplication/vnd.denovo.fcselayout-link\t\tfe_launch\napplication/vnd.dna\t\t\t\tdna\napplication/vnd.dolby.mlp\t\t\tmlp\napplication/vnd.dpgraph\t\t\t\tdpg\napplication/vnd.dreamfactory\t\t\tdfac\napplication/vnd.ds-keypoint\t\t\tkpxx\napplication/vnd.dvb.ait\t\t\t\tait\napplication/vnd.dvb.service\t\t\tsvc\napplication/vnd.dynageo\t\t\t\tgeo\napplication/vnd.ecowin.chart\t\t\tmag\napplication/vnd.enliven\t\t\t\tnml\napplication/vnd.epson.esf\t\t\tesf\napplication/vnd.epson.msf\t\t\tmsf\napplication/vnd.epson.quickanime\t\tqam\napplication/vnd.epson.salt\t\t\tslt\napplication/vnd.epson.ssf\t\t\tssf\napplication/vnd.eszigno3+xml\t\t\tes3 et3\napplication/vnd.ezpix-album\t\t\tez2\napplication/vnd.ezpix-package\t\t\tez3\napplication/vnd.fdf\t\t\t\tfdf\napplication/vnd.fdsn.mseed\t\t\tmseed\napplication/vnd.fdsn.seed\t\t\tseed dataless\napplication/vnd.flographit\t\t\tgph\napplication/vnd.fluxtime.clip\t\t\tftc\napplication/vnd.framemaker\t\t\tfm frame maker book\napplication/vnd.frogans.fnc\t\t\tfnc\napplication/vnd.frogans.ltf\t\t\tltf\napplication/vnd.fsc.weblaunch\t\t\tfsc\napplication/vnd.fujitsu.oasys\t\t\toas\napplication/vnd.fujitsu.oasys2\t\t\toa2\napplication/vnd.fujitsu.oasys3\t\t\toa3\napplication/vnd.fujitsu.oasysgp\t\t\tfg5\napplication/vnd.fujitsu.oasysprs\t\tbh2\napplication/vnd.fujixerox.ddd\t\t\tddd\napplication/vnd.fujixerox.docuworks\t\txdw\napplication/vnd.fujixerox.docuworks.binder\txbd\napplication/vnd.fuzzysheet\t\t\tfzs\napplication/vnd.genomatix.tuxedo\t\ttxd\napplication/vnd.geogebra.file\t\t\tggb\napplication/vnd.geogebra.tool\t\t\tggt\napplication/vnd.geometry-explorer\t\tgex gre\napplication/vnd.geonext\t\t\t\tgxt\napplication/vnd.geoplan\t\t\t\tg2w\napplication/vnd.geospace\t\t\tg3w\napplication/vnd.gmx\t\t\t\tgmx\napplication/vnd.google-earth.kml+xml\t\tkml\napplication/vnd.google-earth.kmz\t\tkmz\napplication/vnd.grafeq\t\t\t\tgqf gqs\napplication/vnd.groove-account\t\t\tgac\napplication/vnd.groove-help\t\t\tghf\napplication/vnd.groove-identity-message\t\tgim\napplication/vnd.groove-injector\t\t\tgrv\napplication/vnd.groove-tool-message\t\tgtm\napplication/vnd.groove-tool-template\t\ttpl\napplication/vnd.groove-vcard\t\t\tvcg\napplication/vnd.hal+xml\t\t\t\thal\napplication/vnd.handheld-entertainment+xml\tzmm\napplication/vnd.hbci\t\t\t\thbci\napplication/vnd.hhe.lesson-player\t\tles\napplication/vnd.hp-hpgl\t\t\t\thpgl\napplication/vnd.hp-hpid\t\t\t\thpid\napplication/vnd.hp-hps\t\t\t\thps\napplication/vnd.hp-jlyt\t\t\t\tjlt\napplication/vnd.hp-pcl\t\t\t\tpcl\napplication/vnd.hp-pclxl\t\t\tpclxl\napplication/vnd.hydrostatix.sof-data\t\tsfd-hdstx\napplication/vnd.ibm.minipay\t\t\tmpy\napplication/vnd.ibm.modcap\t\t\tafp listafp list3820\napplication/vnd.ibm.rights-management\t\tirm\napplication/vnd.ibm.secure-container\t\tsc\napplication/vnd.iccprofile\t\t\ticc icm\napplication/vnd.igloader\t\t\tigl\napplication/vnd.immervision-ivp\t\t\tivp\napplication/vnd.immervision-ivu\t\t\tivu\napplication/vnd.insors.igm\t\t\tigm\napplication/vnd.intercon.formnet\t\txpw xpx\napplication/vnd.intergeo\t\t\ti2g\napplication/vnd.intu.qbo\t\t\tqbo\napplication/vnd.intu.qfx\t\t\tqfx\napplication/vnd.ipunplugged.rcprofile\t\trcprofile\napplication/vnd.irepository.package+xml\t\tirp\napplication/vnd.is-xpr\t\t\t\txpr\napplication/vnd.isac.fcs\t\t\tfcs\napplication/vnd.jam\t\t\t\tjam\napplication/vnd.jcp.javame.midlet-rms\t\trms\napplication/vnd.jisp\t\t\t\tjisp\napplication/vnd.joost.joda-archive\t\tjoda\napplication/vnd.kahootz\t\t\t\tktz ktr\napplication/vnd.kde.karbon\t\t\tkarbon\napplication/vnd.kde.kchart\t\t\tchrt\napplication/vnd.kde.kformula\t\t\tkfo\napplication/vnd.kde.kivio\t\t\tflw\napplication/vnd.kde.kontour\t\t\tkon\napplication/vnd.kde.kpresenter\t\t\tkpr kpt\napplication/vnd.kde.kspread\t\t\tksp\napplication/vnd.kde.kword\t\t\tkwd kwt\napplication/vnd.kenameaapp\t\t\thtke\napplication/vnd.kidspiration\t\t\tkia\napplication/vnd.kinar\t\t\t\tkne knp\napplication/vnd.koan\t\t\t\tskp skd skt skm\napplication/vnd.kodak-descriptor\t\tsse\napplication/vnd.las.las+xml\t\t\tlasxml\napplication/vnd.llamagraphics.life-balance.desktop\tlbd\napplication/vnd.llamagraphics.life-balance.exchange+xml\tlbe\napplication/vnd.lotus-1-2-3\t\t\t123\napplication/vnd.lotus-approach\t\t\tapr\napplication/vnd.lotus-freelance\t\t\tpre\napplication/vnd.lotus-notes\t\t\tnsf\napplication/vnd.lotus-organizer\t\t\torg\napplication/vnd.lotus-screencam\t\t\tscm\napplication/vnd.lotus-wordpro\t\t\tlwp\napplication/vnd.macports.portpkg\t\tportpkg\napplication/vnd.mcd\t\t\t\tmcd\napplication/vnd.medcalcdata\t\t\tmc1\napplication/vnd.mediastation.cdkey\t\tcdkey\napplication/vnd.mfer\t\t\t\tmwf\napplication/vnd.mfmp\t\t\t\tmfm\napplication/vnd.micrografx.flo\t\t\tflo\napplication/vnd.micrografx.igx\t\t\tigx\napplication/vnd.mif\t\t\t\tmif\napplication/vnd.mobius.daf\t\t\tdaf\napplication/vnd.mobius.dis\t\t\tdis\napplication/vnd.mobius.mbk\t\t\tmbk\napplication/vnd.mobius.mqy\t\t\tmqy\napplication/vnd.mobius.msl\t\t\tmsl\napplication/vnd.mobius.plc\t\t\tplc\napplication/vnd.mobius.txf\t\t\ttxf\napplication/vnd.mophun.application\t\tmpn\napplication/vnd.mophun.certificate\t\tmpc\napplication/vnd.mozilla.xul+xml\t\t\txul\napplication/vnd.ms-artgalry\t\t\tcil\napplication/vnd.ms-cab-compressed\t\tcab\napplication/vnd.ms-excel\t\t\txls xlm xla xlc xlt xlw\napplication/vnd.ms-excel.addin.macroenabled.12\t\txlam\napplication/vnd.ms-excel.sheet.binary.macroenabled.12\txlsb\napplication/vnd.ms-excel.sheet.macroenabled.12\t\txlsm\napplication/vnd.ms-excel.template.macroenabled.12\txltm\napplication/vnd.ms-fontobject\t\t\teot\napplication/vnd.ms-htmlhelp\t\t\tchm\napplication/vnd.ms-ims\t\t\t\tims\napplication/vnd.ms-lrm\t\t\t\tlrm\napplication/vnd.ms-officetheme\t\t\tthmx\napplication/vnd.ms-pki.seccat\t\t\tcat\napplication/vnd.ms-pki.stl\t\t\tstl\napplication/vnd.ms-powerpoint\t\t\tppt pps pot\napplication/vnd.ms-powerpoint.addin.macroenabled.12\t\tppam\napplication/vnd.ms-powerpoint.presentation.macroenabled.12\tpptm\napplication/vnd.ms-powerpoint.slide.macroenabled.12\t\tsldm\napplication/vnd.ms-powerpoint.slideshow.macroenabled.12\t\tppsm\napplication/vnd.ms-powerpoint.template.macroenabled.12\t\tpotm\napplication/vnd.ms-project\t\t\tmpp mpt\napplication/vnd.ms-word.document.macroenabled.12\tdocm\napplication/vnd.ms-word.template.macroenabled.12\tdotm\napplication/vnd.ms-works\t\t\twps wks wcm wdb\napplication/vnd.ms-wpl\t\t\t\twpl\napplication/vnd.ms-xpsdocument\t\t\txps\napplication/vnd.mseq\t\t\t\tmseq\napplication/vnd.musician\t\t\tmus\napplication/vnd.muvee.style\t\t\tmsty\napplication/vnd.mynfc\t\t\t\ttaglet\napplication/vnd.neurolanguage.nlu\t\tnlu\napplication/vnd.nitf\t\t\t\tntf nitf\napplication/vnd.noblenet-directory\t\tnnd\napplication/vnd.noblenet-sealer\t\t\tnns\napplication/vnd.noblenet-web\t\t\tnnw\napplication/vnd.nokia.n-gage.data\t\tngdat\napplication/vnd.nokia.n-gage.symbian.install\tn-gage\napplication/vnd.nokia.radio-preset\t\trpst\napplication/vnd.nokia.radio-presets\t\trpss\napplication/vnd.novadigm.edm\t\t\tedm\napplication/vnd.novadigm.edx\t\t\tedx\napplication/vnd.novadigm.ext\t\t\text\napplication/vnd.oasis.opendocument.chart\t\todc\napplication/vnd.oasis.opendocument.chart-template\totc\napplication/vnd.oasis.opendocument.database\t\todb\napplication/vnd.oasis.opendocument.formula\t\todf\napplication/vnd.oasis.opendocument.formula-template\todft\napplication/vnd.oasis.opendocument.graphics\t\todg\napplication/vnd.oasis.opendocument.graphics-template\totg\napplication/vnd.oasis.opendocument.image\t\todi\napplication/vnd.oasis.opendocument.image-template\toti\napplication/vnd.oasis.opendocument.presentation\t\todp\napplication/vnd.oasis.opendocument.presentation-template\totp\napplication/vnd.oasis.opendocument.spreadsheet\t\tods\napplication/vnd.oasis.opendocument.spreadsheet-template\tots\napplication/vnd.oasis.opendocument.text\t\t\todt\napplication/vnd.oasis.opendocument.text-master\t\todm\napplication/vnd.oasis.opendocument.text-template\tott\napplication/vnd.oasis.opendocument.text-web\t\toth\napplication/vnd.olpc-sugar\t\t\txo\napplication/vnd.oma.dd2+xml\t\t\tdd2\napplication/vnd.openofficeorg.extension\t\toxt\napplication/vnd.openxmlformats-officedocument.presentationml.presentation\tpptx\napplication/vnd.openxmlformats-officedocument.presentationml.slide\tsldx\napplication/vnd.openxmlformats-officedocument.presentationml.slideshow\tppsx\napplication/vnd.openxmlformats-officedocument.presentationml.template\tpotx\napplication/vnd.openxmlformats-officedocument.spreadsheetml.sheet\txlsx\napplication/vnd.openxmlformats-officedocument.spreadsheetml.template\txltx\napplication/vnd.openxmlformats-officedocument.wordprocessingml.document\tdocx\napplication/vnd.openxmlformats-officedocument.wordprocessingml.template\tdotx\napplication/vnd.osgeo.mapguide.package\t\tmgp\napplication/vnd.osgi.dp\t\t\t\tdp\napplication/vnd.osgi.subsystem\t\t\tesa\napplication/vnd.palm\t\t\t\tpdb pqa oprc\napplication/vnd.pawaafile\t\t\tpaw\napplication/vnd.pg.format\t\t\tstr\napplication/vnd.pg.osasli\t\t\tei6\napplication/vnd.picsel\t\t\t\tefif\napplication/vnd.pmi.widget\t\t\twg\napplication/vnd.pocketlearn\t\t\tplf\napplication/vnd.powerbuilder6\t\t\tpbd\napplication/vnd.previewsystems.box\t\tbox\napplication/vnd.proteus.magazine\t\tmgz\napplication/vnd.publishare-delta-tree\t\tqps\napplication/vnd.pvi.ptid1\t\t\tptid\napplication/vnd.quark.quarkxpress\t\tqxd qxt qwd qwt qxl qxb\napplication/vnd.realvnc.bed\t\t\tbed\napplication/vnd.recordare.musicxml\t\tmxl\napplication/vnd.recordare.musicxml+xml\t\tmusicxml\napplication/vnd.rig.cryptonote\t\t\tcryptonote\napplication/vnd.rim.cod\t\t\t\tcod\napplication/vnd.rn-realmedia\t\t\trm\napplication/vnd.rn-realmedia-vbr\t\trmvb\napplication/vnd.route66.link66+xml\t\tlink66\napplication/vnd.sailingtracker.track\t\tst\napplication/vnd.seemail\t\t\t\tsee\napplication/vnd.sema\t\t\t\tsema\napplication/vnd.semd\t\t\t\tsemd\napplication/vnd.semf\t\t\t\tsemf\napplication/vnd.shana.informed.formdata\t\tifm\napplication/vnd.shana.informed.formtemplate\titp\napplication/vnd.shana.informed.interchange\tiif\napplication/vnd.shana.informed.package\t\tipk\napplication/vnd.simtech-mindmapper\t\ttwd twds\napplication/vnd.smaf\t\t\t\tmmf\napplication/vnd.smart.teacher\t\t\tteacher\napplication/vnd.solent.sdkm+xml\t\t\tsdkm sdkd\napplication/vnd.spotfire.dxp\t\t\tdxp\napplication/vnd.spotfire.sfs\t\t\tsfs\napplication/vnd.stardivision.calc\t\tsdc\napplication/vnd.stardivision.draw\t\tsda\napplication/vnd.stardivision.impress\t\tsdd\napplication/vnd.stardivision.math\t\tsmf\napplication/vnd.stardivision.writer\t\tsdw vor\napplication/vnd.stardivision.writer-global\tsgl\napplication/vnd.stepmania.package\t\tsmzip\napplication/vnd.stepmania.stepchart\t\tsm\napplication/vnd.sun.xml.calc\t\t\tsxc\napplication/vnd.sun.xml.calc.template\t\tstc\napplication/vnd.sun.xml.draw\t\t\tsxd\napplication/vnd.sun.xml.draw.template\t\tstd\napplication/vnd.sun.xml.impress\t\t\tsxi\napplication/vnd.sun.xml.impress.template\tsti\napplication/vnd.sun.xml.math\t\t\tsxm\napplication/vnd.sun.xml.writer\t\t\tsxw\napplication/vnd.sun.xml.writer.global\t\tsxg\napplication/vnd.sun.xml.writer.template\t\tstw\napplication/vnd.sus-calendar\t\t\tsus susp\napplication/vnd.svd\t\t\t\tsvd\napplication/vnd.symbian.install\t\t\tsis sisx\napplication/vnd.syncml+xml\t\t\txsm\napplication/vnd.syncml.dm+wbxml\t\t\tbdm\napplication/vnd.syncml.dm+xml\t\t\txdm\napplication/vnd.tao.intent-module-archive\ttao\napplication/vnd.tcpdump.pcap\t\t\tpcap cap dmp\napplication/vnd.tmobile-livetv\t\t\ttmo\napplication/vnd.trid.tpt\t\t\ttpt\napplication/vnd.triscape.mxs\t\t\tmxs\napplication/vnd.trueapp\t\t\t\ttra\napplication/vnd.ufdl\t\t\t\tufd ufdl\napplication/vnd.uiq.theme\t\t\tutz\napplication/vnd.umajin\t\t\t\tumj\napplication/vnd.unity\t\t\t\tunityweb\napplication/vnd.uoml+xml\t\t\tuoml\napplication/vnd.vcx\t\t\t\tvcx\napplication/vnd.visio\t\t\t\tvsd vst vss vsw\napplication/vnd.visionary\t\t\tvis\napplication/vnd.vsf\t\t\t\tvsf\napplication/vnd.wap.wbxml\t\t\twbxml\napplication/vnd.wap.wmlc\t\t\twmlc\napplication/vnd.wap.wmlscriptc\t\t\twmlsc\napplication/vnd.webturbo\t\t\twtb\napplication/vnd.wolfram.player\t\t\tnbp\napplication/vnd.wordperfect\t\t\twpd\napplication/vnd.wqd\t\t\t\twqd\napplication/vnd.wt.stf\t\t\t\tstf\napplication/vnd.xara\t\t\t\txar\napplication/vnd.xfdl\t\t\t\txfdl\napplication/vnd.yamaha.hv-dic\t\t\thvd\napplication/vnd.yamaha.hv-script\t\thvs\napplication/vnd.yamaha.hv-voice\t\t\thvp\napplication/vnd.yamaha.openscoreformat\t\t\tosf\napplication/vnd.yamaha.openscoreformat.osfpvg+xml\tosfpvg\napplication/vnd.yamaha.smaf-audio\t\tsaf\napplication/vnd.yamaha.smaf-phrase\t\tspf\napplication/vnd.yellowriver-custom-menu\t\tcmp\napplication/vnd.zul\t\t\t\tzir zirz\napplication/vnd.zzazz.deck+xml\t\t\tzaz\napplication/voicexml+xml\t\t\tvxml\napplication/widget\t\t\t\twgt\napplication/winhlp\t\t\t\thlp\napplication/wsdl+xml\t\t\t\twsdl\napplication/wspolicy+xml\t\t\twspolicy\napplication/x-7z-compressed\t\t\t7z\napplication/x-abiword\t\t\t\tabw\napplication/x-ace-compressed\t\t\tace\napplication/x-apple-diskimage\t\t\tdmg\napplication/x-authorware-bin\t\t\taab x32 u32 vox\napplication/x-authorware-map\t\t\taam\napplication/x-authorware-seg\t\t\taas\napplication/x-bcpio\t\t\t\tbcpio\napplication/x-bittorrent\t\t\ttorrent\napplication/x-blorb\t\t\t\tblb blorb\napplication/x-bzip\t\t\t\tbz\napplication/x-bzip2\t\t\t\tbz2 boz\napplication/x-cbr\t\t\t\tcbr cba cbt cbz cb7\napplication/x-cdlink\t\t\t\tvcd\napplication/x-cfs-compressed\t\t\tcfs\napplication/x-chat\t\t\t\tchat\napplication/x-chess-pgn\t\t\t\tpgn\napplication/x-conference\t\t\tnsc\napplication/x-cpio\t\t\t\tcpio\napplication/x-csh\t\t\t\tcsh\napplication/x-debian-package\t\t\tdeb udeb\napplication/x-dgc-compressed\t\t\tdgc\napplication/x-director\t\t\tdir dcr dxr cst cct cxt w3d fgd swa\napplication/x-doom\t\t\t\twad\napplication/x-dtbncx+xml\t\t\tncx\napplication/x-dtbook+xml\t\t\tdtb\napplication/x-dtbresource+xml\t\t\tres\napplication/x-dvi\t\t\t\tdvi\napplication/x-envoy\t\t\t\tevy\napplication/x-eva\t\t\t\teva\napplication/x-font-bdf\t\t\t\tbdf\napplication/x-font-ghostscript\t\t\tgsf\napplication/x-font-linux-psf\t\t\tpsf\napplication/x-font-pcf\t\t\t\tpcf\napplication/x-font-snf\t\t\t\tsnf\napplication/x-font-type1\t\t\tpfa pfb pfm afm\napplication/x-freearc\t\t\t\tarc\napplication/x-futuresplash\t\t\tspl\napplication/x-gca-compressed\t\t\tgca\napplication/x-glulx\t\t\t\tulx\napplication/x-gnumeric\t\t\t\tgnumeric\napplication/x-gramps-xml\t\t\tgramps\napplication/x-gtar\t\t\t\tgtar\napplication/x-hdf\t\t\t\thdf\napplication/x-install-instructions\t\tinstall\napplication/x-iso9660-image\t\t\tiso\napplication/x-java-jnlp-file\t\t\tjnlp\napplication/x-latex\t\t\t\tlatex\napplication/x-lzh-compressed\t\t\tlzh lha\napplication/x-mie\t\t\t\tmie\napplication/x-mobipocket-ebook\t\t\tprc mobi\napplication/x-ms-application\t\t\tapplication\napplication/x-ms-shortcut\t\t\tlnk\napplication/x-ms-wmd\t\t\t\twmd\napplication/x-ms-wmz\t\t\t\twmz\napplication/x-ms-xbap\t\t\t\txbap\napplication/x-msaccess\t\t\t\tmdb\napplication/x-msbinder\t\t\t\tobd\napplication/x-mscardfile\t\t\tcrd\napplication/x-msclip\t\t\t\tclp\napplication/x-msdownload\t\t\texe dll com bat msi\napplication/x-msmediaview\t\t\tmvb m13 m14\napplication/x-msmetafile\t\t\twmf wmz emf emz\napplication/x-msmoney\t\t\t\tmny\napplication/x-mspublisher\t\t\tpub\napplication/x-msschedule\t\t\tscd\napplication/x-msterminal\t\t\ttrm\napplication/x-mswrite\t\t\t\twri\napplication/x-netcdf\t\t\t\tnc cdf\napplication/x-nzb\t\t\t\tnzb\napplication/x-pkcs12\t\t\t\tp12 pfx\napplication/x-pkcs7-certificates\t\tp7b spc\napplication/x-pkcs7-certreqresp\t\t\tp7r\napplication/x-rar-compressed\t\t\trar\napplication/x-research-info-systems\t\tris\napplication/x-sh\t\t\t\tsh\napplication/x-shar\t\t\t\tshar\napplication/x-shockwave-flash\t\t\tswf\napplication/x-silverlight-app\t\t\txap\napplication/x-sql\t\t\t\tsql\napplication/x-stuffit\t\t\t\tsit\napplication/x-stuffitx\t\t\t\tsitx\napplication/x-subrip\t\t\t\tsrt\napplication/x-sv4cpio\t\t\t\tsv4cpio\napplication/x-sv4crc\t\t\t\tsv4crc\napplication/x-t3vm-image\t\t\tt3\napplication/x-tads\t\t\t\tgam\napplication/x-tar\t\t\t\ttar\napplication/x-tcl\t\t\t\ttcl\napplication/x-tex\t\t\t\ttex\napplication/x-tex-tfm\t\t\t\ttfm\napplication/x-texinfo\t\t\t\ttexinfo texi\napplication/x-tgif\t\t\t\tobj\napplication/x-ustar\t\t\t\tustar\napplication/x-wais-source\t\t\tsrc\napplication/x-x509-ca-cert\t\t\tder crt\napplication/x-xfig\t\t\t\tfig\napplication/x-xliff+xml\t\t\t\txlf\napplication/x-xpinstall\t\t\t\txpi\napplication/x-xz\t\t\t\txz\napplication/x-zmachine\t\t\t\tz1 z2 z3 z4 z5 z6 z7 z8\napplication/xaml+xml\t\t\t\txaml\napplication/xcap-diff+xml\t\t\txdf\napplication/xenc+xml\t\t\t\txenc\napplication/xhtml+xml\t\t\t\txhtml xht\napplication/xml\t\t\t\t\txml xsl\napplication/xml-dtd\t\t\t\tdtd\napplication/xop+xml\t\t\t\txop\napplication/xproc+xml\t\t\t\txpl\napplication/xslt+xml\t\t\t\txslt\napplication/xspf+xml\t\t\t\txspf\napplication/xv+xml\t\t\t\tmxml xhvml xvml xvm\napplication/yang\t\t\t\tyang\napplication/yin+xml\t\t\t\tyin\napplication/zip\t\t\t\t\tzip\naudio/adpcm\t\t\t\t\tadp\naudio/basic\t\t\t\t\tau snd\naudio/midi\t\t\t\t\tmid midi kar rmi\naudio/mp4\t\t\t\t\tm4a mp4a\naudio/mpeg\t\t\t\t\tmpga mp2 mp2a mp3 m2a m3a\naudio/ogg\t\t\t\t\toga ogg spx\naudio/s3m\t\t\t\t\ts3m\naudio/silk\t\t\t\t\tsil\naudio/vnd.dece.audio\t\t\t\tuva uvva\naudio/vnd.digital-winds\t\t\t\teol\naudio/vnd.dra\t\t\t\t\tdra\naudio/vnd.dts\t\t\t\t\tdts\naudio/vnd.dts.hd\t\t\t\tdtshd\naudio/vnd.lucent.voice\t\t\t\tlvp\naudio/vnd.ms-playready.media.pya\t\tpya\naudio/vnd.nuera.ecelp4800\t\t\tecelp4800\naudio/vnd.nuera.ecelp7470\t\t\tecelp7470\naudio/vnd.nuera.ecelp9600\t\t\tecelp9600\naudio/vnd.rip\t\t\t\t\trip\naudio/webm\t\t\t\t\tweba\naudio/x-aac\t\t\t\t\taac\naudio/x-aiff\t\t\t\t\taif aiff aifc\naudio/x-caf\t\t\t\t\tcaf\naudio/x-flac\t\t\t\t\tflac\naudio/x-matroska\t\t\t\tmka\naudio/x-mpegurl\t\t\t\t\tm3u\naudio/x-ms-wax\t\t\t\t\twax\naudio/x-ms-wma\t\t\t\t\twma\naudio/x-pn-realaudio\t\t\t\tram ra\naudio/x-pn-realaudio-plugin\t\t\trmp\naudio/x-wav\t\t\t\t\twav\naudio/xm\t\t\t\t\txm\nchemical/x-cdx\t\t\t\t\tcdx\nchemical/x-cif\t\t\t\t\tcif\nchemical/x-cmdf\t\t\t\t\tcmdf\nchemical/x-cml\t\t\t\t\tcml\nchemical/x-csml\t\t\t\t\tcsml\nchemical/x-xyz\t\t\t\t\txyz\nfont/collection\t\t\t\t\tttc\nfont/otf\t\t\t\t\totf\nfont/ttf\t\t\t\t\tttf\nfont/woff\t\t\t\t\twoff\nfont/woff2\t\t\t\t\twoff2\nimage/bmp\t\t\t\t\tbmp\nimage/cgm\t\t\t\t\tcgm\nimage/g3fax\t\t\t\t\tg3\nimage/gif\t\t\t\t\tgif\nimage/ief\t\t\t\t\tief\nimage/jpeg\t\t\t\t\tjpeg jpg jpe\nimage/ktx\t\t\t\t\tktx\nimage/png\t\t\t\t\tpng\nimage/prs.btif\t\t\t\t\tbtif\nimage/sgi\t\t\t\t\tsgi\nimage/svg+xml\t\t\t\t\tsvg svgz\nimage/tiff\t\t\t\t\ttiff tif\nimage/vnd.adobe.photoshop\t\t\tpsd\nimage/vnd.dece.graphic\t\t\t\tuvi uvvi uvg uvvg\nimage/vnd.djvu\t\t\t\t\tdjvu djv\nimage/vnd.dvb.subtitle\t\t\t\tsub\nimage/vnd.dwg\t\t\t\t\tdwg\nimage/vnd.dxf\t\t\t\t\tdxf\nimage/vnd.fastbidsheet\t\t\t\tfbs\nimage/vnd.fpx\t\t\t\t\tfpx\nimage/vnd.fst\t\t\t\t\tfst\nimage/vnd.fujixerox.edmics-mmr\t\t\tmmr\nimage/vnd.fujixerox.edmics-rlc\t\t\trlc\nimage/vnd.ms-modi\t\t\t\tmdi\nimage/vnd.ms-photo\t\t\t\twdp\nimage/vnd.net-fpx\t\t\t\tnpx\nimage/vnd.wap.wbmp\t\t\t\twbmp\nimage/vnd.xiff\t\t\t\t\txif\nimage/webp\t\t\t\t\twebp\nimage/x-3ds\t\t\t\t\t3ds\nimage/x-cmu-raster\t\t\t\tras\nimage/x-cmx\t\t\t\t\tcmx\nimage/x-freehand\t\t\t\tfh fhc fh4 fh5 fh7\nimage/x-icon\t\t\t\t\tico\nimage/x-mrsid-image\t\t\t\tsid\nimage/x-pcx\t\t\t\t\tpcx\nimage/x-pict\t\t\t\t\tpic pct\nimage/x-portable-anymap\t\t\t\tpnm\nimage/x-portable-bitmap\t\t\t\tpbm\nimage/x-portable-graymap\t\t\tpgm\nimage/x-portable-pixmap\t\t\t\tppm\nimage/x-rgb\t\t\t\t\trgb\nimage/x-tga\t\t\t\t\ttga\nimage/x-xbitmap\t\t\t\t\txbm\nimage/x-xpixmap\t\t\t\t\txpm\nimage/x-xwindowdump\t\t\t\txwd\nmessage/rfc822\t\t\t\t\teml mime\nmodel/iges\t\t\t\t\tigs iges\nmodel/mesh\t\t\t\t\tmsh mesh silo\nmodel/vnd.collada+xml\t\t\t\tdae\nmodel/vnd.dwf\t\t\t\t\tdwf\nmodel/vnd.gdl\t\t\t\t\tgdl\nmodel/vnd.gtw\t\t\t\t\tgtw\nmodel/vnd.mts\t\t\t\t\tmts\nmodel/vnd.vtu\t\t\t\t\tvtu\nmodel/vrml\t\t\t\t\twrl vrml\nmodel/x3d+binary\t\t\t\tx3db x3dbz\nmodel/x3d+vrml\t\t\t\t\tx3dv x3dvz\nmodel/x3d+xml\t\t\t\t\tx3d x3dz\ntext/cache-manifest\t\t\t\tappcache\ntext/calendar\t\t\t\t\tics ifb\ntext/css\t\t\t\t\tcss\ntext/csv\t\t\t\t\tcsv\ntext/html\t\t\t\t\thtml htm\ntext/n3\t\t\t\t\t\tn3\ntext/plain\t\t\t\t\ttxt text conf def list log in\ntext/prs.lines.tag\t\t\t\tdsc\ntext/richtext\t\t\t\t\trtx\ntext/sgml\t\t\t\t\tsgml sgm\ntext/tab-separated-values\t\t\ttsv\ntext/troff\t\t\t\t\tt tr roff man me ms\ntext/turtle\t\t\t\t\tttl\ntext/uri-list\t\t\t\t\turi uris urls\ntext/vcard\t\t\t\t\tvcard\ntext/vnd.curl\t\t\t\t\tcurl\ntext/vnd.curl.dcurl\t\t\t\tdcurl\ntext/vnd.curl.mcurl\t\t\t\tmcurl\ntext/vnd.curl.scurl\t\t\t\tscurl\ntext/vnd.dvb.subtitle\t\t\t\tsub\ntext/vnd.fly\t\t\t\t\tfly\ntext/vnd.fmi.flexstor\t\t\t\tflx\ntext/vnd.graphviz\t\t\t\tgv\ntext/vnd.in3d.3dml\t\t\t\t3dml\ntext/vnd.in3d.spot\t\t\t\tspot\ntext/vnd.sun.j2me.app-descriptor\t\tjad\ntext/vnd.wap.wml\t\t\t\twml\ntext/vnd.wap.wmlscript\t\t\t\twmls\ntext/x-asm\t\t\t\t\ts asm\ntext/x-c\t\t\t\t\tc cc cxx cpp h hh dic\ntext/x-fortran\t\t\t\t\tf for f77 f90\ntext/x-java-source\t\t\t\tjava\ntext/x-nfo\t\t\t\t\tnfo\ntext/x-opml\t\t\t\t\topml\ntext/x-pascal\t\t\t\t\tp pas\ntext/x-setext\t\t\t\t\tetx\ntext/x-sfv\t\t\t\t\tsfv\ntext/x-uuencode\t\t\t\t\tuu\ntext/x-vcalendar\t\t\t\tvcs\ntext/x-vcard\t\t\t\t\tvcf\nvideo/3gpp\t\t\t\t\t3gp\nvideo/3gpp2\t\t\t\t\t3g2\nvideo/h261\t\t\t\t\th261\nvideo/h263\t\t\t\t\th263\nvideo/h264\t\t\t\t\th264\nvideo/jpeg\t\t\t\t\tjpgv\nvideo/jpm\t\t\t\t\tjpm jpgm\nvideo/mj2\t\t\t\t\tmj2 mjp2\nvideo/mp4\t\t\t\t\tmp4 mp4v mpg4\nvideo/mpeg\t\t\t\t\tmpeg mpg mpe m1v m2v\nvideo/ogg\t\t\t\t\togv\nvideo/quicktime\t\t\t\t\tqt mov\nvideo/vnd.dece.hd\t\t\t\tuvh uvvh\nvideo/vnd.dece.mobile\t\t\t\tuvm uvvm\nvideo/vnd.dece.pd\t\t\t\tuvp uvvp\nvideo/vnd.dece.sd\t\t\t\tuvs uvvs\nvideo/vnd.dece.video\t\t\t\tuvv uvvv\nvideo/vnd.dvb.file\t\t\t\tdvb\nvideo/vnd.fvt\t\t\t\t\tfvt\nvideo/vnd.mpegurl\t\t\t\tmxu m4u\nvideo/vnd.ms-playready.media.pyv\t\tpyv\nvideo/vnd.uvvu.mp4\t\t\t\tuvu uvvu\nvideo/vnd.vivo\t\t\t\t\tviv\nvideo/webm\t\t\t\t\twebm\nvideo/x-f4v\t\t\t\t\tf4v\nvideo/x-fli\t\t\t\t\tfli\nvideo/x-flv\t\t\t\t\tflv\nvideo/x-m4v\t\t\t\t\tm4v\nvideo/x-matroska\t\t\t\tmkv mk3d mks\nvideo/x-mng\t\t\t\t\tmng\nvideo/x-ms-asf\t\t\t\t\tasf asx\nvideo/x-ms-vob\t\t\t\t\tvob\nvideo/x-ms-wm\t\t\t\t\twm\nvideo/x-ms-wmv\t\t\t\t\twmv\nvideo/x-ms-wmx\t\t\t\t\twmx\nvideo/x-ms-wvx\t\t\t\t\twvx\nvideo/x-msvideo\t\t\t\t\tavi\nvideo/x-sgi-movie\t\t\t\tmovie\nvideo/x-smv\t\t\t\t\tsmv\nx-conference/x-cooltalk\t\t\t\tice\n";

const map = new Map();

mime_raw.split('\n').forEach((row) => {
	const match = /(.+?)\t+(.+)/.exec(row);
	if (!match) return;

	const type = match[1];
	const extensions = match[2].split(' ');

	extensions.forEach(ext => {
		map.set(ext, type);
	});
});

function lookup$1(file) {
	const match = /\.([^\.]+)$/.exec(file);
	return match && map.get(match[1]);
}

function middleware(opts


 = {}) {
	const { session, ignore } = opts;

	let emitted_basepath = false;

	return compose_handlers([
		ignore && ((req, res, next) => {
			req[IGNORE] = should_ignore(req.path, ignore);
			next();
		}),

		(req, res, next) => {
			if (req[IGNORE]) return next();

			if (req.baseUrl === undefined) {
				let { originalUrl } = req;
				if (req.url === '/' && originalUrl[originalUrl.length - 1] !== '/') {
					originalUrl += '/';
				}

				req.baseUrl = originalUrl
					? originalUrl.slice(0, -req.url.length)
					: '';
			}

			if (!emitted_basepath && process.send) {
				process.send({
					__sapper__: true,
					event: 'basepath',
					basepath: req.baseUrl
				});

				emitted_basepath = true;
			}

			if (req.path === undefined) {
				req.path = req.url.replace(/\?.*/, '');
			}

			next();
		},

		fs.existsSync(path.join(build_dir, 'service-worker.js')) && serve({
			pathname: '/service-worker.js',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		fs.existsSync(path.join(build_dir, 'service-worker.js.map')) && serve({
			pathname: '/service-worker.js.map',
			cache_control: 'no-cache, no-store, must-revalidate'
		}),

		serve({
			prefix: '/client/',
			cache_control: 'max-age=31536000, immutable'
		}),

		get_server_route_handler(manifest.server_routes),

		get_page_handler(manifest, session || noop$1)
	].filter(Boolean));
}

function compose_handlers(handlers) {
	return (req, res, next) => {
		let i = 0;
		function go() {
			const handler = handlers[i];

			if (handler) {
				handler(req, res, () => {
					i += 1;
					go();
				});
			} else {
				next();
			}
		}

		go();
	};
}

function should_ignore(uri, val) {
	if (Array.isArray(val)) return val.some(x => should_ignore(uri, x));
	if (val instanceof RegExp) return val.test(uri);
	if (typeof val === 'function') return val(uri);
	return uri.startsWith(val.charCodeAt(0) === 47 ? val : `/${val}`);
}

function serve({ prefix, pathname, cache_control }



) {
	const filter = pathname
		? (req) => req.path === pathname
		: (req) => req.path.startsWith(prefix);

	const cache = new Map();

	const read = (file) => (cache.has(file) ? cache : cache.set(file, fs.readFileSync(path.resolve(build_dir, file)))).get(file);

	return (req, res, next) => {
		if (req[IGNORE]) return next();

		if (filter(req)) {
			const type = lookup$1(req.path);

			try {
				const file = decodeURIComponent(req.path.slice(1));
				const data = read(file);

				res.setHeader('Content-Type', type);
				res.setHeader('Cache-Control', cache_control);
				res.end(data);
			} catch (err) {
				res.statusCode = 404;
				res.end('not found');
			}
		} else {
			next();
		}
	};
}

function noop$1(){}

const { PORT, NODE_ENV } = process.env;
const dev = NODE_ENV === 'development';

polka() // You can also use Express
	.use(
		compression({ threshold: 0 }),
		sirv('static', { dev }),
		middleware()
	)
	.listen(PORT, err => {
		if (err) console.log('error', err);
	});
//# sourceMappingURL=server.js.map
