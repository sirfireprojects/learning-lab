// ==========================================
// 1. SHOPPING CART DATA
// ==========================================

let cart = JSON.parse(
    localStorage.getItem("shoppingCart")
) || [
    {
        id: 1,
        name: "Keyboard",
        price: 2500,
        quantity: 1
    },
    {
        id: 2,
        name: "Mouse",
        price: 1200,
        quantity: 2
    },
    {
        id: 3,
        name: "USB Cable",
        price: 500,
        quantity: 3
    }
];


// ==========================================
// 2. SELECT HTML ELEMENTS
// ==========================================

const cartTotal = document.querySelector("#cart-total");
const cartItems = document.querySelector("#cart-items");

const addItemForm = document.querySelector("#add-item-form");
const productName = document.querySelector("#product-name");
const productPrice = document.querySelector("#product-price");
const productQuantity = document.querySelector("#product-quantity");


// ==========================================
// 3. SAVE CART TO LOCAL STORAGE
// ==========================================

function saveCart() {
    localStorage.setItem("shoppingCart", JSON.stringify(cart));
}


// ==========================================
// 4. CALCULATE CART TOTAL
// ==========================================

function calculateCartTotal() {
    let total = 0;

    cart.forEach(function (item) {
        total += item.price * item.quantity;
    });

    return total;
}


// ==========================================
// 5. UPDATE TOTAL DISPLAY
// ==========================================

function updateCartTotal() {
    cartTotal.textContent =
        calculateCartTotal().toLocaleString("en-KE");
}


// ==========================================
// 6. DISPLAY CART ITEMS
// ==========================================

function displayCartItems() {

    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.textContent = "Your shopping cart is empty.";
        return;
    }

    cart.forEach(function (item) {

        const listItem = document.createElement("li");

        const itemDetails = document.createElement("span");

        itemDetails.textContent =
            `${item.name} - KES ${item.price.toLocaleString("en-KE")} × ${item.quantity}`;

        const removeButton = document.createElement("button");

        removeButton.textContent = "Remove";
        removeButton.classList.add("remove-button");

        removeButton.addEventListener("click", function () {
            removeItem(item.id);
        });

        listItem.appendChild(itemDetails);
        listItem.appendChild(removeButton);

        cartItems.appendChild(listItem);

    });

}


// ==========================================
// 7. REMOVE PRODUCT FROM CART
// ==========================================

function removeItem(id) {

    cart = cart.filter(function (item) {
        return item.id !== id;
    });

    saveCart();
    displayCartItems();
    updateCartTotal();

}


// ==========================================
// 8. ADD PRODUCT FORM
// ==========================================

addItemForm.addEventListener("submit", function (event) {

    event.preventDefault();

    // Retrieve input values
    const name = productName.value.trim();
    const price = Number(productPrice.value);
    const quantity = Number(productQuantity.value);

    // Validate product name
    if (name === "") {
        alert("Please enter a product name.");
        return;
    }

    // Validate price
    if (!Number.isFinite(price) || price <= 0) {
        alert("Please enter a valid price greater than zero.");
        return;
    }

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
        alert("Please enter a valid whole-number quantity.");
        return;
    }

    // Create new product
    const newItem = {
        id: Date.now(),
        name: name,
        price: price,
        quantity: quantity
    };

    // Add product to cart
    cart.push(newItem);

    // Save and update interface
    saveCart();
    displayCartItems();
    updateCartTotal();

    // Reset form
    addItemForm.reset();

});


// ==========================================
// 9. INITIAL PAGE DISPLAY
// ==========================================

displayCartItems();
updateCartTotal();
