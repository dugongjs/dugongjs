---
title: "Part 8 -  Testing Transactionality"
sidebar_position: 9
---

![DugongJS + NestJS](/img/dugongjs_nestjs.png)

One of the most critical challenges in distributed systems is ensuring transactionality — making sure that all operations within a logical unit either succeed or fail together. Without proper safeguards, inconsistencies can creep in over time. For example: What happens if a message is successfully published to a message broker, but an error occurs before the database transaction commits?

In that case, the query side could consume the message and update its model, even though the command side has rejected the change. This leads to data drift and breaks the core principle of eventual consistency.

In this section, you’ll test whether your current setup guards against that risk.

### Simulating a Transaction Failure

To verify how the system handles partial failures, let’s simulate an error in the command service.

Modify the `closeAccount()` method in `BankAccountCommandService` to throw an error after applying and committing the domain events:

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

### Testing the Behavior

Now, test this failure scenario manually:

1. Open a new bank account using a POST request.
2. Attempt to close the account — this should throw an error.
3. Query the account to see whether it still exists.

If everything works as expected, the account should **still be present** after the failed close attempt.

:::tip
If you configured the Dugong CLI from [part 5](part_5.md), you can use it to check if domain events were generated or not.
:::

### Why Does this Work?

When using the in-memory message broker, DugongJS shares the transaction context between the command and query sides. Since message consumption happens in the same process, it’s possible to coordinate rollback if the command transaction fails. In this case, the query model is never updated because the message is only consumed if the surrounding transaction completes successfully.

### Challenges With Transactionality in Distributed Messaging

However, this setup only works because everything runs _in-process_. In a production system, you’ll typically use an _inter-process_ message broker like Kafka. This introduces a few important implications:

- Messages are persisted and dispatched asynchronously.
- Once a message has been dispatched, it cannot be easily undone.
- There may be multiple replicas of the same service, and the instance producing the message may not be the same as the one consuming it.
- The command and query side could even be handled in two separate services (e.g. `banking-command-service` and `banking-query-service`), a pattern sometimes used when commands and queries happen with very different frequencies and need to scale independently.

In the next part, we'll replace the in-memory message broker with Kafka and see how these challenges can be overcome.
