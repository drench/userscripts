// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
// @author      Daniel Rench
// @supportURL  https://github.com/drench/userscripts
// @match       https://www.findagrave.com/memorial/*/*
// @run-at      document-idle
// @version     1.0.2
// ==/UserScript==

class FindAGraveMemorial {
  static setupCallbacks = [];
  static onSetup(callback) { FindAGraveMemorial.setupCallbacks.push(callback) }

  constructor(win) {
    this.clipboard = win.navigator.clipboard;
    this.document = win.document;
  }

  setup() {
    if (this.memorialId) {
      for (const callback of FindAGraveMemorial.setupCallbacks) {
        callback(this);
      }
    }
  }

  get findagrave() { return this.document.findagrave }

  // A helper to create a button (actually a specially-styled <a> element) with
  // arbitrary attributes.
  createButton(opt) {
    opt ??= {};

    const attr = Object.assign({
      className: 'btn btn-dark border-darker btn-sm text-uppercase ml-2',
      style: {},
      target: '_blank',
      type: 'button'
    }, opt);
    attr.style.marginInline ??= '3px';

    return Object.assign(this.document.createElement('a'), attr);
  }

  // A helper that returns `findagrave` property elements "nicely" by returning
  // a string trimmed of whitespace, or an empty string if the property does not
  // exist, or if the property value is not a string.
  getPropertyPresence(property) {
    if (!this.isValid()) return '';
    if (!this.findagrave.hasOwnProperty(property)) return '';
    if (typeof(this.findagrave[property]) != 'string') return '';
    return this.findagrave[property].trim();
  }

  // If there is no `findagrave` object, everything breaks.
  // Check the result of this method before trying anything.
  isValid() { return !!this.findagrave }

  // Returns the birthplace as a string, if it's available.
  // If it's not, it returns a falsy value.
  get birthPlace() {
    const birthLocationLabel = this.document.getElementById('birthLocationLabel');
    return birthLocationLabel?.innerText;
  }

  // Returns the birth year as an integer
  get birthYear() { return parseInt(this.findagrave.birthYear, 10) }

  // Returns the page element containing the buttons ("SHARE", "SAVE TO", etc.)
  get buttonContainer() {
    return this.document.querySelector(".mb-3.d-flex.d-print-none");
  }

  // Returns the place of death as a string, if it's available.
  // If it's not, it returns a falsy value.
  get deathPlace() {
    const deathLocationLabel = this.document.getElementById('deathLocationLabel');
    return deathLocationLabel?.innerText;
  }

  // Returns the death year as an integer
  get deathYear() { return parseInt(this.findagrave.deathYear, 10) }

  // Returns the first name as a string, or an empty string if it's not available.
  get firstName() { return this.getPropertyPresence('firstName') }

  // Returns the last name as a string, or an empty string if it's not available.
  get lastName() { return this.getPropertyPresence('lastName') }

  // Returns the last name at birth, if there's a maidenName available.
  // Otherwise, it returns the lastName. This of course may not be the actual
  // birth name, but it's the best we can do.
  get lastNameAtBirth() { return this.maidenName ?? this.lastName }

  // Returns what we believe to the the last name at death, which we are
  // assuming is the same as the lastName (it's the best guess we've got).
  get lastNameAtDeath() { return this.lastName }

  // This returns the first potential surname that isn't the same as lastName,
  // or a falsy value if we can't find one. This tends to be the maiden name
  // for women, but it's not guaranteed.
  get maidenName() {
    return this.potentialSurnames.find(n => n && n != this.lastName)
  }

  // The page has a list of search links of potentially related people, and
  // this returns those elements.
  get seeMoreMemorialLinks() {
    return(this.document
      .getElementsByClassName('see-more')[0]
      .parentElement.querySelectorAll('a[href^="/memorial/search?"]'));
  }

  // Using the list of links to possible relatives, this scrapes the last names
  // from those elements and returns a unique array of them.
  get potentialSurnames() {
    return(this._potentialSurnames ??=
      Array.from(
        new Set(
          Array.from(this.seeMoreMemorialLinks)
            .map(a => (new URL(a).searchParams.get("lastname")))
        )
      )
    );
  }

  // Returns the element containing the memorial ID number
  get memorialElement() {
    return this.document.getElementById("memNumberLabel");
  }

  // Returns the memorial ID for this grave
  get memorialId() {
    return parseInt(this.getPropertyPresence('memorialId'), 10);
  }
}

FindAGraveMemorial.onSetup(findagrave => {
  // This adds an event on every infoItem element to copy that info
  // to the clipboard when clicked. For example, this makes it so when clicking
  // the death date, it copies that date (in "DD Mon YYYY" format) to the clipboard.

  // infoItems are elements on the page that have an "itemprop"
  // attribute that has a corresponding `findagrave` object property
  const elements = findagrave.document.querySelectorAll('.mem-events *[itemprop]');
  const infoItems = Array.from(elements).filter(el => {
    return findagrave.hasOwnProperty(el.getAttribute('itemprop'));
  });

  for (const element of infoItems) {
    element.addEventListener("click", event => {
      const val = findagrave[element.getAttribute("itemprop")];
      findagrave.clipboard.writeText(val);
    });
    element.setAttribute("title", "click to copy");
    element.style.cursor = "pointer";
  }
});

