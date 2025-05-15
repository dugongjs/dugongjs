import { faker } from "@faker-js/faker";
import supertest from "supertest";
import { app } from "../../setup/setup/app.js";

describe("User query", () => {
    it("should generate a query model when a user is created", async () => {
        const email = faker.internet.email();
        const username = faker.internet.userName();

        await supertest(app.getHttpServer()).post("/users").send({
            email,
            username
        });

        const response = await supertest(app.getHttpServer()).get("/users");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([
            {
                id: expect.any(String),
                username,
                email
            }
        ]);
    });
});
