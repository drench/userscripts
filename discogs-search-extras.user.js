// ==UserScript==
// @name          Discogs Search Extras
// @description	  Adds search links to Discogs pages
// @include       https://www.discogs.com/*
// ==/UserScript==

const makeSearchElement = function(domain, query) {
  var div = document.createElement('div');
  var a = document.createElement('a');
  var href = `https://duckduckgo.com/?q=site:${domain}+"${encodeURIComponent(query)}"`;
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
  if (!ogTitle.match(/\w+/)) return;

  var profile = document.querySelector('#page_content .body .profile');
  if (!profile) return;

  var profileEnd = profile.querySelector('.clear_left');
  if (!profileEnd) return;

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('allmusic.com', ogTitle), profileEnd);

  profile.insertBefore(makeSearchHead(), profileEnd);
  profile.insertBefore(makeSearchElement('rateyourmusic.com', ogTitle), profileEnd);
});
