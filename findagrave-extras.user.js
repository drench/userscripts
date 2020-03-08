// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
// @include     https://www.findagrave.com/memorial/*
// @run-at      document-end
// ==/UserScript==

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

const param = function (key) {
  return encodeURI(findagrave[key]);
};

if (typeof findagrave !== 'undefined') {
  var buttonContainer = document.querySelector('.form-group.hidden-print');
  if (buttonContainer) {
    var treeSearchButton = createButton();
    treeSearchButton.innerText = 'Tree Search';
    treeSearchButton.title = 'Check FamilySearch trees';
    treeSearchButton.href = 'https://www.familysearch.org/tree/find/name?' +
      `search=1&birth=%7C${param('birthYear')}-${param('birthYear')}%7C0` +
      `&death=%7C${param('deathYear')}-${param('deathYear')}%7C0` +
      `&self=${param('firstName')}%7C${param('lastName')}%7C0%7C0`;
    buttonContainer.appendChild(treeSearchButton);

    var recordSearchButton = createButton();
    recordSearchButton.innerText = 'Record Search';
    recordSearchButton.title = 'Check FamilySearch records';
    recordSearchButton.href = 'https://www.familysearch.org/search/record/' +
      `results?givenname=${param('firstName')}&surname=${param('lastName')}` +
      `&birth_year_from=${param('birthYear')}&birth_year_to=${param('birthYear')}` +
      `&death_year_from=${param('deathYear')}&death_year_to=${param('deathYear')}`;
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
}
