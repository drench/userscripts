// ==UserScript==
// @name          Discogs Search Extras
// @description	  Adds search links to Discogs pages
// @include       https://www.discogs.com/*
// ==/UserScript==

const makeSearchElement = function(domain, artist, title) {
  var div = document.createElement('div');
  var a = document.createElement('a');
  var query = `"${encodeURIComponent(artist)}"+"${encodeURIComponent(title)}"`;
  var href = `https://duckduckgo.com/?q=site:${domain}+${query}`;
  a.setAttribute('href', href);
  a.setAttribute('target', '_blank');
  a.innerText = domain;
  div.className = 'content';
  div.appendChild(a);
  return div;
};

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

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('allmusic.com', artist, title), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('amazon.com', artist, title), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('deepdiscount.com', artist, title), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('ebay.com', artist, title), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('rateyourmusic.com', artist, title), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('stevehoffman.tv', artist, title), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('en.wikipedia.org', artist, title), profileEnd);
});
