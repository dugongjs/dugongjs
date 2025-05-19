---
title: "Part 12 - Testing Transactionality (Debezium)"
sidebar_position: 13
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

In [part 10](part_10.md), we tested transactionality using Kafka directly for both message production and consumption — and uncovered that the system would publish domain events even if the surrounding transaction failed.

Now that we’ve introduced the outbox pattern using Debezium, we can verify that this issue has been resolved.

### Simulating a Transaction Failure

[As in part 10](part_10.md#simulating-a-transaction-failure), simulate a failure by modifying the `closeAccount()` method in `BankAccountCommandService` to throw an error after the domain event has been applied and committed:

```typescript title="src/bank-account/application/command/bank-account.command.service.ts"
class BankAccountCommandService {
    // Rest of class...

    public async closeAccount(accountId: string): Promise<BankAccount> {
        return this.eventSourcingService.transaction(async (transaction) => {
            const accountContext = this.eventSourcingService.createAggregateContext(transaction, BankAccount);

            const account = await accountContext.build(accountId);

            if (!account) {
                throw new Error(`BankAccount with ID ${accountId} not found.`);
            }

            account.closeAccount();

            await accountContext.applyAndCommitStagedDomainEvents(account);

            // highlight-next-line
            throw new Error("An unexpected error occurred while closing the account.");

            return account;
        });
    }
}
```

Restart the application to apply the changes.

### Testing the Behavior

Now, manually simulate the failure:

1. Open a new bank account using a POST request.
2. Attempt to close the account — this should throw an error.

As before, open the Kafka UI and navigate to the topic for the `BankAccount` aggregate, and inspect the messages.

You should **not** see a message containing the `BankAccount` event.

This is the correct and expected behavior. Because the error was thrown within the same transaction, the database update and the outbox insertion were rolled back together — preventing Debezium from emitting any message to Kafka.

This confirms that the outbox pattern has restored transactionality to the system!
