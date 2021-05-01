// ==UserScript==
// @name          Ruby Doc Extras
// @description   Adds a version-switcher widget and other extras to ruby-doc.org
// @include       https://ruby-doc.org/core-*
// @include       https://ruby-doc.org/stdlib-*
// ==/UserScript==

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
    if (filename.endsWith('.c') || filename.endsWith('.y'))
      return `${this.baseUrl}/${filename}`;
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

class RubyVersionSelector {
  constructor(win) {
    this.document = win.document;
    let pathmatch = this.location.pathname.match(/^\/(stdlib|core)-/);
    this.category = pathmatch[1];
  }

  get location() { return this.document.location }
  get page() { return this.location.pathname.replace(/^\/[^\/]+/, '') }

  get searchBox() {
    return this.document.getElementById('rd-action-search');
  }

  get versionSelector() {
    if (!this._versionSelector) {
      let input = this.document.createElement('input');
      input.setAttribute('list', this.versionsDataList.id);
      input.setAttribute('autocomplete', 'on');
      input.setAttribute('placeholder', 'Ruby version…');
      input.style.height = '1.3em';
      this._versionSelector = input;
    }
    return this._versionSelector;
  }

  get versionsDataList() {
    if (!this._versionsDataList) {
      let dl = this.document.createElement('datalist');
      dl.setAttribute('id', 'ruby_versions');
      let doc = this.document;
      RubyVersionSelector.versions.forEach(function(version) {
        let opt = doc.createElement('option');
        opt.innerText = version;
        dl.appendChild(opt);
      });
      this._versionsDataList = dl;
    }
    return this._versionsDataList;
  }

  pageForVersion(number) {
    if (RubyVersionSelector.versions.includes(number))
      return `/${this.category}-${number}${this.page}`;
    else
      console.log(`${number} is not a Ruby version we know about.`);
  }

  setup() {
    this.document.body.appendChild(this.versionsDataList);
    let self = this;
    this.versionSelector.addEventListener('input', function (event) {
      let number = event.target.value.replace(/\s+/g, '');
      let newpath = self.pageForVersion(number);
      if (newpath) self.location.pathname = newpath;
    });

    let widget = this.document.createElement('li');
    widget.className = 'grid-2 right';
    widget.appendChild(this.versionSelector);
    this.searchBox.parentNode.insertBefore(widget, this.searchBox);
  }
}

RubyVersionSelector.fetchVersions = async function(win) {
  let storage = win.sessionStorage;
  let current = storage.getItem('ruby-versions');
  if (current) return JSON.parse(current);
  let html = await (await win.fetch('/downloads/')).text();
  let parser = new DOMParser();
  let doc = parser.parseFromString(html, 'text/html');
  current = Array.from(doc.querySelectorAll('h3'))
    .map((e) => e.innerText)
    .filter((t) => t.match(/^The .+ Base Distribution RDoc HTML$/))
    .map((t) => t.replace(/^The (.+) Base.+$/, '$1'));

  storage.setItem('ruby-versions', JSON.stringify(current));
  return current;
}
RubyVersionSelector.versions = await RubyVersionSelector.fetchVersions(window);

RubyDocExtras.onSetup(RubyVersionSelector);

RubyDocExtras.setup(window);
