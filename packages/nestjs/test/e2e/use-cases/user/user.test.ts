import { faker } from "@faker-js/faker";
import supertest from "supertest";
import { app } from "../../setup/setup/app.js";

describe("User", () => {
    it("should be possible to create a user", async () => {
        const email = faker.internet.email();
        const username = faker.internet.userName();

        const response = await supertest(app.getHttpServer()).post("/users").send({
            email,
            username
        });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
            id: expect.any(String),
            username,
            email
        });
    });

    it("should be possible to update the username of a user", async () => {
        const email = faker.internet.email();
        const username = faker.internet.userName();

        const createResponse = await supertest(app.getHttpServer()).post("/users").send({
            email,
            username
        });

        const userId = createResponse.body.id;

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toEqual({
            id: userId,
            username,
            email
        });

        const newUsername = faker.internet.userName();

        const updateResponse = await supertest(app.getHttpServer()).put(`/users/${userId}/update-username`).send({
            username: newUsername
        });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toEqual({
            id: userId,
            username: newUsername,
            email
        });
    });

    it("should be possible to update the email of a user", async () => {
        const email = faker.internet.email();
        const username = faker.internet.userName();

        const createResponse = await supertest(app.getHttpServer()).post("/users").send({
            email,
            username
        });

        const userId = createResponse.body.id;

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toEqual({
            id: userId,
            username,
            email
        });

        const newEmail = faker.internet.email();

        const updateResponse = await supertest(app.getHttpServer()).put(`/users/${userId}/update-email`).send({
            email: newEmail
        });

        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body).toEqual({
            id: userId,
            username,
            email: newEmail
        });
    });

    it("should be possible to delete a user", async () => {
        const email = faker.internet.email();
        const username = faker.internet.userName();

        const createResponse = await supertest(app.getHttpServer()).post("/users").send({
            email,
            username
        });

        const userId = createResponse.body.id;

        expect(createResponse.status).toBe(201);
        expect(createResponse.body).toEqual({
            id: userId,
            username,
            email
        });

        const deleteResponse = await supertest(app.getHttpServer()).delete(`/users/${userId}`);

        expect(deleteResponse.status).toBe(204);

        const getResponse = await supertest(app.getHttpServer()).get(`/users/${userId}`);

        expect(getResponse.status).toBe(404);
    });

    it("should be possible to get a user", async () => {
        const email = faker.internet.email();
        const username = faker.internet.userName();
        const createResponse = await supertest(app.getHttpServer()).post("/users").send({
            email,
            username
        });

        const userId = createResponse.body.id;

        expect(createResponse.status).toBe(201);

        expect(createResponse.body).toEqual({
            id: userId,
            username,
            email
        });

        const getResponse = await supertest(app.getHttpServer()).get(`/users/${userId}`);

        expect(getResponse.status).toBe(200);
        expect(getResponse.body).toEqual({
            id: userId,
            username,
            email
        });
    });

    it("should return 404 when user not found", async () => {
        const userId = faker.string.uuid();

        const response = await supertest(app.getHttpServer()).get(`/users/${userId}`);

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            statusCode: 404,
            message: `User with ID ${userId} not found`,
            error: "Not Found"
        });
    });
});
