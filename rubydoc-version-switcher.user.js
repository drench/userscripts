// ==UserScript==
// @name          Ruby Doc version switcher widget
// @description	  Adds a version-switcher widget to ruby-doc.org
// @include       https://ruby-doc.org/*
// ==/UserScript==

class RubyDoc {
  constructor(doc) {
    this.doc = doc;
    var pathmatch = this.pathname.match(/^\/(stdlib|core)-([1-9]\.[0-9.]+[0-9])/);
    this.category = pathmatch[1];
    this.version = pathmatch[2];
  }

  get pathname() { return this.doc.location.pathname }
  get page() { return this.pathname.replace(/^\/[^\/]+/, '') }
  pageForVersion(number) { return `/${this.category}-${number}${this.page}` }

  changeVersion(number) {
    if (RubyDoc.versions.includes(number))
      this.doc.location.pathname = this.pageForVersion(number);
  }

  get versions () {
    if (this.versionsDatalist) return this.versionsDatalist;

    var dl = document.createElement('datalist');
    dl.setAttribute('id', 'ruby_versions');
    RubyDoc.versions.forEach(function (version) {
      var opt = document.createElement('option');
      opt.innerText = version;
      dl.appendChild(opt);
    });

    this.doc.body.appendChild(dl);
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
  '1.8.7',
  '1.8.6'
];

var rubydoc = new RubyDoc(document);

var input = document.createElement('input');
input.setAttribute('list', rubydoc.versions.id);
input.setAttribute('autocomplete', 'off');
input.setAttribute('placeholder', 'Ruby version');

input.addEventListener('change', function (event) {
  rubydoc.changeVersion(event.target.value);
});

var widget = document.createElement('li');
widget.className = 'grid-2 right';
widget.appendChild(input);

var rd_action_search = document.querySelector('#rd-action-search');
rd_action_search.parentNode.insertBefore(widget, rd_action_search);