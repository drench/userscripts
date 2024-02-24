// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
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

  get infoItems() {
    const elements = Array.from(this.document.querySelectorAll('.mem-events *[itemprop]'));
    const self = this;
    return elements.filter(el => {
      return self.findagrave.hasOwnProperty(el.getAttribute('itemprop'));
    });
  }

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

  addFamilySearchRecordButton() {
    if (!this.buttonContainer) return;

    const button = this.createButton({
      href: (new FamilySearchQuery("search/record/results", this)).url,
      innerText: 'Record Search',
      title: 'Check FamilySearch records'
    });

    return this.buttonContainer.appendChild(button);
  }

  addFamilySearchTreeButton() {
    if (!this.buttonContainer) return;

    const button = this.createButton({
      href: (new FamilySearchQuery("search/tree/results", this)).url,
      innerText: 'Tree Search',
      title: 'Check FamilySearch trees'
    });

    return this.buttonContainer.appendChild(button);
  }

  createLink(opt) {
    opt ||= {};
    const attr = Object.assign({ className: 'add-link', target: '_blank' }, opt);
    return Object.assign(this.document.createElement('a'), attr);
  }

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

  getPropertyPresence(property) {
    if (!this.isValid()) return '';
    if (!this.findagrave.hasOwnProperty(property)) return '';
    if (typeof(this.findagrave[property]) != 'string') return '';
    return this.findagrave[property].trim();
  }

  isValid() { return !!this.findagrave }

  get birthPlace() {
    const birthLocationLabel = this.document.getElementById('birthLocationLabel');
    return birthLocationLabel?.innerText;
  }

  get birthYear() { return parseInt(this.findagrave.birthYear, 10) }

  get buttonContainer() {
    return this._buttonContainer ||=
      this.document.querySelector('.mb-3.d-flex.d-print-none');
  }

  get deathPlace() {
    const deathLocationLabel = this.document.getElementById('deathLocationLabel');
    return deathLocationLabel?.innerText;
  }

  get deathYear() { return parseInt(this.findagrave.deathYear, 10) }

  get firstName() { return this.getPropertyPresence('firstName') }
  get lastName() { return this.getPropertyPresence('lastName') }
  get lastNameAtBirth() { return this.maidenName || this.lastName }
  get lastNameAtDeath() { return this.lastName }
  get maidenName() {
    return this.potentialSurnames.find(n => n && n != this.lastName)
  }

  get seeMoreMemorialLinks() {
    return(document
      .getElementsByClassName('see-more')[0]
      .parentElement.querySelectorAll('a[href^="/memorial/search?"]'));
  }

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

  get memorialElement() {
    return this._memorialElement ||= document.getElementById('memNumberLabel');
  }

  get memorialId() {
    return parseInt(this.getPropertyPresence('memorialId'), 10);
  }
}

class FamilySearchQuery {
  constructor(rootUrl, memorial) {
    this.rootUrl = `https://www.familysearch.org/${rootUrl}`;
    this.memorial = memorial;
  }

  get birthLikePlace() { return encodeURI(this.memorial.birthPlace || '') }
  get birthLikeDate() { return this.memorial.birthYear || '' }
  get deathLikePlace() { return encodeURI(this.memorial.deathPlace || '') }
  get deathLikeDate() { return this.memorial.deathYear || '' }
  get givenName() { return encodeURI(this.memorial.firstName || '') }
  get surname() { return encodeURI(this.memorial.lastNameAtBirth || '') }
  get surname1() { return encodeURI(this.memorial.lastNameAtDeath || '') }

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

const memorial = new FindAGraveMemorial(function () { return findagrave }, window);

if (memorial.memorialId) {
  memorial.addFamilySearchTreeButton();
  memorial.addFamilySearchRecordButton();
  memorial.addFamilySearchFindAGraveLink();
  memorial.addClickToCopyForInfoItems();
}
