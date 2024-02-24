// ==UserScript==
// @name          Ruby Doc Extras
// @description   Adds a version-switcher widget and other extras to ruby-doc.org
// @match         https://ruby-doc.org/*
// @run-at        document-idle
// @version       1.0.0
// ==/UserScript==

class RubyDocExtras {
  static setupClasses = [];
  static onSetup(klass) { RubyDocExtras.setupClasses.push(klass) }
  static setup(doc) { (new RubyDocExtras(doc)).setup() }

  constructor(win) { this.window = win }

  setup() {
    for (const callback of RubyDocExtras.setupClasses) {
      (new callback(this.window)).setup();
    }
  }
}

// Make the "action bar" stick to the top of the page
class AnchorActionBar {
  constructor(win) { this.document = win.document }

  setup() {
    const actionbar = this.document.getElementById("actionbar");
    const contentDiv = this.document.querySelector("div.wrapper.hdiv");

    if (actionbar && contentDiv) {
      Object.assign(actionbar.style, { position: "fixed", zIndex: "9999" });
      contentDiv.style.paddingTop = "32px";
    }
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
    return Array.from(this.window.document.querySelectorAll("div[id^=method-].method-detail"));
  }

  get topAnchors() {
    return(this
      .anchorElements
      .map(e => ({ "el": e, "top": e.getBoundingClientRect().top }))
      .sort((a, b) => {
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
    const self = this;
    const updateHeading = () => {
      if (self.topAnchor && self.currentAnchor != self.topAnchor) {
        self.currentAnchor = self.topAnchor;
        self.window.history.pushState(null, null, `#${self.currentAnchor.id}`);
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

class RubyVersionSelector {
  constructor(win) {
    this.document = win.document;
    this.currentVersion = this.document.location.pathname.split("/")[1];

    const v = new Set(RubyVersionSelector.versions);
    v.add(this.currentVersion);
    this.versions = Array.from(v).sort().reverse();
  }

  setup() {
    const doc = this.document;
    const versionLink = doc.querySelectorAll("#menubar li")[1];
    if (!versionLink) return;

    const li = this.document.createElement("li");
    const select = this.document.createElement("select");
    Object.assign(select.style, {
      backgroundColor: "#666",
      color: "#fff",
      border: "none",
      fontWeight: "bold",
      fontSize: "medium"
    });

    for (const version of this.versions) {
      const opt = doc.createElement("option");
      opt.innerText = version;
      select.appendChild(opt);
    }
    select.value = this.currentVersion;

    li.appendChild(select);

    select.addEventListener("change", () => {
      const urlParts = doc.location.href.split("/");
      urlParts[3] = select.value;
      doc.location.href = urlParts.join("/");
    });

    doc.getElementById("menubar").replaceChild(li, versionLink);
  }
}

RubyVersionSelector.fetchVersions = async (win) => {
  const storage = win.sessionStorage;
  let current = storage.getItem('ruby-versions');
  if (current) return JSON.parse(current);
  const html = await (await win.fetch('/')).text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  current = Array.from(doc.querySelector('ul.main').querySelectorAll('li span a'))
    .map(a => a.pathname.replace(/^\//, ""));

  storage.setItem('ruby-versions', JSON.stringify(current));
  return current;
}
RubyVersionSelector.versions = await RubyVersionSelector.fetchVersions(window);

RubyDocExtras.onSetup(RubyVersionSelector);

RubyDocExtras.setup(window);
