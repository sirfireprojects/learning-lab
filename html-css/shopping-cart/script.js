// ==========================================
// 1. PRODUCT CATALOGUE (source of truth)
// ==========================================

const PRODUCTS = [
    {
        id: 1,
        name: "Mechanical Keyboard",
        price: 8500,
        category: "Accessories",
        description: "Compact wired keyboard with tactile switches for daily coding.",
        stock: 12
    },
    {
        id: 2,
        name: "Wireless Mouse",
        price: 3200,
        category: "Accessories",
        description: "Ergonomic mouse with silent clicks and long battery life.",
        stock: 18
    },
    {
        id: 3,
        name: "USB-C Hub",
        price: 4500,
        category: "Accessories",
        description: "Four-port hub for laptops — HDMI, USB-A and SD card reader.",
        stock: 7
    },
    {
        id: 4,
        name: "Noise-Cancelling Headphones",
        price: 14500,
        category: "Audio",
        description: "Over-ear headphones suited for focused work and commuting.",
        stock: 5
    },
    {
        id: 5,
        name: "Desktop Speakers",
        price: 6800,
        category: "Audio",
        description: "Compact stereo speakers with clear mid-range for desks.",
        stock: 0
    },
    {
        id: 6,
        name: "14-inch Laptop Stand",
        price: 2900,
        category: "Computing",
        description: "Aluminium stand that raises screens to a healthier viewing height.",
        stock: 15
    },
    {
        id: 7,
        name: "Webcam 1080p",
        price: 5200,
        category: "Computing",
        description: "Plug-and-play webcam for meetings and remote collaboration.",
        stock: 3
    },
    {
        id: 8,
        name: "External SSD 1TB",
        price: 12500,
        category: "Storage",
        description: "Portable solid-state drive for backups and large project files.",
        stock: 9
    }
];

const STORAGE_KEY = "shoppingCart";
const LOW_STOCK_THRESHOLD = 5;


// ==========================================
// 2. DOM REFERENCES
// ==========================================

const productGrid = document.querySelector("#product-grid");
const catalogueStatus = document.querySelector("#catalogue-status");
const productSearch = document.querySelector("#product-search");
const categoryFilters = document.querySelector("#category-filters");

const cartBadge = document.querySelector("#cart-badge");
const cartItemsList = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartAnnouncer = document.querySelector("#cart-announcer");


// ==========================================
// 3. APPLICATION STATE
// ==========================================

let activeCategory = "all";
let searchQuery = "";
let cart = loadCart();
let feedbackTimer = null;


// ==========================================
// 4. FORMATTING & LOOKUP HELPERS
// ==========================================

function formatKes(amount) {
    return Number(amount).toLocaleString("en-KE");
}

function getProductById(id) {
    return PRODUCTS.find(function (product) {
        return product.id === id;
    });
}

function getCartItem(productId) {
    return cart.find(function (item) {
        return item.id === productId;
    });
}

function getCartQuantity(productId) {
    const item = getCartItem(productId);
    return item ? item.quantity : 0;
}

function parseStrictProductId(value) {
    // Reject booleans, objects, empty strings and non-integer numbers.
    if (typeof value === "boolean" || value === null || value === undefined) {
        return null;
    }

    if (typeof value === "number") {
        if (!Number.isInteger(value) || value < 1) {
            return null;
        }
        return value;
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (!/^[1-9]\d*$/.test(trimmed)) {
            return null;
        }

        return Number(trimmed);
    }

    return null;
}

function getStockStatus(stock) {
    if (stock <= 0) {
        return {
            label: "Out of stock",
            className: "stock-badge--out-of-stock"
        };
    }

    if (stock <= LOW_STOCK_THRESHOLD) {
        return {
            label: "Low stock",
            className: "stock-badge--low-stock"
        };
    }

    return {
        label: "In stock",
        className: "stock-badge--in-stock"
    };
}

function getUniqueCategories() {
    const categories = [];

    PRODUCTS.forEach(function (product) {
        if (categories.indexOf(product.category) === -1) {
            categories.push(product.category);
        }
    });

    return categories;
}


// ==========================================
// 5. LOCAL STORAGE (safe load / save)
// ==========================================

