// Regression Tests for jpetstores
const UPDATE_CSS = 'input[name="updateCartQuantities"]';
const SEARCH_CSS = 'input[name="searchProducts"]';
const USERNAME_CSS = 'input[name="username"]';
const PASSWORD_CSS = 'input[name="password"]';
const SEARCH_BOX_CSS = 'input[name="keyword"]';
const COLUMN = 8;

const assertTableRowCount = (css, expectedCount) => {
  cy.get(css).should("have.length", expectedCount);
};

const goTo = (url) => {
  cy.visit(url);
};

const allurls = () => {
  return {
    ViewCategory: `/Catalog.action?viewCategory=&categoryId=`,
    ViewItem: "/Catalog.action?viewItem=&itemId=",
    RemoveItemFromCart: "/Cart.action?removeItemFromCart=&workingItemId",
    NewOrder: "/Order.action?newOrderForm=",
    Confirm: "/Order.action?newOrder=&confirmed=",
  };
};

const items = () => {
  return {
    "Large Angelfish": "EST-1",
    "Small Angelfish": "EST-2",
    "With tail Manx": "EST-15",
    "Adult Male Finch": "EST-19",
  };
};

const addItem = (product_ids) => {
  var domain = Cypress.env("Url");
  var urls = allurls();  
  product_ids.forEach(function (product) {
    goTo(`https://${domain}/actions${urls["ViewItem"]}${product}`);
    cy.get(`a[href*=${product}]`).click();
  });
};

const verifyTotalPrices = () => {
  var price = 0.0;
  cy.get('div[id="Catalog"] td').each(($item, $idx, $lis) => {
    if ($idx % COLUMN == 6) {
      price += parseFloat($item.text().replace("$", ""));
    }
    if ($idx == $lis.length - 1) {
      cy.get('input[name="updateCartQuantities"]')
        .parent()
        .should("contain", "Sub Total: " + "$" + price);
    }
  });
};

const verifyInventory = (items) => {
  for (let i = 0; i < items.length; ++i) {
    cy.get(`a[href *=${items[i]}]`).should("be.visible");
  }
};

const removeItem = (product_ids) => {
  var domain = Cypress.env("Url");
  var urls = allurls();
  product_ids.forEach(function (product) {
    goTo(`https://${domain}/actions${urls["RemoveItemFromCart"]}${product}`);
  });
};

const setQuantityByProductId = (product_id, count) => {
  var textBox = cy.get(`input[name=${product_id}]`);
  textBox.clear();
  textBox.type(count);
};

const updateCart = () => {
  cy.get(UPDATE_CSS).should("be.visible").click();
};

const search = (keyWord) => {
  clearTextBox(SEARCH_BOX_CSS).type(keyWord);
  //searchProducts
  cy.get(SEARCH_CSS).should("be.visible").click();
};

const clearTextBox = (css) => {
  var textBox = cy.get(css);
  textBox.clear();
  return textBox;
};

const checkout = () => {
  var domain = Cypress.env("Url");
  var urls = allurls();
  goTo(`https://${domain}/actions${urls["NewOrder"]}`);
};

const confirmOrder = () => {
  var domain = Cypress.env("Url");
  var urls = allurls();
  goTo(`https://${domain}/actions${urls["Confirm"]}true`);
};

const verifyVisible = (css) => {
  cy.get(css).should("be.visible");
};

