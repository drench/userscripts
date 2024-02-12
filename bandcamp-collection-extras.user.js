// ==UserScript==
// @name        Bandcamp Collection Extras
// @description Adds extras to Bandcamp collection pages
// @grant       unsafeWindow
// @match       https://bandcamp.com/*
// @run-at      document-idle
// @version     1.0.1
// ==/UserScript==

class BandCampCollection {
  constructor(win, collectionType = "wishlist") {
    this.window = win;
    this.collectionType = collectionType;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return console.log("already initialized!");
    }

    if (this.collectionGrids.length == 0) {
      return console.log("No collection-grid elements; cannot initialize");
    }

    this.populateInitialItems();
    this.startObserver();
    this.initialized = true;
  }

  formatPrice(itemAttr) {
    if (!itemAttr.price) return "Free or NYP";
    let price = this.window.TextFormat.money(itemAttr.price, itemAttr.currency);
    if (itemAttr.currency == "USD") return price;
    let usd = this.window.TextFormat.money(itemAttr.price * this.window.CurrencyData.rates[itemAttr.currency], "USD");
    return `${price} ${itemAttr.currency} (${usd} USD)`;
  }

  get observer() {
    this._observer ||= (new MutationObserver(this.observerCallback));
    return this._observer;
  }

  get observerCallback() {
    let self = this;
    this._observerCallback ||= (function(mutationsList, observer) {
      mutationsList.forEach(function (mutation) {
        mutation.addedNodes.forEach(function (itemNode) {
          let itemId = itemNode.dataset.itemid;
          if (!itemId) return console.log(`No itemId found`, itemNode);
          let itemType = itemNode.dataset.itemtype[0] || "a";
          let itemAttr = self.getItemCache(`${itemType}${itemId}`);
          if (!itemAttr) return console.log(`Item ${itemId} not found!`);
          self.decorateItem(itemNode, itemAttr);
        });
      });
    });
    return this._observerCallback;
  }

  get collectionGrids() {
    return Array.from(this.document.getElementsByClassName("collection-grid"));
  }

  startObserver() {
    let observer = this.observer;
    this.collectionGrids.forEach((gridNode) => {
      observer.observe(gridNode, { childList: true });
    });
  }

  get api() { return this.window.FanCollectionAPI }
  get document() { return this.window.document }
  get fanId() { return this.window.FanData.fan_id }
  get itemCache() { return this.window.ItemCache[this.collectionType] }

  getItemCache(fullId) {
    return this.itemCache[fullId];
  }

  setItemCache(fullId, attr) {
    this.itemCache[fullId] = attr;
  }

  decorateItem(itemNode, itemAttr) {
    if (!itemNode) {
      return console.log(`itemNode ${itemAttr.item_id} not found`);
    }

    if (!itemAttr.is_purchasable) return;
    if (itemNode.querySelector("div.price-display")) return;

    let priceDiv = this.document.createElement('div');
    priceDiv.classList.add("price-display");
    priceDiv.innerText = this.formatPrice(itemAttr);

    let itemContainer =
      itemNode.querySelector("div.collection-item-gallery-container");

    if (itemContainer) {
      itemContainer.appendChild(priceDiv);
    }
    else {
      console.log(`Cannot find a node to add pricing for ${itemAttr.item_id}`);
    }
  }

  populateInitialItems() {
    const token = `${Math.ceil((new Date()) / 1000)}::a::`;
    let self = this;

    this.api.getItems(this.fanId, token, this.collectionType, false, null, 20).then((items) => {
      items.forEach((itemAttr) => {
        let fullId = `${itemAttr.tralbum_type}${itemAttr.tralbum_id}`;
        self.setItemCache(fullId, itemAttr);

        let itemNode =
          self.document.querySelector(`li.collection-item-container[data-tralbumid='${itemAttr.tralbum_id}']`);
        if (!itemNode) return console.log(`itemNode ${itemAttr.tralbum_id} not found`);

        let itemId = itemNode.dataset.itemid;
        if (!itemId) return console.log(`No itemId found`, itemNode);
        self.decorateItem(itemNode, itemAttr);
      });
    });
  }
}

const bcWishList = new BandCampCollection(unsafeWindow, "wishlist");
bcWishList.initialize();

const bcCollection = new BandCampCollection(unsafeWindow, "collection");
bcCollection.initialize();