function loadCart() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        return [];
    }

    try {
        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return [];
        }

        const cleaned = [];

        parsed.forEach(function (item) {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                return;
            }

            const productId = parseStrictProductId(item.id);
            const product = productId === null ? undefined : getProductById(productId);

            if (!product || product.stock < 1) {
                return;
            }

            if (typeof item.quantity === "boolean") {
                return;
            }

            const quantity = Math.floor(Number(item.quantity));

            if (!Number.isInteger(quantity) || quantity < 1) {
                return;
            }

            const clampedQuantity = Math.min(quantity, product.stock);
            const existing = cleaned.find(function (entry) {
                return entry.id === product.id;
            });

            if (existing) {
                existing.quantity = Math.min(
                    existing.quantity + clampedQuantity,
                    product.stock
                );
            } else {
                cleaned.push({
                    id: product.id,
                    quantity: clampedQuantity
                });
            }
        });

        return cleaned;
    } catch (error) {
        console.warn("Could not read shopping cart from localStorage.", error);
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (error) {
        console.warn("Could not save shopping cart to localStorage.", error);
    }
}


// ==========================================
// 6. CART CALCULATIONS & PRUNING
// ==========================================

function pruneCart() {
    const before = cart.length;

    cart = cart.filter(function (item) {
        const product = getProductById(item.id);

        return (
            product !== undefined &&
            product.stock > 0 &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0 &&
            item.quantity <= product.stock
        );
    });

    return cart.length !== before;
}

function getCartQuantityTotal() {
    return cart.reduce(function (sum, item) {
        return sum + item.quantity;
    }, 0);
}

function getLineSubtotal(item) {
    const product = getProductById(item.id);
    return product ? product.price * item.quantity : 0;
}

function getCartTotal() {
    return cart.reduce(function (sum, item) {
        return sum + getLineSubtotal(item);
    }, 0);
}


// ==========================================
// 7. STATUS & ANNOUNCEMENTS
// ==========================================

function announceCart(message) {
    cartAnnouncer.textContent = "";

    // Retrigger announcement for repeated identical messages.
    window.setTimeout(function () {
        cartAnnouncer.textContent = message;
    }, 20);
}

function showCatalogueFeedback(message) {
    catalogueStatus.hidden = false;
    catalogueStatus.classList.add("status-message--feedback");
    catalogueStatus.textContent = message;

    window.clearTimeout(feedbackTimer);
    feedbackTimer = window.setTimeout(function () {
        clearCatalogueFeedback();
        renderCatalogueStatus();
    }, 3200);
}

function clearCatalogueFeedback() {
    catalogueStatus.classList.remove("status-message--feedback");
    window.clearTimeout(feedbackTimer);
    feedbackTimer = null;
}

function itemLabel(count) {
    return count === 1 ? "1 item" : count + " items";
}


// ==========================================
// 8. CATEGORY FILTERS
// ==========================================

function renderCategoryFilters() {
    categoryFilters.innerHTML = "";

    const categories = ["all"].concat(getUniqueCategories());

    categories.forEach(function (category) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-button";
        button.dataset.category = category;
        button.textContent = category === "all" ? "All" : category;

        const isActive = category === activeCategory;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));

        categoryFilters.appendChild(button);
    });
}


// ==========================================
// 9. CATALOGUE RENDERING
// ==========================================

function getFilteredProducts() {
    return PRODUCTS.filter(function (product) {
        const matchesCategory =
            activeCategory === "all" || product.category === activeCategory;

        const matchesSearch =
            searchQuery === "" ||
            product.name.toLowerCase().includes(searchQuery) ||
            product.description.toLowerCase().includes(searchQuery);

        return matchesCategory && matchesSearch;
    });
}

function renderCatalogueStatus() {
    if (feedbackTimer !== null) {
        return;
    }

    const products = getFilteredProducts();

    if (products.length === 0) {
        catalogueStatus.hidden = false;
        catalogueStatus.classList.remove("status-message--feedback");
        catalogueStatus.textContent =
            "No products match your search or filter. Try another category or clear the search.";
        return;
    }

    catalogueStatus.hidden = true;
    catalogueStatus.textContent = "";
}

function getAddButtonState(product) {
    const inCart = getCartQuantity(product.id);

    if (product.stock < 1) {
        return {
            label: "Out of stock",
            ariaLabel: product.name + " is out of stock",
            disabled: true
        };
    }

    if (inCart >= product.stock) {
        return {
            label: "Stock limit reached",
            ariaLabel: product.name + " stock limit reached in cart",
            disabled: true
        };
    }

    return {
        label: "Add to cart",
        ariaLabel: "Add " + product.name + " to cart",
        disabled: false
    };
}

