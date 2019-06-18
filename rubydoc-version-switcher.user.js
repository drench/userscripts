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

RubyDoc.versions = [
  '2.6.3',
  '2.6.2',
  '2.6.1',
  '2.6',
  '2.5.3',
  '2.5.2',
  '2.5.1',
  '2.5.0',
  '2.4.5',
  '2.4.4',
  '2.4.3',
  '2.4.2',
  '2.4.1',
  '2.4.0',
  '2.3.8',
  '2.3.7',
  '2.3.6',
  '2.3.5',
  '2.3.4',
  '2.3.3',
  '2.3.2',
  '2.3.1',
  '2.3.0',
  '2.2.10',
  '2.2.9',
  '2.2.8',
  '2.2.7',
  '2.2.6',
  '2.2.5',
  '2.2.4',
  '2.2.3',
  '2.2.2',
  '2.2.1',
  '2.2.0',
  '2.1.10',
  '2.1.9',
  '2.1.8',
  '2.1.7',
  '2.1.6',
  '2.1.5',
  '2.1.4',
  '2.1.3',
  '2.1.2',
  '2.1.1',
  '2.1.0',
  '2.0.0',
  '1.9.2',
  '1.9.1',
  '1.8.7',
  '1.8.6'
];

var rubydoc = new RubyDoc(document);

var rd_action_search = document.querySelector('#rd-action-search');
if (!rd_action_search)
  return console.log('Cannot find the #rd-action-search element!');

document.body.appendChild(rubydoc.versions);

var input = document.createElement('input');
input.setAttribute('list', rubydoc.versions.id);
input.setAttribute('autocomplete', 'off');
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
