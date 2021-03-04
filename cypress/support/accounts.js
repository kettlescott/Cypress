// Utilities for logging in to accounts.

Cypress.Commands.add("UILogin", (username, password) => {
  cy.get('input[name="username"]').type(username);
  cy.get('input[name="password"]').type(password);
  cy.get('input[name="signon"]').click();
});

Cypress.Commands.add("Login", (baseUrl, username, password) => {
  // Sends the login POST request directly, instead of waiting for a page load.
  // Approx 5 seconds faster than manual login.
  cy.request({
    url: `https://${baseUrl}/actions/Account.action`,
    method: "POST",
    form: true,
    body: {
      username: username,
      password: password,
      signon: "Login",
    },
  }).then((response) => {
    // If we can remove this step, it'll be another 5s faster.
    //https://petstore.octoperf.com/actions/Catalog.action
    expect(response).property("status").to.equal(200);
    cy.visit(`https://${baseUrl}/actions/Catalog.action`);
  });
});

Cypress.Commands.add("Signout", (baseUrl) => {
  // Sends the login POST request directly, instead of waiting for a page load.
  // Approx 5 seconds faster than manual login.
  cy.request({
    url: `https://${baseUrl}/actions/Account.action?signoff=`,
    method: "GET",
  }).then((response) => {
    // If we can remove this step, it'll be another 5s faster.
    //https://petstore.octoperf.com/actions/Catalog.action
    expect(response).property("status").to.equal(200);
    cy.visit(`https://${baseUrl}/actions/Catalog.action`);
  });
});