function renderCatalogue() {
    const products = getFilteredProducts();

    productGrid.innerHTML = "";
    renderCatalogueStatus();

    products.forEach(function (product) {
        const stock = getStockStatus(product.stock);
        const stockId = "product-stock-" + product.id;
        const titleId = "product-title-" + product.id;
        const addState = getAddButtonState(product);

        const card = document.createElement("article");
        card.className = "product-card";
        card.setAttribute("aria-labelledby", titleId);
        card.setAttribute("aria-describedby", stockId);

        const top = document.createElement("div");
        top.className = "product-card__top";

        const category = document.createElement("p");
        category.className = "product-card__category";
        category.textContent = product.category;

        const badge = document.createElement("span");
        badge.className = "stock-badge " + stock.className;
        badge.id = stockId;
        badge.textContent = stock.label;

        top.appendChild(category);
        top.appendChild(badge);

        const title = document.createElement("h3");
        title.className = "product-card__name";
        title.id = titleId;
        title.textContent = product.name;

        const description = document.createElement("p");
        description.className = "product-card__description";
        description.textContent = product.description;

        const footer = document.createElement("div");
        footer.className = "product-card__footer";

        const price = document.createElement("p");
        price.className = "product-card__price";
        price.textContent = "KES " + formatKes(product.price);

        const addButton = document.createElement("button");
        addButton.type = "button";
        addButton.className = "add-button";
        addButton.dataset.action = "add";
        addButton.dataset.productId = String(product.id);
        addButton.textContent = addState.label;
        addButton.disabled = addState.disabled;
        addButton.setAttribute("aria-label", addState.ariaLabel);

        footer.appendChild(price);
        footer.appendChild(addButton);

        card.appendChild(top);
        card.appendChild(title);
        card.appendChild(description);
        card.appendChild(footer);

        productGrid.appendChild(card);
    });
}

function updateCatalogueAddButtons() {
    const buttons = productGrid.querySelectorAll('[data-action="add"]');

    buttons.forEach(function (button) {
        const productId = parseStrictProductId(button.dataset.productId);
        const product = productId === null ? undefined : getProductById(productId);

        if (!product) {
            return;
        }

        const addState = getAddButtonState(product);
        button.textContent = addState.label;
        button.disabled = addState.disabled;
        button.setAttribute("aria-label", addState.ariaLabel);
    });
}


// ==========================================
// 10. CART RENDERING
// ==========================================

function renderCart() {
    const didPrune = pruneCart();

    if (didPrune) {
        saveCart();
    }

    cartItemsList.innerHTML = "";

    const quantityTotal = getCartQuantityTotal();
    const total = getCartTotal();

    cartCount.textContent = String(quantityTotal);
    cartBadge.setAttribute(
        "aria-label",
        "Shopping cart, " + itemLabel(quantityTotal)
    );
    cartTotal.textContent = formatKes(total);

    if (cart.length === 0) {
        cartEmpty.hidden = false;
        return;
    }

    cartEmpty.hidden = true;

    cart.forEach(function (item) {
        const product = getProductById(item.id);

        if (!product) {
            return;
        }

        const listItem = document.createElement("li");
        listItem.className = "cart-item";
        listItem.dataset.productId = String(product.id);

        const info = document.createElement("div");
        info.className = "cart-item__info";

        const name = document.createElement("p");
        name.className = "cart-item__name";
        name.textContent = product.name;

        const meta = document.createElement("p");
        meta.className = "cart-item__meta";
        meta.textContent =
            "KES " + formatKes(product.price) + " each · " + product.category;

        info.appendChild(name);
        info.appendChild(meta);

        const controls = document.createElement("div");
        controls.className = "cart-item__controls";

        const quantityControls = document.createElement("div");
        quantityControls.className = "quantity-controls";
        quantityControls.setAttribute("role", "group");
        quantityControls.setAttribute("aria-label", "Quantity for " + product.name);

        const decreaseButton = document.createElement("button");
        decreaseButton.type = "button";
        decreaseButton.className = "quantity-button";
        decreaseButton.dataset.action = "decrease";
        decreaseButton.dataset.productId = String(product.id);
        decreaseButton.textContent = "−";
        decreaseButton.setAttribute(
            "aria-label",
            "Decrease quantity of " + product.name
        );
        decreaseButton.disabled = item.quantity <= 1;

        const quantityValue = document.createElement("span");
        quantityValue.className = "quantity-value";
        quantityValue.textContent = String(item.quantity);

        const increaseButton = document.createElement("button");
        increaseButton.type = "button";
        increaseButton.className = "quantity-button";
        increaseButton.dataset.action = "increase";
        increaseButton.dataset.productId = String(product.id);
        increaseButton.textContent = "+";
        increaseButton.setAttribute(
            "aria-label",
            "Increase quantity of " + product.name
        );
        increaseButton.disabled = item.quantity >= product.stock;

        quantityControls.appendChild(decreaseButton);
        quantityControls.appendChild(quantityValue);
        quantityControls.appendChild(increaseButton);

        const lineTotal = document.createElement("p");
        lineTotal.className = "cart-item__subtotal";
        lineTotal.textContent = "KES " + formatKes(getLineSubtotal(item));

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-button";
        removeButton.dataset.action = "remove";
        removeButton.dataset.productId = String(product.id);
        removeButton.textContent = "Remove";
        removeButton.setAttribute(
            "aria-label",
            "Remove " + product.name + " from cart"
        );

        controls.appendChild(quantityControls);
        controls.appendChild(lineTotal);
        controls.appendChild(removeButton);

        listItem.appendChild(info);
        listItem.appendChild(controls);

        cartItemsList.appendChild(listItem);
    });
}


