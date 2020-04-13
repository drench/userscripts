// ==UserScript==
// @name          Discogs Extras
// @description   Adds search links to Discogs pages and more
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
  'forcedexposure.com',
  'pitchfork.com',
  'popsike.com',
  'rateyourmusic.com',
  'stevehoffman.tv',
  'en.wikipedia.org',
  'youtube.com'
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

  var artist = document.getElementById('profile_title').querySelectorAll('a')[0].innerText.replace(/\s+\(\d+\)$/, '');
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

document.querySelectorAll('table.playlist').forEach(function (playlistTable) {
  var durations = Array.from(playlistTable.querySelectorAll('.tracklist_track_duration span'));
  var seconds = durations
    .map((s)=> s.innerText.split(/:/, 2).map((t)=> parseInt(t), 10))
    .map((t)=> isNaN(t[0]) ? 0 : (t[0]*60 + t[1]))
    .reduce((a,c)=> a+c);

  if (isNaN(seconds) || seconds < 1) return;

  var minutes = Math.floor(seconds / 60);
  seconds = seconds - (minutes * 60);

  if (seconds < 10) seconds = `0${seconds}`;

  if (minutes > 60) {
    var hours = Math.floor(minutes / 60);
    minutes = minutes - (hours * 60);
    if (minutes < 10) minutes = `${hours}:0${minutes}`;
    else minutes = `${hours}:${minutes}`
  }

  var playlistColumns = playlistTable.querySelector('tr').querySelectorAll('td').length;

  var footer = document.createElement('tfoot');
  var tr = document.createElement('tr');
  tr.className = 'tracklist_track track_heading';

  // Pad a column on pages with track numbers
  if (playlistColumns == 3) tr.appendChild(document.createElement('td'));

  var labelElement = document.createElement('td');
  labelElement.className = 'tracklist_track_title';
  labelElement.innerHTML = '<span>Total Time</span>';
  tr.appendChild(labelElement);

  var sumElement = document.createElement('td');
  sumElement.innerHTML = `<span>${minutes}:${seconds}</span>`;
  sumElement.className = 'tracklist_track_duration';
  tr.appendChild(sumElement);
  footer.appendChild(tr);
  playlistTable.appendChild(footer);
});
