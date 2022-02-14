// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
// @include     /^https://www.findagrave.com/memorial/[0-9]+//
// @run-at      document-idle
// ==/UserScript==

class FindAGraveMemorial {
  constructor(fg, doc) {
    try { this.findagrave = fg() } catch(e) { }
    this.document = doc;
  }

  addFamilySearchFindAGraveLink() {
    if (!this.memorialElement) return;
    let link = this.createLink({
      href: (new FamilySearchFindAGraveQuery(this)).url,
      innerText: this.findagrave.memorialId,
      title: 'Look up this grave on FamilySearch'
    });
    this.memorialElement.innerHTML = '';
    return this.memorialElement.appendChild(link);
  }

  addFamilySearchRecordButton() {
    if (!this.buttonContainer) return;
    let button = this.createButton({
      href: (new FamilySearchRecordQuery(this)).url,
      innerText: 'Record Search',
      title: 'Check FamilySearch records'
    });
    return this.buttonContainer.appendChild(button);
  }

  addFamilySearchTreeButton() {
    if (!this.buttonContainer) return;
    let button = this.createButton({
      href: (new FamilySearchTreeQuery(this)).url,
      innerText: 'Tree Search',
      title: 'Check FamilySearch trees'
    });
    return this.buttonContainer.appendChild(button);
  }

  createLink(opt) {
    opt ||= {};
    let attr = Object.assign({ className: 'add-link', target: '_blank' }, opt);
    return Object.assign(this.document.createElement('a'), attr);
  }

  createButton(opt) {
    opt ||= {};

    let attr = Object.assign({
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
    let birthLocationLabel = this.document.getElementById('birthLocationLabel');
    return birthLocationLabel && birthLocationLabel.innerText;
  }

  get birthYear() { return parseInt(this.findagrave.birthYear, 10) }

  get buttonContainer() {
    return this._buttonContainer ||=
      this.document.querySelector('.form-group.d-print-none');
  }

  get deathPlace() {
    let deathLocationLabel = this.document.getElementById('deathLocationLabel');
    return deathLocationLabel && deathLocationLabel.innerText;
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

class FamilySearchRecordQuery {
  constructor(memorial) { this.memorial = memorial }
  static rootUrl = "https://www.familysearch.org/search/record/results";

  get birthLikePlace() { return encodeURI(this.memorial.birthPlace || '') }
  get birthLikeDate() { return this.memorial.birthYear || '' }
  get deathLikePlace() { return encodeURI(this.memorial.deathPlace || '') }
  get deathLikeDate() { return this.memorial.deathYear || '' }
  get givenName() { return encodeURI(this.memorial.firstName || '') }
  get surname() { return encodeURI(this.memorial.lastNameAtBirth || '') }
  get surname1() { return encodeURI(this.memorial.lastNameAtDeath || '') }

  get url() {
    let _url = `${FamilySearchRecordQuery.rootUrl}?` +
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

class FamilySearchTreeQuery {
  constructor(memorial) { this.memorial = memorial }
  static rootUrl = "https://www.familysearch.org/tree/find/name";

  get alternateName1() {
    if (this.memorial.lastNameAtBirth == this.memorial.lastNameAtDeath) return "";
    return ["", encodeURI(this.memorial.lastNameAtDeath), "0", "0"].join(encodeURI("|"));
  }

  get birth() {
    let year = this.memorial.birthYear || "";

    return([
      encodeURI(this.memorial.birthPlace || ""), `${year}-${year}`, 0, 1
    ].join(encodeURI("|")));
  }

  get death() {
    let year = this.memorial.deathYear || "";

    return([
      encodeURI(this.memorial.deathPlace || ""), `${year}-${year}`, 0, 1
    ].join(encodeURI("|")));
  }

  get self() {
    return([
      encodeURI(this.memorial.firstName),
      encodeURI(this.memorial.lastNameAtBirth)
    ].join(encodeURI("|")));
  }

  get url() {
    return `${FamilySearchTreeQuery.rootUrl}?` +
      `self=${this.self}&` +
      "gender=&" +
      `birth=${this.birth}&` +
      `death=${this.death}&` +
      `alternateName1=${this.alternateName1}&`;
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

const getInfoItems = function () {
  var elements = Array.from(document.querySelectorAll('.mem-events *[itemprop]'));
  return elements.filter(el => findagrave.hasOwnProperty(el.getAttribute('itemprop')));
};

const originalName = function () {
  let th = document.evaluate('//th[text()="Original Name"]').iterateNext();
  if (th && th.nextElementSibling) return th.nextElementSibling.innerText;
  else return `${findagrave.firstName} ${findagrave.lastName}`;
};

const memorial = new FindAGraveMemorial(function () { return findagrave }, document);

if (memorial.memorialId) {
  memorial.addFamilySearchTreeButton();
  memorial.addFamilySearchRecordButton();
  memorial.addFamilySearchFindAGraveLink();

  getInfoItems().forEach(el => {
    el.addEventListener('click', event => {
      var val = findagrave[el.getAttribute('itemprop')];
      navigator.clipboard.writeText(val);
    });
    el.setAttribute('title', 'click to copy');
    el.style.cursor = 'pointer';
  });
};
