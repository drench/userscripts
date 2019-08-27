// ==UserScript==
// @name          Discogs Search Extras
// @description	  Adds search links to Discogs pages
// @include       https://www.discogs.com/*
// ==/UserScript==

class SearchSite {
  constructor(doc) {
    this.doc = doc;
  }

  get searchSelect () {
    if (this.selectElement) return this.selectElement;

    var doc = this.doc;
    var ss = doc.createElement('select');
    ss.setAttribute('id', 'search_sites');

    var placeholder = doc.createElement('option');
    placeholder.value = '';
    placeholder.innerText = 'Search for this on…';
    ss.appendChild(placeholder);

    SearchSite.sites.forEach(function (site) {
      var opt = doc.createElement('option');
      opt.innerText = site;
      opt.value = site;
      ss.appendChild(opt);
    });

    this.selectElement = ss;
    return this.selectElement;
  }
}

SearchSite.sites = [
  'allmusic.com',
  'amazon.com',
  'bandcamp.com',
  'deepdiscount.com',
  'ebay.com',
  'popsike.com',
  'rateyourmusic.com',
  'stevehoffman.tv',
  'en.wikipedia.org',
];

const makeSearchHead = function() {
  var head = document.createElement('div');
  head.className = 'head';
  head.innerHTML = '&nbsp;';
  return head;
};

document.querySelectorAll('meta[property="og:title"]').forEach(function (metaTag) {
  var ogTitle = metaTag.getAttribute('content');
  var m = ogTitle.match(/^(.+) - (.+)$/);
  if (!m) return;

  var artist = document.getElementById('profile_title').querySelectorAll('a')[0].innerText;
  var title = m[2];

  var profile = document.querySelector('#page_content .body .profile');
  if (!profile) return;

  var profileEnd = profile.querySelector('.clear_left');
  if (!profileEnd) return;

  var searchSite = new SearchSite(document);
  var query = `"${encodeURIComponent(artist)}"+"${encodeURIComponent(title)}"`;

  searchSite.searchSelect.addEventListener('change', function (event) {
    var domain = event.target.value;
    if (domain.length > 0) {
      window.open(`https://duckduckgo.com/?q=site:${domain}+${query}`);
    }
  });

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(searchSite.searchSelect, profileEnd);
});