FindAGraveMemorial.onSetup(findagrave => {
  // This turns the memorial ID element into a link that will search for this
  // FindAGrave record on FamilySearch.

  const memorialElement = findagrave.memorialElement;

  if (!memorialElement) {
    return console.debug("Add FamilySearch FindAGrave Link: no memorialElement");
  }

  const rootUrl = "https://www.familysearch.org/search/record/results";
  const query = [
    `q.externalRecordId=${findagrave.memorialId}`,
    "f.collectionId=2221801"
  ].join("&");

  const link = Object.assign(
    findagrave.document.createElement("a"), {
      className: 'add-link',
      href: `${rootUrl}?${query}`,
      innerText: findagrave.memorialId,
      target: '_blank',
      title: "Look up this grave on FamilySearch"
    }
  );

  memorialElement.innerHTML = "";
  memorialElement.classList.remove("hidden");
  memorialElement.nextElementSibling.classList.add("hidden");

  return memorialElement.appendChild(link);
});

FindAGraveMemorial.onSetup(findagrave => {
  // This adds a "RECORD SEARCH" button to the page.
  // When clicked, it sends a record search query to FamilySearch (as opposed
  // to a tree search; see addFamilySearchTreeButton for that).

  if (!findagrave.buttonContainer) {
    return console.debug("Add FamilySearch Record Button: no buttonContainer");
  }

  const button = findagrave.createButton({
    href: FamilySearchQuery("search/record/results", findagrave).url,
    innerText: "Record Search",
    title: "Check FamilySearch records"
  });

  return findagrave.buttonContainer.appendChild(button);
});

FindAGraveMemorial.onSetup(findagrave => {
  // This adds a "TREE SEARCH" button to the page.
  // When clicked, it sends a tree search query to FamilySearch (as opposed to a
  // record search; see addFamilySearchRecordButton for that).

  if (!findagrave.buttonContainer) {
    return console.debug("Add FamilySearch Tree Button: no buttonContainer");
  }

  const button = findagrave.createButton({
    href: FamilySearchQuery("search/tree/results", findagrave).url,
    innerText: 'Tree Search',
    title: 'Check FamilySearch trees'
  });

  return findagrave.buttonContainer.appendChild(button);
});

// This builds FamilySearch queries using a FindAGraveMemorial instance
// (the `memorial` argument)
//
// As FamilySearch's record and tree search forms (maybe others?) take the same
// query arguments, we use `rootUrl` to specify which type of query to build.
const FamilySearchQuery = (urlPath, memorial) => {
  const rootUrl = `https://www.familysearch.org/${urlPath}`;

  // These consts map FindAGrave attributes to FamilySearch query values,
  // encoding where necessary:
  const birthLikePlace = encodeURI(memorial.birthPlace ?? '');
  const birthLikeDate = memorial.birthYear ?? '';
  const deathLikePlace = encodeURI(memorial.deathPlace ?? '');
  const deathLikeDate = memorial.deathYear ?? '';
  const givenName = encodeURI(memorial.firstName ?? '');
  const surname = encodeURI(memorial.lastNameAtBirth ?? '');
  const surname1 = encodeURI(memorial.lastNameAtDeath ?? '');

  // Build a search query URL from the consts above:
  const query = [
    `q.givenName=${givenName}`,
    `q.surname=${surname}`,
    `q.birthLikePlace=${birthLikePlace}`,
    `q.birthLikeDate.from=${birthLikeDate}`,
    `q.birthLikeDate.to=${birthLikeDate}`,
    `q.deathLikePlace=${deathLikePlace}`,
    `q.deathLikeDate.from=${deathLikeDate}`,
    `q.deathLikeDate.to=${deathLikeDate}`
  ];

  if (surname != surname1) query.push(`q.surname.1=${surname1}`);

  return { url: `${rootUrl}?${query.join("&")}` }
};

// The global `findagrave` object, which the findagrave.com page gives us,
// is the primary data source for building search queries. It's incredibly
// useful but there are some problems getting access to it.
//
// In order to reference the page's `findagrave` global, this uses a
// `location.href` hack to copy `window.findagrave` (which this script can't
// access) to `document.findagrave` (which this script *can* access).
//
// Using `unsafeWindow` might have avoided this, but `unsafeWindow` is by
// definition unsafe and highly discouraged.
//
// Second, that hack does not take effect immediately, so there's a 1 second
// wait before attempting initialization. This is yet another hack.
//
// The https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API may be a
// way to avoid the wait-1-second hack since it could allow the script to
// initialize after that location.href event finishes. But it's not safe to
// count on this experimental feature yet.

// This is a hack to copy the global `findagrave` object to the document so
// we can access it within this script without resorting to unsafeWindow:
location.href = "javascript:(() => { document.findagrave = window.findagrave })()";

// This waits 1 second under the assumption that the `location.href` hack above
// will have finished. It should be safe to call setup() at that time.
window.setTimeout(() => { (new FindAGraveMemorial(window)).setup() }, 1000);
