// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
// @author      Daniel Rench
// @supportURL  https://github.com/drench/userscripts
// @match       https://www.findagrave.com/memorial/*/*
// @run-at      document-idle
// @version     1.0.0
// ==/UserScript==

class FindAGraveMemorial {
  constructor(fg, win) {
    try { this.findagrave = fg() } catch(e) { }
    this.clipboard = win.navigator.clipboard;
    this.document = win.document;
  }

  // This returns an Array of elements on the page that have an "itemprop"
  // attribute thas has a corresponding `findagrave` object property.
  // See addClickToCopyForInfoItems() for how it's used.
  get infoItems() {
    const elements = Array.from(this.document.querySelectorAll('.mem-events *[itemprop]'));
    const self = this;
    return elements.filter(el => {
      return self.findagrave.hasOwnProperty(el.getAttribute('itemprop'));
    });
  }

  // This adds an event on every infoItem element to copy that info
  // to the clipboard when clicked. For example, this makes it so when clicking
  // the death date, it copies that date (in "DD Mon YYYY" format) to the clipboard.
  addClickToCopyForInfoItems() {
    const self = this;
    for (const element of this.infoItems) {
      element.addEventListener('click', event => {
        const val = self.findagrave[element.getAttribute('itemprop')];
        this.clipboard.writeText(val);
      });
      element.setAttribute('title', 'click to copy');
      element.style.cursor = 'pointer';
    }
  }

  // This turns the memorial ID element into a link that will search for this
  // FindAGrave record on FamilySearch.
  addFamilySearchFindAGraveLink() {
    if (!this.memorialElement) return;

    const link = this.createLink({
      href: (new FamilySearchFindAGraveQuery(this)).url,
      innerText: this.findagrave.memorialId,
      title: 'Look up this grave on FamilySearch'
    });

    this.memorialElement.innerHTML = '';
    this.memorialElement.classList.remove("hidden");
    this.memorialElement.nextElementSibling.classList.add("hidden");

    return this.memorialElement.appendChild(link);
  }

  // This adds a "RECORD SEARCH" button to the page.
  // When clicked, it sends a record search query to FamilySearch (as opposed
  // to a tree search; see addFamilySearchTreeButton for that).
  addFamilySearchRecordButton() {
    if (!this.buttonContainer) return;

    const button = this.createButton({
      href: (new FamilySearchQuery("search/record/results", this)).url,
      innerText: 'Record Search',
      title: 'Check FamilySearch records'
    });

    return this.buttonContainer.appendChild(button);
  }

  // This adds a "TREE SEARCH" button to the page.
  // When clicked, it sends a tree search query to FamilySearch (as opposed to a
  // record search; see addFamilySearchRecordButton for that).
  addFamilySearchTreeButton() {
    if (!this.buttonContainer) return;

    const button = this.createButton({
      href: (new FamilySearchQuery("search/tree/results", this)).url,
      innerText: 'Tree Search',
      title: 'Check FamilySearch trees'
    });

    return this.buttonContainer.appendChild(button);
  }

  // A helper to create a link (<a>) element with arbitrary attributes.
  createLink(opt) {
    opt ||= {};
    const attr = Object.assign({ className: 'add-link', target: '_blank' }, opt);
    return Object.assign(this.document.createElement('a'), attr);
  }

  // A helper to create a button (actually a specially-styled <a> element) with
  // arbitrary attributes.
  createButton(opt) {
    opt ||= {};

    const attr = Object.assign({
      className: 'btn btn-dark border-darker btn-sm text-uppercase ml-2',
      style: {},
      target: '_blank',
      type: 'button'
    }, opt);
    attr.style.marginInline ||= '3px';

    return Object.assign(this.document.createElement('a'), attr);
  }

  // A helper that returns `findagrave` property elements "nicely" by returning
  // a string trimmed of whitespace, or an empty string if the property does not
  // exist, or not a string.
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
    return this._buttonContainer ||=
      this.document.querySelector('.mb-3.d-flex.d-print-none');
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
  get lastNameAtBirth() { return this.maidenName || this.lastName }

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
    return(this._potentialSurnames ||=
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
    return this._memorialElement ||= this.document.getElementById('memNumberLabel');
  }