describe("login with username and password", () => {
  beforeEach(() => {
    const { account, accountPassword } = Cypress.env("UserInfor");
    const login_url = Cypress.env("Url");
    cy.Login(login_url, account, accountPassword);
  });

  it("success , add items and verify total prices", () => {
    var pets = items();
    addItem([pets["Large Angelfish"],pets["With tail Manx"],pets["Adult Male Finch"]]);    
    removeItem([pets["Adult Male Finch"]]);
    updateCart();
    verifyTotalPrices();
  });

  it("success search items", () => {
    var searchList = ["Large Angelfish", "With tail Manx"];
    var ids = ["FI-SW-01", "FL-DSH-01"];
    for (let i = 0; i < searchList.length; i++) {
      search(searchList[i]);
      cy.get(`a[href*=${ids[i]}]`).should("be.visible");
    }
  });

  it("negative, search items does not exist", () => {
    var searchList = ["fihs", "Ltai"];
    for (let i = 0; i < searchList.length; i++) {
      search(searchList[i]);
      //1 is the default count of columns ,
      assertTableRowCount("table tr td", 1);
    }
  });

  it("success , update items and verify total prices", () => {
    var pets = items();    
    addItem([pets["Large Angelfish"],pets["With tail Manx"],pets["Adult Male Finch"]]);    
    //update Quantity Adult Male Finch to 2
    setQuantityByProductId([pets["Adult Male Finch"]], 2);
    updateCart();
    verifyTotalPrices();
  });

  it("Validating items left in the inventory after a successful purchase", () => {
    var pets = items();    
    addItem([pets["Large Angelfish"],pets["With tail Manx"],pets["Adult Male Finch"]]);    
    updateCart();
    checkout();
    confirmOrder();
    verifyInventory([
      pets["Large Angelfish"],
      pets["With tail Manx"],
      pets["Adult Male Finch"],
    ]);
  });

  it(" Add/update to cart before sign in", () => {
    //signout first
    cy.Signout(Cypress.env("Url"));
    var pets = items();   
    addItem([pets["Large Angelfish"],pets["With tail Manx"],pets["Adult Male Finch"]]);    
    //update Quantity Adult Male Finch to 2
    setQuantityByProductId([pets["Adult Male Finch"]], 2);
    updateCart();
    verifyTotalPrices();
    checkout();
    //after checkout system will ask for username and password
    verifyVisible(USERNAME_CSS);
    verifyVisible(PASSWORD_CSS);
  });

  it("Bug : bounday test expected count larger than stocks", () => {
    let max_range = 2067;
    var pets = items();
    addItem([pets["Large Angelfish"]]);
    setQuantityByProductId([pets["Large Angelfish"]], max_range);
    updateCart();
    //expected fail here, the Quantity is larger than stocks ,
    //the value should not be accepted and an error message should comeup;
    cy.get(".error").should("be.visible");
  });

  it("bounday test Quantity is a negative value, total cost should be zero", () => {
    let negative = -1;
    var pets = items();
    addItem([pets["Large Angelfish"]]);
    setQuantityByProductId([pets["Large Angelfish"]], negative);
    updateCart();
    cy.get('input[name="updateCartQuantities"]')
      .parent()
      .should("contain", "Sub Total: " + "$0.0");
  });

  it("Bug : bounday test Quantity is a decimal value, total cost should be zero", () => {
    let negative = 10.5;
    var pets = items();
    addItem([pets["Large Angelfish"]]);
    setQuantityByProductId([pets["Large Angelfish"]], negative);
    updateCart();
    //the decimal value should not be accepted
    //expected failed here
    cy.get('input[name="updateCartQuantities"]')
      .parent()
      .should("contain", "Sub Total: " + "$0.0");
  });

  it("users are not allowed to login with a locked user", () => {
    //signout first
    cy.Signout(Cypress.env("Url"));
    var pets = items();    
    addItem([pets["Large Angelfish"],pets["With tail Manx"],pets["Adult Male Finch"]]);    
    //update Quantity Adult Male Finch to 2
    setQuantityByProductId([pets["Adult Male Finch"]], 2);
    updateCart();
    verifyTotalPrices();
    checkout();
    //sign in with a locked user
    const { account, accountPassword } = Cypress.env("LockedUserInfor");
    cy.UILogin(account, accountPassword);
    cy.get(".messages > li").should(($p) => {
      expect($p.first()).to.contain("Invalid username or password");
    });
  });

  it("check image load and product tags", () => {
    cy.get('div[id="SidebarContent"]').find("img").should("be.visible");
    //verify pet tags
    var pets = ["FISH", "DOGS", "CATS", "REPTILES", "BIRDS"];
    var tags = [
      "fish_icon",
      "dogs_icon",
      "cats_icon",
      "reptiles_icon",
      "birds_icon",
    ];
    for (let i = 0; i < pets.length; ++i) {
      verifyVisible(`a[href*=${pets[i]}] > img[src *=${tags[i]}]`);
    }
  });
});
