package com.velanoire.api.model.document;

/** What a shopper did. These clicks are the smart waiter's (Python's) training data. */
public enum EventType {
    VIEW,
    SEARCH,
    ADD_TO_CART,
    REMOVE_FROM_CART,
    WISHLIST,
    PURCHASE
}