  // Returns the memorial ID for this grave
  get memorialId() {
    return parseInt(this.getPropertyPresence('memorialId'), 10);
  }
}

// This class builds FamilySearch queries using a FindAGraveMemorial instance
// (the `memorial` argument in the constructor)
//
// As FamilySearch's record and tree search forms (maybe others?) take the same
// query arguments, we use `rootUrl` to specify which type of query to build.
class FamilySearchQuery {
  constructor(rootUrl, memorial) {
    this.rootUrl = `https://www.familysearch.org/${rootUrl}`;
    this.memorial = memorial;
  }

  // These getters map FindAGrave attributes to FamilySearch query values,
  // encoding where necessary:
  get birthLikePlace() { return encodeURI(this.memorial.birthPlace || '') }
  get birthLikeDate() { return this.memorial.birthYear || '' }
  get deathLikePlace() { return encodeURI(this.memorial.deathPlace || '') }
  get deathLikeDate() { return this.memorial.deathYear || '' }
  get givenName() { return encodeURI(this.memorial.firstName || '') }
  get surname() { return encodeURI(this.memorial.lastNameAtBirth || '') }
  get surname1() { return encodeURI(this.memorial.lastNameAtDeath || '') }

  // Returns a search query URL built from the getters above:
  get url() {
    let _url = `${this.rootUrl}?` +
      `q.givenName=${this.givenName}&` +
      `q.surname=${this.surname}&` +
      `q.birthLikePlace=${this.birthLikePlace}&` +
      `q.birthLikeDate.from=${this.birthLikeDate}&` +
      `q.birthLikeDate.to=${this.birthLikeDate}&` +
      `q.deathLikePlace=${this.deathLikePlace}&` +
      `q.deathLikeDate.from=${this.deathLikeDate}&` +
      `q.deathLikeDate.to=${this.deathLikeDate}`;

    if (this.surname != this.surname1) {
      _url += `&q.surname.1=${this.surname1}`
    }

    return _url;
  }
}

// Given a FinaAGrave memorial ID (derived from the FindAGraveMemorial object
// passed into the constructor), this builds a query URL for this memorial on
// FamilySearh. The idea being, this takes you directly to the FindAGrave record
// for easy attachment to a person on FamilySearch.
class FamilySearchFindAGraveQuery {
  constructor(memorial) { this.memorial = memorial }
  static rootUrl = "https://www.familysearch.org/search/record/results";
  static collectionId = "2221801";

  get url() {
    return `${FamilySearchFindAGraveQuery.rootUrl}?` +
      `q.externalRecordId=${this.memorial.memorialId}&` +
      `f.collectionId=${FamilySearchFindAGraveQuery.collectionId}`;
  }
}

// The global `findagrave` object, which the findagrave.com page gives us,
// is the primary data source for building search queries. There are some
// problems with this.
//
// First, for reasons I don't yet understand, we need to
// reference it as simply `findagrave`; I had hoped it would be available via
// `window.findagrave` but at least in the context of a UserScript, we cannot.
//
// Second, also for reasons I don't yet understand, referencing `findagrave`
// directly does not seem to work. The workaround is to instead return the
// `findagrave` object from a callback function.
//
// This is a long-winded way of saying I wish this constructor could be just
// `new FindAGraveMemorial(window)` and have the class derive `findagrave` from
// `findagrave.window`, but that doesn't work. I'd love to find out why!
const memorial = new FindAGraveMemorial(function () { return findagrave }, window);

// If there's a memorialId, we take that to mean this is a legitimate memorial
// page. If that's the case, this calls 4 initialization methods to set up the
// page changes that are the entire point of this UserScript.
//
// I took a different route in this UserScript:
// https://github.com/drench/userscripts/blob/main/rubydoc-version-switcher.user.js
//
// In that one, each page element change is its own class, and each one
// registers itself as a callback to be called `onSetup`.
// I might try that here too, for fun(?)

if (memorial.memorialId) {
  memorial.addFamilySearchTreeButton();
  memorial.addFamilySearchRecordButton();
  memorial.addFamilySearchFindAGraveLink();
  memorial.addClickToCopyForInfoItems();
}
