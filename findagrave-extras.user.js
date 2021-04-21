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

  createLink() {
    let link = this.document.createElement('a');
    link.target = '_blank';
    link.className = 'add-link';
    return link;
  }

  createButton() {
    let button = this.document.createElement('a');
    button.target = '_blank';
    button.className = 'btn btn-dark btn-dark btn-sm';
    button.style.marginInline = '3px';
    return button;
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

  get deathPlace() {
    let deathLocationLabel = this.document.getElementById('deathLocationLabel');
    return deathLocationLabel && deathLocationLabel.innerText;
  }

  get deathYear() { return parseInt(this.findagrave.deathYear, 10) }

  get firstName() { return this.getPropertyPresence('firstName') }
  get lastName() { return this.getPropertyPresence('lastName') }

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
  get surname() { return encodeURI(this.memorial.lastName || '') }

  get url() {
    return `${FamilySearchRecordQuery.rootUrl}?` +
      `q.givenName=${this.givenName}&` +
      `q.surname=${this.surname}&` +
      `q.birthLikePlace=${this.birthLikePlace}&` +
      `q.birthLikeDate.from=${this.birthLikeDate}&` +
      `q.birthLikeDate.to=${this.birthLikeDate}&` +
      `q.deathLikePlace=${this.deathLikePlace}&` +
      `q.deathLikeDate.from=${this.deathLikeDate}&` +
      `q.deathLikeDate.to=${this.deathLikeDate}`;
  }
}

class FamilySearchTreeQuery {
  constructor(memorial) { this.memorial = memorial }
  static rootUrl = "https://www.familysearch.org/tree/find/name";

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
      encodeURI(this.memorial.lastName)
    ].join(encodeURI("|")));
  }

  get url() {
    return `${FamilySearchTreeQuery.rootUrl}?` +
      `self=${this.self}&` +
      "gender=&" +
      `birth=${this.birth}&` +
      `death=${this.death}`;
  }
}

class FamilySearchFindAGraveQuery {
  constructor(memorial) { this.memorial = memorial }
  static rootUrl = "https://www.familysearch.org/search/record/results";

  get url() {
    return `${FamilySearchFindAGraveQuery.rootUrl}?` +
      `external_record_id=${this.memorial.memorialId}&` +
      "collection_id=2221801";
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
  let buttonContainer = document.querySelector('.form-group.hidden-print');
  if (buttonContainer) {
    let treeSearchButton = memorial.createButton();
    treeSearchButton.innerText = 'Tree Search';
    treeSearchButton.title = 'Check FamilySearch trees';
    treeSearchButton.href = (new FamilySearchTreeQuery(memorial)).url;
    buttonContainer.appendChild(treeSearchButton);

    let recordSearchButton = memorial.createButton();
    recordSearchButton.innerText = 'Record Search';
    recordSearchButton.title = 'Check FamilySearch records';
    recordSearchButton.href = (new FamilySearchRecordQuery(memorial)).url;
    buttonContainer.appendChild(recordSearchButton);
  }

  var memorialElement = document.getElementById('memNumberLabel');
  if (memorialElement) {
    var familySearchLink = memorial.createLink();
    familySearchLink.innerText = findagrave.memorialId;
    familySearchLink.title = 'Look up this grave on FamilySearch';
    familySearchLink.href = (new FamilySearchFindAGraveQuery(memorial)).url;
    memorialElement.innerHTML = '';
    memorialElement.appendChild(familySearchLink);
  }

  getInfoItems().forEach(el => {
    el.addEventListener('click', event => {
      var val = findagrave[el.getAttribute('itemprop')];
      navigator.clipboard.writeText(val);
    });
    el.setAttribute('title', 'click to copy');
    el.style.cursor = 'pointer';
  });
};
