// ==UserScript==
// @name          Ruby Doc version switcher widget
// @description	  Adds a version-switcher widget to ruby-doc.org
// @include       https://ruby-doc.org/core-*
// @include       https://ruby-doc.org/stdlib-*
// ==/UserScript==

class RubyDoc {
  constructor(doc) {
    this.doc = doc;
    var pathmatch = this.pathname.match(/^\/(stdlib|core)-([1-9]\.[0-9\.]+)/);
    this.category = pathmatch[1];
    this.version = pathmatch[2];
  }

  get pathname() { return this.doc.location.pathname }
  get page() { return this.pathname.replace(/^\/[^\/]+/, '') }

  pageForVersion(number) {
    if (RubyDoc.versions.includes(number))
      return `/${this.category}-${number}${this.page}`;
    else
      return console.log(`${number} is not a Ruby version we know about`);
  }

  get versions () {
    if (this.versionsDatalist) return this.versionsDatalist;

    var doc = this.doc;
    var dl = doc.createElement('datalist');
    dl.setAttribute('id', 'ruby_versions');
    RubyDoc.versions.forEach(function (version) {
      var opt = doc.createElement('option');
      opt.innerText = version;
      dl.appendChild(opt);
    });

    this.versionsDatalist = dl;
    return this.versionsDatalist;
  }
}

RubyDoc.getVersions = async function() {
  let current = sessionStorage.getItem('versions');
  if (current) return JSON.parse(current);
  let html = await (await fetch('/downloads/')).text();
  let parser = new DOMParser();
  let doc = parser.parseFromString(html, 'text/html');
  current = Array.from(doc.querySelectorAll('h3'))
    .map((e) => e.innerText)
    .filter((t) => t.match(/^The .+ Base Distribution RDoc HTML$/))
    .map((t) => t.replace(/^The (.+) Base.+$/, '$1'));
  sessionStorage.setItem('versions', JSON.stringify(current));
  return current;
};

RubyDoc.versions = await RubyDoc.getVersions();

var rubydoc = new RubyDoc(document);

var rd_action_search = document.querySelector('#rd-action-search');
if (!rd_action_search)
  return console.log('Cannot find the #rd-action-search element!');

document.body.appendChild(rubydoc.versions);

var input = document.createElement('input');
input.setAttribute('list', rubydoc.versions.id);
input.setAttribute('autocomplete', 'on');
input.setAttribute('placeholder', 'Ruby version…');
input.style.height = '1.3em';

input.addEventListener('change', function (event) {
  var number = event.target.value.replace(/\s+/g, '');
  var newpath = rubydoc.pageForVersion(number);
  if (newpath)
    document.location.pathname = newpath;
});

var widget = document.createElement('li');
widget.className = 'grid-2 right';
widget.appendChild(input);

rd_action_search.parentNode.insertBefore(widget, rd_action_search);

var actionbar = document.querySelector('#actionbar');
if (actionbar) {
  actionbar.style.position = 'fixed';
  actionbar.style.top = '0px';
  actionbar.style.zIndex = '9999';
}

var anchorElements = Array.from(document.querySelectorAll('a[name^=method-]'));
var currentAnchor = undefined;
var topAnchors = function() {
  return anchorElements.
      map(e => ({ "el": e, "top": e.getBoundingClientRect().top })).
      sort(function (a, b) {
        if (a.top > b.top)
          return 1;
        if (a.top < b.top)
          return -1;
        return 0;
      }).
      filter(o => o.top > 0 && o.top < 200).
      map(a => a.el);
};

var updateHeading = function() {
  var topAnchor = topAnchors()[0];
  if (topAnchor && currentAnchor != topAnchor) {
    currentAnchor = topAnchor;
    history.pushState(null, null, `#${currentAnchor.name}`);
  }
  else if (currentAnchor && window.scrollY == 0) {
    currentAnchor = undefined;
    history.pushState(null, null, window.location.pathname + window.location.search);
  }
};

window.addEventListener('scroll', updateHeading);

document.querySelectorAll('#file-metadata .in-file').forEach(function (li) {
  var tag = `v${rubydoc.version.replace(/\./g, '_')}`;
  var baseUrl = `https://github.com/ruby/ruby/tree/${tag}`;
  var url;

  if (li.innerText.match(/\.rb$/)) {
    url = `${baseUrl}/lib/${li.innerText}`;
  }
  else if (li.innerText.match(/\.c$/)) {
    url = `${baseUrl}/${li.innerText}`;
  }
  else
    return;

  var a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.innerText = li.innerText;
  li.innerText = '';
  li.appendChild(a);
});
