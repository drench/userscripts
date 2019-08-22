// ==UserScript==
// @name          Discogs Search Extras
// @description	  Adds search links to Discogs pages
// @include       https://www.discogs.com/*
// ==/UserScript==

class SearchSite {
  constructor(doc) {
    this.doc = doc;
  }

  get domains () {
    if (this.domainsDatalist) return this.domainsDatalist;

    var doc = this.doc;
    var dl = doc.createElement('datalist');
    dl.setAttribute('id', 'search_sites');
    SearchSite.sites.forEach(function (site) {
      var opt = doc.createElement('option');
      opt.innerText = site;
      dl.appendChild(opt);
    });

    this.domainsDatalist = dl;
    return this.domainsDatalist;
  }
}

SearchSite.sites = [
  'allmusic.com',
  'amazon.com',
  'deepdiscount.com',
  'ebay.com',
  'rateyourmusic.com',
  'stevehoffman.tv',
  'en.wikipedia.org',
];

const makeSearchHead = function() {
  var head = document.createElement('div');
  head.className = 'head';
  head.innerText = 'Search:';
  return head;
};

document.querySelectorAll('meta[property="og:title"]').forEach(function (metaTag) {
  var ogTitle = metaTag.getAttribute('content');
  var m = ogTitle.match(/^(.+) - (.+)$/);
  if (!m) return;

  var artist = m[1];
  var title = m[2];

  var profile = document.querySelector('#page_content .body .profile');
  if (!profile) return;

  var profileEnd = profile.querySelector('.clear_left');
  if (!profileEnd) return;

  var searchSite = new SearchSite(document);
  document.body.appendChild(searchSite.domains);

  var input = document.createElement('input');
  input.setAttribute('list', searchSite.domains.id);
  input.setAttribute('autocomplete', 'off');
  input.setAttribute('placeholder', 'Site…');

  var query = `"${encodeURIComponent(artist)}"+"${encodeURIComponent(title)}"`;

  input.addEventListener('change', function (event) {
    var domain = event.target.value.replace(/\s+/g, '');
    if (domain.match(/.+\..+/)) {
      window.open(`https://duckduckgo.com/?q=site:${domain}+${query}`);
    }
  });

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(input, profileEnd);
});
