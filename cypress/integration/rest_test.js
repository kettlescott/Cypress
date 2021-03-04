//random number lower bound
const MIN = 1 << 30;
//random number upper bound
const MAX = 1 << 60;

const addPet = (pet) => {
  var domain = Cypress.env("Resturl");
  pet = normalizePet(pet);
  cy.request("POST", `https://${domain}`, pet);
  return pet;
};

const normalizePet = (pet) => {
  var id = randomIntFromInterval(MIN, MAX);
  var petName = generateRandomName(10) + id;
  pets[0].id = id;
  pets[0].name = petName;
  return pet;
};

const verifyPetByid = (id, pet) => {
  var domain = Cypress.env("Resturl");
  cy.request("GET", `https://${domain}/${id}`).then((response) => {
    expect(response.body).to.deep.equal(pet);
  });
};

const pets = [
  {
    id: 0,
    category: {
      id: 0,
      name: "string",
    },
    name: "doggie",
    photoUrls: ["string"],
    tags: [
      {
        id: 0,
        name: "string",
      },
    ],
    status: "available",
  },
];

const generateRandomName = (len) => {
  var template = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var name = "";
  for (let i = 0; i < len; i++) {
    var idx = randomIntFromInterval(0, template.length - 1);
    name += template[idx];
  }
  return name;
};

const randomIntFromInterval = (min, max) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

//**************************Happy Tests*************************************************/
describe("Pet API test suite", () => {
  beforeEach(() => {});

  it("POST success, /pet Add a new pet to the store", () => {
    var domain = Cypress.env("Resturl");
    var id = randomIntFromInterval(MIN, MAX);
    var petName = generateRandomName(10) + id;
    pets[0].id = id;
    pets[0].name = petName;
    cy.request("POST", `https://${domain}`, pets[0]).then((response) => {
      expect(response.status).equal(200);
      expect(response.headers["content-type"]).equal("application/json");
      expect(response.body).to.not.be.null;
      expect(response.body.status).equal(pets[0].status);
      expect(response.body.id).equal(pets[0].id);
      expect(response.body.name).equal(pets[0].name);
    });
  });

  it("GET success, /pet/{petId} Find pet by ID", () => {
    var domain = Cypress.env("Resturl");
    var pet = addPet(pets[0]);
    cy.request("GET", `https://${domain}/${pet.id}`).then((response) => {
      expect(response.status).equal(200);
      expect(response.headers["content-type"]).equal("application/json");
      expect(response.body).to.not.be.null;
      expect(response.body.status).equal(pet.status);
      expect(response.body.id).equal(pet.id);
      expect(response.body.name).equal(pet.name);
    });
  });

  it("DELETE success, /pet/{petId} Deletes a pet", () => {
    var domain = Cypress.env("Resturl");
    var pet = addPet(pets[0]);
    cy.request("DELETE", `https://${domain}/${pet.id}`).then((response) => {
      expect(response.status).equal(200);
      expect(response.headers["content-type"]).equal("application/json");
      expect(response.body).to.not.be.null;
      expect(response.body.message).equal(pet.id.toString());
    });
  });

  it("PUT success, /pet Update an existing pet", () => {
    var domain = Cypress.env("Resturl");
    var pet = addPet(pets[0]);
    var id = pet.id;
    //update pet name to a different name
    pet.name = generateRandomName(10);
    cy.request("PUT", `https://${domain}`, pet).then((response) => {
      expect(response.status).equal(200);
      expect(response.headers["content-type"]).equal("application/json");
      expect(response.body).to.not.be.null;
      expect(response.body.id).equal(id);
      expect(response.body.name).equal(pet.name);
    });
    verifyPetByid(id, pet);
  });

  /*************************Negative Tests************************************************** */
  it("Bug POST invalid input", () => {
    var domain = Cypress.env("Resturl");
    cy.request({
      method: "POST",
      url: `https://${domain}`,
      body: { invalid: "invalid" },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).equal(400);
    });
  });

  it("GET Pet not found", () => {
    var domain = Cypress.env("Resturl");
    var id = -1;
    cy.request({
      method: "GET",
      url: `https://${domain}/${id}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).equal(404);
      expect(response.headers["content-type"]).equal("application/json");
      expect(response.body.message).equal("Pet not found");
    });
  });

  it("GET Pet not found string as input pet id", () => {
    var domain = Cypress.env("Resturl");
    var id = "test";
    cy.request({
      method: "GET",
      url: `https://${domain}/${id}`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).equal(404);
      expect(response.headers["content-type"]).equal("application/json");
    });
  });

  it("Delete Pet not found", () => {
    var domain = Cypress.env("Resturl");
    var id = -1;
    cy.request({
      method: "DELETE",
      url: `https://${domain}/${id}`,
      failOnStatusCode: false,
    }).then((response) => {
      //Pet not found
      expect(response.status).equal(404);
    });
  });

  it("Bug : Delete Pet Invalid ID supplied string as input id", () => {
    var domain = Cypress.env("Resturl");
    var id = "test";
    cy.request({
      method: "DELETE",
      url: `https://${domain}/${id}`,
      failOnStatusCode: false,
    }).then((response) => {
      //Invalid ID supplied
      expect(response.status).equal(400);
    });
  });

  it("Bug Put Pet not found", () => {
    var domain = Cypress.env("Resturl");
    var pet = addPet(pets[0]);
    //set an invalid pet id
    pet.id = -1;
    cy.request({
      method: "PUT",
      url: `https://${domain}`,
      body: pet,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).equal(404);
    });
  });
});
