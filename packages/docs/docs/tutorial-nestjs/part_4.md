---
title: "Part 4 - Testing the Application"
sidebar_position: 5
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

With everything wired up from the previous parts, we can start the application using the following command:

```bash
npm run start:dev
```

Your NestJS app should now be running at http://localhost:3000.

### Testing With curl

We’ll now test the `BankAccountCommandController` endpoints using curl. You can also use tools like Postman or Insomnia if you prefer a graphical interface.

```bash
curl -X POST http://localhost:3000/bank-accounts \
    -H "Content-Type: application/json" \
    -d '{"owner": "Alice", "initialBalance": 500}'
```

If everything was set up correctly, you should get a 201 response with the following body:

```json
{
    "id": "<uuid>",
    "owner": "Alice",
    "balance": 500
}
```

Using the `id` field as input for subsequent commands, try the deposit/withdraw commands:

```bash
curl -X POST http://localhost:3000/bank-accounts/<id>/deposit \
 -H "Content-Type: application/json" \
 -d '{"amount": 200}'

```

This should return a 200 response with the `balance` being 700.

```bash
curl -X POST http://localhost:3000/bank-accounts/<id>/withdraw \
 -H "Content-Type: application/json" \
 -d '{"amount": 300}'

```

This should return a 200 response with the `balance` being 400.

Finally, try closing the account:

```bash
curl -X DELETE http://localhost:3000/bank-accounts/<id>
```

This should return a 204 response with an empty body.

In the next part, you'll learn how to use the Dugong CLI to interact with aggregates and the event log, for an even better debugging and auditing experience.
