// ==UserScript==
// @name          Ruby Doc version switcher widget
// @description	  Adds a version-switcher widget to ruby-doc.org
// @include       https://ruby-doc.org/core-*
// @include       https://ruby-doc.org/stdlib-*
// ==/UserScript==

// class RubyDoc {
//   constructor(doc) {
//     this.doc = doc;
//     var pathmatch = this.pathname.match(/^\/(stdlib|core)-([1-9]\.[0-9\.]+)/);
//     this.category = pathmatch[1];
//     this.version = pathmatch[2];
//   }

//   get pathname() { return this.doc.location.pathname }
//   get page() { return this.pathname.replace(/^\/[^\/]+/, '') }

//   pageForVersion(number) {
//     if (RubyDoc.versions.includes(number))
//       return `/${this.category}-${number}${this.page}`;
//     else
//       return console.log(`${number} is not a Ruby version we know about`);
//   }

//   get versions () {
//     if (this.versionsDatalist) return this.versionsDatalist;

//     var doc = this.doc;
//     var dl = doc.createElement('datalist');
//     dl.setAttribute('id', 'ruby_versions');
//     RubyDoc.versions.forEach(function (version) {
//       var opt = doc.createElement('option');
//       opt.innerText = version;
//       dl.appendChild(opt);
//     });

//     this.versionsDatalist = dl;
//     return this.versionsDatalist;
//   }
// }

// RubyDoc.getVersions = async function() {
//   let current = sessionStorage.getItem('versions');
//   if (current) return JSON.parse(current);
//   let html = await (await fetch('/downloads/')).text();
//   let parser = new DOMParser();
//   let doc = parser.parseFromString(html, 'text/html');
//   current = Array.from(doc.querySelectorAll('h3'))
//     .map((e) => e.innerText)
//     .filter((t) => t.match(/^The .+ Base Distribution RDoc HTML$/))
//     .map((t) => t.replace(/^The (.+) Base.+$/, '$1'));
//   sessionStorage.setItem('versions', JSON.stringify(current));
//   return current;
// };

// RubyDoc.versions = await RubyDoc.getVersions();

// var rubydoc = new RubyDoc(document);

// var rd_action_search = document.querySelector('#rd-action-search');
// if (!rd_action_search)
//   return console.log('Cannot find the #rd-action-search element!');

// document.body.appendChild(rubydoc.versions);

// var input = document.createElement('input');
// input.setAttribute('list', rubydoc.versions.id);
// input.setAttribute('autocomplete', 'on');
// input.setAttribute('placeholder', 'Ruby version…');
// input.style.height = '1.3em';

// input.addEventListener('input', function (event) {
//   var number = event.target.value.replace(/\s+/g, '');
//   var newpath = rubydoc.pageForVersion(number);
//   if (newpath)
//     document.location.pathname = newpath;
// });

// var widget = document.createElement('li');
// widget.className = 'grid-2 right';
// widget.appendChild(input);

// rd_action_search.parentNode.insertBefore(widget, rd_action_search);

class RubyDocExtras {
  static setupClasses = [];
  static onSetup(klass) { RubyDocExtras.setupClasses.push(klass) }
  static setup(doc) { (new RubyDocExtras(doc)).setup() }

  constructor(win) { this.window = win }

  setup() {
    RubyDocExtras.setupClasses.forEach(cb => {
      (new cb(this.window)).setup()
    });
  }
}

// Make the "action bar" stick to the top of the page
class AnchorActionBar {
  constructor(win) {
    this.window = win;
    this.style = { position: "fixed", top: "0px", zIndex: "9999" };
  }

  get actionbar() { return this.window.document.getElementById("actionbar") }

  setup() {
    if (this.actionbar)
      for (let s in this.style) this.actionbar.style[s] = this.style[s];
    else
      console.warn("Cannot locate the #actionbar element", this);
  }
}
RubyDocExtras.onSetup(AnchorActionBar);

// Update the URL with the current anchor when scrolling
class UpdateUrlOnScroll {
  constructor(win) {
    this.window = win;
    this.currentAnchor = undefined;
  }

  get anchorElements() {
    return Array.from(this.window.document.querySelectorAll("a[name^=method-]"));
  }

  get topAnchors() {
    return(this
      .anchorElements
      .map(e => ({ "el": e, "top": e.getBoundingClientRect().top }))
      .sort(function (a, b) {
        if (a.top > b.top) return 1;
        if (a.top < b.top) return -1;
        return 0;
      })
      .filter(o => o.top > 0 && o.top < 200)
      .map(a => a.el)
    );
  }

  get topAnchor() { return this.topAnchors[0] }

  setup() {
    let self = this;
    let updateHeading = function() {
      if (self.topAnchor && self.currentAnchor != self.topAnchor) {
        self.currentAnchor = self.topAnchor;
        self.window.history.pushState(null, null, `#${self.currentAnchor.name}`);
      }
      else if (self.currentAnchor && self.window.scrollY == 0) {
        self.currentAnchor = undefined;
        self.window.history.pushState(
          null,
          null,
          self.window.location.pathname + self.window.location.search
        );
      }
    };

    this.window.addEventListener('scroll', updateHeading);
  }
}
RubyDocExtras.onSetup(UpdateUrlOnScroll);

// Link the "In Files" filenames to their source on Github
class LinkToRubySource {
  constructor(win) { this.window = win }

  get baseUrl() {
    return this._baseUrl ||= `https://github.com/ruby/ruby/tree/${this.versionTag}`;
  }

  get document() { return this.window.document }

  get versionTag() {
    let pathmatch = this.document.location.pathname.match(/^\/[a-z]+-([1-9]\.[0-9\.]+)/);
    let version = pathmatch[1];
    return `v${version.replace(/\./g, '_')}`;
  }

  get sourceElements() {
    return this.document.querySelectorAll('#file-metadata .in-file');
  }

  url(filename) {
    if (filename.endsWith('.c')) return `${this.baseUrl}/${filename}`;
    if (filename.endsWith('.rb')) return `${this.baseUrl}/lib/${filename}`;
  }

  createLinkInElement(element) {
    let href = this.url(element.innerText);
    if (!href) return;

    let a = this.document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.innerText = element.innerText;
    element.innerText = '';
    element.appendChild(a);
  }

  setup() { this.sourceElements.forEach(li => { this.createLinkInElement(li) }) }
}
RubyDocExtras.onSetup(LinkToRubySource);

RubyDocExtras.setup(window);
