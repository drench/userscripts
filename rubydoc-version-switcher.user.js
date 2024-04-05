// ==UserScript==
// @name          Ruby Doc Extras
// @description   Adds a version-switcher widget and other extras to ruby-doc.org
// @match         https://ruby-doc.org/*
// @match         https://docs.ruby-lang.org/*
// @run-at        document-idle
// @version       1.0.2
// ==/UserScript==

const RubyDocExtras = {
  setupFunctions: [],
  onSetup(klass) { this.setupFunctions.push(klass) },
  setup(win) {
    for (const fn of this.setupFunctions) {
      fn.setup.bind(win).call();
    }
  }
};

// Make the "action bar" stick to the top of the page
const AnchorActionBar = {
  setup() {
    const actionbar = this.document.getElementById("actionbar");
    const contentDiv = this.document.querySelector("div.wrapper.hdiv");

    if (actionbar && contentDiv) {
      Object.assign(actionbar.style, { position: "fixed", zIndex: "9999" });
      contentDiv.style.paddingTop = "32px";
    }
  }
};
RubyDocExtras.onSetup(AnchorActionBar);

// If we're on an outdated (old style) doc page, add a link to the current page
const LinkToUpdatedDocs = {
  setup() {
    const doc = this.document;
    const url = new URL(doc.location.href)
    if (url.pathname.indexOf("/core-") != 0) return;

    const actionbar = doc.querySelector("div#actionbar ul.grids.g0");
    if (!actionbar) return;

    const li = doc.createElement("li");
    li.className = "grid-2";
    const link = doc.createElement("a");
    link.innerText = "Current";
    url.pathname = url.pathname.replace("^/core-.+/", "/core/");
    link.href = url.toString();
    li.appendChild(link);
    actionbar.appendChild(li);
  }
};
RubyDocExtras.onSetup(LinkToUpdatedDocs);

// Update the URL with the current anchor when scrolling
class UpdateUrlOnScroll {
  constructor(win) {
    this.window = win;
    this.currentAnchor = undefined;
  }

  get topAnchors() {
    const anchorElements = Array.from(this.window.document.querySelectorAll("div.method-detail"));

    return(anchorElements
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

  static setup() {
    (new UpdateUrlOnScroll(this)).setup();
  };

  setup() {
    const updateHeading = function () {
      const topAnchor = this.topAnchors[0];

      if (topAnchor && this.currentAnchor != topAnchor) {
        this.currentAnchor = topAnchor;
        this.window.history.pushState(null, null, `#${this.currentAnchor.id}`);
      }
      else if (this.currentAnchor && this.window.scrollY == 0) {
        this.currentAnchor = undefined;
        this.window.history.pushState(
          null,
          null,
          this.window.location.pathname + this.window.location.search
        );
      }
    };

    this.window.addEventListener('scroll', updateHeading.bind(this));
  }
}
RubyDocExtras.onSetup(UpdateUrlOnScroll);

const ScrollToAnchor = {
  setup() {
    const anchorId = this.location.hash.slice(1);
    if (anchorId.length == 0) return;
    const anchor = this.document.getElementById(anchorId);
    if (! anchor) return;
    anchor.scrollIntoView();
    this.scrollByLines(-3);
  }
};
RubyDocExtras.onSetup(ScrollToAnchor);

const RubyVersionSelector = {
  setup() {
    const doc = this.document;
    const versionLink = doc.querySelectorAll("#menubar li")[1];
    if (!versionLink) return;

    const currentVersion = doc.location.pathname.split("/")[1];

    const versionSet = new Set(RubyVersionSelector.versions);
    versionSet.add(currentVersion);
    const versions = Array.from(versionSet).sort().reverse();

    const li = doc.createElement("li");
    const select = doc.createElement("select");
    Object.assign(select.style, {
      backgroundColor: "#666",
      color: "#fff",
      border: "none",
      fontWeight: "bold",
      fontSize: "medium"
    });

    for (const version of versions) {
      const opt = doc.createElement("option");
      opt.innerText = version;
      select.appendChild(opt);
    }
    select.value = currentVersion;

    li.appendChild(select);

    select.addEventListener("change", () => {
      const urlParts = doc.location.href.split("/");
      urlParts[3] = select.value;
      doc.location.href = urlParts.join("/");
    });

    doc.getElementById("menubar").replaceChild(li, versionLink);
  }
};

const fetchVersions = async (win) => {
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

if (document.location.hostname == "ruby-doc.org") {
  RubyVersionSelector.versions = await fetchVersions(window);
}

RubyDocExtras.onSetup(RubyVersionSelector);

RubyDocExtras.setup(window);
