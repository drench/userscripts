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

if (typeof findagrave !== 'undefined') {
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

  var nameElement = document.getElementById('bio-name');
  if (nameElement) {
    var familyTreeLink = createLink();
    familyTreeLink.innerHTML = nameElement.innerHTML;
    familyTreeLink.href = 'https://www.familysearch.org/tree/find/name?' +
      `search=1&birth=%7C${findagrave.birthYear}-${findagrave.birthYear}%7C0` +
      `&death=%7C${findagrave.deathYear}-${findagrave.deathYear}%7C0` +
      `&self=${findagrave.firstName}%7C${findagrave.lastName}%7C0%7C0`;
    nameElement.innerHTML = '';
    nameElement.appendChild(familyTreeLink);
  }
}
