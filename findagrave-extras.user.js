// ==UserScript==
// @name        FindAGrave Extras
// @description Adds links to FindAGrave pages
// @include     https://www.findagrave.com/memorial/*
// @run-at      document-end
// ==/UserScript==

if (findagrave) {
  var memorialElement = document.getElementById('memNumberLabel');
  if (memorialElement) {
    var familySearchLink = document.createElement('a');
    familySearchLink.target = 'familysearch';
    familySearchLink.innerText = findagrave.memorialId;
    familySearchLink.href =
      'https://www.familysearch.org/search/record/results' +
      `?external_record_id=${findagrave.memorialId}&collection_id=2221801`;
    familySearchLink.className = 'add-link';
    memorialElement.innerHTML = '';
    memorialElement.appendChild(familySearchLink);
  }

  var nameElement = document.getElementById('bio-name');
  if (nameElement) {
    var familyTreeLink = document.createElement('a');
    familyTreeLink.target = 'familysearch';
    familyTreeLink.innerHTML = nameElement.innerHTML;
    familyTreeLink.href = 'https://www.familysearch.org/tree/find/name?' +
      `search=1&birth=%7C${findagrave.birthYear}-${findagrave.birthYear}%7C0` +
      `&death=%7C${findagrave.deathYear}-${findagrave.deathYear}%7C0` +
      `&self=${findagrave.firstName}%7C${findagrave.lastName}%7C0%7C0`;
    familyTreeLink.className = 'add-link';
    nameElement.innerHTML = '';
    nameElement.appendChild(familyTreeLink);
  }
}
