// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
// @include     /^https://www.findagrave.com/memorial/[0-9]+//
// @run-at      document-idle
// ==/UserScript==

const isMemorialPage = function () {
  return findagrave &&
    findagrave.hasOwnProperty('memorialId') &&
    (typeof(findagrave.memorialId) == 'string') &&
    (findagrave.memorialId.trim() != '');
};

const createLink = function () {
  var link = document.createElement('a');
  link.target = '_blank';
  link.className = 'add-link';
  return link;
};

const createButton = function () {
  var button = document.createElement('a');
  button.target = '_blank';
  button.className = 'btn btn-dark btn-dark btn-sm';
  button.style.marginInline = '3px';
  return button;
};

const getInfoItems = function () {
  var elements = Array.from(document.querySelectorAll('.mem-events *[itemprop]'));
  return elements.filter(el => findagrave.hasOwnProperty(el.getAttribute('itemprop')));
};

const param = function (key) {
  return encodeURI(findagrave[key]);
};

const birthPlace = function () {
  let birthLocationLabel = document.getElementById('birthLocationLabel');
  if (birthLocationLabel && birthLocationLabel.innerText)
    return encodeURI(birthLocationLabel.innerText);
  else return "";
};

const deathPlace = function () {
  let deathLocationLabel = document.getElementById('deathLocationLabel');
  if (deathLocationLabel && deathLocationLabel.innerText)
    return encodeURI(deathLocationLabel.innerText);
  else return "";
};

if (isMemorialPage()) {
  var buttonContainer = document.querySelector('.form-group.hidden-print');
  if (buttonContainer) {
    var treeSearchButton = createButton();
    treeSearchButton.innerText = 'Tree Search';
    treeSearchButton.title = 'Check FamilySearch trees';
    treeSearchButton.href = 'https://www.familysearch.org/tree/find/name?' +
      `search=1&birth=${birthPlace()}%7C${param('birthYear')}-${param('birthYear')}%7C0` +
      `&death=${deathPlace()}%7C${param('deathYear')}-${param('deathYear')}%7C0` +
      `&self=${param('firstName')}%7C${param('lastName')}%7C0%7C0`;
    buttonContainer.appendChild(treeSearchButton);

    var recordSearchButton = createButton();
    recordSearchButton.innerText = 'Record Search';
    recordSearchButton.title = 'Check FamilySearch records';
    recordSearchButton.href = 'https://www.familysearch.org/search/record/' +
      `results?q.givenName=${param('firstName')}` +
      `&q.surname=${param('lastName')}` +
      `&q.birthLikePlace=${birthPlace()}` +
      `&q.birthLikeDate.from=${param('birthYear')}` +
      `&q.birthLikeDate.to=${param('birthYear')}` +
      `&q.deathLikePlace=${deathPlace()}` +
      `&q.deathLikeDate.from=${param('deathYear')}` +
      `&q.deathLikeDate.to=${param('deathYear')}`;
    buttonContainer.appendChild(recordSearchButton);
  }

  var memorialElement = document.getElementById('memNumberLabel');
  if (memorialElement) {
    var familySearchLink = createLink();
    familySearchLink.innerText = findagrave.memorialId;
    familySearchLink.title = 'Look up this grave on FamilySearch';
    familySearchLink.href =
      'https://www.familysearch.org/search/record/results' +
      `?external_record_id=${findagrave.memorialId}&collection_id=2221801`;
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