// ==========================================
// 11. CART ACTIONS
// ==========================================

function syncAfterCartChange(announcement) {
    saveCart();
    renderCart();
    updateCatalogueAddButtons();

    if (announcement) {
        announceCart(announcement);
    }
}

function addToCart(productId) {
    const product = getProductById(productId);

    if (!product) {
        return;
    }

    if (product.stock < 1) {
        showCatalogueFeedback(product.name + " is out of stock.");
        announceCart(product.name + " is out of stock.");
        updateCatalogueAddButtons();
        return;
    }

    const existing = getCartItem(productId);
    const currentQuantity = existing ? existing.quantity : 0;

    if (currentQuantity >= product.stock) {
        showCatalogueFeedback(
            "Cannot add more " + product.name + ". Stock limit reached."
        );
        announceCart(
            "Cannot add more " + product.name + ". Stock limit reached."
        );
        updateCatalogueAddButtons();
        return;
    }

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            quantity: 1
        });
    }

    syncAfterCartChange(
        product.name + " added to cart. " + itemLabel(getCartQuantityTotal()) + " total."
    );
}

function updateQuantity(productId, nextQuantity) {
    const product = getProductById(productId);

    if (!product || product.stock < 1) {
        removeFromCart(productId, product ? product.name + " removed from cart because it is out of stock." : null);
        return;
    }

    if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    if (nextQuantity > product.stock) {
        nextQuantity = product.stock;
        showCatalogueFeedback(
            "Only " + product.stock + " of " + product.name + " available."
        );
    }

    if (nextQuantity < 1) {
        removeFromCart(productId);
        return;
    }

    cart = cart.map(function (item) {
        if (item.id === productId) {
            return {
                id: item.id,
                quantity: nextQuantity
            };
        }
        return item;
    });

    syncAfterCartChange(
        product.name + " quantity updated to " + nextQuantity + ". " +
        itemLabel(getCartQuantityTotal()) + " total."
    );
}

function removeFromCart(productId, customAnnouncement) {
    const product = getProductById(productId);

    cart = cart.filter(function (item) {
        return item.id !== productId;
    });

    const announcement =
        customAnnouncement ||
        (product
            ? product.name + " removed from cart. " + itemLabel(getCartQuantityTotal()) + " total."
            : "Item removed from cart. " + itemLabel(getCartQuantityTotal()) + " total.");

    syncAfterCartChange(announcement);
}


// ==========================================
// 12. EVENT DELEGATION
// ==========================================

productGrid.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");

    if (!button || !productGrid.contains(button)) {
        return;
    }

    const productId = parseStrictProductId(button.dataset.productId);

    if (productId === null) {
        return;
    }

    if (button.dataset.action === "add") {
        addToCart(productId);
    }
});

cartItemsList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-action]");

    if (!button || !cartItemsList.contains(button)) {
        return;
    }

    const productId = parseStrictProductId(button.dataset.productId);
    const item = productId === null ? undefined : getCartItem(productId);

    if (productId === null) {
        return;
    }

    if (button.dataset.action === "increase") {
        updateQuantity(productId, item ? item.quantity + 1 : 1);
        return;
    }

    if (button.dataset.action === "decrease") {
        updateQuantity(productId, item ? item.quantity - 1 : 0);
        return;
    }

    if (button.dataset.action === "remove") {
        removeFromCart(productId);
    }
});

categoryFilters.addEventListener("click", function (event) {
    const button = event.target.closest("[data-category]");

    if (!button || !categoryFilters.contains(button)) {
        return;
    }

    activeCategory = button.dataset.category;
    clearCatalogueFeedback();
    renderCategoryFilters();
    renderCatalogue();
});

productSearch.addEventListener("input", function (event) {
    searchQuery = event.target.value.trim().toLowerCase();
    clearCatalogueFeedback();
    renderCatalogue();
});


// ==========================================
// 13. INITIALISE
// ==========================================

pruneCart();
saveCart();
renderCategoryFilters();
renderCatalogue();
renderCart();
